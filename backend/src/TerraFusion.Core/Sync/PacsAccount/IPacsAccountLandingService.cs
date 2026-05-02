using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsAccount;

/// <summary>
/// Slice B1-A: PACS account raw landing orchestrator.
///
/// <para>Doctrine: this service does NOT promote into
/// <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The
/// <c>account-acct-id-uniqueness</c> gate enforces source-side
/// PK uniqueness so downstream consumers can use <c>acct_id</c> as
/// a join key without a cross-row dedupe. PII is preserved verbatim
/// at this layer; redaction is the canonical-layer's responsibility.</para>
/// </summary>
public interface IPacsAccountLandingService
{
    Task<PacsAccountLandingResult> LandAccountsAsync(
        IPacsAccountSource source,
        string operatorName,
        CancellationToken cancellationToken = default);
}

/// <summary>Slice B1-A: outcome of one landing run.</summary>
public sealed record PacsAccountLandingResult
{
    public required Guid LoadBatchId { get; init; }

    /// <summary>'COMPLETED' | 'FAILED'.</summary>
    public required string Status { get; init; }

    public required int RowsLanded { get; init; }

    /// <summary>
    /// Count of <c>acct_id</c> values that appeared more than once
    /// in this batch. The doctrine: must be 0 for the
    /// <c>account-acct-id-uniqueness</c> gate to PASS.
    /// </summary>
    public required int DuplicateAcctIdViolations { get; init; }

    /// <summary>Rows where <see cref="LegacyPacsRaw.LegacyPacsRawAccount.ConfidentialFlag"/> is true.</summary>
    public required int ConfidentialCount { get; init; }

    /// <summary>Rows where <see cref="LegacyPacsRaw.LegacyPacsRawAccount.WebSuppression"/> is true.</summary>
    public required int WebSuppressedCount { get; init; }

    public string? ErrorSummary { get; init; }
}
