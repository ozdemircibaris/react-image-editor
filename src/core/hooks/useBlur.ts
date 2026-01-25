import { fabric } from "fabric";
import { useCallback, useRef, useState } from "react";

import type {
  EditorFabricCanvas,
  EditorFabricObject,
  EditorFabricRect,
  UseBlurReturn,
} from "../types";
import {
  getViewportCenter,
  getImageBounds,
  calculateIntersection,
  createTempCanvas,
  CleanupManager,
  createThrottledFunction,
} from "../utils";

// ============================================================================
// Types
// ============================================================================

interface UseBlurOptions {
  /** Blur intensity in pixels (default: 20) */
  blurIntensity?: number;
  /** Throttle delay for blur updates in ms (default: 50) */
  throttleMs?: number;
  /** Callback when blur is added */
  onBlurAdd?: (rect: fabric.Rect) => void;
  /** Callback when blur is removed */
  onBlurRemove?: (id: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BLUR_INTENSITY = 20;
const DEFAULT_THROTTLE_MS = 50;
const BLUR_RECT_WIDTH = 150;
const BLUR_RECT_HEIGHT = 100;

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing blur regions on the canvas
 *
 * @example
 * ```tsx
 * const blur = useBlur(canvasRef, imageRef, {
 *   blurIntensity: 20,
 *   onBlurAdd: (rect) => saveState(),
 * });
 *
 * // Add blur region
 * blur.addBlur();
 *
 * // Remove specific blur
 * blur.removeBlur('blur-123');
 *
 * // Clear all blur regions
 * blur.clearAllBlur();
 * ```
 */
export function useBlur(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  imageRef: React.MutableRefObject<fabric.Image | null>,
  options: UseBlurOptions = {}
): UseBlurReturn {
  const {
    blurIntensity = DEFAULT_BLUR_INTENSITY,
    throttleMs = DEFAULT_THROTTLE_MS,
    onBlurAdd,
    onBlurRemove,
  } = options;

  // State
  const [activeBlurRects, setActiveBlurRects] = useState<fabric.Rect[]>([]);

  // Refs for cleanup
  const cleanupRef = useRef(new CleanupManager());
  const throttledUpdatesRef = useRef<
    Map<string, { fn: () => void; cancel: () => void }>
  >(new Map());

  /**
   * Update blur effect for a specific rectangle
   */
  const updateBlurEffect = useCallback(
    (blurRect: fabric.Rect) => {
      const canvas = canvasRef.current;
      const originalImage = imageRef.current;

      if (!canvas || !originalImage) return;

      // Prevent multiple simultaneous updates
      const customCanvas = canvas as EditorFabricCanvas;
      if (customCanvas.isUpdatingBlur) return;
      customCanvas.isUpdatingBlur = true;

      const cleanup = cleanupRef.current;
      const customBlurRect = blurRect as EditorFabricRect;
      const blurRectId = customBlurRect.id;

      // Remove existing blur patch for this rect
      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        const customObj = obj as EditorFabricObject;
        if (customObj.isBlurPatch && customObj.blurRectId === blurRectId) {
          canvas.remove(obj);
        }
      });

      // Get blur rect bounds
      const rectLeft = blurRect.left || 0;
      const rectTop = blurRect.top || 0;
      const rectWidth = blurRect.getScaledWidth();
      const rectHeight = blurRect.getScaledHeight();

      // Get image bounds
      const imgBounds = getImageBounds(originalImage);
      if (!imgBounds) {
        customCanvas.isUpdatingBlur = false;
        return;
      }

      // Calculate intersection
      const intersection = calculateIntersection(
        { left: rectLeft, top: rectTop, width: rectWidth, height: rectHeight },
        imgBounds
      );

      if (!intersection) {
        // Blur rect is outside image
        blurRect.set({ visible: true });
        canvas.requestRenderAll();
        customCanvas.isUpdatingBlur = false;
        return;
      }

      // Convert intersection to image pixel coordinates
      const imgScaleX = originalImage.scaleX || 1;
      const imgScaleY = originalImage.scaleY || 1;
      const pxX = Math.round((intersection.left - imgBounds.left) / imgScaleX);
      const pxY = Math.round((intersection.top - imgBounds.top) / imgScaleY);
      const pxW = Math.round(intersection.width / imgScaleX);
      const pxH = Math.round(intersection.height / imgScaleY);

      const imgEl = originalImage.getElement() as HTMLImageElement;

      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        // Create temporary canvas for extracting image region
        const { canvas: tempCanvas, ctx: tempCtx } = createTempCanvas(
          pxW,
          pxH,
          cleanup
        );
        if (!tempCtx) {
          customCanvas.isUpdatingBlur = false;
          return;
        }

        // Draw from original image
        tempCtx.drawImage(imgEl, pxX, pxY, pxW, pxH, 0, 0, pxW, pxH);

        // Create blur canvas
        const { canvas: blurCanvas, ctx: blurCtx } = createTempCanvas(
          pxW,
          pxH,
          cleanup
        );
        if (!blurCtx) {
          cleanup.disposeCanvas(tempCanvas);
          customCanvas.isUpdatingBlur = false;
          return;
        }

        // Apply blur filter
        blurCtx.filter = `blur(${blurIntensity}px)`;
        blurCtx.drawImage(tempCanvas, 0, 0);

        // Create Fabric image from blurred canvas
        fabric.Image.fromURL(blurCanvas.toDataURL(), (blurImg) => {
          const customBlurImg = blurImg as EditorFabricObject;
          customBlurImg.set({
            left: intersection.left,
            top: intersection.top,
            originX: "left",
            originY: "top",
            scaleX: imgScaleX,
            scaleY: imgScaleY,
            selectable: false,
            evented: false,
            isBlurPatch: true,
            blurRectId: blurRectId,
            opacity: 1,
          });

          canvas.add(blurImg);
          blurRect.set({ visible: true });
          canvas.bringToFront(blurRect);
          canvas.requestRenderAll();

          // Cleanup temporary canvases
          cleanup.disposeCanvas(tempCanvas);
          cleanup.disposeCanvas(blurCanvas);

          customCanvas.isUpdatingBlur = false;
        });
      });
    },
    [canvasRef, imageRef, blurIntensity]
  );

  /**
   * Add a new blur region
   */
  const addBlur = useCallback(() => {
    const canvas = canvasRef.current;
    const originalImage = imageRef.current;

    if (!canvas || !originalImage) return;

    const cleanup = cleanupRef.current;

    // Get image bounds
    const imgBounds = getImageBounds(originalImage);
    if (!imgBounds) return;

    // Calculate position at viewport center, clamped to image bounds
    const viewportCenter = getViewportCenter(canvas);
    let blurX = viewportCenter.x - BLUR_RECT_WIDTH / 2;
    let blurY = viewportCenter.y - BLUR_RECT_HEIGHT / 2;

    // Clamp to image bounds with margin
    const margin = 20;
    blurX = Math.max(
      imgBounds.left + margin,
      Math.min(blurX, imgBounds.left + imgBounds.width - BLUR_RECT_WIDTH - margin)
    );
    blurY = Math.max(
      imgBounds.top + margin,
      Math.min(blurY, imgBounds.top + imgBounds.height - BLUR_RECT_HEIGHT - margin)
    );

    // Generate unique ID
    const blurId = `blur-${Date.now()}`;

    // Create blur rectangle
    const blurRect = new fabric.Rect({
      left: blurX,
      top: blurY,
      width: BLUR_RECT_WIDTH,
      height: BLUR_RECT_HEIGHT,
      originX: "left",
      originY: "top",
      fill: "transparent",
      stroke: "#8b5cf6",
      strokeWidth: 2,
      strokeUniform: true,
      strokeDashArray: [5, 5],
      opacity: 0.9,
      cornerColor: "#8b5cf6",
      cornerSize: 10,
      transparentCorners: false,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      selectable: true,
      evented: true,
      borderColor: "#8b5cf6",
      objectCaching: false,
    } as fabric.IRectOptions);

    // Set custom properties
    (blurRect as EditorFabricRect).id = blurId;

    // Create throttled update function for this rect
    const { fn: throttledUpdate, cancel } = createThrottledFunction(
      () => updateBlurEffect(blurRect),
      throttleMs,
      cleanup
    );

    throttledUpdatesRef.current.set(blurId, { fn: throttledUpdate, cancel });

    // Add event listeners
    blurRect.on("modified", throttledUpdate);
    blurRect.on("moving", throttledUpdate);
    blurRect.on("scaling", throttledUpdate);

    // Add to canvas and apply initial blur
    canvas.add(blurRect);
    canvas.setActiveObject(blurRect);
    updateBlurEffect(blurRect);

    // Update state
    setActiveBlurRects((prev) => [...prev, blurRect]);

    canvas.renderAll();
    onBlurAdd?.(blurRect);
  }, [canvasRef, imageRef, throttleMs, updateBlurEffect, onBlurAdd]);

  /**
   * Remove a specific blur region by ID
   */
  const removeBlur = useCallback(
    (id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Cancel throttled update
      const throttledUpdate = throttledUpdatesRef.current.get(id);
      if (throttledUpdate) {
        throttledUpdate.cancel();
        throttledUpdatesRef.current.delete(id);
      }

      // Remove blur rect and its patch
      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        const customObj = obj as EditorFabricObject;
        const customRect = obj as EditorFabricRect;

        if (customRect.id === id || customObj.blurRectId === id) {
          canvas.remove(obj);
        }
      });

      // Update state
      setActiveBlurRects((prev) =>
        prev.filter((rect) => (rect as EditorFabricRect).id !== id)
      );

      canvas.renderAll();
      onBlurRemove?.(id);
    },
    [canvasRef, onBlurRemove]
  );

  /**
   * Clear all blur regions
   */
  const clearAllBlur = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel all throttled updates
    throttledUpdatesRef.current.forEach(({ cancel }) => cancel());
    throttledUpdatesRef.current.clear();

    try {
      // Remove all blur rects and patches
      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        const customObj = obj as EditorFabricObject;
        const customRect = obj as EditorFabricRect;

        if (customRect.id?.startsWith("blur-") || customObj.isBlurPatch) {
          canvas.remove(obj);
        }
      });

      canvas.renderAll();
    } catch {
      // Canvas might be disposed
    }

    setActiveBlurRects([]);
  }, [canvasRef]);

  return {
    activeBlurRects,
    addBlur,
    removeBlur,
    clearAllBlur,
    updateBlurEffect,
  };
}

export default useBlur;
