import { request } from "./client";
import type {
  BulkActionInput,
  Stats,
  Subtask,
  Todo,
  TodoCreateInput,
  TodoFilters,
  TodoUpdateInput,
} from "../types/todo";

function buildQuery(filters: TodoFilters): string {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.status === "active") params.set("completed", "false");
  if (filters.status === "completed") params.set("completed", "true");
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.sortBy) params.set("sort_by", filters.sortBy);
  if (filters.order) params.set("order", filters.order);

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function fetchTodos(filters: TodoFilters = {}): Promise<Todo[]> {
  return request<Todo[]>(`/api/todos${buildQuery(filters)}`);
}

export function fetchStats(): Promise<Stats> {
  return request<Stats>("/api/todos/stats");
}

export function createTodo(input: TodoCreateInput): Promise<Todo> {
  return request<Todo>("/api/todos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTodo(id: number, input: TodoUpdateInput): Promise<Todo> {
  return request<Todo>(`/api/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTodo(id: number): Promise<void> {
  return request<void>(`/api/todos/${id}`, { method: "DELETE" });
}

export function restoreTodo(id: number): Promise<Todo> {
  return request<Todo>(`/api/todos/${id}/restore`, { method: "POST" });
}

export function reorderTodos(orderedIds: number[]): Promise<Todo[]> {
  return request<Todo[]>("/api/todos/reorder", {
    method: "POST",
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
}

export function bulkAction(input: BulkActionInput): Promise<Todo[]> {
  return request<Todo[]>("/api/todos/bulk", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createSubtask(todoId: number, title: string): Promise<Subtask> {
  return request<Subtask>(`/api/todos/${todoId}/subtasks`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateSubtask(
  todoId: number,
  subtaskId: number,
  input: { title?: string; completed?: boolean },
): Promise<Subtask> {
  return request<Subtask>(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteSubtask(todoId: number, subtaskId: number): Promise<void> {
  return request<void>(`/api/todos/${todoId}/subtasks/${subtaskId}`, { method: "DELETE" });
}
