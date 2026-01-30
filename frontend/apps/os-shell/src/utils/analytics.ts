// Analytics utility functions for Terrafusion OS
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  trackEvent(event: AnalyticsEvent): void {
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };
    this.events.push(eventWithTimestamp);
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Analytics Event:', eventWithTimestamp);
    }
  }

  trackPerformance(metrics: PerformanceMetrics): void {
    this.trackEvent({
      name: 'performance_metrics',
      properties: metrics,
    });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const analytics = AnalyticsService.getInstance();
export default analytics;
