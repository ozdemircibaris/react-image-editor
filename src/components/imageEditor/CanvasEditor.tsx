import { fabric } from "fabric";
import { useEffect, useRef, useCallback } from "react";

interface CanvasProps {
  canvas: fabric.Canvas | null;
  onCanvasReady: (canvas: fabric.Canvas) => void;
}

export const CanvasEditor: React.FC<CanvasProps> = ({ canvas, onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate responsive canvas size
  const calculateCanvasSize = useCallback(() => {
    const maxWidth = Math.max(0, window.innerWidth - 200); // 100px margin on each side
    const maxHeight = Math.max(0, window.innerHeight - 200); // 100px margin top/bottom

    // Maintain 16:9 aspect ratio for horizontal layout
    const aspectRatio = 16 / 9;

    let width = maxWidth;
    let height = width / aspectRatio;

    // If height exceeds maxHeight, recalculate based on height
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    // Ensure minimum size
    const minWidth = 800;
    const minHeight = 450;

    width = Math.max(width, minWidth);
    height = Math.max(height, minHeight);

    return { width: Math.floor(width), height: Math.floor(height) };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || canvas) return;

    const timeout = setTimeout(() => {
      const { width, height } = calculateCanvasSize();

      const fabricCanvas = new fabric.Canvas(canvasRef.current!);
      fabricCanvas.setWidth(width);
      fabricCanvas.setHeight(height);
      // Remove white background - make it transparent
      fabricCanvas.setBackgroundColor("transparent", () => {
        fabricCanvas.renderAll();
      });

      onCanvasReady(fabricCanvas);
    }, 0);

    return () => {
      clearTimeout(timeout);
      if (canvas) {
        try {
          (canvas as any).dispose?.();
        } catch {
          // Canvas might not have dispose method in some versions
          console.warn("Canvas dispose method not available");
        }
      }
    };
  }, [canvas, onCanvasReady, calculateCanvasSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvas) {
        const { width, height } = calculateCanvasSize();
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.renderAll();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [canvas, calculateCanvasSize]);

  return (
    <div className="canvas-container">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="canvas-element" />
      </div>
    </div>
  );
};
