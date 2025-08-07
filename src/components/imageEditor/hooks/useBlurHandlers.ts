import { fabric } from "fabric";
import { useCallback, useState } from "react";

import type { CustomFabricCanvas, CustomFabricObject, CustomFabricRect } from "../types";

export const useBlurHandlers = (
  canvas: fabric.Canvas | null,
  originalImage: fabric.Image | null,
  isDrawing: boolean,
  setIsSelectMode: (value: boolean) => void,
) => {
  const [activeBlurRects, setActiveBlurRects] = useState<fabric.Rect[]>([]);

  const updateBlurEffect = useCallback(
    (blurRect: fabric.Rect) => {
      if (!canvas || !originalImage) return;

      // Prevent multiple simultaneous updates
      const customCanvas = canvas as CustomFabricCanvas;
      if (customCanvas.isUpdatingBlur) return;
      customCanvas.isUpdatingBlur = true;

      // Remove existing blur patch for this blur rect
      const objects = canvas.getObjects();
      objects.forEach((obj: fabric.Object) => {
        const customObj = obj as CustomFabricObject;
        const customBlurRect = blurRect as CustomFabricRect;
        if (customObj.isBlurPatch && customObj.blurRectId === customBlurRect.id) {
          canvas.remove(obj);
        }
      });

      // Get blur area coordinates - use getBoundingRect for accurate coordinates
      const rectBounds = blurRect.getBoundingRect();
      const left = rectBounds.left;
      const top = rectBounds.top;
      const width = rectBounds.width;
      const height = rectBounds.height;

      // Temporarily hide the blur rect
      blurRect.set({ visible: false });
      canvas.renderAll();

      // Use requestAnimationFrame for smooth update
      requestAnimationFrame(() => {
        // Create temporary canvas to capture the area
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        tempCanvas.width = width;
        tempCanvas.height = height;

        // Get main canvas element
        const mainCanvasEl = canvas.getElement();

        // Calculate proper coordinates considering device pixel ratio
        const canvasRect = mainCanvasEl.getBoundingClientRect();
        const scaleX = mainCanvasEl.width / canvasRect.width;
        const scaleY = mainCanvasEl.height / canvasRect.height;

        // Crop the correct area
        tempCtx.drawImage(
          mainCanvasEl,
          left * scaleX,
          top * scaleY,
          width * scaleX,
          height * scaleY,
          0,
          0,
          width,
          height,
        );

        // Apply blur effect on a separate canvas
        const blurCanvas = document.createElement("canvas");
        const blurCtx = blurCanvas.getContext("2d");
        if (!blurCtx) return;

        blurCanvas.width = width;
        blurCanvas.height = height;

        // Apply strong blur filter
        blurCtx.filter = "blur(12px)";
        blurCtx.drawImage(tempCanvas, 0, 0);

        // Create fabric image from blurred canvas
        fabric.Image.fromURL(blurCanvas.toDataURL(), (blurImg: fabric.Image) => {
          const customBlurImg = blurImg as CustomFabricObject;
          customBlurImg.set({
            left: left,
            top: top,
            selectable: false,
            evented: false,
            isBlurPatch: true,
            blurRectId: (blurRect as CustomFabricRect).id,
            opacity: 1,
          });

          canvas.add(blurImg);

          // Make blur rect visible again and bring to front
          blurRect.set({ visible: true });
          canvas.bringToFront(blurRect);
          canvas.renderAll();

          // Reset update flag
          customCanvas.isUpdatingBlur = false;
        });
      });
    },
    [canvas, originalImage],
  );

  const handleAddBlur = useCallback(() => {
    if (!canvas || !originalImage || isDrawing) return;

    setIsSelectMode(false); // Exit select mode when adding blur

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const imgBounds = originalImage.getBoundingRect();

    // Create blur rectangle
    const blurWidth = 150;
    const blurHeight = 100;
    const blurX = Math.max(
      imgBounds.left + 20,
      Math.min(canvasWidth / 2 - blurWidth / 2, imgBounds.left + imgBounds.width - blurWidth - 20),
    );
    const blurY = Math.max(
      imgBounds.top + 20,
      Math.min(canvasHeight / 2 - blurHeight / 2, imgBounds.top + imgBounds.height - blurHeight - 20),
    );

    const blurRect = new fabric.Rect({
      id: Date.now(), // Unique ID for this blur rect
      left: blurX,
      top: blurY,
      width: blurWidth,
      height: blurHeight,
      fill: "transparent",
      stroke: "#8b5cf6",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      opacity: 0.8,
      cornerColor: "#8b5cf6",
      cornerSize: 8,
      transparentCorners: false,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      lockSkewingX: true,
      lockSkewingY: true,
      selectable: true,
      evented: true,
      borderColor: "#8b5cf6",
      cornerStyle: "circle",
    } as any);

    // Initial blur effect
    canvas.add(blurRect);
    canvas.setActiveObject(blurRect);
    updateBlurEffect(blurRect);

    // Throttling variables
    let updateTimeout: NodeJS.Timeout | null = null;
    let isUpdating = false;

    // Smooth update function
    const smoothUpdate = () => {
      if (isUpdating) return;

      isUpdating = true;
      if (updateTimeout) clearTimeout(updateTimeout);

      updateTimeout = setTimeout(() => {
        updateBlurEffect(blurRect);
        isUpdating = false;
      }, 50); // 50ms delay for performance
    };

    // Event listeners with throttling
    blurRect.on("modified", smoothUpdate);
    blurRect.on("moving", smoothUpdate);
    blurRect.on("scaling", smoothUpdate);

    // Add to active blur rects
    setActiveBlurRects((prev) => [...prev, blurRect]);

    canvas.renderAll();
  }, [canvas, originalImage, isDrawing, updateBlurEffect, setIsSelectMode]);

  return {
    activeBlurRects,
    setActiveBlurRects,
    handleAddBlur,
    updateBlurEffect,
  };
};
