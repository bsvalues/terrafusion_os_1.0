using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Mapping;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C36 implementation of the canonical sales-qualification
/// write path. This is the mutating counterpart to
/// <see cref="SalesQualificationSampleRunner"/>.
/// </summary>
public sealed class SalesQualificationCanonicalRunner : ISalesQualificationCanonicalRunner
{
    private const string MissingIdentifierSkipReason =
        "Missing chg_of_owner_id; canonical sale qualification row requires (CountyId, ChgOfOwnerId).";

    private readonly TerraFusionDbContext _db;
    private readonly ISyncMappingWorkbookReadModel _readModel;
    private readonly ISalesRowReader _salesReader;
    private readonly ICanonicalSalesQualificationWriter _writer;

    public SalesQualificationCanonicalRunner(
        TerraFusionDbContext db,
        ISyncMappingWorkbookReadModel readModel,
        ISalesRowReader salesReader,
        ICanonicalSalesQualificationWriter writer)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(readModel);
        ArgumentNullException.ThrowIfNull(salesReader);
        ArgumentNullException.ThrowIfNull(writer);
        _db = db;
        _readModel = readModel;
        _salesReader = salesReader;
        _writer = writer;
    }

    public async Task<SalesQualificationCanonicalRunResult> RunAsync(
        Guid countyId,
        Guid workbookId,
        Guid sourceConnectionId,
        int maxSales,
        string operatorId,
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
        if (string.IsNullOrWhiteSpace(operatorId))
            throw new ArgumentException("OperatorId is required.", nameof(operatorId));

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

        // LoadMappedAsync is the gate. Draft/InReview/Approved/Archived
        // workbooks fail here before PACS is read and before canonical rows
        // can be written.
        var snapshot = await _readModel.LoadMappedAsync(countyId, workbookId, cancellationToken);
        if (snapshot.SourceConnectionId != sourceConnectionId)
        {
            throw new InvalidOperationException(
                $"Mapping workbook {workbookId} belongs to source connection {snapshot.SourceConnectionId}, " +
                $"not requested source connection {sourceConnectionId}.");
        }

        var rows = await _salesReader.ReadAsync(connection, maxSales, cancellationToken);

        var entries = new List<SalesQualificationCanonicalRunEntry>(rows.Count);
        var qualified = 0;
        var excluded = 0;
        var inconclusive = 0;
        var skipped = 0;
        var persisted = 0;

        foreach (var row in rows)
        {
            var evaluation = SalesQualificationTransform.Evaluate(
                snapshot,
                new SalesQualificationSource(row.WacCode, row.SaleRatioTypeCode));

            if (row.ChgOfOwnerId is null)
            {
                skipped++;
                entries.Add(new SalesQualificationCanonicalRunEntry(
                    ChgOfOwnerId: row.ChgOfOwnerId,
                    WacCode: row.WacCode,
                    SaleRatioTypeCode: row.SaleRatioTypeCode,
                    TransformStatus: evaluation.Decision.DecisionStatus,
                    Persisted: false,
                    SkipReason: MissingIdentifierSkipReason));
                continue;
            }

            var overall = MapOverall(evaluation.Decision.DecisionStatus);
            switch (overall)
            {
                case CanonicalSaleQualificationDecision.Qualified:
                    qualified++;
                    break;
                case CanonicalSaleQualificationDecision.Excluded:
                    excluded++;
                    break;
                case CanonicalSaleQualificationDecision.Inconclusive:
                    inconclusive++;
                    break;
            }

            await _writer.UpsertAsync(
                new CanonicalSalesQualificationWriteRequest(
                    CountyId: countyId,
                    ChgOfOwnerId: row.ChgOfOwnerId.Value,
                    Evaluation: evaluation,
                    WacCdSourceValue: row.WacCode,
                    SlRatioTypeCdSourceValue: row.SaleRatioTypeCode,
                    SourceWorkbookId: snapshot.WorkbookId,
                    SourceWorkbookLockedAt: snapshot.UpdatedAt,
                    SaleDate: row.SaleDate,
                    SalePrice: row.SalePrice,
                    OperatorId: operatorId),
                cancellationToken);

            persisted++;
            entries.Add(new SalesQualificationCanonicalRunEntry(
                ChgOfOwnerId: row.ChgOfOwnerId,
                WacCode: row.WacCode,
                SaleRatioTypeCode: row.SaleRatioTypeCode,
                TransformStatus: evaluation.Decision.DecisionStatus,
                Persisted: true,
                SkipReason: null));
        }

        return new SalesQualificationCanonicalRunResult(
            WorkbookId: workbookId,
            SourceConnectionId: sourceConnectionId,
            RowsRead: rows.Count,
            QualifiedCount: qualified,
            ExcludedCount: excluded,
            InconclusiveCount: inconclusive,
            SkippedNoIdentifierCount: skipped,
            RowsPersisted: persisted,
            Entries: entries);
    }

    private static CanonicalSaleQualificationDecision MapOverall(
        SalesQualificationDecisionStatus status)
    {
        return status switch
        {
            SalesQualificationDecisionStatus.Qualified => CanonicalSaleQualificationDecision.Qualified,
            SalesQualificationDecisionStatus.Excluded => CanonicalSaleQualificationDecision.Excluded,
            SalesQualificationDecisionStatus.Deferred => CanonicalSaleQualificationDecision.Inconclusive,
            SalesQualificationDecisionStatus.Unknown => CanonicalSaleQualificationDecision.Inconclusive,
            SalesQualificationDecisionStatus.MissingCode => CanonicalSaleQualificationDecision.Inconclusive,
            _ => throw new InvalidOperationException(
                $"Unknown SalesQualificationDecisionStatus: {status}"),
        };
    }
}
