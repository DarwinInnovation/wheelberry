export interface WheelberryWheelchairStatus {
  powerOn: boolean;
  lastCommand: string;
}

export interface WheelberryWheelchairConfig {
  // IP or serial address of the wheelchair controller relay/interface
  controllerHost: string;
  // Optional per-seating-position button sequences
  positions?: Record<string, number[]>;
}
