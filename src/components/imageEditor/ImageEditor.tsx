import { useEffect, useCallback } from "react";

import { Button } from "../UI";
import { useImageEditor } from "../../core";

import { CanvasEditor } from "./CanvasEditor";
import { Toolbar } from "./Toolbar";

// Import and inject styles
import { injectStyles } from "./styles";

/**
 * Props for the ImageEditor component
 * This interface is the public API - DO NOT CHANGE without major version bump
 */
export interface IImageEditorProps {
  imageUrl: string;
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
  // Customization props
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

/**
 * Full-featured Image Editor component with styled UI
 *
 * For headless usage, import useImageEditor from '@ozdemircibaris/react-image-editor/core'
 */
const ImageEditor = (props: IImageEditorProps) => {
  const {
    imageUrl,
    onSave,
    onCancel,
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

  // Use the headless core hook
  const editor = useImageEditor({
    imageUrl,
    defaultColor: "#ff7000",
    defaultStrokeWidth: 2,
    maxHistorySize: 50,
  });

  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    const blob = await editor.exportToBlob();
    if (blob) {
      onSave(blob);
    }
  }, [editor, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Handle color change - update both selected object and brush
  const handleColorChange = useCallback(
    (color: string) => {
      editor.style.setColor(color);
    },
    [editor.style]
  );

  // Handle stroke width change
  const handleStrokeWidthChange = useCallback(
    (width: number) => {
      editor.style.setStrokeWidth(width);
    },
    [editor.style]
  );

  // Handle add shape
  const handleAddShape = useCallback(
    (shapeType: "rectangle" | "circle") => {
      if (editor.crop.isActive || editor.drawing.isActive) return;
      editor.shapes.add(shapeType);
      editor.selection.enable();
    },
    [editor.crop.isActive, editor.drawing.isActive, editor.shapes, editor.selection]
  );

  // Handle add blur
  const handleAddBlur = useCallback(() => {
    if (editor.drawing.isActive) return;
    editor.blur.add();
    editor.selection.disable();
  }, [editor.drawing.isActive, editor.blur, editor.selection]);

  // Handle crop start
  const handleCropStart = useCallback(() => {
    if (editor.drawing.isActive) return;
    editor.blur.clearAll();
    editor.crop.start();
  }, [editor.drawing.isActive, editor.blur, editor.crop]);

  // Handle toggle draw
  const handleToggleDraw = useCallback(() => {
    if (editor.crop.isActive) return;
    editor.drawing.toggle();
    if (!editor.drawing.isActive) {
      editor.selection.disable();
    }
  }, [editor.crop.isActive, editor.drawing, editor.selection]);

  // Handle toggle select mode
  const handleToggleSelectMode = useCallback(() => {
    if (editor.drawing.isActive) {
      editor.drawing.disable();
    }
    editor.selection.toggle();
  }, [editor.drawing, editor.selection]);

  // Handle delete object
  const handleDeleteObject = useCallback(() => {
    editor.selection.deleteSelected();
    editor.history.save();
  }, [editor.selection, editor.history]);

  return (
    <div className={`image-editor-container animate-fade-in ${className}`}>
      <div className={`image-editor-header ${headerClassName}`}>
        <Toolbar
          onAddShape={handleAddShape}
          onCropStart={handleCropStart}
          onAddBlur={handleAddBlur}
          onToggleDraw={handleToggleDraw}
          onToggleSelectMode={handleToggleSelectMode}
          hasImage={editor.hasImage}
          isCropping={editor.crop.isActive}
          isDrawing={editor.drawing.isActive}
          isSelectMode={editor.selection.isActive}
          selectedObject={editor.selection.selected}
          currentColor={editor.style.color}
          currentStrokeWidth={editor.style.strokeWidth}
          onColorChange={handleColorChange}
          onStrokeWidthChange={handleStrokeWidthChange}
          onUndo={editor.history.undo}
          onRedo={editor.history.redo}
          canUndo={editor.history.canUndo}
          canRedo={editor.history.canRedo}
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
              disabled={!editor.hasImage}
              color="secondary"
              className={`image-editor-button image-editor-button-secondary hover-lift ${cancelButtonClassName}`}
            >
              {cancelButtonTitle}
            </Button>
          )}
          <Button
            onPress={handleSave}
            disabled={!editor.hasImage}
            color="primary"
            className={`image-editor-button image-editor-button-primary hover-lift ${saveButtonClassName}`}
          >
            {saveButtonTitle}
          </Button>
        </div>
      </div>

      {editor.crop.isActive && (
        <div className="crop-mode animate-fade-in">
          <span className="crop-mode-text">Crop Mode: Drag and resize the selection area</span>
          <div className="crop-mode-actions">
            <button
              onClick={() => editor.crop.apply()}
              className="crop-button crop-button-apply hover-lift"
            >
              Apply Crop
            </button>
            <button
              onClick={() => editor.crop.cancel()}
              className="crop-button crop-button-cancel hover-lift"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <CanvasEditor
        canvas={editor.canvas}
        canvasRef={editor.canvasRef}
        className={canvasClassName}
        canvasWrapperClassName={canvasWrapperClassName}
        zoomButtonClassName={zoomButtonClassName}
        background={background}
      />
    </div>
  );
};

export default ImageEditor;
