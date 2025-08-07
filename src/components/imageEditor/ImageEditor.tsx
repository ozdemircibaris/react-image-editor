import { fabric } from "fabric";
import React, { useEffect, useCallback, useState } from "react";
import { Button } from "@heroui/react";

import { Icon } from "../UI";

import { CanvasEditor } from "./CanvasEditor";
import { useBlurHandlers } from "./hooks/useBlurHandlers";
import { useCropHandlers } from "./hooks/useCropHandlers";
import { useShapeHandlers } from "./hooks/useShapeHandlers";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { Toolbar } from "./Toolbar";
import type { CustomFabricObject, CustomFabricImage, CustomFabricPath, FabricSelectionEvent } from "./types";

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

      // Make image same size as canvas with 24px border radius
      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;

      img.set({
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: "center",
        originY: "center",
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

      canvas.add(img);
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

    // Convert canvas to data URL first, then to blob
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
    });

    // Convert data URL to blob
    fetch(dataURL)
      .then((res) => res.blob())
      .then((blob) => {
        onSave(blob);
      })
      .catch((error) => {
        console.error("Error converting canvas to blob:", error);
      });
  }, [canvas, onSave]);

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

  return (
    <div className="w-full h-screen flex flex-col bg-[#5E3E31]">
      {/* header */}
      <div className="bg-[#725143] px-6 py-4 rounded-3xl m-2 flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <button className="cursor-pointer flex items-center justify-center" onClick={handleCancel}>
            <Icon name="arrow-left" className="text-white" />
          </button>
          <span className="text-white text-sm font-semibold">Image Edit Mode</span>
        </div>
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
        <div className="flex items-center gap-3">
          <Button onPress={handleCancel} color="default">
            Cancel
          </Button>
          <Button onPress={handleSave} disabled={!hasImage} color="primary">
            Save
          </Button>
        </div>
      </div>

      {isCropping && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border-b border-orange-200">
          <span className="text-orange-800 font-medium">Crop Mode: Drag and resize the selection area</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleCropApply}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Apply Crop
            </button>
            <button
              onClick={handleCropCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
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
