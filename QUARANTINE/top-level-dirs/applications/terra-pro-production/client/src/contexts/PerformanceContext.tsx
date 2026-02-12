import React, { createContext, useContext, useState, useEffect } from "react";
import { monitorPerformance, PerformanceMetrics } from "@/lib/performance-monitor";

// Performance level types
export type PerformanceLevel = "low" | "medium" | "high";

// Performance context interface
interface PerformanceContextValue {
  performance: PerformanceMetrics & {
    overallPerformance: PerformanceLevel;
    lastUpdated: Date;
  };
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

// Default performance values
const defaultPerformance: PerformanceMetrics & {
  overallPerformance: PerformanceLevel;
  lastUpdated: Date;
} = {
  networkLatency: 100,
  cpuLoad: 0.3,
  memoryUsage: 0.5,
  frameRate: 60,
  renderTime: 16,
  overallPerformance: "medium",
  lastUpdated: new Date(),
};

// Create context with default values
const PerformanceContext = createContext<PerformanceContextValue>({
  performance: defaultPerformance,
  isMonitoring: false,
  startMonitoring: () => {},
  stopMonitoring: () => {},
});

// Hook for using the performance context
export const usePerformance = () => useContext(PerformanceContext);

/**
 * Performance provider component that monitors system performance
 * and provides metrics to child components
 */
export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [performance, setPerformance] = useState<
    PerformanceMetrics & {
      overallPerformance: PerformanceLevel;
      lastUpdated: Date;
    }
  >(defaultPerformance);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Calculate overall performance based on metrics
  const calculateOverallPerformance = (metrics: PerformanceMetrics): PerformanceLevel => {
    const { networkLatency, cpuLoad, memoryUsage, frameRate } = metrics;

    // Count how many metrics indicate low performance
    let lowCount = 0;
    let highCount = 0;

    // Network latency: high > 300ms, low < 100ms
    if (networkLatency > 300) lowCount++;
    else if (networkLatency < 100) highCount++;

    // CPU load: high > 0.7, low < 0.3
    if (cpuLoad > 0.7) lowCount++;
    else if (cpuLoad < 0.3) highCount++;

    // Memory usage: high > 0.8, low < 0.4
    if (memoryUsage > 0.8) lowCount++;
    else if (memoryUsage < 0.4) highCount++;

    // Frame rate: high < 30, low > 55
    if (frameRate < 30) lowCount++;
    else if (frameRate > 55) highCount++;

    // Determine overall performance level
    if (lowCount >= 2) return "low";
    if (highCount >= 2) return "high";
    return "medium";
  };

  // Start performance monitoring
  const startMonitoring = () => {
    if (isMonitoring) return;

    setIsMonitoring(true);

    // Monitor performance every 2 seconds
    const id = setInterval(() => {
      const metrics = monitorPerformance();
      const overallPerformance = calculateOverallPerformance(metrics);

      setPerformance({
        ...metrics,
        overallPerformance,
        lastUpdated: new Date(),
      });
    }, 2000);

    setIntervalId(id);
  };

  // Stop performance monitoring
  const stopMonitoring = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    setIsMonitoring(false);
  };

  // Start monitoring on mount, stop on unmount
  useEffect(() => {
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, []);

  return (
    <PerformanceContext.Provider
      value={{
        performance,
        isMonitoring,
        startMonitoring,
        stopMonitoring,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};
