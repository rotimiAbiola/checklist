import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { resetStore } from "../test/mocks/handlers";
import { makeTodo } from "../test/mocks/data";
import { todoKeys, useReorderTodos } from "./useTodos";

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useReorderTodos", () => {
  it("optimistically reorders the cached list before the request resolves", async () => {
    const todos = [
      makeTodo({ id: 1, title: "A", position: 1 }),
      makeTodo({ id: 2, title: "B", position: 2 }),
      makeTodo({ id: 3, title: "C", position: 3 }),
    ];
    resetStore(todos);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const listKey = todoKeys.list({ status: "all" });
    queryClient.setQueryData(listKey, todos);

    const { result } = renderHook(() => useReorderTodos(), { wrapper: wrapper(queryClient) });

    result.current.mutate([3, 1, 2]);

    await waitFor(() => {
      const cached = queryClient.getQueryData<typeof todos>(listKey)!;
      expect(cached.map((t) => t.id)).toEqual([3, 1, 2]);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back the optimistic update if the request fails", async () => {
    const todos = [makeTodo({ id: 1, title: "A" }), makeTodo({ id: 2, title: "B" })];
    resetStore(todos);

    server.use(
      http.post("http://localhost:8000/api/todos/reorder", () =>
        HttpResponse.json({ detail: "boom" }, { status: 500 }),
      ),
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const listKey = todoKeys.list({ status: "all" });
    queryClient.setQueryData(listKey, todos);

    const { result } = renderHook(() => useReorderTodos(), { wrapper: wrapper(queryClient) });

    result.current.mutate([2, 1]);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<typeof todos>(listKey)!;
    expect(cached.map((t) => t.id)).toEqual([1, 2]);
  });
});
