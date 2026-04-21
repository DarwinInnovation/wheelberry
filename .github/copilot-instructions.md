# Copilot Instructions — Wheelberry Monorepo

This is the unified Wheelberry platform: proxy server, shared client library, and device implementations, all in one pnpm workspace. Firmware lives in a separate repository.

## Layout

```
packages/proxy-client/     Shared Socket.IO client library (@wheelberry/proxy-client)
apps/proxy/                Proxy server (Express + Socket.IO + Alexa + MongoDB)
apps/proxy/portal/         React/Vite admin UI (@wheelberry/portal)
apps/blanket/              Electric blanket device (TP-Link smart plug)
apps/wheelchair/           Wheelchair seating-position device
```

Workspace deps link via `workspace:*`. No GitHub URL dependencies between internal packages.

## Code Style

- TypeScript with `@tsconfig/node24` base via root `tsconfig.base.json` (strict, ES modules via `nodenext`).
- Apps emit to `bin/`, libraries emit to `lib/`. Build artefacts are gitignored.
- Apps set `"declaration": false` in their tsconfig (avoids TS2742 on pnpm-hoisted nested types).
- Use `pino` v10 for logging — types bundled, do not add `@types/pino`.
- Use `lodash` for utilities in the server; keep device code lean.
- Prettier: single quotes, trailing commas, 100 cols.

## Build & Run

```bash
pnpm install
pnpm --filter @wheelberry/proxy-client build     # build foundation first
pnpm -r typecheck
pnpm --workspace-concurrency=1 -r build
```

Per-app dev:

```bash
pnpm --filter @wheelberry/proxy dev
pnpm --filter @wheelberry/blanket dev
pnpm --filter @wheelberry/wheelchair dev
pnpm --filter @wheelberry/portal dev            # React admin UI
```

## Conventions

- Never commit directly to `master` — always branch and open a PR.
- Devices are deployed as pre-built tarballs produced via `pnpm deploy --filter <app> --prod <out>`.
- Device config is pushed from the proxy via the Socket.IO `config` event — no local config files on devices.
- Proxy config is in MongoDB (see `src/db/` and `src/scripts/admin-cli.ts`); JSON5 files are legacy / migration-only.
- Alexa skill models live in `apps/proxy/cfg/skills/*.json`.
