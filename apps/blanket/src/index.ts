import 'dotenv/config';

import { WheelberryBlanket } from './WheelberryBlanket';
import { WheelberryProxy } from '@wheelberry/proxy-client';

import { default as pino } from 'pino';
const log = pino({
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL || 'info',
});

log.info('node-wheelberry-blanket Started');

const token = process.env.WHEELBERRY_TOKEN;
if (!token) {
  log.error('WHEELBERRY_TOKEN env var is required');
  process.exit(1);
}

const blanket = new WheelberryBlanket(log);

const proxy = new WheelberryProxy(
  log,
  {
    token,
    failFastOnAuthError: true,
  },
  blanket
);

proxy.connect();
