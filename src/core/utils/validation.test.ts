import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateImageFile,
  createValidatedImageURL,
  SUPPORTED_IMAGE_TYPES,
} from "./validation";

// Mock URL.createObjectURL
const mockObjectUrl = "blob:http://localhost/mock-uuid";
const originalCreateObjectURL = global.URL.createObjectURL;

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => mockObjectUrl);
});

afterEach(() => {
  global.URL.createObjectURL = originalCreateObjectURL;
});

// Helper to create mock File
function createMockFile(
  type: string,
  name: string = "test.jpg"
): File {
  return new File(["test content"], name, { type });
}

describe("SUPPORTED_IMAGE_TYPES", () => {
  it("should include common image formats", () => {
    expect(SUPPORTED_IMAGE_TYPES).toContain("image/jpeg");
    expect(SUPPORTED_IMAGE_TYPES).toContain("image/png");
    expect(SUPPORTED_IMAGE_TYPES).toContain("image/gif");
    expect(SUPPORTED_IMAGE_TYPES).toContain("image/webp");
    expect(SUPPORTED_IMAGE_TYPES).toContain("image/svg+xml");
    expect(SUPPORTED_IMAGE_TYPES).toContain("image/bmp");
  });

  it("should have exactly 6 supported types", () => {
    expect(SUPPORTED_IMAGE_TYPES).toHaveLength(6);
  });
});

describe("validateImageFile", () => {
  describe("valid files", () => {
    it.each(SUPPORTED_IMAGE_TYPES)(
      "should accept %s files",
      (mimeType) => {
        const file = createMockFile(mimeType);
        const result = validateImageFile(file);

        expect(result.valid).toBe(true);
        expect(result.mimeType).toBe(mimeType);
        expect(result.error).toBeUndefined();
      }
    );
  });

  describe("invalid files", () => {
    it("should reject null/undefined file", () => {
      const result = validateImageFile(null as unknown as File);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("No file provided");
    });

    it("should reject file without MIME type", () => {
      const file = createMockFile("");
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "File has no MIME type. Cannot determine file format."
      );
    });

    it("should reject non-image files", () => {
      const file = createMockFile("application/pdf", "test.pdf");
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid file type: application/pdf");
      expect(result.mimeType).toBe("application/pdf");
    });

    it("should reject unsupported image formats", () => {
      const file = createMockFile("image/tiff", "test.tiff");
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsupported image format: tiff");
      expect(result.mimeType).toBe("image/tiff");
    });

    it("should reject text files", () => {
      const file = createMockFile("text/plain", "test.txt");
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid file type: text/plain");
    });

    it("should reject video files", () => {
      const file = createMockFile("video/mp4", "test.mp4");
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid file type: video/mp4");
    });
  });

  describe("custom allowed types", () => {
    it("should accept custom allowed types", () => {
      const customTypes = ["image/jpeg", "image/png"] as const;
      const jpegFile = createMockFile("image/jpeg");
      const pngFile = createMockFile("image/png");

      expect(validateImageFile(jpegFile, customTypes).valid).toBe(true);
      expect(validateImageFile(pngFile, customTypes).valid).toBe(true);
    });

    it("should reject types not in custom list", () => {
      const customTypes = ["image/jpeg"] as const;
      const pngFile = createMockFile("image/png");
      const result = validateImageFile(pngFile, customTypes);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsupported image format: png");
    });
  });
});

describe("createValidatedImageURL", () => {
  describe("valid files", () => {
    it("should create object URL for valid image", () => {
      const file = createMockFile("image/png");
      const result = createValidatedImageURL(file);

      expect(result.url).toBe(mockObjectUrl);
      expect(result.mimeType).toBe("image/png");
      expect(result.error).toBeUndefined();
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    });

    it("should work with custom allowed types", () => {
      const file = createMockFile("image/jpeg");
      const result = createValidatedImageURL(file, ["image/jpeg"]);

      expect(result.url).toBe(mockObjectUrl);
      expect(result.mimeType).toBe("image/jpeg");
    });
  });

  describe("invalid inputs", () => {
    it("should return null URL for null file", () => {
      const result = createValidatedImageURL(null);

      expect(result.url).toBeNull();
      expect(result.error).toBe("No file provided");
    });

    it("should return null URL for undefined file", () => {
      const result = createValidatedImageURL(undefined);

      expect(result.url).toBeNull();
      expect(result.error).toBe("No file provided");
    });

    it("should return null URL for invalid file type", () => {
      const file = createMockFile("text/plain");
      const result = createValidatedImageURL(file);

      expect(result.url).toBeNull();
      expect(result.error).toContain("Invalid file type");
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("should return null URL for unsupported image format", () => {
      const file = createMockFile("image/tiff");
      const result = createValidatedImageURL(file);

      expect(result.url).toBeNull();
      expect(result.error).toContain("Unsupported image format");
      expect(result.mimeType).toBe("image/tiff");
    });
  });
});
