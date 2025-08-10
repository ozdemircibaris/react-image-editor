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

      // Get the blur rect's actual position in canvas space
      const rectLeft = blurRect.left || 0;
      const rectTop = blurRect.top || 0;
      const rectWidth = blurRect.getScaledWidth();
      const rectHeight = blurRect.getScaledHeight();

      // Image bounds in canvas-space - image uses originX: "left" and originY: "top"
      const imgLeft = originalImage.left || 0;
      const imgTop = originalImage.top || 0;
      const imgScaledW = originalImage.getScaledWidth();
      const imgScaledH = originalImage.getScaledHeight();

      // Image bounds (top-left corner to bottom-right corner)
      const imgTL = new fabric.Point(imgLeft, imgTop);
      const imgBR = new fabric.Point(imgLeft + imgScaledW, imgTop + imgScaledH);

      // Calculate intersection between blur rect and image (canvas-space)
      const rectRight = rectLeft + rectWidth;
      const rectBottom = rectTop + rectHeight;

      const interLeft = Math.max(imgTL.x, rectLeft);
      const interTop = Math.max(imgTL.y, rectTop);
      const interRight = Math.min(imgBR.x, rectRight);
      const interBottom = Math.min(imgBR.y, rectBottom);
      const interW = Math.max(0, interRight - interLeft);
      const interH = Math.max(0, interBottom - interTop);

      if (interW <= 0 || interH <= 0) {
        // Nothing to blur (outside image)
        blurRect.set({ visible: true });
        canvas.requestRenderAll();
        customCanvas.isUpdatingBlur = false;
        return;
      }

      // Convert intersection to original image pixel coordinates
      const imgScaleX = originalImage.scaleX || 1;
      const imgScaleY = originalImage.scaleY || 1;
      const pxX = Math.round((interLeft - imgTL.x) / imgScaleX);
      const pxY = Math.round((interTop - imgTL.y) / imgScaleY);
      const pxW = Math.round(interW / imgScaleX);
      const pxH = Math.round(interH / imgScaleY);

      const imgEl = originalImage.getElement() as HTMLImageElement;

      requestAnimationFrame(() => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;
        tempCanvas.width = Math.max(1, pxW);
        tempCanvas.height = Math.max(1, pxH);

        // Draw from the original image element at pixel precision
        tempCtx.drawImage(imgEl, pxX, pxY, pxW, pxH, 0, 0, pxW, pxH);

        // Blur on separate canvas
        const blurCanvas = document.createElement("canvas");
        const blurCtx = blurCanvas.getContext("2d");
        if (!blurCtx) return;
        blurCanvas.width = pxW;
        blurCanvas.height = pxH;
        blurCtx.filter = "blur(20px)";
        blurCtx.drawImage(tempCanvas, 0, 0);

        fabric.Image.fromURL(blurCanvas.toDataURL(), (blurImg: fabric.Image) => {
          const customBlurImg = blurImg as CustomFabricObject;
          customBlurImg.set({
            left: interLeft,
            top: interTop,
            originX: "left",
            originY: "top",
            scaleX: imgScaleX,
            scaleY: imgScaleY,
            selectable: false,
            evented: false,
            isBlurPatch: true,
            blurRectId: (blurRect as CustomFabricRect).id,
            opacity: 1,
          });

          canvas.add(blurImg);
          blurRect.set({ visible: true });
          canvas.bringToFront(blurRect);
          canvas.requestRenderAll();
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

    // Compute image bounds in canvas space (independent of viewport)
    const imgScaledW = originalImage.getScaledWidth();
    const imgScaledH = originalImage.getScaledHeight();
    const imgLeft = originalImage.left || 0;
    const imgTop = originalImage.top || 0;
    const imgBounds = {
      left: imgLeft,
      top: imgTop,
      width: imgScaledW,
      height: imgScaledH,
    };

    // Calculate the current viewport center in canvas space
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const inverted = fabric.util.invertTransform(vpt as any);
    const screenCenter = new fabric.Point(canvasWidth / 2, canvasHeight / 2);
    const viewportCenter = fabric.util.transformPoint(screenCenter, inverted);

    // Create blur rectangle
    const blurWidth = 150;
    const blurHeight = 100;

    // Position blur rectangle at viewport center, clamped to image bounds
    let blurX = viewportCenter.x - blurWidth / 2;
    let blurY = viewportCenter.y - blurHeight / 2;

    // Clamp to image bounds with some margin
    blurX = Math.max(imgBounds.left + 20, Math.min(blurX, imgBounds.left + imgBounds.width - blurWidth - 20));
    blurY = Math.max(imgBounds.top + 20, Math.min(blurY, imgBounds.top + imgBounds.height - blurHeight - 20));

    const blurRect = new fabric.Rect({
      id: Date.now(), // Unique ID for this blur rect
      left: blurX,
      top: blurY,
      width: blurWidth,
      height: blurHeight,
      originX: "left",
      originY: "top",
      fill: "transparent",
      stroke: "#8b5cf6",
      strokeWidth: 2,
      strokeUniform: true as any,
      strokeDashArray: [5, 5],
      opacity: 0.9,
      cornerColor: "#8b5cf6",
      cornerSize: 10,
      transparentCorners: false,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      lockSkewingX: true,
      lockSkewingY: true,
      lockScalingFlip: true as any,
      centeredScaling: false as any,
      objectCaching: false as any,
      selectable: true,
      evented: true,
      borderColor: "#8b5cf6",
      cornerStyle: "rect" as any,
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
