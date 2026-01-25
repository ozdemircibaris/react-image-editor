import { fabric } from "fabric";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  EditorFabricImage,
  EditorFabricPath,
  EditorState,
  FabricPathCreatedEvent,
  FabricSelectionEvent,
  ImageEditorConfig,
  UseImageEditorReturn,
} from "../types";
import {
  animateZoomTo,
  clampZoom,
  CleanupManager,
  addTrackedEventListener,
  dataURLToBlob,
} from "../utils";

import { useHistory } from "./useHistory";
import { useBlur } from "./useBlur";
import { useCrop } from "./useCrop";
import { useDrawing } from "./useDrawing";
import { useShapes } from "./useShapes";
import { useSelection } from "./useSelection";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<ImageEditorConfig> = {
  imageUrl: "",
  maxHistorySize: 50,
  defaultColor: "#ff7000",
  defaultStrokeWidth: 2,
  blurIntensity: 20,
  historyThrottleMs: 300,
  blurThrottleMs: 50,
  canvasPadding: 24,
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Main headless hook for the image editor
 *
 * @example
 * ```tsx
 * function MyEditor() {
 *   const editor = useImageEditor({
 *     imageUrl: '/path/to/image.jpg',
 *   });
 *
 *   return (
 *     <div>
 *       <canvas ref={editor.canvasRef} />
 *
 *       <button onClick={editor.blur.add}>Add Blur</button>
 *       <button onClick={editor.crop.start}>Crop</button>
 *       <button onClick={editor.drawing.toggle}>
 *         {editor.drawing.isActive ? 'Stop Drawing' : 'Draw'}
 *       </button>
 *       <button onClick={editor.shapes.addRectangle}>Rectangle</button>
 *       <button onClick={editor.shapes.addCircle}>Circle</button>
 *       <button onClick={editor.history.undo} disabled={!editor.history.canUndo}>
 *         Undo
 *       </button>
 *       <button onClick={editor.history.redo} disabled={!editor.history.canRedo}>
 *         Redo
 *       </button>
 *
 *       <input
 *         type="color"
 *         value={editor.style.color}
 *         onChange={(e) => editor.style.setColor(e.target.value)}
 *       />
 *
 *       <button onClick={async () => {
 *         const blob = await editor.exportToBlob();
 *         if (blob) saveImage(blob);
 *       }}>
 *         Save
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useImageEditor(
  config: Partial<ImageEditorConfig> = {}
): UseImageEditorReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  const originalImageRef = useRef<fabric.Image | null>(null);
  const cleanupRef = useRef(new CleanupManager());

  // State
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [originalImage, setOriginalImage] = useState<fabric.Image | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [currentColor, setCurrentColor] = useState(mergedConfig.defaultColor);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(
    mergedConfig.defaultStrokeWidth
  );
  const [zoom, setZoomLevel] = useState(1);

  // Keep refs in sync
  useEffect(() => {
    canvasInstanceRef.current = canvas;
  }, [canvas]);

  useEffect(() => {
    originalImageRef.current = originalImage;
  }, [originalImage]);

  // Update original image reference after undo/redo
  const updateOriginalImageReference = useCallback(() => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas) return;

    const objects = currentCanvas.getObjects();
    const imageObj = objects.find(
      (obj) => (obj as EditorFabricImage).id === "originalImage"
    ) as fabric.Image;

    if (imageObj) {
      // Keep image locked
      imageObj.set({
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
      currentCanvas.renderAll();
      setOriginalImage(imageObj);
      originalImageRef.current = imageObj;
    }
  }, []);

  // History hook
  const history = useHistory(canvasInstanceRef, {
    maxHistorySize: mergedConfig.maxHistorySize,
    throttleMs: mergedConfig.historyThrottleMs,
    onAfterStateLoad: updateOriginalImageReference,
  });

  // Set original image callback
  const setOriginalImageCallback = useCallback((img: fabric.Image | null) => {
    if (img) {
      (img as EditorFabricImage).id = "originalImage";
    }
    setOriginalImage(img);
    originalImageRef.current = img;
    setHasImage(img !== null);
  }, []);

  // Blur hook
  const blur = useBlur(canvasInstanceRef, originalImageRef, {
    blurIntensity: mergedConfig.blurIntensity,
    throttleMs: mergedConfig.blurThrottleMs,
    onBlurAdd: () => history.saveState(),
  });

  // Crop hook
  const crop = useCrop(
    canvasInstanceRef,
    originalImageRef,
    setOriginalImageCallback,
    {
      onCropApply: () => {
        history.initializeHistory();
      },
    }
  );

  // Drawing hook
  const drawing = useDrawing(canvasInstanceRef, originalImageRef, {
    initialColor: mergedConfig.defaultColor,
    initialWidth: mergedConfig.defaultStrokeWidth,
  });

  // Selection hook
  const selectionHook = useSelection(canvasInstanceRef, originalImageRef, {
    onDelete: () => history.saveState(),
  });

  // Shapes hook
  const shapes = useShapes(canvasInstanceRef, originalImageRef, {
    defaultColor: currentColor,
    defaultStrokeWidth: currentStrokeWidth,
    onShapeAdd: () => history.saveState(),
  });

  // Load image
  const loadImage = useCallback(
    async (url: string) => {
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas || !url) return;

      return new Promise<fabric.Image>((resolve, reject) => {
        fabric.Image.fromURL(
          url,
          (img) => {
            if (!img || !img.width || !img.height) {
              reject(new Error("Failed to load image"));
              return;
            }

            const canvasWidth = currentCanvas.getWidth();
            const canvasHeight = currentCanvas.getHeight();
            const padding = mergedConfig.canvasPadding;

            const maxWidth = canvasWidth - padding * 2;
            const maxHeight = canvasHeight - padding * 2;
            const scaleX = maxWidth / img.width;
            const scaleY = maxHeight / img.height;
            const scale = Math.min(scaleX, scaleY, 1);

            img.scale(scale);

            const scaledWidth = img.getScaledWidth();
            const scaledHeight = img.getScaledHeight();
            const left = (canvasWidth - scaledWidth) / 2;
            const top = (canvasHeight - scaledHeight) / 2;

            img.set({
              left,
              top,
              originX: "left",
              originY: "top",
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

            (img as EditorFabricImage).id = "originalImage";

            currentCanvas.add(img);
            currentCanvas.renderAll();

            setOriginalImage(img);
            originalImageRef.current = img;
            setHasImage(true);

            history.initializeHistory();

            resolve(img);
          },
          { crossOrigin: "anonymous" }
        );
      });
    },
    [mergedConfig.canvasPadding, history]
  );

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || canvasInstanceRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current);
    fabricCanvas.setBackgroundColor("transparent", () => {
      fabricCanvas.renderAll();
    });

    canvasInstanceRef.current = fabricCanvas;
    setCanvas(fabricCanvas);

    // Load image if URL provided
    if (mergedConfig.imageUrl) {
      loadImage(mergedConfig.imageUrl);
    }

    return () => {
      cleanupRef.current.cleanup();
      if (canvasInstanceRef.current) {
        try {
          canvasInstanceRef.current.dispose();
        } catch {
          // Canvas might already be disposed
        }
        canvasInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Load image when imageUrl changes
  useEffect(() => {
    if (!canvasInstanceRef.current || !mergedConfig.imageUrl) return;

    // Clear existing objects except background
    const currentCanvas = canvasInstanceRef.current;
    const objects = currentCanvas.getObjects();
    objects.forEach((obj) => {
      currentCanvas.remove(obj);
    });
    currentCanvas.renderAll();

    // Reset state
    setOriginalImage(null);
    originalImageRef.current = null;
    setHasImage(false);

    // Load new image
    loadImage(mergedConfig.imageUrl);
  }, [mergedConfig.imageUrl, loadImage]);

  // Canvas event listeners
  useEffect(() => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas) return;

    const cleanup = cleanupRef.current;

    // Selection events
    const onSelectionCreated = (e: FabricSelectionEvent) => {
      if (e.selected?.[0]) {
        (selectionHook as unknown as { _handleSelect: (obj: fabric.Object) => void })._handleSelect(e.selected[0]);
      }
    };

    const onSelectionUpdated = (e: FabricSelectionEvent) => {
      if (e.selected?.[0]) {
        (selectionHook as unknown as { _handleSelect: (obj: fabric.Object) => void })._handleSelect(e.selected[0]);
      }
    };

    const onSelectionCleared = () => {
      selectionHook.clearSelection();
    };

    // Path created (drawing)
    const onPathCreated = (e: FabricPathCreatedEvent) => {
      if (e.path) {
        const path = e.path as EditorFabricPath;
        path.isDrawing = true;
        history.saveState();
      }
    };

    // Object modified
    const onObjectModified = () => {
      history.saveState();
    };

    currentCanvas.on("selection:created", onSelectionCreated);
    currentCanvas.on("selection:updated", onSelectionUpdated);
    currentCanvas.on("selection:cleared", onSelectionCleared);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentCanvas.on("path:created", onPathCreated as any);
    currentCanvas.on("object:modified", onObjectModified);

    // Keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      }
      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        history.redo();
      }
      // Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement?.tagName === "INPUT" ||
          activeElement?.tagName === "TEXTAREA";

        if (!isInputFocused && selectionHook.selectedObject) {
          e.preventDefault();
          selectionHook.deleteSelected();
        }
      }
    };

    addTrackedEventListener(window, "keydown", onKeyDown, cleanup);

    return () => {
      currentCanvas.off("selection:created", onSelectionCreated);
      currentCanvas.off("selection:updated", onSelectionUpdated);
      currentCanvas.off("selection:cleared", onSelectionCleared);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentCanvas.off("path:created", onPathCreated as any);
      currentCanvas.off("object:modified", onObjectModified);
      cleanup.cleanup();
    };
  }, [history, selectionHook]);

  // Update drawing brush when color/width changes
  useEffect(() => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas) return;

    if (currentCanvas.freeDrawingBrush) {
      currentCanvas.freeDrawingBrush.color = currentColor;
      currentCanvas.freeDrawingBrush.width = currentStrokeWidth;
    }
  }, [currentColor, currentStrokeWidth]);

  // Style handlers
  const setColor = useCallback(
    (color: string) => {
      setCurrentColor(color);

      // Update selected object if any
      if (selectionHook.selectedObject) {
        selectionHook.setSelectedColor(color);
        history.saveState();
      }

      // Update drawing brush
      drawing.setBrushColor(color);
    },
    [selectionHook, drawing, history]
  );

  const setStrokeWidth = useCallback(
    (width: number) => {
      setCurrentStrokeWidth(width);

      // Update selected object if any
      if (selectionHook.selectedObject) {
        selectionHook.setSelectedStrokeWidth(width);
        history.saveState();
      }

      // Update drawing brush
      drawing.setBrushWidth(width);
    },
    [selectionHook, drawing, history]
  );

  // Zoom handlers
  const zoomIn = useCallback(
    (factor: number = 1.2) => {
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas) return;

      const newZoom = clampZoom(currentCanvas.getZoom() * factor);
      animateZoomTo(currentCanvas, newZoom);
      setZoomLevel(newZoom);
    },
    []
  );

  const zoomOut = useCallback(
    (factor: number = 1.2) => {
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas) return;

      const newZoom = clampZoom(currentCanvas.getZoom() / factor);
      animateZoomTo(currentCanvas, newZoom);
      setZoomLevel(newZoom);
    },
    []
  );

  const setZoom = useCallback((level: number) => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas) return;

    const clampedZoom = clampZoom(level);
    animateZoomTo(currentCanvas, clampedZoom);
    setZoomLevel(clampedZoom);
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  // Export handlers
  const exportToBlob = useCallback(async (): Promise<Blob | null> => {
    const currentCanvas = canvasInstanceRef.current;
    const image = originalImageRef.current;
    if (!currentCanvas || !image) return null;

    try {
      // Store viewport state
      const currentVPT = currentCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const currentZoom = currentCanvas.getZoom();

      // Reset viewport
      currentCanvas.setZoom(1);
      currentCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // Get bounds
      const imgLeft = image.left || 0;
      const imgTop = image.top || 0;
      const imgWidth = image.getScaledWidth();
      const imgHeight = image.getScaledHeight();

      let minX = imgLeft;
      let minY = imgTop;
      let maxX = imgLeft + imgWidth;
      let maxY = imgTop + imgHeight;

      // Include other objects
      currentCanvas.getObjects().forEach((obj) => {
        if (obj !== image) {
          const bounds = obj.getBoundingRect();
          minX = Math.min(minX, bounds.left);
          minY = Math.min(minY, bounds.top);
          maxX = Math.max(maxX, bounds.left + bounds.width);
          maxY = Math.max(maxY, bounds.top + bounds.height);
        }
      });

      // Clamp to canvas
      const canvasWidth = currentCanvas.getWidth();
      const canvasHeight = currentCanvas.getHeight();
      minX = Math.max(0, minX);
      minY = Math.max(0, minY);
      maxX = Math.min(canvasWidth, maxX);
      maxY = Math.min(canvasHeight, maxY);

      const dataURL = currentCanvas.toDataURL({
        format: "png",
        quality: 1,
        left: Math.round(minX),
        top: Math.round(minY),
        width: Math.round(maxX - minX),
        height: Math.round(maxY - minY),
        multiplier: 1,
      });

      // Restore viewport
      currentCanvas.setZoom(currentZoom);
      currentCanvas.setViewportTransform(currentVPT);
      currentCanvas.renderAll();

      return await dataURLToBlob(dataURL);
    } catch (error) {
      console.error("Export error:", error);
      return null;
    }
  }, []);

  const exportToDataURL = useCallback(
    (format: string = "png", quality: number = 1): string | null => {
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas) return null;

      return currentCanvas.toDataURL({ format, quality });
    },
    []
  );

  // Dispose
  const dispose = useCallback(() => {
    cleanupRef.current.cleanup();
    blur.clearAllBlur();

    if (canvasInstanceRef.current) {
      try {
        canvasInstanceRef.current.dispose();
      } catch {
        // Canvas might already be disposed
      }
      canvasInstanceRef.current = null;
    }

    setCanvas(null);
    setOriginalImage(null);
    setHasImage(false);
  }, [blur]);

  // State object
  const state: EditorState = useMemo(
    () => ({
      hasImage,
      isDrawing: drawing.isDrawing,
      isCropping: crop.isCropping,
      isSelectMode: selectionHook.isSelectMode,
      selectedObject: selectionHook.selectedObject,
      currentColor,
      currentStrokeWidth,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      zoom,
    }),
    [
      hasImage,
      drawing.isDrawing,
      crop.isCropping,
      selectionHook.isSelectMode,
      selectionHook.selectedObject,
      currentColor,
      currentStrokeWidth,
      history.canUndo,
      history.canRedo,
      zoom,
    ]
  );

  return {
    // Canvas
    canvas,
    canvasRef,
    originalImage,
    hasImage,

    // State
    state,

    // History
    history: {
      save: history.saveState,
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      clear: history.clearHistory,
    },

    // Blur
    blur: {
      add: blur.addBlur,
      remove: blur.removeBlur,
      clearAll: blur.clearAllBlur,
      activeRects: blur.activeBlurRects,
    },

    // Crop
    crop: {
      start: crop.startCrop,
      apply: crop.applyCrop,
      cancel: crop.cancelCrop,
      isActive: crop.isCropping,
    },

    // Drawing
    drawing: {
      enable: drawing.enableDrawing,
      disable: drawing.disableDrawing,
      toggle: drawing.toggleDrawing,
      isActive: drawing.isDrawing,
    },

    // Shapes
    shapes: {
      addRectangle: shapes.addRectangle,
      addCircle: shapes.addCircle,
      add: shapes.addShape,
    },

    // Selection
    selection: {
      enable: selectionHook.enableSelectMode,
      disable: selectionHook.disableSelectMode,
      toggle: selectionHook.toggleSelectMode,
      deleteSelected: selectionHook.deleteSelected,
      selected: selectionHook.selectedObject,
      clear: selectionHook.clearSelection,
      isActive: selectionHook.isSelectMode,
    },

    // Style
    style: {
      color: currentColor,
      setColor,
      strokeWidth: currentStrokeWidth,
      setStrokeWidth,
    },

    // Zoom
    zoom: {
      level: zoom,
      in: zoomIn,
      out: zoomOut,
      set: setZoom,
      reset: resetZoom,
    },

    // Export
    exportToBlob,
    exportToDataURL,

    // Lifecycle
    dispose,
  };
}

export default useImageEditor;
