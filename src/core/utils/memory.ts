import { fabric } from "fabric";

/**
 * Cleanup manager for tracking and disposing resources
 */
export class CleanupManager {
  private canvases: Set<HTMLCanvasElement> = new Set();
  private timeouts: Set<ReturnType<typeof setTimeout>> = new Set();
  protected _animationFrames: Set<number> = new Set();
  private eventListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
    options?: boolean | AddEventListenerOptions;
  }> = [];

  /** Get animation frames set for external access */
  get animationFrames(): Set<number> {
    return this._animationFrames;
  }

  /**
   * Track a temporary canvas for cleanup
   */
  trackCanvas(canvas: HTMLCanvasElement): void {
    this.canvases.add(canvas);
  }

  /**
   * Track a timeout for cleanup
   */
  trackTimeout(id: ReturnType<typeof setTimeout>): void {
    this.timeouts.add(id);
  }

  /**
   * Track an animation frame for cleanup
   */
  trackAnimationFrame(id: number): void {
    this._animationFrames.add(id);
  }

  /**
   * Track an event listener for cleanup
   */
  trackEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.eventListeners.push({ target, type, listener, options });
  }

  /**
   * Clear a specific timeout
   */
  clearTrackedTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
    this.timeouts.delete(id);
  }

  /**
   * Cancel a specific animation frame
   */
  cancelTrackedAnimationFrame(id: number): void {
    cancelAnimationFrame(id);
    this._animationFrames.delete(id);
  }

  /**
   * Dispose a temporary canvas
   */
  disposeCanvas(canvas: HTMLCanvasElement): void {
    // Clear canvas content
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Reset dimensions to free memory
    canvas.width = 0;
    canvas.height = 0;
    this.canvases.delete(canvas);
  }

  /**
   * Cleanup all tracked resources
   */
  cleanup(): void {
    // Clear all timeouts
    this.timeouts.forEach((id) => clearTimeout(id));
    this.timeouts.clear();

    // Cancel all animation frames
    this._animationFrames.forEach((id) => cancelAnimationFrame(id));
    this._animationFrames.clear();

    // Remove all event listeners
    this.eventListeners.forEach(({ target, type, listener, options }) => {
      target.removeEventListener(type, listener, options);
    });
    this.eventListeners.length = 0;

    // Dispose all temporary canvases
    this.canvases.forEach((canvas) => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
    });
    this.canvases.clear();
  }
}

/**
 * Create a temporary canvas with cleanup tracking
 */
export function createTempCanvas(
  width: number,
  height: number,
  cleanup?: CleanupManager
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  if (cleanup) {
    cleanup.trackCanvas(canvas);
  }

  return {
    canvas,
    ctx: canvas.getContext("2d"),
  };
}

/**
 * Dispose a Fabric.js canvas properly
 */
export function disposeFabricCanvas(canvas: fabric.Canvas | null): void {
  if (!canvas) return;

  try {
    // Remove all objects first
    canvas.clear();

    // Dispose the canvas
    canvas.dispose();
  } catch {
    // Canvas might already be disposed or in an invalid state
  }
}

/**
 * Remove all custom objects from canvas (keep original image)
 */
export function clearCanvasObjects(
  canvas: fabric.Canvas,
  keepOriginalImage: boolean = true
): void {
  const objects = canvas.getObjects().slice();

  objects.forEach((obj) => {
    const customObj = obj as { id?: string };
    if (keepOriginalImage && customObj.id === "originalImage") {
      return;
    }
    canvas.remove(obj);
  });

  canvas.discardActiveObject();
  canvas.renderAll();
}

/**
 * Debounce function with cleanup support
 */
export function createDebouncedFunction<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
  cleanup?: CleanupManager
): { fn: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup.clearTrackedTimeout(timeoutId);
      }
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);

    if (cleanup) {
      cleanup.trackTimeout(timeoutId);
    }
  };

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup.clearTrackedTimeout(timeoutId);
      }
      timeoutId = null;
    }
  };

  return { fn: debouncedFn, cancel };
}

/**
 * Throttle function with cleanup support
 */
export function createThrottledFunction<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number,
  cleanup?: CleanupManager
): { fn: (...args: Parameters<T>) => void; cancel: () => void } {
  let inThrottle = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttledFn = (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      timeoutId = setTimeout(() => {
        inThrottle = false;
        timeoutId = null;
      }, limit);

      if (cleanup) {
        cleanup.trackTimeout(timeoutId);
      }
    }
  };

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup.clearTrackedTimeout(timeoutId);
      }
      timeoutId = null;
    }
    inThrottle = false;
  };

  return { fn: throttledFn, cancel };
}

/**
 * Safe requestAnimationFrame with cleanup support
 */
export function safeRequestAnimationFrame(
  callback: FrameRequestCallback,
  cleanup?: CleanupManager
): number {
  const id = requestAnimationFrame((time) => {
    if (cleanup) {
      cleanup.animationFrames.delete(id);
    }
    callback(time);
  });

  if (cleanup) {
    cleanup.trackAnimationFrame(id);
  }

  return id;
}

/**
 * Add event listener with automatic cleanup tracking
 */
export function addTrackedEventListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => void,
  cleanup: CleanupManager,
  options?: boolean | AddEventListenerOptions
): void;
export function addTrackedEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => void,
  cleanup: CleanupManager,
  options?: boolean | AddEventListenerOptions
): void;
export function addTrackedEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  cleanup: CleanupManager,
  options?: boolean | AddEventListenerOptions
): void;
export function addTrackedEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  cleanup: CleanupManager,
  options?: boolean | AddEventListenerOptions
): void {
  target.addEventListener(type, listener, options);
  cleanup.trackEventListener(target, type, listener, options);
}
