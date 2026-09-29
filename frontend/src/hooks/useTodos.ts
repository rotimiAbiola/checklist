import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkAction,
  createSubtask,
  createTodo,
  deleteSubtask,
  deleteTodo,
  fetchStats,
  fetchTodos,
  reorderTodos,
  restoreTodo,
  updateSubtask,
  updateTodo,
} from "../api/todos";
import type {
  BulkActionInput,
  Todo,
  TodoCreateInput,
  TodoFilters,
  TodoUpdateInput,
} from "../types/todo";

export const todoKeys = {
  all: ["todos"] as const,
  list: (filters: TodoFilters) => ["todos", "list", filters] as const,
  stats: ["todos", "stats"] as const,
};

export function useTodosQuery(filters: TodoFilters) {
  return useQuery({
    queryKey: todoKeys.list(filters),
    queryFn: () => fetchTodos(filters),
  });
}

export function useStatsQuery() {
  return useQuery({
    queryKey: todoKeys.stats,
    queryFn: fetchStats,
  });
}

function useInvalidateTodos() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: todoKeys.all });
  };
}

export function useCreateTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (input: TodoCreateInput) => createTodo(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TodoUpdateInput }) => updateTodo(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (id: number) => deleteTodo(id),
    onSuccess: invalidate,
  });
}

export function useRestoreTodo() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (id: number) => restoreTodo(id),
    onSuccess: invalidate,
  });
}

export function useReorderTodos() {
  const queryClient = useQueryClient();
  const listKey = ["todos", "list"] as const;

  return useMutation({
    mutationFn: (orderedIds: number[]) => reorderTodos(orderedIds),
    onMutate: async (orderedIds: number[]) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueriesData<Todo[]>({ queryKey: listKey });

      queryClient.setQueriesData<Todo[]>({ queryKey: listKey }, (old) => {
        if (!old) return old;
        const byId = new Map(old.map((t) => [t.id, t]));
        const reordered = orderedIds
          .map((id) => byId.get(id))
          .filter((t): t is Todo => Boolean(t));
        const remaining = old.filter((t) => !orderedIds.includes(t.id));
        return [...reordered, ...remaining].map((t, i) => ({ ...t, position: i + 1 }));
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });
}

export function useBulkAction() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: (input: BulkActionInput) => bulkAction(input),
    onSuccess: invalidate,
  });
}

export function useCreateSubtask() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: ({ todoId, title }: { todoId: number; title: string }) =>
      createSubtask(todoId, title),
    onSuccess: invalidate,
  });
}

export function useUpdateSubtask() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: ({
      todoId,
      subtaskId,
      input,
    }: {
      todoId: number;
      subtaskId: number;
      input: { title?: string; completed?: boolean };
    }) => updateSubtask(todoId, subtaskId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteSubtask() {
  const invalidate = useInvalidateTodos();
  return useMutation({
    mutationFn: ({ todoId, subtaskId }: { todoId: number; subtaskId: number }) =>
      deleteSubtask(todoId, subtaskId),
    onSuccess: invalidate,
  });
}
