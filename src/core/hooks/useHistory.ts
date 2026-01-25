import { fabric } from "fabric";
import { useCallback, useReducer, useRef } from "react";

import type { HistoryState, UseHistoryReturn } from "../types";

// ============================================================================
// Types
// ============================================================================

interface HistoryReducerState {
  history: HistoryState[];
  currentIndex: number;
}

type HistoryAction =
  | { type: "PUSH"; payload: HistoryState }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "INITIALIZE"; payload: HistoryState }
  | { type: "CLEAR" };

interface UseHistoryOptions {
  /** Maximum number of history states to keep (default: 50) */
  maxHistorySize?: number;
  /** Throttle delay between saves in ms (default: 300) */
  throttleMs?: number;
  /** Callback after state is loaded from history */
  onAfterStateLoad?: () => void;
  /** Custom properties to include in serialization */
  customProperties?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_HISTORY = 50;
const DEFAULT_THROTTLE_MS = 300;

const DEFAULT_CUSTOM_PROPERTIES = [
  "id",
  "isBlurPatch",
  "blurRectId",
  "isDrawing",
  "isShape",
  "shapeType",
  "isText",
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
];

// ============================================================================
// Reducer
// ============================================================================

function createHistoryReducer(maxHistorySize: number) {
  return function historyReducer(
    state: HistoryReducerState,
    action: HistoryAction
  ): HistoryReducerState {
    switch (action.type) {
      case "PUSH": {
        // Slice history up to current index, then add new state
        const newHistory = [
          ...state.history.slice(0, state.currentIndex + 1),
          action.payload,
        ];

        // Trim if exceeds max size
        const trimmedHistory =
          newHistory.length > maxHistorySize
            ? newHistory.slice(-maxHistorySize)
            : newHistory;

        return {
          history: trimmedHistory,
          currentIndex: trimmedHistory.length - 1,
        };
      }

      case "UNDO": {
        if (state.currentIndex <= 0) {
          return state;
        }
        return {
          ...state,
          currentIndex: state.currentIndex - 1,
        };
      }

      case "REDO": {
        if (state.currentIndex >= state.history.length - 1) {
          return state;
        }
        return {
          ...state,
          currentIndex: state.currentIndex + 1,
        };
      }

      case "INITIALIZE": {
        return {
          history: [action.payload],
          currentIndex: 0,
        };
      }

      case "CLEAR": {
        return {
          history: [],
          currentIndex: -1,
        };
      }

      default:
        return state;
    }
  };
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing canvas undo/redo history
 *
 * @example
 * ```tsx
 * const history = useHistory(canvasRef, {
 *   maxHistorySize: 50,
 *   onAfterStateLoad: () => updateImageReference()
 * });
 *
 * // Save state after changes
 * history.saveState();
 *
 * // Undo/redo
 * history.undo();
 * history.redo();
 * ```
 */
export function useHistory(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  options: UseHistoryOptions = {}
): UseHistoryReturn {
  const {
    maxHistorySize = DEFAULT_MAX_HISTORY,
    throttleMs = DEFAULT_THROTTLE_MS,
    onAfterStateLoad,
    customProperties = DEFAULT_CUSTOM_PROPERTIES,
  } = options;

  // Use reducer for atomic state updates (fixes race condition)
  const [state, dispatch] = useReducer(
    createHistoryReducer(maxHistorySize),
    { history: [], currentIndex: -1 }
  );

  // Refs for tracking operation state
  const isUndoRedoOperation = useRef(false);
  const lastSaveTime = useRef(0);

  /**
   * Serialize canvas state to JSON string
   */
  const serializeCanvas = useCallback(
    (canvas: fabric.Canvas): string => {
      return JSON.stringify(canvas.toJSON(customProperties));
    },
    [customProperties]
  );

  /**
   * Save current canvas state to history
   */
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isUndoRedoOperation.current) {
      return;
    }

    // Throttle saves
    const now = Date.now();
    if (now - lastSaveTime.current < throttleMs) {
      return;
    }
    lastSaveTime.current = now;

    const json = serializeCanvas(canvas);
    const newState: HistoryState = {
      json,
      timestamp: now,
    };

    dispatch({ type: "PUSH", payload: newState });
  }, [canvasRef, throttleMs, serializeCanvas]);

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.currentIndex <= 0) {
      return;
    }

    isUndoRedoOperation.current = true;

    const targetIndex = state.currentIndex - 1;
    const targetState = state.history[targetIndex];

    if (targetState) {
      canvas.loadFromJSON(targetState.json, () => {
        canvas.renderAll();
        dispatch({ type: "UNDO" });
        isUndoRedoOperation.current = false;
        onAfterStateLoad?.();
      });
    } else {
      isUndoRedoOperation.current = false;
    }
  }, [canvasRef, state.currentIndex, state.history, onAfterStateLoad]);

  /**
   * Redo previously undone action
   */
  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.currentIndex >= state.history.length - 1) {
      return;
    }

    isUndoRedoOperation.current = true;

    const targetIndex = state.currentIndex + 1;
    const targetState = state.history[targetIndex];

    if (targetState) {
      canvas.loadFromJSON(targetState.json, () => {
        canvas.renderAll();
        dispatch({ type: "REDO" });
        isUndoRedoOperation.current = false;
        onAfterStateLoad?.();
      });
    } else {
      isUndoRedoOperation.current = false;
    }
  }, [canvasRef, state.currentIndex, state.history, onAfterStateLoad]);

  /**
   * Initialize history with current canvas state
   */
  const initializeHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const json = serializeCanvas(canvas);
    const initialState: HistoryState = {
      json,
      timestamp: Date.now(),
    };

    dispatch({ type: "INITIALIZE", payload: initialState });
  }, [canvasRef, serializeCanvas]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return {
    saveState,
    undo,
    redo,
    initializeHistory,
    clearHistory,
    canUndo: state.currentIndex > 0,
    canRedo: state.currentIndex < state.history.length - 1,
    historyLength: state.history.length,
    currentIndex: state.currentIndex,
  };
}

export default useHistory;
