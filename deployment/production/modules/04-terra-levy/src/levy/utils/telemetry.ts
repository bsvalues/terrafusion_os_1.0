import { ApplicationInsights } from '@microsoft/applicationinsights-web';

export type TelemetryEventProps = Record<string, any>;

/**
 * TerraFusion telemetry configuration
 * - In production: Set VITE_ENABLE_TELEMETRY=true and VITE_APP_INSIGHTS_KEY
 * - In tests/CI: Defaults to false for fast, isolated execution
 */
const TELEMETRY_ENABLED =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_ENABLE_TELEMETRY === 'true';

const APP_INSIGHTS_KEY =
  typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_APP_INSIGHTS_KEY
    : undefined;

let appInsights: ApplicationInsights | null = null;

/**
 * Initialize Application Insights for production telemetry.
 * Called once on app bootstrap when telemetry is enabled.
 */
export const initializeTelemetry = (): void => {
  if (!TELEMETRY_ENABLED || !APP_INSIGHTS_KEY) {
    return; // Skip initialization when disabled or no key provided
  }

  try {
    appInsights = new ApplicationInsights({
      config: {
        instrumentationKey: APP_INSIGHTS_KEY,
        enableAutoRouteTracking: true,
        disableFetchTracking: false,
        disableAjaxTracking: false,
        autoTrackPageVisitTime: true,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true,
      },
    });

    appInsights.loadAppInsights();
    appInsights.trackPageView(); // Initial page view

    console.log('[telemetry] Application Insights initialized');
  } catch (err) {
    console.warn('[telemetry] initialization failed:', err);
    appInsights = null;
  }
};

/**
 * Emit telemetry event with feature flag control.
 * @param name - Event name (e.g., 'levy_calculated', 'projections_generated')
 * @param props - Event properties/dimensions
 */
export const emitTelemetry = (name: string, props?: TelemetryEventProps) => {
  if (!TELEMETRY_ENABLED) {
    return; // No-op when disabled (tests, local dev without opt-in)
  }

  try {
    // Production: Emit to Application Insights
    if (appInsights) {
      appInsights.trackEvent({ name, properties: props });
    } else {
      // Fallback: console logging when App Insights not initialized
      console.log('[telemetry]', name, props ?? {});
    }
  } catch (err) {
    // Telemetry failures should never break user flows
    console.warn('[telemetry] emit failed:', err);
  }
};
