"use client";

import { useState, useEffect } from "react";

import { IconNamesType } from "../../constants/icons";

// Cache for processed SVG content (clear cache on code reload)
const svgCache = new Map<string, string>();
// Cache for ongoing fetch requests to avoid duplicates
const fetchPromises = new Map<string, Promise<string>>();

/**
 * Preload icon(s) for better performance
 * Useful for preloading critical icons before they are needed
 */
export const preloadIcon = async (iconNames: IconNamesType | IconNamesType[]): Promise<void> => {
  const names = Array.isArray(iconNames) ? iconNames : [iconNames];

  await Promise.all(
    names.map(async (name) => {
      try {
        // Skip if already cached
        if (svgCache.has(name)) return;

        // Skip if already being fetched
        if (fetchPromises.has(name)) {
          await fetchPromises.get(name);
          return;
        }

        const fetchPromise = fetch(`/assets/icons/${name}.svg`)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`SVG not found: ${name}.svg`);
            }

            const originalSvgText = await response.text();

            // Extract stroke-width from original BEFORE any replacements
            const strokeWidthMatch = originalSvgText.match(/stroke-width="([^"]*)"/);
            const originalStrokeWidth = strokeWidthMatch ? strokeWidthMatch[1] : null;

            // Now do the replacements
            let svgText = originalSvgText;
            svgText = svgText.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');
            svgText = svgText.replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"');
            svgText = svgText.replace(/stop-color="[^"]*"/g, 'stop-color="currentColor"');
            svgText = svgText.replace(/width="[^"]*"/g, "");
            svgText = svgText.replace(/height="[^"]*"/g, "");

            // Cache both processed SVG and original stroke-width
            const cacheData = JSON.stringify({
              svg: svgText,
              strokeWidth: originalStrokeWidth,
            });

            svgCache.set(name, cacheData);
            return cacheData;
          })
          .finally(() => {
            fetchPromises.delete(name);
          });

        fetchPromises.set(name, fetchPromise);
        await fetchPromise;
      } catch (err) {
        console.warn(`Failed to preload icon "${name}":`, err);
      }
    }),
  );
};

interface IconProps {
  /** Name of the icon to render */
  name: IconNamesType;
  /** Width of the icon (default: 20) */
  width?: number;
  /** Height of the icon (default: 20) */
  height?: number;
  /** Additional CSS classes for styling (use text-* classes for color) */
  className?: string;
  /** Optional title for accessibility */
  title?: string;
}

/**
 * Simple Icon component for rendering SVG icons from files
 *
 * Features:
 * - Loads SVG files from public/assets/icons/{name}.svg
 * - Preserves original stroke-width if present in SVG
 * - Memory cache to avoid re-fetching
 * - Color control through CSS classes
 * - Type-safe icon names
 */
export const Icon = ({ name, width = 20, height = 20, className, title }: IconProps) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        setLoading(true);
        setError(false);

        // Check cache first

        if (svgCache.has(name)) {
          setSvgContent(svgCache.get(name)!);
          setLoading(false);
          return;
        }

        // Check if already being fetched
        if (fetchPromises.has(name)) {
          const cachedResult = await fetchPromises.get(name)!;

          setSvgContent(cachedResult);
          setLoading(false);
          return;
        }

        // Fetch new icon
        const fetchPromise = fetch(`/assets/icons/${name}.svg`)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`SVG not found: ${name}.svg`);
            }

            const originalSvgText = await response.text();

            // Extract stroke-width from original BEFORE any replacements
            const strokeWidthMatch = originalSvgText.match(/stroke-width="([^"]*)"/);
            const originalStrokeWidth = strokeWidthMatch ? strokeWidthMatch[1] : null;

            // Now do the replacements
            let svgText = originalSvgText;
            svgText = svgText.replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');
            svgText = svgText.replace(/stroke="(?!none)[^"]*"/g, 'stroke="currentColor"');
            svgText = svgText.replace(/stop-color="[^"]*"/g, 'stop-color="currentColor"');
            svgText = svgText.replace(/width="[^"]*"/g, "");
            svgText = svgText.replace(/height="[^"]*"/g, "");

            // Cache both processed SVG and original stroke-width
            const cacheData = JSON.stringify({
              svg: svgText,
              strokeWidth: originalStrokeWidth,
            });

            svgCache.set(name, cacheData);
            return cacheData;
          })
          .finally(() => {
            fetchPromises.delete(name);
          });

        fetchPromises.set(name, fetchPromise);
        const svgText = await fetchPromise;

        setSvgContent(svgText);
      } catch (err) {
        console.warn(`Icon "${name}" could not be loaded:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadSvg();
  }, [name]);

  if (loading) {
    return <div className={`inline-block ${className || ""}`} style={{ width, height }} />;
  }

  if (error || !svgContent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  // Parse cached data
  let actualSvgContent = svgContent;
  let originalStrokeWidth = undefined;

  try {
    const parsedData = JSON.parse(svgContent);
    if (parsedData.svg) {
      actualSvgContent = parsedData.svg;
      originalStrokeWidth = parsedData.strokeWidth;
    }
  } catch {
    // Not JSON, use as-is (backward compatibility)
    const strokeWidthMatch = svgContent.match(/stroke-width="([^"]*)"/);
    originalStrokeWidth = strokeWidthMatch ? strokeWidthMatch[1] : undefined;
  }

  // Extract viewBox from actual SVG
  const viewBoxMatch = actualSvgContent.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 20 20";

  // Extract inner content
  const svgInnerMatch = actualSvgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const svgInnerContent = svgInnerMatch ? svgInnerMatch[1] : actualSvgContent;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className || ""}`}
      {...(originalStrokeWidth && { style: { strokeWidth: originalStrokeWidth } })}
      role="img"
      aria-hidden={!title}
      {...(title && { "aria-label": title })}
    >
      {title && <title>{title}</title>}
      <g dangerouslySetInnerHTML={{ __html: svgInnerContent }} />
    </svg>
  );
};

export default Icon;
