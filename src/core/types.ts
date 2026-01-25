import type { fabric } from "fabric";

// ============================================================================
// Fabric.js Extended Types
// ============================================================================

/**
 * Extended Fabric.js Object with custom properties for the image editor
 */
export interface EditorFabricObject extends fabric.Object {
  id?: string;
  isDrawing?: boolean;
  isBlurPatch?: boolean;
  blurRectId?: string;
  isShape?: boolean;
  shapeType?: ShapeType;
}

/**
 * Extended Fabric.js Image with custom properties
 */
export interface EditorFabricImage extends fabric.Image {
  id?: string;
}

/**
 * Extended Fabric.js Canvas with custom state
 */
export interface EditorFabricCanvas extends fabric.Canvas {
  isUpdatingBlur?: boolean;
}

/**
 * Extended Fabric.js Rect for blur patches
 */
export interface EditorFabricRect extends fabric.Rect {
  id?: string;
  isBlurPatch?: boolean;
  blurRectId?: string;
}

/**
 * Extended Fabric.js Path for drawings
 */
export interface EditorFabricPath extends fabric.Path {
  isDrawing?: boolean;
}

// ============================================================================
// Core Types
// ============================================================================

export type ShapeType = "rectangle" | "circle";

export type EditorMode = "select" | "draw" | "crop" | "blur";

export type EditorTool =
  | "select"
  | "draw"
  | "crop"
  | "blur"
  | "rectangle"
  | "circle";

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for the image editor
 */
export interface ImageEditorConfig {
  /** URL of the image to edit */
  imageUrl: string;
  /** Maximum history size for undo/redo (default: 50) */
  maxHistorySize?: number;
  /** Default stroke color (default: "#ff7000") */
  defaultColor?: string;
  /** Default stroke width (default: 2) */
  defaultStrokeWidth?: number;
  /** Blur intensity in pixels (default: 20) */
  blurIntensity?: number;
  /** Throttle delay for history saves in ms (default: 300) */
  historyThrottleMs?: number;
  /** Throttle delay for blur updates in ms (default: 50) */
  blurThrottleMs?: number;
  /** Canvas padding around image in pixels (default: 24) */
  canvasPadding?: number;
}

/**
 * Canvas size configuration
 */
export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Canvas bounds for an object
 */
export interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

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

// ============================================================================
// Event Types
// ============================================================================

/**
 * Fabric.js selection event
 */
export interface FabricSelectionEvent {
  selected?: fabric.Object[];
  deselected?: fabric.Object[];
}

/**
 * Fabric.js path created event
 */
export interface FabricPathCreatedEvent {
  path?: fabric.Path;
}

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
  /** Fit image to canvas */
  fitToCanvas: () => void;
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

// ============================================================================
// Main Hook Return Type
// ============================================================================

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

// ============================================================================
// Component Props Types (for optional styled components)
// ============================================================================

/**
 * Props for the styled ImageEditor component
 */
export interface ImageEditorProps {
  /** URL of the image to edit */
  imageUrl: string;
  /** Callback when save is triggered */
  onSave: (blob: Blob) => void;
  /** Callback when cancel is triggered */
  onCancel: () => void;
  /** Editor configuration */
  config?: Partial<ImageEditorConfig>;
  /** Custom class names */
  classNames?: ImageEditorClassNames;
  /** Custom labels */
  labels?: ImageEditorLabels;
  /** Whether to show cancel button */
  showCancelButton?: boolean;
}

/**
 * Custom class names for styled components
 */
export interface ImageEditorClassNames {
  container?: string;
  header?: string;
  toolbar?: string;
  canvas?: string;
  canvasWrapper?: string;
  button?: string;
  saveButton?: string;
  cancelButton?: string;
  zoomButton?: string;
}

/**
 * Custom labels for UI elements
 */
export interface ImageEditorLabels {
  save?: string;
  cancel?: string;
  select?: string;
  draw?: string;
  crop?: string;
  blur?: string;
  rectangle?: string;
  circle?: string;
  undo?: string;
  redo?: string;
  delete?: string;
  applyCrop?: string;
  cancelCrop?: string;
  zoomIn?: string;
  zoomOut?: string;
  strokeWidth?: string;
}

// ============================================================================
// Render Props Types (for headless components)
// ============================================================================

/**
 * Render props for headless toolbar
 */
export interface ToolbarRenderProps {
  editor: UseImageEditorReturn;
  tools: {
    select: { onClick: () => void; isActive: boolean; disabled: boolean };
    draw: { onClick: () => void; isActive: boolean; disabled: boolean };
    crop: { onClick: () => void; isActive: boolean; disabled: boolean };
    blur: { onClick: () => void; isActive: boolean; disabled: boolean };
    rectangle: { onClick: () => void; isActive: boolean; disabled: boolean };
    circle: { onClick: () => void; isActive: boolean; disabled: boolean };
    undo: { onClick: () => void; disabled: boolean };
    redo: { onClick: () => void; disabled: boolean };
    delete: { onClick: () => void; disabled: boolean };
  };
  style: {
    color: string;
    strokeWidth: number;
    onColorChange: (color: string) => void;
    onStrokeWidthChange: (width: number) => void;
  };
}

/**
 * Render props for headless canvas
 */
export interface CanvasRenderProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: {
    level: number;
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
  };
  isReady: boolean;
}
