import { fabric } from "fabric";
import { useCallback, useRef, useState } from "react";

import type { Bounds, EditorFabricImage, UseCropReturn } from "../types";
import {
  getImageBounds,
  lockImage,
  calculateFitScale,
  calculateCenterPosition,
  createTempCanvas,
  CleanupManager,
  createCropOverlays,
  createCropRect,
  createCropLabel,
  updateCropLabel,
  constrainCropRectInside,
  limitCropRectScale,
  calculateCropCoordinates,
} from "../utils";

// ============================================================================
// Types
// ============================================================================

interface UseCropOptions {
  /** Callback when crop is applied */
  onCropApply?: (newImage: fabric.Image) => void;
  /** Callback when crop is cancelled */
  onCropCancel?: () => void;
  /** Callback when crop mode starts */
  onCropStart?: () => void;
}

interface CropState {
  cropRect: fabric.Rect | null;
  overlays: fabric.Rect[];
  label: fabric.Textbox | null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing image cropping
 *
 * @example
 * ```tsx
 * const crop = useCrop(canvasRef, imageRef, setImageRef, {
 *   onCropApply: (newImg) => {
 *     initializeHistory();
 *     saveState();
 *   }
 * });
 *
 * // Start crop mode
 * crop.startCrop();
 *
 * // Apply crop
 * await crop.applyCrop();
 *
 * // Cancel crop
 * crop.cancelCrop();
 * ```
 */
export function useCrop(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  imageRef: React.MutableRefObject<fabric.Image | null>,
  setImage: (img: fabric.Image | null) => void,
  options: UseCropOptions = {}
): UseCropReturn {
  const { onCropApply, onCropCancel, onCropStart } = options;

  // State
  const [isCropping, setIsCropping] = useState(false);
  const [cropBounds, setCropBounds] = useState<Bounds | null>(null);

  // Refs
  const cropStateRef = useRef<CropState>({
    cropRect: null,
    overlays: [],
    label: null,
  });
  const cleanupRef = useRef(new CleanupManager());

  /**
   * Start crop mode
   */
  const startCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const originalImage = imageRef.current;

    if (!canvas || !originalImage) return;

    const imgBounds = getImageBounds(originalImage);
    if (!imgBounds) return;

    setIsCropping(true);
    onCropStart?.();

    // Create overlays
    const overlays = createCropOverlays(
      canvas.getWidth(),
      canvas.getHeight(),
      imgBounds
    );
    overlays.forEach((overlay) => canvas.add(overlay));

    // Create crop rectangle
    const cropRect = createCropRect(imgBounds);
    canvas.add(cropRect);

    // Create label
    const label = createCropLabel(cropRect);
    canvas.add(label);

    // Set active object
    canvas.setActiveObject(cropRect);

    // Store references
    cropStateRef.current = { cropRect, overlays, label };

    // Update crop bounds
    setCropBounds({
      left: cropRect.left || 0,
      top: cropRect.top || 0,
      width: cropRect.getScaledWidth(),
      height: cropRect.getScaledHeight(),
    });

    // Event handlers
    const onMoving = (): void => {
      constrainCropRectInside(cropRect, imgBounds);
      const { width, height } = updateCropLabel(label, cropRect);
      setCropBounds({
        left: cropRect.left || 0,
        top: cropRect.top || 0,
        width,
        height,
      });
      canvas.requestRenderAll();
    };

    const onScaling = (): void => {
      constrainCropRectInside(cropRect, imgBounds);
      const { width, height } = updateCropLabel(label, cropRect);
      setCropBounds({
        left: cropRect.left || 0,
        top: cropRect.top || 0,
        width,
        height,
      });
      limitCropRectScale(cropRect, imgBounds);
      constrainCropRectInside(cropRect, imgBounds);
      canvas.requestRenderAll();
    };

    cropRect.on("moving", onMoving);
    cropRect.on("scaling", onScaling);

    canvas.renderAll();
  }, [canvasRef, imageRef, onCropStart]);

  /**
   * Apply the current crop
   */
  const applyCrop = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current;
    const originalImage = imageRef.current;
    const { cropRect } = cropStateRef.current;

    if (!canvas || !originalImage || !cropRect) return;

    const cleanup = cleanupRef.current;
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

    // Calculate crop coordinates
    const coords = calculateCropCoordinates(
      cropRect,
      originalImage,
      vpt as number[]
    );

    // Create cropped image
    const imgElement = originalImage.getElement() as HTMLImageElement;
    const { canvas: croppedCanvas, ctx } = createTempCanvas(
      coords.width,
      coords.height,
      cleanup
    );

    if (!ctx) {
      cleanup.cleanup();
      return;
    }

    ctx.drawImage(
      imgElement,
      coords.x,
      coords.y,
      coords.width,
      coords.height,
      0,
      0,
      coords.width,
      coords.height
    );

    const croppedDataUrl = croppedCanvas.toDataURL();

    // Load cropped image
    return new Promise<void>((resolve) => {
      fabric.Image.fromURL(croppedDataUrl, (img) => {
        const { cropRect: activeRect, overlays, label } = cropStateRef.current;

        // Capture the old image transform before removing it, so existing
        // annotations (shapes, text, drawings) can be remapped onto the crop.
        const oldImgLeft = originalImage.left || 0;
        const oldImgTop = originalImage.top || 0;
        const oldScaleX = originalImage.scaleX || 1;
        const oldScaleY = originalImage.scaleY || 1;

        // Top-left of the crop region in canvas (object) coordinates.
        const cropOriginLeft = oldImgLeft + coords.x * oldScaleX;
        const cropOriginTop = oldImgTop + coords.y * oldScaleY;

        // Remove only the original image and crop UI; keep annotations.
        const cropUi = [activeRect, ...overlays, label].filter(
          Boolean
        ) as fabric.Object[];
        const annotations = canvas
          .getObjects()
          .filter((obj) => obj !== originalImage && !cropUi.includes(obj));
        [originalImage, ...cropUi].forEach((obj) => canvas.remove(obj));

        // Calculate scale and position for new image
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const scale = calculateFitScale(
          croppedCanvas.width,
          croppedCanvas.height,
          canvasWidth,
          canvasHeight,
          24
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
        // Store cropped dimensions as new original for export
        (img as EditorFabricImage).originalWidth = coords.width;
        (img as EditorFabricImage).originalHeight = coords.height;
        lockImage(img);

        canvas.add(img);
        img.setCoords();
        canvas.sendToBack(img);

        // Remap annotations from the old image space onto the cropped image
        // so they stay aligned with the underlying content.
        const factorX = scale / oldScaleX;
        const factorY = scale / oldScaleY;
        annotations.forEach((obj) => {
          obj.set({
            left: position.x + ((obj.left || 0) - cropOriginLeft) * factorX,
            top: position.y + ((obj.top || 0) - cropOriginTop) * factorY,
            scaleX: (obj.scaleX || 1) * factorX,
            scaleY: (obj.scaleY || 1) * factorY,
          });
          obj.setCoords();
        });

        // Update state
        setImage(img);
        setIsCropping(false);
        setCropBounds(null);

        // Clear crop state
        cropStateRef.current = { cropRect: null, overlays: [], label: null };

        // Cleanup
        cleanup.disposeCanvas(croppedCanvas);

        canvas.renderAll();
        onCropApply?.(img);
        resolve();
      });
    });
  }, [canvasRef, imageRef, setImage, onCropApply]);

  /**
   * Cancel crop mode
   */
  const cancelCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const { cropRect, overlays, label } = cropStateRef.current;

    if (!canvas) return;

    // Remove crop elements
    const toRemove = [cropRect, ...overlays, label].filter(
      Boolean
    ) as fabric.Object[];
    toRemove.forEach((obj) => canvas.remove(obj));

    // Clear state
    cropStateRef.current = { cropRect: null, overlays: [], label: null };
    setIsCropping(false);
    setCropBounds(null);

    canvas.discardActiveObject();
    canvas.renderAll();

    onCropCancel?.();
  }, [canvasRef, onCropCancel]);

  return {
    isCropping,
    startCrop,
    applyCrop,
    cancelCrop,
    cropBounds,
  };
}

export default useCrop;
