import React, { useState, useEffect } from "react";
import { usePerformance } from "@/contexts/PerformanceContext";
import { AdaptiveSpinner } from "@/components/ui/adaptive-spinner";
import { AdaptiveProgress } from "@/components/ui/adaptive-progress";

/**
 * Development component for testing and debugging performance-adaptive UI components
 * Use this component to visualize how UI components respond to different performance levels
 */
export function PerformanceDebugger() {
  const { performance } = usePerformance();
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [isIncrementing, setIsIncrementing] = useState(false);

  // Increase progress by 1% every 100ms when simulating progress
  useEffect(() => {
    if (!isIncrementing) return;

    const timer = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 100) {
          setIsIncrementing(false);
          return 100;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isIncrementing]);

  // Start progress simulation
  const startProgress = () => {
    setSimulatedProgress(0);
    setIsIncrementing(true);
  };

  // Reset progress simulation
  const resetProgress = () => {
    setSimulatedProgress(0);
    setIsIncrementing(false);
  };

  // Get human-readable performance level from value
  const formatPerformanceValue = (value: number): string => {
    if (value < 0.3) return "Excellent";
    if (value < 0.6) return "Good";
    if (value < 0.8) return "Fair";
    return "Poor";
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 shadow-sm">
      <div className="flex justify-between items-center mb-4"><>

        <h2 className="text-lg font-semibold">Performance Monitor Debug Panel</h2>
        <div
</> className="text-xs text-gray-500">
          Last Updated: {performance.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance metrics section */}
        <div className="space-y-2"><>

          <h3 className="text-sm font-medium">Current Performance Metrics</h3>

          <div
</> className="text-xs space-y-1">
            <div className="flex justify-between"><>

              <span>Network Latency:</span>
              <span
</>>{Math.round(performance.networkLatency)}ms</span>
            </div>

            <div className="flex justify-between"><>

              <span>CPU Load:</span>
              <span
</>>
                {(performance.cpuLoad * 100).toFixed(0)}% (
                {formatPerformanceValue(performance.cpuLoad)})
              </span>
            </div>

            <div className="flex justify-between"><>

              <span>Memory Usage:</span>
              <span
</>>
                {(performance.memoryUsage * 100).toFixed(0)}% (
                {formatPerformanceValue(performance.memoryUsage)})
              </span>
            </div>

            <div className="flex justify-between"><>

              <span>Frame Rate:</span>
              <span
</>>{Math.round(performance.frameRate)} FPS</span>
            </div>

            <div className="flex justify-between"><>

              <span>Render Time:</span>
              <span
</>>{Math.round(performance.renderTime)}ms</span>
            </div>

            <div className="flex justify-between font-semibold"><>

              <span>Overall Performance:</span>
              <span
</>
                className={
                  performance.overallPerformance === "low"
                    ? "text-red-500"
                    : performance.overallPerformance === "medium"
                      ? "text-amber-500"
                      : "text-green-500"
                }
              >
                {performance.overallPerformance === "high"
                  ? "High"
                  : performance.overallPerformance === "medium"
                    ? "Medium"
                    : "Low"}
              </span>
            </div>
          </div>
        </div>

        {/* Component preview section */}
        <div className="space-y-3"><>

          <h3 className="text-sm font-medium">Adaptive Component Preview</h3>

          <div
</> className="p-3 border rounded-md bg-white dark:bg-gray-800">
            <div className="mb-2">
              <span className="text-xs text-gray-500">AdaptiveSpinner with performance text:</span>
            </div><>

            <AdaptiveSpinner size="md" loadingText="Loading data..." showPerformanceText={true} />
          </div>

          <div
</> className="p-3 border rounded-md bg-white dark:bg-gray-800">
            <div className="mb-2">
              <span className="text-xs text-gray-500">AdaptiveProgress (determinate):</span>
            </div>
            <AdaptiveProgress
              value={simulatedProgress}
              showPercentage={true}
              loadingText="Processing request"
              showPerformanceText={true}
            />

            <div className="flex gap-2 mt-2"><>

              <button
                onClick={startProgress}
                disabled={isIncrementing}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Simulate Progress
              </button>
              <button
</>
                onClick={resetProgress}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="p-3 border rounded-md bg-white dark:bg-gray-800">
            <div className="mb-2">
              <span className="text-xs text-gray-500">AdaptiveProgress (indeterminate):</span>
            </div>
            <AdaptiveProgress
              indeterminate={true}
              loadingText="Loading..."
              showPerformanceText={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
