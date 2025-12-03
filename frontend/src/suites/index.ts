/**
 * TerraFusion Suite Registry
 *
 * Central manifest for all government suites.
 * This is the single source of truth for:
 * - What suites exist
 * - What components they contain
 * - What permissions they require
 * - How they integrate with TF-Substrate
 */

import { SuiteManifest } from './types';

export const SUITES: SuiteManifest[] = [
  {
    id: 'assessment',
    label: 'Appraisal / Valuation',
    icon: '📊',
    category: 'core',
    description: 'Mass appraisal, CostForge AI, property workbench, sales review.',
    level: 'Core',
    hotSwappable: true,
    webApps: ['terra-assessor-production', 'costforge-ai'],
    nativeModules: ['assessment-desktop-panel'],
    engines: ['valuation-engine', 'gis-engine'],
    apis: ['assessment-api'],
    aiAgents: ['assessment-assistant'],
    permissions: ['ROLE_APPRAISER'],
    accentColor: '#00D9FF', // terra-cyan
    routePrefix: '/suite/assessment',
  },
  {
    id: 'levy',
    label: 'Levy & Tax',
    icon: '💰',
    category: 'core',
    description: 'Levy setup, tax rates, budget checks, DOR reporting.',
    level: 'Core',
    hotSwappable: true,
    webApps: ['terra-levy-production'],
    nativeModules: ['levy-desktop-panel'],
    engines: ['levy-engine', 'sync-engine'],
    apis: ['levy-api'],
    aiAgents: ['levy-clerk-assistant'],
    permissions: ['ROLE_LEVY_CLERK'],
    accentColor: '#FFA500', // amber
    routePrefix: '/suite/levy',
  },
  {
    id: 'gis',
    label: 'GIS / Mapping',
    icon: '🗺️',
    category: 'core',
    description: 'Parcels, tax districts, levy boundaries, spatial layers.',
    level: 'Core',
    hotSwappable: true,
    webApps: ['bcbs-gis-pro-production'],
    nativeModules: ['gispro-panel'],
    engines: ['gis-engine'],
    apis: ['gis-api'],
    aiAgents: ['gis-assistant'],
    permissions: ['ROLE_GIS_TECH'],
    accentColor: '#10B981', // green
    routePrefix: '/suite/gis',
  },
  {
    id: 'collections',
    label: 'Collections / Treasury',
    icon: '💼',
    category: 'core',
    description: 'Tax collection, payment processing, delinquency tracking.',
    level: 'Core',
    hotSwappable: true,
    webApps: ['terra-collections-production'],
    nativeModules: ['collections-desktop-panel'],
    engines: ['collections-engine', 'payment-engine'],
    apis: ['collections-api'],
    aiAgents: ['collections-assistant'],
    permissions: ['ROLE_TREASURER'],
    accentColor: '#0EA5E9', // teal
    routePrefix: '/suite/collections',
  },
  {
    id: 'insights',
    label: 'Insights / Analytics',
    icon: '📈',
    category: 'premium',
    description: 'Trends, dashboards, time series, outlier detection.',
    level: 'Premium',
    hotSwappable: true,
    webApps: ['terra-dashboard-production', 'terra-insight'],
    nativeModules: [],
    engines: ['analysis-engine'],
    apis: ['insights-api'],
    aiAgents: ['analytics-assistant'],
    permissions: ['ROLE_ANALYST'],
    accentColor: '#8B5CF6', // purple
    routePrefix: '/suite/insights',
  },
  {
    id: 'agent',
    label: 'Agent / Automation',
    icon: '🤖',
    category: 'premium',
    description: 'County copilots, task automation, multi-agent workflows.',
    level: 'Premium',
    hotSwappable: true,
    webApps: ['terra-agent-production'],
    nativeModules: [],
    engines: ['ai-engine'],
    apis: ['agent-api'],
    aiAgents: ['county-copilot'],
    permissions: ['ROLE_POWER_USER'],
    accentColor: '#EC4899', // pink
    routePrefix: '/suite/agent',
  },
  {
    id: 'sync',
    label: 'Sync / Integration',
    icon: '🔄',
    category: 'core',
    description: 'Harris PACS, Tyler, Aumentum sync coordination.',
    level: 'Core',
    hotSwappable: true,
    webApps: ['terra-sync-production'],
    nativeModules: [],
    engines: ['sync-engine', 'integration-engine'],
    apis: ['sync-api'],
    aiAgents: ['sync-monitor-agent'],
    permissions: ['ROLE_SYSADMIN'],
    accentColor: '#06B6D4', // cyan
    routePrefix: '/suite/sync',
  },
  {
    id: 'flow',
    label: 'Flow / Workflow',
    icon: '⚡',
    category: 'premium',
    description: 'Process automation, workflow orchestration, task tracking.',
    level: 'Premium',
    hotSwappable: true,
    webApps: ['terra-flow-production'],
    nativeModules: [],
    engines: ['workflow-engine'],
    apis: ['flow-api'],
    aiAgents: ['workflow-assistant'],
    permissions: ['ROLE_POWER_USER'],
    accentColor: '#F59E0B', // yellow
    routePrefix: '/suite/flow',
  },
  {
    id: 'admin',
    label: 'Admin / Platform',
    icon: '⚙️',
    category: 'admin',
    description: 'Roles, permissions, tenants, modules, environments.',
    level: 'Admin',
    hotSwappable: false,
    webApps: ['terra-admin-console'],
    nativeModules: [],
    engines: [],
    apis: ['admin-api'],
    aiAgents: [],
    permissions: ['ROLE_SYSADMIN'],
    accentColor: '#6B7280', // gray
    routePrefix: '/suite/admin',
  },
];

/**
 * Helper to get suite by ID
 */
export function getSuiteById(id: string): SuiteManifest | undefined {
  return SUITES.find((s) => s.id === id);
}

/**
 * Helper to get suites by category
 */
export function getSuitesByCategory(category: SuiteManifest['category']): SuiteManifest[] {
  return SUITES.filter((s) => s.category === category);
}

/**
 * Helper to check if user has permission for suite
 */
export function hasPermissionForSuite(suite: SuiteManifest, userPermissions: string[]): boolean {
  return suite.permissions.some((p) => userPermissions.includes(p));
}
