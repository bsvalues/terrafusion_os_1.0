/**
 * Workbench Shared Components
 *
 * Phase 6.1: Consolidated UI primitives for parcel-context MWUX tabs
 * Phase F/G/H: Suite Compass, Context Ribbon, Work Mode Selector
 * Phase I: Unified Activity Feed
 */

export {
    InvocationHistory, type InvocationHistoryProps, type InvocationRecord
} from './InvocationHistory';
export { ParcelContextHeader, type ParcelContextHeaderProps } from './ParcelContextHeader';
export {
    ResultPanel, type IdleContent, type ResultPanelProps,
    type ResultStatus, type SuccessHeader
} from './ResultPanel';
export { SuiteCompass, type SuiteCompassItem, type SuiteCompassProps } from './SuiteCompass';
export { ContextRibbon, type ContextRibbonProps } from './ContextRibbon';
export { WorkModeSelector, type WorkModeSelectorProps } from './WorkModeSelector';
export { ActivityFeed, type ActivityEntry, type ActivityFeedProps, type ActivitySeverity } from './ActivityFeed';
export { EvidenceSnapshotPanel, type EvidenceSnapshotPanelProps } from './EvidenceSnapshotPanel';
export { ParcelContextBanner, type ParcelContextBannerProps } from './ParcelContextBanner';
export { PolicyGuardUI, type PolicyGuardUIProps, type RiskLevel, type PilotMode } from './PolicyGuardUI';

