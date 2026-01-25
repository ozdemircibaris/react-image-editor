// ============================================================================
// Image Validation Utilities
// ============================================================================

/**
 * Supported image MIME types
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

/**
 * Validation result for image files
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
}

/**
 * Validates an image file by MIME type
 *
 * @param file - The file to validate
 * @param allowedTypes - Optional array of allowed MIME types (defaults to SUPPORTED_IMAGE_TYPES)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```tsx
 * const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (!file) return;
 *
 *   const result = validateImageFile(file);
 *   if (!result.valid) {
 *     alert(result.error);
 *     return;
 *   }
 *
 *   const url = URL.createObjectURL(file);
 *   // Use the url with image editor
 * };
 * ```
 */
export function validateImageFile(
  file: File,
  allowedTypes: readonly string[] = SUPPORTED_IMAGE_TYPES
): ImageValidationResult {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: "No file provided",
    };
  }

  // Check MIME type
  const mimeType = file.type;

  if (!mimeType) {
    return {
      valid: false,
      error: "File has no MIME type. Cannot determine file format.",
      mimeType: undefined,
    };
  }

  // Check if MIME type starts with "image/"
  if (!mimeType.startsWith("image/")) {
    return {
      valid: false,
      error: `Invalid file type: ${mimeType}. Please select an image file.`,
      mimeType,
    };
  }

  // Check against allowed types
  if (!allowedTypes.includes(mimeType)) {
    const allowedList = allowedTypes
      .map((t) => t.replace("image/", ""))
      .join(", ");
    return {
      valid: false,
      error: `Unsupported image format: ${mimeType.replace("image/", "")}. Supported formats: ${allowedList}`,
      mimeType,
    };
  }

  return {
    valid: true,
    mimeType,
  };
}

/**
 * Creates a validated object URL from a file
 *
 * @param file - The file to create URL from
 * @param allowedTypes - Optional array of allowed MIME types
 * @returns Object URL if valid, null if invalid
 *
 * @example
 * ```tsx
 * const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   const result = createValidatedImageURL(file);
 *
 *   if (!result.url) {
 *     alert(result.error);
 *     return;
 *   }
 *
 *   setImageUrl(result.url);
 * };
 * ```
 */
export function createValidatedImageURL(
  file: File | null | undefined,
  allowedTypes?: readonly string[]
): { url: string | null; error?: string; mimeType?: string } {
  if (!file) {
    return { url: null, error: "No file provided" };
  }

  const validation = validateImageFile(file, allowedTypes);

  if (!validation.valid) {
    return {
      url: null,
      error: validation.error,
      mimeType: validation.mimeType,
    };
  }

  return {
    url: URL.createObjectURL(file),
    mimeType: validation.mimeType,
  };
}
