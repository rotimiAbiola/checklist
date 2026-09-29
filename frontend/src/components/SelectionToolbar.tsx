import { useState, type FormEvent } from "react";

interface SelectionToolbarProps {
  count: number;
  onComplete: () => void;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  onExit: () => void;
}

export function SelectionToolbar({ count, onComplete, onDelete, onAddTag, onExit }: SelectionToolbarProps) {
  const [tag, setTag] = useState("");

  function handleAddTag(event: FormEvent) {
    event.preventDefault();
    const trimmed = tag.trim();
    if (!trimmed) return;
    onAddTag(trimmed);
    setTag("");
  }

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-800 dark:bg-violet-500/10"
    >
      <span className="font-medium text-violet-700 dark:text-violet-300">
        {count} selected
      </span>

      <button
        type="button"
        onClick={onComplete}
        disabled={count === 0}
        className="rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
      >
        Complete
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={count === 0}
        className="rounded-lg bg-white px-3 py-1.5 font-medium text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-rose-500/10"
      >
        Delete
      </button>

      <form onSubmit={handleAddTag} className="flex items-center gap-1">
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="tag"
          aria-label="Tag to add to selected todos"
          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-violet-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={count === 0}
          className="rounded-lg bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
        >
          Add tag
        </button>
      </form>

      <button
        type="button"
        onClick={onExit}
        className="ml-auto rounded-lg px-3 py-1.5 font-medium text-slate-500 transition hover:bg-white/60 dark:text-slate-400 dark:hover:bg-slate-800/60"
      >
        Done
      </button>
    </div>
  );
}
