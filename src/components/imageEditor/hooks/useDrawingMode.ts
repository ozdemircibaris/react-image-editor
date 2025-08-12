import { useCallback } from "react";
import type { CustomFabricObject } from "../types";

export const useDrawingMode = (
  canvas: fabric.Canvas | null,
  isDrawing: boolean,
  setIsDrawing: (value: boolean) => void,
  setIsSelectMode: (value: boolean) => void,
  originalImage: fabric.Image | null,
) => {
  const handleToggleDraw = useCallback(() => {
    if (!canvas) return;

    const newDrawingState = !isDrawing;
    setIsDrawing(newDrawingState);
    setIsSelectMode(false); // Exit select mode when drawing
    canvas.isDrawingMode = newDrawingState;

    if (newDrawingState) {
      // Ensure all objects are not selectable when drawing (except originalImage which should always stay locked)
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (obj !== originalImage && !(obj as CustomFabricObject).isDrawing) {
          obj.set({
            selectable: false,
            evented: false,
          });
        }
      });
      canvas.discardActiveObject();
    } else {
      // Re-enable selection for blur rects and shapes
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (
          obj !== originalImage &&
          !(obj as CustomFabricObject).isBlurPatch &&
          !(obj as CustomFabricObject).isDrawing
        ) {
          obj.set({
            selectable: true,
            evented: true,
          });
        }
      });
      setIsSelectMode(true); // Return to select mode when drawing is disabled
    }

    canvas.renderAll();
  }, [canvas, isDrawing, originalImage, setIsSelectMode]);

  return { handleToggleDraw };
};
