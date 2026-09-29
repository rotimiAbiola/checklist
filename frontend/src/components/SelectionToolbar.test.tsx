import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectionToolbar } from "./SelectionToolbar";

describe("SelectionToolbar", () => {
  it("shows the selected count", () => {
    render(
      <SelectionToolbar count={3} onComplete={vi.fn()} onDelete={vi.fn()} onAddTag={vi.fn()} onExit={vi.fn()} />,
    );
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it("disables action buttons when nothing is selected", () => {
    render(
      <SelectionToolbar count={0} onComplete={vi.fn()} onDelete={vi.fn()} onAddTag={vi.fn()} onExit={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /complete/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
  });

  it("calls onComplete and onDelete", async () => {
    const onComplete = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectionToolbar count={2} onComplete={onComplete} onDelete={onDelete} onAddTag={vi.fn()} onExit={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /complete/i }));
    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("calls onAddTag with the entered tag and clears the input", async () => {
    const onAddTag = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectionToolbar count={2} onComplete={vi.fn()} onDelete={vi.fn()} onAddTag={onAddTag} onExit={vi.fn()} />,
    );

    const input = screen.getByLabelText(/tag to add/i);
    await user.type(input, "urgent");
    await user.click(screen.getByRole("button", { name: /add tag/i }));

    expect(onAddTag).toHaveBeenCalledWith("urgent");
    expect(input).toHaveValue("");
  });

  it("calls onExit when Done is clicked", async () => {
    const onExit = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectionToolbar count={0} onComplete={vi.fn()} onDelete={vi.fn()} onAddTag={vi.fn()} onExit={onExit} />,
    );

    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
