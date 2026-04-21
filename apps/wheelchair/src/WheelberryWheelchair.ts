import { Logger } from 'pino';
import { WheelberryWheelchairConfig, WheelberryWheelchairStatus } from './interface.js';
import { WheelberryProxyImpl } from '@wheelberry/proxy-client';

export class WheelberryWheelchair implements WheelberryProxyImpl {
  private status: WheelberryWheelchairStatus;
  private config: WheelberryWheelchairConfig | null;

  constructor(private log: Logger) {
    this.status = {
      powerOn: false,
      lastCommand: '',
    };
    this.config = null;
  }

  public getName() {
    return 'wheelchair';
  }

  public getStatus() {
    return this.status;
  }

  public updateConfig(cfg: WheelberryWheelchairConfig) {
    this.config = cfg;
    this.log.info(cfg, 'Wheelchair config updated');
  }

  /** Toggle wheelchair power */
  public async on_off(): Promise<WheelberryWheelchairStatus> {
    this.log.info('on_off');
    this.status.powerOn = !this.status.powerOn;
    this.status.lastCommand = 'on_off';
    await this.sendCommand('on_off');
    return this.status;
  }

  public async Lift(direction: string, seconds: string): Promise<WheelberryWheelchairStatus> {
    return this.moveSeat('lift', direction, seconds);
  }

  public async Tilt(direction: string, seconds: string): Promise<WheelberryWheelchairStatus> {
    return this.moveSeat('tilt', direction, seconds);
  }

  public async Recline(direction: string, seconds: string): Promise<WheelberryWheelchairStatus> {
    return this.moveSeat('recline', direction, seconds);
  }

  public async LegTilt(direction: string, seconds: string): Promise<WheelberryWheelchairStatus> {
    return this.moveSeat('leg_tilt', direction, seconds);
  }

  public async LegLength(direction: string, seconds: string): Promise<WheelberryWheelchairStatus> {
    return this.moveSeat('leg_length', direction, seconds);
  }

  private async moveSeat(
    functionName: string,
    direction: string,
    seconds: string
  ): Promise<WheelberryWheelchairStatus> {
    const normalizedDirection = (direction || '').toLowerCase().trim();
    const validDirections = new Set(['up', 'down', 'forward', 'back']);

    if (!validDirections.has(normalizedDirection)) {
      this.log.warn({ functionName, direction }, 'Unknown direction');
      this.status.lastCommand = `${functionName} invalid direction: ${direction}`;
      return this.status;
    }

    const parsedSeconds = parseInt(seconds, 10);
    const durationSeconds = Number.isFinite(parsedSeconds) && parsedSeconds > 0 ? parsedSeconds : 1;

    this.log.info({ functionName, direction: normalizedDirection, durationSeconds }, 'Seat function move');
    this.status.lastCommand = `${functionName} ${normalizedDirection} ${durationSeconds}s`;
    await this.sendCommand(`${functionName}:${normalizedDirection}:${durationSeconds}`);
    return this.status;
  }

  // ------------------------------------------------------------------
  // Hardware interface
  // ------------------------------------------------------------------

  private async sendCommand(cmd: string): Promise<void> {
    if (!this.config) {
      this.log.warn('No config — command dropped: %s', cmd);
      return;
    }

    // TODO: implement actual hardware communication with the wheelchair controller.
    // Options include HTTP relay, serial port, GPIO, etc.
    // For now, log the command that would be sent.
    this.log.info({ host: this.config.controllerHost, cmd }, 'sendCommand (stub)');
  }

}
