import { fabric } from "fabric";

// Extended Fabric.js types for our custom properties
export interface CustomFabricObject extends fabric.Object {
  id?: string;
  isDrawing?: boolean;
  isBlurPatch?: boolean;
  blurRectId?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface CustomFabricImage extends fabric.Image {
  id?: string;
}

export interface CustomFabricCanvas extends fabric.Canvas {
  isUpdatingBlur?: boolean;
}

export interface CustomFabricRect extends fabric.Rect {
  id?: string;
  isBlurPatch?: boolean;
  blurRectId?: string;
}

export interface CustomFabricPath extends fabric.Path {
  isDrawing?: boolean;
}

// Event types
export interface FabricSelectionEvent {
  selected?: fabric.Object[];
  deselected?: fabric.Object[];
}

export interface FabricPathCreatedEvent {
  path?: fabric.Path;
}

// Hook return types
export interface UseBlurHandlersReturn {
  activeBlurRects: fabric.Rect[];
  setActiveBlurRects: React.Dispatch<React.SetStateAction<fabric.Rect[]>>;
  handleAddBlur: () => void;
}

export interface UseCropHandlersReturn {
  isCropping: boolean;
  setIsCropping: React.Dispatch<React.SetStateAction<boolean>>;
  handleCropStart: () => void;
  handleCropApply: () => void;
  handleCropCancel: () => void;
}

export interface UseShapeHandlersReturn {
  handleAddShape: (shapeType: "rectangle" | "circle") => void;
}

export interface UseUndoRedoReturn {
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  initializeHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// Customization types
export interface ImageEditorCustomization {
  showCancelButton?: boolean;
  className?: string;
  headerClassName?: string;
  toolbarClassName?: string;
  buttonClassName?: string;
  saveButtonClassName?: string;
  cancelButtonClassName?: string;
  canvasClassName?: string;
  canvasWrapperClassName?: string;
  zoomButtonClassName?: string;
  background?: string;
  saveButtonTitle?: string;
  cancelButtonTitle?: string;
}
