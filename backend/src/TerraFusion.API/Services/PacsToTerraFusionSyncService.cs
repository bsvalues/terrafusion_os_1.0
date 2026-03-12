using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.PACS;
using TerraFusion.Data;
using Task = System.Threading.Tasks.Task;
using CoreComparableSale = TerraFusion.Core.Entities.ComparableSale;

namespace TerraFusion.API.Services;

/// <summary>
/// Canonical PACS-to-TerraFusion importer.
/// Reads county truth through pacscontract.v1 and persists it into TerraFusion's operational store.
/// </summary>
public sealed class PacsToTerraFusionSyncService
{
    private static readonly Dictionary<string, (string State, string? FipsCode)> KnownCountyMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Benton"] = ("WA", "53005"),
            ["Clark"] = ("WA", "53011"),
            ["Cowlitz"] = ("WA", "53015"),
            ["King"] = ("WA", "53033"),
            ["Yakima"] = ("WA", "53077")
        };

    private readonly ILogger<PacsToTerraFusionSyncService> _logger;
    private readonly TerraFusionDbContext _db;
    private readonly IPacsAdapter _pacsAdapter;

    public PacsToTerraFusionSyncService(
        ILogger<PacsToTerraFusionSyncService> logger,
        TerraFusionDbContext db,
        IPacsAdapter pacsAdapter)
    {
        _logger = logger;
        _db = db;
        _pacsAdapter = pacsAdapter;
    }

    public async Task<CountySyncResult> SyncCountyDataAsync(
        string countyName,
        string? state,
        SyncOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var syncOptions = options ?? new SyncOptions();
        var startedAt = DateTime.UtcNow;
        var stopwatch = Stopwatch.StartNew();

        var result = new CountySyncResult
        {
            CountyName = countyName,
            LegacySystemType = "harris_pacs",
            Timestamp = startedAt,
            StartTime = startedAt,
            Status = "running",
            Metadata = new Dictionary<string, object>
            {
                ["source"] = "pacscontract.v1",
                ["mode"] = syncOptions.FullSync || !syncOptions.StartDate.HasValue ? "full" : "incremental"
            }
        };

        County? county = null;
        int? jobId = null;

        try
        {
            county = await ResolveCountyAsync(countyName, state, cancellationToken);
            await RepairImportedPacsPropertiesAsync(county.Id, cancellationToken);
            jobId = await StartJobAsync(county, syncOptions, cancellationToken);

            var proof = await _pacsAdapter.ValidateContractAsync(cancellationToken);
            result.Metadata["contractValidatedAt"] = proof.ValidatedAt;

            if (proof.Warnings.Count > 0)
            {
                result.Metadata["contractWarnings"] = proof.Warnings;
            }

            if (!proof.IsValid)
            {
                result.Success = false;
                result.Status = "failed";
                result.Errors.AddRange(proof.Errors);
                result.ErrorCount = result.Errors.Count;
                result.Message = "PACS contract validation failed. Sync aborted.";

                await CompleteJobAsync(jobId, county.Id, result, stopwatch.Elapsed, cancellationToken);
                return FinalizeResult(result, stopwatch.Elapsed);
            }

            var counters = new SyncCounters();
            var batchSize = Math.Clamp(syncOptions.BatchSize <= 0 ? 1000 : syncOptions.BatchSize, 1, 1000);
            var importOwners = ShouldImport(syncOptions, "Owners");
            var importAssessments = ShouldImport(syncOptions, "Assessments");
            var importSales = ShouldImport(syncOptions, "Sales");
            var importProperties = ShouldImport(syncOptions, "Properties");
            var needsPropertyPass = importProperties || importOwners || importAssessments;
            var useIncremental = !syncOptions.FullSync && syncOptions.StartDate.HasValue;
            var recordedTotal = false;

            if (needsPropertyPass)
            {
                if (useIncremental)
                {
                    var maxResults = Math.Min(Math.Max(batchSize * 10, batchSize), 10000);
                    var changed = await _pacsAdapter.GetChangedPropertiesAsync(
                        syncOptions.StartDate!.Value,
                        maxResults,
                        cancellationToken);

                    if (changed.Count == maxResults)
                    {
                        result.Metadata["incrementalResultCapReached"] = true;
                    }

                    counters.TotalRecords = changed.Count;
                    await UpdateJobTotalsAsync(jobId, counters.TotalRecords, cancellationToken);

                    await ProcessBatchAsync(
                        county.Id,
                        changed,
                        importOwners,
                        importAssessments,
                        syncOptions,
                        counters,
                        cancellationToken);

                    recordedTotal = true;
                }
                else
                {
                    var page = 1;
                    while (true)
                    {
                        var paged = await _pacsAdapter.GetPropertiesAsync(page, batchSize, cancellationToken);

                        if (!recordedTotal)
                        {
                            counters.TotalRecords = paged.TotalCount;
                            await UpdateJobTotalsAsync(jobId, counters.TotalRecords, cancellationToken);
                            recordedTotal = true;
                        }

                        await ProcessBatchAsync(
                            county.Id,
                            paged.Items,
                            importOwners,
                            importAssessments,
                            syncOptions,
                            counters,
                            cancellationToken);

                        if (!paged.HasMore)
                        {
                            break;
                        }

                        page++;
                    }
                }
            }
            else
            {
                result.Metadata["propertyPassSkipped"] = true;
                await UpdateJobTotalsAsync(jobId, 0, cancellationToken);
                _logger.LogInformation(
                    "Skipping PACS property pass for county {County}; requested data types: {DataTypes}",
                    countyName,
                    string.Join(",", syncOptions.DataTypes));
            }

            if (importSales)
            {
                await ImportComparableSalesAsync(county.Id, syncOptions, counters, cancellationToken);
            }

            result.Success = true;
            result.Status = "completed";
            result.Message = $"Imported {counters.PropertiesProcessed} PACS parcels into TerraFusion.";
            result.RecordsProcessed = counters.PropertiesProcessed;
            result.RecordsUpdated = counters.PropertiesUpdated + counters.AssessmentsUpdated;
            result.RecordsAdded = counters.PropertiesAdded + counters.AssessmentsAdded;
            result.RecordsSkipped = counters.PropertiesSkipped;
            result.TotalParcels = counters.PropertiesProcessed;
            result.ErrorCount = result.Errors.Count;
            result.RecordTypes = new Dictionary<string, int>
            {
                ["Properties"] = counters.PropertiesProcessed,
                ["Assessments"] = counters.AssessmentsAdded + counters.AssessmentsUpdated,
                ["Owners"] = counters.OwnersImported,
                ["Sales"] = counters.SalesAdded + counters.SalesUpdated
            };
            result.Metadata["totalSourceRecords"] = counters.TotalRecords;
            result.Metadata["propertiesAdded"] = counters.PropertiesAdded;
            result.Metadata["propertiesUpdated"] = counters.PropertiesUpdated;
            result.Metadata["propertiesSkipped"] = counters.PropertiesSkipped;
            result.Metadata["assessmentsAdded"] = counters.AssessmentsAdded;
            result.Metadata["assessmentsUpdated"] = counters.AssessmentsUpdated;
            result.Metadata["ownersImported"] = counters.OwnersImported;
            result.Metadata["salesAdded"] = counters.SalesAdded;
            result.Metadata["salesUpdated"] = counters.SalesUpdated;
            result.Metadata["salesSkipped"] = counters.SalesSkipped;
            result.Metadata["salesImported"] = counters.SalesAdded + counters.SalesUpdated;
            result.Metadata["currentAssessmentMode"] = "vw_TerraFusion_Property_Core snapshot";

            await CompleteJobAsync(jobId, county.Id, result, stopwatch.Elapsed, cancellationToken);
            return FinalizeResult(result, stopwatch.Elapsed);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PACS import failed for county {County}", countyName);

            result.Success = false;
            result.Status = "failed";
            result.Message = "PACS import failed.";
            result.Errors.Add(ex.Message);
            result.ErrorCount = result.Errors.Count;

            if (county != null)
            {
                await CompleteJobAsync(jobId, county.Id, result, stopwatch.Elapsed, cancellationToken);
            }

            return FinalizeResult(result, stopwatch.Elapsed);
        }
    }

    private async Task ProcessBatchAsync(
        Guid countyId,
        IReadOnlyList<PacsPropertyCore> sourceProperties,
        bool importOwners,
        bool importAssessments,
        SyncOptions options,
        SyncCounters counters,
        CancellationToken cancellationToken)
    {
        if (sourceProperties.Count == 0)
        {
            return;
        }

        var filtered = sourceProperties
            .Where(property => MatchesFilters(property, options))
            .ToList();

        if (filtered.Count == 0)
        {
            counters.PropertiesSkipped += sourceProperties.Count;
            return;
        }

        var parcelIds = filtered
            .Select(property => Normalize(property.GeoId))
            .Where(propertyId => !string.IsNullOrWhiteSpace(propertyId))
            .Cast<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var legacyPropertyIds = filtered
            .Select(BuildLegacyPropertyId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var existingCandidates = await _db.Properties
            .Where(property =>
                property.CountyId == countyId &&
                (
                    legacyPropertyIds.Contains(property.PropertyId) ||
                    parcelIds.Contains(property.ParcelId) ||
                    parcelIds.Contains(property.ParcelNumber)
                ))
            .ToListAsync(cancellationToken);

        var existingByParcelId = new Dictionary<string, Property>(StringComparer.OrdinalIgnoreCase);
        var existingByLegacyId = new Dictionary<string, Property>(StringComparer.OrdinalIgnoreCase);

        foreach (var propertyGroup in existingCandidates.GroupBy(property => property.PropertyId, StringComparer.OrdinalIgnoreCase))
        {
            var canonical = SelectCanonicalProperty(propertyGroup);
            var duplicates = propertyGroup
                .Where(property => property.Id != canonical.Id)
                .ToList();

            if (duplicates.Count > 0)
            {
                await MergeDuplicatePropertiesAsync(canonical, duplicates, cancellationToken);
            }

            IndexProperty(existingByParcelId, existingByLegacyId, canonical);
        }

        IReadOnlyDictionary<int, PacsPropertyOwnership> ownershipByPropId =
            new Dictionary<int, PacsPropertyOwnership>();

        if (importOwners)
        {
            ownershipByPropId = (await _pacsAdapter.GetOwnershipByIdsAsync(
                    filtered.Select(property => property.PropId),
                    cancellationToken))
                .GroupBy(ownership => ownership.PropId)
                .ToDictionary(group => group.Key, group => group.First());
        }

        var mappedBatch = new List<MappedPropertyBatchItem>(filtered.Count);

        foreach (var source in filtered)
        {
            ownershipByPropId.TryGetValue(source.PropId, out var ownership);
            var normalizedGeoId = Normalize(source.GeoId) ?? $"PACS-{source.PropId.ToString(CultureInfo.InvariantCulture)}";
            var legacyPropertyId = BuildLegacyPropertyId(source);

            Property? property = null;
            if (!existingByParcelId.TryGetValue(normalizedGeoId, out property))
            {
                existingByLegacyId.TryGetValue(legacyPropertyId, out property);
            }

            if (property is null)
            {
                property = new Property
                {
                    Id = Guid.NewGuid(),
                    PropertyId = legacyPropertyId,
                    ParcelId = normalizedGeoId,
                    ParcelNumber = normalizedGeoId,
                    CountyId = countyId,
                    CreatedAt = DateTime.UtcNow
                };

                ApplyPropertyValues(property, source, ownership);
                _db.Properties.Add(property);
                IndexProperty(existingByParcelId, existingByLegacyId, property);
                counters.PropertiesAdded++;
            }
            else
            {
                if (ApplyPropertyValues(property, source, ownership))
                {
                    property.PropertyId = legacyPropertyId;
                    IndexProperty(existingByParcelId, existingByLegacyId, property);
                    counters.PropertiesUpdated++;
                }
                else
                {
                    counters.PropertiesSkipped++;
                }
            }

            counters.PropertiesProcessed++;
            if (ownership is not null && !string.IsNullOrWhiteSpace(ownership.OwnerName))
            {
                counters.OwnersImported++;
            }

            mappedBatch.Add(new MappedPropertyBatchItem(source, property));
        }

        if (importAssessments)
        {
            var propertyIds = mappedBatch.Select(item => item.TargetProperty.Id).Distinct().ToList();
            var years = mappedBatch
                .Select(item => ResolveAssessmentYear(item.Source))
                .Distinct()
                .ToList();

            var existingAssessments = await _db.PropertyAssessments
                .Where(assessment => propertyIds.Contains(assessment.PropertyId) && years.Contains(assessment.AssessmentYear))
                .ToListAsync(cancellationToken);

            var assessmentMap = existingAssessments.ToDictionary(
                assessment => BuildAssessmentKey(assessment.PropertyId, assessment.AssessmentYear));

            foreach (var item in mappedBatch)
            {
                var assessmentYear = ResolveAssessmentYear(item.Source);
                var assessmentKey = BuildAssessmentKey(item.TargetProperty.Id, assessmentYear);

                if (!assessmentMap.TryGetValue(assessmentKey, out var assessment))
                {
                    assessment = new PropertyAssessment
                    {
                        Id = Guid.NewGuid(),
                        PropertyId = item.TargetProperty.Id,
                        AssessmentYear = assessmentYear,
                        AssessorId = Guid.Empty
                    };

                    ApplyAssessmentValues(assessment, item.Source);
                    _db.PropertyAssessments.Add(assessment);
                    assessmentMap[assessmentKey] = assessment;
                    counters.AssessmentsAdded++;
                }
                else if (ApplyAssessmentValues(assessment, item.Source))
                {
                    counters.AssessmentsUpdated++;
                }
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        _db.ChangeTracker.Clear();
    }

    private async Task<County> ResolveCountyAsync(string countyName, string? state, CancellationToken cancellationToken)
    {
        var effectiveState = state;
        var effectiveFips = (string?)null;

        if (KnownCountyMap.TryGetValue(countyName, out var knownCounty))
        {
            effectiveState ??= knownCounty.State;
            effectiveFips = knownCounty.FipsCode;
        }

        effectiveState ??= "WA";

        var normalizedCounty = countyName.Trim().ToLowerInvariant();
        var normalizedState = effectiveState.Trim().ToUpperInvariant();

        var county = await _db.Counties
            .FirstOrDefaultAsync(
                item => item.Name.ToLower() == normalizedCounty && item.State.ToUpper() == normalizedState,
                cancellationToken);

        if (county is null)
        {
            county = new County
            {
                Id = Guid.NewGuid(),
                Name = countyName.Trim(),
                State = normalizedState,
                FipsCode = effectiveFips,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Counties.Add(county);
            await _db.SaveChangesAsync(cancellationToken);
            _db.ChangeTracker.Clear();

            county = await _db.Counties
                .FirstAsync(
                    item => item.Name.ToLower() == normalizedCounty && item.State.ToUpper() == normalizedState,
                    cancellationToken);
        }
        else if (string.IsNullOrWhiteSpace(county.FipsCode) && !string.IsNullOrWhiteSpace(effectiveFips))
        {
            county.FipsCode = effectiveFips;
            county.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
            _db.ChangeTracker.Clear();

            county = await _db.Counties
                .FirstAsync(
                    item => item.Name.ToLower() == normalizedCounty && item.State.ToUpper() == normalizedState,
                    cancellationToken);
        }

        return county;
    }

    private async Task RepairImportedPacsPropertiesAsync(Guid countyId, CancellationToken cancellationToken)
    {
        var importedProperties = await _db.Properties
            .Where(property => property.CountyId == countyId && property.PropertyId.StartsWith("PACS-"))
            .ToListAsync(cancellationToken);

        if (importedProperties.Count == 0)
        {
            return;
        }

        var hasChanges = false;

        foreach (var propertyGroup in importedProperties.GroupBy(property => property.PropertyId, StringComparer.OrdinalIgnoreCase))
        {
            var canonical = SelectCanonicalProperty(propertyGroup);
            hasChanges |= NormalizeCanonicalImportedProperty(canonical);

            var duplicates = propertyGroup
                .Where(property => property.Id != canonical.Id)
                .ToList();

            if (duplicates.Count > 0)
            {
                await MergeDuplicatePropertiesAsync(canonical, duplicates, cancellationToken);
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _db.SaveChangesAsync(cancellationToken);
            _db.ChangeTracker.Clear();
        }
    }

    private async Task<int?> StartJobAsync(County county, SyncOptions options, CancellationToken cancellationToken)
    {
        var requestedDataTypes = options.DataTypes.Count > 0
            ? options.DataTypes
            : new List<string> { "Properties", "Assessments", "Owners", "Sales" };

        var job = new EtlSyncJob
        {
            CountyId = county.Id,
            SourceSystem = "harris_pacs",
            EntityType = string.Join(",", requestedDataTypes),
            Direction = "inbound",
            Status = "running",
            CreatedBy = "terrafusionsync",
            StartedAt = DateTime.UtcNow,
            Watermark = options.StartDate
        };

        _db.Set<EtlSyncJob>().Add(job);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
            _db.ChangeTracker.Clear();
            return job.Id;
        }
        catch (Exception ex) when (IsMissingTable(ex, "EtlSyncJobs"))
        {
            _logger.LogWarning(ex, "EtlSyncJobs table is missing in the current dev database. Continuing sync without ETL job persistence.");
            _db.ChangeTracker.Clear();
            return null;
        }
    }

    private async Task UpdateJobTotalsAsync(int? jobId, int totalRecords, CancellationToken cancellationToken)
    {
        if (!jobId.HasValue)
        {
            return;
        }

        var job = await _db.Set<EtlSyncJob>().FirstAsync(item => item.Id == jobId, cancellationToken);
        job.TotalRecords = totalRecords;
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
            _db.ChangeTracker.Clear();
        }
        catch (Exception ex) when (IsMissingTable(ex, "EtlSyncJobs"))
        {
            _logger.LogWarning(ex, "EtlSyncJobs table is unavailable while updating totals. Continuing without ETL job persistence.");
            _db.ChangeTracker.Clear();
        }
    }

    private async Task CompleteJobAsync(
        int? jobId,
        Guid countyId,
        CountySyncResult result,
        TimeSpan duration,
        CancellationToken cancellationToken)
    {
        if (!jobId.HasValue)
        {
            return;
        }

        var job = await _db.Set<EtlSyncJob>().FirstAsync(item => item.Id == jobId, cancellationToken);
        job.CountyId = countyId;
        job.Status = result.Success ? "completed" : "failed";
        job.ProcessedRecords = result.RecordsProcessed;
        job.FailedRecords = result.ErrorCount;
        job.SkippedRecords = result.RecordsSkipped;
        job.DurationMs = Math.Max(0, (long)duration.TotalMilliseconds);
        job.RecordsPerSecond = duration.TotalSeconds > 0
            ? Math.Round(result.RecordsProcessed / duration.TotalSeconds, 2)
            : result.RecordsProcessed;
        job.Errors = result.Errors.Count > 0 ? JsonSerializer.Serialize(result.Errors) : null;
        job.Details = JsonSerializer.Serialize(new
        {
            result.RecordTypes,
            result.Metadata,
            result.LegacySystemType,
            result.Message
        });
        job.CompletedAt = DateTime.UtcNow;

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
            _db.ChangeTracker.Clear();
        }
        catch (Exception ex) when (IsMissingTable(ex, "EtlSyncJobs"))
        {
            _logger.LogWarning(ex, "EtlSyncJobs table is unavailable while finalizing sync. Sync will complete without ETL job persistence.");
            _db.ChangeTracker.Clear();
        }
    }

    private static CountySyncResult FinalizeResult(CountySyncResult result, TimeSpan duration)
    {
        result.Duration = duration;
        result.EndTime = result.Timestamp + duration;
        result.SyncDuration = duration;
        result.SyncTime = result.EndTime.Value;
        result.SyncTimestamp = result.EndTime.Value;
        return result;
    }

    private static bool ShouldImport(SyncOptions options, string dataType)
    {
        return options.DataTypes.Count == 0 ||
               options.DataTypes.Contains(dataType, StringComparer.OrdinalIgnoreCase);
    }

    private static bool MatchesFilters(PacsPropertyCore property, SyncOptions options)
    {
        if (options.PropertyTypes.Count > 0 &&
            !options.PropertyTypes.Contains(property.PropTypeCd ?? string.Empty, StringComparer.OrdinalIgnoreCase))
        {
            return false;
        }

        if (options.StartDate.HasValue && options.FullSync && property.LastModified.HasValue && property.LastModified.Value < options.StartDate.Value)
        {
            return false;
        }

        if (options.EndDate.HasValue && property.LastModified.HasValue && property.LastModified.Value > options.EndDate.Value)
        {
            return false;
        }

        return true;
    }

    private static bool ApplyPropertyValues(Property target, PacsPropertyCore source, PacsPropertyOwnership? ownership)
    {
        var changed = false;
        var now = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(source.PropTypeCd))
        {
            ApplyString(target.PropertyType, source.PropTypeCd, value => target.PropertyType = value, ref changed);
        }

        ApplyString(target.Address, BuildAddress(source), value => target.Address = value ?? target.Address, ref changed);

        if (ownership is not null && !string.IsNullOrWhiteSpace(ownership.OwnerName))
        {
            ApplyString(target.OwnerName, ownership.OwnerName, value => target.OwnerName = value, ref changed);
        }

        ApplyValue(target.AssessedValue, source.AssessedVal ?? target.AssessedValue, value => target.AssessedValue = value, ref changed);
        ApplyValue(target.LandValue, source.LandVal ?? target.LandValue, value => target.LandValue = value, ref changed);
        ApplyValue(target.ImprovementValue, source.ImprvVal ?? target.ImprovementValue, value => target.ImprovementValue = value, ref changed);
        ApplyValue(target.MarketValue, source.MarketVal ?? target.MarketValue, value => target.MarketValue = value, ref changed);
        var assessmentDate = source.LastModified ?? (target.AssessmentDate == default ? now : target.AssessmentDate);
        ApplyValue(target.AssessmentDate, assessmentDate, value => target.AssessmentDate = value, ref changed);
        ApplyValue(target.LastUpdated, source.LastModified ?? now, value => target.LastUpdated = value, ref changed);

        var taxYear = source.ApprYear ?? (target.TaxYear > 0 ? target.TaxYear : DateTime.UtcNow.Year);
        ApplyValue(target.TaxYear, taxYear, value => target.TaxYear = value, ref changed);

        if (changed)
        {
            target.UpdatedAt = now;
        }

        return changed;
    }

    private static bool ApplyAssessmentValues(PropertyAssessment target, PacsPropertyCore source)
    {
        var changed = false;
        var assessmentDate = source.LastModified ?? DateTime.UtcNow;

        ApplyValue(target.AssessedValue, source.AssessedVal ?? target.AssessedValue, value => target.AssessedValue = value, ref changed);
        ApplyValue(target.MarketValue, source.MarketVal ?? target.MarketValue, value => target.MarketValue = value, ref changed);
        ApplyValue(target.LandValue, source.LandVal ?? target.LandValue, value => target.LandValue = value, ref changed);
        ApplyValue(target.ImprovementValue, source.ImprvVal ?? target.ImprovementValue, value => target.ImprovementValue = value, ref changed);
        ApplyString(target.AssessmentMethod, "PACS_IMPORT", value => target.AssessmentMethod = value, ref changed);
        ApplyString(
            target.AssessorNotes,
            $"Imported from PACS prop_id {source.PropId.ToString(CultureInfo.InvariantCulture)}",
            value => target.AssessorNotes = value,
            ref changed);
        ApplyValue(target.AssessmentDate, assessmentDate, value => target.AssessmentDate = value, ref changed);
        ApplyValue(target.IsActive, true, value => target.IsActive = value, ref changed);
        ApplyValue(target.AssessorId, Guid.Empty, value => target.AssessorId = value, ref changed);

        return changed;
    }

    private static int ResolveAssessmentYear(PacsPropertyCore source)
    {
        return source.ApprYear.GetValueOrDefault(DateTime.UtcNow.Year);
    }

    private static string BuildAddress(PacsPropertyCore source)
    {
        var line1 = Normalize(source.SitusAddr);
        var city = Normalize(source.SitusCity);
        var zip = Normalize(source.SitusZip);

        if (string.Equals(line1, "UNDETERMINED", StringComparison.OrdinalIgnoreCase))
        {
            line1 = null;
        }

        if (string.IsNullOrWhiteSpace(line1) && !string.IsNullOrWhiteSpace(source.LegalDesc))
        {
            return source.LegalDesc.Trim();
        }

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(line1))
        {
            parts.Add(line1);
        }

        var localityParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(city))
        {
            localityParts.Add(city);
        }

        if (!string.IsNullOrWhiteSpace(line1) || !string.IsNullOrWhiteSpace(city) || !string.IsNullOrWhiteSpace(zip))
        {
            localityParts.Add("WA");
        }

        var locality = string.Join(", ", localityParts);

        if (!string.IsNullOrWhiteSpace(locality))
        {
            parts.Add(locality);
        }

        if (!string.IsNullOrWhiteSpace(zip))
        {
            parts.Add(zip);
        }

        return parts.Count > 0
            ? string.Join(" ", parts)
            : $"PACS {Normalize(source.GeoId) ?? source.PropId.ToString(CultureInfo.InvariantCulture)}";
    }

    private static string BuildAssessmentKey(Guid propertyId, int year)
    {
        return $"{propertyId:N}:{year}";
    }

    private async Task ImportComparableSalesAsync(
        Guid countyId,
        SyncOptions options,
        SyncCounters counters,
        CancellationToken cancellationToken)
    {
        var batchSize = Math.Clamp(options.BatchSize <= 0 ? 500 : options.BatchSize, 1, 1000);
        var page = 1;
        var totalRowsSeen = 0;

        while (true)
        {
            var paged = await _pacsAdapter.GetComparableSalesAsync(page, batchSize, cancellationToken);
            totalRowsSeen += paged.Items.Count;
            _logger.LogInformation(
                "PACS comparable sales page {Page}: {ItemCount} items, totalCount={TotalCount}, hasMore={HasMore}",
                page,
                paged.Items.Count,
                paged.TotalCount,
                paged.HasMore);
            if (paged.Items.Count == 0)
            {
                break;
            }

            await ProcessComparableSalesBatchAsync(countyId, paged.Items, counters, cancellationToken);

            if (!paged.HasMore)
            {
                break;
            }

            page++;
        }

        _logger.LogInformation(
            "PACS comparable sales import complete: rowsSeen={RowsSeen}, salesAdded={SalesAdded}, salesUpdated={SalesUpdated}, salesSkipped={SalesSkipped}",
            totalRowsSeen,
            counters.SalesAdded,
            counters.SalesUpdated,
            counters.SalesSkipped);
    }

    private async Task ProcessComparableSalesBatchAsync(
        Guid countyId,
        IReadOnlyList<PacsComparableSale> sourceSales,
        SyncCounters counters,
        CancellationToken cancellationToken)
    {
        var filtered = sourceSales
            .Where(sale => sale.SalePrice > 0 && sale.SaleDate != default)
            .ToList();

        _logger.LogInformation(
            "Processing comparable sales batch: source={SourceCount}, filtered={FilteredCount}, countyId={CountyId}",
            sourceSales.Count,
            filtered.Count,
            countyId);

        if (filtered.Count == 0)
        {
            counters.SalesSkipped += sourceSales.Count;
            return;
        }

        var parcelIds = filtered
            .Select(sale => Normalize(sale.GeoId))
            .Where(parcelId => !string.IsNullOrWhiteSpace(parcelId))
            .Cast<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingSales = await _db.ComparableSales
            .Where(sale => sale.CountyId == countyId && parcelIds.Contains(sale.ParcelId))
            .ToListAsync(cancellationToken);

        _logger.LogInformation(
            "Comparable sales batch lookup: distinctParcels={ParcelCount}, existingMatches={ExistingCount}",
            parcelIds.Count,
            existingSales.Count);

        var existingSalesByKey = existingSales.ToDictionary(
            BuildComparableSaleKey,
            sale => sale,
            StringComparer.OrdinalIgnoreCase);

        var propertyAddressByParcelId = await _db.Properties
            .Where(property => parcelIds.Contains(property.ParcelId))
            .Select(property => new { property.ParcelId, property.Address })
            .ToDictionaryAsync(
                property => property.ParcelId,
                property => property.Address,
                StringComparer.OrdinalIgnoreCase,
                cancellationToken);

        foreach (var sourceSale in filtered)
        {
            var normalizedParcelId = Normalize(sourceSale.GeoId) ?? $"PACS-{sourceSale.PropId.ToString(CultureInfo.InvariantCulture)}";
            var comparisonKey = BuildComparableSaleKey(countyId, normalizedParcelId, sourceSale.SaleDate, sourceSale.SalePrice);

            if (!existingSalesByKey.TryGetValue(comparisonKey, out var comparableSale))
            {
                comparableSale = new CoreComparableSale
                {
                    Id = Guid.NewGuid(),
                    CountyId = countyId,
                    ParcelId = normalizedParcelId,
                    SaleDate = sourceSale.SaleDate,
                    SalePrice = sourceSale.SalePrice,
                    IngestedBy = "terrafusionsync",
                    IngestedAt = DateTime.UtcNow
                };

                ApplyComparableSaleValues(
                    comparableSale,
                    sourceSale,
                    propertyAddressByParcelId.TryGetValue(normalizedParcelId, out var propertyAddress)
                        ? propertyAddress
                        : null);
                _db.ComparableSales.Add(comparableSale);
                existingSalesByKey[comparisonKey] = comparableSale;
                counters.SalesAdded++;
            }
            else if (ApplyComparableSaleValues(
                comparableSale,
                sourceSale,
                propertyAddressByParcelId.TryGetValue(normalizedParcelId, out var propertyAddress)
                    ? propertyAddress
                    : null))
            {
                counters.SalesUpdated++;
            }
            else
            {
                counters.SalesSkipped++;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        _db.ChangeTracker.Clear();
    }

    private static string BuildLegacyPropertyId(PacsPropertyCore property)
    {
        return $"PACS-{property.PropId}";
    }

    private static string BuildComparableSaleKey(CoreComparableSale sale)
    {
        return BuildComparableSaleKey(sale.CountyId, sale.ParcelId, sale.SaleDate, sale.SalePrice);
    }

    private static string BuildComparableSaleKey(Guid countyId, string parcelId, DateTime saleDate, decimal salePrice)
    {
        return $"{countyId:N}:{parcelId.Trim().ToUpperInvariant()}:{saleDate:yyyyMMdd}:{salePrice:F2}";
    }

    private static bool ApplyComparableSaleValues(
        CoreComparableSale target,
        PacsComparableSale sourceSale,
        string? operationalPropertyAddress)
    {
        var changed = false;
        var normalizedParcelId = Normalize(sourceSale.GeoId) ?? target.ParcelId;
        var normalizedAddress = BuildComparableSaleAddress(sourceSale, operationalPropertyAddress);

        ApplyString(target.ParcelId, normalizedParcelId, value => target.ParcelId = value ?? target.ParcelId, ref changed);
        ApplyValue(target.SaleDate, sourceSale.SaleDate, value => target.SaleDate = value, ref changed);
        ApplyValue(target.SalePrice, sourceSale.SalePrice, value => target.SalePrice = value, ref changed);
        ApplyString(target.PropertyType, NormalizePropertyType(sourceSale.PropTypeCd), value => target.PropertyType = value ?? target.PropertyType, ref changed);
        ApplyString(target.Address, normalizedAddress, value => target.Address = value, ref changed);
        ApplyString(target.Neighborhood, NormalizeNeighborhood(sourceSale.Neighborhood), value => target.Neighborhood = value, ref changed);
        ApplyString(target.SaleQualification, ClassifySaleQualification(sourceSale), value => target.SaleQualification = value ?? target.SaleQualification, ref changed);
        ApplyValue(target.IsVerified, true, value => target.IsVerified = value, ref changed);
        ApplyString(target.VerificationSource, BuildVerificationSource(sourceSale), value => target.VerificationSource = value, ref changed);

        return changed;
    }

    private static string NormalizePropertyType(string? propertyTypeCode)
    {
        var normalized = Normalize(propertyTypeCode)?.ToUpperInvariant();
        return normalized switch
        {
            null or "" => "unknown",
            var value when value.Contains("COM") => "commercial",
            var value when value.Contains("IND") => "industrial",
            var value when value.Contains("AGR") => "agricultural",
            _ => "residential"
        };
    }

    private static string ClassifySaleQualification(PacsComparableSale sale)
    {
        var deedType = Normalize(sale.DeedTypeCd)?.ToLowerInvariant();
        var ratioType = Normalize(sale.SaleRatioTypeCd);

        if (deedType is
            "qcd" or
            "odeed" or
            "hdeed" or
            "spwd" or
            "trd" or
            "oth" or
            "mt" or
            "taxd" or
            "lieu" or
            "ease" or
            "detr" or
            "shd" or
            "shcs" or
            "uspat")
        {
            return "non-arms-length";
        }

        if (!string.IsNullOrWhiteSpace(ratioType) && !string.Equals(ratioType, "00", StringComparison.OrdinalIgnoreCase))
        {
            return "non-arms-length";
        }

        return "qualified";
    }

    private static string BuildVerificationSource(PacsComparableSale sale)
    {
        var deedType = Normalize(sale.DeedTypeCd) ?? "unknown";
        return $"PACS sale/deed import ({deedType})";
    }

    private static string? NormalizeNeighborhood(string? value)
    {
        var normalized = Normalize(value)?.ToUpperInvariant();
        return normalized switch
        {
            null or "" => null,
            "UNDETERMINED" => null,
            "KENENWICK" => "KENNEWICK",
            "W RICHLAND" => "WEST RICHLAND",
            "BENTON COUNTY" => null,
            _ => normalized
        };
    }

    private static string BuildComparableSaleAddress(PacsComparableSale sale, string? operationalPropertyAddress)
    {
        var line1 = Normalize(sale.SitusAddr);
        if (string.IsNullOrWhiteSpace(line1) ||
            string.Equals(line1, "UNDETERMINED", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedOperationalAddress = Normalize(operationalPropertyAddress);
            if (!string.IsNullOrWhiteSpace(normalizedOperationalAddress) &&
                normalizedOperationalAddress.Contains(',', StringComparison.Ordinal))
            {
                return normalizedOperationalAddress;
            }

            return $"PACS {Normalize(sale.GeoId) ?? sale.PropId.ToString(CultureInfo.InvariantCulture)}";
        }

        return line1;
    }

    private static void IndexProperty(
        IDictionary<string, Property> existingByParcelId,
        IDictionary<string, Property> existingByLegacyId,
        Property property)
    {
        var parcelId = Normalize(property.ParcelId);
        if (!string.IsNullOrWhiteSpace(parcelId))
        {
            existingByParcelId[parcelId] = property;
        }

        var parcelNumber = Normalize(property.ParcelNumber);
        if (!string.IsNullOrWhiteSpace(parcelNumber))
        {
            existingByParcelId[parcelNumber] = property;
        }

        var legacyPropertyId = Normalize(property.PropertyId);
        if (!string.IsNullOrWhiteSpace(legacyPropertyId))
        {
            existingByLegacyId[legacyPropertyId] = property;
        }
    }

    private static Property SelectCanonicalProperty(IEnumerable<Property> properties)
    {
        return properties
            .OrderByDescending(property => Normalize(property.ParcelId) == property.ParcelId ? 1 : 0)
            .ThenByDescending(property => Normalize(property.ParcelNumber) == property.ParcelNumber ? 1 : 0)
            .ThenByDescending(property => IsPlaceholderAddress(property.Address) ? 0 : 1)
            .ThenByDescending(property => property.UpdatedAt)
            .ThenBy(property => property.CreatedAt)
            .First();
    }

    private static bool NormalizeCanonicalImportedProperty(Property property)
    {
        var changed = false;
        var normalizedParcelId = Normalize(property.ParcelId);
        if (normalizedParcelId is not null &&
            !string.Equals(property.ParcelId, normalizedParcelId, StringComparison.Ordinal))
        {
            property.ParcelId = normalizedParcelId;
            changed = true;
        }

        var normalizedParcelNumber = Normalize(property.ParcelNumber) ?? normalizedParcelId;
        if (normalizedParcelNumber is not null &&
            !string.Equals(property.ParcelNumber, normalizedParcelNumber, StringComparison.Ordinal))
        {
            property.ParcelNumber = normalizedParcelNumber;
            changed = true;
        }

        if (IsPlaceholderAddress(property.Address) && !string.IsNullOrWhiteSpace(normalizedParcelNumber))
        {
            property.Address = $"PACS {normalizedParcelNumber}";
            changed = true;
        }

        if (changed)
        {
            property.UpdatedAt = DateTime.UtcNow;
        }

        return changed;
    }

    private async Task MergeDuplicatePropertiesAsync(
        Property canonical,
        IReadOnlyList<Property> duplicates,
        CancellationToken cancellationToken)
    {
        if (duplicates.Count == 0)
        {
            return;
        }

        var duplicateIds = duplicates.Select(property => property.Id).ToList();
        var duplicateAssessments = await _db.PropertyAssessments
            .Where(assessment => duplicateIds.Contains(assessment.PropertyId))
            .ToListAsync(cancellationToken);
        var canonicalAssessmentYears = await _db.PropertyAssessments
            .Where(assessment => assessment.PropertyId == canonical.Id)
            .Select(assessment => assessment.AssessmentYear)
            .ToListAsync(cancellationToken);
        var assessmentYears = new HashSet<int>(canonicalAssessmentYears);

        foreach (var assessment in duplicateAssessments)
        {
            if (assessmentYears.Contains(assessment.AssessmentYear))
            {
                _db.PropertyAssessments.Remove(assessment);
                continue;
            }

            assessment.PropertyId = canonical.Id;
            assessmentYears.Add(assessment.AssessmentYear);
        }

        _db.Properties.RemoveRange(duplicates);
    }

    private static void ApplyString(string? currentValue, string? nextValue, Action<string?> setter, ref bool changed)
    {
        var normalizedCurrent = Normalize(currentValue);
        var normalizedNext = Normalize(nextValue);

        if (!string.Equals(normalizedCurrent, normalizedNext, StringComparison.Ordinal))
        {
            setter(normalizedNext);
            changed = true;
        }
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static bool IsPlaceholderAddress(string? address)
    {
        var normalized = Normalize(address);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return true;
        }

        return normalized.Equals("WA", StringComparison.OrdinalIgnoreCase) ||
               normalized.Equals("UNDETERMINED WA", StringComparison.OrdinalIgnoreCase);
    }

    private static void ApplyValue<T>(T currentValue, T nextValue, Action<T> setter, ref bool changed)
        where T : IEquatable<T>
    {
        if (!currentValue.Equals(nextValue))
        {
            setter(nextValue);
            changed = true;
        }
    }

    private static bool IsMissingTable(Exception exception, string tableName)
    {
        return exception.ToString().Contains($"no such table: {tableName}", StringComparison.OrdinalIgnoreCase);
    }

    private sealed record MappedPropertyBatchItem(PacsPropertyCore Source, Property TargetProperty);

    private sealed class SyncCounters
    {
        public int TotalRecords { get; set; }
        public int PropertiesProcessed { get; set; }
        public int PropertiesAdded { get; set; }
        public int PropertiesUpdated { get; set; }
        public int PropertiesSkipped { get; set; }
        public int AssessmentsAdded { get; set; }
        public int AssessmentsUpdated { get; set; }
        public int OwnersImported { get; set; }
        public int SalesAdded { get; set; }
        public int SalesUpdated { get; set; }
        public int SalesSkipped { get; set; }
    }
}
