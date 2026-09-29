import { http, HttpResponse } from "msw";
import type { Todo } from "../../types/todo";
import { makeTodo } from "./data";

const API_BASE = "http://localhost:8000";

export let todosStore: (Todo & { deletedAt?: string | null })[] = [];
let nextId = 1;
let nextSubtaskId = 1;

export function resetStore(initial: Todo[] = []) {
  todosStore = initial.map((t) => ({ ...t, subtasks: t.subtasks ?? [] }));
  nextId = todosStore.length > 0 ? Math.max(...todosStore.map((t) => t.id)) + 1 : 1;
  nextSubtaskId = 1;
}

function visible() {
  return todosStore.filter((t) => !t.deletedAt);
}

function computeStats() {
  const active = visible();
  const total = active.length;
  const completed = active.filter((t) => t.completed).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = active.filter(
    (t) => !t.completed && t.due_date && t.due_date < today,
  ).length;
  const byPriority = { low: 0, medium: 0, high: 0 };
  for (const t of active) byPriority[t.priority] += 1;
  return { total, completed, pending: total - completed, overdue, by_priority: byPriority };
}

export const handlers = [
  http.get(`${API_BASE}/api/todos/stats`, () => HttpResponse.json(computeStats())),

  http.post(`${API_BASE}/api/todos/reorder`, async ({ request }) => {
    const body = (await request.json()) as { ordered_ids: number[] };
    body.ordered_ids.forEach((id, index) => {
      const todo = todosStore.find((t) => t.id === id);
      if (todo) todo.position = index + 1;
    });
    return HttpResponse.json([...visible()].sort((a, b) => a.position - b.position));
  }),

  http.post(`${API_BASE}/api/todos/bulk`, async ({ request }) => {
    const body = (await request.json()) as {
      ids: number[];
      action: string;
      tag?: string;
    };
    const targets = visible().filter((t) => body.ids.includes(t.id));

    if (body.action === "delete") {
      targets.forEach((t) => (t.deletedAt = new Date().toISOString()));
      return HttpResponse.json([]);
    }
    if (body.action === "complete") targets.forEach((t) => (t.completed = true));
    if (body.action === "incomplete") targets.forEach((t) => (t.completed = false));
    if (body.action === "add_tag" && body.tag) {
      targets.forEach((t) => {
        if (!t.tags.map((x) => x.toLowerCase()).includes(body.tag!.toLowerCase())) {
          t.tags = [...t.tags, body.tag!];
        }
      });
    }
    if (body.action === "remove_tag" && body.tag) {
      targets.forEach((t) => {
        t.tags = t.tags.filter((x) => x.toLowerCase() !== body.tag!.toLowerCase());
      });
    }
    return HttpResponse.json(targets);
  }),

  http.get(`${API_BASE}/api/todos`, ({ request }) => {
    const url = new URL(request.url);
    let results = [...visible()];

    const completed = url.searchParams.get("completed");
    if (completed !== null) results = results.filter((t) => t.completed === (completed === "true"));

    const priority = url.searchParams.get("priority");
    if (priority) results = results.filter((t) => t.priority === priority);

    const search = url.searchParams.get("search");
    if (search) {
      const q = search.toLowerCase();
      results = results.filter((t) => t.title.toLowerCase().includes(q));
    }

    const tag = url.searchParams.get("tag");
    if (tag) results = results.filter((t) => t.tags.includes(tag));

    return HttpResponse.json(results);
  }),

  http.post(`${API_BASE}/api/todos`, async ({ request }) => {
    const body = (await request.json()) as Partial<Todo>;
    if (!body.title || !body.title.trim()) {
      return HttpResponse.json({ detail: "title must not be blank" }, { status: 422 });
    }
    const todo = makeTodo({
      ...body,
      id: nextId++,
      tags: body.tags ?? [],
      subtasks: [],
    });
    todosStore.push(todo);
    return HttpResponse.json(todo, { status: 201 });
  }),

  http.post(`${API_BASE}/api/todos/:id/restore`, ({ params }) => {
    const id = Number(params.id);
    const todo = todosStore.find((t) => t.id === id);
    if (!todo) return HttpResponse.json({ detail: "Todo not found" }, { status: 404 });
    todo.deletedAt = null;
    return HttpResponse.json(todo);
  }),

  http.post(`${API_BASE}/api/todos/:id/subtasks`, async ({ params, request }) => {
    const id = Number(params.id);
    const todo = visible().find((t) => t.id === id);
    if (!todo) return HttpResponse.json({ detail: "Todo not found" }, { status: 404 });
    const body = (await request.json()) as { title: string };
    if (!body.title || !body.title.trim()) {
      return HttpResponse.json({ detail: "title must not be blank" }, { status: 422 });
    }
    const subtask = {
      id: nextSubtaskId++,
      todo_id: id,
      title: body.title,
      completed: false,
      position: todo.subtasks.length + 1,
    };
    todo.subtasks = [...todo.subtasks, subtask];
    return HttpResponse.json(subtask, { status: 201 });
  }),

  http.patch(`${API_BASE}/api/todos/:id/subtasks/:subtaskId`, async ({ params, request }) => {
    const id = Number(params.id);
    const subtaskId = Number(params.subtaskId);
    const todo = visible().find((t) => t.id === id);
    const subtask = todo?.subtasks.find((s) => s.id === subtaskId);
    if (!todo || !subtask) return HttpResponse.json({ detail: "Subtask not found" }, { status: 404 });
    const body = (await request.json()) as Partial<typeof subtask>;
    Object.assign(subtask, body);
    return HttpResponse.json(subtask);
  }),

  http.delete(`${API_BASE}/api/todos/:id/subtasks/:subtaskId`, ({ params }) => {
    const id = Number(params.id);
    const subtaskId = Number(params.subtaskId);
    const todo = visible().find((t) => t.id === id);
    if (!todo) return HttpResponse.json({ detail: "Todo not found" }, { status: 404 });
    const index = todo.subtasks.findIndex((s) => s.id === subtaskId);
    if (index === -1) return HttpResponse.json({ detail: "Subtask not found" }, { status: 404 });
    todo.subtasks = todo.subtasks.filter((s) => s.id !== subtaskId);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(`${API_BASE}/api/todos/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const todo = visible().find((t) => t.id === id);
    if (!todo) return HttpResponse.json({ detail: "Todo not found" }, { status: 404 });
    const body = (await request.json()) as Partial<Todo>;
    const wasCompleted = todo.completed;
    Object.assign(todo, body);

    if (!wasCompleted && todo.completed && todo.recurrence && todo.due_date) {
      const next = new Date(todo.due_date);
      if (todo.recurrence === "daily") next.setDate(next.getDate() + 1);
      if (todo.recurrence === "weekly") next.setDate(next.getDate() + 7);
      if (todo.recurrence === "monthly") next.setMonth(next.getMonth() + 1);
      todosStore.push(
        makeTodo({
          ...todo,
          id: nextId++,
          completed: false,
          due_date: next.toISOString().slice(0, 10),
          subtasks: [],
        }),
      );
    }

    return HttpResponse.json(todo);
  }),

  http.delete(`${API_BASE}/api/todos/:id`, ({ params }) => {
    const id = Number(params.id);
    const todo = todosStore.find((t) => t.id === id);
    if (!todo || todo.deletedAt) return HttpResponse.json({ detail: "Todo not found" }, { status: 404 });
    todo.deletedAt = new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),
];
