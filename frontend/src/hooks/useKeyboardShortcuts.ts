import { useEffect, useRef } from "react";

export interface KeyboardShortcutHandlers {
  onFocusSearch: () => void;
  onFocusAdd: () => void;
  onNavigateDown: () => void;
  onNavigateUp: () => void;
  onToggleFocused: () => void;
  onEditFocused: () => void;
  onEscape: () => void;
}

function isFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled = true) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      const h = handlersRef.current;

      if (event.key === "Escape") {
        h.onEscape();
        return;
      }

      if (isFormField(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case "/":
          event.preventDefault();
          h.onFocusSearch();
          break;
        case "n":
          event.preventDefault();
          h.onFocusAdd();
          break;
        case "ArrowDown":
          event.preventDefault();
          h.onNavigateDown();
          break;
        case "ArrowUp":
          event.preventDefault();
          h.onNavigateUp();
          break;
        case "Enter":
          h.onToggleFocused();
          break;
        case "e":
          h.onEditFocused();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
