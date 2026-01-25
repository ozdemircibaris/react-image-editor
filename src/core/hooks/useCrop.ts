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
   * Create overlay rectangles for crop mode
   */
  const createOverlays = useCallback(
    (canvas: fabric.Canvas, imgBounds: Bounds): fabric.Rect[] => {
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      const overlayOptions = {
        fill: "rgba(0, 0, 0, 0.5)",
        selectable: false,
        evented: false,
        excludeFromExport: true,
      };

      const topOverlay = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvasWidth,
        height: imgBounds.top,
        ...overlayOptions,
      } as fabric.IRectOptions);

      const bottomOverlay = new fabric.Rect({
        left: 0,
        top: imgBounds.top + imgBounds.height,
        width: canvasWidth,
        height: canvasHeight - (imgBounds.top + imgBounds.height),
        ...overlayOptions,
      } as fabric.IRectOptions);

      const leftOverlay = new fabric.Rect({
        left: 0,
        top: imgBounds.top,
        width: imgBounds.left,
        height: imgBounds.height,
        ...overlayOptions,
      } as fabric.IRectOptions);

      const rightOverlay = new fabric.Rect({
        left: imgBounds.left + imgBounds.width,
        top: imgBounds.top,
        width: canvasWidth - (imgBounds.left + imgBounds.width),
        height: imgBounds.height,
        ...overlayOptions,
      } as fabric.IRectOptions);

      return [topOverlay, bottomOverlay, leftOverlay, rightOverlay];
    },
    []
  );

  /**
   * Create crop rectangle with visual styling
   */
  const createCropRect = useCallback(
    (imgBounds: Bounds): fabric.Rect => {
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
    },
    []
  );

  /**
   * Create dimension label for crop rect
   */
  const createLabel = useCallback(
    (rect: fabric.Rect): fabric.Textbox => {
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
    },
    []
  );

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
    const overlays = createOverlays(canvas, imgBounds);
    overlays.forEach((overlay) => canvas.add(overlay));

    // Create crop rectangle
    const cropRect = createCropRect(imgBounds);
    canvas.add(cropRect);

    // Create label
    const label = createLabel(cropRect);
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

    // Attach event listeners for constraining and label updates
    const updateLabelAndBounds = (): void => {
      const w = Math.round(cropRect.getScaledWidth());
      const h = Math.round(cropRect.getScaledHeight());
      label.set({
        text: `${w} × ${h}`,
        left: cropRect.left || 0,
        top: (cropRect.top || 0) - 28,
      });

      setCropBounds({
        left: cropRect.left || 0,
        top: cropRect.top || 0,
        width: w,
        height: h,
      });
    };

    const constrainInside = (): void => {
      const scaledW = cropRect.getScaledWidth();
      const scaledH = cropRect.getScaledHeight();
      let left = cropRect.left || 0;
      let top = cropRect.top || 0;

      left = Math.max(
        imgBounds.left,
        Math.min(left, imgBounds.left + imgBounds.width - scaledW)
      );
      top = Math.max(
        imgBounds.top,
        Math.min(top, imgBounds.top + imgBounds.height - scaledH)
      );

      cropRect.set({ left, top });
    };

    const onMoving = (): void => {
      constrainInside();
      updateLabelAndBounds();
      canvas.requestRenderAll();
    };

    const onScaling = (): void => {
      constrainInside();
      updateLabelAndBounds();

      // Limit scale to available space
      const availableW = imgBounds.left + imgBounds.width - (cropRect.left || 0);
      const availableH = imgBounds.top + imgBounds.height - (cropRect.top || 0);
      const baseW = Math.max(1, cropRect.width || 1);
      const baseH = Math.max(1, cropRect.height || 1);

      const maxScaleX = Math.max(0.1, availableW / baseW);
      const maxScaleY = Math.max(0.1, availableH / baseH);
      const minScaleX = 24 / baseW;
      const minScaleY = 24 / baseH;

      const curScaleX = cropRect.scaleX || 1;
      const curScaleY = cropRect.scaleY || 1;

      const nextScaleX = Math.min(Math.max(curScaleX, minScaleX), maxScaleX);
      const nextScaleY = Math.min(Math.max(curScaleY, minScaleY), maxScaleY);

      if (nextScaleX !== curScaleX || nextScaleY !== curScaleY) {
        cropRect.set({ scaleX: nextScaleX, scaleY: nextScaleY });
      }

      constrainInside();
      canvas.requestRenderAll();
    };

    cropRect.on("moving", onMoving);
    cropRect.on("scaling", onScaling);

    canvas.renderAll();
  }, [
    canvasRef,
    imageRef,
    createOverlays,
    createCropRect,
    createLabel,
    onCropStart,
  ]);

  /**
   * Apply the current crop
   */
  const applyCrop = useCallback(async (): Promise<void> => {
    const canvas = canvasRef.current;
    const originalImage = imageRef.current;
    const { cropRect, overlays, label } = cropStateRef.current;

    if (!canvas || !originalImage || !cropRect) return;

    const cleanup = cleanupRef.current;

    // Get crop bounds in canvas space
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const inverted = fabric.util.invertTransform(vpt as number[]);

    const bounds = cropRect.getBoundingRect();
    const tlScreen = new fabric.Point(bounds.left, bounds.top);
    const brScreen = new fabric.Point(
      bounds.left + bounds.width,
      bounds.top + bounds.height
    );
    const tlCanvas = fabric.util.transformPoint(tlScreen, inverted);
    const brCanvas = fabric.util.transformPoint(brScreen, inverted);

    // Image position and scale
    const imgLeft = originalImage.left || 0;
    const imgTop = originalImage.top || 0;
    const scaleX = originalImage.scaleX || 1;
    const scaleY = originalImage.scaleY || 1;
    const imgW = originalImage.width || 0;
    const imgH = originalImage.height || 0;

    // Compute crop in image pixel space
    let cropX = (tlCanvas.x - imgLeft) / scaleX;
    let cropY = (tlCanvas.y - imgTop) / scaleY;
    let cropWidth = (brCanvas.x - tlCanvas.x) / scaleX;
    let cropHeight = (brCanvas.y - tlCanvas.y) / scaleY;

    // Clamp to image bounds
    cropX = Math.max(0, Math.min(cropX, imgW));
    cropY = Math.max(0, Math.min(cropY, imgH));
    cropWidth = Math.max(1, Math.min(cropWidth, imgW - cropX));
    cropHeight = Math.max(1, Math.min(cropHeight, imgH - cropY));

    // Create cropped image
    const imgElement = originalImage.getElement() as HTMLImageElement;
    const { canvas: croppedCanvas, ctx } = createTempCanvas(
      Math.round(cropWidth),
      Math.round(cropHeight),
      cleanup
    );

    if (!ctx) {
      cleanup.cleanup();
      return;
    }

    ctx.drawImage(
      imgElement,
      Math.round(cropX),
      Math.round(cropY),
      Math.round(cropWidth),
      Math.round(cropHeight),
      0,
      0,
      Math.round(cropWidth),
      Math.round(cropHeight)
    );

    const croppedDataUrl = croppedCanvas.toDataURL();

    // Load cropped image
    return new Promise<void>((resolve) => {
      fabric.Image.fromURL(croppedDataUrl, (img) => {
        // Clear canvas
        canvas.clear();

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
        lockImage(img);

        canvas.add(img);
        img.setCoords();

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
