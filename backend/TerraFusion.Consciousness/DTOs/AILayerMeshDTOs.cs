namespace TerraFusion.Consciousness.DTOs
{
    #region Core Multi-County DTOs

    public class MultiCountyInitializationResultDto
    {
        public required bool Success { get; set; }
        public required List<string> InitializedCounties { get; set; }
        public required List<string> FailedCounties { get; set; }
        public required Dictionary<string, object> InitializationMetrics { get; set; }
        public required DateTime InitializationTime { get; set; }
        public List<string>? Errors { get; set; }
        public Dictionary<string, object>? LegacyCompatibilityInfo { get; set; }
        public Dictionary<string, string>? CountyVersionMappings { get; set; }
        public string? BackwardCompatibilityLevel { get; set; }

        // Implementation-required properties from compilation errors
        public int FederatedCounties { get; set; }
        public string MeshGatewayStatus { get; set; } = "Operational";
        public bool PrivacyGuardrails { get; set; } = true;
        public List<string> InitializationMessages { get; set; } = new();
    }

    public class CountyDataSourceRequestDto
    {
        public required string CountyId { get; set; }
        public required string DataSourceType { get; set; }
        public required Dictionary<string, object> ConnectionConfig { get; set; }
        public required string RequestId { get; set; }
        public required DateTime RequestTime { get; set; }

        // Properties required by implementation
        public required string CountyName { get; set; }
        public required string StateName { get; set; }
        public required List<string> MeshCapabilities { get; set; }
        public required string PrivacyLevel { get; set; }
        public required Dictionary<string, object> DataSovereigntyRestrictions { get; set; }

        public string? LegacySystemId { get; set; }
        public Dictionary<string, object>? FlexibleConfiguration { get; set; }

        // Additional implementation-required properties
        public string ApiEndpoint { get; set; } = string.Empty;
        public Dictionary<string, string>? LegacyPropertyMappings { get; set; }
        public bool? EnableBackwardCompatibility { get; set; }
    }

    public class CountyDataSourceResultDto
    {
        public required string CountyId { get; set; }
        public required bool Success { get; set; }
        public required Dictionary<string, object> DataSources { get; set; }
        public required DateTime ResponseTime { get; set; }

        // Properties required by implementation
        public required string CountyNodeId { get; set; }
        public required string ConnectionStatus { get; set; }
        public required List<string> MeshCapabilities { get; set; }
        public required string PrivacyLevel { get; set; }
        public required DateTime AddedAt { get; set; }
        public required TimeSpan ConnectionTime { get; set; }
        public required List<string> Messages { get; set; }

        public List<string>? Errors { get; set; }
        public Dictionary<string, object>? ConnectionMetrics { get; set; }
    }

    public class AvailableCountiesDto
    {
        public required List<string> Counties { get; set; }
        public required Dictionary<string, object> CountyCapabilities { get; set; }
        public required DateTime LastUpdated { get; set; }

        // Properties required by implementation
        public required List<FederatedCountyInfo> FederatedCounties { get; set; }
        public required int TotalFederatedCounties { get; set; }
        public required int AvailableForConnection { get; set; }
        public required string MeshStatus { get; set; }
        public required Dictionary<string, object> Statistics { get; set; }

        public Dictionary<string, object>? CountyMetrics { get; set; }
    }

    public class AggregatedDataRequestDto
    {
        public required string RequestId { get; set; }
        public required string[] CountyIds { get; set; }
        public required string AggregationType { get; set; }
        public required Dictionary<string, object> AggregationConfig { get; set; }
        public required DateTime RequestTime { get; set; }

        // Properties required by implementation
        public required List<string> DataTypes { get; set; }
        public required List<string> TargetCounties { get; set; }

        public Dictionary<string, object>? AggregationOptions { get; set; }
    }

    public class AggregatedCountyDataDto
    {
        public required string RequestId { get; set; }
        public required Dictionary<string, object> AggregatedData { get; set; }
        public required List<string> ProcessedCounties { get; set; }
        public required DateTime AggregationTime { get; set; }

        // Properties required by implementation
        public required string AggregationMethod { get; set; }
        public required List<string> ParticipatingCounties { get; set; }
        public required List<string> DataTypes { get; set; }
        public required Dictionary<string, object> AggregatedResults { get; set; }
        public required List<string> PrivacyGuarantees { get; set; }
        public required DateTime DataAsOf { get; set; }
        public required Dictionary<string, object> Metadata { get; set; }

        public Dictionary<string, object>? AggregationMetrics { get; set; }
    }

    public class MultiCountySyncResultDto
    {
        public required bool Success { get; set; }
        public required List<string> SyncedCounties { get; set; }
        public required List<string> FailedCounties { get; set; }
        public required DateTime SyncTime { get; set; }

        // Properties required by implementation
        public required DateTime SyncStartTime { get; set; }
        public required DateTime SyncEndTime { get; set; }
        public required int TotalCountiesSynced { get; set; }
        public required int TotalRecordsSynced { get; set; }
        public required Dictionary<string, object> CountyResults { get; set; }
        public required List<string> SyncMessages { get; set; }

        public Dictionary<string, object>? SyncMetrics { get; set; }
    }

    public class FederatedOperationRequestDto
    {
        public required string OperationId { get; set; }
        public required string OperationType { get; set; }
        public required string[] TargetCounties { get; set; }
        public required Dictionary<string, object> OperationData { get; set; }
        public required DateTime RequestTime { get; set; }

        // Properties required by implementation
        public required List<string> RequiredCapabilities { get; set; }

        public Dictionary<string, object>? OperationOptions { get; set; }
    }

    public class FederatedOperationResultDto
    {
        public required string OperationId { get; set; }
        public required bool Success { get; set; }
        public required Dictionary<string, object> Results { get; set; }
        public required List<string> ProcessedCounties { get; set; }
        public required DateTime CompletionTime { get; set; }

        // Properties required by implementation
        public required string OperationType { get; set; }
        public required List<string> ParticipatingCounties { get; set; }
        public required DateTime ExecutionTime { get; set; }  // Changed TimeSpan→DateTime
        public required Dictionary<string, object> AggregatedResults { get; set; }
        public required List<string> PrivacyGuarantees { get; set; }
        public required Dictionary<string, object> ComplianceValidation { get; set; }

        public Dictionary<string, object>? OperationMetrics { get; set; }
    }

    public class MeshHealthIndexDto
    {
        public required double OverallHealthIndex { get; set; }
        public required Dictionary<string, double> ComponentHealthScores { get; set; }
        public required string HealthStatus { get; set; }
        public required DateTime CalculationTime { get; set; }
        public required List<string> HealthIndicators { get; set; }

        // Properties required by implementation
        public required double OverallHealth { get; set; }
        public required int ActiveCounties { get; set; }
        public required int TotalCounties { get; set; }
        public required double SecurityScore { get; set; }
        public required double PerformanceScore { get; set; }
        public required double PrivacyCompliance { get; set; }
        public required DateTime LastHealthCheck { get; set; }
        public required Dictionary<string, object> ComponentHealth { get; set; }
        public required List<string> Alerts { get; set; }

        public List<string>? HealthWarnings { get; set; }
        public Dictionary<string, object>? HealthTrends { get; set; }
    }

    #endregion

    #region Validation Ring DTOs

    public class ValidationRequestDto
    {
        public required string ValidationId { get; set; }
        public required string ValidationType { get; set; }
        public required Dictionary<string, object> ValidationData { get; set; }
        public required string[] TargetRings { get; set; }
        public required double RequiredConsensus { get; set; }
        public required DateTime RequestTime { get; set; }
        public string? RequestSource { get; set; }
        public Dictionary<string, object>? ValidationCriteria { get; set; }

        // Implementation-required properties from compilation errors
        public string[] RequiredRings { get; set; } = Array.Empty<string>();
        public int Priority { get; set; } = 1;
        public string RequestId { get; set; } = Guid.NewGuid().ToString();
    }

    public class ValidationRingResultDto
    {
        public required string ValidationId { get; set; }
        public required bool ValidationPassed { get; set; }
        public required double ConsensusAchieved { get; set; }
        public required Dictionary<string, object> ValidationResults { get; set; }
        public required List<string> ParticipatingRings { get; set; }
        public required DateTime ValidationTime { get; set; }
        public required List<string> ValidationSteps { get; set; }

        // Properties required by implementation
        public required bool Success { get; set; }
        public required Dictionary<string, object> RingStatuses { get; set; }
        public required Dictionary<string, object> RingResults { get; set; }
        public required double ConsensusLevel { get; set; }
        public required List<string> ValidationMessages { get; set; }
        public required Dictionary<string, object> DetailedResults { get; set; }

        public Dictionary<string, object>? ValidationMetrics { get; set; }
    }

    public class ValidationRingStatusDto
    {
        public required string RingId { get; set; }
        public required string Status { get; set; }
        public required int ActiveValidators { get; set; }
        public required double ConsensusLevel { get; set; }
        public required DateTime LastValidation { get; set; }
        public required List<string> CurrentValidations { get; set; }

        // Properties required by implementation
        public required string StatisticalValidationRing { get; set; }
        public required string BusinessRuleValidationRing { get; set; }
        public required string EthicsLegalValidationRing { get; set; }
        public required string PerformanceValidationRing { get; set; }
        public required double ConsensusAchievement { get; set; }
        public required DateTime LastConsensusTime { get; set; }
        public required double ValidationThroughput { get; set; }
        public required Dictionary<string, object> ConsensusMetrics { get; set; }

        public Dictionary<string, object>? RingMetrics { get; set; }
    }

    #endregion

    #region Mesh Operation DTOs

    public class MeshOperationRequestDto
    {
        public required string OperationId { get; set; }
        public required string OperationType { get; set; }
        public required Dictionary<string, object> OperationData { get; set; }
        public required string[] TargetLayers { get; set; }
        public required int Priority { get; set; }
        public required DateTime RequestTime { get; set; }
        public string? RequestSource { get; set; }
        public Dictionary<string, object>? OperationConfig { get; set; }

        // Implementation-required properties from compilation errors
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Data { get; set; } = new();
    }

    public class MeshOperationResultDto
    {
        public required string OperationId { get; set; }
        public required bool Success { get; set; }
        public required Dictionary<string, object> Results { get; set; }
        public required List<string> ProcessedLayers { get; set; }
        public required DateTime CompletionTime { get; set; }
        public required DateTime ProcessingDuration { get; set; }  // Changed TimeSpan→DateTime

        // Properties required by implementation
        public required string OperationType { get; set; }
        public required DateTime ExecutionTime { get; set; }  // Changed TimeSpan→DateTime
        public required Dictionary<string, object> LayerResults { get; set; }
        public required double ValidationRingConsensus { get; set; }
        public required Dictionary<string, object> PerformanceMetrics { get; set; }
        public required Dictionary<string, object> ComplianceValidation { get; set; }

        public List<string>? Errors { get; set; }
        public Dictionary<string, object>? Metrics { get; set; }
        public double ConsensusLevel { get; set; } = 1.0;
    }

    public class MeshEnvelopeDto
    {
        public required string EnvelopeId { get; set; }
        public required string MessageType { get; set; }
        public required Dictionary<string, object> Payload { get; set; }
        public required string SourceLayer { get; set; }
        public required string[] TargetLayers { get; set; }
        public required DateTime Timestamp { get; set; }

        // Properties required by implementation
        public required string OperationId { get; set; }
        public required string OperationType { get; set; }
        public required int Priority { get; set; }

        public Dictionary<string, object>? Headers { get; set; }
        public string? EncryptionKey { get; set; }
    }

    public class MeshStatusDto
    {
        public required string MeshId { get; set; }
        public required string Status { get; set; }
        public required int ActiveLayers { get; set; }
        public required int TotalOperations { get; set; }
        public required DateTime LastUpdate { get; set; }
        public required Dictionary<string, object> LayerStatuses { get; set; }

        // Properties required by implementation
        public required string OverallStatus { get; set; }
        public required Dictionary<string, object> ValidationRings { get; set; }
        public required int ActiveCounties { get; set; }
        public required int TotalAgents { get; set; }
        public required double SystemHealth { get; set; }
        public required Dictionary<string, object> SystemMetrics { get; set; }

        public Dictionary<string, object>? MeshMetrics { get; set; }
    }

    #endregion

    #region Layer Health DTOs

    public class LayerHealthDto
    {
        public required int LayerId { get; set; }
        public required string LayerName { get; set; }
        public required string HealthStatus { get; set; }
        public required double HealthScore { get; set; }
        public required DateTime LastHealthCheck { get; set; }
        public required List<string> HealthIndicators { get; set; }

        // Properties required by implementation
        public required double OverallHealth { get; set; }
        public required double L1DataLayerHealth { get; set; }
        public required double L2AnalyticsLayerHealth { get; set; }
        public required double L3AIProcessingLayerHealth { get; set; }
        public required double L4DecisionLayerHealth { get; set; }
        public required double L5GovernanceLayerHealth { get; set; }
        public required double QuantumConsciousnessIntegrationHealth { get; set; }

        // Layer-specific health properties
        public double L1DataIngestionHealth { get; set; }
        public double L2AnalyticsHealth { get; set; }
        public double L3AIProcessingHealth { get; set; }
        public double L4DecisionHealth { get; set; }
        public double L5GovernanceHealth { get; set; }
        public required Dictionary<string, object> HealthTrends { get; set; }

        public List<string>? HealthIssues { get; set; }
        public Dictionary<string, object>? HealthMetrics { get; set; }
    }

    #endregion

    #region Performance DTOs

    public class MeshPerformanceDto
    {
        public required double Throughput { get; set; }
        public required double Latency { get; set; }
        public required double ResourceUtilization { get; set; }
        public required Dictionary<string, double> LayerPerformance { get; set; }
        public required DateTime MeasurementTime { get; set; }

        // Properties required by implementation
        public required Dictionary<string, object> ThroughputMetrics { get; set; }
        public required Dictionary<string, object> LatencyMetrics { get; set; }
        public required double QuantumConsciousnessPerformance { get; set; }
        public required double ValidationRingPerformance { get; set; }
        public required double CrossCountyFederationPerformance { get; set; }
        public required double PerformanceScore { get; set; }
        public required DateTime LastMeasurement { get; set; }
        public required Dictionary<string, object> PerformanceTrends { get; set; }
        public required List<string> OptimizationRecommendations { get; set; }

        public Dictionary<string, object>? PerformanceMetrics { get; set; }
    }

    #endregion

    #region Scaling DTOs

    public class MeshScalingRequestDto
    {
        public required string ScalingId { get; set; }
        public required string ScalingType { get; set; }
        public required Dictionary<string, object> ScalingConfig { get; set; }
        public required int TargetCapacity { get; set; }
        public required DateTime RequestTime { get; set; }
        public string? RequestSource { get; set; }
        public Dictionary<string, object>? ScalingOptions { get; set; }

        // Implementation-required properties from compilation errors
        public bool ScaleQuantumConsciousness { get; set; }
        public bool ScaleValidationRings { get; set; }
        public bool ScaleCountyFederation { get; set; }
        public bool ScaleLayers { get; set; }
        public List<string>? TargetLayers { get; set; }
    }

    public class MeshScalingResultDto
    {
        public required string ScalingId { get; set; }
        public required bool Success { get; set; }
        public required int NewCapacity { get; set; }
        public required DateTime ScalingDuration { get; set; }  // Changed TimeSpan→DateTime
        public required Dictionary<string, object> ScalingResults { get; set; }
        public required DateTime CompletionTime { get; set; }
        public List<string>? ScalingIssues { get; set; }
        public Dictionary<string, object>? ScalingMetrics { get; set; }

        // Implementation-required properties from compilation errors
        public string ScalingType { get; set; } = "Dynamic";
        public int TargetCapacity { get; set; }
        public int AchievedCapacity { get; set; }
        public DateTime ScalingTime { get; set; }  // Changed TimeSpan→DateTime
        public Dictionary<string, object> PostScalingMetrics { get; set; } = new();
        public Dictionary<string, object> NewConfiguration { get; set; } = new();
    }

    #endregion

    #region Configuration DTOs

    public class MeshConfigurationDto
    {
        public required string ConfigId { get; set; }
        public required Dictionary<string, object> LayerConfigs { get; set; }
        public required Dictionary<string, object> MeshSettings { get; set; }
        public required DateTime ConfigTime { get; set; }
        public string? ConfigSource { get; set; }
        public Dictionary<string, object>? AdvancedSettings { get; set; }

        // Implementation-required properties from compilation errors
        public Dictionary<string, object> LayerConfigurations { get; set; } = new();
        public Dictionary<string, object> ValidationRingConfiguration { get; set; } = new();
        public Dictionary<string, object> PerformanceConfiguration { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class MeshConfigurationUpdateDto
    {
        public required string UpdateId { get; set; }
        public required Dictionary<string, object> ConfigChanges { get; set; }
        public required string[] AffectedLayers { get; set; }
        public required DateTime UpdateTime { get; set; }
        public string? UpdateSource { get; set; }
        public Dictionary<string, object>? UpdateOptions { get; set; }

        // Implementation-required properties from compilation errors
        public string ConfigurationType { get; set; } = "General";
    }

    #endregion

    #region Dissent Handling DTOs

    public class RingDissentDto
    {
        public required string DissentId { get; set; }
        public required string RingId { get; set; }
        public required Dictionary<string, object> DissentData { get; set; }
        public required string DissentReason { get; set; }
        public required DateTime DissentTime { get; set; }
        public required string SeverityLevel { get; set; }
        public Dictionary<string, object>? DissentContext { get; set; }
    }

    public class DissentHandlingResultDto
    {
        public required string DissentId { get; set; }
        public required bool Resolved { get; set; }
        public required string Resolution { get; set; }
        public required Dictionary<string, object> ResolutionData { get; set; }
        public required DateTime ResolutionTime { get; set; }
        public List<string>? ResolutionSteps { get; set; }
        public Dictionary<string, object>? ResolutionMetrics { get; set; }
    }

    #endregion

    #region Compliance DTOs

    public class FISMAComplianceResultDto
    {
        public required bool IsCompliant { get; set; }
        public required Dictionary<string, object> ComplianceResults { get; set; }
        public required List<string> ComplianceIssues { get; set; }
        public required DateTime ComplianceCheckTime { get; set; }
        public required double ComplianceScore { get; set; }
        public Dictionary<string, object>? ComplianceMetrics { get; set; }
    }

    public class FedRAMPComplianceResultDto
    {
        public required bool IsCompliant { get; set; }
        public required Dictionary<string, object> ComplianceResults { get; set; }
        public required List<string> ComplianceIssues { get; set; }
        public required DateTime ComplianceCheckTime { get; set; }
        public required double ComplianceScore { get; set; }
        public Dictionary<string, object>? ComplianceMetrics { get; set; }
    }

    public class SOC2ComplianceResultDto
    {
        public required bool IsCompliant { get; set; }
        public required Dictionary<string, object> ComplianceResults { get; set; }
        public required List<string> ComplianceIssues { get; set; }
        public required DateTime ComplianceCheckTime { get; set; }
        public required double ComplianceScore { get; set; }
        public Dictionary<string, object>? ComplianceMetrics { get; set; }
    }

    public class ComplianceReportDto
    {
        public required FISMAComplianceResultDto FISMACompliance { get; set; }
        public required FedRAMPComplianceResultDto FedRAMPCompliance { get; set; }
        public required SOC2ComplianceResultDto SOC2Compliance { get; set; }
        public required DateTime ReportTime { get; set; }
        public Dictionary<string, object>? ReportMetrics { get; set; }
    }

    public class FederatedComplianceResultDto
    {
        public required bool IsCompliant { get; set; }
        public required Dictionary<string, object> ComplianceResults { get; set; }
        public required List<string> ComplianceIssues { get; set; }
        public required DateTime ComplianceCheckTime { get; set; }

        // Properties required by implementation
        public required double OverallScore { get; set; }
        public required double PrivacyCompliance { get; set; }
        public required double DataSovereigntyCompliance { get; set; }
        public required double SecurityCompliance { get; set; }
        public required double EthicalAICompliance { get; set; }
        public required DateTime LastAudit { get; set; }
        public required List<string> ComplianceGuarantees { get; set; }

        public Dictionary<string, object>? ComplianceMetrics { get; set; }
    }

    #endregion

    #region Consciousness DTOs

    public class EnhancedConsciousnessDataDto
    {
        public required string ConsciousnessId { get; set; }
        public required Dictionary<string, object> ConsciousnessData { get; set; }
        public required string ConsciousnessLevel { get; set; }
        public required DateTime DataTime { get; set; }
        public Dictionary<string, object>? ConsciousnessMetrics { get; set; }
    }

    public class ConsciousnessModeRequestDto
    {
        public required string ModeId { get; set; }
        public required string RequestedMode { get; set; }
        public required Dictionary<string, object> ModeConfig { get; set; }
        public required DateTime RequestTime { get; set; }
        public Dictionary<string, object>? ModeOptions { get; set; }
    }

    public class ConsciousnessModeDto
    {
        public required string ModeId { get; set; }
        public required string CurrentMode { get; set; }
        public required Dictionary<string, object> ModeData { get; set; }
        public required DateTime ModeTime { get; set; }
        public Dictionary<string, object>? ModeMetrics { get; set; }
    }

    public class HybridSystemStatusDto
    {
        public required string SystemId { get; set; }
        public required string Status { get; set; }
        public required Dictionary<string, object> SystemData { get; set; }
        public required DateTime StatusTime { get; set; }
        public Dictionary<string, object>? SystemMetrics { get; set; }
    }

    #endregion

    #region AI Service DTOs

    public class AIOrchestrationRequestDto
    {
        public required string OrchestrationId { get; set; }
        public required string RequestType { get; set; }
        public required Dictionary<string, object> RequestData { get; set; }
        public required DateTime RequestTime { get; set; }
        public Dictionary<string, object>? RequestOptions { get; set; }
    }

    public class AIOrchestrationResultDto
    {
        public required string OrchestrationId { get; set; }
        public required bool Success { get; set; }
        public required Dictionary<string, object> Results { get; set; }
        public required DateTime CompletionTime { get; set; }
        public Dictionary<string, object>? OrchestrationMetrics { get; set; }
    }

    public class AIServiceHealthDto
    {
        public required string ServiceId { get; set; }
        public required string HealthStatus { get; set; }
        public required double HealthScore { get; set; }
        public required DateTime HealthCheckTime { get; set; }
        public Dictionary<string, object>? HealthMetrics { get; set; }
    }

    public class AICoordinationRequestDto
    {
        public required string CoordinationId { get; set; }
        public required string RequestType { get; set; }
        public required Dictionary<string, object> RequestData { get; set; }
        public required DateTime RequestTime { get; set; }
        public Dictionary<string, object>? CoordinationOptions { get; set; }
    }

    public class AICoordinationResultDto
    {
        public required string CoordinationId { get; set; }
        public required bool Success { get; set; }
        public required Dictionary<string, object> Results { get; set; }
        public required DateTime CompletionTime { get; set; }
        public Dictionary<string, object>? CoordinationMetrics { get; set; }
    }

    #endregion

    #region Additional Missing DTOs

    public class MeshInitializationResultDto
    {
        public required bool Success { get; set; }
        public required List<string> InitializedLayers { get; set; }
        public required List<string> FailedLayers { get; set; }
        public required Dictionary<string, object> InitializationMetrics { get; set; }
        public required DateTime InitializationTime { get; set; }
        public List<string>? Errors { get; set; }
        public Dictionary<string, object>? LayerConfigs { get; set; }

        // Implementation-required properties from compilation errors
        public int LayersInitialized { get; set; }
        public int ValidationRingsActive { get; set; }
        public int FederatedCounties { get; set; }
        public bool QuantumConsciousnessIntegrated { get; set; }
        public string NATSJetStreamStatus { get; set; } = "Connected";
        public string MCPGatewayStatus { get; set; } = "Operational";
        public bool PerformanceBaselineEstablished { get; set; }
        public List<string> InitializationMessages { get; set; } = new();
    }

    public class ComplianceMonitoringDto
    {
        public required string MonitoringId { get; set; }
        public required string ComplianceType { get; set; }
        public required bool IsCompliant { get; set; }
        public required Dictionary<string, object> MonitoringResults { get; set; }
        public required DateTime MonitoringTime { get; set; }
        public List<string>? ComplianceIssues { get; set; }
        public Dictionary<string, object>? MonitoringMetrics { get; set; }
    }

    public class FederatedCountyInfo
    {
        public required string CountyId { get; set; }
        public required string CountyName { get; set; }
        public required string FederationStatus { get; set; }
        public required Dictionary<string, object> CountyData { get; set; }
        public required DateTime LastSync { get; set; }

        // Properties required by implementation
        public required string StateName { get; set; }
        public required string NodeId { get; set; }
        public required string Status { get; set; }
        public required List<string> MeshCapabilities { get; set; }
        public required string PrivacyLevel { get; set; }
        public required DateTime LastHealthCheck { get; set; }
        public required Dictionary<string, object> DataSovereignty { get; set; }

        public Dictionary<string, object>? CountyMetrics { get; set; }
        public List<string>? AvailableServices { get; set; }
    }

    #endregion
}