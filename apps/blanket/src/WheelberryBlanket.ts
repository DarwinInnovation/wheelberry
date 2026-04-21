import { Logger } from 'pino';
import { WheelberryBlanketConfig, WheelberryBlanketStatus } from './interface';
import { WheelberryProxyImpl } from '@wheelberry/proxy-client';
import { DateTime, Duration, Interval } from 'luxon';
import { Client, Plug } from 'tplink-smarthome-api';

export class WheelberryBlanket implements WheelberryProxyImpl {
  private status: WheelberryBlanketStatus;
  private config: WheelberryBlanketConfig | null;
  private intervals: Interval[] = [];
  private renewAt: DateTime;
  private pollTimer: NodeJS.Timeout | null;
  private tpClient: Client;
  private tpPlug: Plug | null;

  constructor(private log: Logger) {
    this.status = {
      isOn: false,
      nextSwitch: '',
    };
    this.config = null;
    this.renewAt = DateTime.invalid('not initialised');
    this.pollTimer = null;
    this.tpClient = new Client();
    this.tpPlug = null;
  }

  public getName() {
    return 'blanket';
  }

  public getStatus() {
    return this.status;
  }

  public updateConfig(cfg: any) {
    this.config = cfg;
    this.log.info(cfg);

    this.calcIntervals();

    this.tpPlug = null;
    this.poll();
  }

  private findPlug() {
    if (this.config) {
      this.tpClient
        .getDevice({ host: this.config.switchIP })
        .then((device: any) => {
          this.log.info(`Found plug at ${this.config!.switchIP}`);
          this.tpPlug = device;
          this.poll();
        })
        .catch((err) => {
          this.log.info(`No plug found. Timeout in 60s`);
          this.pollTimer = setTimeout(() => {
            this.poll();
          }, 60000);
        });
    }
  }

  public async Boost(): Promise<WheelberryBlanketStatus> {
    this.log.info('boost');
    this.calcExtend(Duration.fromObject({ minutes: 20 }));
    return this.status;
  }

  public async Extend(duration: string): Promise<WheelberryBlanketStatus> {
    this.log.info('extend');
    const d = Duration.fromISO(duration);
    this.calcExtend(d);
    return this.status;
  }

  public async Off(): Promise<WheelberryBlanketStatus> {
    this.log.info('off');
    this.calcOff();
    return this.status;
  }

  private poll() {
    const now = DateTime.local();

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    if (!this.tpPlug) {
      this.findPlug();
      return;
    }

    if (now >= this.renewAt) {
      this.calcIntervals();
    } else {
      this.intervals = this.intervals.filter((i) => {
        return !(i.isBefore(now) || i.isEmpty() || !i.isValid);
      });
    }

    const isOn = this.intervals.some((i) => {
      return i.contains(now);
    });

    this.log.info(`SWITCH: ${isOn ? 'On' : 'Off'}`);
    this.tpPlug
      .setPowerState(isOn)
      .then(() => {
        let nextSwitch = this.renewAt.diff(now);
        if (this.intervals.length) {
          nextSwitch = this.intervals[0].start!.diff(now);
          if (isOn) {
            nextSwitch = this.intervals[0].end!.diff(now);
          }
        }

        this.log.info(`Timeout in ${nextSwitch}`);
        this.pollTimer = setTimeout(() => {
          this.poll();
        }, nextSwitch.as('milliseconds'));
      })
      .catch(() => {
        this.tpPlug = null;

        this.log.info(`Timeout in 60s (no plug)`);
        this.pollTimer = setTimeout(() => {
          this.poll();
        }, 60000);
      });
  }

  private calcExtend(duration: Duration) {
    const now = DateTime.local();
    const interval = Interval.after(now, duration);

    this.intervals.push(interval);
    this.mergeAndSortIntervals();

    this.poll();
  }

  private calcOff() {
    const now = DateTime.local();

    this.intervals = this.intervals.map((interval) => {
      if (interval.contains(now)) {
        return Interval.fromDateTimes(interval.start!, now);
      } else {
        return interval;
      }
    });
    this.mergeAndSortIntervals();

    this.poll();
  }

  private calcIntervals() {
    if (!this.config) return;
    const timings = this.config.timings;
    const now = DateTime.local();

    let renewAt: DateTime = DateTime.fromObject({
      year: now.year,
      month: now.month,
      day: now.day,
      hour: 0,
      minute: 0,
      second: 0,
    }).plus({ days: 1 });
    const intervals: Interval[] = [];
    timings.forEach((times) => {
      const start = DateTime.fromISO(times[0]);
      let end = DateTime.fromISO(times[1]);
      if (end < start) {
        end = end.plus({ days: 1 });
      }
      const interval = Interval.fromDateTimes(start, end);
      if (!interval.isBefore(now)) {
        intervals.push(interval);

        if (end > renewAt) {
          renewAt = end;
        }
      }
    });

    this.renewAt = renewAt;
    this.intervals = intervals;
    this.mergeAndSortIntervals();
  }

  private mergeAndSortIntervals() {
    this.intervals = Interval.merge(this.intervals).sort((i1, i2) => {
      if (i1.start! < i2.start!) return -1;
      if (i1.start! > i2.start!) return 1;
      return 0;
    });

    for (const i of this.intervals) {
      this.log.info(`  interval: ${i.start!.toISO()} -> ${i.end!.toISO()}`);
    }
  }
}
