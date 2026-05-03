using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C8-C implementation. See
/// <see cref="ISalesQualificationSampleRunner"/> for the contract.
///
/// <para>Composition: the runner depends on three abstractions —
/// <see cref="TerraFusionDbContext"/> for the
/// <c>SyncSourceConnections</c> lookup,
/// <see cref="ISyncMappingWorkbookReadModel"/> for the locked workbook
/// load (Status guard at this seam), and <see cref="ISalesRowReader"/>
/// for the bounded TOP-N PACS read. Tests substitute fakes for the
/// reader so the unit-test surface stays InMemory-clean.</para>
///
/// <para>Order of operations is deliberate:
/// <list type="number">
/// <item>Validate args.</item>
/// <item>Look up the source connection (county-scoped); refuse cross-
/// county / missing.</item>
/// <item>Load the workbook through <c>LoadMappedAsync</c>. Throws
/// before any PACS query if the workbook isn't <c>Mapped</c> — so a
/// Draft workbook fails closed without ever touching PACS.</item>
/// <item>Read up to <c>maxSales</c> rows from PACS via the row
/// reader.</item>
/// <item>Qualify each row through
/// <see cref="SalesQualificationTransform.Qualify"/>.</item>
/// <item>Aggregate counts; return.</item>
/// </list>
/// </para>
/// </summary>
public sealed class SalesQualificationSampleRunner : ISalesQualificationSampleRunner
{
    private readonly TerraFusionDbContext _db;
    private readonly ISyncMappingWorkbookReadModel _readModel;
    private readonly ISalesRowReader _salesReader;

    public SalesQualificationSampleRunner(
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

    public async Task<SalesQualificationSampleResult> RunAsync(
        Guid countyId,
        Guid workbookId,
        Guid sourceConnectionId,
        int maxSales,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (workbookId == Guid.Empty)
            throw new ArgumentException("WorkbookId is required.", nameof(workbookId));
        if (sourceConnectionId == Guid.Empty)
            throw new ArgumentException("SourceConnectionId is required.", nameof(sourceConnectionId));
        if (maxSales <= 0)
            throw new ArgumentException("MaxSales must be positive.", nameof(maxSales));

        // 1. Source connection lookup — county-scoped.
        var connection = await _db.SyncSourceConnections
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.Id == sourceConnectionId && c.CountyId == countyId,
                cancellationToken);
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
        //    PACS query. Draft workbooks fail closed at this seam.
        var snapshot = await _readModel.LoadMappedAsync(countyId, workbookId, cancellationToken);

        // 3. Bounded PACS read.
        var rows = await _salesReader.ReadAsync(connection, maxSales, cancellationToken);

        // 4. Per-row qualification + count aggregation.
        var sample = new List<SalesQualificationSampleEntry>(rows.Count);
        var qualified = 0;
        var excluded  = 0;
        var deferred  = 0;
        var unknown   = 0;
        var missing   = 0;

        foreach (var row in rows)
        {
            var decision = SalesQualificationTransform.Qualify(
                snapshot,
                new SalesQualificationSource(row.WacCode, row.SaleRatioTypeCode));

            sample.Add(new SalesQualificationSampleEntry(
                SaleIdentifier:      row.SaleIdentifier,
                WacCode:             row.WacCode,
                SaleRatioTypeCode:   row.SaleRatioTypeCode,
                Status:              decision.DecisionStatus,
                IsExcludedFromComps: decision.IsExcludedFromComps,
                CanonicalValue:      decision.CanonicalValue,
                Reasons:             decision.Reasons));

            switch (decision.DecisionStatus)
            {
                case SalesQualificationDecisionStatus.Qualified:   qualified++; break;
                case SalesQualificationDecisionStatus.Excluded:    excluded++;  break;
                case SalesQualificationDecisionStatus.Deferred:    deferred++;  break;
                case SalesQualificationDecisionStatus.Unknown:     unknown++;   break;
                case SalesQualificationDecisionStatus.MissingCode: missing++;   break;
            }
        }

        return new SalesQualificationSampleResult(
            WorkbookId:         workbookId,
            SourceConnectionId: sourceConnectionId,
            RowsRead:           rows.Count,
            QualifiedCount:     qualified,
            ExcludedCount:      excluded,
            DeferredCount:      deferred,
            UnknownCount:       unknown,
            MissingCodeCount:   missing,
            Sample:             sample);
    }
}
