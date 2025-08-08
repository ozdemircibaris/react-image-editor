import React, { useState, useRef, useEffect } from "react";

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = "md",
  className = "",
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const trackHeights: Record<NonNullable<typeof size>, number> = {
    sm: 4,
    md: 6,
    lg: 8,
  };

  const thumbSizes: Record<NonNullable<typeof size>, number> = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging || disabled || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    const newValue = Math.round((percentage / 100) * (max - min) + min);

    // Snap to step
    const steppedValue = Math.round(newValue / step) * step;
    onChange(steppedValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    let next = value;
    const range = max - min;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(min, value - step);
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(max, value + step);
        break;
      case "PageDown":
        next = Math.max(min, value - Math.max(1, Math.round(range * 0.1)));
        break;
      case "PageUp":
        next = Math.min(max, value + Math.max(1, Math.round(range * 0.1)));
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(Math.round(next / step) * step);
  };

  const trackHeight = trackHeights[size];
  const thumbSize = thumbSizes[size];

  return (
    <div
      ref={sliderRef}
      className={`relative flex items-center select-none no-focus-ring ${className}`}
      onMouseDown={handleMouseDown}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      style={{
        height: Math.max(thumbSize, trackHeight) + 8,
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        outline: "none",
      }}
    >
      {/* Track */}
      <div
        style={{
          width: "100%",
          height: trackHeight,
          background: "#374151",
          borderRadius: 9999,
        }}
      >
        {/* Filled track */}
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            borderRadius: 9999,
            transition: "width 120ms ease",
          }}
        />
      </div>

      {/* Thumb */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${percentage}%`,
          width: thumbSize,
          height: thumbSize,
          borderRadius: "9999px",
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          border: "2px solid #1f2937",
          boxShadow: "0 0 0 2px rgba(59,130,246,0.25)",
          transform: "translate(-50%, -50%)",
          transition: "transform 120ms ease, box-shadow 120ms ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default Slider;
