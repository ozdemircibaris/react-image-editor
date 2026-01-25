// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration options for the image editor
 */
export interface ImageEditorConfig {
  /** URL of the image to edit */
  imageUrl: string;
  /** Canvas width in pixels (auto-calculated from viewport if not provided) */
  width?: number;
  /** Canvas height in pixels (auto-calculated from viewport if not provided) */
  height?: number;
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
