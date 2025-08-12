import { useCallback, useEffect, useState } from "react";
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
  const [cropLabel, setCropLabel] = useState<fabric.Textbox | null>(null);
  const [overlays, setOverlays] = useState<fabric.Rect[]>([]);

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

    // Recompute image bounds independent of current viewport
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const imgLeft = originalImage.left || 0;
    const imgTop = originalImage.top || 0;
    const imgBounds = {
      left: imgLeft,
      top: imgTop,
      width: originalImage.getScaledWidth(),
      height: originalImage.getScaledHeight(),
    };

    // Create overlays around canvas (dim outside image)
    const topOverlay = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: imgBounds.top,
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      excludeFromExport: true as any,
    });

    const bottomOverlay = new fabric.Rect({
      left: 0,
      top: imgBounds.top + imgBounds.height,
      width: canvasWidth,
      height: canvasHeight - (imgBounds.top + imgBounds.height),
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      excludeFromExport: true as any,
    });

    const leftOverlay = new fabric.Rect({
      left: 0,
      top: imgBounds.top,
      width: imgBounds.left,
      height: imgBounds.height,
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      excludeFromExport: true as any,
    });

    const rightOverlay = new fabric.Rect({
      left: imgBounds.left + imgBounds.width,
      top: imgBounds.top,
      width: canvasWidth - (imgBounds.left + imgBounds.width),
      height: imgBounds.height,
      fill: "rgba(0, 0, 0, 0.5)",
      selectable: false,
      evented: false,
      excludeFromExport: true as any,
    });

    const cropWidth = Math.min(200, imgBounds.width * 0.8);
    const cropHeight = Math.min(150, imgBounds.height * 0.8);

    const rect = new fabric.Rect({
      // Position as top-left origin and center inside image bounds
      left: imgBounds.left + (imgBounds.width - cropWidth) / 2,
      top: imgBounds.top + (imgBounds.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
      originX: "left",
      originY: "top",
      fill: "rgba(255,255,255,0.02)",
      stroke: "#60a5fa",
      strokeWidth: 2,
      strokeUniform: true,
      strokeDashArray: [6, 4] as any,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      lockScalingFlip: true as any,
      centeredScaling: false as any,
      objectCaching: false as any,
      minScaleLimit: 0.1,
      cornerStyle: "rect" as any,
      cornerColor: "#ffffff",
      cornerStrokeColor: "#1f2937" as any,
      borderColor: "#60a5fa",
      transparentCorners: false,
      cornerSize: 12,
      padding: 2,
    });

    canvas.add(topOverlay, bottomOverlay, leftOverlay, rightOverlay);
    canvas.add(rect);
    const label = new fabric.Textbox(`${Math.round(cropWidth)} × ${Math.round(cropHeight)}`, {
      left: rect.left || 0,
      top: (rect.top || 0) - 28,
      fontSize: 12,
      fill: "#e5e7eb",
      backgroundColor: "rgba(17,24,39,0.6)",
      padding: 6,
      textAlign: "center",
      selectable: false,
      evented: false,
    });
    (label as any).excludeFromExport = true;
    canvas.add(label);
    canvas.setActiveObject(rect);
    setCropRect(rect);
    setCropLabel(label);
    setOverlays([topOverlay, bottomOverlay, leftOverlay, rightOverlay]);
    canvas.renderAll();
  }, [canvas, originalImage, activeBlurRects, isDrawing, setActiveBlurRects, setIsSelectMode]);

  const handleCropApply = useCallback(() => {
    if (!canvas || !originalImage || !cropRect) return;

    // Convert crop rect bounds from screen space to canvas space (remove viewport transform)
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const inverted = fabric.util.invertTransform(vpt as any);

    const bounds = cropRect.getBoundingRect();
    const tlScreen = new fabric.Point(bounds.left, bounds.top);
    const brScreen = new fabric.Point(bounds.left + bounds.width, bounds.top + bounds.height);
    const tlCanvas = fabric.util.transformPoint(tlScreen, inverted);
    const brCanvas = fabric.util.transformPoint(brScreen, inverted);

    // Image top-left in canvas space
    const imgLeft = originalImage.left || 0;
    const imgTop = originalImage.top || 0;
    const imgScaledW = (originalImage.width || 0) * (originalImage.scaleX || 1);
    const imgScaledH = (originalImage.height || 0) * (originalImage.scaleY || 1);
    const imgTL = new fabric.Point(imgLeft, imgTop);

    // Compute crop rect in image pixel space
    const scaleX = originalImage.scaleX || 1;
    const scaleY = originalImage.scaleY || 1;
    let cropX = (tlCanvas.x - imgTL.x) / scaleX;
    let cropY = (tlCanvas.y - imgTL.y) / scaleY;
    let cropWidth = (brCanvas.x - tlCanvas.x) / scaleX;
    let cropHeight = (brCanvas.y - tlCanvas.y) / scaleY;

    // Clamp to image bounds
    const imgW = originalImage.width || 0;
    const imgH = originalImage.height || 0;
    cropX = Math.max(0, Math.min(cropX, imgW));
    cropY = Math.max(0, Math.min(cropY, imgH));
    cropWidth = Math.max(1, Math.min(cropWidth, imgW - cropX));
    cropHeight = Math.max(1, Math.min(cropHeight, imgH - cropY));

    const imgElement = originalImage.getElement();
    const croppedCanvas = document.createElement("canvas");
    const ctx = croppedCanvas.getContext("2d");
    croppedCanvas.width = Math.round(cropWidth);
    croppedCanvas.height = Math.round(cropHeight);
    ctx?.drawImage(
      imgElement,
      Math.round(cropX),
      Math.round(cropY),
      Math.round(cropWidth),
      Math.round(cropHeight),
      0,
      0,
      Math.round(cropWidth),
      Math.round(cropHeight),
    );

    const croppedDataUrl = croppedCanvas.toDataURL();

    fabric.Image.fromURL(croppedDataUrl, (img: fabric.Image) => {
      // Remove overlays and existing objects
      canvas.clear();

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const maxWidth = canvasWidth * 0.9;
      const maxHeight = canvasHeight * 0.9;
      const scale = Math.min(maxWidth / croppedCanvas.width, maxHeight / croppedCanvas.height, 1);

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

      (img as CustomFabricImage).id = "originalImage";

      // Calculate position to center the image manually
      const imgScaledWidth = img.getScaledWidth();
      const imgScaledHeight = img.getScaledHeight();
      const centerX = (canvasWidth - imgScaledWidth) / 2;
      const centerY = (canvasHeight - imgScaledHeight) / 2;

      img.set({
        left: centerX,
        top: centerY,
      });

      canvas.add(img);
      img.setCoords();
      setOriginalImage(img);
      setIsCropping(false);
      setIsSelectMode(true);
      setCropRect(null);
      if (cropLabel) canvas.remove(cropLabel);
      canvas.renderAll();
    });
  }, [canvas, originalImage, cropRect, cropLabel, setOriginalImage, setIsSelectMode]);

  const handleCropCancel = useCallback(() => {
    if (!canvas || !cropRect) return;

    const toRemove = [cropRect, ...overlays, ...(cropLabel ? [cropLabel] : [])].filter(Boolean) as fabric.Object[];
    toRemove.forEach((obj: fabric.Object) => canvas.remove(obj));

    setCropRect(null);
    setCropLabel(null);
    setOverlays([]);
    setIsCropping(false);
    setIsSelectMode(true); // Return to select mode when canceling crop
    canvas.discardActiveObject();
    canvas.renderAll();
  }, [canvas, cropRect, cropLabel, overlays, setIsSelectMode]);

  // Keep label synced and keep crop within image bounds
  const attachCropListeners = useCallback(() => {
    if (!canvas || !cropRect || !originalImage) return;
    const imgBounds = {
      left: originalImage.left || 0,
      top: originalImage.top || 0,
      width: originalImage.getScaledWidth(),
      height: originalImage.getScaledHeight(),
    };

    const updateLabel = () => {
      if (!cropRect || !cropLabel) return;
      const w = Math.round(cropRect.getScaledWidth());
      const h = Math.round(cropRect.getScaledHeight());
      cropLabel.set({
        text: `${w} × ${h}`,
        left: cropRect.left || 0,
        top: (cropRect.top || 0) - 28,
      });
    };

    const constrainInside = () => {
      const scaledW = cropRect.getScaledWidth();
      const scaledH = cropRect.getScaledHeight();
      let left = cropRect.left || 0;
      let top = cropRect.top || 0;
      left = Math.max(imgBounds.left, Math.min(left, imgBounds.left + imgBounds.width - scaledW));
      top = Math.max(imgBounds.top, Math.min(top, imgBounds.top + imgBounds.height - scaledH));
      cropRect.set({ left, top });
    };

    const onMoving = () => {
      constrainInside();
      updateLabel();
      canvas.requestRenderAll();
    };
    const onScaling = () => {
      // Ensure stays within image while scaling from any handle
      constrainInside();
      updateLabel();

      // Available space from current top-left to image bounds right/bottom
      const availableW = imgBounds.left + imgBounds.width - (cropRect.left || 0);
      const availableH = imgBounds.top + imgBounds.height - (cropRect.top || 0);

      // Max scale based on available space and base size
      const baseW = Math.max(1, cropRect.width || 1);
      const baseH = Math.max(1, cropRect.height || 1);
      const maxScaleX = Math.max(0.1, availableW / baseW);
      const maxScaleY = Math.max(0.1, availableH / baseH);

      const minSize = 24;
      const minScaleX = minSize / baseW;
      const minScaleY = minSize / baseH;

      const curScaleX = cropRect.scaleX || 1;
      const curScaleY = cropRect.scaleY || 1;

      const nextScaleX = Math.min(Math.max(curScaleX, minScaleX), maxScaleX);
      const nextScaleY = Math.min(Math.max(curScaleY, minScaleY), maxScaleY);

      if (nextScaleX !== curScaleX || nextScaleY !== curScaleY) {
        cropRect.set({ scaleX: nextScaleX, scaleY: nextScaleY });
      }

      // After scale clamps, re-ensure inside
      constrainInside();
      canvas.requestRenderAll();
    };

    cropRect.on("moving", onMoving);
    cropRect.on("scaling", onScaling);

    return () => {
      cropRect.off("moving", onMoving);
      cropRect.off("scaling", onScaling);
    };
  }, [canvas, cropRect, cropLabel, originalImage]);

  useEffect(() => {
    const detach = attachCropListeners();
    return () => {
      if (typeof detach === "function") detach();
    };
  }, [attachCropListeners]);

  return {
    isCropping,
    setIsCropping,
    cropRect,
    handleCropStart,
    handleCropApply,
    handleCropCancel,
  };
};
