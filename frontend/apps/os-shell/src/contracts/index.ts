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

export type {
  DossierDetailsOptions,
  DossierDetailsResponse,
  DossierLevyDetails,
  DossierLevyEntry,
  DossierNoteHeaderItem,
  DossierNoteHeaders,
  DossierPropertyDetails,
  DossierResourceLinks,
  DossierValuationCategory,
  DossierValuationSignals,
} from './dossierDetails';

export type {
  ShellModeTruth,
  ShellSurfaces,
  SurfaceVisibility,
  TerraFusionShellMode,
} from './shellMode';

export {
  INITIAL_SHELL_MODE,
  SHELL_MODE_TRUTHS,
  SHELL_MODES,
  SHELL_SURFACE_POLICY,
  VALID_TRANSITIONS,
  getSurfacePolicy,
  isSurfaceVisible,
  isValidTransition,
} from './shellMode';

export type {
  CompletionMetadata,
  CompletionReport,
  CompletionReportEntry,
  DriftViolation,
  ObjectClassification,
  PlacementRule,
  PlacementViolation,
  RenderMode,
  SuiteBoundaryViolation,
  TerraFusionLayer,
  TerraFusionObjectType,
  WorkbenchHostViolation,
} from './objectPlacement';

export {
  LAYERS,
  MODULE_OBJECT_TYPES,
  OBJECT_TYPES,
  PLACEMENT_POLICY,
  RENDER_MODES,
  detectDrift,
  generateCompletionReport,
  getAllowedRenderMode,
  getObjectClassification,
  isParcelScoped,
  isStandaloneAllowed,
  requiresWorkbenchHost,
  validateCompletion,
  validatePlacement,
  validateSuiteRendering,
  validateWorkbenchHost,
} from './objectPlacement';
