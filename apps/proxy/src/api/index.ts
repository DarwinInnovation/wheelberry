import { Router } from 'express';
import type { IUser } from '../db/index.js';
import { meRouter } from './me.js';
import { systemRouter } from './system.js';
import { devicesRouter } from './devices.js';
import { appsRouter } from './apps.js';
import type { WheelberryProxyServer } from '../WheelberryProxyServer.js';

export function requireAuthJson(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

export function createApiRouter(server: WheelberryProxyServer): Router {
  const router = Router();

  router.use(requireAuthJson);
  router.use('/me', meRouter);
  router.use('/system', systemRouter(server));
  router.use('/devices', devicesRouter(server));
  router.use('/apps', appsRouter(server));

  return router;
}
