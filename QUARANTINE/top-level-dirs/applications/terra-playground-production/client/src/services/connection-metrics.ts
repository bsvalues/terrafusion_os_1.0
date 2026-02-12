/**
 * Connection Metrics Service
 *
 * This service tracks and records connection-related metrics and events
 * to help with monitoring, debugging and optimizing connection reliability.
 */

import { ConnectionStatus } from './agent-socketio-service';

export interface ConnectionEvent {
  timestamp: number;
  type:
    | 'status_change'
    | 'fallback_activated'
    | 'fallback_deactivated'
    | 'reconnect_attempt'
    | 'error';
  details: any;
}

export interface ConnectionMetrics {
  totalFallbackActivations: number;
  totalReconnectAttempts: number;
  totalErrors: number;
  lastStatusChange: number;
  lastError: any;
  connectionEvents: ConnectionEvent[];
  averageReconnectTime: number;
}

class ConnectionMetricsService {
  private metrics: ConnectionMetrics = {
    totalFallbackActivations: 0,
    totalReconnectAttempts: 0,
    totalErrors: 0,
    lastStatusChange: Date.now(),
    lastError: null,
    connectionEvents: [],
    averageReconnectTime: 0,
  };

  private reconnectStartTime: number = 0;
  private reconnectDurations: number[] = [];

  /**
   * Record a connection status change
   */
  public recordStatusChange(status: ConnectionStatus): void {
    const timestamp = Date.now();

    // Record event
    this.metrics.lastStatusChange = timestamp;
    this.addEvent('status_change', { status, timestamp });

    // If connected, calculate reconnect time if applicable
    if (status === ConnectionStatus.CONNECTED && this.reconnectStartTime > 0) {
      const duration = timestamp - this.reconnectStartTime;
      this.reconnectDurations.push(duration);
      this.calculateAverageReconnectTime();
      this.reconnectStartTime = 0;
    }
    // If disconnected or errored, start tracking reconnect time
    else if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERRORED) {
      this.reconnectStartTime = timestamp;
    }
  }

  /**
   * Record fallback activation
   */
  public recordFallbackActivated(details: any = {}): void {
    this.metrics.totalFallbackActivations++;
    this.addEvent('fallback_activated', details);
  }

  /**
   * Record fallback deactivation
   */
  public recordFallbackDeactivated(details: any = {}): void {
    this.addEvent('fallback_deactivated', details);
  }

  /**
   * Record reconnect attempt
   */
  public recordReconnectAttempt(attempt: number, details: any = {}): void {
    this.metrics.totalReconnectAttempts++;
    this.addEvent('reconnect_attempt', { attempt, ...details });
  }

  /**
   * Record connection error
   */
  public recordError(error: any): void {
    this.metrics.totalErrors++;
    this.metrics.lastError = error;
    this.addEvent('error', { error });
  }

  /**
   * Add an event to the events array (maintaining a limited history)
   */
  private addEvent(type: ConnectionEvent['type'], details: any): void {
    const event: ConnectionEvent = {
      timestamp: Date.now(),
      type,
      details,
    };

    // Maintain a maximum of 50 events
    this.metrics.connectionEvents.unshift(event);

    if (this.metrics.connectionEvents.length > 50) {
      this.metrics.connectionEvents.pop();
    }
  }

  /**
   * Calculate average reconnect time
   */
  private calculateAverageReconnectTime(): void {
    if (this.reconnectDurations.length === 0) {
      this.metrics.averageReconnectTime = 0;
      return;
    }

    const sum = this.reconnectDurations.reduce((acc, val) => acc + val, 0);
    this.metrics.averageReconnectTime = sum / this.reconnectDurations.length;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalFallbackActivations: 0,
      totalReconnectAttempts: 0,
      totalErrors: 0,
      lastStatusChange: Date.now(),
      lastError: null,
      connectionEvents: [],
      averageReconnectTime: 0,
    };
    this.reconnectDurations = [];
    this.reconnectStartTime = 0;
  }
}

// Export singleton instance
export const connectionMetricsService = new ConnectionMetricsService();
