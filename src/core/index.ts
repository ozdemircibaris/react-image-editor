/**
 * @ozdemircibaris/react-image-editor - Headless Core
 *
 * This module exports the headless API for building custom image editors.
 * Use these hooks to create your own UI while leveraging the image editing logic.
 *
 * @example
 * ```tsx
 * import { useImageEditor } from '@ozdemircibaris/react-image-editor/core';
 *
 * function MyCustomEditor() {
 *   const editor = useImageEditor({
 *     imageUrl: '/path/to/image.jpg',
 *   });
 *
 *   return (
 *     <div>
 *       <canvas ref={editor.canvasRef} />
 *       <button onClick={editor.blur.add}>Add Blur</button>
 *       <button onClick={editor.crop.start}>Crop</button>
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// Hooks
// ============================================================================

export {
  // Main hook
  useImageEditor,
  // Individual hooks
  useHistory,
  useCanvas,
  useBlur,
  useCrop,
  useDrawing,
  useShapes,
  useText,
  useSelection,
  useZoom,
  useExport,
  useKeyboardShortcuts,
} from "./hooks";

// ============================================================================
// Utilities
// ============================================================================

export {
  // Canvas utilities
  calculateCanvasSize,
  getImageBounds,
  calculateFitScale,
  calculateCenterPosition,
  lockImage,
  loadImageToCanvas,
  clampZoom,
  animateZoomTo,
  getViewportCenter,
  calculateIntersection,
  canvasToImageCoords,
  imageToCanvasCoords,
  exportCanvasRegion,
  dataURLToBlob,
  // Memory management
  CleanupManager,
  createTempCanvas,
  disposeFabricCanvas,
  clearCanvasObjects,
  createDebouncedFunction,
  createThrottledFunction,
  safeRequestAnimationFrame,
  addTrackedEventListener,
  // Validation utilities
  SUPPORTED_IMAGE_TYPES,
  validateImageFile,
  createValidatedImageURL,
} from "./utils";

// ============================================================================
// Types
// ============================================================================

export type {
  // Fabric extensions
  EditorFabricObject,
  EditorFabricImage,
  EditorFabricCanvas,
  EditorFabricRect,
  EditorFabricPath,
  EditorFabricIText,
  // Core types
  ShapeType,
  EditorMode,
  EditorTool,
  // Config
  ImageEditorConfig,
  CanvasSize,
  Bounds,
  // State
  EditorState,
  HistoryState,
  // Events
  FabricSelectionEvent,
  FabricPathCreatedEvent,
  // Hook returns
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
  // Component props (for styled components)
  ImageEditorProps,
  ImageEditorClassNames,
  ImageEditorLabels,
  // Render props (for headless components)
  ToolbarRenderProps,
  CanvasRenderProps,
} from "./types";

// Validation types
export type {
  SupportedImageType,
  ImageValidationResult,
} from "./utils";
