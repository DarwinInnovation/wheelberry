# node-wheelberry-blanket

A **Wheelberry** device add-on that controls an electric blanket via a TP-Link smart plug. It connects to the [Wheelberry Proxy Server](https://github.com/DarwinInnovation/node-wheelberry-proxy) and responds to voice commands from Alexa and web UI triggers.

## Overview

This application runs on a local machine (e.g. a Raspberry Pi) on the same network as a TP-Link smart plug. It:

1. Connects to the Wheelberry proxy server using `@wheelberry/proxy-client`.
2. Receives its configuration (smart plug IP address, on/off schedule) from the server.
3. Discovers the TP-Link plug on the local network.
4. Polls on a timer, switching the plug on or off according to configured time intervals.
5. Responds to remote commands forwarded from Alexa or the web UI.

## Voice Commands (via Alexa)

| Command | Alexa Utterance | Effect |
|---------|----------------|--------|
| **Boost** | "Alexa, tell electric blanket to boost" | Turns on for 20 minutes |
| **Extend** | "Alexa, tell electric blanket to extend for 30 minutes" | Extends on-time by the given ISO 8601 duration |
| **Off** | "Alexa, tell electric blanket to turn off" | Immediately switches off, truncating the current interval |

## How It Works

### Scheduling

The server pushes a `timings` config — an array of `[start, end]` time pairs (e.g. `["21:30", "23:30"]`). These define when the blanket should be on each day.

The `WheelberryBlanket` class converts these into Luxon `Interval` objects and polls periodically:
- If the current time falls within an active interval, the plug is switched **on**.
- Otherwise it is switched **off**.
- The poll timer is set to fire at the next state transition.

### Dynamic Adjustments

- **Boost** creates a new 20-minute interval starting now and merges it with existing intervals.
- **Extend** creates an interval of the requested duration and merges it in.
- **Off** truncates the current interval at the present moment.

All intervals are automatically merged and sorted to avoid overlaps.

### Plug Discovery

On startup (or after losing contact), the application attempts to find the TP-Link plug at the configured IP. If discovery fails, it retries every 60 seconds.

## Configuration

Configuration is pushed from the proxy server (defined in `cfg/blanket.json5` on the server):

```json5
{
  switchIP: '10.0.1.160',       // TP-Link plug IP address
  timings: [
    ['21:30', '23:30'],          // on at 9:30pm, off at 11:30pm
  ],
}
```

## Running

```bash
# Install dependencies
npm install

# Development (compile + watch + pretty logging)
npm run nodemon
```

### Environment Variables

Environment variables are loaded from a `.env` file in the project root via [dotenv](https://github.com/motdotla/dotenv). Create a `.env` file with the required values:

```env
WHEELBERRY_TOKEN=<your-device-token>
APP_ID=blanket
LOG_LEVEL=info
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WHEELBERRY_TOKEN` | **Yes** | — | Per-device authentication token issued by the proxy server. The application will exit on startup if this is not set. |
| `APP_ID` | No | — | Application name for log output |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Project Structure

```
src/
  index.ts              — Entry point: creates WheelberryBlanket + proxy connection
  WheelberryBlanket.ts  — Device implementation: plug control + interval scheduling
  interface.ts          — TypeScript interfaces for blanket status and config
```

## Dependencies

- **[@wheelberry/proxy-client](https://github.com/DarwinInnovation/node-wheelberry-proxy-client)** — Socket.IO client for connecting to the proxy server.
- **[tplink-smarthome-api](https://github.com/plasticrake/tplink-smarthome-api)** — TP-Link smart plug control.
- **[luxon](https://moment.github.io/luxon/)** — Date/time interval arithmetic.

## Related Repositories

- **[node-wheelberry-proxy](https://github.com/DarwinInnovation/node-wheelberry-proxy)** — The central proxy server.
- **[node-wheelberry-proxy-client](https://github.com/DarwinInnovation/node-wheelberry-proxy-client)** — The client library this add-on uses.
