# Checkpoint

A todo list app with a FastAPI backend and a React + TypeScript frontend —
priorities, due dates, tags, search/filter/sort, live stats, and dark mode.

## Stack

- **Backend:** FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite, pytest
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query,
  Framer Motion, Vitest + React Testing Library + MSW

## Features

- Create, edit, complete, and delete todos
- Priority levels (low / medium / high) with color-coded badges
- Due dates with automatic overdue highlighting
- Recurring todos (daily/weekly/monthly) — completing one spawns the next
- Subtasks/checklists with a progress badge on the parent todo
- Tags — click a tag chip to filter by it
- Search, status filter (all/active/completed), priority filter, and sorting
  (manual order, due date, priority, newest, title)
- Drag-and-drop manual reordering (in the unfiltered, manual-order view)
- Bulk select: complete, delete, or tag multiple todos at once
- Undo delete — soft delete with a toast "Undo" action
- Keyboard shortcuts — `/` search, `n` quick-add, `↑`/`↓` navigate, `Enter`
  toggle, `e` edit, `Escape` cancel
- Live stats panel: total, pending, completed, overdue, and a progress bar
- Dark mode, persisted across sessions
- Animated list transitions (Framer Motion)

## Getting started

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs (Swagger UI) at http://localhost:8000/docs once running.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The frontend talks to the backend at
`http://localhost:8000` by default (override with a `VITE_API_URL` env var).

### Health checks

- Backend: `GET /health` → `{"status": "ok"}`
- Frontend: `GET /health` → `{"status":"ok"}` (a static file served by Vite/any
  static host, useful as a platform health-check path)

## Deployment

Backend on [Render](https://render.com) (free tier), frontend on
[Vercel](https://vercel.com) (free/hobby tier):

1. **Backend → Render.** In the Render dashboard: New → Blueprint → select
   this repo. Render reads `render.yaml` at the repo root and creates a free
   web service rooted at `backend/` (Python 3.12, `uvicorn` start command,
   `/health` as the health check path). When prompted for `ALLOWED_ORIGINS`,
   enter `http://localhost:5173` for now — you'll update it after step 2.
   Note the service's public URL, e.g. `https://checkpoint-backend.onrender.com`.
2. **Frontend → Vercel.** In the Vercel dashboard: Add New → Project →
   import this repo → set **Root Directory** to `frontend` (Vercel
   auto-detects the Vite preset). Add an environment variable
   `VITE_API_URL` = the Render URL from step 1, then deploy. Note the
   resulting Vercel URL, e.g. `https://checkpoint.vercel.app`.
3. **Close the loop.** Back in the Render service's Environment settings,
   set `ALLOWED_ORIGINS` to the Vercel URL from step 2 (comma-separate
   multiple origins, e.g. preview + production URLs) and save — Render
   redeploys automatically.

Two things worth knowing for a free-tier deploy:

- **Cold starts.** Render's free web services spin down after 15 minutes of
  inactivity; the next request wakes it back up in ~30-50s.
- **SQLite persistence.** The free plan has no persistent disk, so the
  SQLite file resets whenever the service restarts (spins back up after
  idling, or on redeploy) — fine for a short-lived trial, not for
  long-term data.

## Testing

```bash
# backend
cd backend && source .venv/bin/activate && python -m pytest

# frontend
cd frontend && npm run test          # or npm run test:coverage
```

See [AGENTS.md](AGENTS.md) for the full testing policy, architecture, and
conventions, and [FEATURE_IDEAS.md](FEATURE_IDEAS.md) for what's next.

## Project layout

```
backend/    FastAPI app, SQLAlchemy models, pytest suite
frontend/   React app, components, React Query hooks, vitest suite
render.yaml Render Blueprint for the backend (see Deployment)
AGENTS.md   Architecture, setup, and testing reference for contributors/agents
CLAUDE.md   Claude Code specific notes (points back to AGENTS.md)
FEATURE_IDEAS.md   Suggested features not yet built
```
