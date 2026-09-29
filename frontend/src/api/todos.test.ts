import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../test/mocks/server";
import { resetStore } from "../test/mocks/handlers";
import { makeTodo } from "../test/mocks/data";
import { ApiError } from "./client";
import { createTodo, deleteTodo, fetchStats, fetchTodos, updateTodo } from "./todos";

describe("todos api", () => {
  it("fetchTodos sends the expected query params", async () => {
    let capturedUrl = "";
    server.use(
      http.get("http://localhost:8000/api/todos", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    await fetchTodos({ search: "milk", status: "active", priority: "high", sortBy: "title", order: "desc" });

    const params = new URL(capturedUrl).searchParams;
    expect(params.get("search")).toBe("milk");
    expect(params.get("completed")).toBe("false");
    expect(params.get("priority")).toBe("high");
    expect(params.get("sort_by")).toBe("title");
    expect(params.get("order")).toBe("desc");
  });

  it("createTodo posts the payload and returns the created todo", async () => {
    const todo = await createTodo({ title: "New task" });
    expect(todo.title).toBe("New task");
    expect(todo.id).toBeDefined();
  });

  it("updateTodo sends a PATCH with the partial payload", async () => {
    resetStore([makeTodo({ id: 1, title: "Task" })]);
    const updated = await updateTodo(1, { completed: true });
    expect(updated.completed).toBe(true);
  });

  it("deleteTodo resolves without a body on success", async () => {
    resetStore([makeTodo({ id: 1 })]);
    await expect(deleteTodo(1)).resolves.toBeUndefined();
  });

  it("fetchStats returns aggregate counts", async () => {
    resetStore([makeTodo({ id: 1, completed: true }), makeTodo({ id: 2, completed: false })]);
    const stats = await fetchStats();
    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
  });

  it("throws an ApiError with the server detail message on failure", async () => {
    server.use(
      http.post("http://localhost:8000/api/todos", () =>
        HttpResponse.json({ detail: "title must not be blank" }, { status: 422 }),
      ),
    );

    await expect(createTodo({ title: "" })).rejects.toMatchObject({
      name: "ApiError",
      message: "title must not be blank",
    });
  });

  it("throws ApiError with status 404 when updating a missing todo", async () => {
    await expect(updateTodo(999, { completed: true })).rejects.toBeInstanceOf(ApiError);
  });
});
