import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoItem } from "./TodoItem";
import { makeSubtask, makeTodo } from "../test/mocks/data";

function renderItem(overrides: Parameters<typeof makeTodo>[0] = {}, props: Record<string, unknown> = {}) {
  const todo = makeTodo(overrides);
  const handlers = {
    onToggle: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onStartEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onAddSubtask: vi.fn(),
    onToggleSubtask: vi.fn(),
    onDeleteSubtask: vi.fn(),
  };
  render(
    <ul>
      <TodoItem todo={todo} isEditing={false} {...handlers} {...props} />
    </ul>,
  );
  return { todo, ...handlers };
}

describe("TodoItem", () => {
  it("calls onToggle with the inverted completed state", async () => {
    const user = userEvent.setup();
    const { onToggle } = renderItem({ id: 5, completed: false });

    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(5, true);
  });

  it("calls onDelete with the todo id", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderItem({ id: 7, title: "Remove me" });

    await user.click(screen.getByRole("button", { name: /delete "remove me"/i }));
    expect(onDelete).toHaveBeenCalledWith(7);
  });

  it("marks overdue todos with an overdue badge", () => {
    renderItem({ due_date: "2020-01-01", completed: false });
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it("does not mark completed todos as overdue even with a past due date", () => {
    renderItem({ due_date: "2020-01-01", completed: true });
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
    expect(screen.getByText(/due /i)).toBeInTheDocument();
  });

  it("calls onStartEdit with the todo id when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const { onStartEdit } = renderItem({ id: 3, title: "Original title" });

    await user.click(screen.getByRole("button", { name: /edit "original title"/i }));
    expect(onStartEdit).toHaveBeenCalledWith(3);
  });

  it("renders the edit form and saves via onUpdate + onCancelEdit when isEditing is true", async () => {
    const user = userEvent.setup();
    const { onUpdate, onCancelEdit } = renderItem(
      { id: 3, title: "Original title" },
      { isEditing: true },
    );

    const titleInput = screen.getByLabelText(/todo title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onUpdate).toHaveBeenCalledWith(3, expect.objectContaining({ title: "Updated title" }));
    expect(onCancelEdit).toHaveBeenCalledOnce();
  });

  it("shows a recurrence badge when the todo repeats", () => {
    renderItem({ recurrence: "weekly" });
    expect(screen.getByText(/weekly/i)).toBeInTheDocument();
  });

  it("shows a subtask progress badge and toggles a subtask", async () => {
    const user = userEvent.setup();
    const { onToggleSubtask } = renderItem({
      subtasks: [
        makeSubtask({ id: 1, title: "Book flights", completed: true }),
        makeSubtask({ id: 2, title: "Pack bags", completed: false }),
      ],
    });

    await user.click(screen.getByRole("button", { name: /1\/2/ }));
    await user.click(screen.getByLabelText(/mark subtask "pack bags" as completed/i));
    expect(onToggleSubtask).toHaveBeenCalledWith(1, 2, true);
  });

  it("adds a subtask via the inline form", async () => {
    const user = userEvent.setup();
    const { onAddSubtask } = renderItem({ id: 9 });

    await user.type(screen.getByLabelText(/new subtask title/i), "New subtask");
    await user.click(screen.getByRole("button", { name: /^add$/i }));
    expect(onAddSubtask).toHaveBeenCalledWith(9, "New subtask");
  });

  it("shows a selection checkbox instead of the complete checkbox in select mode", () => {
    renderItem({ title: "Selectable" }, { selectMode: true, isSelected: false });
    expect(screen.getByLabelText(/select "selectable"/i)).toBeInTheDocument();
  });

  it("calls onToggleSelect when the selection checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggleSelect = vi.fn();
    renderItem({ id: 4, title: "Selectable" }, { selectMode: true, onToggleSelect });

    await user.click(screen.getByLabelText(/select "selectable"/i));
    expect(onToggleSelect).toHaveBeenCalledWith(4);
  });

  it("shows a drag handle when dragEnabled is true", () => {
    renderItem({ title: "Draggable" }, { dragEnabled: true });
    expect(screen.getByLabelText(/drag to reorder "draggable"/i)).toBeInTheDocument();
  });

  it("does not show a drag handle when dragEnabled is false", () => {
    renderItem({ title: "Not draggable" }, { dragEnabled: false });
    expect(screen.queryByLabelText(/drag to reorder/i)).not.toBeInTheDocument();
  });
});
