# node-wheelberry-proxy

A central server for the **Wheelberry** assistive technology platform. It routes commands from voice interfaces (Amazon Alexa) and a web UI to connected devices over Socket.IO.

## Architecture Overview

```
┌──────────────┐     ┌─────────────────────────────────────────────┐     ┌─────────────────────┐
│  Amazon Alexa │────▶│          Wheelberry Proxy Server            │◀───▶│  Device Client      │
│  Voice Input  │     │                                             │     │  (e.g. blanket,     │
└──────────────┘     │  ┌─────────────┐  ┌───────────────────────┐ │     │   wheelchair)        │
                     │  │ AlexaSkill  │  │ WheelberryProxyServer │ │     │  Uses proxy-client   │
┌──────────────┐     │  │  + Web UI   │  │   (Socket.IO server)  │ │     │  library to connect  │
│   Web Browser │────▶│  └─────────────┘  └───────────────────────┘ │     └─────────────────────┘
│   (Bootstrap) │     │  Express HTTP + Pug templates               │
└──────────────┘     └─────────────────────────────────────────────┘
```

The system has three layers:

1. **Input Layer** — Alexa skills and a web interface accept user commands.
2. **Proxy Server** — Routes commands to the correct device based on user identity and app name.
3. **Device Clients** — IoT devices (smart plugs, wheelchair controllers, etc.) connect via Socket.IO using the `@wheelberry/proxy-client` library and execute commands locally.

## Key Components

### `WheelberryProxyServer`
The core Socket.IO server. Listens on the `/proxy` path for incoming device connections. When a client connects:
1. The client sends an `id` message containing its `app` name and `uid`.
2. The server looks up the corresponding `WheelberryProxyApp` (creating one if needed).
3. The connection is registered against the uid, and any stored configuration is sent to the client.
4. If no `id` is received within 4 seconds, the connection is closed.

### `WheelberryProxyApp`
Represents a named application (e.g. "blanket", "wheelchair"). Manages:
- A mapping from **user email** → **device uid** (loaded from JSON5 config files).
- A mapping from **uid** → connection state and device-specific configuration.
- Tracks which uids are currently connected.

### `WheelberryProxyConnection`
Wraps a single Socket.IO socket to a device client. Provides:
- `sendConfig(cfg)` — pushes configuration to the device.
- `sendCommand(cmd, args)` — sends a named command and returns a Promise that resolves with the device's response.

### `AlexaSkill`
Integrates with the `alexa-app` library to handle Alexa voice requests. On each request:
1. The user's Amazon access token is used to fetch their profile (email).
2. The email is looked up in the `WheelberryProxyApp` to find the connected device.
3. The voice intent name and slot values are forwarded as a command to the device via Socket.IO.
4. The device's response is spoken back to the user.

Custom intents (e.g. `Boost`, `Extend`, `Off` for the blanket skill) are defined in Alexa skill model JSON files under `cfg/skills/`.

### `AlexaSkillWeb`
Exposes each custom Alexa intent as an HTTP GET endpoint (e.g. `/skill/blanket/Boost?user=email`), allowing commands to be triggered from the Bootstrap web UI without needing Alexa.

## Configuration

### `cfg/<app>.json5`
Per-application config mapping users to device UIDs and optional device configuration:

```json5
{
  users: {
    'user@example.com': {
      uid: 'device_id',
      cfg: {
        // device-specific config sent on connect
      },
    },
  },
}
```

### `cfg/skills/<app>.json`
Alexa interaction model definitions (invocation name, intents, slots, sample utterances). These follow the standard Alexa skill model format.

## Current Skills

| Skill | Invocation | Intents | Description |
|-------|-----------|---------|-------------|
| **blanket** | "electric blanket" | `Boost`, `Extend {duration}`, `Off` | Controls a TP-Link smart plug for an electric blanket |
| **wheelchair** | "wheel berry" | `Lift {direction} {seconds}`, `Tilt {direction} {seconds}`, `Recline {direction} {seconds}`, `LegTilt {direction} {seconds}`, `LegLength {direction} {seconds}`, `on_off` | Sends direct seating actuator commands plus power commands to a wheelchair controller |

## Running

```bash
# Install dependencies
npm install

# Development (compile + watch + pretty logging)
npm run dev
```

The server starts on port `9887` by default (configurable via the `PORT` environment variable).

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `9887` | HTTP server port |
| `APP_ID` | — | Application name for log output |
| `LOG_LEVEL` | `info` | Pino log level |

## Project Structure

```
src/
  index.ts                    — Entry point: Express + HTTP server setup
  WheelberryProxyServer.ts    — Socket.IO server managing device connections
  WheelberryProxyApp.ts       — Per-application user/device registry
  WheelberryProxyConnection.ts — Single device connection wrapper
  AlexaSkill.ts               — Alexa voice skill handler + command forwarding
  AlexaSkillWeb.ts            — Web HTTP endpoints mirroring Alexa intents
  alexaInterface.ts           — TypeScript interfaces for Alexa skill models
cfg/
  blanket.json5               — Blanket app user/device config
  wheelchair.json5            — Wheelchair app user/device config
  skills/
    blanket.json              — Alexa interaction model for blanket skill
    wheelchair.json           — Alexa interaction model for wheelchair skill
views/
  skill.pug                   — Bootstrap web UI for triggering skill commands
public/
  scripts/skill.js            — Client-side JS for the skill web UI
```

## Related Repositories

- **[node-wheelberry-proxy-client](https://github.com/DarwinInnovation/node-wheelberry-proxy-client)** — Client library used by devices to connect to this server.
- **[node-wheelberry-blanket](https://github.com/DarwinInnovation/node-wheelberry-blanket)** — Electric blanket device implementation using the proxy client.
