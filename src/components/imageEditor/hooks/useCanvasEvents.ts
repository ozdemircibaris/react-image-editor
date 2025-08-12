import { useEffect } from "react";
import type { CustomFabricPath } from "../types";

export const useCanvasEvents = (
  canvas: fabric.Canvas | null,
  isDrawing: boolean,
  handleObjectSelection: (e: any) => void,
  handleObjectDeselection: () => void,
  saveState: () => void,
  undo: () => void,
  redo: () => void,
  handleDeleteObject: () => void,
) => {
  // Mark drawn paths so they can be identified
  useEffect(() => {
    if (!canvas) return;

    const handlePathCreated = (e: fabric.IEvent<Event>) => {
      const path = (e as any).path as fabric.Path;
      if (path) {
        (path as CustomFabricPath).isDrawing = true;
        path.set({
          selectable: !isDrawing,
          evented: !isDrawing,
        });
      }
    };

    canvas.on("path:created", handlePathCreated);

    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, isDrawing]);

  // Add selection event listeners
  useEffect(() => {
    if (!canvas) return;

    canvas.on("selection:created", handleObjectSelection);
    canvas.on("selection:updated", handleObjectSelection);
    canvas.on("selection:cleared", handleObjectDeselection);

    return () => {
      canvas.off("selection:created", handleObjectSelection);
      canvas.off("selection:updated", handleObjectSelection);
      canvas.off("selection:cleared", handleObjectDeselection);
    };
  }, [canvas, handleObjectSelection, handleObjectDeselection]);

  // Add undo/redo event listeners for state saving
  useEffect(() => {
    if (!canvas) return;

    const handleObjectChange = () => {
      saveState();
    };

    // Save state when objects are modified
    canvas.on("object:modified", handleObjectChange);
    canvas.on("object:added", handleObjectChange);
    canvas.on("object:removed", handleObjectChange);
    canvas.on("path:created", handleObjectChange);

    return () => {
      canvas.off("object:modified", handleObjectChange);
      canvas.off("object:added", handleObjectChange);
      canvas.off("object:removed", handleObjectChange);
      canvas.off("path:created", handleObjectChange);
    };
  }, [canvas, saveState]);

  // Add keyboard shortcuts for undo/redo and delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDeleteObject();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo, handleDeleteObject]);
};
