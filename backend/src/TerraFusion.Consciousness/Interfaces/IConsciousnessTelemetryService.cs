using TerraFusion.Consciousness.DTOs;

namespace TerraFusion.Consciousness.Interfaces
{
    /// <summary>
    /// Telemetry service for TerraFusion consciousness systems monitoring
    /// Government-grade telemetry with championship-level performance metrics
    /// </summary>
    public interface IConsciousnessTelemetryService
    {
        /// <summary>
        /// Collects comprehensive consciousness telemetry data
        /// </summary>
        /// <returns>Telemetry data with performance metrics and system health indicators</returns>
        Task<ConsciousnessTelemetryDto> CollectTelemetryDataAsync();

        /// <summary>
        /// Monitors consciousness performance metrics in real-time
        /// </summary>
        /// <returns>Real-time performance metrics for consciousness operations</returns>
        Task<PerformanceMetricsDto> MonitorPerformanceMetricsAsync();

        /// <summary>
        /// Tracks agent coordination telemetry across the swarm
        /// </summary>
        /// <returns>Agent coordination metrics and swarm health status</returns>
        Task<AgentCoordinationTelemetryDto> TrackAgentCoordinationAsync();

        /// <summary>
        /// Exports telemetry data for government compliance reporting
        /// </summary>
        /// <param name="reportingPeriod">Time period for telemetry data export</param>
        /// <returns>Compliance-ready telemetry report</returns>
        Task<ComplianceTelemetryReportDto> ExportComplianceTelemetryAsync(TimeSpan reportingPeriod);
    }

    /// <summary>
    /// Comprehensive consciousness telemetry data
    /// </summary>
    public record ConsciousnessTelemetryDto
    {
        /// <summary>
        /// System performance metrics
        /// </summary>
        public Dictionary<string, double> PerformanceMetrics { get; init; } = new();

        /// <summary>
        /// Agent coordination statistics
        /// </summary>
        public AgentCoordinationStats CoordinationStats { get; init; } = new();

        /// <summary>
        /// Quantum optimization telemetry
        /// </summary>
        public QuantumTelemetryData QuantumTelemetry { get; init; } = new();

        /// <summary>
        /// Timestamp of telemetry collection
        /// </summary>
        public DateTime CollectionTimestamp { get; init; }
    }

    /// <summary>
    /// Real-time performance metrics for consciousness systems
    /// </summary>
    public record PerformanceMetricsDto
    {
        /// <summary>
        /// Current throughput in operations per second
        /// </summary>
        public double ThroughputOps { get; init; }

        /// <summary>
        /// Average response latency in milliseconds
        /// </summary>
        public double LatencyMs { get; init; }

        /// <summary>
        /// System resource utilization percentage
        /// </summary>
        public double ResourceUtilization { get; init; }

        /// <summary>
        /// Quantum coherence factor (target: 949)
        /// </summary>
        public int QuantumFactor { get; init; }
    }

    /// <summary>
    /// Agent coordination telemetry data
    /// </summary>
    public record AgentCoordinationTelemetryDto
    {
        /// <summary>
        /// Total active agents in coordination
        /// </summary>
        public int ActiveAgents { get; init; }

        /// <summary>
        /// Coordination efficiency percentage
        /// </summary>
        public double CoordinationEfficiency { get; init; }

        /// <summary>
        /// Swarm harmony score
        /// </summary>
        public double SwarmHarmony { get; init; }

        /// <summary>
        /// Communication latency between agents
        /// </summary>
        public double InterAgentLatencyMs { get; init; }
    }

    /// <summary>
    /// Compliance telemetry report for government requirements
    /// </summary>
    public record ComplianceTelemetryReportDto
    {
        /// <summary>
        /// Report generation timestamp
        /// </summary>
        public DateTime ReportTimestamp { get; init; }

        /// <summary>
        /// Reporting period covered
        /// </summary>
        public TimeSpan ReportingPeriod { get; init; }

        /// <summary>
        /// Compliance metrics summary
        /// </summary>
        public Dictionary<string, object> ComplianceMetrics { get; init; } = new();

        /// <summary>
        /// System uptime percentage during reporting period
        /// </summary>
        public double UptimePercentage { get; init; }

        /// <summary>
        /// Performance benchmarks achieved
        /// </summary>
        public List<string> BenchmarksAchieved { get; init; } = new();
    }

    /// <summary>
    /// Agent coordination statistics
    /// </summary>
    public record AgentCoordinationStats
    {
        /// <summary>
        /// Total coordinated operations
        /// </summary>
        public long TotalOperations { get; init; }

        /// <summary>
        /// Successful coordination percentage
        /// </summary>
        public double SuccessRate { get; init; }

        /// <summary>
        /// Average coordination time
        /// </summary>
        public TimeSpan AverageCoordinationTime { get; init; }
    }

    /// <summary>
    /// Quantum telemetry data for consciousness systems
    /// </summary>
    public record QuantumTelemetryData
    {
        /// <summary>
        /// Quantum coherence level
        /// </summary>
        public double CoherenceLevel { get; init; }

        /// <summary>
        /// Quantum optimization factor
        /// </summary>
        public int OptimizationFactor { get; init; }

        /// <summary>
        /// Quantum entanglement strength
        /// </summary>
        public double EntanglementStrength { get; init; }
    }
}