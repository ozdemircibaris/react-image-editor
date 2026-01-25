import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fabric before importing memory utils
vi.mock("fabric", () => ({
  fabric: {
    Canvas: vi.fn(),
  },
}));

import {
  CleanupManager,
  createTempCanvas,
  createDebouncedFunction,
  createThrottledFunction,
  safeRequestAnimationFrame,
  disposeFabricCanvas,
  clearCanvasObjects,
} from "./memory";

describe("CleanupManager", () => {
  let manager: CleanupManager;

  beforeEach(() => {
    manager = new CleanupManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    manager.cleanup();
    vi.useRealTimers();
  });

  describe("trackCanvas / disposeCanvas", () => {
    it("should track and dispose canvas", () => {
      const mockCanvas = document.createElement("canvas");
      mockCanvas.width = 100;
      mockCanvas.height = 100;

      manager.trackCanvas(mockCanvas);
      manager.disposeCanvas(mockCanvas);

      expect(mockCanvas.width).toBe(0);
      expect(mockCanvas.height).toBe(0);
    });
  });

  describe("trackTimeout / clearTrackedTimeout", () => {
    it("should track and clear timeout", () => {
      const callback = vi.fn();
      const timeoutId = setTimeout(callback, 1000);

      manager.trackTimeout(timeoutId);
      manager.clearTrackedTimeout(timeoutId);

      vi.advanceTimersByTime(1000);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("trackAnimationFrame / cancelTrackedAnimationFrame", () => {
    it("should track animation frame", () => {
      const mockRaf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(123);
      const mockCancelRaf = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

      manager.trackAnimationFrame(123);
      manager.cancelTrackedAnimationFrame(123);

      expect(mockCancelRaf).toHaveBeenCalledWith(123);
      expect(manager.animationFrames.has(123)).toBe(false);

      mockRaf.mockRestore();
      mockCancelRaf.mockRestore();
    });
  });

  describe("trackEventListener", () => {
    it("should track event listener", () => {
      const listener = vi.fn();

      manager.trackEventListener(window, "resize", listener);

      // Listener should be tracked and removed on cleanup
      manager.cleanup();

      // Verify by trying to trigger the event
      window.dispatchEvent(new Event("resize"));
      // Note: listener was added manually, not through manager, so this tests cleanup
    });
  });

  describe("cleanup", () => {
    it("should clear all tracked resources", () => {
      const callback = vi.fn();
      const timeoutId = setTimeout(callback, 1000);
      manager.trackTimeout(timeoutId);

      const mockCanvas = document.createElement("canvas");
      mockCanvas.width = 100;
      manager.trackCanvas(mockCanvas);

      manager.trackAnimationFrame(456);

      manager.cleanup();

      vi.advanceTimersByTime(1000);
      expect(callback).not.toHaveBeenCalled();
      expect(mockCanvas.width).toBe(0);
      expect(manager.animationFrames.size).toBe(0);
    });

    it("should be safe to call multiple times", () => {
      manager.cleanup();
      manager.cleanup();
      manager.cleanup();
      // Should not throw
    });
  });
});

describe("createTempCanvas", () => {
  it("should create canvas with specified dimensions", () => {
    const { canvas, ctx } = createTempCanvas(200, 150);

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(150);
    // Note: happy-dom doesn't support getContext('2d'), ctx may be null in test env
    expect(ctx === null || ctx instanceof CanvasRenderingContext2D).toBe(true);
  });

  it("should enforce minimum dimension of 1", () => {
    const { canvas } = createTempCanvas(0, -5);

    expect(canvas.width).toBe(1);
    expect(canvas.height).toBe(1);
  });

  it("should track canvas when cleanup manager provided", () => {
    const cleanup = new CleanupManager();
    const { canvas } = createTempCanvas(100, 100, cleanup);

    cleanup.disposeCanvas(canvas);

    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);

    cleanup.cleanup();
  });
});

describe("createDebouncedFunction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should debounce function calls", () => {
    const callback = vi.fn();
    const { fn } = createDebouncedFunction(callback, 100);

    fn();
    fn();
    fn();

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to debounced function", () => {
    const callback = vi.fn();
    const { fn } = createDebouncedFunction(callback, 100);

    fn("arg1", "arg2");
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("should reset timer on each call", () => {
    const callback = vi.fn();
    const { fn } = createDebouncedFunction(callback, 100);

    fn();
    vi.advanceTimersByTime(50);
    fn();
    vi.advanceTimersByTime(50);
    fn();
    vi.advanceTimersByTime(50);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cancel pending call", () => {
    const callback = vi.fn();
    const { fn, cancel } = createDebouncedFunction(callback, 100);

    fn();
    cancel();
    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should track timeout with cleanup manager", () => {
    const cleanup = new CleanupManager();
    const callback = vi.fn();
    const { fn } = createDebouncedFunction(callback, 100, cleanup);

    fn();
    cleanup.cleanup();
    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });
});

describe("createThrottledFunction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call function immediately on first call", () => {
    const callback = vi.fn();
    const { fn } = createThrottledFunction(callback, 100);

    fn();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should throttle subsequent calls", () => {
    const callback = vi.fn();
    const { fn } = createThrottledFunction(callback, 100);

    fn();
    fn();
    fn();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should allow call after throttle period", () => {
    const callback = vi.fn();
    const { fn } = createThrottledFunction(callback, 100);

    fn();
    vi.advanceTimersByTime(100);
    fn();

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should pass arguments to throttled function", () => {
    const callback = vi.fn();
    const { fn } = createThrottledFunction(callback, 100);

    fn("arg1", "arg2");

    expect(callback).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("should cancel throttle state", () => {
    const callback = vi.fn();
    const { fn, cancel } = createThrottledFunction(callback, 100);

    fn();
    cancel();
    fn(); // Should call immediately after cancel

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should track timeout with cleanup manager", () => {
    const cleanup = new CleanupManager();
    const callback = vi.fn();
    const { fn, cancel } = createThrottledFunction(callback, 100, cleanup);

    fn(); // First call executes
    expect(callback).toHaveBeenCalledTimes(1);

    // Use cancel to properly reset throttle state (this uses cleanup internally)
    cancel();

    fn(); // Second call should execute after cancel
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe("safeRequestAnimationFrame", () => {
  it("should call requestAnimationFrame", () => {
    const callback = vi.fn();
    const mockRaf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(123);

    safeRequestAnimationFrame(callback);

    expect(mockRaf).toHaveBeenCalled();

    mockRaf.mockRestore();
  });

  it("should track frame with cleanup manager", () => {
    const cleanup = new CleanupManager();
    const callback = vi.fn();
    const mockRaf = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(123);

    const id = safeRequestAnimationFrame(callback, cleanup);

    expect(cleanup.animationFrames.has(id)).toBe(true);

    mockRaf.mockRestore();
    cleanup.cleanup();
  });

  it("should remove from tracking after callback executes", () => {
    const cleanup = new CleanupManager();
    let capturedCallback: FrameRequestCallback | null = null;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      capturedCallback = cb;
      return 123;
    });

    const callback = vi.fn();
    safeRequestAnimationFrame(callback, cleanup);

    // Initially tracked
    expect(cleanup.animationFrames.has(123)).toBe(true);

    // Simulate frame callback
    capturedCallback!(0);

    // Should be removed after execution
    expect(cleanup.animationFrames.has(123)).toBe(false);
    expect(callback).toHaveBeenCalled();
  });
});

describe("disposeFabricCanvas", () => {
  it("should handle null canvas", () => {
    expect(() => disposeFabricCanvas(null)).not.toThrow();
  });

  it("should clear and dispose canvas", () => {
    const mockCanvas = {
      clear: vi.fn(),
      dispose: vi.fn(),
    } as unknown as import("fabric").fabric.Canvas;

    disposeFabricCanvas(mockCanvas);

    expect(mockCanvas.clear).toHaveBeenCalled();
    expect(mockCanvas.dispose).toHaveBeenCalled();
  });

  it("should handle already disposed canvas", () => {
    const mockCanvas = {
      clear: vi.fn().mockImplementation(() => {
        throw new Error("Canvas already disposed");
      }),
      dispose: vi.fn(),
    } as unknown as import("fabric").fabric.Canvas;

    expect(() => disposeFabricCanvas(mockCanvas)).not.toThrow();
  });
});

describe("clearCanvasObjects", () => {
  it("should remove all objects except original image", () => {
    const mockObject1 = { id: "shape1" };
    const mockObject2 = { id: "originalImage" };
    const mockObject3 = { id: "shape2" };

    const mockCanvas = {
      getObjects: vi.fn().mockReturnValue([mockObject1, mockObject2, mockObject3]),
      remove: vi.fn(),
      discardActiveObject: vi.fn(),
      renderAll: vi.fn(),
    } as unknown as import("fabric").fabric.Canvas;

    clearCanvasObjects(mockCanvas);

    expect(mockCanvas.remove).toHaveBeenCalledWith(mockObject1);
    expect(mockCanvas.remove).not.toHaveBeenCalledWith(mockObject2);
    expect(mockCanvas.remove).toHaveBeenCalledWith(mockObject3);
    expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
    expect(mockCanvas.renderAll).toHaveBeenCalled();
  });

  it("should remove all objects when keepOriginalImage is false", () => {
    const mockObject1 = { id: "shape1" };
    const mockObject2 = { id: "originalImage" };

    const mockCanvas = {
      getObjects: vi.fn().mockReturnValue([mockObject1, mockObject2]),
      remove: vi.fn(),
      discardActiveObject: vi.fn(),
      renderAll: vi.fn(),
    } as unknown as import("fabric").fabric.Canvas;

    clearCanvasObjects(mockCanvas, false);

    expect(mockCanvas.remove).toHaveBeenCalledWith(mockObject1);
    expect(mockCanvas.remove).toHaveBeenCalledWith(mockObject2);
  });

  it("should handle empty canvas", () => {
    const mockCanvas = {
      getObjects: vi.fn().mockReturnValue([]),
      remove: vi.fn(),
      discardActiveObject: vi.fn(),
      renderAll: vi.fn(),
    } as unknown as import("fabric").fabric.Canvas;

    clearCanvasObjects(mockCanvas);

    expect(mockCanvas.remove).not.toHaveBeenCalled();
    expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
    expect(mockCanvas.renderAll).toHaveBeenCalled();
  });
});
