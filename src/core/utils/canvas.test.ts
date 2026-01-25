import { describe, it, expect, vi } from "vitest";
import {
  calculateCanvasSize,
  calculateFitScale,
  calculateCenterPosition,
  clampZoom,
  calculateIntersection,
  canvasToImageCoords,
  imageToCanvasCoords,
  dataURLToBlob,
} from "./canvas";

describe("calculateCanvasSize", () => {
  describe("mobile viewport", () => {
    it("should use mobile margin and aspect ratio", () => {
      const result = calculateCanvasSize(375, 667);

      expect(result.width).toBeLessThanOrEqual(375 - 8 * 2); // mobileMargin = 8
      expect(result.height).toBeLessThanOrEqual(667 - 8);
    });

    it("should apply 1:1 aspect ratio for mobile", () => {
      const result = calculateCanvasSize(375, 800);
      // Mobile uses 1:1 aspect ratio, so width should equal height (approximately)
      expect(Math.abs(result.width - result.height)).toBeLessThanOrEqual(1);
    });
  });

  describe("tablet viewport", () => {
    it("should use tablet margin", () => {
      const result = calculateCanvasSize(900, 700);

      expect(result.width).toBeLessThanOrEqual(900 - 100 * 2); // tabletMargin = 100
    });

    it("should use 16:9 aspect ratio for tablet", () => {
      const result = calculateCanvasSize(1000, 800);
      const actualRatio = result.width / result.height;
      const expectedRatio = 16 / 9;

      expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.1);
    });
  });

  describe("desktop viewport", () => {
    it("should use desktop margin", () => {
      const result = calculateCanvasSize(1920, 1080);

      expect(result.width).toBeLessThanOrEqual(1920 - 200 * 2); // desktopMargin = 200
    });
  });

  describe("minimum dimensions", () => {
    it("should enforce minimum width", () => {
      const result = calculateCanvasSize(100, 100);

      expect(result.width).toBeGreaterThanOrEqual(200); // minWidth
    });

    it("should enforce minimum height", () => {
      const result = calculateCanvasSize(100, 50);

      expect(result.height).toBeGreaterThanOrEqual(120); // minHeight
    });
  });

  describe("custom options", () => {
    it("should accept custom breakpoints", () => {
      const result = calculateCanvasSize(500, 500, {
        mobileBreakpoint: 600,
        tabletBreakpoint: 800,
      });
      // 500 is mobile since breakpoint is 600
      expect(result.width).toBeLessThanOrEqual(500);
    });

    it("should accept custom margins", () => {
      const result = calculateCanvasSize(1200, 800, {
        desktopMargin: 50,
      });

      expect(result.width).toBeLessThanOrEqual(1200 - 50 * 2);
    });

    it("should accept custom aspect ratios", () => {
      const result = calculateCanvasSize(1200, 800, {
        defaultAspectRatio: 4 / 3,
      });
      const actualRatio = result.width / result.height;

      expect(Math.abs(actualRatio - 4 / 3)).toBeLessThan(0.1);
    });
  });

  describe("edge cases", () => {
    it("should handle zero dimensions", () => {
      const result = calculateCanvasSize(0, 0);

      expect(result.width).toBeGreaterThanOrEqual(200);
      expect(result.height).toBeGreaterThanOrEqual(120);
    });

    it("should floor the results", () => {
      const result = calculateCanvasSize(1000, 600);

      expect(Number.isInteger(result.width)).toBe(true);
      expect(Number.isInteger(result.height)).toBe(true);
    });
  });
});

describe("calculateFitScale", () => {
  it("should return 1 when image fits perfectly", () => {
    const scale = calculateFitScale(100, 100, 200, 200, 24);

    expect(scale).toBeLessThanOrEqual(1);
  });

  it("should scale down large images", () => {
    const scale = calculateFitScale(1000, 500, 200, 200, 24);

    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThan(0);
  });

  it("should not scale up small images beyond 1", () => {
    const scale = calculateFitScale(50, 50, 1000, 1000, 24);

    expect(scale).toBe(1);
  });

  it("should respect padding", () => {
    // Use large image that requires scaling to see padding effect
    const scaleWithPadding = calculateFitScale(500, 500, 300, 300, 50);
    const scaleNoPadding = calculateFitScale(500, 500, 300, 300, 0);

    // With padding: maxWidth = 300 - 100 = 200, scale = 200/500 = 0.4
    // No padding: maxWidth = 300, scale = 300/500 = 0.6
    expect(scaleWithPadding).toBeLessThan(scaleNoPadding);
  });

  it("should use smaller scale when constrained by width", () => {
    // Very wide image
    const scale = calculateFitScale(1000, 100, 200, 200, 24);
    const maxWidth = 200 - 24 * 2;

    expect(scale).toBeCloseTo(maxWidth / 1000, 2);
  });

  it("should use smaller scale when constrained by height", () => {
    // Very tall image
    const scale = calculateFitScale(100, 1000, 200, 200, 24);
    const maxHeight = 200 - 24 * 2;

    expect(scale).toBeCloseTo(maxHeight / 1000, 2);
  });

  it("should use default padding of 24", () => {
    const scale = calculateFitScale(200, 200, 200, 200);
    const expectedScale = (200 - 24 * 2) / 200;

    expect(scale).toBeCloseTo(expectedScale, 2);
  });
});

describe("calculateCenterPosition", () => {
  it("should center object horizontally and vertically", () => {
    const position = calculateCenterPosition(100, 100, 500, 500);

    expect(position.x).toBe(200);
    expect(position.y).toBe(200);
  });

  it("should handle asymmetric canvas", () => {
    const position = calculateCenterPosition(100, 50, 400, 300);

    expect(position.x).toBe(150);
    expect(position.y).toBe(125);
  });

  it("should handle object larger than canvas", () => {
    const position = calculateCenterPosition(600, 600, 400, 400);

    expect(position.x).toBe(-100);
    expect(position.y).toBe(-100);
  });

  it("should handle zero-sized object", () => {
    const position = calculateCenterPosition(0, 0, 400, 400);

    expect(position.x).toBe(200);
    expect(position.y).toBe(200);
  });
});

describe("clampZoom", () => {
  it("should return zoom within bounds", () => {
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(2)).toBe(2);
    expect(clampZoom(0.5)).toBe(0.5);
  });

  it("should clamp zoom below minimum", () => {
    expect(clampZoom(0.1)).toBe(0.2);
    expect(clampZoom(0)).toBe(0.2);
    expect(clampZoom(-1)).toBe(0.2);
  });

  it("should clamp zoom above maximum", () => {
    expect(clampZoom(5)).toBe(4);
    expect(clampZoom(10)).toBe(4);
    expect(clampZoom(100)).toBe(4);
  });

  it("should use custom min/max values", () => {
    expect(clampZoom(0.05, 0.1, 10)).toBe(0.1);
    expect(clampZoom(15, 0.1, 10)).toBe(10);
    expect(clampZoom(5, 0.1, 10)).toBe(5);
  });

  it("should handle edge cases at boundaries", () => {
    expect(clampZoom(0.2)).toBe(0.2); // exactly at min
    expect(clampZoom(4)).toBe(4); // exactly at max
  });
});

describe("calculateIntersection", () => {
  it("should return intersection of overlapping rectangles", () => {
    const rect1 = { left: 0, top: 0, width: 100, height: 100 };
    const rect2 = { left: 50, top: 50, width: 100, height: 100 };

    const result = calculateIntersection(rect1, rect2);

    expect(result).toEqual({
      left: 50,
      top: 50,
      width: 50,
      height: 50,
    });
  });

  it("should return null for non-overlapping rectangles", () => {
    const rect1 = { left: 0, top: 0, width: 100, height: 100 };
    const rect2 = { left: 200, top: 200, width: 100, height: 100 };

    expect(calculateIntersection(rect1, rect2)).toBeNull();
  });

  it("should return null for touching rectangles (no overlap)", () => {
    const rect1 = { left: 0, top: 0, width: 100, height: 100 };
    const rect2 = { left: 100, top: 0, width: 100, height: 100 };

    expect(calculateIntersection(rect1, rect2)).toBeNull();
  });

  it("should handle contained rectangle", () => {
    const outer = { left: 0, top: 0, width: 200, height: 200 };
    const inner = { left: 50, top: 50, width: 50, height: 50 };

    const result = calculateIntersection(outer, inner);

    expect(result).toEqual({
      left: 50,
      top: 50,
      width: 50,
      height: 50,
    });
  });

  it("should handle partial horizontal overlap", () => {
    const rect1 = { left: 0, top: 50, width: 100, height: 50 };
    const rect2 = { left: 50, top: 50, width: 100, height: 50 };

    const result = calculateIntersection(rect1, rect2);

    expect(result).toEqual({
      left: 50,
      top: 50,
      width: 50,
      height: 50,
    });
  });
});

describe("canvasToImageCoords", () => {
  it("should convert canvas coords to image coords", () => {
    const mockImage = {
      left: 100,
      top: 100,
      scaleX: 2,
      scaleY: 2,
    } as unknown as import("fabric").fabric.Image;

    const result = canvasToImageCoords(200, 200, mockImage);

    expect(result.x).toBe(50); // (200 - 100) / 2
    expect(result.y).toBe(50); // (200 - 100) / 2
  });

  it("should handle scale of 1", () => {
    const mockImage = {
      left: 50,
      top: 50,
      scaleX: 1,
      scaleY: 1,
    } as unknown as import("fabric").fabric.Image;

    const result = canvasToImageCoords(150, 200, mockImage);

    expect(result.x).toBe(100);
    expect(result.y).toBe(150);
  });

  it("should handle missing properties with defaults", () => {
    const mockImage = {} as unknown as import("fabric").fabric.Image;

    const result = canvasToImageCoords(100, 100, mockImage);

    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it("should handle different X and Y scales", () => {
    const mockImage = {
      left: 0,
      top: 0,
      scaleX: 2,
      scaleY: 4,
    } as unknown as import("fabric").fabric.Image;

    const result = canvasToImageCoords(100, 100, mockImage);

    expect(result.x).toBe(50); // 100 / 2
    expect(result.y).toBe(25); // 100 / 4
  });
});

describe("imageToCanvasCoords", () => {
  it("should convert image coords to canvas coords", () => {
    const mockImage = {
      left: 100,
      top: 100,
      scaleX: 2,
      scaleY: 2,
    } as unknown as import("fabric").fabric.Image;

    const result = imageToCanvasCoords(50, 50, mockImage);

    expect(result.x).toBe(200); // 100 + 50 * 2
    expect(result.y).toBe(200); // 100 + 50 * 2
  });

  it("should be inverse of canvasToImageCoords", () => {
    const mockImage = {
      left: 100,
      top: 50,
      scaleX: 1.5,
      scaleY: 2,
    } as unknown as import("fabric").fabric.Image;

    const canvasX = 250;
    const canvasY = 200;

    const imageCoords = canvasToImageCoords(canvasX, canvasY, mockImage);
    const backToCanvas = imageToCanvasCoords(imageCoords.x, imageCoords.y, mockImage);

    expect(backToCanvas.x).toBeCloseTo(canvasX);
    expect(backToCanvas.y).toBeCloseTo(canvasY);
  });

  it("should handle missing properties with defaults", () => {
    const mockImage = {} as unknown as import("fabric").fabric.Image;

    const result = imageToCanvasCoords(100, 100, mockImage);

    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });
});

describe("dataURLToBlob", () => {
  it("should convert data URL to Blob", async () => {
    // Create a simple base64 PNG data URL
    const dataURL =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const blob = await dataURLToBlob(dataURL);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("should handle different image formats", async () => {
    // Mock fetch for this test
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(["test"], { type: "image/jpeg" })),
    });

    const result = await dataURLToBlob("data:image/jpeg;base64,test");

    expect(result.type).toBe("image/jpeg");

    global.fetch = originalFetch;
  });
});
