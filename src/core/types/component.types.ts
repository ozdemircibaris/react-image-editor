import type { ImageEditorConfig } from "./config.types";
import type { UseImageEditorReturn } from "./hooks.types";

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
