import { useCallback } from "react";
import type { fabric } from "fabric";

import { dataURLToBlob } from "../utils";

// ============================================================================
// Types
// ============================================================================

export interface UseExportReturn {
  /** Export canvas to blob */
  exportToBlob: () => Promise<Blob | null>;
  /** Export canvas to data URL */
  exportToDataURL: (format?: string, quality?: number) => string | null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for exporting canvas content
 *
 * @example
 * ```tsx
 * const { exportToBlob, exportToDataURL } = useExport(canvasRef, originalImageRef);
 *
 * const handleSave = async () => {
 *   const blob = await exportToBlob();
 *   if (blob) {
 *     // Save or upload the blob
 *   }
 * };
 * ```
 */
export function useExport(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  originalImageRef: React.MutableRefObject<fabric.Image | null>
): UseExportReturn {
  const exportToBlob = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    const image = originalImageRef.current;
    if (!canvas || !image) return null;

    // Store viewport state for restoration
    const currentVPT = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const currentZoom = canvas.getZoom();

    try {
      // Reset viewport for accurate export
      canvas.setZoom(1);
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // Get image bounds
      const imgLeft = image.left || 0;
      const imgTop = image.top || 0;
      const imgWidth = image.getScaledWidth();
      const imgHeight = image.getScaledHeight();

      let minX = imgLeft;
      let minY = imgTop;
      let maxX = imgLeft + imgWidth;
      let maxY = imgTop + imgHeight;

      // Include other objects in bounds calculation
      canvas.getObjects().forEach((obj) => {
        if (obj !== image) {
          const bounds = obj.getBoundingRect();
          minX = Math.min(minX, bounds.left);
          minY = Math.min(minY, bounds.top);
          maxX = Math.max(maxX, bounds.left + bounds.width);
          maxY = Math.max(maxY, bounds.top + bounds.height);
        }
      });

      // Clamp to canvas boundaries
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      minX = Math.max(0, minX);
      minY = Math.max(0, minY);
      maxX = Math.min(canvasWidth, maxX);
      maxY = Math.min(canvasHeight, maxY);

      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        left: Math.round(minX),
        top: Math.round(minY),
        width: Math.round(maxX - minX),
        height: Math.round(maxY - minY),
        multiplier: 1,
      });

      // Restore viewport state
      canvas.setZoom(currentZoom);
      canvas.setViewportTransform(currentVPT);
      canvas.renderAll();

      return await dataURLToBlob(dataURL);
    } catch {
      // Restore viewport state on error to prevent corrupted canvas state
      canvas.setZoom(currentZoom);
      canvas.setViewportTransform(currentVPT);
      canvas.renderAll();
      return null;
    }
  }, [canvasRef, originalImageRef]);

  const exportToDataURL = useCallback(
    (format: string = "png", quality: number = 1): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      return canvas.toDataURL({ format, quality });
    },
    [canvasRef]
  );

  return {
    exportToBlob,
    exportToDataURL,
  };
}

export default useExport;
