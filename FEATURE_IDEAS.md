# Feature ideas

Suggestions for what to build next, roughly ordered by effort within each
group.

## Shipped

The "high value, moderate effort" batch is built:

- **Drag-and-drop manual reordering** — `POST /api/todos/reorder`, `dnd-kit`
  on the frontend. Only active in the unfiltered "manual order" view.
- **Subtasks / checklists** — `Subtask` table, nested under each `Todo`
  (`/api/todos/{id}/subtasks`), with a "x/y done" progress badge.
- **Recurring todos** — a `recurrence` field (`daily`/`weekly`/`monthly`);
  completing a recurring todo spawns the next occurrence server-side.
- **Bulk actions** — `POST /api/todos/bulk` (complete/incomplete/delete/
  add_tag/remove_tag) with a "Select" mode toolbar in the UI.
- **Undo for delete** — soft delete (`deleted_at`) + `POST /api/todos/{id}/restore`,
  surfaced as a toast with an "Undo" button.
- **Keyboard shortcuts** — `/` search, `n` quick-add, `↑`/`↓` navigate,
  `Enter` toggle, `e` edit, `Escape` cancel.

## Accounts and collaboration

- **User authentication** (JWT or session-based) so todos belong to a user
  instead of being global — the natural next step once this is more than a
  single-user demo.
- **Shared lists / collaborators.** Invite another user to a list, with
  per-user read/write permissions.
- **Activity log.** Who changed what and when, useful once lists are shared.

## Richer scheduling

- **Reminders/notifications.** Browser push notifications (or email) a
  configurable amount of time before `due_date`.
- **Calendar view.** A month/week grid of todos by due date, in addition to
  the current list view.
- **Natural-language due dates.** Parse "tomorrow", "next Friday", "in 2
  weeks" in the quick-add input instead of requiring the date picker.

## Data and integrations

- **Import/export.** CSV or JSON export of the current list; import from
  common formats (Todoist, Trello, CSV).
- **Calendar sync.** Two-way sync of due dates with Google Calendar/iCal.
- **Attachments.** Let a todo hold a file or link (e.g. a screenshot or doc)
  via an object-storage backend.

## Insight and polish

- **Productivity stats over time.** A completed-per-day chart, streaks, or a
  "busiest tags" breakdown — builds on the existing `/api/todos/stats`
  endpoint.
- **Offline support / PWA.** Service worker + local cache so the app is
  usable offline and installable on mobile.
- **AI-assisted breakdown.** Given a vague todo title, suggest subtasks or a
  reasonable due date/priority.

## Why the rest weren't built now

Auth and multi-user support are the biggest architectural fork in this list
— they change nearly every endpoint and the data model — so it's worth
deciding deliberately rather than bolting it on. The rest are additive and
can be layered onto the current schema without breaking changes.
