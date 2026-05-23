# Personal-Fitness-Tracker
A full-stack personal fitness tracker built around an infinite 5-day workout cycle — log workouts, track body metrics, and visualise progress over time.

# FitCycle — Lifetime Fit Tracker

A full-stack personal fitness tracker designed for long-term, consistent training.
Built around a repeating 5-day workout cycle that runs indefinitely — no resets,
no restarts, just continuous progress.

## Features

- **5-Day Workout Cycle** — Chest/Shoulders, Legs, Arms, Conditioning, Full Body.
  Automatically advances each day you log a session.
- **Today's Workout** — Exercise cards with target sets, reps, weights, and durations.
  Warm-up exercises appear as individual cards, not combined text.
- **Progress Tracking** — Per-exercise trend charts, personal bests, and improvement %.
- **Body Metrics** — Log weight, waist, chest, and belly measurements over time.
- **Dashboard** — KPIs, weekly completion stats, cycle comparisons, and a monthly calendar heatmap.
- **Workout History** — Filterable log of every past session.
- **Settings** — Override exercise targets and manually correct the cycle/day pointer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, Shadcn UI, React Query, wouter |
| Backend | Node.js 24, Express 5, Pino |
| Database | PostgreSQL (AWS RDS), Drizzle ORM |
| Monorepo | pnpm workspaces (7 packages) |
| API Contract | OpenAPI 3.1 → Orval codegen (Zod + React Query hooks) |

## Getting Started

```bash
pnpm install
cp .env.example .env        # add your DATABASE_URL
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run seed
bash start-api.sh           # API on :8080
bash start-frontend.sh      # Frontend on :5173
