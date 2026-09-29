import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoForm } from "./TodoForm";

describe("TodoForm", () => {
  it("shows a validation error when submitting a blank title", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TodoForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /add todo/i }));

    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed title, parsed tags, and other fields", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TodoForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/todo title/i), "  Plan launch  ");
    await user.type(screen.getByLabelText(/description/i), "Kick off the release");
    await user.selectOptions(screen.getByLabelText(/priority/i), "high");
    await user.selectOptions(screen.getByLabelText(/repeat/i), "weekly");
    await user.type(screen.getByLabelText(/tags/i), "work, launch, work");
    await user.click(screen.getByRole("button", { name: /add todo/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Plan launch",
      description: "Kick off the release",
      priority: "high",
      due_date: null,
      recurrence: "weekly",
      tags: ["work", "launch", "work"],
    });
  });

  it("resets the form after a successful create submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TodoForm onSubmit={onSubmit} />);

    const titleInput = screen.getByLabelText(/todo title/i);
    await user.type(titleInput, "Task one");
    await user.click(screen.getByRole("button", { name: /add todo/i }));

    expect(titleInput).toHaveValue("");
  });

  it("does not reset the form when editing (initialValues supplied)", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <TodoForm
        submitLabel="Save"
        initialValues={{ title: "Existing" }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(screen.getByLabelText(/todo title/i)).toHaveValue("Existing");
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<TodoForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
