using System;
using System.Collections.Generic;

namespace TerraFusion.Abstractions.DTOs.Workbench;

/// <summary>
/// Slice OPS-1-A: top-level Sync Readiness Console response DTO. Pure
/// data shape consumed by the Workbench/Studio frontend per the
/// OPS-1 policy at
/// <c>docs/workbench/sync-readiness-console-policy.md</c>.
///
/// <para>The DTO is sanitized by construction — every field is
/// metadata (counts, timestamps, status enums, county/connection
/// identifiers). No secrets. No PII. The frontend renders the six
/// pinned questions directly from these fields.</para>
///
/// <para>Status values are stringly-typed for forward-compat
/// (frontends can render unknown values as
/// <see cref="SyncReadinessStatus.Unknown"/>); see
/// <see cref="SyncReadinessStatus"/> for the closed set.</para>
/// </summary>
public sealed class SyncReadinessDto
{
    /// <summary>The county scope of this readiness response.</summary>
    public Guid CountyId { get; set; }

    /// <summary>The PACS source connection inspected.</summary>
    public Guid SourceConnectionId { get; set; }

    /// <summary>The Mapping Workbook used as scope context.</summary>
    public Guid? WorkbookId { get; set; }

    /// <summary>UTC timestamp of when this DTO was assembled.</summary>
    public DateTime AssembledAtUtc { get; set; }

    /// <summary>Question 1 — is the PACS connection reachable?</summary>
    public SyncReadinessPanelDto Reachability { get; set; } = new();

    /// <summary>Question 2 — is the schema catalog healthy?</summary>
    public SyncReadinessPanelDto CatalogHealth { get; set; } = new();

    /// <summary>Question 3 — are invariants clean?</summary>
    public SyncReadinessPanelDto Invariants { get; set; } = new();

    /// <summary>Question 4 — are dictionary preflights clean?</summary>
    public SyncReadinessPanelDto Preflights { get; set; } = new();

    /// <summary>Question 5 — is the canonical landing in sync with PACS?</summary>
    public SyncReadinessPanelDto Coverage { get; set; } = new();

    /// <summary>Question 6 — last-successful-proof timestamps per surface.</summary>
    public SyncReadinessLastProofDto LastProof { get; set; } = new();
}

/// <summary>
/// Per-panel status block. Each of the five status questions
/// (1-5) emits one of these.
/// </summary>
public sealed class SyncReadinessPanelDto
{
    /// <summary>YES / WARN / NO / UNKNOWN per the OPS-1 policy.</summary>
    public string Status { get; set; } = SyncReadinessStatus.Unknown;

    /// <summary>One-line operator-readable summary.</summary>
    public string Headline { get; set; } = string.Empty;

    /// <summary>
    /// Optional one-line context string (e.g. counts, run-id,
    /// timestamp). Sanitized — never contains row data, secrets, or
    /// PII.
    /// </summary>
    public string? Detail { get; set; }

    /// <summary>UTC timestamp of the underlying capture; null if no capture.</summary>
    public DateTime? CapturedAtUtc { get; set; }

    /// <summary>
    /// Source surface name for telemetry / debugging
    /// (e.g. "schema-catalog-health", "preflight-evidence").
    /// </summary>
    public string Source { get; set; } = string.Empty;
}

/// <summary>
/// Question 6 — last successful proof timestamp per diagnostic
/// surface. Each value is a UTC timestamp string ("never" sentinel
/// when no proof exists).
/// </summary>
public sealed class SyncReadinessLastProofDto
{
    public string CatalogHealth { get; set; } = "never";
    public string InvariantArtifact { get; set; } = "never";
    public string PreflightEvidence { get; set; } = "never";
    public string CoverageReport { get; set; } = "never";
}

/// <summary>
/// Closed status set per the OPS-1 policy. Strings (not an enum)
/// for forward-compat; the frontend treats unknown values as
/// <see cref="Unknown"/>.
/// </summary>
public static class SyncReadinessStatus
{
    public const string Yes = "YES";
    public const string Warn = "WARN";
    public const string No = "NO";
    public const string Unknown = "UNKNOWN";

    public static readonly IReadOnlyCollection<string> All =
        new[] { Yes, Warn, No, Unknown };
}
