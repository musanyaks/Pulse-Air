"use client";

import { getAQIColor, getAQITextColor } from "@/lib/aqi";
import { cn } from "@/lib/utils";

interface Props {
  aqi: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AQIBadge({ aqi, size = "md", className }: Props) {
  const bg = getAQIColor(aqi);
  const color = getAQITextColor(aqi);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full font-semibold", sizeClasses[size], className)}
      style={{ backgroundColor: bg, color }}
    >
      {aqi}
    </span>
  );
}
