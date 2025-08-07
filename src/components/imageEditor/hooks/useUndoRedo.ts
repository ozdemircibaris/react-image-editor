import { fabric } from "fabric";
import { useCallback, useState, useRef } from "react";

interface CanvasState {
  json: string;
  timestamp: number;
}

export const useUndoRedo = (
  canvas: fabric.Canvas | null,
  maxHistorySize: number = 50,
  onAfterStateLoad?: () => void,
) => {
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isUndoRedoOperation = useRef(false);
  const lastSaveTime = useRef(0);

  // Save current canvas state to history
  const saveState = useCallback(() => {
    if (!canvas || isUndoRedoOperation.current) return;

    // Throttle saves to prevent too many states during rapid changes
    const now = Date.now();
    if (now - lastSaveTime.current < 300) return; // 300ms throttle
    lastSaveTime.current = now;

    const canvasJson = JSON.stringify(
      canvas.toJSON([
        "id",
        "isBlurPatch",
        "blurRectId",
        "isDrawing",
        "selectable",
        "evented",
        "hasControls",
        "hasBorders",
        "lockMovementX",
        "lockMovementY",
        "lockRotation",
        "lockScalingX",
        "lockScalingY",
        "lockUniScaling",
      ]),
    );

    const newState: CanvasState = {
      json: canvasJson,
      timestamp: now,
    };

    setHistory((prevHistory) => {
      setCurrentIndex((prevIndex) => {
        const newHistory = [...prevHistory.slice(0, prevIndex + 1), newState];

        // Keep only the last maxHistorySize states
        if (newHistory.length > maxHistorySize) {
          const trimmedHistory = newHistory.slice(-maxHistorySize);
          return trimmedHistory.length - 1;
        }

        return newHistory.length - 1;
      });

      const newHistory = [...prevHistory.slice(0, currentIndex + 1), newState];
      return newHistory.length > maxHistorySize ? newHistory.slice(-maxHistorySize) : newHistory;
    });
  }, [canvas, currentIndex, maxHistorySize]);

  // Undo operation
  const undo = useCallback(() => {
    if (!canvas || currentIndex <= 0) return;

    isUndoRedoOperation.current = true;

    const newIndex = currentIndex - 1;
    const targetState = history[newIndex];

    if (targetState) {
      canvas.loadFromJSON(targetState.json, () => {
        canvas.renderAll();
        setCurrentIndex(newIndex);
        isUndoRedoOperation.current = false;
        // Call the callback to update originalImage reference
        if (onAfterStateLoad) {
          onAfterStateLoad();
        }
      });
    } else {
      isUndoRedoOperation.current = false;
    }
  }, [canvas, currentIndex, history, onAfterStateLoad]);

  // Redo operation
  const redo = useCallback(() => {
    if (!canvas || currentIndex >= history.length - 1) return;

    isUndoRedoOperation.current = true;

    const newIndex = currentIndex + 1;
    const targetState = history[newIndex];

    if (targetState) {
      canvas.loadFromJSON(targetState.json, () => {
        canvas.renderAll();
        setCurrentIndex(newIndex);
        isUndoRedoOperation.current = false;
        // Call the callback to update originalImage reference
        if (onAfterStateLoad) {
          onAfterStateLoad();
        }
      });
    } else {
      isUndoRedoOperation.current = false;
    }
  }, [canvas, currentIndex, history, onAfterStateLoad]);

  // Clear history (useful when loading a new image)
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Initialize with current canvas state
  const initializeHistory = useCallback(() => {
    if (!canvas) return;

    const initialJson = JSON.stringify(
      canvas.toJSON([
        "id",
        "isBlurPatch",
        "blurRectId",
        "isDrawing",
        "selectable",
        "evented",
        "hasControls",
        "hasBorders",
        "lockMovementX",
        "lockMovementY",
        "lockRotation",
        "lockScalingX",
        "lockScalingY",
        "lockUniScaling",
      ]),
    );

    const initialState: CanvasState = {
      json: initialJson,
      timestamp: Date.now(),
    };

    setHistory([initialState]);
    setCurrentIndex(0);
  }, [canvas]);

  // Check if undo is available
  const canUndo = currentIndex > 0;

  // Check if redo is available
  const canRedo = currentIndex < history.length - 1;

  return {
    saveState,
    undo,
    redo,
    clearHistory,
    initializeHistory,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
  };
};
