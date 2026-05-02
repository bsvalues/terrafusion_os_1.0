using System;
using System.Collections.Generic;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice BENTON-SYNC-7-B: structured coverage-continuity report for a
/// single SyncAtlas <c>--qualify-sales-coverage</c> run. Logical shape
/// pinned by
/// <c>docs/sync/sales-qualification-coverage-continuity-smoke-policy.md</c>
/// (BENTON-SYNC-7-A).
///
/// <para>Pure data; no behavior. Read-only smoke output. Per-row
/// samples are bounded at 50 entries each per the BENTON-SYNC-7-A
/// "bounded samples" rule.</para>
/// </summary>
public sealed record SalesQualificationCoverageReport(
    string SchemaVersion,
    string RunId,
    Guid CountyId,
    Guid WorkbookId,
    Guid SourceConnectionId,
    SalesQualificationCoveragePacsScope PacsScope,
    SalesQualificationCoverageCanonicalScope CanonicalScope,
    SalesQualificationCoverageGap ForwardCoverageGap,
    SalesQualificationCoverageGap BackwardTraceabilityGap,
    SalesQualificationCoverageGap DecisionDrift,
    SalesQualificationCoverageVerdict Verdict);

/// <summary>PACS-side scan counts.</summary>
public sealed record SalesQualificationCoveragePacsScope(
    int RowsScanned,
    int? MaxSalesApplied,
    int RowsWithChgOfOwnerId);

/// <summary>Canonical-landing-side decision counts for the county.</summary>
public sealed record SalesQualificationCoverageCanonicalScope(
    int RowCount,
    int QualifiedCount,
    int ExcludedCount,
    int InconclusiveCount);

/// <summary>
/// One gap bucket. <see cref="Sample"/> is capped at the
/// <see cref="SalesQualificationCoverageReport"/> sample-cap (50
/// entries) per BENTON-SYNC-7-A; <see cref="Count"/> reports the full
/// (possibly larger) total.
/// </summary>
public sealed record SalesQualificationCoverageGap(
    int Count,
    bool IsConclusive,
    IReadOnlyList<SalesQualificationCoverageGapEntry> Sample);

/// <summary>One forensic row inside a gap bucket. PII-safe by construction.</summary>
public sealed record SalesQualificationCoverageGapEntry(
    int? ChgOfOwnerId,
    string? CanonicalStatus,
    string? FreshStatus);

/// <summary>Top-level verdict; <see cref="IsClean"/> is true iff all three gap counts are 0.</summary>
public sealed record SalesQualificationCoverageVerdict(
    bool IsClean,
    string Summary);
