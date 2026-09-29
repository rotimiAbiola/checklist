import clsx from "clsx";
import type { Priority } from "../types/todo";

const STYLES: Record<Priority, string> = {
  low: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[priority],
      )}
    >
      {LABELS[priority]}
    </span>
  );
}
