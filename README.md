# Wheelberry

Assistive technology platform: a proxy server that routes voice (Alexa) and web commands to IoT devices, plus the shared client library and device implementations.

## Layout

```
packages/
  proxy-client/   Shared Socket.IO client library used by all devices
apps/
  proxy/          Proxy server (Express + Socket.IO + Alexa + MongoDB)
  blanket/        Electric blanket device (TP-Link smart plug)
  wheelchair/     Wheelchair seating-position device (stub transport)
```

Firmware lives in a separate repository (different toolchain, different release cadence).

## Quick start

```bash
pnpm install
pnpm typecheck
pnpm build
```

Per-package dev:

```bash
pnpm --filter @wheelberry/proxy dev
pnpm --filter @wheelberry/blanket dev
pnpm --filter @wheelberry/wheelchair dev
```

## Conventions

- TypeScript everywhere, ES modules (`nodenext`), strict.
- `pino` v10 for logging (types are bundled — do not add `@types/pino`).
- Never commit directly to `main` — branch and open a PR.
- Workspace deps are linked via `workspace:*` — no GitHub URLs between internal packages.
