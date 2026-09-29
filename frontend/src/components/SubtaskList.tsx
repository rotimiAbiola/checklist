import { useState, type FormEvent } from "react";
import type { Subtask } from "../types/todo";

interface SubtaskListProps {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onToggle: (subtaskId: number, completed: boolean) => void;
  onDelete: (subtaskId: number) => void;
}

export function SubtaskList({ subtasks, onAdd, onToggle, onDelete }: SubtaskListProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-700">
      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => onToggle(subtask.id, !subtask.completed)}
            aria-label={`Mark subtask "${subtask.title}" as ${subtask.completed ? "active" : "completed"}`}
            className="h-4 w-4 cursor-pointer rounded accent-violet-600"
          />
          <span
            className={`flex-1 text-sm text-slate-600 dark:text-slate-300 ${
              subtask.completed ? "line-through opacity-60" : ""
            }`}
          >
            {subtask.title}
          </span>
          <button
            type="button"
            onClick={() => onDelete(subtask.id)}
            aria-label={`Delete subtask "${subtask.title}"`}
            className="rounded px-1 text-xs text-slate-400 transition hover:text-rose-600 dark:hover:text-rose-400"
          >
            ✕
          </button>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a subtask..."
          aria-label="New subtask title"
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          Add
        </button>
      </form>
    </div>
  );
}
