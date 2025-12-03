/**
 * TerraFusion Native Shell - Entry Point Export
 * Main exports for the Native Shell system
 */

export { AIDrawer } from './AIDrawer';
export { CognitiveScaffold, ProgressiveDisclosure } from './CognitiveScaffold';
export { DualModeProvider, useDualMode } from './DualModeContext';
export { ModeToggle } from './ModeToggle';
export { NativeShell, NativeShell as default } from './NativeShell';
export { SuiteLauncher } from './SuiteLauncher';
export { suiteLifecycle } from './SuiteLifecycle';
export { suiteRegistry } from './SuiteRegistry';
export { SuiteTile } from './SuiteTile';
export { InsightPanel, SuperpowerCard } from './SuperpowerCard';

// Suite Examples
export { AssessmentSuite } from './suites/AssessmentSuite';

export type {
  AIAgent,
  AIDrawerState,
  AIMessage,
  RouteParams,
  SuiteActivationResult,
  SuiteManifest,
  SuiteState,
  SuiteStatus,
  UserMode,
} from './types';
