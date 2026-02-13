/**
 * TerraFusion SDUI Module
 *
 * Server-Driven UI system for dynamic government interface rendering.
 * Enables county-specific UI customization without frontend redeployment.
 */

// Renderer exports
export { SDUIRenderer } from './renderer';
export type {
  SDUILayout,
  SDUISection,
  SDUIComponent,
  SDUIAction,
} from './renderer';

// Component exports
export {
  KPICard,
  AlertBanner,
  ComplianceBadge,
  PropertyTable,
  CountySelector,
  MetricsGrid,
  AuditTimeline,
  MapPlaceholder,
  SDUI_COMPONENTS,
  getSDUIComponent,
} from './components';

export type { SDUIComponentProps } from './components';
