using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Sync.PacsExemption;

namespace TerraFusion.Data.Services.CanonicalTf;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): upserts canonical_tf.dict_exemption_type
/// from PACS <c>exmpt_type</c> so tf_exemption type codes are dictionary-backed.
/// County-isolated upsert by (CountyId, ExemptionTypeCd). Small (~6 codes).
/// </summary>
public sealed class PacsExemptionDictPopulator : IPacsExemptionDictPopulator
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<PacsExemptionDictPopulator> _logger;

    public PacsExemptionDictPopulator(TerraFusionDbContext db, ILogger<PacsExemptionDictPopulator> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PacsExemptionDictResult> PopulateAsync(
        IPacsExemptionSource source, Guid countyId, string operatorName, CancellationToken cancellationToken = default)
    {
        try
        {
            var queryHash = Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes("exmpt_type@" + countyId)))[..16].ToLowerInvariant();
            var existing = await _db.Set<DictExemptionType>()
                .Where(d => d.CountyId == countyId)
                .ToDictionaryAsync(d => d.ExemptionTypeCd, cancellationToken).ConfigureAwait(false);

            var upserted = 0;
            var now = DateTime.UtcNow;
            await foreach (var t in source.StreamExemptionTypesAsync(cancellationToken).ConfigureAwait(false))
            {
                if (existing.TryGetValue(t.ExmptTypeCd, out var row))
                {
                    row.Description = t.ExmptDesc;
                    row.IsActive = true;
                    row.UpdatedAt = now;
                    row.SourceQueryHash = queryHash;
                }
                else
                {
                    _db.Set<DictExemptionType>().Add(new DictExemptionType
                    {
                        CountyId = countyId,
                        ExemptionTypeCd = t.ExmptTypeCd,
                        Description = t.ExmptDesc,
                        IsActive = true,
                        SourceQueryHash = queryHash,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }
                upserted++;
            }
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation("dict_exemption_type populated. county={C} upserted={U}", countyId, upserted);
            return new PacsExemptionDictResult { Status = "COMPLETED", TypesUpserted = upserted };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            var summary = $"{ex.GetType().Name}: {ex.Message}";
            _logger.LogError(ex, "dict_exemption_type populate FAILED");
            return new PacsExemptionDictResult { Status = "FAILED", ErrorSummary = summary };
        }
    }
}
