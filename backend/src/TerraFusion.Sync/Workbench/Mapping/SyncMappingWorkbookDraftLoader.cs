using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Sync.Mapping;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;

namespace TerraFusion.Sync.Workbench.Mapping;

/// <summary>
/// Slice C3 implementation: read <see cref="SyncProfileCodeCandidate"/>
/// rows for a county + profile-batch scope, materialize them into draft
/// <see cref="SyncMappingWorkbook"/> /
/// <see cref="SyncMappingColumn"/> /
/// <see cref="SyncMappingCodeValue"/> rows, infer mapping lanes from the
/// C1 priority list, and respect existing-draft idempotency.
///
/// See <see cref="ISyncMappingWorkbookDraftLoader"/> for the contract.
/// </summary>
public sealed class SyncMappingWorkbookDraftLoader : ISyncMappingWorkbookDraftLoader
{
    /// <summary>Max length the C1 seed enforces for code-value source strings (mirrors the EF column).</summary>
    private const int MaxSourceValueLength = 512;

    private readonly TerraFusionDbContext _db;

    public SyncMappingWorkbookDraftLoader(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<SyncMappingWorkbookDraftResult> CreateDraftAsync(
        Guid countyId,
        Guid profileBatchId,
        SyncMappingWorkbookDraftOptions options,
        CancellationToken cancellationToken = default)
    {
        if (countyId == Guid.Empty)
            throw new ArgumentException("CountyId is required.", nameof(countyId));
        if (profileBatchId == Guid.Empty)
            throw new ArgumentException("ProfileBatchId is required.", nameof(profileBatchId));
        ArgumentNullException.ThrowIfNull(options);
        if (string.IsNullOrWhiteSpace(options.WorkbookName))
            throw new ArgumentException("Options.WorkbookName must be non-empty.", nameof(options));
        if (options.MaxCandidates is int max && max <= 0)
            throw new ArgumentException("Options.MaxCandidates must be positive when set.", nameof(options));

        // 1. Resolve the SyncSourceConnection that produced this batch so the
        //    workbook can record the SourceConnectionId pointer. The B2 batch
        //    row itself doesn't carry the connection (different responsibility),
        //    so we go through the connection table filtered to this county.
        //    There is, by C2 design convention, exactly one active PACS source
        //    per county per workbook lifecycle — but the pointer is loose:
        //    if a fresh source replaces the prior one we still record what
        //    fed THIS draft.
        var sourceConnection = await _db.SyncSourceConnections
            .Where(c => c.CountyId == countyId && c.IsActive)
            .OrderBy(c => c.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        var sourceConnectionId = sourceConnection?.Id ?? Guid.Empty;

        // 2. Existing-draft handling — natural key is (CountyId, Name).
        var existing = await _db.SyncMappingWorkbooks
            .FirstOrDefaultAsync(
                w => w.CountyId == countyId && w.Name == options.WorkbookName,
                cancellationToken);

        if (existing is not null)
        {
            // Status != Draft is operator review work; never touch it.
            if (!string.Equals(existing.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Mapping workbook '{options.WorkbookName}' for county {countyId} has Status='{existing.Status}'. " +
                    $"Refusing to mutate non-Draft workbook contents.");
            }

            if (!options.ReplaceExistingDraft)
            {
                // Idempotent return — surface what's already there with no
                // duplication.
                var existingColumns = await _db.SyncMappingColumns
                    .Where(c => c.WorkbookId == existing.Id)
                    .CountAsync(cancellationToken);
                var existingValues = await _db.SyncMappingCodeValues
                    .Where(v => _db.SyncMappingColumns
                        .Where(c => c.WorkbookId == existing.Id)
                        .Select(c => c.Id)
                        .Contains(v.MappingColumnId))
                    .CountAsync(cancellationToken);

                return new SyncMappingWorkbookDraftResult(
                    WorkbookId:          existing.Id,
                    ColumnsCreated:      0,
                    CodeValuesCreated:   0,
                    CandidatesSkipped:   0,
                    ReusedExistingDraft: true);
            }

            // ReplaceExistingDraft=true: nuke contents, keep workbook row so
            // the Id stays stable for any external pointers.
            var existingColumnIds = await _db.SyncMappingColumns
                .Where(c => c.WorkbookId == existing.Id)
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);
            if (existingColumnIds.Count > 0)
            {
                var existingValuesQuery = _db.SyncMappingCodeValues
                    .Where(v => existingColumnIds.Contains(v.MappingColumnId));
                _db.SyncMappingCodeValues.RemoveRange(existingValuesQuery);
                _db.SyncMappingColumns.RemoveRange(
                    _db.SyncMappingColumns.Where(c => c.WorkbookId == existing.Id));
                await _db.SaveChangesAsync(cancellationToken);
            }

            // Refresh the workbook's batch pointer in case the operator is
            // re-seeding with a newer batch under the same name.
            existing.ProfileBatchId     = profileBatchId;
            existing.SourceConnectionId = sourceConnectionId;
            existing.UpdatedAt          = DateTime.UtcNow;
        }

        var workbook = existing ?? new SyncMappingWorkbook
        {
            CountyId           = countyId,
            SourceConnectionId = sourceConnectionId,
            ProfileBatchId     = profileBatchId,
            Name               = options.WorkbookName,
            Status             = "Draft",
        };
        if (existing is null)
        {
            _db.SyncMappingWorkbooks.Add(workbook);
        }

        // 3. Pull candidates for the requested batch, county-scoped.
        //    Order is deterministic so MaxCandidates truncation is stable
        //    and re-runs land on the same first-N set.
        var candidatesQuery = _db.SyncProfileCodeCandidates
            .Where(c => c.CountyId == countyId && c.SyncBatchId == profileBatchId)
            .OrderBy(c => c.SchemaName)
            .ThenBy(c => c.TableName)
            .ThenBy(c => c.ColumnName);

        var candidates = await candidatesQuery.ToListAsync(cancellationToken);

        // 4. Apply include allowlist + max-candidates cap.
        var matched = candidates
            .Where(c => options.MatchesInclude(c.SchemaName, c.TableName, c.ColumnName))
            .ToList();

        var skipped = candidates.Count - matched.Count;

        if (options.MaxCandidates is int cap && matched.Count > cap)
        {
            skipped += matched.Count - cap;
            matched = matched.Take(cap).ToList();
        }

        // 5. Materialize columns + code values.
        var columnsCreated    = 0;
        var codeValuesCreated = 0;

        foreach (var candidate in matched)
        {
            var lane = InferLane(candidate.TableName, candidate.ColumnName);

            var column = new SyncMappingColumn
            {
                CountyId        = countyId,
                WorkbookId      = workbook.Id,
                CodeCandidateId = candidate.Id,
                SourceSchema    = candidate.SchemaName,
                SourceTable     = candidate.TableName,
                SourceColumn    = candidate.ColumnName,
                MappingLane     = lane,
                DistinctCount   = candidate.DistinctCount,
                DistinctRatio   = candidate.DistinctRatio,
                ReviewStatus    = "NeedsReview",
            };
            _db.SyncMappingColumns.Add(column);
            columnsCreated++;

            // Per-value rows from the candidate's top-N JSON. Defensive:
            // tolerate null/empty/unparseable JSON without aborting the
            // batch — the column-level review is still useful.
            var topValues = ParseCandidateCodesJson(candidate.CandidateCodesJson);
            foreach (var entry in topValues)
            {
                var sourceValue = entry.Value;
                if (sourceValue is null) continue;

                if (sourceValue.Length > MaxSourceValueLength)
                {
                    sourceValue = sourceValue[..MaxSourceValueLength];
                }

                _db.SyncMappingCodeValues.Add(new SyncMappingCodeValue
                {
                    CountyId        = countyId,
                    MappingColumnId = column.Id,
                    SourceValue     = sourceValue,
                    ObservedCount   = entry.Count,
                    ReviewStatus    = "NeedsReview",
                    IsExcluded      = false,
                });
                codeValuesCreated++;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        return new SyncMappingWorkbookDraftResult(
            WorkbookId:          workbook.Id,
            ColumnsCreated:      columnsCreated,
            CodeValuesCreated:   codeValuesCreated,
            CandidatesSkipped:   skipped,
            ReusedExistingDraft: false);
    }

    /// <summary>
    /// C1 priority lane inference. Pure function — no I/O — so unit
    /// tests can pin every rule without touching the DbContext. Returns
    /// "Other" for unknown (table, column) pairs.
    ///
    /// <para>The rules mirror the lanes documented in
    /// <c>docs/sync/mapping-workbook-seed.md</c>:
    /// <list type="bullet">
    /// <item><b>Valuation</b> — primary classifier on property_val.</item>
    /// <item><b>Sales</b> — sale qualification surfaces (wac_cd,
    /// sl_ratio_type_cd, etc.).</item>
    /// <item><b>Improvement</b> — Benton-Method feature decomposition
    /// surfaces on imprv / imprv_detail / imprv_attr.</item>
    /// <item><b>Land</b> — land classification (use, soil, type).</item>
    /// <item><b>Neighborhood</b> — economic-area / neighborhood vocab.</item>
    /// </list>
    /// </para>
    ///
    /// <para>Comparison is case-insensitive on both table and column
    /// names because PACS schemas are predominantly lowercase but the
    /// SyncProfileCodeCandidate rows preserve whatever sys.* reported,
    /// which can vary across servers.</para>
    /// </summary>
    public static string InferLane(string tableName, string columnName)
    {
        ArgumentNullException.ThrowIfNull(tableName);
        ArgumentNullException.ThrowIfNull(columnName);

        var t = tableName.ToLowerInvariant();
        var c = columnName.ToLowerInvariant();

        return (t, c) switch
        {
            ("property_val", "property_use_cd")    => "Valuation",
            ("land_detail",  "primary_use_cd")     => "Land",
            ("land_detail",  "land_soil_code")     => "Land",
            ("sale",         "wac_cd")             => "Sales",
            ("sale",         "sl_ratio_type_cd")   => "Sales",
            ("imprv_detail", "imprv_det_class_cd") => "Improvement",
            ("imprv",        "imprv_state_cd")     => "Improvement",
            ("imprv_attr",   "i_attr_val_cd")      => "Improvement",
            ("neighborhood", "nbhd_descr")         => "Neighborhood",
            _                                       => "Other",
        };
    }

    /// <summary>
    /// Parse the <c>CandidateCodesJson</c> top-N frequency array into
    /// a list of <see cref="TopValueEntry"/>. Tolerant: null / empty /
    /// invalid JSON returns an empty list rather than throwing — the
    /// column-level review is still useful even if the per-value rows
    /// can't be seeded.
    /// </summary>
    private static IReadOnlyList<TopValueEntry> ParseCandidateCodesJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return Array.Empty<TopValueEntry>();
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<List<TopValueEntry>>(json, JsonOpts);
            return parsed ?? (IReadOnlyList<TopValueEntry>)Array.Empty<TopValueEntry>();
        }
        catch (JsonException)
        {
            return Array.Empty<TopValueEntry>();
        }
    }

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed record TopValueEntry(string? Value, long Count);
}
