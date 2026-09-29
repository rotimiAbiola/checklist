import { useRef, useState } from "react";
import { Logo } from "./components/Logo";
import { ThemeToggle } from "./components/ThemeToggle";
import { StatsPanel } from "./components/StatsPanel";
import { TodoForm } from "./components/TodoForm";
import { FilterBar } from "./components/FilterBar";
import { TodoList } from "./components/TodoList";
import { SelectionToolbar } from "./components/SelectionToolbar";
import { Toast, type ToastData } from "./components/Toast";
import {
  useBulkAction,
  useCreateSubtask,
  useCreateTodo,
  useDeleteSubtask,
  useDeleteTodo,
  useReorderTodos,
  useRestoreTodo,
  useStatsQuery,
  useTodosQuery,
  useUpdateSubtask,
  useUpdateTodo,
} from "./hooks/useTodos";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { TodoFilters } from "./types/todo";

function isManualOrderView(filters: TodoFilters): boolean {
  return (
    (filters.sortBy === undefined || filters.sortBy === "position") &&
    (filters.status === undefined || filters.status === "all") &&
    !filters.search &&
    !filters.tag &&
    (!filters.priority || filters.priority === "all")
  );
}

export default function App() {
  const [filters, setFilters] = useState<TodoFilters>({ status: "all" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastIdRef = useRef(0);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const todosQuery = useTodosQuery(filters);
  const statsQuery = useStatsQuery();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const restoreTodo = useRestoreTodo();
  const reorderTodos = useReorderTodos();
  const bulkActionMutation = useBulkAction();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();

  const todos = todosQuery.data ?? [];
  const dragEnabled = isManualOrderView(filters);

  function showToast(data: Omit<ToastData, "id">) {
    toastIdRef.current += 1;
    setToast({ ...data, id: toastIdRef.current });
  }

  function handleDelete(id: number) {
    const todo = todos.find((t) => t.id === id);
    deleteTodo.mutate(id);
    showToast({
      message: todo ? `Deleted "${todo.title}"` : "Todo deleted",
      actionLabel: "Undo",
      onAction: () => restoreTodo.mutate(id),
    });
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleBulkComplete() {
    bulkActionMutation.mutate({ ids: [...selectedIds], action: "complete" });
    exitSelectMode();
  }

  function handleBulkDelete() {
    bulkActionMutation.mutate({ ids: [...selectedIds], action: "delete" });
    exitSelectMode();
  }

  function handleBulkAddTag(tag: string) {
    bulkActionMutation.mutate({ ids: [...selectedIds], action: "add_tag", tag });
  }

  useKeyboardShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onFocusAdd: () => titleInputRef.current?.focus(),
    onNavigateDown: () =>
      setFocusedIndex((i) =>
        todos.length === 0 ? null : i === null ? 0 : Math.min(i + 1, todos.length - 1),
      ),
    onNavigateUp: () =>
      setFocusedIndex((i) => (todos.length === 0 ? null : i === null ? 0 : Math.max(i - 1, 0))),
    onToggleFocused: () => {
      if (focusedIndex === null) return;
      const todo = todos[focusedIndex];
      if (todo) updateTodo.mutate({ id: todo.id, input: { completed: !todo.completed } });
    },
    onEditFocused: () => {
      if (focusedIndex === null) return;
      const todo = todos[focusedIndex];
      if (todo) setEditingId(todo.id);
    },
    onEscape: () => {
      setEditingId(null);
      setFocusedIndex(null);
      if (selectMode) exitSelectMode();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Checkpoint</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Stay on top of everything, beautifully.
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {statsQuery.data && (
          <div className="mb-6">
            <StatsPanel stats={statsQuery.data} />
          </div>
        )}

        <div className="mb-6">
          <TodoForm
            titleInputRef={titleInputRef}
            onSubmit={async (input) => {
              await createTodo.mutateAsync(input);
            }}
            isSubmitting={createTodo.isPending}
          />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <FilterBar filters={filters} onChange={setFilters} searchInputRef={searchInputRef} />
          </div>
          <button
            type="button"
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            aria-pressed={selectMode}
            className={`self-start rounded-xl border px-3 py-1.5 text-sm font-medium transition sm:self-auto ${
              selectMode
                ? "border-violet-400 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {selectMode ? "Cancel select" : "Select"}
          </button>
        </div>

        {selectMode && (
          <div className="mb-4">
            <SelectionToolbar
              count={selectedIds.size}
              onComplete={handleBulkComplete}
              onDelete={handleBulkDelete}
              onAddTag={handleBulkAddTag}
              onExit={exitSelectMode}
            />
          </div>
        )}

        {todosQuery.isLoading && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">Loading todos...</p>
        )}

        {todosQuery.isError && (
          <p className="text-center text-sm text-rose-600 dark:text-rose-400">
            {(todosQuery.error as Error).message}
          </p>
        )}

        {todosQuery.data && (
          <TodoList
            todos={todos}
            onToggle={(id, completed) => updateTodo.mutate({ id, input: { completed } })}
            onUpdate={(id, input) => updateTodo.mutate({ id, input })}
            onDelete={handleDelete}
            onTagClick={(tag) => setFilters((f) => ({ ...f, tag }))}
            editingId={editingId}
            onStartEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            focusedIndex={focusedIndex}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            dragEnabled={dragEnabled}
            onReorder={(ids) => reorderTodos.mutate(ids)}
            onAddSubtask={(todoId, title) => createSubtask.mutate({ todoId, title })}
            onToggleSubtask={(todoId, subtaskId, completed) =>
              updateSubtask.mutate({ todoId, subtaskId, input: { completed } })
            }
            onDeleteSubtask={(todoId, subtaskId) => deleteSubtask.mutate({ todoId, subtaskId })}
          />
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
