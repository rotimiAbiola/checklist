export function TagChip({ tag, onClick }: { tag: string; onClick?: (tag: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(tag)}
      className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 transition hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25"
    >
      #{tag}
    </button>
  );
}
