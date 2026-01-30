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
    type SummarizeSalesCompsResult
} from './handlers.js';

