
import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "default" | "pt-green" | "pt-blue" | "pt-red";
}

export const Spinner = ({
  size = "md",
  className = "",
  color = "default"
}: SpinnerProps) => {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const colorClass = {
    default: "text-gray-400",
    "pt-green": "text-pt-green",
    "pt-blue": "text-pt-blue",
    "pt-red": "text-pt-red",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-4 border-t-transparent",
        sizeClass[size],
        colorClass[color],
        className
      )}
    />
  );
};
