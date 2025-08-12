import { fabric } from "fabric";
import { useEffect, useRef, useCallback, useState } from "react";

interface CanvasProps {
  canvas: fabric.Canvas | null;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  className?: string;
  zoomButtonClassName?: string;
  background?: string;
  canvasWrapperClassName?: string;
}

export const CanvasEditor: React.FC<CanvasProps> = ({
  canvas,
  onCanvasReady,
  className = "",
  zoomButtonClassName = "",
  background,
  canvasWrapperClassName = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // Calculate responsive canvas size
  const calculateCanvasSize = useCallback(() => {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

    if (isMobile) {
      // Mobile: iPhone XR için çok agresif boyutlandırma
      const maxWidth = Math.max(0, window.innerWidth - 8); // 4px margin on each side (canvas-container padding dahil)
      const maxHeight = Math.max(0, window.innerHeight - 80); // Header + margins - çok minimal margin

      // Mobile'da kare aspect ratio (en iyi mobile UX)
      const aspectRatio = 1; // 1:1 ratio - mobile'da en iyi

      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Mobile'da çok küçük minimum boyutlar
      const minWidth = 200;
      const minHeight = 120;

      width = Math.max(width, minWidth);
      height = Math.max(height, minHeight);

      return { width: Math.floor(width), height: Math.floor(height) };
    } else if (isTablet) {
      // Tablet: Medium margins, 16:9 aspect ratio
      const maxWidth = Math.max(0, window.innerWidth - 100); // 50px margin on each side
      const maxHeight = Math.max(0, window.innerHeight - 180); // Header + margins

      const aspectRatio = 16 / 9;

      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Tablet minimum size
      const minWidth = 600;
      const minHeight = 338;

      width = Math.max(width, minWidth);
      height = Math.max(height, minHeight);

      return { width: Math.floor(width), height: Math.floor(height) };
    } else {
      // Desktop: Large margins, 16:9 aspect ratio
      const maxWidth = Math.max(0, window.innerWidth - 200); // 100px margin on each side
      const maxHeight = Math.max(0, window.innerHeight - 200); // Header + margins

      const aspectRatio = 16 / 9;

      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Desktop minimum size
      const minWidth = 800;
      const minHeight = 450;

      width = Math.max(width, minWidth);
      height = Math.max(height, minHeight);

      return { width: Math.floor(width), height: Math.floor(height) };
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || canvas) return;

    const timeout = setTimeout(() => {
      const { width, height } = calculateCanvasSize();

      const fabricCanvas = new fabric.Canvas(canvasRef.current!);
      fabricCanvas.setWidth(width);
      fabricCanvas.setHeight(height);
      // Use custom background if provided, otherwise transparent
      const backgroundColor = background || "transparent";
      fabricCanvas.setBackgroundColor(backgroundColor, () => {
        fabricCanvas.renderAll();
      });

      onCanvasReady(fabricCanvas);
      setIsReady(true);
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
  }, [canvas, onCanvasReady, calculateCanvasSize, background]);

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

  // Smooth zoom implementation
  const clampZoom = (zoomValue: number) => {
    const MIN_ZOOM = 0.2;
    const MAX_ZOOM = 4;
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomValue));
  };

  const animateZoomTo = useCallback(
    (targetZoom: number, durationMs: number = 220) => {
      if (!canvas) return;
      const clampedTarget = clampZoom(targetZoom);
      const startZoom = canvas.getZoom();
      const startTime = performance.now();

      const centerPoint = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);
        const eased = easeOutCubic(t);
        const currentZoom = startZoom + (clampedTarget - startZoom) * eased;
        canvas.zoomToPoint(centerPoint, currentZoom);
        canvas.requestRenderAll();
        if (t < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    },
    [canvas],
  );

  const handleZoomIn = useCallback(() => {
    if (!canvas) return;
    const current = canvas.getZoom();
    animateZoomTo(current * 1.2);
  }, [canvas, animateZoomTo]);

  const handleZoomOut = useCallback(() => {
    if (!canvas) return;
    const current = canvas.getZoom();
    animateZoomTo(current / 1.2);
  }, [canvas, animateZoomTo]);

  // Enable panning with Space+Drag and prevent page scroll on Space
  useEffect(() => {
    if (!canvas) return;
    let isPanning = false;
    let spacePressed = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        spacePressed = true;
        setIsSpaceDown(true);
        canvas.setCursor("grab");
      }
    };
    const onKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        spacePressed = false;
        setIsSpaceDown(false);
        canvas.setCursor("default");
      }
    };
    const onMouseDown = (opt: fabric.IEvent<Event>) => {
      const evt = opt.e as MouseEvent;
      if (evt.button === 0 && spacePressed) {
        isPanning = true;
        canvas.setCursor("grabbing");
      }
    };
    const onMouseMove = (opt: fabric.IEvent<Event>) => {
      if (!isPanning) return;
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform!;
      vpt[4] += evt.movementX;
      vpt[5] += evt.movementY;
      canvas.requestRenderAll();
    };
    const onMouseUp = () => {
      isPanning = false;
      canvas.setCursor(spacePressed ? "grab" : "default");
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keypress", onKeyPress, { capture: true });
    window.addEventListener("keyup", onKeyUp);
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
      window.removeEventListener("keypress", onKeyPress, { capture: true } as any);
      window.removeEventListener("keyup", onKeyUp);
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [canvas]);

  return (
    <div className={`canvas-container ${className}`}>
      <div className={`canvas-wrapper ${canvasWrapperClassName}`}>
        <canvas ref={canvasRef} className="canvas-element" />

        {/* Zoom controls overlay */}
        {isReady && (
          <div
            style={{
              position: "absolute",
              right: 16,
              bottom: 16,
              display: "flex",
              gap: 8,
              background: "rgba(17,24,39,0.75)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 6,
              backdropFilter: "blur(8px)",
              boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
            }}
          >
            <button
              type="button"
              title="Zoom out"
              onClick={handleZoomOut}
              className={`zoom-button zoom-out ${zoomButtonClassName}`}
              style={
                !zoomButtonClassName
                  ? {
                      background: "#1f2937",
                      color: "#d1d5db",
                      borderColor: "rgba(255,255,255,0.08)",
                    }
                  : {}
              }
            >
              −
            </button>
            <button
              type="button"
              title="Zoom in"
              onClick={handleZoomIn}
              className={`zoom-button zoom-in ${zoomButtonClassName}`}
              style={
                !zoomButtonClassName
                  ? {
                      background: "#3b82f6",
                      color: "white",
                      borderColor: "rgba(59,130,246,0.35)",
                    }
                  : {}
              }
            >
              +
            </button>
          </div>
        )}

        {/* Space to pan hint - hidden on mobile */}
        {isReady && !isSpaceDown && window.innerWidth > 768 && (
          <div
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#9ca3af",
              fontSize: 12,
              background: "rgba(17,24,39,0.35)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "6px 10px",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 18,
                borderRadius: 4,
                border: "1px solid #4b5563",
                background: "transparent",
                color: "#d1d5db",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
              }}
            >
              Space
            </div>
            <span style={{ opacity: 0.75 }}>Press and drag to pan</span>
          </div>
        )}
      </div>
    </div>
  );
};
