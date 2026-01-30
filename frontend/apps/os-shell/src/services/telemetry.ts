/**
 * TerraFusion OS Telemetry Service
 *
 * Thin wrapper around analytics for module-specific telemetry.
 * Provides a clean API for tracking module lifecycle events.
 *
 * @module services/telemetry
 * @see Phase 3: Module Activation Orchestrator
 */

import { analytics } from '../utils/analytics';

// ============================================================================
// Types
// ============================================================================

export type ModuleTelemetryEvent =
  | 'module.activate'       // User initiated activation
  | 'module.focus'          // Focused existing window
  | 'module.reject'         // Activation rejected (e.g., not registered)
  | 'module.load.start'     // Load started
  | 'module.load.success'   // Load completed
  | 'module.load.error'     // Load failed
  | 'module.render.start'   // Render started
  | 'module.render.success' // Render completed
  | 'module.render.error';  // Render failed

export interface TelemetryProperties {
  moduleId: string;
  source?: string;
  reason?: string;
  durationMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// ============================================================================
// Telemetry Service
// ============================================================================

class TelemetryService {
  /**
   * Track a module lifecycle event.
   *
   * @param event - The telemetry event name
   * @param properties - Event properties
   */
  trackEvent(event: ModuleTelemetryEvent | string, properties: TelemetryProperties): void {
    analytics.trackEvent({
      name: event,
      properties: {
        ...properties,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Track module activation intent.
   */
  trackActivate(moduleId: string, source: string, metadata?: Record<string, unknown>): void {
    this.trackEvent('module.activate', { moduleId, source, metadata });
  }

  /**
   * Track module focus (existing window).
   */
  trackFocus(moduleId: string, source: string, windowId?: string): void {
    this.trackEvent('module.focus', { moduleId, source, windowId });
  }

  /**
   * Track module rejection.
   */
  trackReject(moduleId: string, source: string, reason: string): void {
    this.trackEvent('module.reject', { moduleId, source, reason });
  }

  /**
   * Track load start.
   */
  trackLoadStart(moduleId: string): void {
    this.trackEvent('module.load.start', { moduleId });
  }

  /**
   * Track load success.
   */
  trackLoadSuccess(moduleId: string, durationMs: number): void {
    this.trackEvent('module.load.success', { moduleId, durationMs });
  }

  /**
   * Track load error.
   */
  trackLoadError(moduleId: string, errorMessage: string): void {
    this.trackEvent('module.load.error', { moduleId, errorMessage });
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

export default telemetry;
