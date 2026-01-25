/**
 * Type definitions for the ImageEditor component
 *
 * Note: Core types are now in @ozdemircibaris/react-image-editor/core
 * These types are re-exported for backward compatibility
 */

// Re-export core types for backward compatibility
export type {
  EditorFabricObject as CustomFabricObject,
  EditorFabricImage as CustomFabricImage,
  EditorFabricCanvas as CustomFabricCanvas,
  EditorFabricRect as CustomFabricRect,
  EditorFabricPath as CustomFabricPath,
  FabricSelectionEvent,
  FabricPathCreatedEvent,
  ShapeType,
  ImageEditorClassNames as ImageEditorCustomization,
} from "../../core/types";

// Legacy hook return types (deprecated - use core hooks directly)
// Kept for backward compatibility
import type { fabric } from "fabric";

/** @deprecated Use UseBlurReturn from core instead */
export interface UseBlurHandlersReturn {
  activeBlurRects: fabric.Rect[];
  setActiveBlurRects: React.Dispatch<React.SetStateAction<fabric.Rect[]>>;
  handleAddBlur: () => void;
}

/** @deprecated Use UseCropReturn from core instead */
export interface UseCropHandlersReturn {
  isCropping: boolean;
  setIsCropping: React.Dispatch<React.SetStateAction<boolean>>;
  handleCropStart: () => void;
  handleCropApply: () => void;
  handleCropCancel: () => void;
}

/** @deprecated Use UseShapesReturn from core instead */
export interface UseShapeHandlersReturn {
  handleAddShape: (shapeType: "rectangle" | "circle") => void;
}

/** @deprecated Use UseHistoryReturn from core instead */
export interface UseUndoRedoReturn {
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  initializeHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
