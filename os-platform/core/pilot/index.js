// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS - Pilot Module Exports
 *
 * Re-exports all pilot module components for clean imports.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearPilotToken = exports.acquirePilotToken = exports.unwrapBackend = exports.backendGet = exports.backendPost = exports.queryParcelLayersRealHandler = exports.addDossierNoteRealHandler = exports.summarizeParcelCasefileRealHandler = exports.compareAssessedValueHistoryRealHandler = exports.explainModelInputsRealHandler = exports.summarizeLevyRateRealHandler = exports.createSearchTraceHandler = exports.routeToParcelHandler = exports.explainValueChangeHandler = exports.runValuationModelHandler = exports.registerR1Handlers = exports.writeGateHandlers = exports.requestTraceRedactionHandler = exports.assembleBoePacketHandler = exports.registerWriteGateHandlers = exports.summarizeSalesCompsHandler = exports.summarizeParcelCasefileHandler = exports.summarizeLevyRateHandler = exports.summarizeDossierHandler = exports.searchTraceByCorrelationHandler = exports.registerPhase84Handlers = exports.registerPhase83Handlers = exports.registerAllHandlers = exports.phase84Handlers = exports.phase83Handlers = exports.explainSeniorExemptionHandler = exports.explainModelResultsHandler = exports.explainModelInputsHandler = exports.draftValueChangeNoticeHandler = exports.draftBoeAppealResponseHandler = exports.draftAppealResponseHandler = exports.compareAssessedValueHandler = exports.addDossierNoteHandler = exports.toolRunner = exports.ToolRunner = exports.ToolRunnerError = exports.ErrorCodes = exports.createPreflight = exports.toolRegistry = exports.VALID_TRACE_POLICIES = exports.VALID_SUITES = exports.VALID_RISKS = exports.VALID_PII_HANDLING = exports.ToolRegistry = exports.ManifestValidationError = void 0;
var ToolRegistry_js_1 = require("./ToolRegistry.js");
Object.defineProperty(exports, "ManifestValidationError", { enumerable: true, get: function () { return ToolRegistry_js_1.ManifestValidationError; } });
Object.defineProperty(exports, "ToolRegistry", { enumerable: true, get: function () { return ToolRegistry_js_1.ToolRegistry; } });
Object.defineProperty(exports, "VALID_PII_HANDLING", { enumerable: true, get: function () { return ToolRegistry_js_1.VALID_PII_HANDLING; } });
Object.defineProperty(exports, "VALID_RISKS", { enumerable: true, get: function () { return ToolRegistry_js_1.VALID_RISKS; } });
Object.defineProperty(exports, "VALID_SUITES", { enumerable: true, get: function () { return ToolRegistry_js_1.VALID_SUITES; } });
Object.defineProperty(exports, "VALID_TRACE_POLICIES", { enumerable: true, get: function () { return ToolRegistry_js_1.VALID_TRACE_POLICIES; } });
Object.defineProperty(exports, "toolRegistry", { enumerable: true, get: function () { return ToolRegistry_js_1.toolRegistry; } });
var ToolRunner_preflight_js_1 = require("./ToolRunner.preflight.js");
Object.defineProperty(exports, "createPreflight", { enumerable: true, get: function () { return ToolRunner_preflight_js_1.createPreflight; } });
var ToolRunner_js_1 = require("./ToolRunner.js");
Object.defineProperty(exports, "ErrorCodes", { enumerable: true, get: function () { return ToolRunner_js_1.ErrorCodes; } });
Object.defineProperty(exports, "ToolRunnerError", { enumerable: true, get: function () { return ToolRunner_js_1.ToolRunnerError; } });
Object.defineProperty(exports, "ToolRunner", { enumerable: true, get: function () { return ToolRunner_js_1.ToolRunner; } });
Object.defineProperty(exports, "toolRunner", { enumerable: true, get: function () { return ToolRunner_js_1.toolRunner; } });
var handlers_js_1 = require("./handlers.js");
// Phase 8.4 exports
Object.defineProperty(exports, "addDossierNoteHandler", { enumerable: true, get: function () { return handlers_js_1.addDossierNoteHandler; } });
Object.defineProperty(exports, "compareAssessedValueHandler", { enumerable: true, get: function () { return handlers_js_1.compareAssessedValueHandler; } });
Object.defineProperty(exports, "draftAppealResponseHandler", { enumerable: true, get: function () { return handlers_js_1.draftAppealResponseHandler; } });
Object.defineProperty(exports, "draftBoeAppealResponseHandler", { enumerable: true, get: function () { return handlers_js_1.draftBoeAppealResponseHandler; } });
Object.defineProperty(exports, "draftValueChangeNoticeHandler", { enumerable: true, get: function () { return handlers_js_1.draftValueChangeNoticeHandler; } });
Object.defineProperty(exports, "explainModelInputsHandler", { enumerable: true, get: function () { return handlers_js_1.explainModelInputsHandler; } });
Object.defineProperty(exports, "explainModelResultsHandler", { enumerable: true, get: function () { return handlers_js_1.explainModelResultsHandler; } });
Object.defineProperty(exports, "explainSeniorExemptionHandler", { enumerable: true, get: function () { return handlers_js_1.explainSeniorExemptionHandler; } });
Object.defineProperty(exports, "phase83Handlers", { enumerable: true, get: function () { return handlers_js_1.phase83Handlers; } });
Object.defineProperty(exports, "phase84Handlers", { enumerable: true, get: function () { return handlers_js_1.phase84Handlers; } });
Object.defineProperty(exports, "registerAllHandlers", { enumerable: true, get: function () { return handlers_js_1.registerAllHandlers; } });
Object.defineProperty(exports, "registerPhase83Handlers", { enumerable: true, get: function () { return handlers_js_1.registerPhase83Handlers; } });
Object.defineProperty(exports, "registerPhase84Handlers", { enumerable: true, get: function () { return handlers_js_1.registerPhase84Handlers; } });
Object.defineProperty(exports, "searchTraceByCorrelationHandler", { enumerable: true, get: function () { return handlers_js_1.searchTraceByCorrelationHandler; } });
Object.defineProperty(exports, "summarizeDossierHandler", { enumerable: true, get: function () { return handlers_js_1.summarizeDossierHandler; } });
Object.defineProperty(exports, "summarizeLevyRateHandler", { enumerable: true, get: function () { return handlers_js_1.summarizeLevyRateHandler; } });
Object.defineProperty(exports, "summarizeParcelCasefileHandler", { enumerable: true, get: function () { return handlers_js_1.summarizeParcelCasefileHandler; } });
Object.defineProperty(exports, "summarizeSalesCompsHandler", { enumerable: true, get: function () { return handlers_js_1.summarizeSalesCompsHandler; } });
// C2 Write-Lane Governance Handlers
Object.defineProperty(exports, "registerWriteGateHandlers", { enumerable: true, get: function () { return handlers_js_1.registerWriteGateHandlers; } });
Object.defineProperty(exports, "assembleBoePacketHandler", { enumerable: true, get: function () { return handlers_js_1.assembleBoePacketHandler; } });
Object.defineProperty(exports, "requestTraceRedactionHandler", { enumerable: true, get: function () { return handlers_js_1.requestTraceRedactionHandler; } });
Object.defineProperty(exports, "writeGateHandlers", { enumerable: true, get: function () { return handlers_js_1.writeGateHandlers; } });
// R1 Real Handlers (override canned stubs when backend is available)
var handlers_real_js_1 = require("./handlers.real.js");
Object.defineProperty(exports, "registerR1Handlers", { enumerable: true, get: function () { return handlers_real_js_1.registerR1Handlers; } });
Object.defineProperty(exports, "runValuationModelHandler", { enumerable: true, get: function () { return handlers_real_js_1.runValuationModelHandler; } });
Object.defineProperty(exports, "explainValueChangeHandler", { enumerable: true, get: function () { return handlers_real_js_1.explainValueChangeHandler; } });
Object.defineProperty(exports, "routeToParcelHandler", { enumerable: true, get: function () { return handlers_real_js_1.routeToParcelHandler; } });
Object.defineProperty(exports, "createSearchTraceHandler", { enumerable: true, get: function () { return handlers_real_js_1.createSearchTraceHandler; } });
Object.defineProperty(exports, "summarizeLevyRateRealHandler", { enumerable: true, get: function () { return handlers_real_js_1.summarizeLevyRateRealHandler; } });
Object.defineProperty(exports, "explainModelInputsRealHandler", { enumerable: true, get: function () { return handlers_real_js_1.explainModelInputsRealHandler; } });
Object.defineProperty(exports, "compareAssessedValueHistoryRealHandler", { enumerable: true, get: function () { return handlers_real_js_1.compareAssessedValueHistoryRealHandler; } });
Object.defineProperty(exports, "summarizeParcelCasefileRealHandler", { enumerable: true, get: function () { return handlers_real_js_1.summarizeParcelCasefileRealHandler; } });
Object.defineProperty(exports, "addDossierNoteRealHandler", { enumerable: true, get: function () { return handlers_real_js_1.addDossierNoteRealHandler; } });
Object.defineProperty(exports, "queryParcelLayersRealHandler", { enumerable: true, get: function () { return handlers_real_js_1.queryParcelLayersRealHandler; } });
// Backend HTTP Client
var backendClient_js_1 = require("./backendClient.js");
Object.defineProperty(exports, "backendPost", { enumerable: true, get: function () { return backendClient_js_1.backendPost; } });
Object.defineProperty(exports, "backendGet", { enumerable: true, get: function () { return backendClient_js_1.backendGet; } });
Object.defineProperty(exports, "unwrapBackend", { enumerable: true, get: function () { return backendClient_js_1.unwrapBackend; } });
// Pilot Auth
var pilotAuth_js_1 = require("./pilotAuth.js");
Object.defineProperty(exports, "acquirePilotToken", { enumerable: true, get: function () { return pilotAuth_js_1.acquirePilotToken; } });
Object.defineProperty(exports, "clearPilotToken", { enumerable: true, get: function () { return pilotAuth_js_1.clearPilotToken; } });
