using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice BENTON-SYNC-7-B implementation. See
/// <see cref="ISalesQualificationCoverageRunner"/> for the contract.
///
/// <para>Composition mirrors the C8-C
/// <see cref="SalesQualificationSampleRunner"/> seam (DbContext +
/// workbook read model + sales row reader) plus a direct EF read
/// against <c>CanonicalSaleQualifications</c>.</para>
///
/// <para>Order of operations per the BENTON-SYNC-7-A policy:</para>
/// <list type="number">
/// <item>Validate args.</item>
/// <item>Look up the source connection (county-scoped).</item>
/// <item>Load the workbook through <c>LoadMappedAsync</c>. Fails
/// closed before any PACS / canonical read if the workbook isn't
/// <c>Mapped</c>.</item>
/// <item>Cross-county guard: workbook's CountyId must match the
/// supplied CountyId.</item>
/// <item>Read PACS rows (bounded by <c>maxSales</c> or
/// <c>int.MaxValue</c>) via the row reader.</item>
/// <item>Run C8-B transform fresh on each PACS row to compute the
/// fresh canonical-equivalent decision.</item>
/// <item>Read all <c>CanonicalSaleQualifications</c> rows for the
/// county from the canonical landing.</item>
/// <item>Compute the three gap classes (forward / backward /
/// drift) per the BENTON-SYNC-7-A policy.</item>
/// <item>Return a <see cref="SalesQualificationCoverageReport"/>
/// with bounded 50-row samples per gap bucket.</item>
/// </list>
/// </summary>
public sealed class SqlSalesQualificationCoverageRunner : ISalesQualificationCoverageRunner
{
    /// <summary>Per-bucket sample cap per BENTON-SYNC-7-A.</summary>
    public const int SampleCap = 50;

    private readonly TerraFusionDbContext _db;
    private readonly ISyncMappingWorkbookReadModel _readModel;
    private readonly ISalesRowReader _salesReader;

    public SqlSalesQualificationCoverageRunner(
        TerraFusionDbContext db,
        ISyncMappingWorkbookReadModel readModel,
        ISalesRowReader salesReader)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(readModel);
        ArgumentNullException.ThrowIfNull(salesReader);
        _db = db;
        _readModel = readModel;
        _salesReader = salesReader;
    }

    public async Task<SalesQualificationCoverageReport> RunAsync(
        Guid countyId,
        Guid workbookId,
        Guid sourceConnectionId,
        int? maxSales,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        if (sourceConnectionId == Guid.Empty)
            throw new ArgumentException("SourceConnectionId is required.", nameof(sourceConnectionId));
        if (maxSales is { } cap && cap <= 0)
            throw new ArgumentException("MaxSales must be positive when set.", nameof(maxSales));

        // 1. Source connection lookup — county-scoped.
        var connection = await _db.SyncSourceConnections
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.Id == sourceConnectionId && c.CountyId == countyId,
                cancellationToken)
            .ConfigureAwait(false);
        if (connection is null)
        {
            throw new InvalidOperationException(
                $"SyncSourceConnection {sourceConnectionId} not found for county {countyId}.");
        }
        if (!connection.IsActive)
        {
            throw new InvalidOperationException(
                $"SyncSourceConnection '{connection.Name}' is not active.");
        }

        // 2. Mapped workbook load — Status guard fires here, BEFORE any
        //    PACS query OR canonical read. Draft / Approved / Archived
        //    workbooks all surface as InvalidOperationException.
        var snapshot = await _readModel
            .LoadMappedAsync(countyId, workbookId, cancellationToken)
            .ConfigureAwait(false);

        // 3. Cross-county guard — defensive even though LoadMappedAsync
        //    is already county-filtered.
        if (snapshot.CountyId != countyId)
        {
            throw new InvalidOperationException(
                $"Workbook {workbookId} is bound to county {snapshot.CountyId}; " +
                $"the smoke was invoked with --county-id {countyId}. " +
                "Cross-county runs are rejected per BENTON-SYNC-7-A county-scoped guard.");
        }

        // 4. Bounded PACS read. null maxSales → effectively unbounded
        //    (the SqlServerSalesRowReader uses TOP-N internally).
        var rowsScanned = await _salesReader
            .ReadAsync(connection, maxSales ?? int.MaxValue, cancellationToken)
            .ConfigureAwait(false);

        // 5. Compute fresh transform decision per row, indexed by
        //    ChgOfOwnerId (only rows with a non-null id can be
        //    persisted; null-id rows are C36's
        //    SkippedNoIdentifierCount and are NOT compared against
        //    canonical landing).
        var freshByChgOfOwnerId = new Dictionary<int, SalesQualificationDecisionStatus>(
            capacity: rowsScanned.Count);
        var rowsWithId = 0;
        foreach (var row in rowsScanned)
        {
            if (row.ChgOfOwnerId is not int id) continue;
            var decision = SalesQualificationTransform.Qualify(
                snapshot,
                new SalesQualificationSource(row.WacCode, row.SaleRatioTypeCode));
            // First-write wins on duplicate ChgOfOwnerId in the source —
            // PACS shouldn't produce duplicates but the smoke is
            // defensive; subsequent duplicates are dropped silently
            // because the canonical landing's PK enforces uniqueness
            // anyway.
            freshByChgOfOwnerId.TryAdd(id, decision.DecisionStatus);
            rowsWithId++;
        }

        // 6. Read all canonical rows for this county.
        var canonicalRows = await _db.Set<CanonicalSaleQualification>()
            .AsNoTracking()
            .Where(c => c.CountyId == countyId)
            .Select(c => new { c.ChgOfOwnerId, c.ComputedDecision })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var canonicalByChgOfOwnerId = canonicalRows
            .ToDictionary(c => c.ChgOfOwnerId, c => c.ComputedDecision);

        var qualifiedCount = canonicalRows.Count(c => c.ComputedDecision == CanonicalSaleQualificationDecision.Qualified);
        var excludedCount = canonicalRows.Count(c => c.ComputedDecision == CanonicalSaleQualificationDecision.Excluded);
        var inconclusiveCount = canonicalRows.Count(c => c.ComputedDecision == CanonicalSaleQualificationDecision.Inconclusive);

        // 7. Diff the two sides.
        var forwardSample = new List<SalesQualificationCoverageGapEntry>(SampleCap);
        var driftSample = new List<SalesQualificationCoverageGapEntry>(SampleCap);
        var forwardCount = 0;
        var driftCount = 0;

        foreach (var (chgOfOwnerId, freshStatus) in freshByChgOfOwnerId)
        {
            var freshCanonical = MapOverall(freshStatus);
            if (canonicalByChgOfOwnerId.TryGetValue(chgOfOwnerId, out var canonicalDecision))
            {
                if (canonicalDecision != freshCanonical)
                {
                    driftCount++;
                    if (driftSample.Count < SampleCap)
                    {
                        driftSample.Add(new SalesQualificationCoverageGapEntry(
                            ChgOfOwnerId: chgOfOwnerId,
                            CanonicalStatus: canonicalDecision.ToString(),
                            FreshStatus: freshCanonical.ToString()));
                    }
                }
            }
            else
            {
                forwardCount++;
                if (forwardSample.Count < SampleCap)
                {
                    forwardSample.Add(new SalesQualificationCoverageGapEntry(
                        ChgOfOwnerId: chgOfOwnerId,
                        CanonicalStatus: null,
                        FreshStatus: freshCanonical.ToString()));
                }
            }
        }

        var backwardSample = new List<SalesQualificationCoverageGapEntry>(SampleCap);
        var backwardCount = 0;
        foreach (var (chgOfOwnerId, canonicalDecision) in canonicalByChgOfOwnerId)
        {
            if (freshByChgOfOwnerId.ContainsKey(chgOfOwnerId)) continue;
            backwardCount++;
            if (backwardSample.Count < SampleCap)
            {
                backwardSample.Add(new SalesQualificationCoverageGapEntry(
                    ChgOfOwnerId: chgOfOwnerId,
                    CanonicalStatus: canonicalDecision.ToString(),
                    FreshStatus: null));
            }
        }

        // 8. Build verdict. Bounded runs mark the backward gap as
        //    inconclusive — canonical rows outside the bounded PACS
        //    scan may legitimately exist.
        var backwardConclusive = maxSales is null;
        var isClean = forwardCount == 0 && driftCount == 0
            && (backwardConclusive ? backwardCount == 0 : true);

        var summary = isClean
            ? "Coverage continuity holds: every PACS row that should land lands, " +
              "every canonical row traces to source, no decision drift."
            : $"Coverage continuity gaps found — forward: {forwardCount}, " +
              $"backward: {backwardCount}{(backwardConclusive ? "" : " (inconclusive)")}, " +
              $"drift: {driftCount}.";

        return new SalesQualificationCoverageReport(
            SchemaVersion: "1.0.0",
            RunId: DateTime.UtcNow.ToString("O"),
            CountyId: countyId,
            WorkbookId: workbookId,
            SourceConnectionId: sourceConnectionId,
            PacsScope: new SalesQualificationCoveragePacsScope(
                RowsScanned: rowsScanned.Count,
                MaxSalesApplied: maxSales,
                RowsWithChgOfOwnerId: rowsWithId),
            CanonicalScope: new SalesQualificationCoverageCanonicalScope(
                RowCount: canonicalRows.Count,
                QualifiedCount: qualifiedCount,
                ExcludedCount: excludedCount,
                InconclusiveCount: inconclusiveCount),
            ForwardCoverageGap: new SalesQualificationCoverageGap(
                Count: forwardCount,
                IsConclusive: true,
                Sample: forwardSample),
            BackwardTraceabilityGap: new SalesQualificationCoverageGap(
                Count: backwardCount,
                IsConclusive: backwardConclusive,
                Sample: backwardSample),
            DecisionDrift: new SalesQualificationCoverageGap(
                Count: driftCount,
                IsConclusive: true,
                Sample: driftSample),
            Verdict: new SalesQualificationCoverageVerdict(
                IsClean: isClean,
                Summary: summary));
    }

    /// <summary>
    /// Mirrors <c>SalesQualificationCanonicalRunner.MapOverall</c>:
    /// the C36 contract for collapsing the C8-B 5-status output into
    /// the 3-status canonical landing decision. Kept as a private
    /// duplicate rather than a shared helper so neither runner has
    /// a back-channel dependency on the other.
    /// </summary>
    private static CanonicalSaleQualificationDecision MapOverall(
        SalesQualificationDecisionStatus status) => status switch
    {
        SalesQualificationDecisionStatus.Qualified   => CanonicalSaleQualificationDecision.Qualified,
        SalesQualificationDecisionStatus.Excluded    => CanonicalSaleQualificationDecision.Excluded,
        SalesQualificationDecisionStatus.Deferred    => CanonicalSaleQualificationDecision.Inconclusive,
        SalesQualificationDecisionStatus.Unknown     => CanonicalSaleQualificationDecision.Inconclusive,
        SalesQualificationDecisionStatus.MissingCode => CanonicalSaleQualificationDecision.Inconclusive,
        _ => throw new InvalidOperationException(
            $"Unknown SalesQualificationDecisionStatus: {status}"),
    };
}
