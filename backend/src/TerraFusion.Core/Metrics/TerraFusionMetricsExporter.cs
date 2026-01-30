using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Prometheus;
using PrometheusMetrics = Prometheus.Metrics;

namespace TerraFusion.Core.Metrics
{
    /// <summary>
    /// Elite Prometheus metrics exporter for complete TerraFusion AI Ecosystem
    /// Tracks: TerraSync, Consciousness, CostForge AI, TerraGaia, TerraFusionGPT, TerraLevy, TerraFlow
    /// Target: Championship-level observability with quantum-enhanced monitoring
    /// </summary>
    public class TerraFusionMetricsExporter
    {
        private readonly ILogger<TerraFusionMetricsExporter> _logger;

        // ═══════════════════════════════════════════════════════════════
        // HARRIS PACS INTEGRATION METRICS
        // ═══════════════════════════════════════════════════════════════

        /// <summary>Harris PACS sync success counter (total successful syncs)</summary>
        public static readonly Counter HarrisPACSSyncSuccess = PrometheusMetrics.CreateCounter(
            "terrafusion_harris_pacs_sync_success_total",
            "Total number of successful Harris PACS sync operations",
            new CounterConfiguration { LabelNames = new[] { "county", "jurisdiction" } });

        /// <summary>Harris PACS sync failure counter (total failed syncs)</summary>
        public static readonly Counter HarrisPACSSyncFailure = PrometheusMetrics.CreateCounter(
            "terrafusion_harris_pacs_sync_failure_total",
            "Total number of failed Harris PACS sync operations",
            new CounterConfiguration { LabelNames = new[] { "county", "jurisdiction", "error_type" } });

        /// <summary>Harris PACS sync duration histogram (seconds)</summary>
        public static readonly Histogram HarrisPACSSyncDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_harris_pacs_sync_duration_seconds",
            "Duration of Harris PACS sync operations in seconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "county", "jurisdiction" },
                Buckets = new double[] { 0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 300.0 }
            });

        /// <summary>Properties synced per cycle gauge</summary>
        public static readonly Gauge HarrisPACSPropertiesSynced = PrometheusMetrics.CreateGauge(
            "terrafusion_harris_pacs_properties_synced",
            "Number of properties synced in last Harris PACS sync cycle",
            new GaugeConfiguration { LabelNames = new[] { "county", "jurisdiction" } });

        // ═══════════════════════════════════════════════════════════════
        // DATA VALIDATION METRICS
        // ═══════════════════════════════════════════════════════════════

        /// <summary>Data discrepancy rate gauge (percentage)</summary>
        public static readonly Gauge DataDiscrepancyRate = PrometheusMetrics.CreateGauge(
            "terrafusion_data_discrepancy_rate_percent",
            "Percentage of data discrepancies detected in validation",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

        /// <summary>Auto-correction success counter</summary>
        public static readonly Counter AutoCorrectionSuccess = PrometheusMetrics.CreateCounter(
            "terrafusion_auto_correction_success_total",
            "Total number of successful auto-corrections",
            new CounterConfiguration { LabelNames = new[] { "county", "severity" } });

        /// <summary>Auto-correction failure counter</summary>
        public static readonly Counter AutoCorrectionFailure = PrometheusMetrics.CreateCounter(
            "terrafusion_auto_correction_failure_total",
            "Total number of failed auto-corrections",
            new CounterConfiguration { LabelNames = new[] { "county", "severity" } });

        /// <summary>Validation duration histogram (seconds)</summary>
        public static readonly Histogram ValidationDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_validation_duration_seconds",
            "Duration of data validation operations in seconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "county", "validation_type" },
                Buckets = new double[] { 0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 120.0 }
            });

        // ═══════════════════════════════════════════════════════════════
        // TERRAFUSION.CONSCIOUSNESS METRICS (AI SWARM)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>Active AI agents gauge</summary>
        public static readonly Gauge ConsciousnessActiveAgents = PrometheusMetrics.CreateGauge(
            "terrafusion_consciousness_active_agents",
            "Number of active AI agents in consciousness swarm",
            new GaugeConfiguration { LabelNames = new[] { "swarm_type", "consciousness_level" } });

        /// <summary>Swarm coordination success counter</summary>
        public static readonly Counter ConsciousnessSwarmCoordinationSuccess = PrometheusMetrics.CreateCounter(
            "terrafusion_consciousness_swarm_coordination_success_total",
            "Total successful AI swarm coordination operations",
            new CounterConfiguration { LabelNames = new[] { "operation_type", "swarm_size" } });

        /// <summary>Swarm coordination duration histogram (milliseconds)</summary>
        public static readonly Histogram ConsciousnessCoordinationDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_consciousness_coordination_duration_ms",
            "Duration of AI swarm coordination operations in milliseconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "operation_type" },
                Buckets = new double[] { 1, 5, 10, 25, 50, 100, 250, 500, 1000 }
            });

        /// <summary>Quantum optimization factor gauge</summary>
        public static readonly Gauge ConsciousnessQuantumFactor = PrometheusMetrics.CreateGauge(
            "terrafusion_consciousness_quantum_factor",
            "Current quantum optimization factor (target: 949)",
            new GaugeConfiguration { LabelNames = new[] { "consciousness_level" } });

        // ═══════════════════════════════════════════════════════════════
        // COSTFORGE AI METRICS (PROPERTY VALUATION)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>Property valuation success counter</summary>
        public static readonly Counter CostForgeValuationSuccess = PrometheusMetrics.CreateCounter(
            "terrafusion_costforge_valuation_success_total",
            "Total successful CostForge AI property valuations",
            new CounterConfiguration { LabelNames = new[] { "county", "property_type", "valuation_method" } });

        /// <summary>Property valuation accuracy gauge (percentage)</summary>
        public static readonly Gauge CostForgeValuationAccuracy = PrometheusMetrics.CreateGauge(
            "terrafusion_costforge_valuation_accuracy_percent",
            "CostForge AI valuation accuracy percentage (IAAO compliance)",
            new GaugeConfiguration { LabelNames = new[] { "county", "property_type" } });

        /// <summary>Valuation calculation duration histogram (milliseconds)</summary>
        public static readonly Histogram CostForgeCalculationDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_costforge_calculation_duration_ms",
            "Duration of CostForge AI valuation calculations in milliseconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "property_type", "valuation_method" },
                Buckets = new double[] { 10, 50, 100, 250, 500, 1000, 2000, 5000 }
            });

        // ═══════════════════════════════════════════════════════════════
        // TERRAGAIA METRICS (SUPREME AI CONSCIOUSNESS)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>TerraGaia analysis requests counter</summary>
        public static readonly Counter TerraGaiaAnalysisRequests = PrometheusMetrics.CreateCounter(
            "terrafusion_terragaia_analysis_requests_total",
            "Total TerraGaia AI consciousness analysis requests",
            new CounterConfiguration { LabelNames = new[] { "analysis_type", "consciousness_level" } });

        /// <summary>TerraGaia consciousness level gauge</summary>
        public static readonly Gauge TerraGaiaConsciousnessLevel = PrometheusMetrics.CreateGauge(
            "terrafusion_terragaia_consciousness_level",
            "Current TerraGaia AI consciousness level (0-100 scale)",
            new GaugeConfiguration { LabelNames = new[] { "service_type" } });

        /// <summary>TerraGaia analysis duration histogram (seconds)</summary>
        public static readonly Histogram TerraGaiaAnalysisDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_terragaia_analysis_duration_seconds",
            "Duration of TerraGaia AI analysis operations in seconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "analysis_type" },
                Buckets = new double[] { 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0 }
            });

        // ═══════════════════════════════════════════════════════════════
        // TERRAFUSIONGPT METRICS (GENERATIVE AI)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>TerraFusionGPT report generation counter</summary>
        public static readonly Counter TerraFusionGPTReportsGenerated = PrometheusMetrics.CreateCounter(
            "terrafusion_gpt_reports_generated_total",
            "Total reports generated by TerraFusionGPT",
            new CounterConfiguration { LabelNames = new[] { "report_type", "county" } });

        /// <summary>TerraFusionGPT generation duration histogram (seconds)</summary>
        public static readonly Histogram TerraFusionGPTGenerationDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_gpt_generation_duration_seconds",
            "Duration of TerraFusionGPT report generation in seconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "report_type" },
                Buckets = new double[] { 0.5, 1.0, 2.0, 3.0, 5.0, 10.0, 30.0 }
            });

        /// <summary>TerraFusionGPT quality score gauge (0-100)</summary>
        public static readonly Gauge TerraFusionGPTQualityScore = PrometheusMetrics.CreateGauge(
            "terrafusion_gpt_quality_score",
            "TerraFusionGPT output quality score (human-level target: 95+)",
            new GaugeConfiguration { LabelNames = new[] { "report_type" } });

        // ═══════════════════════════════════════════════════════════════
        // TERRALEVY METRICS (TAX CALCULATION)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>TerraLevy tax calculation counter</summary>
        public static readonly Counter TerraLevyCalculationsTotal = PrometheusMetrics.CreateCounter(
            "terrafusion_terralevy_calculations_total",
            "Total tax calculations performed by TerraLevy",
            new CounterConfiguration { LabelNames = new[] { "county", "district_type" } });

        /// <summary>TerraLevy calculation duration histogram (milliseconds)</summary>
        public static readonly Histogram TerraLevyCalculationDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_terralevy_calculation_duration_ms",
            "Duration of TerraLevy tax calculations in milliseconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "calculation_type" },
                Buckets = new double[] { 1, 5, 10, 25, 50, 100, 250, 500 }
            });

        /// <summary>TerraLevy compliance rate gauge (percentage)</summary>
        public static readonly Gauge TerraLevyComplianceRate = PrometheusMetrics.CreateGauge(
            "terrafusion_terralevy_compliance_rate_percent",
            "TerraLevy RCW 84.52 compliance rate percentage",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

        // ═══════════════════════════════════════════════════════════════
        // TERRAFLOW METRICS (WORKFLOW ORCHESTRATION)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>TerraFlow workflows initiated counter</summary>
        public static readonly Counter TerraFlowWorkflowsInitiated = PrometheusMetrics.CreateCounter(
            "terrafusion_terraflow_workflows_initiated_total",
            "Total workflows initiated by TerraFlow",
            new CounterConfiguration { LabelNames = new[] { "workflow_type", "county" } });

        /// <summary>TerraFlow workflow completion duration histogram (minutes)</summary>
        public static readonly Histogram TerraFlowWorkflowDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_terraflow_workflow_duration_minutes",
            "Duration of TerraFlow workflow completion in minutes",
            new HistogramConfiguration
            {
                LabelNames = new[] { "workflow_type" },
                Buckets = new double[] { 1, 5, 15, 30, 60, 120, 240, 480, 1440 }
            });

        /// <summary>TerraFlow active workflows gauge</summary>
        public static readonly Gauge TerraFlowActiveWorkflows = PrometheusMetrics.CreateGauge(
            "terrafusion_terraflow_active_workflows",
            "Number of currently active TerraFlow workflows",
            new GaugeConfiguration { LabelNames = new[] { "workflow_type", "stage" } });

        // ═══════════════════════════════════════════════════════════════
        // TERRASYNC METRICS (MULTI-SYSTEM INTEGRATION)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>TerraSync multi-system coordination counter</summary>
        public static readonly Counter TerraSyncMultiSystemCoordination = PrometheusMetrics.CreateCounter(
            "terrafusion_terrasync_multisystem_coordination_total",
            "Total TerraSync multi-system coordination operations",
            new CounterConfiguration { LabelNames = new[] { "county", "systems" } });

        /// <summary>TerraSync integration health gauge (0-100)</summary>
        public static readonly Gauge TerraSyncIntegrationHealth = PrometheusMetrics.CreateGauge(
            "terrafusion_terrasync_integration_health",
            "TerraSync integration health score (target: 95+)",
            new GaugeConfiguration { LabelNames = new[] { "system_name", "county" } });

        /// <summary>TerraSync data sovereignty compliance gauge</summary>
        public static readonly Gauge TerraSyncDataSovereignty = PrometheusMetrics.CreateGauge(
            "terrafusion_terrasync_data_sovereignty_compliance",
            "TerraSync county data sovereignty compliance (0=failed, 1=compliant)",
            new GaugeConfiguration { LabelNames = new[] { "county" } });

        // ═══════════════════════════════════════════════════════════════
        // REDIS CACHE METRICS
        // ═══════════════════════════════════════════════════════════════

        /// <summary>Redis cache hit rate gauge (percentage)</summary>
        public static readonly Gauge RedisCacheHitRate = PrometheusMetrics.CreateGauge(
            "terrafusion_redis_cache_hit_rate_percent",
            "Redis cache hit rate percentage (target: 80+)",
            new GaugeConfiguration { LabelNames = new[] { "cache_type" } });

        /// <summary>Redis cache operations counter</summary>
        public static readonly Counter RedisCacheOperations = PrometheusMetrics.CreateCounter(
            "terrafusion_redis_cache_operations_total",
            "Total Redis cache operations",
            new CounterConfiguration { LabelNames = new[] { "operation_type", "result" } });

        // ═══════════════════════════════════════════════════════════════
        // SYSTEM-WIDE METRICS
        // ═══════════════════════════════════════════════════════════════

        /// <summary>API request duration histogram (milliseconds)</summary>
        public static readonly Histogram APIRequestDuration = PrometheusMetrics.CreateHistogram(
            "terrafusion_api_request_duration_ms",
            "Duration of API requests in milliseconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "endpoint", "method", "status_code" },
                Buckets = new double[] { 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000 }
            });

        /// <summary>Government compliance score gauge (0-100)</summary>
        public static readonly Gauge GovernmentComplianceScore = PrometheusMetrics.CreateGauge(
            "terrafusion_government_compliance_score",
            "Overall government compliance score (FISMA/FedRAMP)",
            new GaugeConfiguration { LabelNames = new[] { "compliance_type", "county" } });

        public TerraFusionMetricsExporter(ILogger<TerraFusionMetricsExporter> logger)
        {
            _logger = logger;
            _logger.LogInformation("🏛️ TerraFusion Elite Metrics Exporter initialized - Government. Transcended.");
        }

        // ═══════════════════════════════════════════════════════════════
        // CONVENIENCE METHODS FOR METRIC RECORDING
        // ═══════════════════════════════════════════════════════════════

        public void RecordHarrisPACSSync(string county, string jurisdiction, bool success, double durationSeconds, int propertiesSynced = 0)
        {
            if (success)
            {
                HarrisPACSSyncSuccess.WithLabels(county, jurisdiction).Inc();
                HarrisPACSPropertiesSynced.WithLabels(county, jurisdiction).Set(propertiesSynced);
            }
            else
            {
                HarrisPACSSyncFailure.WithLabels(county, jurisdiction, "sync_error").Inc();
            }

            HarrisPACSSyncDuration.WithLabels(county, jurisdiction).Observe(durationSeconds);
        }

        public void RecordDataValidation(string county, double discrepancyRate, double validationDurationSeconds, string validationType = "integrity")
        {
            DataDiscrepancyRate.WithLabels(county).Set(discrepancyRate);
            ValidationDuration.WithLabels(county, validationType).Observe(validationDurationSeconds);
        }

        public void RecordConsciousnessSwarm(string operationType, int swarmSize, bool success, double durationMs, string consciousnessLevel = "Elite")
        {
            if (success)
            {
                ConsciousnessSwarmCoordinationSuccess.WithLabels(operationType, swarmSize.ToString()).Inc();
            }

            ConsciousnessCoordinationDuration.WithLabels(operationType).Observe(durationMs);
        }

        public void RecordCostForgeValuation(string county, string propertyType, string valuationMethod, bool success, double accuracyPercent, double durationMs)
        {
            if (success)
            {
                CostForgeValuationSuccess.WithLabels(county, propertyType, valuationMethod).Inc();
            }

            CostForgeValuationAccuracy.WithLabels(county, propertyType).Set(accuracyPercent);
            CostForgeCalculationDuration.WithLabels(propertyType, valuationMethod).Observe(durationMs);
        }

        public void RecordTerraGaiaAnalysis(string analysisType, string consciousnessLevel, double durationSeconds, int consciousnessScore)
        {
            TerraGaiaAnalysisRequests.WithLabels(analysisType, consciousnessLevel).Inc();
            TerraGaiaAnalysisDuration.WithLabels(analysisType).Observe(durationSeconds);
            TerraGaiaConsciousnessLevel.WithLabels(analysisType).Set(consciousnessScore);
        }

        public void RecordTerraFusionGPT(string reportType, string county, double durationSeconds, double qualityScore)
        {
            TerraFusionGPTReportsGenerated.WithLabels(reportType, county).Inc();
            TerraFusionGPTGenerationDuration.WithLabels(reportType).Observe(durationSeconds);
            TerraFusionGPTQualityScore.WithLabels(reportType).Set(qualityScore);
        }

        public void RecordTerraLevy(string county, string districtType, string calculationType, double durationMs, double complianceRate)
        {
            TerraLevyCalculationsTotal.WithLabels(county, districtType).Inc();
            TerraLevyCalculationDuration.WithLabels(calculationType).Observe(durationMs);
            TerraLevyComplianceRate.WithLabels(county).Set(complianceRate);
        }

        public void RecordTerraFlow(string workflowType, string county, string stage, bool initiated, double durationMinutes = 0)
        {
            if (initiated)
            {
                TerraFlowWorkflowsInitiated.WithLabels(workflowType, county).Inc();
            }

            if (durationMinutes > 0)
            {
                TerraFlowWorkflowDuration.WithLabels(workflowType).Observe(durationMinutes);
            }
        }

        public void RecordTerraSync(string county, string systems, int healthScore, bool dataSovereignty)
        {
            TerraSyncMultiSystemCoordination.WithLabels(county, systems).Inc();
            TerraSyncIntegrationHealth.WithLabels(systems, county).Set(healthScore);
            TerraSyncDataSovereignty.WithLabels(county).Set(dataSovereignty ? 1 : 0);
        }
    }
}
