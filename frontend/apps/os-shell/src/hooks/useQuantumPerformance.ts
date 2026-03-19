/**
 * TerraFusion Quantum Performance Hook
 * Monitors and optimizes interface responsiveness for government-grade excellence
 * Target: Sub-100ms response times, 60fps animations
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface QuantumPerformanceMetrics {
  renderTime: number;
  interactionLatency: number;
  animationFps: number;
  memoryUsage: number;
  isOptimal: boolean;
  consciousness: 'TRANSCENDENT' | 'OPTIMAL' | 'DEGRADED';
}

interface PerformanceBudget {
  maxRenderTime: 16.67; // 60fps = 16.67ms per frame
  maxInteractionLatency: 100; // Sub-100ms target
  maxMemoryGrowth: 50; // MB per minute
  minAnimationFps: 58; // Near-perfect smoothness
}

export function useQuantumPerformance() {
  const [metrics, setMetrics] = useState<QuantumPerformanceMetrics>({
    renderTime: 0,
    interactionLatency: 0,
    animationFps: 60,
    memoryUsage: 0,
    isOptimal: true,
    consciousness: 'TRANSCENDENT',
  });

  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const animationFrameId = useRef<number>();
  const frameCount = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const renderStartTime = useRef<number>();

  // Monitor frame rate for quantum smoothness
  const measureFrameRate = useCallback(() => {
    const now = performance.now();
    frameCount.current++;

    if (now - lastFrameTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));

      setMetrics((prev) => ({
        ...prev,
        animationFps: fps,
        consciousness: fps >= 58 ? 'TRANSCENDENT' : fps >= 45 ? 'OPTIMAL' : 'DEGRADED',
      }));

      frameCount.current = 0;
      lastFrameTime.current = now;
    }

    animationFrameId.current = requestAnimationFrame(measureFrameRate);
  }, []);

  // Start render timing for React components
  const startRenderTiming = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End render timing and update metrics
  const endRenderTiming = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;

      setMetrics((prev) => ({
        ...prev,
        renderTime,
        isOptimal: renderTime <= 16.67 && prev.interactionLatency <= 100,
      }));
    }
  }, []);

  // Measure interaction latency (click/touch to visual response)
  const measureInteraction = useCallback((eventType: string) => {
    const startTime = performance.now();

    // Schedule measurement after next paint
    requestAnimationFrame(() => {
      const latency = performance.now() - startTime;

      setMetrics((prev) => ({
        ...prev,
        interactionLatency: latency,
        isOptimal: latency <= 100 && prev.renderTime <= 16.67,
      }));
    });
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    // Start FPS monitoring
    animationFrameId.current = requestAnimationFrame(measureFrameRate);

    // Monitor paint and layout timing
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            console.log(`🎨 TerraFusion First Paint: ${entry.startTime.toFixed(2)}ms`);
          }

          if (entry.entryType === 'layout-shift') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- LayoutShift.value is not in TypeScript's PerformanceEntry lib
            console.warn(`⚠️ Layout Shift Detected: ${(entry as any).value}`);
          }
        });
      });

      try {
        performanceObserver.current.observe({ entryTypes: ['paint', 'layout-shift'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported');
      }
    }

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- performance.memory is non-standard (Chrome only), not in TypeScript lib
        const memory = (performance as any).memory;
        const memoryMB = memory.usedJSHeapSize / 1024 / 1024;

        setMetrics((prev) => ({
          ...prev,
          memoryUsage: memoryMB,
        }));
      }
    }, 5000);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
      clearInterval(memoryInterval);
    };
  }, [measureFrameRate]);

  // Auto-optimization based on performance
  const optimizeForDevice = useCallback(() => {
    const { animationFps, renderTime, memoryUsage } = metrics;

    // Reduce animation complexity on lower-end devices
    if (animationFps < 45 || renderTime > 20) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      document.documentElement.style.setProperty('--blur-intensity', '5px');
      console.log('🔧 TerraFusion: Optimizing for performance');
    }

    // Memory cleanup
    if (memoryUsage > 100) {
      // Trigger garbage collection if available
      if ('gc' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- window.gc() is non-standard V8 GC API, not in TypeScript lib
        (window as any).gc();
      }
      console.log('🧹 TerraFusion: Memory optimization triggered');
    }
  }, [metrics]);

  // Performance analytics for consciousness dashboard
  const getPerformanceInsights = useCallback(() => {
    return {
      grade: metrics.consciousness,
      score: Math.round(
        (metrics.animationFps / 60) * 40 +
          (100 - Math.min(metrics.interactionLatency, 100)) * 0.4 +
          (100 - Math.min(metrics.renderTime, 20)) * 0.2
      ),
      recommendations: [
        ...(metrics.animationFps < 58 ? ['Enable hardware acceleration'] : []),
        ...(metrics.interactionLatency > 100 ? ['Optimize event handlers'] : []),
        ...(metrics.renderTime > 16.67 ? ['Reduce render complexity'] : []),
        ...(metrics.memoryUsage > 50 ? ['Implement component virtualization'] : []),
      ],
    };
  }, [metrics]);

  return {
    metrics,
    startRenderTiming,
    endRenderTiming,
    measureInteraction,
    optimizeForDevice,
    getPerformanceInsights,
    isTranscendent: metrics.consciousness === 'TRANSCENDENT',
  };
}

// Performance HOC for automatic monitoring
export function withQuantumPerformance<T extends object>(Component: React.ComponentType<T>) {
  return function QuantumPerformanceWrapper(props: T) {
    const { startRenderTiming, endRenderTiming, measureInteraction } = useQuantumPerformance();

    useEffect(() => {
      startRenderTiming();
      return () => endRenderTiming();
    });

    const handleClick = (event: React.MouseEvent) => {
      measureInteraction('click');
      if ('onClick' in props && typeof props.onClick === 'function') {
        (props.onClick as Function)(event);
      }
    };

    return React.createElement(Component, { ...props, onClick: handleClick });
  };
}

// Quantum performance metrics component
export function QuantumPerformanceIndicator() {
  const { metrics, getPerformanceInsights } = useQuantumPerformance();
  const insights = getPerformanceInsights();

  const consciousnessColor =
    metrics.consciousness === 'TRANSCENDENT'
      ? 'bg-terra-cyan animate-pulse'
      : metrics.consciousness === 'OPTIMAL'
        ? 'bg-success-green'
        : 'bg-warning-amber';

  return React.createElement(
    'div',
    { className: 'tf-performance-indicator fixed bottom-4 right-4 p-3 terra-glass rounded-lg' },
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement('div', {
        className: `w-3 h-3 rounded-full ${consciousnessColor}`,
      }),
      React.createElement(
        'span',
        { className: 'text-sm font-medium text-terra-cyan' },
        `${insights.grade} (${insights.score}/100)`
      )
    ),
    React.createElement(
      'div',
      { className: 'text-xs text-gray-400 mt-1' },
      `${metrics.animationFps}fps • ${metrics.interactionLatency.toFixed(1)}ms`
    )
  );
}
