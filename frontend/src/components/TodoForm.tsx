import { useState, type FormEvent, type RefObject } from "react";
import type { Priority, Recurrence, TodoCreateInput } from "../types/todo";

export interface TodoFormValues {
  title: string;
  description: string;
  priority: Priority;
  due_date: string;
  recurrence: Recurrence | "";
  tags: string;
}

const EMPTY_VALUES: TodoFormValues = {
  title: "",
  description: "",
  priority: "medium",
  due_date: "",
  recurrence: "",
  tags: "",
};

function toInput(values: TodoFormValues): TodoCreateInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority,
    due_date: values.due_date || null,
    recurrence: values.recurrence || null,
    tags: values.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

interface TodoFormProps {
  initialValues?: Partial<TodoFormValues>;
  submitLabel?: string;
  onSubmit: (input: TodoCreateInput) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  titleInputRef?: RefObject<HTMLInputElement | null>;
}

export function TodoForm({
  initialValues,
  submitLabel = "Add todo",
  onSubmit,
  onCancel,
  isSubmitting = false,
  titleInputRef,
}: TodoFormProps) {
  const [values, setValues] = useState<TodoFormValues>({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(Boolean(initialValues));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!values.title.trim()) {
      setError("Title is required");
      return;
    }
    setError(null);
    await onSubmit(toInput(values));
    if (!initialValues) {
      setValues(EMPTY_VALUES);
      setExpanded(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex gap-2">
        <input
          ref={titleInputRef}
          type="text"
          placeholder="What needs to be done?"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          onFocus={() => setExpanded(true)}
          aria-label="Todo title"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-violet-800"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {expanded && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <textarea
            placeholder="Description (optional)"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            aria-label="Description"
            rows={2}
            className="sm:col-span-2 lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />

          <select
            value={values.priority}
            onChange={(e) =>
              setValues((v) => ({ ...v, priority: e.target.value as Priority }))
            }
            aria-label="Priority"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>

          <input
            type="date"
            value={values.due_date}
            onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
            aria-label="Due date"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />

          <select
            value={values.recurrence}
            onChange={(e) =>
              setValues((v) => ({ ...v, recurrence: e.target.value as Recurrence | "" }))
            }
            aria-label="Repeat"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Does not repeat</option>
            <option value="daily">Repeat daily</option>
            <option value="weekly">Repeat weekly</option>
            <option value="monthly">Repeat monthly</option>
          </select>

          <input
            type="text"
            placeholder="tags, comma, separated"
            value={values.tags}
            onChange={(e) => setValues((v) => ({ ...v, tags: e.target.value }))}
            aria-label="Tags"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
      )}
    </form>
  );
}
