import { describe, it, expect, vi } from "vitest";
import type { Bounds } from "../types";

// Mock fabric module before importing crop utilities
vi.mock("fabric", () => ({
  fabric: {
    Rect: vi.fn().mockImplementation((options) => ({
      ...options,
      getScaledWidth: () => (options.width || 0) * (options.scaleX || 1),
      getScaledHeight: () => (options.height || 0) * (options.scaleY || 1),
      set: vi.fn(),
    })),
    Textbox: vi.fn().mockImplementation((text, options) => ({
      text,
      ...options,
      set: vi.fn(),
    })),
    util: {
      invertTransform: vi.fn((vpt) => vpt),
      transformPoint: vi.fn((point) => point),
    },
    Point: vi.fn().mockImplementation((x, y) => ({ x, y })),
  },
}));

import {
  constrainCropRectInside,
  limitCropRectScale,
} from "./crop";

// Helper to create a mock rect object
function createMockRect(options: {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
}) {
  const rect = {
    left: options.left ?? 0,
    top: options.top ?? 0,
    width: options.width ?? 100,
    height: options.height ?? 100,
    scaleX: options.scaleX ?? 1,
    scaleY: options.scaleY ?? 1,
    getScaledWidth() {
      return this.width * this.scaleX;
    },
    getScaledHeight() {
      return this.height * this.scaleY;
    },
    set: vi.fn((props) => {
      Object.assign(rect, props);
    }),
  };
  return rect as unknown as import("fabric").fabric.Rect;
}

describe("constrainCropRectInside", () => {
  const imgBounds: Bounds = {
    left: 100,
    top: 100,
    width: 400,
    height: 300,
  };

  it("should keep rect position when already inside bounds", () => {
    const rect = createMockRect({
      left: 150,
      top: 150,
      width: 100,
      height: 100,
    });

    constrainCropRectInside(rect, imgBounds);

    // Function always calls set, but with same values
    expect(rect.set).toHaveBeenCalledWith({
      left: 150,
      top: 150,
    });
  });

  it("should constrain rect that is too far left", () => {
    const rect = createMockRect({
      left: 50, // Before imgBounds.left (100)
      top: 150,
      width: 100,
      height: 100,
    });

    constrainCropRectInside(rect, imgBounds);

    expect(rect.set).toHaveBeenCalledWith({
      left: 100, // Should be clamped to imgBounds.left
      top: 150,
    });
  });

  it("should constrain rect that is too far right", () => {
    const rect = createMockRect({
      left: 450, // 450 + 100 = 550 > 100 + 400 = 500
      top: 150,
      width: 100,
      height: 100,
    });

    constrainCropRectInside(rect, imgBounds);

    expect(rect.set).toHaveBeenCalledWith({
      left: 400, // 100 + 400 - 100 = 400
      top: 150,
    });
  });

  it("should constrain rect that is too far up", () => {
    const rect = createMockRect({
      left: 150,
      top: 50, // Before imgBounds.top (100)
      width: 100,
      height: 100,
    });

    constrainCropRectInside(rect, imgBounds);

    expect(rect.set).toHaveBeenCalledWith({
      left: 150,
      top: 100, // Should be clamped to imgBounds.top
    });
  });

  it("should constrain rect that is too far down", () => {
    const rect = createMockRect({
      left: 150,
      top: 350, // 350 + 100 = 450 > 100 + 300 = 400
      width: 100,
      height: 100,
    });

    constrainCropRectInside(rect, imgBounds);

    expect(rect.set).toHaveBeenCalledWith({
      left: 150,
      top: 300, // 100 + 300 - 100 = 300
    });
  });

  it("should handle scaled rect that fits inside bounds", () => {
    const rect = createMockRect({
      left: 150,
      top: 150,
      width: 100,
      height: 100,
      scaleX: 3, // scaledWidth = 300
      scaleY: 2, // scaledHeight = 200
    });

    // rect goes from 150 to 450 (x) and 150 to 350 (y)
    // imgBounds goes from 100 to 500 (x) and 100 to 400 (y)
    constrainCropRectInside(rect, imgBounds);

    // Should keep same position since it fits
    expect(rect.set).toHaveBeenCalledWith({
      left: 150,
      top: 150,
    });
  });

  it("should constrain both axes simultaneously", () => {
    const rect = createMockRect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
    });

    constrainCropRectInside(rect, imgBounds);

    expect(rect.set).toHaveBeenCalledWith({
      left: 100,
      top: 100,
    });
  });
});

describe("limitCropRectScale", () => {
  const imgBounds: Bounds = {
    left: 100,
    top: 100,
    width: 400,
    height: 300,
  };

  it("should not change scale that is within limits", () => {
    const rect = createMockRect({
      left: 150,
      top: 150,
      width: 100,
      height: 100,
      scaleX: 1,
      scaleY: 1,
    });

    limitCropRectScale(rect, imgBounds);

    expect(rect.set).not.toHaveBeenCalled();
  });

  it("should limit scale that exceeds available width", () => {
    const rect = createMockRect({
      left: 400, // Only 100px available to the right (500 - 400)
      top: 150,
      width: 100,
      height: 100,
      scaleX: 2, // Would need 200px
      scaleY: 1,
    });

    limitCropRectScale(rect, imgBounds);

    expect(rect.set).toHaveBeenCalled();
    const setCall = (rect.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(setCall.scaleX).toBe(1); // Max available is 100/100 = 1
  });

  it("should limit scale that exceeds available height", () => {
    const rect = createMockRect({
      left: 150,
      top: 350, // Only 50px available below (400 - 350)
      width: 100,
      height: 100,
      scaleX: 1,
      scaleY: 2, // Would need 200px
    });

    limitCropRectScale(rect, imgBounds);

    expect(rect.set).toHaveBeenCalled();
    const setCall = (rect.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(setCall.scaleY).toBe(0.5); // Max available is 50/100 = 0.5
  });

  it("should enforce minimum scale of 24px", () => {
    const rect = createMockRect({
      left: 150,
      top: 150,
      width: 100,
      height: 100,
      scaleX: 0.1, // Would be 10px
      scaleY: 0.1, // Would be 10px
    });

    limitCropRectScale(rect, imgBounds);

    expect(rect.set).toHaveBeenCalled();
    const setCall = (rect.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(setCall.scaleX).toBe(0.24); // Min is 24/100 = 0.24
    expect(setCall.scaleY).toBe(0.24);
  });

  it("should handle rect at image edge", () => {
    const rect = createMockRect({
      left: 100, // At left edge
      top: 100, // At top edge
      width: 100,
      height: 100,
      scaleX: 1,
      scaleY: 1,
    });

    // Available space is full image size
    limitCropRectScale(rect, imgBounds);

    expect(rect.set).not.toHaveBeenCalled();
  });

  it("should handle very small base dimensions", () => {
    const rect = createMockRect({
      left: 150,
      top: 150,
      width: 10,
      height: 10,
      scaleX: 1,
      scaleY: 1,
    });

    limitCropRectScale(rect, imgBounds);

    expect(rect.set).toHaveBeenCalled();
    const setCall = (rect.set as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // Min scale for 10px base to reach 24px is 2.4
    expect(setCall.scaleX).toBe(2.4);
    expect(setCall.scaleY).toBe(2.4);
  });
});
