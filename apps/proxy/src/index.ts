import * as dotenv from 'dotenv';
dotenv.config();

import { default as pino } from 'pino';
const log = pino({
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL || 'info',
});

import { default as express } from 'express';
import * as http from 'http';
import * as path from 'path';
import { URL } from 'url';
import { readFileSync } from 'fs';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import helmet from 'helmet';

import { connectDB } from './db/index.js';
import { configurePassport, authRouter, requireAuth } from './auth/index.js';
import { WheelberryProxyServer } from './WheelberryProxyServer';
import { AlexaSkill } from './AlexaSkill';
import { createApiRouter } from './api/index.js';

const root: string = path.normalize(__dirname + '/..');
const port: number = parseInt(process.env.PORT || '9887', 10);
const baseURL: URL = new URL('http://localhost:' + port + '/');

const version = require('../package.json').version;

async function main() {
  // Connect to MongoDB
  await connectDB(log);

  const app: express.Application = express();
  const httpServer: http.Server = http.createServer(app);

  app.set('appPath', root + '/dist');
  app.set('view engine', 'pug');

  // Security headers
  app.use(helmet({ contentSecurityPolicy: false }));

  // Body parsing
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Sessions stored in MongoDB
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    log.error('SESSION_SECRET env var is required');
    process.exit(1);
  }

  const sessionMiddleware = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/wheelberry',
      collectionName: 'sessions',
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
    },
  });
  app.use(sessionMiddleware);

  // Passport authentication
  configurePassport(log);
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes (login, OAuth callbacks, logout) — unauthenticated
  app.use('/auth', authRouter);

  // Alexa endpoint is exempt from web auth (has its own Amazon token validation)
  // Must be registered before the requireAuth middleware for static files
  const server = new WheelberryProxyServer(log, {}, httpServer);
  server.setupPortalNamespace(sessionMiddleware);

  const alexaSkillBlanket = new AlexaSkill(
    log,
    'blanket',
    JSON.parse(readFileSync(`${root}/cfg/skills/blanket.json`, 'latin1'))
  );

  // Register Alexa POST endpoint (unauthenticated — Amazon validates)
  alexaSkillBlanket.expressAlexa(app);
  alexaSkillBlanket.wheelberry(server);

  alexaSkillBlanket.expressWeb(app, requireAuth);

  // JSON REST API (protected — returns 401 instead of redirect)
  app.use('/api', createApiRouter(server));

  // Portal SPA (protected — serve built React app)
  app.use('/portal', requireAuth, express.static(`${root}/portal/dist`));
  app.get('/portal/*', requireAuth, (_req, res) => {
    res.sendFile(path.join(root, 'portal', 'dist', 'index.html'));
  });

  // Protected routes: static files and skill web UI require login
  app.use(express.static(`${root}/public`), requireAuth);

  // Start HTTP server
  httpServer.listen(port, () => {
    log.info(`Server (${version}) started successfully on ${baseURL.toString()}`);
  });

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      log.error('Address in use, retrying...');
      setTimeout(() => {
        httpServer.close();
        httpServer.listen(port);
      }, 1000);
    } else {
      log.error(`Unrecoverable error starting server: ${err.code}`);
    }
  });
}

main().catch((err) => {
  log.error(err, 'Failed to start server');
  process.exit(1);
});
