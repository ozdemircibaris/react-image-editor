"use client";

import { IconNamesType } from "../../constants/icons";

// Import SVG icons as React components
// These will be transformed by rollup-plugin-svg
import blurIcon from "../../../public/assets/icons/blur.svg";
import circleIcon from "../../../public/assets/icons/circle.svg";
import cropIcon from "../../../public/assets/icons/crop.svg";
import cursorIcon from "../../../public/assets/icons/cursor.svg";
import pencilIcon from "../../../public/assets/icons/pencil.svg";
import redoIcon from "../../../public/assets/icons/redo.svg";
import squareIcon from "../../../public/assets/icons/square.svg";
import undoIcon from "../../../public/assets/icons/undo.svg";

// Icon mapping - only include icons that actually exist
const iconMap: Partial<Record<IconNamesType, string>> = {
  blur: blurIcon,
  circle: circleIcon,
  crop: cropIcon,
  cursor: cursorIcon,
  pencil: pencilIcon,
  redo: redoIcon,
  square: squareIcon,
  undo: undoIcon,
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
 * Icon component that renders SVG icons inline
 *
 * Features:
 * - Inline SVG rendering for better performance
 * - Color control through CSS classes (text-*)
 * - Type-safe icon names
 * - Bundled with the library (no external dependencies)
 */
export const Icon = ({ name, width = 20, height = 20, className, title }: IconProps) => {
  const svgDataUrl = iconMap[name];

  if (!svgDataUrl) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  // Extract SVG content from data URL
  const svgContent = svgDataUrl.replace(/^data:image\/svg\+xml;base64,/, "");
  const decodedSvg = atob(svgContent);

  // Parse SVG to extract viewBox and inner content
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(decodedSvg, "image/svg+xml");
  const svgElement = svgDoc.querySelector("svg");

  if (!svgElement) {
    console.warn(`Invalid SVG for icon "${name}"`);
    return null;
  }

  const viewBox = svgElement.getAttribute("viewBox") || "0 0 20 20";
  const innerHTML = svgElement.innerHTML;

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className || ""}`}
      role="img"
      aria-hidden={!title}
      {...(title && { "aria-label": title })}
    >
      {title && <title>{title}</title>}
      <g dangerouslySetInnerHTML={{ __html: innerHTML }} />
    </svg>
  );
};

export default Icon;
