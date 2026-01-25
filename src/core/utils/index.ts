// Canvas utilities
export {
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
} from "./canvas";

// Memory management utilities
export {
  CleanupManager,
  createTempCanvas,
  disposeFabricCanvas,
  clearCanvasObjects,
  createDebouncedFunction,
  createThrottledFunction,
  safeRequestAnimationFrame,
  addTrackedEventListener,
} from "./memory";

// Crop utilities
export {
  createCropOverlays,
  createCropRect,
  createCropLabel,
  updateCropLabel,
  constrainCropRectInside,
  limitCropRectScale,
  calculateCropCoordinates,
} from "./crop";

// Validation utilities
export {
  SUPPORTED_IMAGE_TYPES,
  validateImageFile,
  createValidatedImageURL,
} from "./validation";
export type {
  SupportedImageType,
  ImageValidationResult,
} from "./validation";
