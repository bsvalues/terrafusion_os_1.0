/**
 * TerraFusion OS — Contract Interfaces (Barrel Export)
 * ═══════════════════════════════════════════════════════════════
 *
 * All canonical contract interfaces exported from a single entry point.
 *
 * @see 06_CONTRACTS_TYPESCRIPT_INTERFACES_v1.md
 */

export type {
  Badge,
  BadgeOwner,
  BadgeProvider,
  DataClassification,
  QuickActionDefinition,
  TabDefinition,
  TabOwner,
  WorkbenchContext,
  WorkbenchContribution,
  WorkbenchTabSlug,
  WorkMode,
} from './workbench';

export type {
  PilotMode,
  RiskPolicy,
  ToolDescriptor,
  ToolExecutionContext,
  ToolResult,
  ToolRisk,
  ToolSuiteOwner,
} from './pilot';

export type {
  TraceActor,
  TraceClassification,
  TraceEvent,
  TraceEventType,
  TraceSuite,
} from './trace';
