import type { Subtask, Todo } from "../../types/todo";

export function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 1,
    title: "Sample todo",
    description: null,
    completed: false,
    priority: "medium",
    due_date: null,
    recurrence: null,
    tags: [],
    position: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    subtasks: [],
    ...overrides,
  };
}

export function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    id: 1,
    todo_id: 1,
    title: "Sample subtask",
    completed: false,
    position: 1,
    ...overrides,
  };
}
