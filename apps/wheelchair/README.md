# Wheelberry Wheelchair

IoT device implementation that sends seating position commands to a wheelchair, connecting to the Wheelberry proxy server for remote voice/web control.

## Architecture

- **WheelberryWheelchair** — implements `WheelberryProxyImpl` from `@wheelberry/proxy-client`
- Commands: `Lift`, `Tilt`, `Recline`, `LegTilt`, `LegLength` (each takes direction + seconds), and `on_off`
- Config is pushed from the proxy server via Socket.IO `config` event

## Commands

| Command | Alexa phrase | Description |
|---|---|---|
| `Lift` | "lift up for 2 seconds" / "lift down for 2 seconds" | Engages lift actuator in the given direction for a duration |
| `Tilt` | "tilt forward for 2 seconds" / "tilt back for 2 seconds" | Engages tilt actuator in the given direction for a duration |
| `Recline` | "recline forward for 2 seconds" / "recline back for 2 seconds" | Engages recline actuator in the given direction for a duration |
| `LegTilt` | "leg tilt up for 2 seconds" / "leg tilt down for 2 seconds" | Engages leg tilt actuator in the given direction for a duration |
| `LegLength` | "leg length forward for 2 seconds" / "leg length back for 2 seconds" | Engages leg length actuator in the given direction for a duration |
| `on_off` | "toggle power" / "switch chair on/off" | Toggles wheelchair power |

## Hardware Interface

`WheelberryWheelchair.sendCommand()` is a stub — fill it in with the appropriate transport for your hardware (HTTP relay, serial port, GPIO, etc.).

## Setup

1. Copy `.env.example` to `.env` and populate it.
2. Register the device on the proxy server:

```bash
cd ../node-wheelberry-proxy
npx tsx src/scripts/admin-cli.ts device add wheelchair <uid> <email>
npx tsx src/scripts/admin-cli.ts token generate <device-uid>
```

3. Set `WHEELBERRY_TOKEN` in `.env` to the generated token.

## Build & Run

```bash
npm install
npm run build   # compile TypeScript → bin/
npm start       # run compiled output
npm run dev     # tsx watch mode with pino-pretty
```

## Conventions

- Never commit directly to `master` — always branch and open a PR
- Config is pushed from the proxy server via Socket.IO `config` event (not local files)
- Depends on `@wheelberry/proxy-client` from the local workspace (or GitHub)
