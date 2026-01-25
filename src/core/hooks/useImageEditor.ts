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
import { CleanupManager, calculateCanvasSize } from "../utils";

import { useHistory } from "./useHistory";
import { useBlur } from "./useBlur";
import { useCrop } from "./useCrop";
import { useDrawing } from "./useDrawing";
import { useShapes } from "./useShapes";
import { useText } from "./useText";
import { useSelection } from "./useSelection";
import { useZoom } from "./useZoom";
import { useExport } from "./useExport";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG = {
  imageUrl: "",
  width: undefined as number | undefined,
  height: undefined as number | undefined,
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
 *       <button onClick={editor.blur.add}>Add Blur</button>
 *       <button onClick={editor.crop.start}>Crop</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useImageEditor(
  config: Partial<ImageEditorConfig> = {}
): UseImageEditorReturn {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // ========== Refs ==========
  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);
  const originalImageRef = useRef<fabric.Image | null>(null);
  const cleanupRef = useRef(new CleanupManager());
  const isInitializedRef = useRef(false);
  const loadingImageRef = useRef<string | null>(null);

  // Config ref - always has current config without causing re-renders
  const configRef = useRef(mergedConfig);
  useEffect(() => {
    configRef.current = mergedConfig;
  });

  // ========== State ==========
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null
  );
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [originalImage, setOriginalImage] = useState<fabric.Image | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [currentColor, setCurrentColor] = useState(mergedConfig.defaultColor);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(
    mergedConfig.defaultStrokeWidth
  );

  // ========== Callback ref for canvas element ==========
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    setCanvasElement(node);
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    canvasInstanceRef.current = canvas;
  }, [canvas]);

  useEffect(() => {
    originalImageRef.current = originalImage;
  }, [originalImage]);

  // ========== Update original image reference after undo/redo ==========
  const updateOriginalImageReference = useCallback(() => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas) return;

    try {
      const objects = currentCanvas.getObjects();
      const imageObj = objects.find(
        (obj) => (obj as EditorFabricImage).id === "originalImage"
      ) as fabric.Image;

      if (imageObj) {
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
    } catch {
      // Canvas might be disposed
    }
  }, []);

  // ========== History hook ==========
  const history = useHistory(canvasInstanceRef, {
    maxHistorySize: mergedConfig.maxHistorySize,
    throttleMs: mergedConfig.historyThrottleMs,
    onAfterStateLoad: updateOriginalImageReference,
  });

  // History ref for use in callbacks without dependency
  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  });

  // ========== Set original image callback ==========
  const setOriginalImageCallback = useCallback((img: fabric.Image | null) => {
    if (img) {
      (img as EditorFabricImage).id = "originalImage";
    }
    setOriginalImage(img);
    originalImageRef.current = img;
    setHasImage(img !== null);
  }, []);

  // ========== Feature hooks ==========
  const blur = useBlur(canvasInstanceRef, originalImageRef, {
    blurIntensity: mergedConfig.blurIntensity,
    throttleMs: mergedConfig.blurThrottleMs,
    onBlurAdd: () => historyRef.current.saveState(),
  });

  const crop = useCrop(
    canvasInstanceRef,
    originalImageRef,
    setOriginalImageCallback,
    {
      onCropApply: () => {
        historyRef.current.initializeHistory();
      },
    }
  );

  const drawing = useDrawing(canvasInstanceRef, originalImageRef, {
    initialColor: mergedConfig.defaultColor,
    initialWidth: mergedConfig.defaultStrokeWidth,
  });

  const selectionHook = useSelection(canvasInstanceRef, originalImageRef, {
    onDelete: () => historyRef.current.saveState(),
  });

  const shapes = useShapes(canvasInstanceRef, originalImageRef, {
    defaultColor: currentColor,
    defaultStrokeWidth: currentStrokeWidth,
    onShapeAdd: () => historyRef.current.saveState(),
  });

  const text = useText(canvasInstanceRef, originalImageRef, {
    defaultColor: currentColor,
    onTextAdd: () => historyRef.current.saveState(),
    onTextEditEnd: () => historyRef.current.saveState(),
  });

  const zoomHook = useZoom(canvasInstanceRef);
  const exportHook = useExport(canvasInstanceRef, originalImageRef);

  // Selection hook ref for event handlers
  const selectionHookRef = useRef(selectionHook);
  useEffect(() => {
    selectionHookRef.current = selectionHook;
  });

  // ========== Keyboard shortcuts ==========
  useKeyboardShortcuts({
    onUndo: history.undo,
    onRedo: history.redo,
    onDelete: selectionHook.deleteSelected,
    canDelete: () => !!selectionHook.selectedObject,
  });

  // ========== Get canvas dimensions ==========
  const getCanvasDimensions = useCallback(() => {
    const cfg = configRef.current;
    if (cfg.width && cfg.height) {
      return { width: cfg.width, height: cfg.height };
    }
    return calculateCanvasSize(
      typeof window !== "undefined" ? window.innerWidth : 800,
      typeof window !== "undefined" ? window.innerHeight : 600
    );
  }, []);

  // ========== Load image (stable function, uses refs) ==========
  const loadImage = useCallback(
    async (url: string): Promise<fabric.Image | undefined> => {
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas || !url) return;

      // Prevent duplicate loads
      if (loadingImageRef.current === url) return;
      loadingImageRef.current = url;

      return new Promise<fabric.Image>((resolve, reject) => {
        fabric.Image.fromURL(
          url,
          (img) => {
            // Clear loading state
            loadingImageRef.current = null;

            // Re-check canvas - might be disposed while loading
            const canvas = canvasInstanceRef.current;
            if (!canvas) {
              reject(new Error("Canvas was disposed"));
              return;
            }

            if (!img || !img.width || !img.height) {
              reject(new Error("Failed to load image"));
              return;
            }

            try {
              const canvasWidth = canvas.getWidth();
              const canvasHeight = canvas.getHeight();
              const padding = configRef.current.canvasPadding;

              // Store original dimensions BEFORE scaling
              const originalWidth = img.width || 0;
              const originalHeight = img.height || 0;

              const maxWidth = canvasWidth - padding * 2;
              const maxHeight = canvasHeight - padding * 2;
              const scaleX = maxWidth / img.width;
              const scaleY = maxHeight / img.height;
              const scale = Math.min(scaleX, scaleY, 1);

              img.scale(scale);

              // Store original dimensions on the image object for export
              (img as EditorFabricImage).originalWidth = originalWidth;
              (img as EditorFabricImage).originalHeight = originalHeight;

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

              canvas.add(img);
              canvas.renderAll();

              setOriginalImage(img);
              originalImageRef.current = img;
              setHasImage(true);

              // Initialize history after image is loaded
              historyRef.current.initializeHistory();

              resolve(img);
            } catch {
              reject(new Error("Canvas was disposed during render"));
            }
          },
          { crossOrigin: "anonymous" }
        );
      }).catch((err) => {
        // Silently handle disposed canvas errors
        if (err?.message?.includes("disposed")) {
          return undefined;
        }
        return undefined;
      });
    },
    []
  );

  // ========== Initialize canvas ==========
  useEffect(() => {
    // Skip if no canvas element
    if (!canvasElement) return;

    // Skip if already initialized (React 18 Strict Mode protection)
    if (isInitializedRef.current && canvasInstanceRef.current) return;

    const { width, height } = getCanvasDimensions();
    const fabricCanvas = new fabric.Canvas(canvasElement);

    fabricCanvas.setWidth(width);
    fabricCanvas.setHeight(height);
    fabricCanvas.setBackgroundColor("transparent", () => {
      fabricCanvas.renderAll();
    });

    canvasInstanceRef.current = fabricCanvas;
    isInitializedRef.current = true;
    setCanvas(fabricCanvas);

    // Load initial image if URL is provided
    const initialUrl = configRef.current.imageUrl;
    if (initialUrl) {
      loadImage(initialUrl);
    }

    return () => {
      cleanupRef.current.cleanup();
      isInitializedRef.current = false;
      loadingImageRef.current = null;

      if (canvasInstanceRef.current) {
        try {
          canvasInstanceRef.current.dispose();
        } catch {
          // Canvas might already be disposed
        }
        canvasInstanceRef.current = null;
        setCanvas(null);
      }
    };
  }, [canvasElement, getCanvasDimensions, loadImage]);

  // ========== Handle window resize ==========
  useEffect(() => {
    const cfg = configRef.current;
    if (cfg.width && cfg.height) return;

    const handleResize = () => {
      const currentCanvas = canvasInstanceRef.current;
      if (!currentCanvas) return;

      try {
        const { width, height } = getCanvasDimensions();
        currentCanvas.setWidth(width);
        currentCanvas.setHeight(height);
        currentCanvas.renderAll();
      } catch {
        // Canvas might be disposed
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getCanvasDimensions]);

  // ========== Load image when imageUrl changes ==========
  useEffect(() => {
    const currentCanvas = canvasInstanceRef.current;
    const imageUrl = mergedConfig.imageUrl;

    // Skip if no canvas or no URL
    if (!currentCanvas || !imageUrl) return;

    // Skip if this is the initial load (handled in initialization)
    if (!isInitializedRef.current) return;

    // Clear existing objects
    try {
      const objects = currentCanvas.getObjects();
      objects.forEach((obj) => {
        currentCanvas.remove(obj);
      });
      currentCanvas.renderAll();
    } catch {
      return;
    }

    setOriginalImage(null);
    originalImageRef.current = null;
    setHasImage(false);

    loadImage(imageUrl);
  }, [mergedConfig.imageUrl, loadImage]);

  // ========== Canvas event listeners ==========
  useEffect(() => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas) return;

    const onSelectionCreated = (e: FabricSelectionEvent) => {
      if (e.selected?.[0]) {
        const hook = selectionHookRef.current as unknown as {
          _handleSelect: (obj: fabric.Object) => void;
        };
        hook._handleSelect(e.selected[0]);
      }
    };

    const onSelectionUpdated = (e: FabricSelectionEvent) => {
      if (e.selected?.[0]) {
        const hook = selectionHookRef.current as unknown as {
          _handleSelect: (obj: fabric.Object) => void;
        };
        hook._handleSelect(e.selected[0]);
      }
    };

    const onSelectionCleared = () => {
      selectionHookRef.current.clearSelection();
    };

    const onPathCreated = (e: FabricPathCreatedEvent) => {
      if (e.path) {
        const path = e.path as EditorFabricPath;
        path.isDrawing = true;
        historyRef.current.saveState();
      }
    };

    const onObjectModified = () => {
      historyRef.current.saveState();
    };

    currentCanvas.on("selection:created", onSelectionCreated);
    currentCanvas.on("selection:updated", onSelectionUpdated);
    currentCanvas.on("selection:cleared", onSelectionCleared);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentCanvas.on("path:created", onPathCreated as any);
    currentCanvas.on("object:modified", onObjectModified);

    return () => {
      try {
        currentCanvas.off("selection:created", onSelectionCreated);
        currentCanvas.off("selection:updated", onSelectionUpdated);
        currentCanvas.off("selection:cleared", onSelectionCleared);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentCanvas.off("path:created", onPathCreated as any);
        currentCanvas.off("object:modified", onObjectModified);
      } catch {
        // Canvas might be disposed
      }
    };
  }, [canvas]); // Only re-run when canvas changes

  // ========== Update drawing brush ==========
  useEffect(() => {
    const currentCanvas = canvasInstanceRef.current;
    if (!currentCanvas) return;

    if (currentCanvas.freeDrawingBrush) {
      currentCanvas.freeDrawingBrush.color = currentColor;
      currentCanvas.freeDrawingBrush.width = currentStrokeWidth;
    }
  }, [currentColor, currentStrokeWidth]);

  // ========== Style handlers ==========
  const setColor = useCallback(
    (color: string) => {
      setCurrentColor(color);

      if (selectionHook.selectedObject) {
        selectionHook.setSelectedColor(color);
        historyRef.current.saveState();
      }

      drawing.setBrushColor(color);
    },
    [selectionHook, drawing]
  );

  const setStrokeWidth = useCallback(
    (width: number) => {
      setCurrentStrokeWidth(width);

      if (selectionHook.selectedObject) {
        selectionHook.setSelectedStrokeWidth(width);
        historyRef.current.saveState();
      }

      drawing.setBrushWidth(width);
    },
    [selectionHook, drawing]
  );

  // ========== Dispose ==========
  const dispose = useCallback(() => {
    cleanupRef.current.cleanup();
    blur.clearAllBlur();
    isInitializedRef.current = false;
    loadingImageRef.current = null;

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

  // ========== State object ==========
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
      zoom: zoomHook.zoom,
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
      zoomHook.zoom,
    ]
  );

  // ========== Return ==========
  return {
    canvas,
    canvasRef,
    originalImage,
    hasImage,
    state,
    history: {
      save: history.saveState,
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      clear: history.clearHistory,
    },
    blur: {
      add: blur.addBlur,
      remove: blur.removeBlur,
      clearAll: blur.clearAllBlur,
      activeRects: blur.activeBlurRects,
    },
    crop: {
      start: crop.startCrop,
      apply: crop.applyCrop,
      cancel: crop.cancelCrop,
      isActive: crop.isCropping,
    },
    drawing: {
      enable: drawing.enableDrawing,
      disable: drawing.disableDrawing,
      toggle: drawing.toggleDrawing,
      isActive: drawing.isDrawing,
    },
    shapes: {
      addRectangle: shapes.addRectangle,
      addCircle: shapes.addCircle,
      add: shapes.addShape,
    },
    text: {
      add: text.addText,
      setFontSize: text.setFontSize,
      setFontFamily: text.setFontFamily,
      setColor: text.setTextColor,
      setFontWeight: text.setFontWeight,
      setFontStyle: text.setFontStyle,
      fontFamilies: text.fontFamilies,
    },
    selection: {
      enable: selectionHook.enableSelectMode,
      disable: selectionHook.disableSelectMode,
      toggle: selectionHook.toggleSelectMode,
      deleteSelected: selectionHook.deleteSelected,
      selected: selectionHook.selectedObject,
      clear: selectionHook.clearSelection,
      isActive: selectionHook.isSelectMode,
    },
    style: {
      color: currentColor,
      setColor,
      strokeWidth: currentStrokeWidth,
      setStrokeWidth,
    },
    zoom: {
      level: zoomHook.zoom,
      in: zoomHook.zoomIn,
      out: zoomHook.zoomOut,
      set: zoomHook.setZoom,
      reset: zoomHook.resetZoom,
    },
    exportToBlob: exportHook.exportToBlob,
    exportToDataURL: exportHook.exportToDataURL,
    dispose,
  };
}

export default useImageEditor;
