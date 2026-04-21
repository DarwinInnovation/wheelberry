# node-wheelberry-proxy-client

A Socket.IO client library for connecting devices to the [Wheelberry Proxy Server](https://github.com/DarwinInnovation/node-wheelberry-proxy). Part of the **Wheelberry** assistive technology platform.

## Overview

This library allows IoT devices and controllers to:
1. **Connect** to the central Wheelberry proxy server via Socket.IO.
2. **Authenticate** using an app name, device UID, and a SHA-256 hash with a shared key.
3. **Receive configuration** pushed from the server on connect.
4. **Execute commands** sent from Alexa voice intents or the web UI, dispatching them to methods on an implementation object.

## Installation

```bash
npm install github:DarwinInnovation/node-wheelberry-proxy-client
```

## Usage

```typescript
import { WheelberryProxy, WheelberryProxyImpl } from '@wheelberry/proxy-client';
import pino from 'pino';

class MyDevice implements WheelberryProxyImpl {
  getName() { return 'my-device'; }
  getStatus() { return { ok: true }; }
  updateConfig(cfg: any) { /* apply config from server */ }

  // Commands callable from the server (Alexa intents, web UI)
  async TurnOn() { /* ... */ }
  async TurnOff() { /* ... */ }
}

const log = pino();
const device = new MyDevice();

const proxy = new WheelberryProxy(log, {
  app: 'my-app',       // must match a cfg/<app>.json5 on the server
  uid: 'device_001',   // must match a uid in that config
}, device);

proxy.connect();
```

## How It Works

### Connection Flow

1. `proxy.connect()` opens a Socket.IO connection to the server at the `/proxy` path.
2. On connect, the client sends an `id` message containing:
   - `app` — the application name
   - `uid` — unique device identifier
   - `nonce` — random token for this session
   - `hash` — SHA-256 of `app + uid + nonce + shared_key`
3. The server validates the uid, registers the connection, and sends a `config` event with device-specific settings.

### Command Execution

When a command arrives (via the `cmd` Socket.IO event):
1. The command name is looked up as a method on the `WheelberryProxyImpl` object.
2. If the method exists, it is called with the provided arguments.
3. The return value (or resolved Promise) is sent back to the server as a success callback.
4. If the method throws or rejects, a failure callback is sent instead.

This means that to add a new voice command, you simply add a public method to your implementation class with the matching intent name.

## API

### `WheelberryProxy`

| Method | Description |
|--------|-------------|
| `constructor(log, cfg, impl)` | Create a proxy instance |
| `connect()` | Establish Socket.IO connection to the server |

### `WheelberryProxyCfg`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | `string` | `process.env.WHEELBERRY_PROXY_URL` | Server URL (required via cfg or env var) |
| `app` | `string` | `test_app` | Application name |
| `uid` | `string` | `no-id` | Device unique identifier |
| `shared_key` | `string` | *(default key)* | Shared secret for hash authentication |

### `WheelberryProxyImpl`

Interface that device implementations must satisfy:

| Method | Description |
|--------|-------------|
| `getName(): string` | Return the device/app name |
| `getStatus(): any` | Return current device status |
| `updateConfig(cfg: any): void` | Handle configuration updates from server |

Any additional public methods on the implementation become callable commands.

## Related Repositories

- **[node-wheelberry-proxy](https://github.com/DarwinInnovation/node-wheelberry-proxy)** — The central proxy server.
- **[node-wheelberry-blanket](https://github.com/DarwinInnovation/node-wheelberry-blanket)** — Example device implementation (electric blanket controller).
