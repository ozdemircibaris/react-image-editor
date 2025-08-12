import { useCallback } from "react";
import type { CustomFabricObject, FabricSelectionEvent } from "../types";

export const useObjectHandlers = (
  canvas: fabric.Canvas | null,
  selectedObject: fabric.Object | null,
  setSelectedObject: (obj: fabric.Object | null) => void,
  setCurrentColor: (color: string) => void,
  setCurrentStrokeWidth: (width: number) => void,
  originalImage: fabric.Image | null,
  saveState: () => void,
) => {
  // Handle object selection
  const handleObjectSelection = useCallback(
    (e: FabricSelectionEvent) => {
      const obj = e.selected?.[0];
      if (obj) {
        setSelectedObject(obj);
        // Get current color and stroke width from selected object
        const strokeColor = (obj as CustomFabricObject).stroke || "#D64045";
        const strokeWidth = (obj as CustomFabricObject).strokeWidth || 2;
        setCurrentColor(strokeColor);
        setCurrentStrokeWidth(strokeWidth);
      }
    },
    [setSelectedObject, setCurrentColor, setCurrentStrokeWidth],
  );

  // Handle object deselection
  const handleObjectDeselection = useCallback(() => {
    setSelectedObject(null);
  }, [setSelectedObject]);

  // Handle object deletion
  const handleDeleteObject = useCallback(() => {
    if (!canvas || !selectedObject) return;

    // Don't allow deletion of the original image
    if (selectedObject === originalImage) return;

    // If deleting a blur rect, also remove its associated blur patch
    const customObj = selectedObject as CustomFabricObject;
    if (customObj.id) {
      // Check if this is a blur rect and remove its blur patch
      const objects = canvas.getObjects();
      objects.forEach((obj: fabric.Object) => {
        const customBlurObj = obj as CustomFabricObject;
        if (customBlurObj.isBlurPatch && customBlurObj.blurRectId === customObj.id) {
          canvas.remove(obj);
        }
      });
    }

    // Remove the selected object
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    setSelectedObject(null);
    canvas.renderAll();

    // Save state for undo/redo
    saveState();
  }, [canvas, selectedObject, originalImage, setSelectedObject, saveState]);

  // Handle color change - affects selected object, draw brush, and new shapes
  const handleColorChange = useCallback(
    (color: string) => {
      setCurrentColor(color);
      if (selectedObject) {
        selectedObject.set({ stroke: color });
        canvas?.renderAll();
      }
      // Update draw brush color
      if (canvas && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
      }
    },
    [selectedObject, canvas, setCurrentColor],
  );

  // Handle stroke width change - affects selected object, draw brush, and new shapes
  const handleStrokeWidthChange = useCallback(
    (width: number) => {
      setCurrentStrokeWidth(width);
      if (selectedObject) {
        selectedObject.set({ strokeWidth: width });
        canvas?.renderAll();
      }
      // Update draw brush width
      if (canvas && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = width;
      }
    },
    [selectedObject, canvas, setCurrentStrokeWidth],
  );

  return {
    handleObjectSelection,
    handleObjectDeselection,
    handleDeleteObject,
    handleColorChange,
    handleStrokeWidthChange,
  };
};
