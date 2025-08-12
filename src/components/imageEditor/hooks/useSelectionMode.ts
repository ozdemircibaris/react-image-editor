import { useCallback } from "react";
import type { CustomFabricObject } from "../types";

export const useSelectionMode = (
  canvas: fabric.Canvas | null,
  isSelectMode: boolean,
  setIsSelectMode: (value: boolean) => void,
  setIsDrawing: (value: boolean) => void,
  setIsCropping: (value: boolean) => void,
  originalImage: fabric.Image | null,
) => {
  const handleToggleSelectMode = useCallback(() => {
    if (!canvas) return;

    const newSelectMode = !isSelectMode;
    setIsSelectMode(newSelectMode);

    if (newSelectMode) {
      // Exit other modes
      setIsDrawing(false);
      setIsCropping(false);
      canvas.isDrawingMode = false;

      // Re-enable selection for all objects
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (obj !== originalImage && !(obj as CustomFabricObject).isBlurPatch) {
          obj.set({
            selectable: true,
            evented: true,
          });
        }
      });
    }

    canvas.renderAll();
  }, [canvas, isSelectMode, setIsSelectMode, setIsDrawing, setIsCropping, originalImage]);

  return { handleToggleSelectMode };
};
