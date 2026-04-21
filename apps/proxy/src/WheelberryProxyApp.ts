import { EventEmitter } from 'events';

import { Logger } from 'pino';

import { WheelberryProxyServer } from './WheelberryProxyServer';
import { WheelberryProxyConnection } from './WheelberryProxyConnection';
import { User, Device } from './db/index.js';

export interface WheelberryProxyAppUser {
  connection?: WheelberryProxyConnection;
  cfg?: any;
}

export class WheelberryProxyApp {
  private uid2InfoMap: Map<string, WheelberryProxyAppUser>;

  constructor(private log: Logger, private server: WheelberryProxyServer, readonly name: string) {
    this.uid2InfoMap = new Map<string, WheelberryProxyAppUser>();
  }

  async checkUserExists(user: string): Promise<boolean> {
    const userDoc = await User.findOne({ email: user.toLowerCase() });
    if (!userDoc) return false;
    const device = await Device.findOne({ app: this.name, owner: userDoc._id });
    return device !== null;
  }

  async checkUserConnected(user: string): Promise<boolean> {
    const uid = await this.getUid(user);
    return uid !== undefined ? this.checkUidConnected(uid) : false;
  }

  checkUidConnected(uid: string): boolean {
    return this.uid2InfoMap.has(uid) && this.uid2InfoMap.get(uid)?.connection !== undefined;
  }

  markUidConnected(
    uid: string,
    conn: WheelberryProxyConnection,
    cfg?: any
  ): void {
    this.log.info(`markUidConnected: Setting ${uid}`);
    this.uid2InfoMap.set(uid, { connection: conn, cfg });
  }

  async getUid(user: string): Promise<string | undefined> {
    const userDoc = await User.findOne({ email: user.toLowerCase() });
    if (!userDoc) return undefined;
    const device = await Device.findOne({ app: this.name, owner: userDoc._id });
    return device?.uid;
  }

  markUidDisconnected(uid: string): void {
    this.log.info(`markUidDisconnected: Clearing ${uid}`);
    const info = this.uid2InfoMap.get(uid);
    if (info) {
      info.connection = undefined;
    }
  }

  getUidConnection(uid: string): WheelberryProxyConnection | undefined {
    this.log.info(`uid: ${uid}`);
    const info = this.uid2InfoMap.get(uid);
    return info?.connection;
  }

  getConnectedUids(): string[] {
    const uids: string[] = [];
    for (const [uid, info] of this.uid2InfoMap) {
      if (info.connection) uids.push(uid);
    }
    return uids;
  }
}
