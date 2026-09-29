export type Priority = "low" | "medium" | "high";
export type Recurrence = "daily" | "weekly" | "monthly";

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  recurrence: Recurrence | null;
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface TodoCreateInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  due_date?: string | null;
  recurrence?: Recurrence | null;
  tags?: string[];
}

export interface TodoUpdateInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  due_date?: string | null;
  recurrence?: Recurrence | null;
  tags?: string[];
  position?: number;
}

export interface Stats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  by_priority: Record<Priority, number>;
}

export type StatusFilter = "all" | "active" | "completed";

export interface TodoFilters {
  search?: string;
  priority?: Priority | "all";
  status?: StatusFilter;
  tag?: string;
  sortBy?: "position" | "due_date" | "priority" | "created_at" | "title";
  order?: "asc" | "desc";
}

export type BulkActionType = "complete" | "incomplete" | "delete" | "add_tag" | "remove_tag";

export interface BulkActionInput {
  ids: number[];
  action: BulkActionType;
  tag?: string;
}
