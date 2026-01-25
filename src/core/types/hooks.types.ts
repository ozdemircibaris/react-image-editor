import type { fabric } from "fabric";

import type { Bounds } from "./config.types";
import type { EditorState } from "./state.types";
import type { ShapeType } from "./fabric.types";

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useCanvas hook
 */
export interface UseCanvasReturn {
  /** The Fabric.js canvas instance */
  canvas: fabric.Canvas | null;
  /** The original image object on canvas */
  originalImage: fabric.Image | null;
  /** Whether an image is loaded */
  hasImage: boolean;
  /** Ref to attach to canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Callback when canvas is ready */
  onCanvasReady: (canvas: fabric.Canvas) => void;
  /** Set the original image reference */
  setOriginalImage: (img: fabric.Image | null) => void;
  /** Get image bounds in canvas space */
  getImageBounds: () => Bounds | null;
  /** Export canvas to blob */
  exportToBlob: () => Promise<Blob | null>;
  /** Dispose canvas and cleanup */
  dispose: () => void;
}

/**
 * Return type for useHistory hook
 */
export interface UseHistoryReturn {
  /** Save current canvas state to history */
  saveState: () => void;
  /** Undo last action */
  undo: () => void;
  /** Redo previously undone action */
  redo: () => void;
  /** Initialize history with current canvas state */
  initializeHistory: () => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Current history length */
  historyLength: number;
  /** Current position in history */
  currentIndex: number;
}

/**
 * Return type for useBlur hook
 */
export interface UseBlurReturn {
  /** Active blur rectangles on canvas */
  activeBlurRects: fabric.Rect[];
  /** Add a new blur region */
  addBlur: () => void;
  /** Remove a specific blur region by ID */
  removeBlur: (id: string) => void;
  /** Remove all blur regions */
  clearAllBlur: () => void;
  /** Update blur effect for a rectangle */
  updateBlurEffect: (rect: fabric.Rect) => void;
}

/**
 * Return type for useCrop hook
 */
export interface UseCropReturn {
  /** Whether crop mode is active */
  isCropping: boolean;
  /** Start crop mode */
  startCrop: () => void;
  /** Apply the current crop */
  applyCrop: () => Promise<void>;
  /** Cancel crop mode */
  cancelCrop: () => void;
  /** Current crop rectangle bounds */
  cropBounds: Bounds | null;
}

/**
 * Return type for useDrawing hook
 */
export interface UseDrawingReturn {
  /** Whether drawing mode is active */
  isDrawing: boolean;
  /** Enable drawing mode */
  enableDrawing: () => void;
  /** Disable drawing mode */
  disableDrawing: () => void;
  /** Toggle drawing mode */
  toggleDrawing: () => void;
  /** Set brush color */
  setBrushColor: (color: string) => void;
  /** Set brush width */
  setBrushWidth: (width: number) => void;
}

/**
 * Return type for useShapes hook
 */
export interface UseShapesReturn {
  /** Add a rectangle shape */
  addRectangle: () => void;
  /** Add a circle shape */
  addCircle: () => void;
  /** Add a shape of specified type */
  addShape: (type: ShapeType) => void;
}

/**
 * Return type for useSelection hook
 */
export interface UseSelectionReturn {
  /** Whether select mode is active */
  isSelectMode: boolean;
  /** Currently selected object */
  selectedObject: fabric.Object | null;
  /** Enable select mode */
  enableSelectMode: () => void;
  /** Disable select mode */
  disableSelectMode: () => void;
  /** Toggle select mode */
  toggleSelectMode: () => void;
  /** Delete selected object */
  deleteSelected: () => void;
  /** Change color of selected object */
  setSelectedColor: (color: string) => void;
  /** Change stroke width of selected object */
  setSelectedStrokeWidth: (width: number) => void;
  /** Clear selection */
  clearSelection: () => void;
}

/**
 * Return type for useZoom hook
 */
export interface UseZoomReturn {
  /** Current zoom level */
  zoom: number;
  /** Zoom in by a factor */
  zoomIn: (factor?: number) => void;
  /** Zoom out by a factor */
  zoomOut: (factor?: number) => void;
  /** Set specific zoom level */
  setZoom: (level: number) => void;
  /** Reset zoom to 1 */
  resetZoom: () => void;
}

/**
 * Return type for usePan hook
 */
export interface UsePanReturn {
  /** Whether panning is enabled */
  isPanEnabled: boolean;
  /** Enable panning */
  enablePan: () => void;
  /** Disable panning */
  disablePan: () => void;
  /** Reset pan position */
  resetPan: () => void;
}

/**
 * Complete return type for useImageEditor hook
 * This is the main headless API for the image editor
 */
export interface UseImageEditorReturn {
  // Canvas
  /** The Fabric.js canvas instance */
  canvas: fabric.Canvas | null;
  /** Ref to attach to canvas element */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** The original image object */
  originalImage: fabric.Image | null;
  /** Whether an image is loaded */
  hasImage: boolean;

  // State
  /** Current editor state */
  state: EditorState;

  // History
  history: {
    /** Save current state */
    save: () => void;
    /** Undo last action */
    undo: () => void;
    /** Redo previously undone action */
    redo: () => void;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Clear all history */
    clear: () => void;
  };

  // Tools
  blur: {
    /** Add a blur region */
    add: () => void;
    /** Remove blur region by ID */
    remove: (id: string) => void;
    /** Clear all blur regions */
    clearAll: () => void;
    /** Active blur rectangles */
    activeRects: fabric.Rect[];
  };

  crop: {
    /** Start crop mode */
    start: () => void;
    /** Apply crop */
    apply: () => Promise<void>;
    /** Cancel crop */
    cancel: () => void;
    /** Whether in crop mode */
    isActive: boolean;
  };

  drawing: {
    /** Enable drawing mode */
    enable: () => void;
    /** Disable drawing mode */
    disable: () => void;
    /** Toggle drawing mode */
    toggle: () => void;
    /** Whether in drawing mode */
    isActive: boolean;
  };

  shapes: {
    /** Add rectangle */
    addRectangle: () => void;
    /** Add circle */
    addCircle: () => void;
    /** Add shape by type */
    add: (type: ShapeType) => void;
  };

  selection: {
    /** Enable select mode */
    enable: () => void;
    /** Disable select mode */
    disable: () => void;
    /** Toggle select mode */
    toggle: () => void;
    /** Delete selected object */
    deleteSelected: () => void;
    /** Currently selected object */
    selected: fabric.Object | null;
    /** Clear selection */
    clear: () => void;
    /** Whether in select mode */
    isActive: boolean;
  };

  // Style
  style: {
    /** Current color */
    color: string;
    /** Set color */
    setColor: (color: string) => void;
    /** Current stroke width */
    strokeWidth: number;
    /** Set stroke width */
    setStrokeWidth: (width: number) => void;
  };

  // Zoom & Pan
  zoom: {
    /** Current zoom level */
    level: number;
    /** Zoom in */
    in: (factor?: number) => void;
    /** Zoom out */
    out: (factor?: number) => void;
    /** Set specific zoom */
    set: (level: number) => void;
    /** Reset to 1x */
    reset: () => void;
  };

  // Export
  /** Export canvas to blob */
  exportToBlob: () => Promise<Blob | null>;
  /** Export canvas to data URL */
  exportToDataURL: (format?: string, quality?: number) => string | null;

  // Lifecycle
  /** Dispose editor and cleanup resources */
  dispose: () => void;
}
