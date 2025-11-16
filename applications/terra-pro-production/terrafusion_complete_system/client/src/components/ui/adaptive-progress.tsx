import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePerformance } from "@/contexts/PerformanceContext";

interface AdaptiveProgressProps {
  /** Progress value from 0-100 */
  value?: number;

  /** Whether progress is indeterminate */
  indeterminate?: boolean;

  /** Whether progress should adapt to system performance */
  adaptive?: boolean;

  /** Optional className for styling */
  className?: string;

  /** Whether to show percentage */
  showPercentage?: boolean;

  /** Loading text to display */
  loadingText?: string;

  /** Show performance indicator text */
  showPerformanceText?: boolean;
}

/**
 * Adaptive progress bar that changes its animation
 * based on system performance
 */
export function AdaptiveProgress({
  value = 0,
  indeterminate = false,
  adaptive = true,
  className,
  showPercentage = false,
  loadingText,
  showPerformanceText = false,
}: AdaptiveProgressProps) {
  const { performance } = usePerformance();
  const [message, setMessage] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  // Clamp value between 0-100
  const clampedValue = Math.min(100, Math.max(0, value));

  // Animation speed based on performance
  const animation = adaptive ? performance.overallPerformance : "default";

  // Update messages based on performance
  useEffect(() => {
    if (!adaptive || !showPerformanceText) {
      setMessage(null);
      setEstimatedTime(null);
      return;
    }

    const { overallPerformance } = performance;

    // Set appropriate message based on performance level
    if (overallPerformance === "low") {
      setMessage("System is busy, operation may take longer than usual");
    } else if (overallPerformance === "medium") {
      setMessage("Processing your request...");
    } else {
      setMessage("Processing at optimal speed");
    }

    // Set estimated time if determinate progress
    if (!indeterminate && value > 0 && value < 100) {
      // Calculate estimated time based on current progress and performance
      const speedFactor =
        overallPerformance === "low" ? 3 : overallPerformance === "medium" ? 2 : 1;

      const remainingPercent = 100 - value;
      const timePerPercent = 0.1 * speedFactor; // seconds per percent
      const remainingSeconds = Math.round(remainingPercent * timePerPercent);

      if (remainingSeconds < 60) {
        setEstimatedTime(`Estimated time remaining: about ${remainingSeconds} seconds`);
      } else {
        const minutes = Math.floor(remainingSeconds / 60);
        setEstimatedTime(
          `Estimated time remaining: about ${minutes} ${minutes === 1 ? "minute" : "minutes"}`
        );
      }
    } else {
      setEstimatedTime(null);
    }
  }, [adaptive, performance.overallPerformance, indeterminate, value]);

  // Animation class based on performance
  const animationClass: Record<string, string> = indeterminate
    ? {
        slow: "animate-progress-indeterminate-slow",
        medium: "animate-progress-indeterminate-medium",
        fast: "animate-progress-indeterminate-fast",
        default: "animate-progress-indeterminate-medium",
      }
    : {};

  // Performance-based background colors
  const performanceColors: Record<string, string> = {
    low: "bg-amber-500",
    medium: "bg-blue-500",
    high: "bg-green-500",
    default: "bg-primary",
  };

  return (
    <div className="w-full space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        {indeterminate ? (
          <div
            className={cn(
              "h-full rounded-full w-1/4",
              animationClass[animation],
              adaptive
                ? performanceColors[performance.overallPerformance]
                : performanceColors.default,
              className
            )}
          />
        ) : (<>

          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              adaptive
                ? performanceColors[performance.overallPerformance]
                : performanceColors.default,
              className
            )}
            style={{ width: `${clampedValue}%` }}
          />
        )}
      </div>

      <div
</> className="flex justify-between items-center text-xs">
        {loadingText && <div className="text-gray-600">{loadingText}</div>}

        {showPercentage && !indeterminate && (
          <div className="text-gray-600 ml-auto">{clampedValue}%</div>
        )}
      </div>

      {showPerformanceText && (message || estimatedTime) && (
        <div className="text-xs text-gray-500 max-w-xs">
          {message && <p>{message}</p>}
          {estimatedTime && <p className="mt-1">{estimatedTime}</p>}
        </div>
      )}
    </div>
  );
}
