import type { RefObject } from "react";
import type { Priority, StatusFilter, TodoFilters } from "../types/todo";

interface FilterBarProps {
  filters: TodoFilters;
  onChange: (filters: TodoFilters) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export function FilterBar({ filters, onChange, searchInputRef }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <input
        ref={searchInputRef}
        type="search"
        placeholder="Search todos... (press /)"
        value={filters.search ?? ""}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        aria-label="Search todos"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:max-w-xs"
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, status: opt.value })}
              aria-pressed={filters.status === opt.value}
              className={`px-3 py-1.5 text-sm transition ${
                (filters.status ?? "all") === opt.value
                  ? "bg-violet-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={filters.priority ?? "all"}
          onChange={(e) =>
            onChange({ ...filters, priority: e.target.value as Priority | "all" })
          }
          aria-label="Filter by priority"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={`${filters.sortBy ?? "position"}:${filters.order ?? "asc"}`}
          onChange={(e) => {
            const [sortBy, order] = e.target.value.split(":") as [TodoFilters["sortBy"], TodoFilters["order"]];
            onChange({ ...filters, sortBy, order });
          }}
          aria-label="Sort todos"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="position:asc">Manual order</option>
          <option value="due_date:asc">Due date (soonest)</option>
          <option value="priority:desc">Priority (highest)</option>
          <option value="created_at:desc">Newest first</option>
          <option value="title:asc">Title (A-Z)</option>
        </select>

        {filters.tag && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, tag: undefined })}
            className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-1.5 text-sm text-violet-700 dark:border-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
          >
            #{filters.tag} ✕
          </button>
        )}
      </div>
    </div>
  );
}
