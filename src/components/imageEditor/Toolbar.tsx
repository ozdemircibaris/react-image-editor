import { Slider } from "@heroui/react";
import React from "react";

import { Icon, Popover } from "../UI";
import { IconNamesType } from "../../constants/icons";

// Shared color palette - can be exported and used by other components
export const PREDEFINED_COLORS = [
  "#ff7000", // Primary orange (default)
  "#D64045", // Red
  "#2D3748", // Dark gray
  "#E53E3E", // Red
  "#38A169", // Green
  "#3182CE", // Blue
  "#D69E2E", // Yellow
  "#805AD5", // Purple
  "#DD6B20", // Orange
  "#319795", // Teal
  "#F56565", // Light red
  "#48BB78", // Light green
  "#4299E1", // Light blue
  "#ECC94B", // Light yellow
  "#9F7AEA", // Light purple
  "#ED8936", // Light orange
] as const;

// ToolbarButton Component
interface ToolbarButtonProps {
  iconName: IconNamesType;
  onClick: () => void;
  title: string;
  isActive?: boolean;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  iconName,
  onClick,
  title,
  isActive = false,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`toolbar-button ${isActive ? "active" : ""} ${disabled ? "disabled" : ""}`}
      title={title}
    >
      <Icon name={iconName} width={20} height={20} className="text-white" />
    </button>
  );
};

// Color Palette Component
interface ColorPaletteProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ currentColor, onColorChange }) => {
  return (
    <div className="color-palette">
      <div className="color-palette-grid">
        {PREDEFINED_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`color-button ${currentColor === color ? "active" : ""}`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

// Width Slider Component
interface WidthSliderProps {
  currentWidth: number;
  onWidthChange: (width: number) => void;
}

const WidthSlider: React.FC<WidthSliderProps> = ({ currentWidth, onWidthChange }) => {
  return (
    <div className="width-slider">
      <div className="width-slider-content">
        <label className="width-slider-label">Stroke Width:</label>
        <Slider
          size="sm"
          step={1}
          minValue={1}
          maxValue={20}
          value={currentWidth}
          onChange={(value) => onWidthChange(value as number)}
          className="width-slider-input"
        />
        <span className="width-slider-value">{currentWidth}px</span>
      </div>
    </div>
  );
};

// Toolbar Component
interface ToolbarProps {
  onAddShape: (shapeType: "rectangle" | "circle") => void;
  onCropStart: () => void;
  onAddBlur: () => void;
  onToggleDraw: () => void;
  onToggleSelectMode: () => void;
  hasImage: boolean;
  isCropping: boolean;
  isDrawing: boolean;
  isSelectMode: boolean;
  activeShape?: "rectangle" | "circle" | null;
  isBlurActive?: boolean;
  selectedObject?: fabric.Object | null;
  currentColor?: string;
  currentStrokeWidth?: number;
  onColorChange?: (color: string) => void;
  onStrokeWidthChange?: (width: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddShape,
  onCropStart,
  onAddBlur,
  onToggleDraw,
  onToggleSelectMode,
  hasImage,
  isCropping,
  isDrawing,
  isSelectMode,
  activeShape,
  isBlurActive = false,
  selectedObject,
  currentColor = "#D64045",
  currentStrokeWidth = 2,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      {hasImage && (
        <>
          <ToolbarButton
            iconName="cursor"
            onClick={onToggleSelectMode}
            title="Select"
            isActive={isSelectMode}
            disabled={false}
          />

          <ToolbarButton
            iconName="pencil"
            onClick={onToggleDraw}
            title="Draw"
            isActive={isDrawing}
            disabled={isCropping}
          />

          <ToolbarButton iconName="crop" onClick={onCropStart} title="Crop" disabled={isCropping || isDrawing} />

          <ToolbarButton
            iconName="blur"
            onClick={onAddBlur}
            title="Blur"
            isActive={isBlurActive}
            disabled={isCropping || isDrawing}
          />

          <ToolbarButton
            iconName="square"
            onClick={() => onAddShape("rectangle")}
            title="Rectangle"
            isActive={activeShape === "rectangle"}
            disabled={isCropping || isDrawing}
          />

          <ToolbarButton
            iconName="circle"
            onClick={() => onAddShape("circle")}
            title="Circle"
            isActive={activeShape === "circle"}
            disabled={isCropping || isDrawing}
          />

          <div className="w-px h-8 bg-gray-300 mx-2" />

          {/* Color Palette - always visible but disabled when no object selected and not drawing */}
          <Popover
            trigger={
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-white hover:bg-white/15 cursor-pointer ${
                  !selectedObject && !isDrawing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="w-6 h-6 rounded border-2 border-white/20" style={{ backgroundColor: currentColor }} />
              </div>
            }
            content={<ColorPalette currentColor={currentColor} onColorChange={onColorChange || (() => {})} />}
            contentClassName="!bg-[#553529]"
            placement="bottom"
          />

          {/* Width Slider - always visible but disabled when no object selected and not drawing */}
          <Popover
            trigger={
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors text-white hover:bg-white/15 cursor-pointer ${
                  !selectedObject && !isDrawing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="w-6 h-1 bg-white rounded" />
              </div>
            }
            content={
              <WidthSlider currentWidth={currentStrokeWidth} onWidthChange={onStrokeWidthChange || (() => {})} />
            }
            placement="bottom"
            contentClassName="!bg-[#553529]"
          />

          <div className="w-px h-8 bg-gray-300 mx-2" />

          <ToolbarButton iconName="undo" onClick={onUndo || (() => {})} title="Undo (Ctrl+Z)" disabled={!canUndo} />

          <ToolbarButton iconName="redo" onClick={onRedo || (() => {})} title="Redo (Ctrl+Y)" disabled={!canRedo} />
        </>
      )}
    </div>
  );
};
