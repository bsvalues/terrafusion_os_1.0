export {
  LOCAL_AGENT_DECISIONS,
  LocalAgentPermissionPolicy,
  loadFounderLocalAgentPolicy,
  matchesGlob,
  type LocalAgentDecision,
  type LocalAgentPermissionDecision,
  type LocalAgentPolicyDocument,
  type LocalAgentToolRequest,
} from './policy.js';

export {
  LocalAgentToolRunner,
  type LocalAgentToolResult,
} from './toolRunner.js';

export {
  LocalAgentDoctorMode,
  renderLocalAgentDoctorResult,
  type LocalAgentDoctorModeOptions,
  type LocalAgentDoctorReport,
  type LocalAgentDoctorResult,
  type LocalAgentModelRuntimeStatus,
} from './doctorMode.js';

export {
  LocalAgentFirstRun,
  renderLocalAgentInitReport,
  type LocalAgentEnvCheck,
  type LocalAgentInitReport,
} from './firstRun.js';

export {
  LocalAgentStatus,
  renderLocalAgentStatus,
  type LocalAgentStatusCardSummary,
  type LocalAgentStatusEventSummary,
  type LocalAgentStatusProofSummary,
  type LocalAgentStatusSummary,
} from './status.js';

export {
  LocalAgentEvents,
  parseEventsArgs,
  renderLocalAgentEvents,
  type LocalAgentEventEntry,
  type LocalAgentEventsQuery,
  type LocalAgentEventsResult,
} from './events.js';

export {
  LocalAgentReleasePlan,
  renderLocalAgentReleasePlan,
  type LocalAgentReleasePlanReport,
  type LocalAgentReleaseStep,
} from './releasePlan.js';

export {
  LocalAgentDocTruth,
  renderLocalAgentDocTruth,
  DEFAULT_DOC_TRUTH_FILES,
  type LocalAgentDocTruthReport,
  type LocalAgentDocTruthViolation,
} from './docTruth.js';

export {
  aggregateChatStream,
  approximateTokenCount,
  type ModelAdapter,
  type ModelCapabilities,
  type ModelChatRequest,
  type ModelChunk,
  type ModelChunkKind,
  type ModelCompletion,
  type ModelMessage,
  type ModelRole,
  type ModelUsage,
} from './modelAdapter.js';

export { FakeModelAdapter } from './fakeAdapter.js';
export { AdapterRegistry } from './adapterRegistry.js';
export {
  OllamaAdapter,
  type OllamaAdapterOptions,
  type OllamaTransport,
  type OllamaTransportResponse,
} from './ollamaAdapter.js';

export {
  REMOTE_ENABLE_ENV,
  assertRemoteEnabled,
  iterateSseEvents,
  type RemoteTransport,
  type RemoteTransportResponse,
} from './remoteAdapter.js';

export { ClaudeAdapter, type ClaudeAdapterOptions } from './claudeAdapter.js';
export { OpenAIAdapter, type OpenAIAdapterOptions } from './openaiAdapter.js';

export {
  LocalAgentDaemon,
  defaultDaemonSocketPath,
  type LocalAgentDaemonOptions,
} from './daemon.js';
export { LocalAgentDaemonClient } from './daemonClient.js';
export {
  daemonStart,
  daemonStop,
  daemonStatus,
  defaultDaemonRecordPath,
  renderDaemonStartResult,
  renderDaemonStopResult,
  renderDaemonStatusResult,
  DAEMON_RECORD_VERSION,
  type DaemonControlPaths,
  type DaemonRecord,
  type DaemonStartResult,
  type DaemonStopResult,
  type DaemonStatusResult,
} from './daemonControl.js';
export {
  DAEMON_METHODS,
  DAEMON_ERROR_CODES,
  encodeFrame,
  createLineSplitter,
  type AdapterCancelParams,
  type AdapterCancelResult,
  type AdapterChatParams,
  type AdapterCompleteParams,
  type AdapterCompleteResult,
  type AdapterDescriptor,
  type AdapterListResult,
  type DaemonChunkFrame,
  type DaemonDoneFrame,
  type DaemonErrorCode,
  type DaemonErrorFrame,
  type DaemonFrame,
  type DaemonMethod,
  type DaemonRequest,
  type DaemonResultFrame,
  type DaemonShutdownResult,
} from './daemonProtocol.js';

export {
  LocalAgentExplainMode,
  renderLocalAgentExplainReport,
  type LocalAgentExplainArtifactSummary,
  type LocalAgentExplainFileSummary,
  type LocalAgentExplainModeOptions,
  type LocalAgentExplainModelAssistance,
  type LocalAgentExplainReport,
} from './explainMode.js';

export {
  LocalAgentReviewMode,
  renderLocalAgentReviewReport,
  type LocalAgentReviewArtifactSummary,
  type LocalAgentReviewEventHistory,
  type LocalAgentReviewGitSummary,
  type LocalAgentReviewModeOptions,
  type LocalAgentReviewModelAssistance,
  type LocalAgentReviewPatchSummary,
  type LocalAgentReviewReport,
  type LocalAgentReviewRiskSummary,
} from './reviewMode.js';

export {
  LocalAgentModelGateway,
  type LocalAgentModelChatMessage,
  type LocalAgentModelChatResult,
  type LocalAgentModelDescriptor,
  type LocalAgentModelGatewayOptions,
  type LocalAgentModelGatewayResult,
  type LocalAgentModelHealthResult,
  type LocalAgentModelListResult,
  type LocalAgentModelPlanContext,
  type LocalAgentModelPlanDraft,
} from './modelGateway.js';

export {
  LocalAgentWorkCardFactory,
  renderLocalAgentWorkCard,
  type LocalAgentWorkCard,
  type LocalAgentWorkProfile,
} from './workCard.js';

export {
  LocalAgentCardLockStore,
  type LockedLocalAgentCard,
} from './cardLock.js';

export {
  LocalAgentPatchPreview,
  type LocalAgentPatchProposal,
} from './patchPreview.js';

export {
  LocalAgentProofRunner,
  renderLocalAgentProofReport,
  type LocalAgentProofGateResult,
  type LocalAgentProofReport,
} from './proof.js';

export {
  LocalAgentFinalizeRunner,
  renderLocalAgentFinalReport,
  type LocalAgentFinalizeGitSnapshot,
  type LocalAgentFinalizeProofSnapshot,
  type LocalAgentFinalReport,
} from './finalize.js';

export {
  LocalAgentSaveStateWriter,
  renderLocalAgentSaveState,
  type LocalAgentCardSnapshot,
  type LocalAgentGitSnapshot,
  type LocalAgentProofSnapshot,
  type LocalAgentSaveStateReport,
} from './saveState.js';

export {
  LocalAgentFounderWizard,
  type FounderWizardIO,
} from './wizard.js';

export {
  LocalAgentCommandRegistryBuilder,
  listLocalAgentCommands,
  renderLocalAgentCommandRegistry,
  type LocalAgentCommandDefinition,
  type LocalAgentCommandRegistry,
} from './commandRegistry.js';

export {
  LocalAgentHelpSystem,
  renderLocalAgentNextRecommendation,
  type LocalAgentNextRecommendation,
} from './help.js';

export {
  LocalAgentControlCenterStateBuilder,
  renderLocalAgentControlCenterState,
  type LocalAgentControlCenterAction,
  type LocalAgentControlCenterArtifactState,
  type LocalAgentControlCenterDoctorState,
  type LocalAgentControlCenterModelState,
  type LocalAgentControlCenterPolicyState,
  type LocalAgentControlCenterState,
} from './controlCenter.js';

export {
  LocalAgentControlCenterPreview,
  renderLocalAgentControlCenterPreview,
  type LocalAgentControlCenterPreviewAction,
  type LocalAgentControlCenterPreviewState,
} from './controlCenterPreview.js';

export {
  LocalAgentReleaseNotesBuilder,
  renderLocalAgentReleaseNotes,
  type LocalAgentReleaseArtifact,
  type LocalAgentReleaseCommand,
  type LocalAgentReleaseNotes,
} from './releaseNotes.js';

export {
  LocalAgentDocsIndexBuilder,
  renderLocalAgentDocsIndex,
  type LocalAgentDocsEntry,
  type LocalAgentDocsIndex,
  type LocalAgentDocsReadingPath,
} from './docsIndex.js';

export {
  LocalAgentProductManifestBuilder,
  renderLocalAgentProductManifest,
  type LocalAgentProductManifest,
  type LocalAgentReleaseGovernanceSummary,
} from './productManifest.js';

export {
  LocalAgentReleaseCheckRunner,
  renderLocalAgentReleaseCheck,
  type LocalAgentReleaseCheckItem,
  type LocalAgentReleaseCheckReport,
} from './releaseCheck.js';

export {
  LocalAgentReleaseFreezeBuilder,
  LocalAgentReleaseFreezeError,
  renderLocalAgentReleaseFreezeCard,
  type LocalAgentReleaseFreezeCard,
} from './releaseFreeze.js';

export {
  LocalAgentShipMvpRunner,
  renderLocalAgentShipMvpReport,
  type LocalAgentShipMvpReport,
  type LocalAgentShipStep,
} from './shipMvp.js';

export {
  LocalAgentTagGateError,
  LocalAgentTagGateRunner,
  renderLocalAgentTagGate,
  type LocalAgentTagGateItem,
  type LocalAgentTagGateReport,
} from './tagGate.js';

export {
  LocalAgentReleaseApprovalError,
  LocalAgentReleaseApprovalRunner,
  renderLocalAgentReleaseApproval,
  type LocalAgentReleaseApproval,
} from './releaseApproval.js';

export {
  LocalAgentTagCommandError,
  LocalAgentTagCommandRunner,
  renderLocalAgentTagCommand,
  type LocalAgentTagCommandReport,
} from './tagCommand.js';

export {
  LocalAgentReleaseRunbookBuilder,
  LocalAgentReleaseRunbookError,
  renderLocalAgentReleaseRunbook,
  type LocalAgentReleaseRunbook,
  type LocalAgentRunbookArtifact,
} from './releaseRunbook.js';

export {
  AI_PROFILE_ENV,
  AI_PROFILES,
  DEFAULT_AI_PROFILE,
  DEFAULT_LOCAL_KB_PATH,
  DEFAULT_RUNBOOK_PATH,
  AiProfileError,
  isAiProfileName,
  resolveAiProfile,
  redactedAiProfileSummary,
  type AiProfileName,
  type AiProfileConfig,
} from './aiProfile.js';

export {
  LOCAL_PROVIDER_IDS,
  EXTERNAL_PROVIDER_IDS,
  createLocalOpsProvider,
  isLocalOpsProblem,
  isLocalOpsSuccess,
  type LocalOpsProvider,
  type LocalOpsProviderKind,
  type LocalOpsProviderStatus,
  type LocalOpsOutcomeStatus,
  type LocalOpsProblem,
  type LocalOpsSuccess,
  type LocalOpsResult,
  type LocalOpsRefusalCode,
  type CreateLocalOpsProviderOptions,
} from './localOpsProvider.js';

export {
  LOCALOPS_EVENT_TYPES,
  LOCALOPS_TRACE_SCHEMA_VERSION,
  LocalOpsTrace,
  createLocalOpsTrace,
  noopLocalOpsTraceSink,
  createJsonlLocalOpsTraceSink,
  createRecordingLocalOpsTraceSink,
  type LocalOpsEventType,
  type LocalOpsTraceEvent,
  type LocalOpsTraceSink,
  type RecordingLocalOpsTraceSink,
  type LocalOpsTraceOptions,
} from './localOpsTrace.js';

export {
  KB_ALLOWED_ROOT_PREFIXES,
  LocalOpsKb,
  createLocalOpsKb,
  type KbSourceRef,
  type KbRetrieveResult,
  type KbStatus,
  type CreateLocalOpsKbOptions,
} from './localOpsKb.js';