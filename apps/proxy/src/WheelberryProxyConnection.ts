import * as io from 'socket.io';
import { EventEmitter } from 'events';

import { Logger } from 'pino';

import { WheelberryProxyServer } from './WheelberryProxyServer';

import { inspect } from 'util';

export class WheelberryProxyConnection extends EventEmitter {
  private static readonly COMMAND_TIMEOUT_MS = 10000;

  constructor(
    private log: Logger,
    server: WheelberryProxyServer,
    private socket: io.Socket,
    readonly uid: string
  ) {
    super();

    this.socket.on('disconnect', this.onDisconnect.bind(this));
  }

  toString(): string {
    return `WheelberryProxyConnection[${this.uid}]`;
  }

  close() {
    this.log.info(`WPC closed`);
    this.socket.disconnect(true);
  }

  sendConfig(cfg: any) {
    cfg = cfg === undefined ? {} : cfg;
    this.log.info(`WPC[${this.uid}] sending config ${inspect(cfg, { breakLength: Infinity })}`);
    this.socket.emit('config', cfg);
  }

  sendCommand(cmd: string, args: any[]): Promise<any> {
    this.log.info({ uid: this.uid, socketId: this.socket.id, cmd, argCount: args.length }, `WPC[${this.uid}] sending command '${cmd}'`);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.log.error(`WPC[${this.uid}] command '${cmd}' timed out after ${WheelberryProxyConnection.COMMAND_TIMEOUT_MS}ms`);
        reject(new Error(`Command '${cmd}' timed out`));
      }, WheelberryProxyConnection.COMMAND_TIMEOUT_MS);

      this.socket.emit('cmd', cmd, args, (success: boolean, data: any) => {
        clearTimeout(timeout);
        if (success) {
          this.log.info({ uid: this.uid, socketId: this.socket.id, cmd }, `WPC[${this.uid}] command '${cmd}' succeeded`);
          resolve(data);
          return;
        }

        this.log.warn({ uid: this.uid, socketId: this.socket.id, cmd, data }, `WPC[${this.uid}] command '${cmd}' failed`);
        reject(data instanceof Error ? data : new Error(data ? String(data) : 'Command failed'));
      });
    });
  }

  private onDisconnect(reason: string) {
    this.log.info({ uid: this.uid, socketId: this.socket.id, reason }, `WPC[${this.uid}] disconnected`);
    this.emit('disconnect', reason);
  }
}
