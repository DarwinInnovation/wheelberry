import * as io from 'socket.io';
import { EventEmitter } from 'events';

import { Server } from 'socket.io';
import { createHash } from 'crypto';

import { Logger } from 'pino';
import * as _ from 'lodash';
import * as http from 'http';
import { WheelberryProxyConnection } from './WheelberryProxyConnection';
import { WheelberryProxyApp } from './WheelberryProxyApp';

import { DeviceToken, Device } from './db/index.js';
import path from 'path';

export interface WheelberryProxyCfg {
  url: string;
  path: string;
  cfgDir: string;
}

export interface WheelberryProxyMsg {
  type: string;
  body: any;
  hash: string;
}

export class WheelberryProxyServer extends EventEmitter {
  private listener: io.Server;
  private portalNamespace: io.Namespace | null = null;
  private cfg: WheelberryProxyCfg;

  private nameAppMap: Map<string, WheelberryProxyApp>;

  static Defaults: WheelberryProxyCfg = {
    url: 'https://wheelberry.darwin-innovation.com/',
    path: '/proxy',
    cfgDir: path.join(__dirname, '../cfg'),
  };

  constructor(
    private log: Logger,
    cfg: Partial<WheelberryProxyCfg>,
    private httpServer: http.Server
  ) {
    super();

    this.cfg = _.defaults({}, cfg, WheelberryProxyServer.Defaults);

    this.nameAppMap = new Map<string, WheelberryProxyApp>();

    this.listener = this.listen();
  }

  getApp(name: string): WheelberryProxyApp | undefined {
    return this.nameAppMap.get(name);
  }

  getApps(): Map<string, WheelberryProxyApp> {
    return this.nameAppMap;
  }

  createApp(name: string): WheelberryProxyApp {
    const app = new WheelberryProxyApp(this.log, this, name);
    this.nameAppMap.set(name, app);
    return app;
  }

  public getCfgDir(): string {
    return this.cfg.cfgDir;
  }

  /** Set up the /portal Socket.IO namespace for the web portal */
  public setupPortalNamespace(sessionMiddleware: import('express').RequestHandler) {
    const portalNs = this.listener.of('/portal');
    this.portalNamespace = portalNs;

    // Share Express session with Socket.IO
    portalNs.use((socket, next) => {
      sessionMiddleware(socket.request as any, {} as any, next as any);
    });

    portalNs.use((socket, next) => {
      const req = socket.request as any;
      if (req.session?.passport?.user) {
        next();
      } else {
        next(new Error('Unauthorized'));
      }
    });

    portalNs.on('connect', (socket) => {
      this.log.info('Portal client connected');

      // Send current device statuses on connect
      const statuses: { uid: string; app: string; connected: boolean }[] = [];
      for (const [appName, app] of this.nameAppMap) {
        for (const uid of app.getConnectedUids()) {
          statuses.push({ uid, app: appName, connected: true });
        }
      }
      socket.emit('device:status:all', statuses);
    });
  }

  private emitDeviceStatus(app: string, uid: string, connected: boolean) {
    if (this.portalNamespace) {
      this.portalNamespace.emit('device:status', { uid, app, connected });
    }
  }

  private listen() {
    const io: Server = new Server(this.httpServer, { path: this.cfg.path });
    this.log.info('listening');
    io.on('connect', async (skt: io.Socket) => {
      let identifiedDevice = 'unknown';

      this.log.info(
        {
          socketId: skt.id,
          address: skt.handshake.address,
          userAgent: skt.handshake.headers['user-agent'],
          hasToken: typeof skt.handshake.auth?.token === 'string',
          tokenLength: typeof skt.handshake.auth?.token === 'string' ? skt.handshake.auth.token.length : 0,
        },
        'New proxy client connection'
      );

      skt.on('disconnect', (reason) => {
        this.log.info({ socketId: skt.id, reason, identifiedDevice }, 'Proxy client disconnected');
      });

      skt.on('error', (err) => {
        this.log.warn({ socketId: skt.id, err }, 'Socket error');
      });

      // Token-based authentication
      const rawToken = skt.handshake.auth?.token;
      if (!rawToken || typeof rawToken !== 'string') {
        this.log.warn(
          {
            socketId: skt.id,
            authKeys: Object.keys(skt.handshake.auth || {}),
          },
          'Connection rejected: no auth token'
        );
        skt.disconnect(true);
        return;
      }

      try {
        // Hash the raw token and look up in DB
        const tokenHash = createHash('sha256').update(rawToken).digest('hex');
        const tokenHashPrefix = tokenHash.slice(0, 12);
        const lookupStarted = Date.now();

        this.log.debug(
          { socketId: skt.id, tokenHashPrefix },
          'Looking up device token'
        );

        const tokenDoc = await DeviceToken.findOne({ tokenHash, revoked: false }).populate<{ device: InstanceType<typeof Device> | null }>('device');
        const lookupMs = Date.now() - lookupStarted;

        this.log.debug(
          {
            socketId: skt.id,
            tokenHashPrefix,
            lookupMs,
            tokenFound: !!tokenDoc,
            hasDevice: !!tokenDoc?.device,
          },
          'Device token lookup complete'
        );

        if (!tokenDoc || !tokenDoc.device) {
          this.log.warn(
            {
              socketId: skt.id,
              tokenHashPrefix,
              tokenFound: !!tokenDoc,
              hasDevice: !!tokenDoc?.device,
            },
            'Connection rejected: invalid or revoked token'
          );
          skt.disconnect(true);
          return;
        }

        const device = tokenDoc.device as InstanceType<typeof Device>;
        identifiedDevice = `${device.app}/${device.uid}`;

        // Update last used timestamp
        tokenDoc.lastUsed = new Date();
        await tokenDoc.save();

        this.log.info(
          {
            socketId: skt.id,
            device: identifiedDevice,
            tokenId: String(tokenDoc._id),
            tokenHashPrefix,
          },
          'Authenticated device'
        );

        const conn = new WheelberryProxyConnection(this.log, this, skt, device.uid);

        let app = this.getApp(device.app);
        if (!app) {
          app = this.createApp(device.app);
        }

        app.markUidConnected(device.uid, conn, device.config);
        conn.sendConfig(device.config);

        // Notify portal clients of device status change
        this.emitDeviceStatus(device.app, device.uid, true);

        conn.on('disconnect', (reason) => {
          this.log.info({ socketId: skt.id, device: identifiedDevice, reason }, 'Device connection disconnected');
          app!.markUidDisconnected(device.uid);
          this.emitDeviceStatus(device.app, device.uid, false);
        });
      } catch (err) {
        this.log.error({ socketId: skt.id, err }, 'Error during token validation');
        skt.disconnect(true);
      }
    });

    return io;
  }
}
