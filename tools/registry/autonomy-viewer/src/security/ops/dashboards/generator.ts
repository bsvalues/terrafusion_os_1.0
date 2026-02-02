/**
 * TerraFusion Security Plane Dashboard Generator
 * ==============================================
 *
 * Phase IIIh: Dashboard artifacts derived from SLO catalog.
 *
 * Design Principles:
 * - Dashboards are generated from SLO definitions (single source of truth)
 * - All panel queries use only allowlisted metrics and labels
 * - Output is exportable JSON for Grafana/similar systems
 * - Cardinality-bounded (no arbitrary groupBy dimensions)
 */

import {
    ALLOWED_SLO_DIMENSIONS,
    SECURITY_SLO_CATALOG,
    type SloDefinition,
} from '../slo/catalog.js';

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Panel visualization type.
 */
export type PanelType = 'stat' | 'timeseries' | 'gauge' | 'table';

/**
 * Dashboard panel definition.
 */
export interface DashboardPanel {
  /** Panel ID */
  readonly id: string;
  /** Panel title */
  readonly title: string;
  /** Panel description */
  readonly description: string;
  /** Visualization type */
  readonly type: PanelType;
  /** Source SLO ID (if applicable) */
  readonly sloId?: string;
  /** Metrics used in this panel */
  readonly metrics: readonly string[];
  /** Labels used for grouping */
  readonly labels: readonly string[];
  /** Grid position */
  readonly gridPos: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  };
  /** Thresholds for visualization */
  readonly thresholds?: readonly {
    readonly value: number;
    readonly color: string;
  }[];
}

/**
 * Dashboard row (grouping panels).
 */
export interface DashboardRow {
  /** Row title */
  readonly title: string;
  /** Collapse state */
  readonly collapsed: boolean;
  /** Panels in this row */
  readonly panels: readonly DashboardPanel[];
}

/**
 * Dashboard definition.
 */
export interface Dashboard {
  /** Dashboard ID */
  readonly id: string;
  /** Dashboard title */
  readonly title: string;
  /** Dashboard description */
  readonly description: string;
  /** Schema version */
  readonly schemaVersion: string;
  /** Dashboard version */
  readonly version: string;
  /** Generated from SLO catalog version */
  readonly sourceSloVersion: string;
  /** Dashboard rows */
  readonly rows: readonly DashboardRow[];
  /** Generated timestamp */
  readonly generatedAt: string;
}

// ============================================================================
// Dashboard Generation
// ============================================================================

/**
 * Generate stats panel for SLO current value.
 */
function generateSloStatPanel(slo: SloDefinition, panelIndex: number): DashboardPanel {
  return {
    id: `slo_stat_${slo.id}`,
    title: slo.name,
    description: `Current ${slo.id} over ${slo.window.name} window`,
    type: 'stat',
    sloId: slo.id,
    metrics: [slo.numeratorMetric, slo.denominatorMetric].filter(Boolean) as string[],
    labels: [...slo.dimensions],
    gridPos: {
      x: (panelIndex % 4) * 6,
      y: Math.floor(panelIndex / 4) * 4,
      w: 6,
      h: 4,
    },
    thresholds: [
      { value: slo.target * 0.9, color: 'red' },
      { value: slo.target, color: 'yellow' },
      { value: 1.0, color: 'green' },
    ],
  };
}

/**
 * Generate gauge panel for SLO error budget.
 */
function generateBudgetGaugePanel(slo: SloDefinition, panelIndex: number): DashboardPanel {
  return {
    id: `budget_gauge_${slo.id}`,
    title: `${slo.name} - Error Budget`,
    description: `Remaining error budget for ${slo.id}`,
    type: 'gauge',
    sloId: slo.id,
    metrics: [slo.numeratorMetric, slo.denominatorMetric].filter(Boolean) as string[],
    labels: [...slo.dimensions],
    gridPos: {
      x: (panelIndex % 4) * 6,
      y: Math.floor(panelIndex / 4) * 4 + 8,
      w: 6,
      h: 4,
    },
    thresholds: [
      { value: 0, color: 'red' },
      { value: 0.25, color: 'yellow' },
      { value: 0.5, color: 'green' },
    ],
  };
}

/**
 * Generate timeseries panel for SLO trend.
 */
function generateSloTimeseriesPanel(slo: SloDefinition, panelIndex: number): DashboardPanel {
  return {
    id: `slo_trend_${slo.id}`,
    title: `${slo.name} - Trend`,
    description: `Historical trend of ${slo.id}`,
    type: 'timeseries',
    sloId: slo.id,
    metrics: [slo.numeratorMetric, slo.denominatorMetric].filter(Boolean) as string[],
    labels: [...slo.dimensions],
    gridPos: {
      x: 0,
      y: Math.floor(panelIndex / 2) * 8 + 16,
      w: 12,
      h: 8,
    },
    thresholds: [{ value: slo.target, color: 'green' }],
  };
}

/**
 * Generate alert status table panel.
 */
function generateAlertTablePanel(): DashboardPanel {
  return {
    id: 'alert_status_table',
    title: 'Active Alerts',
    description: 'Current firing security alerts',
    type: 'table',
    metrics: ['ALERTS'],
    labels: ['alertname', 'severity', 'slo_id'],
    gridPos: { x: 12, y: 0, w: 12, h: 8 },
  };
}

/**
 * Generate the security plane dashboard.
 */
export function generateSecurityDashboard(): Dashboard {
  const sloStatPanels: DashboardPanel[] = SECURITY_SLO_CATALOG.slos.map((slo, i) =>
    generateSloStatPanel(slo, i)
  );

  const budgetPanels: DashboardPanel[] = SECURITY_SLO_CATALOG.slos.map((slo, i) =>
    generateBudgetGaugePanel(slo, i)
  );

  const trendPanels: DashboardPanel[] = SECURITY_SLO_CATALOG.slos.map((slo, i) =>
    generateSloTimeseriesPanel(slo, i)
  );

  return {
    id: 'security-plane-slos',
    title: 'TerraFusion Security Plane SLOs',
    description: 'Service Level Objectives for the security authentication and authorization plane',
    schemaVersion: 'terrafusion.ops.dashboard.v1',
    version: '1.0.0',
    sourceSloVersion: SECURITY_SLO_CATALOG.version,
    rows: [
      {
        title: 'SLO Status Overview',
        collapsed: false,
        panels: [...sloStatPanels, generateAlertTablePanel()],
      },
      {
        title: 'Error Budgets',
        collapsed: false,
        panels: budgetPanels,
      },
      {
        title: 'Historical Trends',
        collapsed: true,
        panels: trendPanels,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Pre-generated Dashboard
// ============================================================================

/**
 * The canonical security plane dashboard.
 */
export const SECURITY_PLANE_DASHBOARD = generateSecurityDashboard();

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Get all metrics referenced in the dashboard.
 */
export function getDashboardMetrics(dashboard: Dashboard): Set<string> {
  const metrics = new Set<string>();
  for (const row of dashboard.rows) {
    for (const panel of row.panels) {
      for (const metric of panel.metrics) {
        metrics.add(metric);
      }
    }
  }
  return metrics;
}

/**
 * Get all labels referenced in the dashboard.
 */
export function getDashboardLabels(dashboard: Dashboard): Set<string> {
  const labels = new Set<string>();
  for (const row of dashboard.rows) {
    for (const panel of row.panels) {
      for (const label of panel.labels) {
        labels.add(label);
      }
    }
  }
  return labels;
}

/**
 * Get known metric names from SLO catalog.
 */
export function getKnownMetrics(): Set<string> {
  const metrics = new Set<string>();
  for (const slo of SECURITY_SLO_CATALOG.slos) {
    if (slo.numeratorMetric) metrics.add(slo.numeratorMetric);
    if (slo.denominatorMetric) metrics.add(slo.denominatorMetric);
  }
  // System metrics
  metrics.add('ALERTS');
  return metrics;
}

/**
 * Validate dashboard references only known metrics and labels.
 */
export function validateDashboardReferences(dashboard: Dashboard): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const dashboardLabels = getDashboardLabels(dashboard);
  const allowedLabels = new Set([...ALLOWED_SLO_DIMENSIONS, 'alertname', 'severity', 'slo_id']);

  for (const label of dashboardLabels) {
    if (!allowedLabels.has(label as never)) {
      errors.push(`Dashboard uses unknown label: ${label}`);
    }
  }

  const dashboardMetrics = getDashboardMetrics(dashboard);
  const knownMetrics = getKnownMetrics();

  for (const metric of dashboardMetrics) {
    if (!knownMetrics.has(metric)) {
      errors.push(`Dashboard uses unknown metric: ${metric}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate dashboard structure.
 */
export function validateDashboard(dashboard: Dashboard): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!dashboard.id) errors.push('Dashboard id is required');
  if (!dashboard.title) errors.push('Dashboard title is required');
  if (!dashboard.schemaVersion) errors.push('Schema version is required');
  if (!dashboard.rows || dashboard.rows.length === 0) {
    errors.push('At least one row is required');
  }

  const panelIds = new Set<string>();
  for (const row of dashboard.rows) {
    for (const panel of row.panels) {
      if (!panel.id) {
        errors.push('Panel id is required');
      } else if (panelIds.has(panel.id)) {
        errors.push(`Duplicate panel id: ${panel.id}`);
      } else {
        panelIds.add(panel.id);
      }
    }
  }

  const refValidation = validateDashboardReferences(dashboard);
  errors.push(...refValidation.errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export dashboard as JSON string.
 */
export function exportDashboardJson(dashboard: Dashboard): string {
  return JSON.stringify(dashboard, null, 2);
}
