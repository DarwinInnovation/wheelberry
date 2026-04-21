import { Router } from 'express';
import type { WheelberryProxyServer } from '../WheelberryProxyServer.js';
import { Device, type IUser } from '../db/index.js';

export function devicesRouter(server: WheelberryProxyServer): Router {
  const router = Router();

  // GET /api/devices — list current user's devices with connection status
  router.get('/', async (req, res) => {
    const user = req.user as IUser;
    const appFilter = typeof req.query.app === 'string' ? req.query.app : undefined;

    const query: Record<string, unknown> = { owner: user._id };
    if (appFilter) query.app = appFilter;

    const devices = await Device.find(query).lean();

    const result = devices.map((d) => {
      const app = server.getApp(d.app);
      return {
        uid: d.uid,
        app: d.app,
        name: d.name,
        config: d.config,
        connected: app ? app.checkUidConnected(d.uid) : false,
      };
    });

    res.json(result);
  });

  // GET /api/devices/:uid — single device detail
  router.get('/:uid', async (req, res) => {
    const user = req.user as IUser;
    const device = await Device.findOne({ uid: req.params.uid, owner: user._id }).lean();

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const app = server.getApp(device.app);
    res.json({
      uid: device.uid,
      app: device.app,
      name: device.name,
      config: device.config,
      connected: app ? app.checkUidConnected(device.uid) : false,
    });
  });

  // POST /api/devices/:uid/command — send command to device
  router.post('/:uid/command', async (req, res) => {
    const user = req.user as IUser;
    const device = await Device.findOne({ uid: req.params.uid, owner: user._id });

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const { command, args = [] } = req.body;
    if (!command || typeof command !== 'string') {
      res.status(400).json({ error: 'command is required' });
      return;
    }

    const app = server.getApp(device.app);
    if (!app) {
      res.status(503).json({ error: 'App not registered' });
      return;
    }

    const conn = app.getUidConnection(device.uid);
    if (!conn) {
      res.status(503).json({ error: 'Device not connected' });
      return;
    }

    try {
      const result = await conn.sendCommand(command, Array.isArray(args) ? args : []);
      res.json({ result });
    } catch (err) {
      res.status(500).json({ error: 'Command failed' });
    }
  });

  return router;
}
