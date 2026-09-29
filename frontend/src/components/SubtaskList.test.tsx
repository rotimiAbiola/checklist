import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubtaskList } from "./SubtaskList";
import { makeSubtask } from "../test/mocks/data";

describe("SubtaskList", () => {
  it("renders each subtask's title", () => {
    render(
      <SubtaskList
        subtasks={[makeSubtask({ id: 1, title: "Book flights" }), makeSubtask({ id: 2, title: "Pack bags" })]}
        onAdd={vi.fn()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Book flights")).toBeInTheDocument();
    expect(screen.getByText("Pack bags")).toBeInTheDocument();
  });

  it("calls onAdd with the trimmed title and clears the input", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<SubtaskList subtasks={[]} onAdd={onAdd} onToggle={vi.fn()} onDelete={vi.fn()} />);

    const input = screen.getByLabelText(/new subtask title/i);
    await user.type(input, "  Buy tickets  ");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(onAdd).toHaveBeenCalledWith("Buy tickets");
    expect(input).toHaveValue("");
  });

  it("does not call onAdd for a blank title", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<SubtaskList subtasks={[]} onAdd={onAdd} onToggle={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^add$/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("calls onToggle when a subtask checkbox is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <SubtaskList
        subtasks={[makeSubtask({ id: 3, title: "Task", completed: false })]}
        onAdd={vi.fn()}
        onToggle={onToggle}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith(3, true);
  });

  it("calls onDelete when the remove button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <SubtaskList
        subtasks={[makeSubtask({ id: 3, title: "Task" })]}
        onAdd={vi.fn()}
        onToggle={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByLabelText(/delete subtask "task"/i));
    expect(onDelete).toHaveBeenCalledWith(3);
  });
});
