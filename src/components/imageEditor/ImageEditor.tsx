import { useEffect, useCallback, useState } from "react";

import { Button } from "../UI";

import { CanvasEditor } from "./CanvasEditor";
import { useBlurHandlers } from "./hooks/useBlurHandlers";
import { useCanvasEvents } from "./hooks/useCanvasEvents";
import { useCanvasSetup } from "./hooks/useCanvasSetup";
import { useCropHandlers } from "./hooks/useCropHandlers";
import { useDrawingMode } from "./hooks/useDrawingMode";
import { useObjectHandlers } from "./hooks/useObjectHandlers";
import { useSelectionMode } from "./hooks/useSelectionMode";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { Toolbar } from "./Toolbar";
import type { CustomFabricImage } from "./types";

// Import and inject styles
import { injectStyles } from "./styles";

export interface IImageEditorProps {
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
  // New customization props
  showCancelButton?: boolean;
  className?: string;
  headerClassName?: string;
  toolbarClassName?: string;
  buttonClassName?: string;
  saveButtonClassName?: string;
  cancelButtonClassName?: string;
  canvasClassName?: string;
  canvasWrapperClassName?: string;
  zoomButtonClassName?: string;
  background?: string;
  saveButtonTitle?: string;
  cancelButtonTitle?: string;
}

const ImageEditor = (props: IImageEditorProps) => {
  const {
    imageUrl,
    onSave,
    onCancel,
    // New props with defaults
    showCancelButton = false,
    className = "",
    headerClassName = "",
    toolbarClassName = "",
    buttonClassName = "",
    saveButtonClassName = "",
    cancelButtonClassName = "",
    canvasClassName = "",
    canvasWrapperClassName = "",
    zoomButtonClassName = "",
    background,
    saveButtonTitle = "Save",
    cancelButtonTitle = "Cancel",
  } = props;

  // Local state
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(true);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [currentColor, setCurrentColor] = useState("#ff7000");
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);

  // Function to update originalImage reference after undo/redo
  const updateOriginalImageReference = useCallback((canvas: fabric.Canvas | null) => {
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
      canvas.renderAll();
    }
  }, []);

  // Use undo/redo handlers hook
  const { saveState, undo, redo, initializeHistory, canUndo, canRedo, updateCanvas } = useUndoRedo(
    null, // Will be set by useCanvasSetup
    50,
    () => updateOriginalImageReference(canvas),
  );

  // Use canvas setup hook
  const { canvas, hasImage, originalImage, setOriginalImage, handleCanvasReady } = useCanvasSetup(
    imageUrl,
    currentColor,
    currentStrokeWidth,
    initializeHistory,
  );

  // Update undo/redo hook with canvas reference
  useEffect(() => {
    if (canvas) {
      updateCanvas(canvas);
    }
  }, [canvas, updateCanvas]);

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

  // Use shape handlers hook - temporarily disabled
  const handleAddShape = () => {
    // TODO: Implement shape handling
    console.log("Shape handling to be implemented");
  };

  // Use drawing mode hook
  const { handleToggleDraw } = useDrawingMode(canvas, isDrawing, setIsDrawing, setIsSelectMode, originalImage);

  // Use selection mode hook
  const { handleToggleSelectMode } = useSelectionMode(
    canvas,
    isSelectMode,
    setIsSelectMode,
    setIsDrawing,
    setIsCropping,
    originalImage,
  );

  // Use object handlers hook
  const {
    handleObjectSelection,
    handleObjectDeselection,
    handleDeleteObject,
    handleColorChange,
    handleStrokeWidthChange,
  } = useObjectHandlers(
    canvas,
    selectedObject,
    setSelectedObject,
    setCurrentColor,
    setCurrentStrokeWidth,
    originalImage,
    saveState,
  );

  // Use canvas events hook
  useCanvasEvents(
    canvas,
    isDrawing,
    handleObjectSelection,
    handleObjectDeselection,
    saveState,
    undo,
    redo,
    handleDeleteObject,
  );

  // Cleanup canvas on unmount
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

  // Handle save with proper crop support
  const handleSave = useCallback(() => {
    if (!canvas || !originalImage) return;

    try {
      // Store current viewport state
      const currentViewportTransform = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const currentZoom = canvas.getZoom();

      // Reset viewport to default state for accurate export
      canvas.setZoom(1);
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // Get the image's current dimensions and position on canvas (after viewport reset)
      const imageScaledWidth = originalImage.getScaledWidth();
      const imageScaledHeight = originalImage.getScaledHeight();

      // Get image position in canvas space (now accurate after viewport reset)
      const imageLeft = originalImage.left || 0;
      const imageTop = originalImage.top || 0;

      // Get all objects that should be included in export (image + edits)
      const objectsToExport = canvas.getObjects().filter((obj) => {
        // Always include the original image
        if (obj === originalImage) return true;

        // Include blur rects, shapes, and drawings
        const customObj = obj as any;
        return customObj.isBlurPatch || customObj.isDrawing || (customObj.stroke && customObj.strokeWidth);
      });

      // For cropped images, we want to export the entire image area
      // Start with the image bounds as the base
      let minX = imageLeft;
      let minY = imageTop;
      let maxX = imageLeft + imageScaledWidth;
      let maxY = imageTop + imageScaledHeight;

      // Add other objects to the bounding box
      objectsToExport.forEach((obj) => {
        if (obj !== originalImage) {
          const objBounds = obj.getBoundingRect();
          minX = Math.min(minX, objBounds.left);
          minY = Math.min(minY, objBounds.top);
          maxX = Math.max(maxX, objBounds.left + objBounds.width);
          maxY = Math.max(maxY, objBounds.top + objBounds.height);
        }
      });

      // Ensure we don't export beyond canvas boundaries
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      minX = Math.max(0, minX);
      minY = Math.max(0, minY);
      maxX = Math.min(canvasWidth, maxX);
      maxY = Math.min(canvasHeight, maxY);

      // Calculate export dimensions
      const exportWidth = maxX - minX;
      const exportHeight = maxY - minY;

      // For cropped images, we want to export at the actual cropped dimensions
      // The scale factor should be 1 to maintain the cropped size
      const scaleFactor = 1;

      // Export the specific area - ONLY the image and edits, no extra canvas space
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        left: Math.round(minX),
        top: Math.round(minY),
        width: Math.round(exportWidth),
        height: Math.round(exportHeight),
        multiplier: scaleFactor,
      });

      // Restore the user's viewport state
      canvas.setZoom(currentZoom);
      canvas.setViewportTransform(currentViewportTransform);
      canvas.renderAll();

      // Convert to blob and save
      fetch(dataURL)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.blob();
        })
        .then((blob) => onSave(blob))
        .catch((error) => {
          console.error("Error converting image to blob:", error);
          // Fallback: try to export without custom bounds
          const fallbackDataURL = canvas.toDataURL({ format: "png", quality: 1 });
          return fetch(fallbackDataURL);
        })
        .then((res) => res?.blob())
        .then((blob) => blob && onSave(blob))
        .catch((error) => {
          console.error("Error in fallback export:", error);
        });
    } catch (error) {
      console.error("Error exporting image:", error);

      // Fallback: export whole canvas if custom export fails
      try {
        const fallbackDataURL = canvas.toDataURL({ format: "png", quality: 1 });
        fetch(fallbackDataURL)
          .then((res) => res.blob())
          .then((blob) => onSave(blob))
          .catch((fallbackError) => {
            console.error("Fallback export also failed:", fallbackError);
          });
      } catch (fallbackError) {
        console.error("Fallback export failed:", fallbackError);
      }
    }
  }, [canvas, onSave, originalImage]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <div className={`image-editor-container animate-fade-in ${className}`}>
      <div className={`image-editor-header ${headerClassName}`}>
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
          onDeleteObject={handleDeleteObject}
          showCancelButton={showCancelButton}
          onCancel={handleCancel}
          className={toolbarClassName}
          buttonClassName={buttonClassName}
          saveButtonClassName={saveButtonClassName}
          cancelButtonClassName={cancelButtonClassName}
          saveButtonTitle={saveButtonTitle}
          cancelButtonTitle={cancelButtonTitle}
        />

        <div className="image-editor-actions">
          {showCancelButton && (
            <Button
              onPress={handleCancel}
              disabled={!hasImage}
              color="secondary"
              className={`image-editor-button image-editor-button-secondary hover-lift ${cancelButtonClassName}`}
            >
              {cancelButtonTitle}
            </Button>
          )}
          <Button
            onPress={handleSave}
            disabled={!hasImage}
            color="primary"
            className={`image-editor-button image-editor-button-primary hover-lift ${saveButtonClassName}`}
          >
            {saveButtonTitle}
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

      <CanvasEditor
        canvas={canvas}
        onCanvasReady={handleCanvasReady}
        className={canvasClassName}
        canvasWrapperClassName={canvasWrapperClassName}
        zoomButtonClassName={zoomButtonClassName}
        background={background}
      />
    </div>
  );
};

export default ImageEditor;
