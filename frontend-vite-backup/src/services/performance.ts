/**
 * Performance monitoring service for frontend
 */

interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming | null;
  paint: PerformancePaintTiming[];
  memory: any;
  connection: any;
  resources: PerformanceResourceTiming[];
  timestamp: number;
}

interface PerformanceConfig {
  enableResourceTracking: boolean;
  enableUserTiming: boolean;
  enableLongTaskTracking: boolean;
  reportingInterval: number;
}

class FrontendPerformanceService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableResourceTracking: true,
      enableUserTiming: true,
      enableLongTaskTracking: true,
      reportingInterval: 30000, // 30 seconds
      ...config,
    };

    this.initialize();
  }

  private initialize() {
    // Performance observers for modern browsers
    if ('PerformanceObserver' in window) {
      this.setupPerformanceObservers();
    }

    // Start periodic reporting
    setInterval(() => {
      this.collectAndReportMetrics();
    }, this.config.reportingInterval);

    // Report on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.collectAndReportMetrics();
      }
    });

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.collectAndReportMetrics();
    });
  }

  private setupPerformanceObservers() {
    // Long task observer
    if (this.config.enableLongTaskTracking) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackLongTask(entry as any);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task tracking not supported');
      }
    }

    // Resource timing observer
    if (this.config.enableResourceTracking) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackResource(entry as PerformanceResourceTiming);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource timing tracking not supported');
      }
    }

    // Navigation timing observer
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackNavigation(entry as PerformanceNavigationTiming);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation timing tracking not supported');
    }

    // Paint timing observer
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPaint(entry as PerformancePaintTiming);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (e) {
      console.warn('Paint timing tracking not supported');
    }
  }

  private trackLongTask(entry: any) {
    console.warn(`Long task detected: ${entry.duration}ms at ${entry.startTime}`);

    // Report long tasks to analytics
    this.reportMetric('longtask', {
      duration: entry.duration,
      startTime: entry.startTime,
      url: window.location.href,
    });
  }

  private trackResource(entry: PerformanceResourceTiming) {
    // Track slow resources
    const loadTime = entry.responseEnd - entry.startTime;
    if (loadTime > 1000) {
      // Resources taking more than 1 second
      console.warn(`Slow resource: ${entry.name} took ${loadTime}ms`);

      this.reportMetric('slow-resource', {
        name: entry.name,
        duration: loadTime,
        type: entry.initiatorType,
        size: entry.transferSize || 0,
      });
    }
  }

  private trackNavigation(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.connectEnd - entry.secureConnectionStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
      onLoad: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - (entry.fetchStart || 0),
    };

    this.reportMetric('navigation', metrics);
  }

  private trackPaint(entry: PerformancePaintTiming) {
    this.reportMetric('paint', {
      name: entry.name,
      startTime: entry.startTime,
    });
  }

  public startTiming(name: string) {
    if (this.config.enableUserTiming && 'performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  public endTiming(name: string) {
    if (this.config.enableUserTiming && 'performance' in window) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        this.reportMetric('user-timing', {
          name,
          duration: measure.duration,
        });
      }
    }
  }

  public trackUserAction(action: string, data: any = {}) {
    this.reportMetric('user-action', {
      action,
      timestamp: Date.now(),
      url: window.location.href,
      ...data,
    });
  }

  public trackError(error: Error, context: string = '') {
    this.reportMetric('error', {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });
  }

  private collectAndReportMetrics() {
    const metrics: PerformanceMetrics = {
      navigation: this.getNavigationTiming(),
      paint: this.getPaintTiming(),
      memory: this.getMemoryInfo(),
      connection: this.getConnectionInfo(),
      resources: this.getResourceTiming(),
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);

    // Keep only last 100 metric snapshots
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    this.reportMetric('performance-snapshot', metrics);
  }

  private getNavigationTiming(): PerformanceNavigationTiming | null {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return entries.length > 0 ? entries[0] : null;
    }
    return null;
  }

  private getPaintTiming(): PerformancePaintTiming[] {
    if ('performance' in window && 'getEntriesByType' in performance) {
      return performance.getEntriesByType('paint') as PerformancePaintTiming[];
    }
    return [];
  }

  private getMemoryInfo(): any {
    // @ts-ignore - Chrome specific API
    return (performance as any).memory || null;
  }

  private getConnectionInfo(): any {
    // @ts-ignore - Network Information API
    return (
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection ||
      null
    );
  }

  private getResourceTiming(): PerformanceResourceTiming[] {
    if ('performance' in window && 'getEntriesByType' in performance) {
      return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    }
    return [];
  }

  private async reportMetric(type: string, data: any) {
    try {
      // Report to backend performance API
      await fetch('/api/performance/frontend-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // Fail silently for performance reporting
      console.debug('Failed to report performance metric:', error);
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public destroy() {
    // Clean up observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceService = new FrontendPerformanceService();

// Auto-track React component rendering (if using React)
export function withPerformanceTracking<T extends React.ComponentType<any>>(
  WrappedComponent: T,
  componentName?: string
): T {
  const name =
    componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const PerformanceTrackedComponent = (props: any) => {
    React.useEffect(() => {
      performanceService.startTiming(`${name}-render`);
      return () => {
        performanceService.endTiming(`${name}-render`);
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${name})`;

  return PerformanceTrackedComponent as T;
}

// Hook for performance tracking in functional components
export function usePerformanceTracking(name: string) {
  React.useEffect(() => {
    performanceService.startTiming(name);
    return () => {
      performanceService.endTiming(name);
    };
  }, [name]);

  return {
    trackAction: (action: string, data?: any) => performanceService.trackUserAction(action, data),
    trackError: (error: Error, context?: string) => performanceService.trackError(error, context),
  };
}
