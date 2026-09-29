import { arrayMove } from "@dnd-kit/sortable";
import type { Todo } from "../types/todo";

export function computeReorderedIds(todos: Todo[], activeId: number, overId: number): number[] {
  if (activeId === overId) return todos.map((t) => t.id);
  const oldIndex = todos.findIndex((t) => t.id === activeId);
  const newIndex = todos.findIndex((t) => t.id === overId);
  if (oldIndex === -1 || newIndex === -1) return todos.map((t) => t.id);
  return arrayMove(todos, oldIndex, newIndex).map((t) => t.id);
}
