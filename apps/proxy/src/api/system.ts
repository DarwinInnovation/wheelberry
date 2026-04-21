import { Router } from 'express';
import type { WheelberryProxyServer } from '../WheelberryProxyServer.js';

export function systemRouter(server: WheelberryProxyServer): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    let connectedDevices = 0;
    const appNames: string[] = [];

    for (const [name, app] of server.getApps()) {
      appNames.push(name);
      connectedDevices += app.getConnectedUids().length;
    }

    res.json({
      uptime: process.uptime(),
      connectedDevices,
      apps: appNames,
    });
  });

  return router;
}
