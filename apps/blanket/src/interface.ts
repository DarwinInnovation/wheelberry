export interface WheelberryBlanketStatus {
  isOn: boolean;
  nextSwitch: string;
}

export interface WheelberryBlanketConfig {
  switchIP: string;
  timings: [string, string][];
}

// export interface WheelberryBlanket {
//   boost(): Promise<WheelberryBlanketStatus>;
//   extend(duration: string): Promise<WheelberryBlanketStatus>;
//   off(): Promise<WheelberryBlanketStatus>;
// }
