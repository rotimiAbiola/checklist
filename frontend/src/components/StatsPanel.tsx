import type { Stats } from "../types/todo";

export function StatsPanel({ stats }: { stats: Stats }) {
  const progress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  return (
    <section
      aria-label="Todo statistics"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>Progress</span>
        <span data-testid="progress-percent">{progress}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? "danger" : "default"} />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900/40">
      <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-1 text-xl font-semibold ${
          tone === "danger" ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
