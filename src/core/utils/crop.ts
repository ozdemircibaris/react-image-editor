import { fabric } from "fabric";

import type { Bounds } from "../types";

// ============================================================================
// Crop UI Utilities
// ============================================================================

/**
 * Overlay options for crop mode darkening effect
 */
const OVERLAY_OPTIONS = {
  fill: "rgba(0, 0, 0, 0.5)",
  selectable: false,
  evented: false,
  excludeFromExport: true,
};

/**
 * Create overlay rectangles for crop mode
 * Creates 4 rectangles to darken the area outside the image bounds
 */
export function createCropOverlays(
  canvasWidth: number,
  canvasHeight: number,
  imgBounds: Bounds
): fabric.Rect[] {
  const topOverlay = new fabric.Rect({
    left: 0,
    top: 0,
    width: canvasWidth,
    height: imgBounds.top,
    ...OVERLAY_OPTIONS,
  } as fabric.IRectOptions);

  const bottomOverlay = new fabric.Rect({
    left: 0,
    top: imgBounds.top + imgBounds.height,
    width: canvasWidth,
    height: canvasHeight - (imgBounds.top + imgBounds.height),
    ...OVERLAY_OPTIONS,
  } as fabric.IRectOptions);

  const leftOverlay = new fabric.Rect({
    left: 0,
    top: imgBounds.top,
    width: imgBounds.left,
    height: imgBounds.height,
    ...OVERLAY_OPTIONS,
  } as fabric.IRectOptions);

  const rightOverlay = new fabric.Rect({
    left: imgBounds.left + imgBounds.width,
    top: imgBounds.top,
    width: canvasWidth - (imgBounds.left + imgBounds.width),
    height: imgBounds.height,
    ...OVERLAY_OPTIONS,
  } as fabric.IRectOptions);

  return [topOverlay, bottomOverlay, leftOverlay, rightOverlay];
}

/**
 * Create crop rectangle with visual styling
 */
export function createCropRect(imgBounds: Bounds): fabric.Rect {
  const cropWidth = Math.min(200, imgBounds.width * 0.8);
  const cropHeight = Math.min(150, imgBounds.height * 0.8);

  return new fabric.Rect({
    left: imgBounds.left + (imgBounds.width - cropWidth) / 2,
    top: imgBounds.top + (imgBounds.height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
    originX: "left",
    originY: "top",
    fill: "rgba(255,255,255,0.02)",
    stroke: "#60a5fa",
    strokeWidth: 2,
    strokeUniform: true,
    strokeDashArray: [6, 4],
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockRotation: true,
    minScaleLimit: 0.1,
    cornerStyle: "rect",
    cornerColor: "#ffffff",
    borderColor: "#60a5fa",
    transparentCorners: false,
    cornerSize: 12,
    padding: 2,
    objectCaching: false,
  } as fabric.IRectOptions);
}

/**
 * Create dimension label for crop rect
 */
export function createCropLabel(rect: fabric.Rect): fabric.Textbox {
  const w = Math.round(rect.getScaledWidth());
  const h = Math.round(rect.getScaledHeight());

  const label = new fabric.Textbox(`${w} × ${h}`, {
    left: rect.left || 0,
    top: (rect.top || 0) - 28,
    fontSize: 12,
    fill: "#e5e7eb",
    backgroundColor: "rgba(17,24,39,0.6)",
    padding: 6,
    textAlign: "center",
    selectable: false,
    evented: false,
  });

  (label as unknown as { excludeFromExport: boolean }).excludeFromExport = true;

  return label;
}

/**
 * Update crop label text and position
 */
export function updateCropLabel(
  label: fabric.Textbox,
  rect: fabric.Rect
): { width: number; height: number } {
  const w = Math.round(rect.getScaledWidth());
  const h = Math.round(rect.getScaledHeight());

  label.set({
    text: `${w} × ${h}`,
    left: rect.left || 0,
    top: (rect.top || 0) - 28,
  });

  return { width: w, height: h };
}

/**
 * Constrain crop rect to stay inside image bounds
 */
export function constrainCropRectInside(
  rect: fabric.Rect,
  imgBounds: Bounds
): void {
  const scaledW = rect.getScaledWidth();
  const scaledH = rect.getScaledHeight();
  let left = rect.left || 0;
  let top = rect.top || 0;

  left = Math.max(
    imgBounds.left,
    Math.min(left, imgBounds.left + imgBounds.width - scaledW)
  );
  top = Math.max(
    imgBounds.top,
    Math.min(top, imgBounds.top + imgBounds.height - scaledH)
  );

  rect.set({ left, top });
}

/**
 * Limit crop rect scale to available space
 */
export function limitCropRectScale(
  rect: fabric.Rect,
  imgBounds: Bounds
): void {
  const availableW = imgBounds.left + imgBounds.width - (rect.left || 0);
  const availableH = imgBounds.top + imgBounds.height - (rect.top || 0);
  const baseW = Math.max(1, rect.width || 1);
  const baseH = Math.max(1, rect.height || 1);

  const maxScaleX = Math.max(0.1, availableW / baseW);
  const maxScaleY = Math.max(0.1, availableH / baseH);
  const minScaleX = 24 / baseW;
  const minScaleY = 24 / baseH;

  const curScaleX = rect.scaleX || 1;
  const curScaleY = rect.scaleY || 1;

  const nextScaleX = Math.min(Math.max(curScaleX, minScaleX), maxScaleX);
  const nextScaleY = Math.min(Math.max(curScaleY, minScaleY), maxScaleY);

  if (nextScaleX !== curScaleX || nextScaleY !== curScaleY) {
    rect.set({ scaleX: nextScaleX, scaleY: nextScaleY });
  }
}

/**
 * Calculate crop coordinates in image pixel space
 */
export function calculateCropCoordinates(
  cropRect: fabric.Rect,
  image: fabric.Image,
  viewportTransform: number[]
): { x: number; y: number; width: number; height: number } {
  const inverted = fabric.util.invertTransform(viewportTransform);

  const bounds = cropRect.getBoundingRect();
  const tlScreen = new fabric.Point(bounds.left, bounds.top);
  const brScreen = new fabric.Point(
    bounds.left + bounds.width,
    bounds.top + bounds.height
  );
  const tlCanvas = fabric.util.transformPoint(tlScreen, inverted);
  const brCanvas = fabric.util.transformPoint(brScreen, inverted);

  const imgLeft = image.left || 0;
  const imgTop = image.top || 0;
  const scaleX = image.scaleX || 1;
  const scaleY = image.scaleY || 1;
  const imgW = image.width || 0;
  const imgH = image.height || 0;

  let cropX = (tlCanvas.x - imgLeft) / scaleX;
  let cropY = (tlCanvas.y - imgTop) / scaleY;
  let cropWidth = (brCanvas.x - tlCanvas.x) / scaleX;
  let cropHeight = (brCanvas.y - tlCanvas.y) / scaleY;

  // Clamp to image bounds
  cropX = Math.max(0, Math.min(cropX, imgW));
  cropY = Math.max(0, Math.min(cropY, imgH));
  cropWidth = Math.max(1, Math.min(cropWidth, imgW - cropX));
  cropHeight = Math.max(1, Math.min(cropHeight, imgH - cropY));

  return {
    x: Math.round(cropX),
    y: Math.round(cropY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}
