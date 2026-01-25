import type { fabric } from "fabric";

// ============================================================================
// State Types
// ============================================================================

/**
 * Current state of the editor
 */
export interface EditorState {
  /** Whether an image is loaded */
  hasImage: boolean;
  /** Whether the editor is in drawing mode */
  isDrawing: boolean;
  /** Whether the editor is in crop mode */
  isCropping: boolean;
  /** Whether the editor is in select mode */
  isSelectMode: boolean;
  /** Currently selected Fabric object */
  selectedObject: fabric.Object | null;
  /** Current stroke color */
  currentColor: string;
  /** Current stroke width */
  currentStrokeWidth: number;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Current zoom level */
  zoom: number;
}

/**
 * History state for a single canvas snapshot
 */
export interface HistoryState {
  json: string;
  timestamp: number;
}
