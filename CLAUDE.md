# CLAUDE.md

This file guides Claude Code in this repository. The full architecture,
setup, test, and convention reference lives in [AGENTS.md](AGENTS.md) —
read it first; this file only adds Claude-Code-specific notes.

## Quick orientation

- Fancy todo list app: FastAPI backend (`backend/`) + React/TypeScript
  frontend (`frontend/`), see [AGENTS.md](AGENTS.md) for the full layout.
- Backend venv already exists at `backend/.venv` — activate it, don't
  recreate it, unless dependencies changed.
- Frontend deps already installed at `frontend/node_modules`.

## Non-negotiable workflow for this repo

1. Every change to `backend/app/**` needs a matching test in `backend/tests/`.
   Every change to `frontend/src/**` needs a matching test next to it (or in
   `frontend/src/App.test.tsx` for cross-component flows).
2. Run the relevant suite(s) before saying a task is done:
   `cd backend && source .venv/bin/activate && python -m pytest` and/or
   `cd frontend && npm run test`.
3. For any UI-visible change, start both dev servers and actually exercise
   the feature (curl the API, drive the browser headlessly, or otherwise
   confirm it works) rather than relying on unit tests alone — they check
   correctness, not that the feature functions end-to-end.
4. Keep `frontend/src/types/todo.ts` and `backend/app/schemas.py` in sync
   when the API contract changes.

## What not to do

- Don't add auth, a task queue, websockets, or other new infra unless asked
  — see [FEATURE_IDEAS.md](FEATURE_IDEAS.md) for the intentionally-deferred
  backlog.
- Don't loosen `pytest.ini` coverage settings or delete tests to make a
  build pass — fix the underlying issue.
- Don't commit `backend/.venv/`, `backend/*.db`, `frontend/node_modules/`,
  `frontend/dist/`, or `frontend/coverage/`.
