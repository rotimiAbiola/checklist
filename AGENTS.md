# AGENTS.md

Instructions for AI coding agents (and humans) working in this repository.

## Project overview

**Checkpoint** — a todo list app with a FastAPI backend and a React
(TypeScript) frontend.

- `backend/` — FastAPI + SQLAlchemy + SQLite REST API
- `frontend/` — React 19 + TypeScript + Vite + Tailwind CSS + React Query

See [README.md](README.md) for the feature list and screenshots-in-words. See
[FEATURE_IDEAS.md](FEATURE_IDEAS.md) for a backlog of suggested enhancements.

## Architecture

```
backend/
  app/
    main.py        FastAPI app, CORS, router registration
    database.py     SQLAlchemy engine/session, get_db dependency
    models.py        ORM models (Todo, Priority enum)
    schemas.py       Pydantic request/response models + validation
    crud.py            DB access functions (no HTTP concerns)
    routers/todos.py   HTTP routes, thin — delegate to crud.py
  tests/                pytest suite, one file per concern (crud, filters, stats)

frontend/
  src/
    api/            fetch wrapper (client.ts) + typed endpoint functions (todos.ts)
    types/todo.ts   shared TypeScript types mirroring the backend schemas
    hooks/          React Query hooks (useTodos.ts) + useTheme.ts (dark mode)
    components/     presentational + interactive components, one file each
    test/           vitest setup, MSW request mocks, test-only render helper
    App.tsx         wires hooks + components together; the only "smart" container
```

Keep this layering: routers stay thin, `crud.py` owns all DB queries, components
stay presentational where possible and get their data/mutations from the
`hooks/useTodos.ts` React Query hooks.

## Setup

Backend:
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Frontend:
```bash
cd frontend
npm install
```

## Running in development

```bash
# terminal 1
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# terminal 2
cd frontend && npm run dev   # http://localhost:5173, proxies API calls to :8000
```

The frontend reads the API base URL from `VITE_API_URL` (defaults to
`http://localhost:8000`). Backend CORS origins come from `ALLOWED_ORIGINS`
(comma-separated; defaults to the localhost dev origins).

Alternatively, `docker compose up` runs both services with hot reload
(bind-mounted source, same ports) — see `docker-compose.yml` and each
service's `Dockerfile`.

## Testing — mandatory before considering any change done

**Every code change must be covered by a test, and the full suite must pass
before the change is considered complete.** This is not optional. If you add
an endpoint, a CRUD function, a component, or a hook, add a test alongside it
in the same change.

Backend:
```bash
cd backend && source .venv/bin/activate
python -m pytest              # runs with coverage (see pytest.ini), -v by default
```

Frontend:
```bash
cd frontend
npm run test              # one-shot run (vitest run)
npm run test:watch    # watch mode while developing
npm run test:coverage  # with coverage report
npm run build              # tsc type-check + production build — must succeed
npm run lint                  # oxlint — must be clean
```

Current baseline (keep it from regressing): 60 backend tests at ~98%
statement coverage, 93 frontend tests at ~93% statement coverage. Both suites
must stay green.

For UI changes, don't stop at the test suite — actually run both dev servers
and exercise the feature (or drive it headlessly, e.g. via a browser
automation tool) before reporting the work as done. Type checks and unit
tests verify code correctness, not that the feature works end-to-end.

## Conventions

- Backend: Python 3.11+ type hints everywhere, Pydantic v2 for
  validation, no business logic in `routers/` — put it in `crud.py`.
- Frontend: functional components + hooks only, no class components.
  TypeScript strict mode is on — don't add `any` casts or `@ts-ignore` to
  paper over real type errors.
- Styling is Tailwind CSS v4 utility classes directly in JSX; no separate
  CSS files per component. Dark mode uses the `dark:` variant driven by a
  `.dark` class on `<html>` (see `useTheme.ts`), not the media-query variant.
- API contracts: `frontend/src/types/todo.ts` must stay in sync with
  `backend/app/schemas.py`. If you change one, update the other in the same
  change.
- Don't add authentication, a task queue, or new dependencies unless the
  task actually requires it — see [FEATURE_IDEAS.md](FEATURE_IDEAS.md) for
  things that are intentionally *not* built yet.
- Never commit `backend/.venv/`, `backend/*.db`, `frontend/node_modules/`,
  `frontend/dist/`, or `frontend/coverage/` — all covered by `.gitignore`.

## Commit / PR expectations

- Run both test suites (and `npm run build` + `npm run lint`) before
  presenting work as finished.
- Keep backend and frontend changes that touch the same feature in the same
  commit/PR so the API contract change and its consumer land together.
