import { fabric } from "fabric";
import { useCallback, useState } from "react";

import type { EditorFabricObject, UseDrawingReturn } from "../types";

// ============================================================================
// Types
// ============================================================================

interface UseDrawingOptions {
  /** Initial brush color */
  initialColor?: string;
  /** Initial brush width */
  initialWidth?: number;
  /** Callback when drawing mode is enabled */
  onEnable?: () => void;
  /** Callback when drawing mode is disabled */
  onDisable?: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing freehand drawing mode
 *
 * @example
 * ```tsx
 * const drawing = useDrawing(canvasRef, imageRef, {
 *   initialColor: '#ff0000',
 *   initialWidth: 3,
 * });
 *
 * // Toggle drawing mode
 * drawing.toggleDrawing();
 *
 * // Change brush settings
 * drawing.setBrushColor('#00ff00');
 * drawing.setBrushWidth(5);
 * ```
 */
export function useDrawing(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  imageRef: React.MutableRefObject<fabric.Image | null>,
  options: UseDrawingOptions = {}
): UseDrawingReturn {
  const {
    initialColor = "#ff7000",
    initialWidth = 2,
    onEnable,
    onDisable,
  } = options;

  const [isDrawing, setIsDrawing] = useState(false);

  /**
   * Update object selectability based on drawing mode
   */
  const updateObjectSelectability = useCallback(
    (canvas: fabric.Canvas, drawingEnabled: boolean) => {
      const originalImage = imageRef.current;

      canvas.getObjects().forEach((obj) => {
        // Never make original image selectable
        if (obj === originalImage) return;

        const customObj = obj as EditorFabricObject;
        // Only update non-blur objects
        if (!customObj.isBlurPatch) {
          obj.set({
            selectable: !drawingEnabled,
            evented: !drawingEnabled,
          });
        }
      });
    },
    [imageRef]
  );

  /**
   * Enable drawing mode
   */
  const enableDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = initialColor;
    canvas.freeDrawingBrush.width = initialWidth;

    updateObjectSelectability(canvas, true);
    canvas.discardActiveObject();
    canvas.renderAll();

    setIsDrawing(true);
    onEnable?.();
  }, [canvasRef, initialColor, initialWidth, updateObjectSelectability, onEnable]);

  /**
   * Disable drawing mode
   */
  const disableDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    updateObjectSelectability(canvas, false);
    canvas.renderAll();

    setIsDrawing(false);
    onDisable?.();
  }, [canvasRef, updateObjectSelectability, onDisable]);

  /**
   * Toggle drawing mode
   */
  const toggleDrawing = useCallback(() => {
    if (isDrawing) {
      disableDrawing();
    } else {
      enableDrawing();
    }
  }, [isDrawing, enableDrawing, disableDrawing]);

  /**
   * Set brush color
   */
  const setBrushColor = useCallback(
    (color: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.freeDrawingBrush.color = color;
    },
    [canvasRef]
  );

  /**
   * Set brush width
   */
  const setBrushWidth = useCallback(
    (width: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.freeDrawingBrush.width = width;
    },
    [canvasRef]
  );

  return {
    isDrawing,
    enableDrawing,
    disableDrawing,
    toggleDrawing,
    setBrushColor,
    setBrushWidth,
  };
}

export default useDrawing;
