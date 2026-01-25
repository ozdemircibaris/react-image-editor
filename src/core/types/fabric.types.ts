import type { fabric } from "fabric";

// ============================================================================
// Fabric.js Extended Types
// ============================================================================

/**
 * Shape types supported by the editor
 */
export type ShapeType = "rectangle" | "circle";

/**
 * Editor mode states
 */
export type EditorMode = "select" | "draw" | "crop" | "blur";

/**
 * Editor tool types
 */
export type EditorTool =
  | "select"
  | "draw"
  | "crop"
  | "blur"
  | "rectangle"
  | "circle";

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
