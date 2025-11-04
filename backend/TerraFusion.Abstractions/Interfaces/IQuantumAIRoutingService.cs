using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces;

/// <summary>
/// Quantum AI Routing Service Interface
/// Provides intelligent routing capabilities using quantum-enhanced algorithms
/// </summary>
public interface IQuantumAIRoutingService
{
    /// <summary>
    /// Makes a quantum-enhanced routing decision for a request
    /// </summary>
    /// <param name="requestContext">Request context information</param>
    /// <returns>Routing decision</returns>
    Task<RoutingDecision> MakeRoutingDecisionAsync(RequestContext requestContext);

    /// <summary>
    /// Gets optimal service instance for a request
    /// </summary>
    /// <param name="serviceName">Service name to route to</param>
    /// <param name="context">Request context</param>
    /// <returns>Optimal service instance</returns>
    Task<ServiceInstance> GetOptimalServiceInstanceAsync(string serviceName, RequestContext context);

    /// <summary>
    /// Updates routing performance metrics
    /// </summary>
    /// <param name="routingId">Routing decision ID</param>
    /// <param name="performance">Performance metrics</param>
    /// <returns>Task</returns>
    Task UpdateRoutingPerformanceAsync(string routingId, RoutingPerformance performance);
}

/// <summary>
/// Request context for routing decisions
/// </summary>
public class RequestContext
{
    public string RequestId { get; set; } = Guid.NewGuid().ToString();
    public string Path { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public Dictionary<string, string> Headers { get; set; } = new();
    public string UserAgent { get; set; } = string.Empty;
    public string ClientIP { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Routing decision result
/// </summary>
public class RoutingDecision
{
    public string RoutingId { get; set; } = Guid.NewGuid().ToString();
    public string SelectedServiceInstance { get; set; } = string.Empty;
    public string TargetAddress { get; set; } = string.Empty;
    public int TargetPort { get; set; }
    public double ConfidenceScore { get; set; }
    public string RoutingReason { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
    public DateTime DecisionTime { get; set; } = DateTime.UtcNow;
    public TimeSpan EstimatedResponseTime { get; set; }
}

/// <summary>
/// Service instance information
/// </summary>
public class ServiceInstance
{
    public string InstanceId { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int Port { get; set; }
    public double HealthScore { get; set; } = 1.0;
    public double LoadScore { get; set; } = 0.0;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Routing performance metrics
/// </summary>
public class RoutingPerformance
{
    public string RoutingId { get; set; } = string.Empty;
    public TimeSpan ActualResponseTime { get; set; }
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public Dictionary<string, object> Metrics { get; set; } = new();
}