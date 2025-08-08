import { fabric } from "fabric";
import { useEffect, useCallback, useState } from "react";

import { Icon, Button } from "../UI";

import { CanvasEditor } from "./CanvasEditor";
import { useBlurHandlers } from "./hooks/useBlurHandlers";
import { useCropHandlers } from "./hooks/useCropHandlers";
import { useShapeHandlers } from "./hooks/useShapeHandlers";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { Toolbar } from "./Toolbar";
import type { CustomFabricObject, CustomFabricImage, CustomFabricPath, FabricSelectionEvent } from "./types";

// Import and inject styles
import { injectStyles } from "./styles";

export interface IImageEditorProps {
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
}

const ImageEditor = (props: IImageEditorProps) => {
  const { imageUrl, onSave, onCancel } = props;

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [hasImage, setHasImage] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(true); // Default to select mode
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [currentColor, setCurrentColor] = useState("#ff7000"); // Primary orange
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2); // Default stroke width
  const [originalImage, setOriginalImage] = useState<fabric.Image | null>(null);

  // Use blur handlers hook
  const { activeBlurRects, setActiveBlurRects, handleAddBlur } = useBlurHandlers(
    canvas,
    originalImage,
    isDrawing,
    setIsSelectMode,
  );

  // Use crop handlers hook
  const { isCropping, setIsCropping, handleCropStart, handleCropApply, handleCropCancel } = useCropHandlers(
    canvas,
    originalImage,
    isDrawing,
    activeBlurRects,
    setActiveBlurRects,
    setIsSelectMode,
    setOriginalImage,
  );

  // Use shape handlers hook
  const { handleAddShape } = useShapeHandlers(
    canvas,
    isCropping,
    isDrawing,
    currentColor,
    currentStrokeWidth,
    setIsSelectMode,
  );

  // Function to update originalImage reference after undo/redo
  const updateOriginalImageReference = useCallback(() => {
    if (!canvas) return;

    // Find the image object that should be the originalImage by ID
    const objects = canvas.getObjects();
    const imageObj = objects.find((obj) => (obj as CustomFabricImage).id === "originalImage") as fabric.Image;

    if (imageObj) {
      // Ensure the image remains locked
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
      setOriginalImage(imageObj);
      canvas.renderAll();
    }
  }, [canvas]);

  // Use undo/redo handlers hook
  const { saveState, undo, redo, initializeHistory, canUndo, canRedo } = useUndoRedo(
    canvas,
    50,
    updateOriginalImageReference,
  );

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

      // Ensure select mode is active by default
      setIsSelectMode(true);
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
      const margin = 24; // px visual breathing room
      const scale = Math.min((canvasWidth - margin * 2) / imgWidth, (canvasHeight - margin * 2) / imgHeight, 1);
      const scaleX = scale;
      const scaleY = scale;

      img.set({
        originX: "left",
        originY: "top",
        scaleX: scaleX,
        scaleY: scaleY,
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

  const handleToggleDraw = useCallback(() => {
    if (!canvas) return;

    const newDrawingState = !isDrawing;
    setIsDrawing(newDrawingState);
    setIsSelectMode(false); // Exit select mode when drawing
    canvas.isDrawingMode = newDrawingState;

    if (newDrawingState) {
      // Ensure all objects are not selectable when drawing (except originalImage which should always stay locked)
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (obj !== originalImage && !(obj as CustomFabricObject).isDrawing) {
          obj.set({
            selectable: false,
            evented: false,
          });
        }
      });
      canvas.discardActiveObject();
    } else {
      // Re-enable selection for blur rects and shapes
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (
          obj !== originalImage &&
          !(obj as CustomFabricObject).isBlurPatch &&
          !(obj as CustomFabricObject).isDrawing
        ) {
          obj.set({
            selectable: true,
            evented: true,
          });
        }
      });
      setIsSelectMode(true); // Return to select mode when drawing is disabled
    }

    canvas.renderAll();
  }, [canvas, isDrawing, originalImage]);

  const handleToggleSelectMode = useCallback(() => {
    if (!canvas) return;

    const newSelectMode = !isSelectMode;
    setIsSelectMode(newSelectMode);

    if (newSelectMode) {
      // Exit other modes
      setIsDrawing(false);
      setIsCropping(false);
      canvas.isDrawingMode = false;

      // Re-enable selection for all objects
      canvas.getObjects().forEach((obj: fabric.Object) => {
        if (obj !== originalImage && !(obj as CustomFabricObject).isBlurPatch) {
          obj.set({
            selectable: true,
            evented: true,
          });
        }
      });
    }

    canvas.renderAll();
  }, [canvas, isSelectMode, originalImage]);

  // Handle object selection
  const handleObjectSelection = useCallback((e: FabricSelectionEvent) => {
    const obj = e.selected?.[0];
    if (obj) {
      setSelectedObject(obj);
      // Get current color and stroke width from selected object
      const strokeColor = (obj as CustomFabricObject).stroke || "#D64045";
      const strokeWidth = (obj as CustomFabricObject).strokeWidth || 2;
      setCurrentColor(strokeColor);
      setCurrentStrokeWidth(strokeWidth);
    }
  }, []);

  // Handle object deselection
  const handleObjectDeselection = useCallback(() => {
    setSelectedObject(null);
  }, []);

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
    [selectedObject, canvas],
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
    [selectedObject, canvas],
  );

  const handleSave = useCallback(() => {
    if (!canvas) return;

    try {
      // If we have the original image, export exactly its bounds scaled to its natural resolution
      if (originalImage) {
        const imgEl = originalImage.getElement() as HTMLImageElement;
        const naturalWidth = (imgEl as any).naturalWidth || imgEl.width || originalImage.width || 0;
        const naturalHeight = (imgEl as any).naturalHeight || imgEl.height || originalImage.height || 0;

        const displayedWidth = originalImage.getScaledWidth();
        const displayedHeight = originalImage.getScaledHeight();

        const left = (originalImage.left || 0) - displayedWidth / 2;
        const top = (originalImage.top || 0) - displayedHeight / 2;

        const prevVpt = (canvas.viewportTransform || [1, 0, 0, 1, 0, 0]).slice() as number[];
        const prevZoom = canvas.getZoom();
        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

        const multiplier = Math.max(1, Math.min(8, naturalWidth / Math.max(1, displayedWidth)));

        const dataURL = canvas.toDataURL({
          format: "png",
          quality: 1,
          left: Math.max(0, Math.round(left)),
          top: Math.max(0, Math.round(top)),
          width: Math.round(displayedWidth),
          height: Math.round(displayedHeight),
          multiplier,
        });

        // Restore view
        canvas.setViewportTransform(prevVpt);
        canvas.setZoom(prevZoom);

        fetch(dataURL)
          .then((res) => res.blob())
          .then((blob) => onSave(blob));
        return;
      }

      // Fallback: export whole canvas
      const dataURL = canvas.toDataURL({ format: "png", quality: 1 });
      fetch(dataURL)
        .then((res) => res.blob())
        .then((blob) => onSave(blob));
    } catch (error) {
      console.error("Error exporting image:", error);
    }
  }, [canvas, onSave, originalImage]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Mark drawn paths so they can be identified
  useEffect(() => {
    if (!canvas) return;

    const handlePathCreated = (e: fabric.IEvent<Event>) => {
      const path = (e as any).path as fabric.Path;
      if (path) {
        (path as CustomFabricPath).isDrawing = true;
        path.set({
          selectable: !isDrawing,
          evented: !isDrawing,
        });
      }
    };

    canvas.on("path:created", handlePathCreated);

    return () => {
      canvas.off("path:created", handlePathCreated);
    };
  }, [canvas, isDrawing]);

  // Add selection event listeners
  useEffect(() => {
    if (!canvas) return;

    canvas.on("selection:created", handleObjectSelection);
    canvas.on("selection:updated", handleObjectSelection);
    canvas.on("selection:cleared", handleObjectDeselection);

    return () => {
      canvas.off("selection:created", handleObjectSelection);
      canvas.off("selection:updated", handleObjectSelection);
      canvas.off("selection:cleared", handleObjectDeselection);
    };
  }, [canvas, handleObjectSelection, handleObjectDeselection]);

  // Add undo/redo event listeners for state saving
  useEffect(() => {
    if (!canvas) return;

    const handleObjectChange = () => {
      saveState();
    };

    // Save state when objects are modified
    canvas.on("object:modified", handleObjectChange);
    canvas.on("object:added", handleObjectChange);
    canvas.on("object:removed", handleObjectChange);
    canvas.on("path:created", handleObjectChange);

    return () => {
      canvas.off("object:modified", handleObjectChange);
      canvas.off("object:added", handleObjectChange);
      canvas.off("object:removed", handleObjectChange);
      canvas.off("path:created", handleObjectChange);
    };
  }, [canvas, saveState]);

  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  useEffect(() => {
    return () => {
      if (canvas) {
        canvas.dispose();
      }
    };
  }, [canvas]);

  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Handle canvas ready

  return (
    <div className="image-editor-container animate-fade-in">
      <div className="image-editor-header">
        <Toolbar
          onAddShape={handleAddShape}
          onCropStart={handleCropStart}
          onAddBlur={handleAddBlur}
          onToggleDraw={handleToggleDraw}
          onToggleSelectMode={handleToggleSelectMode}
          hasImage={hasImage}
          isCropping={isCropping}
          isDrawing={isDrawing}
          isSelectMode={isSelectMode}
          selectedObject={selectedObject}
          currentColor={currentColor}
          currentStrokeWidth={currentStrokeWidth}
          onColorChange={handleColorChange}
          onStrokeWidthChange={handleStrokeWidthChange}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div className="image-editor-actions">
          <Button
            onPress={handleSave}
            disabled={!hasImage}
            color="primary"
            className="image-editor-button image-editor-button-primary hover-lift"
          >
            Save
          </Button>
        </div>
      </div>

      {isCropping && (
        <div className="crop-mode animate-fade-in">
          <span className="crop-mode-text">Crop Mode: Drag and resize the selection area</span>
          <div className="crop-mode-actions">
            <button onClick={handleCropApply} className="crop-button crop-button-apply hover-lift">
              Apply Crop
            </button>
            <button onClick={handleCropCancel} className="crop-button crop-button-cancel hover-lift">
              Cancel
            </button>
          </div>
        </div>
      )}

      <CanvasEditor canvas={canvas} onCanvasReady={handleCanvasReady} />
    </div>
  );
};

export default ImageEditor;
