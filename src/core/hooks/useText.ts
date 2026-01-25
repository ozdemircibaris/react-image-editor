import { fabric } from "fabric";
import { useCallback } from "react";

import type { EditorFabricObject, UseTextReturn } from "../types";
import { getViewportCenter, getImageBounds } from "../utils";

// ============================================================================
// Types
// ============================================================================

interface UseTextOptions {
  /** Default text color */
  defaultColor?: string;
  /** Default font size */
  defaultFontSize?: number;
  /** Default font family */
  defaultFontFamily?: string;
  /** Callback when text is added */
  onTextAdd?: (text: fabric.IText) => void;
  /** Callback when text editing ends */
  onTextEditEnd?: (text: fabric.IText) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
];

const DEFAULT_PLACEHOLDER_TEXT = "Text";

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for adding and styling text on the canvas
 *
 * @example
 * ```tsx
 * const text = useText(canvasRef, imageRef, {
 *   defaultColor: '#000000',
 *   onTextAdd: (textObj) => {
 *     saveState();
 *   }
 * });
 *
 * // Add text
 * text.addText("Hello World");
 *
 * // Style selected text
 * text.setFontSize(32);
 * text.setFontFamily("Georgia");
 * ```
 */
export function useText(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  imageRef: React.MutableRefObject<fabric.Image | null>,
  options: UseTextOptions = {}
): UseTextReturn {
  const {
    defaultColor = "#000000",
    defaultFontSize = 24,
    defaultFontFamily = "Arial",
    onTextAdd,
    onTextEditEnd,
  } = options;

  /**
   * Calculate text position (centered in viewport, clamped to image)
   */
  const calculateTextPosition = useCallback(
    (
      canvas: fabric.Canvas,
      textWidth: number,
      textHeight: number
    ): { x: number; y: number } => {
      const originalImage = imageRef.current;
      const imgBounds = getImageBounds(originalImage);

      const viewportCenter = getViewportCenter(canvas);
      let x = viewportCenter.x;
      let y = viewportCenter.y;

      if (imgBounds) {
        const halfWidth = textWidth / 2;
        const halfHeight = textHeight / 2;

        x = Math.max(
          imgBounds.left + halfWidth + 10,
          Math.min(x, imgBounds.left + imgBounds.width - halfWidth - 10)
        );
        y = Math.max(
          imgBounds.top + halfHeight + 10,
          Math.min(y, imgBounds.top + imgBounds.height - halfHeight - 10)
        );
      }

      return { x, y };
    },
    [imageRef]
  );

  /**
   * Add text object to canvas
   */
  const addText = useCallback(
    (initialText: string = DEFAULT_PLACEHOLDER_TEXT) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const textObj = new fabric.IText(initialText, {
        fill: defaultColor,
        fontSize: defaultFontSize,
        fontFamily: defaultFontFamily,
        originX: "center",
        originY: "center",
        editable: true,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: defaultColor,
        cornerSize: 10,
        transparentCorners: false,
        objectCaching: false,
      });

      // Calculate estimated dimensions for positioning
      const estimatedWidth = textObj.width || 100;
      const estimatedHeight = textObj.height || defaultFontSize;

      const position = calculateTextPosition(
        canvas,
        estimatedWidth,
        estimatedHeight
      );
      textObj.set({
        left: position.x,
        top: position.y,
      });

      // Add custom properties
      const customText = textObj as EditorFabricObject;
      customText.isText = true;
      customText.isShape = true;
      customText.shapeType = "text";
      customText.id = `text-${Date.now()}`;

      // Add event listener for editing end
      textObj.on("editing:exited", () => {
        onTextEditEnd?.(textObj);
      });

      canvas.add(textObj);
      canvas.setActiveObject(textObj);
      canvas.renderAll();

      // Enter editing mode immediately
      textObj.enterEditing();
      textObj.selectAll();

      onTextAdd?.(textObj);
    },
    [
      canvasRef,
      calculateTextPosition,
      defaultColor,
      defaultFontSize,
      defaultFontFamily,
      onTextAdd,
      onTextEditEnd,
    ]
  );

  /**
   * Set font size of selected text
   */
  const setFontSize = useCallback(
    (size: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "i-text") {
        (activeObject as fabric.IText).set({ fontSize: size });
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  /**
   * Set font family of selected text
   */
  const setFontFamily = useCallback(
    (family: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "i-text") {
        (activeObject as fabric.IText).set({ fontFamily: family });
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  /**
   * Set text color of selected text
   */
  const setTextColor = useCallback(
    (color: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "i-text") {
        (activeObject as fabric.IText).set({ fill: color });
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  /**
   * Set font weight (bold)
   */
  const setFontWeight = useCallback(
    (weight: "normal" | "bold") => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "i-text") {
        (activeObject as fabric.IText).set({ fontWeight: weight });
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  /**
   * Set font style (italic)
   */
  const setFontStyle = useCallback(
    (style: "normal" | "italic") => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "i-text") {
        (activeObject as fabric.IText).set({ fontStyle: style });
        canvas.renderAll();
      }
    },
    [canvasRef]
  );

  return {
    addText,
    setFontSize,
    setFontFamily,
    setTextColor,
    setFontWeight,
    setFontStyle,
    fontFamilies: DEFAULT_FONT_FAMILIES,
  };
}

export default useText;
