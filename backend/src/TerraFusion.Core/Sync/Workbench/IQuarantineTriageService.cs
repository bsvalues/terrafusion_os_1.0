using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Workbench;

/// <summary>
/// SYNC-WORKBENCH-F: improvement-attribute quarantine triage service.
///
/// <para>Provides three operator surfaces:</para>
/// <list type="number">
///   <item><see cref="ListAsync"/> — paged list of quarantined
///   imprv_attr rows joined with their (optional) triage decisions.</item>
///   <item><see cref="RouteAsync"/> — record an operator's decision
///   to route a quarantined row to a target universe / dictionary code.</item>
///   <item><see cref="DismissAsync"/> — record an operator's decision
///   to dismiss a quarantined row as noise / legitimately-missing /
///   conversion artifact.</item>
/// </list>
///
/// <para>Idempotency: a same-target re-route or same-reason
/// re-dismiss is a no-op (returns <see cref="TriageOutcome.Ok"/>
/// with the existing decision). Cross-branch transitions
/// (Routed→Dismissed or Dismissed→Routed) and same-branch divergent
/// targets surface as <see cref="TriageOutcome.Conflict"/>.</para>
/// </summary>
public interface IQuarantineTriageService
{
    Task<QuarantineListResult> ListAsync(
        QuarantineListRequest request,
        CancellationToken cancellationToken = default);

    Task<RouteDecisionResult> RouteAsync(
        Guid unprovenRowId,
        RouteRequest request,
        CancellationToken cancellationToken = default);

    Task<DismissDecisionResult> DismissAsync(
        Guid unprovenRowId,
        DismissRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>Discriminator over service-layer outcomes mapped 1:1 to HTTP status by the controller.</summary>
public enum TriageOutcome
{
    Ok,
    InvalidInput,
    NotFound,
    Conflict,
}

// ── List ─────────────────────────────────────────────────────────────

public sealed record QuarantineListRequest(
    string? Reason,
    string? Universe,
    int? PropId,
    int Limit,
    int Offset);

public sealed record QuarantineListResult(
    TriageOutcome Outcome,
    string? ErrorMessage,
    IReadOnlyList<QuarantineRow> Items,
    int Limit,
    int Offset);

/// <summary>
/// Quarantine row joined with optional triage row. <c>TriageStatus</c>
/// is <c>"Open"</c> for any quarantine row without a triage decision.
/// </summary>
public sealed record QuarantineRow(
    Guid UnprovenRowId,
    int PropId,
    short PropValYr,
    short SupNum,
    long ImprvId,
    long ImprvDetId,
    long IAttrValId,
    string IAttrValCd,
    string? AttrValueText,
    decimal? AttrValueNumeric,
    string QuarantineReason,
    string? QuarantineReasonDetail,
    string? UniverseCode,
    DateTime CreatedAt,
    string TriageStatus,
    string? SuggestedReroute);

// ── Route ────────────────────────────────────────────────────────────

public sealed record RouteRequest(
    string TargetUniverse,
    string? TargetIAttrValCd,
    string? OperatorNote);

public sealed record RouteDecisionResult(
    TriageOutcome Outcome,
    string? ErrorMessage,
    RouteDecisionPayload? Payload);

public sealed record RouteDecisionPayload(
    Guid TriageId,
    Guid UnprovenRowId,
    string Status,
    string RoutedToUniverse,
    string? RoutedToIAttrValCd,
    DateTime UpdatedAt);

// ── Dismiss ──────────────────────────────────────────────────────────

public sealed record DismissRequest(
    string DismissalReason,
    string? OperatorNote);

public sealed record DismissDecisionResult(
    TriageOutcome Outcome,
    string? ErrorMessage,
    DismissDecisionPayload? Payload);

public sealed record DismissDecisionPayload(
    Guid TriageId,
    Guid UnprovenRowId,
    string Status,
    string DismissalReason,
    DateTime UpdatedAt);

/// <summary>Closed vocabulary for the triage Status column.</summary>
public static class TriageStatuses
{
    public const string Open = "Open";
    public const string Routed = "Routed";
    public const string Dismissed = "Dismissed";
}

/// <summary>Closed vocabulary for <see cref="DismissRequest.DismissalReason"/>.</summary>
public static class TriageDismissalReasons
{
    public const string IntentionalNoise = "IntentionalNoise";
    public const string LegitimateMissing = "LegitimateMissing";
    public const string ConversionArtifact = "ConversionArtifact";

    public static IReadOnlySet<string> All { get; } = new HashSet<string>
    {
        IntentionalNoise,
        LegitimateMissing,
        ConversionArtifact,
    };

    public static bool IsKnown(string? value) =>
        !string.IsNullOrEmpty(value) && All.Contains(value);
}
