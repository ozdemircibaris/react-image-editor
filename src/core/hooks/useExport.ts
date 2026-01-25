import { useCallback } from "react";
import type { fabric } from "fabric";

import { dataURLToBlob } from "../utils";
import type { EditorFabricImage } from "../types";

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
 * Hook for exporting canvas content at original image resolution
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
    const image = originalImageRef.current as EditorFabricImage | null;
    if (!canvas || !image) return null;

    // Store viewport state for restoration
    const currentVPT = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const currentZoom = canvas.getZoom();

    try {
      // Reset viewport for accurate export
      canvas.setZoom(1);
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // Get image position and scaled dimensions
      const imgLeft = image.left || 0;
      const imgTop = image.top || 0;
      const scaledWidth = image.getScaledWidth();
      const scaledHeight = image.getScaledHeight();

      // Get original dimensions (stored during image load)
      const originalWidth = image.originalWidth || image.width || scaledWidth;
      const originalHeight = image.originalHeight || image.height || scaledHeight;

      // Calculate multiplier to export at original resolution
      const multiplier = originalWidth / scaledWidth;

      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        left: Math.round(imgLeft),
        top: Math.round(imgTop),
        width: Math.round(scaledWidth),
        height: Math.round(scaledHeight),
        multiplier: multiplier,
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
