import { fabric } from "fabric";
import { useCallback, useEffect, useState } from "react";
import type { CustomFabricImage } from "../types";

export const useCanvasSetup = (
  imageUrl: string,
  currentColor: string,
  currentStrokeWidth: number,
  initializeHistory: () => void,
) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [originalImage, setOriginalImage] = useState<fabric.Image | null>(null);

  const handleCanvasReady = useCallback(
    (fabricCanvas: fabric.Canvas) => {
      setCanvas(fabricCanvas);

      // Set canvas properties for better interaction
      fabricCanvas.selection = true;
      fabricCanvas.hoverCursor = "move";

      // Initialize drawing brush
      if (fabric && fabric.PencilBrush) {
        fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = currentColor;
        fabricCanvas.freeDrawingBrush.width = currentStrokeWidth;
      }
    },
    [currentColor, currentStrokeWidth],
  );

  // Add image to canvas
  useEffect(() => {
    if (!canvas || !imageUrl) return;

    fabric.Image.fromURL(imageUrl, (img: fabric.Image) => {
      if (!img) return;

      canvas.getObjects().forEach((obj) => canvas.remove(obj));
      canvas.renderAll();

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      const imgElement = img.getElement();
      const imgWidth = (imgElement as HTMLImageElement).width;
      const imgHeight = (imgElement as HTMLImageElement).height;

      // FIT MODE (contain): scale uniformly to fit entirely within canvas with small margin
      const margin = 24;
      const scale = Math.min((canvasWidth - margin * 2) / imgWidth, (canvasHeight - margin * 2) / imgHeight, 1);

      img.set({
        originX: "left",
        originY: "top",
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        lockUniScaling: true,
      });

      // Set ID separately to avoid TypeScript issues
      (img as CustomFabricImage).id = "originalImage";

      // Reset viewport, add and center precisely
      canvas.setZoom(1);
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.add(img);

      // Manually center the image
      const imgScaledWidth = img.getScaledWidth();
      const imgScaledHeight = img.getScaledHeight();
      const centerX = (canvasWidth - imgScaledWidth) / 2;
      const centerY = (canvasHeight - imgScaledHeight) / 2;
      img.set({
        left: centerX,
        top: centerY,
      });

      img.setCoords();
      canvas.renderAll();

      setHasImage(true);
      setOriginalImage(img);

      // Initialize undo/redo history after image is loaded
      setTimeout(() => {
        initializeHistory();
      }, 100);
    });
  }, [canvas, imageUrl, initializeHistory]);

  return {
    canvas,
    hasImage,
    originalImage,
    setOriginalImage,
    handleCanvasReady,
  };
};
