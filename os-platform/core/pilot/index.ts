/**
 * TerraFusion OS - Pilot Module Exports
 *
 * Re-exports all pilot module components for clean imports.
 */

export {
    ManifestValidationError,
    ToolRegistry,
    VALID_PII_HANDLING,
    VALID_RISKS,
    VALID_SUITES,
    VALID_TRACE_POLICIES,
    toolRegistry
} from './ToolRegistry.js';

export {
    createPreflight,
} from './ToolRunner.preflight.js';

export {
    ErrorCodes,
    ToolRunnerError,
    ToolRunner,
    toolRunner,
    type ErrorCode,
    type RunnerErrorCode,
    type ToolHandler,
    type ToolRunnerOptions
} from './ToolRunner.js';

export {
    // Phase 8.4 exports
    addDossierNoteHandler,
    compareAssessedValueHandler, draftAppealResponseHandler, draftBoeAppealResponseHandler,
    draftValueChangeNoticeHandler,
    explainModelInputsHandler, explainModelResultsHandler, explainSeniorExemptionHandler, phase83Handlers, phase84Handlers,
    registerAllHandlers, registerPhase83Handlers, registerPhase84Handlers,
    registerWriteGateHandlers,
    assembleBoePacketHandler,
    requestTraceRedactionHandler,
    writeGateHandlers,
    searchTraceByCorrelationHandler, summarizeDossierHandler, summarizeLevyRateHandler,
    summarizeParcelCasefileHandler,
    summarizeSalesCompsHandler,
    type AddDossierNoteParams,
    type AddDossierNoteResult,
    type CompareAssessedValueParams,
    type CompareAssessedValueResult, type DraftAppealResponseParams,
    type DraftAppealResponseResult, type DraftBoeAppealResponseParams,
    type DraftBoeAppealResponseResult,
    type DraftValueChangeNoticeParams,
    type DraftValueChangeNoticeResult,
    type ExplainModelInputsParams,
    type ExplainModelInputsResult, type ExplainModelResultsParams,
    type ExplainModelResultsResult, type ExplainSeniorExemptionParams,
    type ExplainSeniorExemptionResult,
    type SearchTraceByCorrelationParams,
    type SearchTraceByCorrelationResult, type SummarizeDossierParams,
    type SummarizeDossierResult, type SummarizeLevyRateParams,
    type SummarizeLevyRateResult,
    type SummarizeParcelCasefileParams,
    type SummarizeParcelCasefileResult,
    type SummarizeSalesCompsParams,
    type SummarizeSalesCompsResult,
    type AssembleBoePacketParams,
    type AssembleBoePacketResult,
    type RequestTraceRedactionParams,
    type RequestTraceRedactionResult
} from './handlers.js';

// R1 Real Handlers (override canned stubs when backend is available)
export {
    registerR1Handlers,
    runValuationModelHandler,
    explainValueChangeHandler,
    routeToParcelHandler,
    createSearchTraceHandler,
    summarizeLevyRateRealHandler,
    explainModelInputsRealHandler,
    compareAssessedValueHistoryRealHandler,
    summarizeParcelCasefileRealHandler,
    addDossierNoteRealHandler,
    queryParcelLayersRealHandler,
    type RunValuationModelParams,
    type RunValuationModelResult,
    type ExplainValueChangeParams,
    type ExplainValueChangeResult,
    type RouteToParcelParams,
    type RouteToParcelResult,
    type ExplainModelInputsParams as ExplainModelInputsRealParams,
    type ExplainModelInputsResult as ExplainModelInputsRealResult,
    type CompareAssessedValueHistoryParams,
    type CompareAssessedValueHistoryResult,
    type SummarizeParcelCasefileParams as SummarizeParcelCasefileRealParams,
    type SummarizeParcelCasefileResult as SummarizeParcelCasefileRealResult,
    type AddDossierNoteRealParams,
    type AddDossierNoteRealResult,
    type QueryParcelLayersParams,
    type QueryParcelLayersResult,
    type ExplainModelResultsRealParams,
    type ExplainModelResultsRealResult,
    type SummarizeSalesCompsRealParams,
    type SummarizeSalesCompsRealResult,
    // Wave 2 handlers
    assignTaskRealHandler,
    checkCertStatusRealHandler,
    summarizeDossierRealHandler,
    explainSeniorExemptionRealHandler,
    draftValueChangeNoticeRealHandler,
    draftAppealResponseRealHandler,
    draftBoeAppealResponseRealHandler,
    draftNoticeRealHandler,
    synthesizeEvidenceRealHandler,
    generateCommissionerMemoRealHandler,
    assembleBoePacketRealHandler,
    createRequestTraceRedactionHandler,
    // Wave 2 types
    type AssignTaskRealParams,
    type AssignTaskRealResult,
    type CheckCertStatusRealParams,
    type CheckCertStatusRealResult,
    type SummarizeDossierRealParams,
    type SummarizeDossierRealResult,
    type ExplainSeniorExemptionRealParams,
    type ExplainSeniorExemptionRealResult,
    type DraftValueChangeNoticeRealParams,
    type DraftValueChangeNoticeRealResult,
    type DraftAppealResponseRealParams,
    type DraftAppealResponseRealResult,
    type DraftBoeAppealResponseRealParams,
    type DraftBoeAppealResponseRealResult,
    type DraftNoticeRealParams,
    type DraftNoticeRealResult,
    type SynthesizeEvidenceRealParams,
    type SynthesizeEvidenceRealResult,
    type GenerateCommissionerMemoRealParams,
    type GenerateCommissionerMemoRealResult,
    type AssembleBoePacketRealParams,
    type AssembleBoePacketRealResult,
} from './handlers.real.js';

// Backend HTTP Client
export {
    backendPost,
    backendGet,
    backendPut,
    unwrapBackend,
    type BackendCallOptions,
    type BackendResponse,
    type BackendError,
    type BackendResult,
} from './backendClient.js';

// Pilot Auth
export {
    acquirePilotToken,
    clearPilotToken,
    type PilotToken,
} from './pilotAuth.js';

