import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast, type ToastData } from "./Toast";

describe("Toast", () => {
  it("renders nothing when toast is null", () => {
    render(<Toast toast={null} onDismiss={vi.fn()} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the message and action label", () => {
    const toast: ToastData = { id: 1, message: 'Deleted "Task"', actionLabel: "Undo", onAction: vi.fn() };
    render(<Toast toast={toast} onDismiss={vi.fn()} />);
    expect(screen.getByText('Deleted "Task"')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
  });

  it("calls onAction and onDismiss when the action is clicked", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const toast: ToastData = { id: 1, message: "Deleted", actionLabel: "Undo", onAction };
    render(<Toast toast={toast} onDismiss={onDismiss} durationMs={60_000} />);

    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("calls onDismiss when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const toast: ToastData = { id: 1, message: "Deleted" };
    render(<Toast toast={toast} onDismiss={onDismiss} durationMs={60_000} />);

    await user.click(screen.getByLabelText(/dismiss notification/i));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("auto-dismisses after the configured duration", () => {
    vi.useFakeTimers();
    try {
      const onDismiss = vi.fn();
      const toast: ToastData = { id: 1, message: "Deleted" };
      render(<Toast toast={toast} onDismiss={onDismiss} durationMs={3000} />);

      expect(onDismiss).not.toHaveBeenCalled();
      vi.advanceTimersByTime(3000);
      expect(onDismiss).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
