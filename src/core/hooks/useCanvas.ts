import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Bounds, EditorFabricImage, UseCanvasReturn } from "../types";
import {
  loadImageToCanvas,
  getImageBounds,
  dataURLToBlob,
  CleanupManager,
} from "../utils";

// ============================================================================
// Types
// ============================================================================

interface UseCanvasOptions {
  /** URL of the image to load */
  imageUrl?: string;
  /** Background color for the canvas */
  backgroundColor?: string;
  /** Padding around the image in pixels (default: 24) */
  padding?: number;
  /** Callback when image is loaded */
  onImageLoad?: (image: fabric.Image) => void;
  /** Callback when canvas is ready */
  onReady?: (canvas: fabric.Canvas) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing the Fabric.js canvas and image loading
 *
 * @example
 * ```tsx
 * const {
 *   canvas,
 *   canvasRef,
 *   originalImage,
 *   hasImage,
 *   exportToBlob
 * } = useCanvas({
 *   imageUrl: '/path/to/image.jpg',
 *   onImageLoad: (img) => console.log('Image loaded!'),
 * });
 *
 * return <canvas ref={canvasRef} />;
 * ```
 */
export function useCanvas(options: UseCanvasOptions = {}): UseCanvasReturn {
  const {
    imageUrl,
    backgroundColor = "transparent",
    padding = 24,
    onImageLoad,
    onReady,
  } = options;

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  const cleanupRef = useRef(new CleanupManager());

  // State
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [originalImage, setOriginalImage] = useState<fabric.Image | null>(null);
  const [hasImage, setHasImage] = useState(false);

  /**
   * Callback when canvas is ready
   */
  const onCanvasReady = useCallback(
    (fabricCanvas: fabric.Canvas) => {
      canvasInstanceRef.current = fabricCanvas;
      setCanvas(fabricCanvas);
      onReady?.(fabricCanvas);
    },
    [onReady]
  );

  /**
   * Load image onto canvas
   */
  const loadImage = useCallback(
    async (url: string) => {
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas || !url) return;

      try {
        const img = await loadImageToCanvas(currentCanvas, url, padding);
        setOriginalImage(img);
        setHasImage(true);
        onImageLoad?.(img);
      } catch {
        setHasImage(false);
      }
    },
    [padding, onImageLoad]
  );

  /**
   * Get image bounds in canvas space
   */
  const getImageBoundsCallback = useCallback((): Bounds | null => {
    return getImageBounds(originalImage);
  }, [originalImage]);

  /**
   * Export canvas to blob
   */
  const exportToBlob = useCallback(async (): Promise<Blob | null> => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas || !originalImage) return null;

    // Store current viewport state for restoration
    const currentViewportTransform =
      currentCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const currentZoom = currentCanvas.getZoom();

    try {
      // Reset viewport for accurate export
      currentCanvas.setZoom(1);
      currentCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // Get image bounds
      const imgBounds = getImageBounds(originalImage);
      if (!imgBounds) {
        throw new Error("Could not get image bounds");
      }

      // Calculate export bounds including all objects
      let minX = imgBounds.left;
      let minY = imgBounds.top;
      let maxX = imgBounds.left + imgBounds.width;
      let maxY = imgBounds.top + imgBounds.height;

      // Include other objects in bounds calculation
      const objects = currentCanvas.getObjects();
      objects.forEach((obj) => {
        if (obj !== originalImage) {
          const objBounds = obj.getBoundingRect();
          minX = Math.min(minX, objBounds.left);
          minY = Math.min(minY, objBounds.top);
          maxX = Math.max(maxX, objBounds.left + objBounds.width);
          maxY = Math.max(maxY, objBounds.top + objBounds.height);
        }
      });

      // Clamp to canvas boundaries
      const canvasWidth = currentCanvas.getWidth();
      const canvasHeight = currentCanvas.getHeight();
      minX = Math.max(0, minX);
      minY = Math.max(0, minY);
      maxX = Math.min(canvasWidth, maxX);
      maxY = Math.min(canvasHeight, maxY);

      // Export the region
      const dataURL = currentCanvas.toDataURL({
        format: "png",
        quality: 1,
        left: Math.round(minX),
        top: Math.round(minY),
        width: Math.round(maxX - minX),
        height: Math.round(maxY - minY),
        multiplier: 1,
      });

      // Restore viewport
      currentCanvas.setZoom(currentZoom);
      currentCanvas.setViewportTransform(currentViewportTransform);
      currentCanvas.renderAll();

      return await dataURLToBlob(dataURL);
    } catch {
      // Restore viewport state on error to prevent corrupted canvas state
      currentCanvas.setZoom(currentZoom);
      currentCanvas.setViewportTransform(currentViewportTransform);
      currentCanvas.renderAll();

      // Fallback: export entire canvas
      try {
        const fallbackDataURL = currentCanvas.toDataURL({
          format: "png",
          quality: 1,
        });
        return await dataURLToBlob(fallbackDataURL);
      } catch {
        return null;
      }
    }
  }, [originalImage]);

  /**
   * Dispose canvas and cleanup resources
   */
  const dispose = useCallback(() => {
    cleanupRef.current.cleanup();

    if (canvasInstanceRef.current) {
      try {
        canvasInstanceRef.current.dispose();
      } catch {
        // Canvas might already be disposed
      }
      canvasInstanceRef.current = null;
    }

    setCanvas(null);
    setOriginalImage(null);
    setHasImage(false);
  }, []);

  // Initialize canvas when ref is available
  useEffect(() => {
    if (!canvasRef.current || canvasInstanceRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current);
    fabricCanvas.setBackgroundColor(backgroundColor, () => {
      fabricCanvas.renderAll();
    });

    onCanvasReady(fabricCanvas);

    return () => {
      dispose();
    };
  }, [backgroundColor, onCanvasReady, dispose]);

  // Load image when URL changes
  useEffect(() => {
    if (imageUrl && canvas) {
      loadImage(imageUrl);
    }
  }, [imageUrl, canvas, loadImage]);

  // Update original image reference from external sources
  const setOriginalImageCallback = useCallback(
    (img: fabric.Image | null) => {
      if (img) {
        (img as EditorFabricImage).id = "originalImage";
      }
      setOriginalImage(img);
      setHasImage(img !== null);
    },
    []
  );

  return {
    canvas,
    originalImage,
    hasImage,
    canvasRef,
    onCanvasReady,
    setOriginalImage: setOriginalImageCallback,
    getImageBounds: getImageBoundsCallback,
    exportToBlob,
    dispose,
  };
}

export default useCanvas;
