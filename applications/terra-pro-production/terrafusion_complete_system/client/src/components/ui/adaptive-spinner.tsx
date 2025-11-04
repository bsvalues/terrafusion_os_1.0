import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePerformance } from "@/contexts/PerformanceContext";

interface SpinnerProps {
  /** Size of the spinner (sm, md, lg, xl) */
  size?: "sm" | "md" | "lg" | "xl";

  /** Optional className for styling */
  className?: string;

  /** Whether the spinner should adapt to performance */
  adaptive?: boolean;

  /** Loading text to display */
  loadingText?: string;

  /** Show performance indicator text */
  showPerformanceText?: boolean;
}

/**
 * Adaptive loading spinner that changes its animation
 * based on system performance
 */
export function AdaptiveSpinner({
  size = "md",
  className,
  adaptive = true,
  loadingText,
  showPerformanceText = false,
}: SpinnerProps) {
  const { performance } = usePerformance();
  const [message, setMessage] = useState<string | null>(null);

  // Size classes
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  // Update performance message
  useEffect(() => {
    if (!adaptive || !showPerformanceText) {
      setMessage(null);
      return;
    }

    const { overallPerformance } = performance;

    // Set appropriate message based on performance level
    if (overallPerformance === "low") {
      setMessage("System is busy, operation may take longer than usual");
    } else if (overallPerformance === "medium") {
      setMessage("Processing your request...");
    } else {
      setMessage("Processing your request, should be quick");
    }
  }, [adaptive, performance.overallPerformance, showPerformanceText]);

  // Animation speed based on performance
  const animation = adaptive ? performance.overallPerformance : "default";

  // Animation classes
  const animationClass: Record<string, string> = {
    low: "animate-spin-slow",
    medium: "animate-spin",
    high: "animate-spin-fast",
    default: "animate-spin",
  };

  // Determine additional animation effects based on performance
  const additionalEffects: Record<string, string> = {
    low: "opacity-70",
    medium: "",
    high: "",
    default: "",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "text-primary relative rounded-full border-2 border-solid border-primary border-t-transparent",
          sizeClasses[size],
          animationClass[animation],
          additionalEffects[performance.overallPerformance],
          className
        )}
      />

      {loadingText && <div className="text-sm text-gray-600">{loadingText}</div>}

      {showPerformanceText && message && (
        <div className="text-xs text-gray-500 max-w-xs text-center">{message}</div>
      )}
    </div>
  );
}

// Legacy component name for backward compatibility
export function LoadingSpinner(props: SpinnerProps) {
  return <AdaptiveSpinner {...props} />;
}
