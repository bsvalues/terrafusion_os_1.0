// ============================================================================
// PHASE 36: OpenTelemetry Distributed Tracing Constants
// SPEC LOCK: Changes require RFC + full test suite update
// ============================================================================
// Activity Source Names, Span Names, and Attribute Keys
// Locked: 2025-01-XX
// ============================================================================

namespace TerraFusion.AI.Tracing;

/// <summary>
/// SPEC LOCK: Tracing constants for OpenTelemetry distributed tracing.
/// All span names and attribute keys are locked per Phase 36 specification.
/// Changes require RFC approval and full test suite update.
/// </summary>
public static class TracingConstants
{
    /// <summary>
    /// Current version of the tracing specification.
    /// </summary>
    public const string Version = "1.0.0";

    /// <summary>
    /// Activity source names for creating spans.
    /// </summary>
    public static class ActivitySources
    {
        /// <summary>
        /// ActivitySource for SystemGPT pipeline tracing (RAG, Guardrails, Swarm).
        /// </summary>
        public const string SystemGpt = "TerraFusion.SystemGpt";

        /// <summary>
        /// ActivitySource for Atlas pipeline tracing (Forecasts, Anomalies, Orchestration).
        /// </summary>
        public const string Atlas = "TerraFusion.Atlas";

        /// <summary>
        /// All registered activity source names for registration.
        /// </summary>
        public static readonly string[] All = { SystemGpt, Atlas };
    }

    /// <summary>
    /// Span names for distributed tracing operations.
    /// </summary>
    public static class SpanNames
    {
        // ========== SystemGPT Pipeline Spans ==========

        /// <summary>
        /// Root span for incoming GPT requests.
        /// </summary>
        public const string SystemGptRequest = "SystemGpt.Request";

        /// <summary>
        /// Span for RAG semantic search operations.
        /// </summary>
        public const string SystemGptRagQuery = "SystemGpt.Rag.Query";

        /// <summary>
        /// Span for embedding generation operations.
        /// </summary>
        public const string SystemGptRagEmbed = "SystemGpt.Rag.Embed";

        /// <summary>
        /// Span for guardrail evaluation decisions.
        /// </summary>
        public const string SystemGptGuardrailEvaluate = "SystemGpt.Guardrail.Evaluate";

        /// <summary>
        /// Span for swarm policy evaluation.
        /// </summary>
        public const string SystemGptSwarmDecide = "SystemGpt.Swarm.Decide";

        /// <summary>
        /// Span for predictive action execution.
        /// </summary>
        public const string SystemGptSwarmAction = "SystemGpt.Swarm.Action";

        // ========== Atlas Pipeline Spans ==========

        /// <summary>
        /// Span for background orchestrator cycle.
        /// </summary>
        public const string AtlasOrchestratorRun = "Atlas.Orchestrator.Run";

        /// <summary>
        /// Span for forecast computation.
        /// </summary>
        public const string AtlasForecastCompute = "Atlas.Forecast.Compute";

        /// <summary>
        /// Span for anomaly detection.
        /// </summary>
        public const string AtlasAnomalyDetect = "Atlas.Anomaly.Detect";

        /// <summary>
        /// Span for anomaly processing.
        /// </summary>
        public const string AtlasAnomalyProcess = "Atlas.Anomaly.Process";
    }

    /// <summary>
    /// Attribute keys for span tagging.
    /// </summary>
    public static class Attributes
    {
        // ========== Required Attributes (must be on all spans) ==========

        /// <summary>
        /// County identifier - REQUIRED on all spans for government compliance.
        /// </summary>
        public const string CountyId = "tf.county_id";

        // ========== Context Attributes ==========

        /// <summary>
        /// Context/session identifier.
        /// </summary>
        public const string ContextId = "tf.context_id";

        /// <summary>
        /// Service name for correlation.
        /// </summary>
        public const string ServiceName = "tf.service_name";

        // ========== RAG Attributes ==========

        /// <summary>
        /// Whether RAG was used in the request.
        /// </summary>
        public const string UsesRag = "tf.uses_rag";

        /// <summary>
        /// Number of documents retrieved from RAG.
        /// </summary>
        public const string DocumentCount = "tf.document_count";

        // ========== Guardrail Attributes ==========

        /// <summary>
        /// Guardrail evaluation result (Pass/Fail/Warn).
        /// </summary>
        public const string GuardrailResult = "tf.guardrail_result";

        // ========== Swarm Attributes ==========

        /// <summary>
        /// Swarm action type (scale/none/alert).
        /// </summary>
        public const string SwarmAction = "tf.swarm_action";

        // ========== Forecast Attributes ==========

        /// <summary>
        /// Metric name being forecasted.
        /// </summary>
        public const string MetricName = "tf.metric_name";

        /// <summary>
        /// Forecast horizon in hours.
        /// </summary>
        public const string ForecastHorizon = "tf.forecast_horizon";

        // ========== Anomaly Attributes ==========

        /// <summary>
        /// Type of anomaly detected.
        /// </summary>
        public const string AnomalyType = "tf.anomaly_type";

        /// <summary>
        /// Severity of anomaly (low/medium/high/critical).
        /// </summary>
        public const string AnomalySeverity = "tf.anomaly_severity";

        // ========== Error Attributes ==========

        /// <summary>
        /// Error type classification.
        /// </summary>
        public const string ErrorType = "tf.error_type";

        /// <summary>
        /// Request duration in milliseconds.
        /// </summary>
        public const string RequestDurationMs = "tf.request_duration_ms";
    }

    /// <summary>
    /// Standard attribute values.
    /// </summary>
    public static class Values
    {
        /// <summary>
        /// Guardrail result values.
        /// </summary>
        public static class GuardrailResult
        {
            public const string Pass = "pass";
            public const string Fail = "fail";
            public const string Warn = "warn";
        }

        /// <summary>
        /// Swarm action values.
        /// </summary>
        public static class SwarmAction
        {
            public const string Scale = "scale";
            public const string None = "none";
            public const string Alert = "alert";
        }

        /// <summary>
        /// Anomaly severity values.
        /// </summary>
        public static class AnomalySeverity
        {
            public const string Low = "low";
            public const string Medium = "medium";
            public const string High = "high";
            public const string Critical = "critical";
        }
    }
}
