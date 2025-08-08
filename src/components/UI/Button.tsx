import React from "react";

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  color?: "primary" | "secondary" | "default";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit" | "reset";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  onPress,
  disabled = false,
  color = "default",
  size = "md",
  className = "",
  type = "button",
}) => {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    onPress?.();
  };

  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const colorClasses = {
    primary:
      "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    default: "bg-gray-500 hover:bg-gray-600 text-white",
  };

  const focusClasses = {
    primary: "focus:ring-blue-500",
    secondary: "focus:ring-gray-500",
    default: "focus:ring-gray-500",
  };

  const classes = [baseClasses, sizeClasses[size], colorClasses[color], focusClasses[color], className].join(" ");

  return (
    <button type={type} className={classes} onClick={handleClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;
