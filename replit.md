# FitCycle — Lifetime Fitness Tracker

A full-stack fitness tracking web app built around a repeating 5-day workout cycle. Tracks workouts, exercise progress, body metrics, and streaks indefinitely — designed to be used for months and years.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/fitness-tracker run dev` — run the frontend (port 23863)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion + Recharts + lucide-react
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (exercises, workoutDays, workoutLogs, bodyMetrics, userTargets, appState)
- `artifacts/api-server/src/routes/` — Express route handlers (appState, exercises, workoutDays, workoutLogs, exerciseLogs, bodyMetrics, userTargets, dashboard)
- `artifacts/fitness-tracker/src/` — React frontend (pages, components, hooks)

## Architecture decisions

- The 5-day workout cycle repeats forever via `app_state.current_workout_day_number` (1–5). When day 5 is completed, it wraps back to day 1 and increments `current_cycle_number`.
- Skipped workouts advance the pointer same as completed ones — no day is lost, the cycle continues.
- Exercise logs are cascade-deleted with their workout log.
- The `workout_day_exercises` table stores per-day exercise targets; `user_targets` stores user-overridden targets.
- Dashboard summary is computed server-side on each request (no caching needed at low volume).

## Product

- **Today's Workout**: shows current pending day with all exercise cards, lets user log sets/reps/weight/duration/form quality, and submits with "Finish Workout"
- **Dashboard**: KPI cards (streak, workouts, volume, cycling), weekly bar chart, completion pie chart, cycle comparison
- **Calendar**: monthly color-coded heatmap (green=completed, yellow=partial, red=skipped)
- **Weekly Plan**: all 5 workout day definitions
- **Progress**: per-exercise weight/volume trend charts, personal bests, improvement %
- **Body Metrics**: log weight/waist/chest/belly with time-series charts
- **History**: filterable/deletable workout log list
- **Settings**: exercise target overrides, cycle/day pointer correction

## Gotchas

- Always re-run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Operations with both path params AND query params cause a Params type collision in the Zod barrel — use query-only params for operations that also have query params.
- The API server must be restarted after any route changes: the workflow does `build + start` on each run.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
