namespace TerraFusion.Core.Operations;

/// <summary>
/// The origin of an operation — who or what initiated it.
/// </summary>
public enum OperationSource
{
    UI_WORKBENCH,
    CLI_OPERATOR,
    AI_PILOT
}

/// <summary>
/// Operation status after TruthGate evaluation.
/// </summary>
public enum OperationOutcome
{
    Executed,
    Staged,
    Blocked
}

/// <summary>
/// Canonical operation envelope for the sovereign spine.
/// Every governed mutation flows through this contract.
/// </summary>
public interface ITerraOperation
{
    /// <summary>Unique operation identifier.</summary>
    string IntentId { get; }

    /// <summary>Who or what initiated this operation.</summary>
    OperationSource Source { get; }

    /// <summary>What this operation intends to do.</summary>
    string Intent { get; }

    /// <summary>County scope — required for all operations.</summary>
    string CountyId { get; }

    /// <summary>Actor identity — who is performing the operation.</summary>
    string ActorId { get; }

    /// <summary>ISO timestamp of when the intent was declared.</summary>
    DateTime Timestamp { get; }

    /// <summary>Human approver ID — required for AI_PILOT mutations (Phase 10+).</summary>
    string? HumanApproverId { get; }
}

/// <summary>
/// Result after TruthGate evaluation.
/// </summary>
public class TerraOperationResult
{
    public required string IntentId { get; init; }
    public required OperationOutcome Outcome { get; init; }
    public string? Reason { get; init; }
    public required string TraceId { get; init; }
}
