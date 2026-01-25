/**
 * Type definitions for the image editor
 *
 * This module re-exports all types from their respective files
 * for convenient importing.
 */

// Fabric.js extended types
export type {
  ShapeType,
  EditorMode,
  EditorTool,
  EditorFabricObject,
  EditorFabricImage,
  EditorFabricCanvas,
  EditorFabricRect,
  EditorFabricPath,
  EditorFabricIText,
  FabricSelectionEvent,
  FabricPathCreatedEvent,
} from "./fabric.types";

// Configuration types
export type { ImageEditorConfig, CanvasSize, Bounds } from "./config.types";

// State types
export type { EditorState, HistoryState } from "./state.types";

// Hook return types
export type {
  UseCanvasReturn,
  UseHistoryReturn,
  UseBlurReturn,
  UseCropReturn,
  UseDrawingReturn,
  UseShapesReturn,
  UseTextReturn,
  UseSelectionReturn,
  UseZoomReturn,
  UsePanReturn,
  UseImageEditorReturn,
} from "./hooks.types";

// Component props types
export type {
  ImageEditorProps,
  ImageEditorClassNames,
  ImageEditorLabels,
  ToolbarRenderProps,
  CanvasRenderProps,
} from "./component.types";
