import { useCallback, useState } from "react";
import type { fabric } from "fabric";

import { animateZoomTo, clampZoom } from "../utils";

// ============================================================================
// Types
// ============================================================================

export interface UseZoomOptions {
  initialZoom?: number;
}

export interface UseZoomReturn {
  /** Current zoom level */
  zoom: number;
  /** Zoom in by a factor */
  zoomIn: (factor?: number) => void;
  /** Zoom out by a factor */
  zoomOut: (factor?: number) => void;
  /** Set specific zoom level */
  setZoom: (level: number) => void;
  /** Reset zoom to 1 */
  resetZoom: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing canvas zoom functionality
 *
 * @example
 * ```tsx
 * const zoom = useZoom(canvasRef, { initialZoom: 1 });
 *
 * return (
 *   <div>
 *     <button onClick={() => zoom.zoomIn()}>+</button>
 *     <span>{Math.round(zoom.zoom * 100)}%</span>
 *     <button onClick={() => zoom.zoomOut()}>-</button>
 *   </div>
 * );
 * ```
 */
export function useZoom(
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  options: UseZoomOptions = {}
): UseZoomReturn {
  const { initialZoom = 1 } = options;

  const [zoom, setZoomLevel] = useState(initialZoom);

  const zoomIn = useCallback(
    (factor: number = 1.2) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const newZoom = clampZoom(canvas.getZoom() * factor);
      animateZoomTo(canvas, newZoom);
      setZoomLevel(newZoom);
    },
    [canvasRef]
  );

  const zoomOut = useCallback(
    (factor: number = 1.2) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const newZoom = clampZoom(canvas.getZoom() / factor);
      animateZoomTo(canvas, newZoom);
      setZoomLevel(newZoom);
    },
    [canvasRef]
  );

  const setZoom = useCallback(
    (level: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const clampedZoom = clampZoom(level);
      animateZoomTo(canvas, clampedZoom);
      setZoomLevel(clampedZoom);
    },
    [canvasRef]
  );

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

  return {
    zoom,
    zoomIn,
    zoomOut,
    setZoom,
    resetZoom,
  };
}

export default useZoom;
