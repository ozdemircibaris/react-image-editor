import { fabric } from "fabric";
import type { Bounds, CanvasSize, EditorFabricImage } from "../types";

/**
 * Calculate responsive canvas size based on viewport
 */
export function calculateCanvasSize(
  viewportWidth: number,
  viewportHeight: number,
  options: {
    mobileBreakpoint?: number;
    tabletBreakpoint?: number;
    mobileMargin?: number;
    tabletMargin?: number;
    desktopMargin?: number;
    mobileAspectRatio?: number;
    defaultAspectRatio?: number;
    minWidth?: number;
    minHeight?: number;
  } = {}
): CanvasSize {
  const {
    mobileBreakpoint = 768,
    tabletBreakpoint = 1024,
    mobileMargin = 8,
    tabletMargin = 100,
    desktopMargin = 200,
    mobileAspectRatio = 1,
    defaultAspectRatio = 16 / 9,
    minWidth = 200,
    minHeight = 120,
  } = options;

  const isMobile = viewportWidth <= mobileBreakpoint;
  const isTablet = viewportWidth > mobileBreakpoint && viewportWidth <= tabletBreakpoint;

  let margin: number;
  let aspectRatio: number;

  if (isMobile) {
    margin = mobileMargin;
    aspectRatio = mobileAspectRatio;
  } else if (isTablet) {
    margin = tabletMargin;
    aspectRatio = defaultAspectRatio;
  } else {
    margin = desktopMargin;
    aspectRatio = defaultAspectRatio;
  }

  const maxWidth = Math.max(0, viewportWidth - margin * 2);
  const maxHeight = Math.max(0, viewportHeight - margin);

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  width = Math.max(width, minWidth);
  height = Math.max(height, minHeight);

  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
}

/**
 * Get bounds of an image on canvas
 */
export function getImageBounds(image: fabric.Image | null): Bounds | null {
  if (!image) return null;

  return {
    left: image.left || 0,
    top: image.top || 0,
    width: image.getScaledWidth(),
    height: image.getScaledHeight(),
  };
}

/**
 * Calculate scale to fit image within bounds with padding
 */
export function calculateFitScale(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 24
): number {
  const maxWidth = canvasWidth - padding * 2;
  const maxHeight = canvasHeight - padding * 2;

  const scaleX = maxWidth / imageWidth;
  const scaleY = maxHeight / imageHeight;

  return Math.min(scaleX, scaleY, 1);
}

/**
 * Calculate center position for an object on canvas
 */
export function calculateCenterPosition(
  objectWidth: number,
  objectHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: (canvasWidth - objectWidth) / 2,
    y: (canvasHeight - objectHeight) / 2,
  };
}

/**
 * Lock an image object to prevent user manipulation
 */
export function lockImage(image: fabric.Image): void {
  image.set({
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    lockUniScaling: true,
  });
}

/**
 * Create a locked original image from URL
 */
export function loadImageToCanvas(
  canvas: fabric.Canvas,
  imageUrl: string,
  padding: number = 24
): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        if (!img || !img.width || !img.height) {
          reject(new Error("Failed to load image"));
          return;
        }

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const scale = calculateFitScale(
          img.width,
          img.height,
          canvasWidth,
          canvasHeight,
          padding
        );

        img.scale(scale);

        const scaledWidth = img.getScaledWidth();
        const scaledHeight = img.getScaledHeight();
        const position = calculateCenterPosition(
          scaledWidth,
          scaledHeight,
          canvasWidth,
          canvasHeight
        );

        img.set({
          left: position.x,
          top: position.y,
          originX: "left",
          originY: "top",
        });

        (img as EditorFabricImage).id = "originalImage";
        lockImage(img);

        canvas.add(img);
        canvas.renderAll();

        resolve(img);
      },
      { crossOrigin: "anonymous" }
    );
  });
}

/**
 * Clamp zoom level within bounds
 */
export function clampZoom(
  zoom: number,
  minZoom: number = 0.2,
  maxZoom: number = 4
): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

/**
 * Animate zoom to target level
 */
export function animateZoomTo(
  canvas: fabric.Canvas,
  targetZoom: number,
  duration: number = 220,
  minZoom: number = 0.2,
  maxZoom: number = 4
): void {
  const clampedTarget = clampZoom(targetZoom, minZoom, maxZoom);
  const startZoom = canvas.getZoom();
  const startTime = performance.now();
  const centerPoint = new fabric.Point(
    canvas.getWidth() / 2,
    canvas.getHeight() / 2
  );

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

  const step = (now: number): void => {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    const eased = easeOutCubic(t);
    const currentZoom = startZoom + (clampedTarget - startZoom) * eased;

    canvas.zoomToPoint(centerPoint, currentZoom);
    canvas.requestRenderAll();

    if (t < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

/**
 * Get viewport center point in canvas coordinates
 */
export function getViewportCenter(canvas: fabric.Canvas): fabric.Point {
  const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
  const inverted = fabric.util.invertTransform(vpt as number[]);
  const screenCenter = new fabric.Point(
    canvas.getWidth() / 2,
    canvas.getHeight() / 2
  );

  return fabric.util.transformPoint(screenCenter, inverted);
}

/**
 * Calculate intersection between two rectangles
 */
export function calculateIntersection(
  rect1: Bounds,
  rect2: Bounds
): Bounds | null {
  const left = Math.max(rect1.left, rect2.left);
  const top = Math.max(rect1.top, rect2.top);
  const right = Math.min(rect1.left + rect1.width, rect2.left + rect2.width);
  const bottom = Math.min(rect1.top + rect1.height, rect2.top + rect2.height);

  const width = right - left;
  const height = bottom - top;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { left, top, width, height };
}

/**
 * Convert canvas coordinates to image pixel coordinates
 */
export function canvasToImageCoords(
  canvasX: number,
  canvasY: number,
  image: fabric.Image
): { x: number; y: number } {
  const imgLeft = image.left || 0;
  const imgTop = image.top || 0;
  const scaleX = image.scaleX || 1;
  const scaleY = image.scaleY || 1;

  return {
    x: (canvasX - imgLeft) / scaleX,
    y: (canvasY - imgTop) / scaleY,
  };
}

/**
 * Convert image pixel coordinates to canvas coordinates
 */
export function imageToCanvasCoords(
  imageX: number,
  imageY: number,
  image: fabric.Image
): { x: number; y: number } {
  const imgLeft = image.left || 0;
  const imgTop = image.top || 0;
  const scaleX = image.scaleX || 1;
  const scaleY = image.scaleY || 1;

  return {
    x: imgLeft + imageX * scaleX,
    y: imgTop + imageY * scaleY,
  };
}

/**
 * Export canvas region to data URL
 */
export function exportCanvasRegion(
  canvas: fabric.Canvas,
  bounds: Bounds,
  format: string = "png",
  quality: number = 1
): string {
  return canvas.toDataURL({
    format,
    quality,
    left: Math.round(bounds.left),
    top: Math.round(bounds.top),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
    multiplier: 1,
  });
}

/**
 * Convert data URL to Blob
 */
export async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const response = await fetch(dataURL);
  return response.blob();
}
