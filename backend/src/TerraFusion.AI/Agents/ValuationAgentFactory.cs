// BIV-173 — Valuation Agent Factory: DI-based factory for specialised agents
using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Types;

namespace TerraFusion.AI.Agents;

/// <summary>Supported valuation agent specialisations.</summary>
public enum AgentType
{
    /// <summary>Sales comparison approach agent.</summary>
    SalesComparison,

    /// <summary>Cost approach agent.</summary>
    CostApproach,

    /// <summary>Income capitalisation approach agent.</summary>
    IncomeApproach,

    /// <summary>Mass appraisal regression agent (OLS / GWR / quantile / spatial).</summary>
    MassAppraisal,

    /// <summary>Automated valuation model agent.</summary>
    AVM
}

/// <summary>
/// Factory abstraction for creating specialised <see cref="IValuationAgent"/> instances.
/// </summary>
public interface IValuationAgentFactory
{
    /// <summary>
    /// Create a valuation agent configured for the given <paramref name="agentType"/>.
    /// </summary>
    IValuationAgent CreateAgent(AgentType agentType);
}

/// <summary>
/// Default factory implementation that resolves agents through the DI container
/// and applies methodology-specific configuration.
/// </summary>
public sealed class ValuationAgentFactory : IValuationAgentFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ValuationAgentFactory> _logger;

    public ValuationAgentFactory(IServiceProvider serviceProvider, ILogger<ValuationAgentFactory> logger)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public IValuationAgent CreateAgent(AgentType agentType)
    {
        _logger.LogInformation("Creating valuation agent for {AgentType}", agentType);

        var config = BuildConfig(agentType);
        var agentLogger = _serviceProvider.GetRequiredService<ILogger<ValuationAgent>>();

        return new ValuationAgent(agentLogger, config);
    }

    /// <summary>Build a methodology-specific configuration.</summary>
    private static ValuationAgentConfig BuildConfig(AgentType agentType)
    {
        var method = agentType switch
        {
            AgentType.SalesComparison => new ValuationMethodConfig(
                "SalesComparison",
                Enabled: true,
                Weight: 0.35,
                MinComparables: 3,
                MaxComparables: 10,
                MaxAdjustmentPct: 25.0),

            AgentType.CostApproach => new ValuationMethodConfig(
                "CostApproach",
                Enabled: true,
                Weight: 0.25,
                MinComparables: 0,
                MaxComparables: 0,
                MaxAdjustmentPct: 0),

            AgentType.IncomeApproach => new ValuationMethodConfig(
                "IncomeApproach",
                Enabled: true,
                Weight: 0.20,
                MinComparables: 0,
                MaxComparables: 0,
                MaxAdjustmentPct: 0),

            AgentType.MassAppraisal => new ValuationMethodConfig(
                "MassAppraisal_OLS",
                Enabled: true,
                Weight: 0.40,
                MinComparables: 0,
                MaxComparables: 0,
                MaxAdjustmentPct: 0),

            AgentType.AVM => new ValuationMethodConfig(
                "AVM",
                Enabled: true,
                Weight: 0.30,
                MinComparables: 5,
                MaxComparables: 20,
                MaxAdjustmentPct: 30.0),

            _ => throw new ArgumentOutOfRangeException(nameof(agentType), agentType, "Unsupported agent type.")
        };

        return ValuationAgentConfig.Default with
        {
            PrimaryMethodology = method.Name,
            Methods = new[] { method }
        };
    }
}
