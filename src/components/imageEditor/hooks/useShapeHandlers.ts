import { fabric } from "fabric";
import { useCallback } from "react";

export const useShapeHandlers = (
  canvas: fabric.Canvas | null,
  isCropping: boolean,
  isDrawing: boolean,
  currentColor: string,
  currentStrokeWidth: number,
  setIsSelectMode: (value: boolean) => void,
  setSelectedObject: (obj: fabric.Object | null) => void,
  saveState: () => void,
) => {
  const handleAddShape = useCallback(
    (shapeType: "rectangle" | "circle") => {
      if (!canvas || isCropping || isDrawing) return;

      setIsSelectMode(false); // Exit select mode when adding shapes

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      let newShape: fabric.Object;

      if (shapeType === "rectangle") {
        newShape = new fabric.Rect({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          width: 100,
          height: 60,
          fill: "transparent", // No background color
          stroke: currentColor, // Use current color
          strokeWidth: currentStrokeWidth, // Use current stroke width
          originX: "center",
          originY: "center",
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          cornerStyle: "circle",
          cornerColor: currentColor,
          cornerSize: 8,
          transparentCorners: false,
          borderColor: currentColor,
          // Add custom properties for identification
          isShape: true,
          shapeType: "rectangle",
        });
      } else if (shapeType === "circle") {
        newShape = new fabric.Circle({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          radius: 40,
          fill: "transparent", // No background color
          stroke: currentColor, // Use current color
          strokeWidth: currentStrokeWidth, // Use current stroke width
          originX: "center",
          originY: "center",
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          cornerStyle: "circle",
          cornerColor: currentColor,
          cornerSize: 8,
          transparentCorners: false,
          borderColor: currentColor,
          // Add custom properties for identification
          isShape: true,
          shapeType: "circle",
        });
      } else {
        return;
      }

      // Add the shape to canvas
      canvas.add(newShape);

      // Set as active object and update selection
      canvas.setActiveObject(newShape);
      setSelectedObject(newShape);

      // Save state for undo/redo
      saveState();

      // Render canvas
      canvas.renderAll();
    },
    [canvas, isCropping, isDrawing, currentColor, currentStrokeWidth, setIsSelectMode, setSelectedObject, saveState],
  );

  return {
    handleAddShape,
  };
};
