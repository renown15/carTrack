# CarTrack — Claude Code context

## What this is
A personal road-incident monitor for Mark's school run. Watches configured roads via the TomTom Traffic API and surfaces live incidents. Single user, runs locally via Docker Compose.

## Stack
- **Monorepo** — npm workspaces (`apps/server`, `apps/client`, `packages/shared`)
- **Server** — Fastify 5, better-sqlite3, TypeScript (NodeNext ESM)
- **Client** — React 18, Vite, Tailwind CSS
- **Shared** — Zod-free; plain TS types in `packages/shared`
- **Always use `make` targets** — never run npm scripts directly

## Non-negotiable rules
Break any of these → speak to Mark first.

1. **No file over 200 lines** — split before you hit the limit
2. **No relative imports** — use `@server/*`, `@client/*`, `@cartrack/shared`
3. **No non-Tailwind inline styles** — utility classes only; extend `tailwind.config.js` if needed
4. **Tests ship with every file** — no untested code ever lands
5. **Lint + typecheck must pass** — `make ci` before declaring done
6. **Coverage ≥ 70%** — hard-coded Vitest threshold; dropping below fails the build
7. **DDL/DML in TS** — all schema and seed in `apps/server/src/db.ts`
8. **Docker with named volumes** — `cartrack-db-data`, `cartrack-nginx-logs`
9. **Port scan before deploy** — `make docker-up` runs `check-ports` automatically
10. **Make for DX** — every workflow has a `make` target; run `make help`
11. **Git remote** — `git@github.com:renown15/carTrack.git`
12. **Commit regularly** — stage + commit + push at every meaningful milestone

## Key make targets
```
make dev          # start server + client watch
make ci           # typecheck + lint + coverage (pre-push gate)
make coverage     # vitest --coverage (≥70% enforced)
make docker-up    # port scan → docker compose up --build
make commit       # git add -A, commit, push
make push         # ci → git push
make help         # full list
```

## Path aliases
| Alias | Resolves to |
|---|---|
| `@server/*` | `apps/server/src/*` |
| `@client/*` | `apps/client/src/*` |
| `@cartrack/shared` | `packages/shared/src/index.ts` |

## Project structure
```
apps/
  server/src/
    config.ts          env + DB path
    db.ts              DDL + all roadsDb CRUD
    routes/            roads, incidents, geocode
    services/          tomtom.ts, nominatim.ts
    __tests__/         mirrors src/ structure
  client/src/
    api/client.ts      typed fetch wrapper
    components/        RoadCard, IncidentBadge, AddRoadModal
    hooks/             useRoads, useIncidents
    __tests__/         mirrors src/ structure
packages/shared/src/
    types.ts           Road, Incident, Geocode, ApiResponse
```

## Ports
- API server: 3001
- Vite dev server: 5173

## Environment
Copy `.env.example` → `.env` and set `TOMTOM_API_KEY`.
