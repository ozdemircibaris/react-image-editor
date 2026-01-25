import { fabric } from "fabric";
import { useCallback, useState } from "react";

import type { EditorFabricObject, UseSelectionReturn } from "../types";

// ============================================================================
// Types
// ============================================================================

interface UseSelectionOptions {
  /** Callback when object is selected */
  onSelect?: (obj: fabric.Object) => void;
  /** Callback when selection is cleared */
  onDeselect?: () => void;
  /** Callback when object is deleted */
  onDelete?: (obj: fabric.Object) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing object selection on canvas
 *
 * @example
 * ```tsx
 * const selection = useSelection(canvasRef, imageRef, {
 *   onSelect: (obj) => console.log('Selected:', obj),
 *   onDelete: (obj) => saveState(),
 * });
 *
 * // Toggle select mode
 * selection.toggleSelectMode();
 *
 * // Delete selected object
 * selection.deleteSelected();
 *
 * // Change selected object style
 * selection.setSelectedColor('#00ff00');
 * selection.setSelectedStrokeWidth(3);
 * ```
 */
export function useSelection(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  imageRef: React.MutableRefObject<fabric.Image | null>,
  options: UseSelectionOptions = {}
): UseSelectionReturn {
  const { onSelect, onDeselect, onDelete } = options;

  const [isSelectMode, setIsSelectMode] = useState(true);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(
    null
  );

  /**
   * Update object selectability
   */
  const updateObjectSelectability = useCallback(
    (canvas: fabric.Canvas, selectEnabled: boolean) => {
      const originalImage = imageRef.current;

      canvas.getObjects().forEach((obj) => {
        // Never make original image selectable
        if (obj === originalImage) return;

        const customObj = obj as EditorFabricObject;
        // Only update non-blur-patch objects
        if (!customObj.isBlurPatch) {
          obj.set({
            selectable: selectEnabled,
            evented: selectEnabled,
          });
        }
      });
    },
    [imageRef]
  );

  /**
   * Enable select mode
   */
  const enableSelectMode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    updateObjectSelectability(canvas, true);
    canvas.renderAll();

    setIsSelectMode(true);
  }, [canvasRef, updateObjectSelectability]);

  /**
   * Disable select mode
   */
  const disableSelectMode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.discardActiveObject();
    updateObjectSelectability(canvas, false);
    canvas.renderAll();

    setIsSelectMode(false);
    setSelectedObject(null);
    onDeselect?.();
  }, [canvasRef, updateObjectSelectability, onDeselect]);

  /**
   * Toggle select mode
   */
  const toggleSelectMode = useCallback(() => {
    if (isSelectMode) {
      disableSelectMode();
    } else {
      enableSelectMode();
    }
  }, [isSelectMode, enableSelectMode, disableSelectMode]);

  /**
   * Handle object selection
   */
  const handleSelect = useCallback(
    (obj: fabric.Object) => {
      const originalImage = imageRef.current;

      // Don't select original image or blur patches
      if (obj === originalImage) return;

      const customObj = obj as EditorFabricObject;
      if (customObj.isBlurPatch) return;

      setSelectedObject(obj);
      onSelect?.(obj);
    },
    [imageRef, onSelect]
  );

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.discardActiveObject();
    canvas.renderAll();

    setSelectedObject(null);
    onDeselect?.();
  }, [canvasRef, onDeselect]);

  /**
   * Delete selected object
   */
  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const originalImage = imageRef.current;

    if (!canvas || !selectedObject) return;

    // Don't delete original image
    if (selectedObject === originalImage) return;

    const customObj = selectedObject as EditorFabricObject;

    // If deleting a blur rect, also delete its blur patch
    if (customObj.id?.startsWith("blur-")) {
      const blurRectId = customObj.id;
      const objects = canvas.getObjects();

      objects.forEach((obj) => {
        const o = obj as EditorFabricObject;
        if (o.blurRectId === blurRectId) {
          canvas.remove(obj);
        }
      });
    }

    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();

    onDelete?.(selectedObject);
    setSelectedObject(null);
  }, [canvasRef, imageRef, selectedObject, onDelete]);

  /**
   * Set color of selected object
   */
  const setSelectedColor = useCallback(
    (color: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !selectedObject) return;

      selectedObject.set({ stroke: color });
      canvas.renderAll();
    },
    [canvasRef, selectedObject]
  );

  /**
   * Set stroke width of selected object
   */
  const setSelectedStrokeWidth = useCallback(
    (width: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !selectedObject) return;

      selectedObject.set({ strokeWidth: width });
      canvas.renderAll();
    },
    [canvasRef, selectedObject]
  );

  return {
    isSelectMode,
    selectedObject,
    enableSelectMode,
    disableSelectMode,
    toggleSelectMode,
    deleteSelected,
    setSelectedColor,
    setSelectedStrokeWidth,
    clearSelection,
    // Internal handler for canvas events
    _handleSelect: handleSelect,
  } as UseSelectionReturn & { _handleSelect: (obj: fabric.Object) => void };
}

export default useSelection;
