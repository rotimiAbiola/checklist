import { useState } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Todo, TodoUpdateInput } from "../types/todo";
import { PriorityBadge } from "./PriorityBadge";
import { TagChip } from "./TagChip";
import { TodoForm } from "./TodoForm";
import { SubtaskList } from "./SubtaskList";

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "🔁 Daily",
  weekly: "🔁 Weekly",
  monthly: "🔁 Monthly",
};

function isOverdue(todo: Todo): boolean {
  if (!todo.due_date || todo.completed) return false;
  return new Date(todo.due_date) < new Date(new Date().toDateString());
}

function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onUpdate: (id: number, input: TodoUpdateInput) => void;
  onDelete: (id: number) => void;
  onTagClick?: (tag: string) => void;
  isEditing: boolean;
  onStartEdit: (id: number) => void;
  onCancelEdit: () => void;
  isFocused?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  dragEnabled?: boolean;
  onAddSubtask: (todoId: number, title: string) => void;
  onToggleSubtask: (todoId: number, subtaskId: number, completed: boolean) => void;
  onDeleteSubtask: (todoId: number, subtaskId: number) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onDelete,
  onTagClick,
  isEditing,
  onStartEdit,
  onCancelEdit,
  isFocused = false,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
  dragEnabled = false,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoItemProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const overdue = isOverdue(todo);
  const subtaskDone = todo.subtasks.filter((s) => s.completed).length;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: !dragEnabled,
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing) {
    return (
      <TodoForm
        submitLabel="Save"
        initialValues={{
          title: todo.title,
          description: todo.description ?? "",
          priority: todo.priority,
          due_date: todo.due_date ?? "",
          recurrence: todo.recurrence ?? "",
          tags: todo.tags.join(", "),
        }}
        onCancel={onCancelEdit}
        onSubmit={(input) => {
          onUpdate(todo.id, input);
          onCancelEdit();
        }}
      />
    );
  }

  return (
    <motion.li
      ref={setNodeRef}
      style={dragStyle}
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      data-testid="todo-item"
      className={clsx(
        "flex flex-col gap-2 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-800",
        todo.completed && "opacity-60",
        isFocused ? "border-violet-400 ring-2 ring-violet-300" : "border-slate-200 dark:border-slate-700",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      <div className="flex items-start gap-3">
        {selectMode ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(todo.id)}
            aria-label={`Select "${todo.title}"`}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-violet-600"
          />
        ) : (
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id, !todo.completed)}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? "active" : "completed"}`}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded-full accent-violet-600"
          />
        )}

        {dragEnabled && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder "${todo.title}"`}
            className="mt-1 shrink-0 cursor-grab touch-none rounded px-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
          >
            ⠿
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p
            className={clsx(
              "break-words text-sm font-medium text-slate-900 dark:text-white",
              todo.completed && "line-through",
            )}
          >
            {todo.title}
          </p>
          {todo.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{todo.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={todo.priority} />
            {todo.due_date && (
              <span
                className={clsx(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  overdue
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                )}
              >
                {overdue ? "Overdue " : "Due "}
                {formatDueDate(todo.due_date)}
              </span>
            )}
            {todo.recurrence && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                {RECURRENCE_LABELS[todo.recurrence]}
              </span>
            )}
            {todo.tags.map((tag) => (
              <TagChip key={tag} tag={tag} onClick={onTagClick} />
            ))}
            {todo.subtasks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSubtasks((v) => !v)}
                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                ☑ {subtaskDone}/{todo.subtasks.length}
              </button>
            )}
          </div>

          {(showSubtasks || todo.subtasks.length === 0) && (
            <SubtaskList
              subtasks={todo.subtasks}
              onAdd={(title) => {
                setShowSubtasks(true);
                onAddSubtask(todo.id, title);
              }}
              onToggle={(subtaskId, completed) => onToggleSubtask(todo.id, subtaskId, completed)}
              onDelete={(subtaskId) => onDeleteSubtask(todo.id, subtaskId)}
            />
          )}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onStartEdit(todo.id)}
            aria-label={`Edit "${todo.title}"`}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete "${todo.title}"`}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/10"
          >
            🗑️
          </button>
        </div>
      </div>
    </motion.li>
  );
}
