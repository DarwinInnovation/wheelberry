import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import { Logger } from 'pino';
import { WheelberryProxyImpl } from './types';

export interface WheelberryProxyCfg {
  url?: string;
  token: string;
  reconnectOnServerDisconnect?: boolean;
  reconnectDelayMs?: number;
  failFastOnAuthError?: boolean;
  authRejectGraceMs?: number;
}

interface Api {
  [key: string]: Function;
}

export class WheelberryProxy extends EventEmitter {
  private socket: Socket | null;
  private cfg: WheelberryProxyCfg;
  private implApi: Api;

  static Defaults: Partial<WheelberryProxyCfg> = {
    reconnectOnServerDisconnect: true,
    reconnectDelayMs: 5000,
    failFastOnAuthError: false,
    authRejectGraceMs: 10000,
  };

  constructor(private log: Logger, cfg: WheelberryProxyCfg, private impl: WheelberryProxyImpl) {
    super();

    this.socket = null;

    this.cfg = _.defaults({}, cfg, WheelberryProxy.Defaults);

    this.implApi = (this.impl as unknown) as Api;
  }

  public connect() {
    let connectedAt: number | null = null;
    let receivedConfig = false;
    const url = this.cfg.url || process.env.WHEELBERRY_PROXY_URL;

    if (!url) {
      throw new Error('WheelberryProxy URL is required. Set cfg.url or WHEELBERRY_PROXY_URL env var.');
    }

    const skt = io(url, {
      path: '/proxy',
      auth: {
        token: this.cfg.token,
      },
    });

    skt.on('connect', () => {
      connectedAt = Date.now();
      receivedConfig = false;
      this.log.info('connected');
    });

    skt.on('connect_error', (error: any) => {
      this.log.error(error, `Connection error`);

      const msg = (error?.message || '').toLowerCase();
      if (this.cfg.failFastOnAuthError && (msg.includes('unauthorized') || msg.includes('invalid'))) {
        this.log.error('Auth failure detected. Exiting process with code 2.');
        process.exit(2);
      }
    });

    skt.on('disconnect', (reason: Socket.DisconnectReason) => {
      this.log.warn({ reason }, 'Disconnected from proxy');

      const connectedForMs = connectedAt !== null ? Date.now() - connectedAt : null;
      const quickServerDisconnect =
        reason === 'io server disconnect' &&
        connectedForMs !== null &&
        connectedForMs <= (this.cfg.authRejectGraceMs as number) &&
        !receivedConfig;

      if (quickServerDisconnect) {
        this.log.error('Disconnected by server before config was received. Token may be invalid or revoked.');
        if (this.cfg.failFastOnAuthError) {
          this.log.error('Exiting process with code 2 due to auth rejection.');
          process.exit(2);
          return;
        }
      }

      if (reason === 'io server disconnect' && this.cfg.reconnectOnServerDisconnect) {
        const delay = this.cfg.reconnectDelayMs as number;
        this.log.info(`Attempting reconnect in ${delay}ms`);
        setTimeout(() => {
          skt.connect();
        }, delay);
      }
    });

    skt.on('cmd', (cmd: string, args: [], cb: (success: boolean, reply: any) => void) => {
      this.log.info('Received command: ' + cmd);
      if (this.implApi[cmd]) {
        const method = this.implApi[cmd];
        try {
          const result = method.apply(this.impl, args);
          if (result instanceof Promise) {
            result
              .then((data) => {
                cb(true, data);
              })
              .catch((reason: any) => {
                cb(false, 'failed');
              });
          } else {
            cb(true, result);
          }
        } catch (err) {
          cb(false, 'went wrong');
        } finally {
        }
      } else {
        cb(false, 'unknown command');
      }
    });

    skt.on(this.impl.getName(), (cmd: string, args: any[]) => {});

    skt.on('config', (cfg: any) => {
      receivedConfig = true;
      this.log.info(cfg, 'Received config');
      this.impl.updateConfig(cfg);
    });

    this.socket = skt;
  }
}
