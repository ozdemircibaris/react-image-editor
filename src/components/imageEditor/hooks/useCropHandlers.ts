import { useCallback, useState } from "react";
import { fabric } from "fabric";

import type { CustomFabricObject, CustomFabricImage } from "../types";

export const useCropHandlers = (
  canvas: fabric.Canvas | null,
  originalImage: fabric.Image | null,
  isDrawing: boolean,
  activeBlurRects: fabric.Rect[],
  setActiveBlurRects: (rects: fabric.Rect[]) => void,
  setIsSelectMode: (value: boolean) => void,
  setOriginalImage: (img: fabric.Image | null) => void,
) => {
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<fabric.Rect | null>(null);

  const handleCropStart = useCallback(() => {
    if (!canvas || !originalImage || isDrawing) return;

    setIsCropping(true);
    setIsSelectMode(false); // Exit select mode when cropping

    // Remove all blur effects when cropping
    const objects = canvas.getObjects().slice();
    objects.forEach((obj: fabric.Object) => {
      const customObj = obj as CustomFabricObject;
      if (obj !== originalImage && customObj.isBlurPatch && activeBlurRects.includes(obj as fabric.Rect)) {
        canvas.remove(obj);
      }
    });
    setActiveBlurRects([]);

    const imgBounds = originalImage.getBoundingRect();
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Create overlays around canvas
    const topOverlay = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: imgBounds.top,
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
    });

    const bottomOverlay = new fabric.Rect({
      left: 0,
      top: imgBounds.top + imgBounds.height,
      width: canvasWidth,
      height: canvasHeight - (imgBounds.top + imgBounds.height),
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
    });

    const leftOverlay = new fabric.Rect({
      left: 0,
      top: imgBounds.top,
      width: imgBounds.left,
      height: imgBounds.height,
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
    });

    const rightOverlay = new fabric.Rect({
      left: imgBounds.left + imgBounds.width,
      top: imgBounds.top,
      width: canvasWidth - (imgBounds.left + imgBounds.width),
      height: imgBounds.height,
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
    });

    const cropWidth = Math.min(200, imgBounds.width * 0.8);
    const cropHeight = Math.min(150, imgBounds.height * 0.8);

    const rect = new fabric.Rect({
      left: imgBounds.left + imgBounds.width / 2,
      top: imgBounds.top + imgBounds.height / 2,
      width: cropWidth,
      height: cropHeight,
      fill: "transparent",
      stroke: "#ff6b35",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      originX: "center",
      originY: "center",
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      minScaleLimit: 0.1,
    });

    canvas.add(topOverlay, bottomOverlay, leftOverlay, rightOverlay);
    canvas.add(rect);
    canvas.setActiveObject(rect);
    setCropRect(rect);
    canvas.renderAll();
  }, [canvas, originalImage, activeBlurRects, isDrawing, setActiveBlurRects, setIsSelectMode]);

  const handleCropApply = useCallback(() => {
    if (!canvas || !originalImage || !cropRect) return;

    const cropBounds = cropRect.getBoundingRect();
    const imgBounds = originalImage.getBoundingRect();

    const cropX = (cropBounds.left - imgBounds.left) / (originalImage!.scaleX ?? 1);
    const cropY = (cropBounds.top - imgBounds.top) / (originalImage!.scaleY ?? 1);
    const cropWidth = cropBounds.width / (originalImage!.scaleX ?? 1);
    const cropHeight = cropBounds.height / (originalImage!.scaleY ?? 1);

    const imgElement = originalImage.getElement();
    const croppedCanvas = document.createElement("canvas");
    const ctx = croppedCanvas.getContext("2d");

    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    ctx?.drawImage(imgElement, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const croppedDataUrl = croppedCanvas.toDataURL();

    fabric.Image.fromURL(croppedDataUrl, (img: fabric.Image) => {
      canvas.clear();

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      const maxWidth = canvasWidth * 0.9;
      const maxHeight = canvasHeight * 0.9;

      const scale = Math.min(maxWidth / cropWidth, maxHeight / cropHeight);

      img.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: "center",
        originY: "center",
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

      canvas.add(img);
      setOriginalImage(img);
      setIsCropping(false);
      setIsSelectMode(true); // Return to select mode when applying crop
      setCropRect(null);
      canvas.renderAll();
    });
  }, [canvas, originalImage, cropRect, setOriginalImage, setIsSelectMode]);

  const handleCropCancel = useCallback(() => {
    if (!canvas || !cropRect) return;

    const toRemove = canvas
      .getObjects()
      .filter((obj: fabric.Object) => obj === cropRect || obj.fill === "rgba(0, 0, 0, 0.5)");
    toRemove.forEach((obj: fabric.Object) => canvas.remove(obj));

    setCropRect(null);
    setIsCropping(false);
    setIsSelectMode(true); // Return to select mode when canceling crop
    canvas.discardActiveObject();
    canvas.renderAll();
  }, [canvas, cropRect, setIsSelectMode]);

  return {
    isCropping,
    setIsCropping,
    cropRect,
    handleCropStart,
    handleCropApply,
    handleCropCancel,
  };
};
