/**
 * TerraFusion Security Plane Alert Rules
 * ========================================
 *
 * Phase IIIh: Alert rules derived from SLO catalog.
 *
 * Design Principles:
 * - All alerts are generated from SLO definitions (single source of truth)
 * - Anti-flap controls built in (burn-rate, rolling windows, suppression)
 * - Labels are cardinality-bounded (inherited from SLO dimensions)
 * - Alert rules are exportable for external alerting systems
 */

import {
    ALLOWED_SLO_DIMENSIONS,
    SECURITY_SLO_CATALOG,
    SLO_WINDOWS,
    type SloDefinition,
} from '../slo/catalog.js';

// ============================================================================
// Alert Rule Types
// ============================================================================

/**
 * Alert severity levels.
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Alert rule definition.
 */
export interface AlertRule {
  /** Unique alert ID (derived from SLO) */
  readonly id: string;
  /** Human-readable alert name */
  readonly name: string;
  /** Alert description for operators */
  readonly description: string;
  /** Severity level */
  readonly severity: AlertSeverity;
  /** Source SLO ID */
  readonly sloId: string;
  /** Alert type */
  readonly type: 'burn_rate' | 'spike' | 'threshold';
  /** Threshold for triggering */
  readonly threshold: number;
  /** Comparison direction */
  readonly comparison: 'above' | 'below';
  /** Evaluation window in seconds */
  readonly windowSeconds: number;
  /** Burn rate multiplier (for burn_rate type) */
  readonly burnRateMultiplier?: number;
  /** Labels for grouping (from SLO dimensions) */
  readonly labels: readonly string[];
  /** Suppression window in seconds (anti-flap) */
  readonly suppressionWindowSeconds: number;
  /** Runbook link (derived from SLO related codes) */
  readonly runbookCodes?: readonly string[];
}

/**
 * Alert rule catalog.
 */
export interface AlertRuleCatalog {
  /** Catalog version */
  readonly version: string;
  /** Schema version */
  readonly schemaVersion: string;
  /** All alert rules */
  readonly rules: readonly AlertRule[];
  /** Generated from SLO catalog version */
  readonly sourceSloVersion: string;
  /** Generated timestamp */
  readonly generatedAt: string;
}

// ============================================================================
// Alert Generation
// ============================================================================

/**
 * Generate burn-rate alert for a ratio SLO.
 * Uses multi-window burn rate for early detection + sustained burn.
 */
function generateBurnRateAlert(
  slo: SloDefinition,
  burnRate: number,
  severity: AlertSeverity,
  windowSeconds: number
): AlertRule {
  const suffix = severity === 'critical' ? 'fast' : 'slow';
  return {
    id: `${slo.id}.burn_rate.${suffix}`,
    name: `${slo.name} - Burn Rate (${suffix})`,
    description: `SLO ${slo.id} is burning error budget at ${burnRate}x rate over ${windowSeconds}s window`,
    severity,
    sloId: slo.id,
    type: 'burn_rate',
    threshold: slo.target * burnRate,
    comparison: slo.direction === 'above' ? 'below' : 'above',
    windowSeconds,
    burnRateMultiplier: burnRate,
    labels: [...slo.dimensions],
    suppressionWindowSeconds: Math.min(windowSeconds / 2, 300), // Half window or 5 min max
    runbookCodes: slo.relatedCodes,
  };
}

/**
 * Generate spike alert for sudden changes.
 */
function generateSpikeAlert(slo: SloDefinition): AlertRule {
  return {
    id: `${slo.id}.spike`,
    name: `${slo.name} - Spike Detection`,
    description: `Sudden spike in ${slo.numeratorMetric} detected`,
    severity: 'warning',
    sloId: slo.id,
    type: 'spike',
    threshold: slo.target * 5, // 5x normal rate
    comparison: slo.direction === 'above' ? 'below' : 'above',
    windowSeconds: SLO_WINDOWS.FAST.durationSeconds,
    labels: [...slo.dimensions],
    suppressionWindowSeconds: 60, // 1 minute suppression for spikes
    runbookCodes: slo.relatedCodes,
  };
}

/**
 * Generate alerts from a single SLO.
 */
function generateAlertsForSlo(slo: SloDefinition): AlertRule[] {
  const alerts: AlertRule[] = [];

  if (slo.type === 'ratio') {
    // Fast burn-rate (14.4x in 1h window) - Critical
    alerts.push(generateBurnRateAlert(slo, 14.4, 'critical', SLO_WINDOWS.SLOW.durationSeconds));

    // Slow burn-rate (6x in 6h window) - Warning
    alerts.push(generateBurnRateAlert(slo, 6, 'warning', 6 * 60 * 60));

    // Spike detection - Warning
    alerts.push(generateSpikeAlert(slo));
  } else if (slo.type === 'threshold') {
    // Simple threshold alert
    alerts.push({
      id: `${slo.id}.threshold`,
      name: `${slo.name} - Threshold Breach`,
      description: `${slo.numeratorMetric} ${slo.direction === 'above' ? 'below' : 'above'} ${slo.target}`,
      severity: 'critical',
      sloId: slo.id,
      type: 'threshold',
      threshold: slo.target,
      comparison: slo.direction ?? 'above',
      windowSeconds: slo.window.durationSeconds,
      labels: [...slo.dimensions],
      suppressionWindowSeconds: 300,
      runbookCodes: slo.relatedCodes,
    });
  }

  return alerts;
}

/**
 * Generate all alert rules from SLO catalog.
 */
export function generateAlertRules(): AlertRuleCatalog {
  const rules: AlertRule[] = [];

  for (const slo of SECURITY_SLO_CATALOG.slos) {
    rules.push(...generateAlertsForSlo(slo));
  }

  return {
    version: '1.0.0',
    schemaVersion: 'terrafusion.ops.alerts.v1',
    rules,
    sourceSloVersion: SECURITY_SLO_CATALOG.version,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Pre-generated Alert Catalog
// ============================================================================

/**
 * The canonical alert rule catalog.
 */
export const SECURITY_ALERT_CATALOG = generateAlertRules();

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that alert labels are from SLO dimension allowlist.
 */
export function validateAlertLabels(rule: AlertRule): boolean {
  for (const label of rule.labels) {
    if (!ALLOWED_SLO_DIMENSIONS.includes(label as never)) {
      return false;
    }
  }
  return true;
}

/**
 * Validate entire alert catalog.
 */
export function validateAlertCatalog(catalog: AlertRuleCatalog): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!catalog.version) {
    errors.push('Catalog version is required');
  }
  if (!catalog.schemaVersion) {
    errors.push('Schema version is required');
  }
  if (!catalog.rules || catalog.rules.length === 0) {
    errors.push('At least one alert rule is required');
  }

  const ids = new Set<string>();
  for (const rule of catalog.rules) {
    if (!rule.id) {
      errors.push('Alert rule id is required');
    } else if (ids.has(rule.id)) {
      errors.push(`Duplicate alert rule id: ${rule.id}`);
    } else {
      ids.add(rule.id);
    }

    if (!validateAlertLabels(rule)) {
      errors.push(`Alert ${rule.id} uses non-allowlisted labels`);
    }

    if (rule.suppressionWindowSeconds <= 0) {
      errors.push(`Alert ${rule.id} must have positive suppression window`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get alerts for a specific SLO.
 */
export function getAlertsForSlo(sloId: string): readonly AlertRule[] {
  return SECURITY_ALERT_CATALOG.rules.filter(rule => rule.sloId === sloId);
}

/**
 * Get alerts by severity.
 */
export function getAlertsBySeverity(severity: AlertSeverity): readonly AlertRule[] {
  return SECURITY_ALERT_CATALOG.rules.filter(rule => rule.severity === severity);
}

/**
 * Check if JWKS refresh fail spike alert exists.
 */
export function hasJwksRefreshFailSpikeAlert(): boolean {
  return SECURITY_ALERT_CATALOG.rules.some(
    rule => rule.sloId === 'security.jwks_refresh_failure' && rule.type === 'spike'
  );
}

/**
 * Check if denial rate burn rate alert exists.
 */
export function hasDenialRateBurnRateAlert(): boolean {
  return SECURITY_ALERT_CATALOG.rules.some(
    rule => rule.sloId === 'security.denial_rate' && rule.type === 'burn_rate'
  );
}
