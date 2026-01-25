import { useEffect } from "react";

import { CleanupManager, addTrackedEventListener } from "../utils";

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  canDelete?: () => boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing keyboard shortcuts in the image editor
 *
 * Shortcuts:
 * - Ctrl/Cmd + Z: Undo
 * - Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
 * - Delete/Backspace: Delete selected object
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onUndo: history.undo,
 *   onRedo: history.redo,
 *   onDelete: selection.deleteSelected,
 *   canDelete: () => !!selection.selectedObject,
 * });
 * ```
 */
export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers
): void {
  const { onUndo, onRedo, onDelete, canDelete } = handlers;

  useEffect(() => {
    const cleanup = new CleanupManager();

    const onKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        onRedo?.();
      }

      // Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA";

        if (!isInputFocused && canDelete?.()) {
          e.preventDefault();
          onDelete?.();
        }
      }
    };

    addTrackedEventListener(window, "keydown", onKeyDown, cleanup);

    return () => {
      cleanup.cleanup();
    };
  }, [onUndo, onRedo, onDelete, canDelete]);
}

export default useKeyboardShortcuts;
