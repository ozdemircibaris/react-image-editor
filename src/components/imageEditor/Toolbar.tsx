import React from "react";

import { Icon, Popover, Slider } from "../UI";
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
  className?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  iconName,
  onClick,
  title,
  isActive = false,
  disabled = false,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`toolbar-button ${isActive ? "active" : ""} ${disabled ? "disabled" : ""} ${className}`}
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
          min={1}
          max={20}
          value={currentWidth}
          onChange={onWidthChange}
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
  onDeleteObject?: () => void;
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
  onDeleteObject,
}) => {
  return (
    <div className="toolbar">
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

          <div className="toolbar-divider" />

          <Popover
            trigger={
              <div className={`toolbar-button ${selectedObject || isDrawing ? "" : "disabled"}`}>
                <div className="w-6 h-6 rounded border-2 border-gray-700" style={{ backgroundColor: currentColor }} />
              </div>
            }
            content={<ColorPalette currentColor={currentColor} onColorChange={onColorChange || (() => {})} />}
            contentClassName="glass-effect-strong"
            placement="bottom"
          />

          <Popover
            trigger={
              <div className={`toolbar-button ${selectedObject || isDrawing ? "" : "disabled"}`}>
                {/* Custom inline stroke width indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 18,
                      height: 2,
                      background: "#9ca3af",
                      borderRadius: 9999,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translate(0,-50%)",
                        width: Math.max(2, Math.min(12, currentStrokeWidth)) + 2,
                        height: Math.max(2, Math.min(12, currentStrokeWidth)),
                        borderRadius: 9999,
                        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
                      }}
                    />
                  </div>
                </div>
              </div>
            }
            content={
              <WidthSlider currentWidth={currentStrokeWidth} onWidthChange={onStrokeWidthChange || (() => {})} />
            }
            placement="bottom"
            contentClassName="glass-effect-strong"
          />

          <div className="toolbar-divider" />

          <ToolbarButton iconName="undo" onClick={onUndo || (() => {})} title="Undo (Ctrl+Z)" disabled={!canUndo} />
          <ToolbarButton iconName="redo" onClick={onRedo || (() => {})} title="Redo (Ctrl+Y)" disabled={!canRedo} />

          {selectedObject && (
            <>
              <div className="toolbar-divider" />
              <ToolbarButton
                iconName="trash"
                onClick={onDeleteObject || (() => {})}
                title="Delete (Backspace)"
                disabled={false}
                className="delete-button"
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
