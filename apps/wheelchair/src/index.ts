import 'dotenv/config';

import { WheelberryWheelchair } from './WheelberryWheelchair.js';
import { WheelberryProxy } from '@wheelberry/proxy-client';

import { default as pino } from 'pino';
const log = pino({
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL || 'info',
});

log.info('node-wheelberry-wheelchair Started');

const token = process.env.WHEELBERRY_TOKEN;
if (!token) {
  log.error('WHEELBERRY_TOKEN env var is required');
  process.exit(1);
}

const wheelchair = new WheelberryWheelchair(log);

const proxy = new WheelberryProxy(
  log,
  {
    token,
    failFastOnAuthError: true,
  },
  wheelchair
);

proxy.connect();
