// =============================================================================
// PACS EF Core Adapter - Development/SQLite Implementation
// =============================================================================
// EF Core implementation of IPacsAdapter for local development.
// Reads from seeded PACS mirror tables in TerraFusionDbContext (SQLite).
// Registered when no PacsConnection string is configured.
// =============================================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.Pacs;
using TerraFusion.Core.PACS;
using TerraFusion.Data;

namespace TerraFusion.API.Services
{
    /// <summary>
    /// EF Core implementation of IPacsAdapter for local development.
    /// Reads seeded PACS data from SQLite via TerraFusionDbContext.
    /// </summary>
    public sealed class PacsEfAdapter : IPacsAdapter
    {
        private readonly TerraFusionDbContext _db;
        private readonly ILogger<PacsEfAdapter> _logger;

        public PacsEfAdapter(TerraFusionDbContext db, ILogger<PacsEfAdapter> logger)
        {
            _db = db;
            _logger = logger;
        }

        // ═══════════════════════════════════════════════════════════════
        // CONTRACT PROOF & HEALTH
        // ═══════════════════════════════════════════════════════════════

        public Task<PacsContractProof> ValidateContractAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new PacsContractProof
            {
                IsValid = true,
                ContractId = "pacscontract.v1-ef",
                ValidatedAt = DateTime.UtcNow,
                DatabaseConnection = new PacsProofItem { Name = "EF Core SQLite", Passed = true, Severity = "info", Details = "Local dev adapter" },
                RequiredViews = new PacsProofItem { Name = "EF DbSets", Passed = true, Severity = "info", Details = "Using EF Core entities, not SQL views" },
                RequiredIndexes = new PacsProofItem { Name = "EF Indexes", Passed = true, Severity = "info" },
                HealthCheckProcedure = new PacsProofItem { Name = "N/A", Passed = true, Severity = "info", Details = "No stored proc in SQLite" },
                HealthCheckExecution = new PacsProofItem { Name = "N/A", Passed = true, Severity = "info" },
            });
        }

        public async Task<PacsConnectionStatus> GetConnectionStatusAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var count = await _db.PacsParcel.CountAsync(cancellationToken);
                return new PacsConnectionStatus
                {
                    IsConnected = true,
                    DatabaseName = "terrafusion-dev.db (EF Core)",
                    ServerName = "localhost",
                    LastConnectedAt = DateTime.UtcNow,
                    LatencyMs = 0,
                };
            }
            catch (Exception ex)
            {
                return new PacsConnectionStatus
                {
                    IsConnected = false,
                    ErrorMessage = ex.Message,
                    ErrorCode = PacsErrorCodes.ConnectionFailed,
                };
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PROPERTY QUERIES
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsPropertyCore?> GetPropertyByIdAsync(int propId, CancellationToken cancellationToken = default)
        {
            var parcel = await _db.PacsParcel
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.PropId == propId, cancellationToken);

            if (parcel is null) return null;

            var situs = await GetPrimarySitus(parcel.Id, parcel.PropId, cancellationToken);
            var valuation = await GetLatestValuation(parcel.PropId, cancellationToken);

            return MapToCore(parcel, situs, valuation);
        }

        public async Task<PacsPropertyCore?> GetPropertyByGeoIdAsync(string geoId, CancellationToken cancellationToken = default)
        {
            var parcel = await _db.PacsParcel
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.GeoId == geoId, cancellationToken);

            if (parcel is null) return null;

            var situs = await GetPrimarySitus(parcel.Id, parcel.PropId, cancellationToken);
            var valuation = await GetLatestValuation(parcel.PropId, cancellationToken);

            return MapToCore(parcel, situs, valuation);
        }

        public async Task<PacsPagedResult<PacsPropertyCore>> GetPropertiesAsync(
            int page = 1, int pageSize = 100, CancellationToken cancellationToken = default)
        {
            var totalCount = await _db.PacsParcel.CountAsync(cancellationToken);

            var parcels = await _db.PacsParcel
                .AsNoTracking()
                .OrderBy(p => p.PropId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            if (parcels.Count == 0)
            {
                return new PacsPagedResult<PacsPropertyCore>
                {
                    Items = Array.Empty<PacsPropertyCore>(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                };
            }

            // Batch-load situs and valuations for this page
            var parcelIds = parcels.Select(p => p.Id).ToList();
            var propIds = parcels.Select(p => p.PropId).ToList();

            var situses = await _db.PacsSituses
                .AsNoTracking()
                .Where(s => parcelIds.Contains(s.ParcelId))
                .ToListAsync(cancellationToken);

            var valuations = await _db.PacsValuations
                .AsNoTracking()
                .Where(v => propIds.Contains(v.PacsPropId))
                .ToListAsync(cancellationToken);

            var items = parcels.Select(p =>
            {
                var situs = situses
                    .Where(s => s.ParcelId == p.Id)
                    .OrderByDescending(s => s.PrimaryFlag == "Y")
                    .FirstOrDefault();

                var val = valuations
                    .Where(v => v.PacsPropId == p.PropId)
                    .OrderByDescending(v => v.PropValYear)
                    .FirstOrDefault();

                return MapToCore(p, situs, val);
            }).ToList();

            return new PacsPagedResult<PacsPropertyCore>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // SEARCH (server-side text match on situs address/city/GeoId)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Server-side search across GeoId, situs display/street/city.
        /// Returns paginated results filtered at the SQL level (not in-page).
        /// </summary>
        public async Task<PacsPagedResult<PacsPropertyCore>> SearchPropertiesAsync(
            string searchText, int page = 1, int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var likePattern = $"%{searchText}%";

            // Match by situs address fields
            var matchingSitusParcelIds = await _db.PacsSituses
                .AsNoTracking()
                .Where(s =>
                    (s.SitusDisplay != null && EF.Functions.Like(s.SitusDisplay, likePattern)) ||
                    (s.StreetName != null && EF.Functions.Like(s.StreetName, likePattern)) ||
                    (s.City != null && EF.Functions.Like(s.City, likePattern)))
                .Select(s => s.ParcelId)
                .Distinct()
                .ToListAsync(cancellationToken);

            // Also match by GeoId substring
            var matchingGeoIdParcelIds = await _db.PacsParcel
                .AsNoTracking()
                .Where(p => p.GeoId != null && EF.Functions.Like(p.GeoId, likePattern))
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            var allMatchingIds = matchingSitusParcelIds
                .Union(matchingGeoIdParcelIds)
                .Distinct()
                .ToList();

            var totalCount = allMatchingIds.Count;

            if (totalCount == 0)
            {
                return new PacsPagedResult<PacsPropertyCore>
                {
                    Items = Array.Empty<PacsPropertyCore>(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = 0,
                };
            }

            var parcels = await _db.PacsParcel
                .AsNoTracking()
                .Where(p => allMatchingIds.Contains(p.Id))
                .OrderBy(p => p.PropId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            if (parcels.Count == 0)
            {
                return new PacsPagedResult<PacsPropertyCore>
                {
                    Items = Array.Empty<PacsPropertyCore>(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                };
            }

            var parcelIds = parcels.Select(p => p.Id).ToList();
            var propIds = parcels.Select(p => p.PropId).ToList();

            var situses = await _db.PacsSituses
                .AsNoTracking()
                .Where(s => parcelIds.Contains(s.ParcelId))
                .ToListAsync(cancellationToken);

            var valuations = await _db.PacsValuations
                .AsNoTracking()
                .Where(v => propIds.Contains(v.PacsPropId))
                .ToListAsync(cancellationToken);

            var items = parcels.Select(p =>
            {
                var situs = situses
                    .Where(s => s.ParcelId == p.Id)
                    .OrderByDescending(s => s.PrimaryFlag == "Y")
                    .FirstOrDefault();
                var val = valuations
                    .Where(v => v.PacsPropId == p.PropId)
                    .OrderByDescending(v => v.PropValYear)
                    .FirstOrDefault();
                return MapToCore(p, situs, val);
            }).ToList();

            return new PacsPagedResult<PacsPropertyCore>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // OWNERSHIP QUERIES
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsPropertyOwnership?> GetOwnershipAsync(int propId, CancellationToken cancellationToken = default)
        {
            var owner = await _db.PacsOwners
                .AsNoTracking()
                .Where(o => o.PacsPropId == propId)
                .OrderByDescending(o => o.OwnerTaxYear)
                .FirstOrDefaultAsync(cancellationToken);

            return owner is null ? null : MapToOwnership(owner);
        }

        public async Task<IReadOnlyList<PacsPropertyOwnership>> GetOwnershipByIdsAsync(
            IEnumerable<int> propIds, CancellationToken cancellationToken = default)
        {
            var ids = propIds.ToList();
            var owners = await _db.PacsOwners
                .AsNoTracking()
                .Where(o => ids.Contains(o.PacsPropId))
                .ToListAsync(cancellationToken);

            // Return latest owner per propId
            return owners
                .GroupBy(o => o.PacsPropId)
                .Select(g => g.OrderByDescending(o => o.OwnerTaxYear).First())
                .Select(MapToOwnership)
                .ToList();
        }

        // ═══════════════════════════════════════════════════════════════
        // ASSESSMENT QUERIES
        // ═══════════════════════════════════════════════════════════════

        public async Task<IReadOnlyList<PacsAssessmentHistory>> GetAssessmentHistoryAsync(
            int propId, int? yearFrom = null, int? yearTo = null,
            CancellationToken cancellationToken = default)
        {
            var query = _db.PacsValuations
                .AsNoTracking()
                .Where(v => v.PacsPropId == propId);

            if (yearFrom.HasValue)
                query = query.Where(v => v.PropValYear >= yearFrom.Value);
            if (yearTo.HasValue)
                query = query.Where(v => v.PropValYear <= yearTo.Value);

            var valuations = await query
                .OrderByDescending(v => v.PropValYear)
                .ToListAsync(cancellationToken);

            return valuations.Select(MapToAssessment).ToList();
        }

        public async Task<PacsAssessmentHistory?> GetCurrentAssessmentAsync(int propId, CancellationToken cancellationToken = default)
        {
            var val = await _db.PacsValuations
                .AsNoTracking()
                .Where(v => v.PacsPropId == propId)
                .OrderByDescending(v => v.PropValYear)
                .FirstOrDefaultAsync(cancellationToken);

            return val is null ? null : MapToAssessment(val);
        }

        // ═══════════════════════════════════════════════════════════════
        // COMPARABLE SALES
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsPagedResult<PacsComparableSale>> GetComparableSalesAsync(
            int page = 1, int pageSize = 500, CancellationToken cancellationToken = default)
        {
            var totalCount = await _db.PacsSales.CountAsync(cancellationToken);

            var sales = await _db.PacsSales
                .AsNoTracking()
                .Include(s => s.Parcel)
                .OrderByDescending(s => s.SaleDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var items = sales.Select(s => new PacsComparableSale
            {
                PropId = s.PacsPropId,
                GeoId = s.Parcel?.GeoId ?? string.Empty,
                SaleDate = s.SaleDate ?? DateTime.MinValue,
                SalePrice = s.SalePrice ?? 0m,
                PropTypeCd = s.PrimaryUseCd,
                SitusAddr = null, // Would need situs join — not critical for alpha
                Neighborhood = null,
                SaleRatioTypeCd = s.SaleRatioTypeCd,
                DeedTypeCd = s.SaleTypeCd,
                Consideration = s.SaleComment,
                LastModified = s.UpdatedAt,
            }).ToList();

            return new PacsPagedResult<PacsComparableSale>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // CAMA CHARACTERISTICS
        // ═══════════════════════════════════════════════════════════════

        public async Task<PacsPagedResult<PacsCamaCharacteristic>> GetCamaCharacteristicsAsync(
            int page = 1, int pageSize = 500, CancellationToken cancellationToken = default)
        {
            var totalCount = await _db.PacsImprovementDetails.CountAsync(cancellationToken);

            var details = await _db.PacsImprovementDetails
                .AsNoTracking()
                .OrderBy(d => d.PacsPropId)
                .ThenBy(d => d.PropValYear)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            // Load attributes for these details
            var detailPropIds = details.Select(d => d.PacsPropId).Distinct().ToList();
            var attributes = await _db.PacsImprovementAttributes
                .AsNoTracking()
                .Where(a => detailPropIds.Contains(a.PacsPropId))
                .ToListAsync(cancellationToken);

            var items = details.Select(d =>
            {
                var attrs = attributes
                    .Where(a => a.PacsPropId == d.PacsPropId
                             && a.PropValYear == d.PropValYear
                             && a.PacsImprvId == d.PacsImprvId)
                    .ToList();

                return MapToCama(d, attrs);
            }).ToList();

            return new PacsPagedResult<PacsCamaCharacteristic>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // IMPROVEMENT COST MATRICES
        // ═══════════════════════════════════════════════════════════════

        public Task<PacsPagedResult<PacsImprovementCostMatrix>> GetImprovementCostMatricesAsync(
            int page = 1, int pageSize = 500, CancellationToken cancellationToken = default)
        {
            // No matrix data in the seeded EF Core tables
            return Task.FromResult(new PacsPagedResult<PacsImprovementCostMatrix>
            {
                Items = Array.Empty<PacsImprovementCostMatrix>(),
                Page = page,
                PageSize = pageSize,
                TotalCount = 0,
            });
        }

        // ═══════════════════════════════════════════════════════════════
        // BATCH OPERATIONS
        // ═══════════════════════════════════════════════════════════════

        public async Task<IReadOnlyList<PacsPropertyCore>> GetPropertiesByIdsAsync(
            IEnumerable<int> propIds, CancellationToken cancellationToken = default)
        {
            var ids = propIds.ToList();
            var parcels = await _db.PacsParcel
                .AsNoTracking()
                .Where(p => ids.Contains(p.PropId))
                .ToListAsync(cancellationToken);

            var parcelGuids = parcels.Select(p => p.Id).ToList();
            var propIdList = parcels.Select(p => p.PropId).ToList();

            var situses = await _db.PacsSituses
                .AsNoTracking()
                .Where(s => parcelGuids.Contains(s.ParcelId))
                .ToListAsync(cancellationToken);

            var valuations = await _db.PacsValuations
                .AsNoTracking()
                .Where(v => propIdList.Contains(v.PacsPropId))
                .ToListAsync(cancellationToken);

            return parcels.Select(p =>
            {
                var situs = situses
                    .Where(s => s.ParcelId == p.Id)
                    .OrderByDescending(s => s.PrimaryFlag == "Y")
                    .FirstOrDefault();
                var val = valuations
                    .Where(v => v.PacsPropId == p.PropId)
                    .OrderByDescending(v => v.PropValYear)
                    .FirstOrDefault();
                return MapToCore(p, situs, val);
            }).ToList();
        }

        public async Task<IReadOnlyList<PacsPropertyCore>> GetChangedPropertiesAsync(
            DateTime since, int maxResults = 1000, CancellationToken cancellationToken = default)
        {
            var parcels = await _db.PacsParcel
                .AsNoTracking()
                .Where(p => p.SyncedAt >= since)
                .OrderByDescending(p => p.SyncedAt)
                .Take(maxResults)
                .ToListAsync(cancellationToken);

            if (parcels.Count == 0) return Array.Empty<PacsPropertyCore>();

            var parcelGuids = parcels.Select(p => p.Id).ToList();
            var propIds = parcels.Select(p => p.PropId).ToList();

            var situses = await _db.PacsSituses
                .AsNoTracking()
                .Where(s => parcelGuids.Contains(s.ParcelId))
                .ToListAsync(cancellationToken);

            var valuations = await _db.PacsValuations
                .AsNoTracking()
                .Where(v => propIds.Contains(v.PacsPropId))
                .ToListAsync(cancellationToken);

            return parcels.Select(p =>
            {
                var situs = situses
                    .Where(s => s.ParcelId == p.Id)
                    .OrderByDescending(s => s.PrimaryFlag == "Y")
                    .FirstOrDefault();
                var val = valuations
                    .Where(v => v.PacsPropId == p.PropId)
                    .OrderByDescending(v => v.PropValYear)
                    .FirstOrDefault();
                return MapToCore(p, situs, val);
            }).ToList();
        }

        // ═══════════════════════════════════════════════════════════════
        // MAPPING HELPERS
        // ═══════════════════════════════════════════════════════════════

        private static PacsPropertyCore MapToCore(PacsParcel parcel, PacsSitus? situs, PacsValuation? val)
        {
            // Build address from situs components
            string? situsAddr = null;
            if (situs is not null)
            {
                situsAddr = situs.SitusDisplay;
                if (string.IsNullOrWhiteSpace(situsAddr))
                {
                    var parts = new[] { situs.StreetNum, situs.StreetPrefix, situs.StreetName, situs.StreetSuffix }
                        .Where(s => !string.IsNullOrWhiteSpace(s));
                    situsAddr = string.Join(" ", parts);
                }
            }

            return new PacsPropertyCore
            {
                PropId = parcel.PropId,
                GeoId = parcel.GeoId ?? string.Empty,
                PropTypeCd = parcel.PropTypeCd,
                SitusAddr = situsAddr,
                SitusCity = situs?.City,
                SitusZip = situs?.Zip,
                LegalDesc = val?.LegalDesc,
                AssessedVal = val?.AssessedVal,
                MarketVal = val?.Market,
                LandVal = (val?.LandHstdVal ?? 0) + (val?.LandNonHstdVal ?? 0),
                ImprvVal = val?.ImprvVal,
                ApprYear = val?.PropValYear,
                LastModified = parcel.SyncedAt,
            };
        }

        private static PacsPropertyOwnership MapToOwnership(PacsOwner owner)
        {
            return new PacsPropertyOwnership
            {
                PropId = owner.PacsPropId,
                OwnerName = owner.FileAsName ?? $"{owner.FirstName} {owner.LastName}".Trim(),
                MailAddr1 = null, // Mailing address not in PacsOwner entity (excluded at ETL)
                MailAddr2 = null,
                MailCity = null,
                MailState = null,
                MailZip = null,
                PctOwnership = owner.PctOwnership,
                DeedDate = null, // Deed date tracked in PacsSale, not PacsOwner
            };
        }

        private static PacsAssessmentHistory MapToAssessment(PacsValuation val)
        {
            return new PacsAssessmentHistory
            {
                PropId = val.PacsPropId,
                PropValYr = val.PropValYear,
                AssessedVal = val.AssessedVal,
                MarketVal = val.Market,
                LandVal = (val.LandHstdVal ?? 0) + (val.LandNonHstdVal ?? 0),
                ImprvVal = val.ImprvVal,
                AppraisedBy = val.LastAppraiserId?.ToString(),
                AppraisalDt = val.LastAppraisalDate,
            };
        }

        private static PacsCamaCharacteristic MapToCama(PacsImprovementDetail detail, List<PacsImprovementAttribute> attrs)
        {
            decimal? GetAttr(string code) => attrs.FirstOrDefault(a => a.AttributeCode == code)?.AttributeValue;
            int? GetAttrInt(string code) => (int?)GetAttr(code);

            return new PacsCamaCharacteristic
            {
                PropId = detail.PacsPropId,
                GeoId = string.Empty, // Would need parcel join
                TaxYear = detail.PropValYear,
                BuildingType = detail.ImprvDetTypeCd,
                BuildingTypeDescription = detail.ImprvDetDesc,
                Region = null,
                SquareFeet = detail.ImprvDetArea,
                Stories = detail.NumStories,
                BasementSqft = null, // Not directly available
                GarageSqft = null,
                QualityGrade = null,
                ConditionGrade = detail.ConditionCode,
                ComplexityGrade = null,
                ExteriorWall = attrs.FirstOrDefault(a => a.AttributeCode == "EXT")?.AttributeCode,
                RoofType = attrs.FirstOrDefault(a => a.AttributeCode == "ROOF")?.AttributeCode,
                Foundation = null,
                HvacType = attrs.FirstOrDefault(a => a.AttributeCode == "HEAT")?.AttributeCode,
                InteriorFinish = null,
                YearBuilt = (int?)detail.YearBuilt,
                EffectiveAge = (int?)detail.ActualAge,
                EconomicLife = null,
                LandAreaSqft = null,
                LandZone = null,
                LandAdjustmentFactor = null,
                Bedrooms = GetAttrInt("BED"),
                Bathrooms = GetAttrInt("BATH"),
                Fireplaces = GetAttrInt("FP"),
                HasPool = GetAttr("POOL") > 0,
                FunctionalObsolescence = detail.FunctionalPct,
                ExternalObsolescence = detail.EconomicPct,
                Neighborhood = null,
                PropertyTypeCd = null,
                LastModified = detail.UpdatedAt,
            };
        }

        private async Task<PacsSitus?> GetPrimarySitus(Guid parcelId, int propId, CancellationToken ct)
        {
            // Try by ParcelId first (FK), fall back to PacsPropId
            var situs = await _db.PacsSituses
                .AsNoTracking()
                .Where(s => s.ParcelId == parcelId)
                .OrderByDescending(s => s.PrimaryFlag == "Y")
                .FirstOrDefaultAsync(ct);

            if (situs is null)
            {
                situs = await _db.PacsSituses
                    .AsNoTracking()
                    .Where(s => s.PacsPropId == propId)
                    .OrderByDescending(s => s.PrimaryFlag == "Y")
                    .FirstOrDefaultAsync(ct);
            }

            return situs;
        }

        private async Task<PacsValuation?> GetLatestValuation(int propId, CancellationToken ct)
        {
            return await _db.PacsValuations
                .AsNoTracking()
                .Where(v => v.PacsPropId == propId)
                .OrderByDescending(v => v.PropValYear)
                .FirstOrDefaultAsync(ct);
        }
    }
}
