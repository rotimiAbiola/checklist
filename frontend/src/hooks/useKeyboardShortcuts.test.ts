import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, type KeyboardShortcutHandlers } from "./useKeyboardShortcuts";

function makeHandlers(): KeyboardShortcutHandlers {
  return {
    onFocusSearch: vi.fn(),
    onFocusAdd: vi.fn(),
    onNavigateDown: vi.fn(),
    onNavigateUp: vi.fn(),
    onToggleFocused: vi.fn(),
    onEditFocused: vi.fn(),
    onEscape: vi.fn(),
  };
}

function press(key: string, target: EventTarget = window) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
}

describe("useKeyboardShortcuts", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("calls onFocusSearch on '/'", () => {
    const handlers = makeHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));
    press("/");
    expect(handlers.onFocusSearch).toHaveBeenCalledOnce();
  });

  it("calls onFocusAdd on 'n'", () => {
    const handlers = makeHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));
    press("n");
    expect(handlers.onFocusAdd).toHaveBeenCalledOnce();
  });

  it("calls onNavigateDown/onNavigateUp on arrow keys", () => {
    const handlers = makeHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));
    press("ArrowDown");
    press("ArrowUp");
    expect(handlers.onNavigateDown).toHaveBeenCalledOnce();
    expect(handlers.onNavigateUp).toHaveBeenCalledOnce();
  });

  it("calls onToggleFocused on Enter and onEditFocused on 'e'", () => {
    const handlers = makeHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));
    press("Enter");
    press("e");
    expect(handlers.onToggleFocused).toHaveBeenCalledOnce();
    expect(handlers.onEditFocused).toHaveBeenCalledOnce();
  });

  it("calls onEscape even when a form field is focused", () => {
    const handlers = makeHandlers();
    const input = document.createElement("input");
    document.body.appendChild(input);
    renderHook(() => useKeyboardShortcuts(handlers));

    press("Escape", input);
    expect(handlers.onEscape).toHaveBeenCalledOnce();
  });

  it("ignores 'n' and '/' when a form field is focused", () => {
    const handlers = makeHandlers();
    const input = document.createElement("input");
    document.body.appendChild(input);
    renderHook(() => useKeyboardShortcuts(handlers));

    press("n", input);
    press("/", input);
    expect(handlers.onFocusAdd).not.toHaveBeenCalled();
    expect(handlers.onFocusSearch).not.toHaveBeenCalled();
  });

  it("ignores shortcuts when a modifier key is held", () => {
    const handlers = makeHandlers();
    renderHook(() => useKeyboardShortcuts(handlers));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "n", metaKey: true, bubbles: true }));
    expect(handlers.onFocusAdd).not.toHaveBeenCalled();
  });

  it("does not attach a listener when disabled", () => {
    const handlers = makeHandlers();
    renderHook(() => useKeyboardShortcuts(handlers, false));
    press("/");
    expect(handlers.onFocusSearch).not.toHaveBeenCalled();
  });
});
