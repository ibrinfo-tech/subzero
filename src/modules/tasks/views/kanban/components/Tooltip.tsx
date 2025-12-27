"use client";

import { useState } from "react";
import { cn } from "@/core/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "bottom" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const sideClasses = {
    top: "bottom-full left-0 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  const arrowClasses = {
    top: "after:absolute after:top-full after:left-3 after:border-4 after:border-transparent after:border-t-popover",
    bottom: "after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-popover",
    left: "after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-popover",
    right: "after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-popover",
  };

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-[100] px-2.5 py-1.5 text-xs font-medium",
            "text-popover-foreground bg-popover",
            "border border-border rounded-md shadow-md",
            "whitespace-nowrap pointer-events-none",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            sideClasses[side],
            arrowClasses[side],
            side === "top" && "min-w-max"
          )}
          role="tooltip"
          style={
            side === "top"
              ? {
                  maxWidth: "100%",
                  left: "0",
                  transform: "none",
                }
              : undefined
          }
        >
          {content}
        </div>
      )}
    </div>
  );
}

