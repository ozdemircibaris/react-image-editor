import { fabric } from "fabric";
import { useCallback } from "react";

export const useShapeHandlers = (
  canvas: fabric.Canvas | null,
  isCropping: boolean,
  isDrawing: boolean,
  currentColor: string,
  currentStrokeWidth: number,
  setIsSelectMode: (value: boolean) => void,
) => {
  const handleAddShape = useCallback(
    (shapeType: "rectangle" | "circle") => {
      if (!canvas || isCropping || isDrawing) return;

      setIsSelectMode(false); // Exit select mode when adding shapes

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      if (shapeType === "rectangle") {
        const rect = new fabric.Rect({
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
        });
        canvas.add(rect);
        canvas.setActiveObject(rect);
      } else if (shapeType === "circle") {
        const circle = new fabric.Circle({
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
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
      }

      canvas.renderAll();
    },
    [canvas, isCropping, isDrawing, currentColor, currentStrokeWidth, setIsSelectMode],
  );

  return {
    handleAddShape,
  };
};
