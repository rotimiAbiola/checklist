import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterBar } from "./FilterBar";
import type { TodoFilters } from "../types/todo";

describe("FilterBar", () => {
  it("calls onChange with updated search text", () => {
    const onChange = vi.fn();
    render(<FilterBar filters={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/search todos/i), { target: { value: "milk" } });
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ search: "milk" }));
  });

  it("calls onChange when a status pill is clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar filters={{ status: "all" }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }));
  });

  it("calls onChange when the priority filter changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar filters={{}} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(/filter by priority/i), "high");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ priority: "high" }));
  });

  it("calls onChange with sortBy and order when sort changes", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar filters={{}} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(/sort todos/i), "due_date:asc");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: "due_date", order: "asc" }),
    );
  });

  it("shows an active tag filter chip and clears it on click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const filters: TodoFilters = { tag: "work" };
    render(<FilterBar filters={filters} onChange={onChange} />);

    const chip = screen.getByRole("button", { name: /#work/i });
    await user.click(chip);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tag: undefined }));
  });
});
