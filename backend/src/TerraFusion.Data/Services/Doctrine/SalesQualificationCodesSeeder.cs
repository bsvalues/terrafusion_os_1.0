using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.DoctrineTf;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-5: seed verified Benton sales qualification code
/// rules into <c>doctrine_tf.tf_doctrine_sales_qualification_codes</c>.
///
/// <para>Idempotent: each rule has a deterministic seed RuleId so
/// repeat invocations are no-ops. Rules with the same RuleId that
/// were deactivated by an operator (<c>ActiveFlag = false</c>) are
/// LEFT ALONE — the seeder only inserts missing rows; it never
/// reactivates a deactivated rule.</para>
///
/// <para>Mirrors the <see cref="DoctrineRatioPolicySeeder"/> pattern:
/// code-side seeder rather than EF HasData migration so the rules
/// can carry operator-mutable approval timestamps and confidence
/// markers, and so that the schema migration is purely structural.
/// </para>
///
/// <para>Run by <see cref="SalesQualificationCodesSeederHostedService"/>
/// at backend startup, OR invoked manually via
/// <c>POST /api/sync/doctrine/policy/sales-qualification/seed</c>.</para>
/// </summary>
public sealed class SalesQualificationCodesSeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<SalesQualificationCodesSeeder> _logger;

    public SalesQualificationCodesSeeder(
        TerraFusionDbContext db,
        ILogger<SalesQualificationCodesSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<int> SeedAsync(CancellationToken cancellationToken = default)
    {
        var seedRules = BuildBentonSeed();

        var existingIds = await _db.TfDoctrineSalesQualificationCodes
            .Select(r => r.RuleId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var existingSet = new HashSet<Guid>(existingIds);

        var added = 0;
        foreach (var rule in seedRules)
        {
            if (existingSet.Contains(rule.RuleId))
            {
                // Existing row — leave alone. Even if it has
                // ActiveFlag=false (operator-deactivated), do NOT
                // reactivate. Per V2 doctrine convention: soft-disable
                // is sticky.
                continue;
            }
            _db.TfDoctrineSalesQualificationCodes.Add(rule);
            added++;
        }

        if (added > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation(
                "SalesQualificationCodesSeeder: inserted {Added} new rule(s); existing {Existing}",
                added, existingSet.Count);
        }
        else
        {
            _logger.LogDebug(
                "SalesQualificationCodesSeeder: no new rules to insert; {Existing} already present",
                existingSet.Count);
        }

        return added;
    }

    /// <summary>
    /// The verified Benton seed. Three rules covering the post-2017
    /// DOR convention, the pre-2017 legacy carryover, and the post-
    /// 2018 county-internal-ratio convention.
    /// </summary>
    private static TfDoctrineSalesQualificationCode[] BuildBentonSeed()
    {
        // Deterministic GUIDs for idempotency. Naming convention:
        // d0c75a1e (= "doctrine sale") prefix + seed-id + Benton-FIPS
        // 53005 in trailing group.
        var ruleDorPost2017 = Guid.Parse("d0c75a1e-0001-4d05-be07-be0053005001");
        var ruleDorPre2017  = Guid.Parse("d0c75a1e-0002-4d05-be07-be0053005002");
        var ruleCountyPost2018 = Guid.Parse("d0c75a1e-0003-4d05-be07-be0053005003");

        return new[]
        {
            // DOR_RATIO post-2017: sl_county_ratio_cd = '100' = "Valid Sale"
            new TfDoctrineSalesQualificationCode
            {
                RuleId = ruleDorPost2017,
                SurfaceCode = "DOR_RATIO",
                SourceField = "sl_county_ratio_cd",
                EffectiveStartYear = 2017,
                EffectiveEndYear = null,
                QualifiedCodesJson = "[\"100\"]",
                EvidenceSource =
                    "PACS post-2017 DOR ratio convention; SYNC-COMPLETE-3 seal evidence",
                Confidence = "HIGH",
                ActiveFlag = true,
            },

            // DOR_RATIO pre-2017: sl_county_ratio_cd = '0' = "VALID SALE" (legacy codebook)
            new TfDoctrineSalesQualificationCode
            {
                RuleId = ruleDorPre2017,
                SurfaceCode = "DOR_RATIO",
                SourceField = "sl_county_ratio_cd",
                EffectiveStartYear = 1990,
                EffectiveEndYear = 2016,
                QualifiedCodesJson = "[\"0\"]",
                EvidenceSource =
                    "PACS pre-2017 DOR ratio convention; legacy column carryover",
                Confidence = "HIGH",
                ActiveFlag = true,
            },

            // COUNTY_RATIO post-2018: sl_ratio_type_cd = '00'
            new TfDoctrineSalesQualificationCode
            {
                RuleId = ruleCountyPost2018,
                SurfaceCode = "COUNTY_RATIO",
                SourceField = "sl_ratio_type_cd",
                EffectiveStartYear = 2018,
                EffectiveEndYear = null,
                QualifiedCodesJson = "[\"00\"]",
                EvidenceSource =
                    "County started using own ratio ~2018; reference_benton_sync_doctrine_corrections.md",
                Confidence = "MEDIUM",
                ActiveFlag = true,
            },
        };
    }
}
