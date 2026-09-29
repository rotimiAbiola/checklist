import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodoList } from "./TodoList";
import { computeReorderedIds } from "../lib/reorder";
import { makeTodo } from "../test/mocks/data";

const noop = vi.fn();

function baseProps() {
  return {
    onToggle: noop,
    onUpdate: noop,
    onDelete: noop,
    editingId: null,
    onStartEdit: noop,
    onCancelEdit: noop,
    onAddSubtask: noop,
    onToggleSubtask: noop,
    onDeleteSubtask: noop,
  };
}

describe("computeReorderedIds", () => {
  const todos = [makeTodo({ id: 1 }), makeTodo({ id: 2 }), makeTodo({ id: 3 })];

  it("moves the active item to the position of the target item", () => {
    expect(computeReorderedIds(todos, 1, 3)).toEqual([2, 3, 1]);
  });

  it("returns the original order when active and over are the same", () => {
    expect(computeReorderedIds(todos, 2, 2)).toEqual([1, 2, 3]);
  });

  it("returns the original order when either id is unknown", () => {
    expect(computeReorderedIds(todos, 1, 999)).toEqual([1, 2, 3]);
  });
});

describe("TodoList", () => {
  it("shows the empty state when there are no todos", () => {
    render(<TodoList todos={[]} {...baseProps()} />);
    expect(screen.getByText(/no todos match/i)).toBeInTheDocument();
  });

  it("renders one item per todo, in order", () => {
    const todos = [makeTodo({ id: 1, title: "First" }), makeTodo({ id: 2, title: "Second" })];
    render(<TodoList todos={todos} {...baseProps()} />);
    const items = screen.getAllByTestId("todo-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("First");
    expect(items[1]).toHaveTextContent("Second");
  });

  it("renders the edit form only for the todo matching editingId", () => {
    const todos = [makeTodo({ id: 1, title: "First" }), makeTodo({ id: 2, title: "Second" })];
    render(<TodoList todos={todos} {...baseProps()} editingId={2} />);

    expect(screen.queryAllByLabelText(/todo title/i)).toHaveLength(1);
    expect(screen.getByLabelText(/todo title/i)).toHaveValue("Second");
  });

  it("applies a focus ring to the todo at focusedIndex", () => {
    const todos = [makeTodo({ id: 1, title: "First" }), makeTodo({ id: 2, title: "Second" })];
    render(<TodoList todos={todos} {...baseProps()} focusedIndex={1} />);
    const items = screen.getAllByTestId("todo-item");
    expect(items[0]).not.toHaveClass("ring-violet-300");
    expect(items[1]).toHaveClass("ring-violet-300");
  });

  it("shows drag handles when dragEnabled is true", () => {
    const todos = [makeTodo({ id: 1, title: "First" })];
    render(<TodoList todos={todos} {...baseProps()} dragEnabled onReorder={vi.fn()} />);
    expect(screen.getByLabelText(/drag to reorder/i)).toBeInTheDocument();
  });
});
