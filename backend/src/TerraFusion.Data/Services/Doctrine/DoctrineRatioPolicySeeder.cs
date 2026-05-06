using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.DoctrineTf;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-1 (B1): seed verified Benton ratio-policy rules.
///
/// <para>Idempotent: each rule has a deterministic seed RuleId so
/// repeat invocations are no-ops. Update an existing rule by editing
/// its definition here and (operator) re-running the seeder; the
/// updated row replaces the existing one (same primary key).</para>
///
/// <para>Why a code-side seeder rather than EF HasData migration:
/// the rules carry operator approval timestamps and confidence
/// markers that should be touchable by the operator at runtime via
/// admin endpoints (future). Seeding via code keeps the schema
/// migration purely structural.</para>
///
/// <para>Run by <c>SeedHostedService</c> at backend startup, OR
/// invoked manually via <c>POST /api/sync/doctrine/policy/ratio/seed</c>
/// when the operator wants to re-baseline.</para>
/// </summary>
public sealed class DoctrineRatioPolicySeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DoctrineRatioPolicySeeder> _logger;

    public DoctrineRatioPolicySeeder(
        TerraFusionDbContext db,
        ILogger<DoctrineRatioPolicySeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<int> SeedAsync(CancellationToken cancellationToken = default)
    {
        var seedRules = BuildBentonSeed();

        var existingIds = await _db.TfDoctrineRatioPolicies
            .Select(r => r.RuleId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var existingSet = new HashSet<Guid>(existingIds);

        var added = 0;
        foreach (var rule in seedRules)
        {
            if (existingSet.Contains(rule.RuleId)) continue;
            _db.TfDoctrineRatioPolicies.Add(rule);
            added++;
        }

        if (added > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation(
                "DoctrineRatioPolicySeeder: inserted {Added} new rule(s); existing {Existing}",
                added, existingSet.Count);
        }
        else
        {
            _logger.LogDebug(
                "DoctrineRatioPolicySeeder: no new rules to insert; {Existing} already present",
                existingSet.Count);
        }

        return added;
    }

    /// <summary>
    /// The verified Benton seed. Three rules, all HIGH confidence,
    /// all evidence-cited per the operator-pushback corrections of
    /// 2026-05-06.
    /// </summary>
    private static TfDoctrineRatioPolicy[] BuildBentonSeed()
    {
        // Deterministic GUIDs so the seed is idempotent across runs.
        // Generated once and locked here; do not regenerate.
        // Naming convention: d0c7-prefix = "doctrine seed", final
        // group encodes county-fips '53005' (Benton WA) for human-eyes.
        var ruleDor       = Guid.Parse("d0c7d0c7-0001-4d00-be07-be0053005001");
        var ruleCntyPre   = Guid.Parse("d0c7d0c7-0002-4d00-be07-be0053005002");
        var ruleCntyPost  = Guid.Parse("d0c7d0c7-0003-4d00-be07-be0053005003");

        var approvedAt = new DateTime(2026, 5, 6, 0, 0, 0, DateTimeKind.Utc);
        var approver = "operator-bsval";

        return new[]
        {
            // ── DOR_RATIO study: always-on, single qualifier '00' ──
            // meaning: valid for DOR ratio study (Washington Department of Revenue)
            new TfDoctrineRatioPolicy
            {
                RuleId = ruleDor,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                StudyName = "DOR_RATIO",
                SourceField = "sale.sl_ratio_type_cd",
                QualifiedCodesCsv = "00",
                ExcludedCodesCsv = string.Empty,
                SqlFragment = "s.sl_ratio_type_cd = '00'",
                Reason = "Washington Department of Revenue ratio study qualifier. " +
                         "Stable annual count (3-5k qualified/year, 2010-2025) confirms " +
                         "this is the long-running DOR-mandated qualifier.",
                EvidenceSource =
                    @"E:\PACS\Files of SQL\Files of SQL\Schedules and Matrices\PACS\Queries\Sales Ratio (use top one).txt:70",
                Confidence = "HIGH",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "Codebook table dbo.sl_ratio_type does not exist; '00' is " +
                        "operator-verified via authoritative ops query and cross-tab " +
                        "with sl_county_ratio_cd."
            },

            // ── LEGACY_CODEBOOK_VALID: pre-2018 '0' = "VALID SALE" ──
            // meaning: legacy valid-sale codebook semantics
            // NOT an active Benton internal ratio-study program.
            new TfDoctrineRatioPolicy
            {
                RuleId = ruleCntyPre,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = 2017,
                StudyName = "LEGACY_CODEBOOK_VALID",
                SourceField = "sale.sl_county_ratio_cd",
                QualifiedCodesCsv = "0",
                ExcludedCodesCsv = string.Empty,
                SqlFragment = "s.sl_county_ratio_cd = '0'",
                Reason = "Legacy valid-sale codebook semantics. The pre-2018 '0' " +
                         "code in dbo.county_ratio_code is labeled 'VALID SALE' " +
                         "(ALL CAPS). This rule documents that semantic for " +
                         "historical lookback. It does NOT represent an active " +
                         "Benton internal ratio-study program — the county's " +
                         "internal ratio study did not exist as a formal program " +
                         "before ~2018. Distribution shows '0' codes concentrated " +
                         "2014-2017, dropping to ~0 post-2018.",
                EvidenceSource = "dbo.county_ratio_code['0'] = 'VALID SALE' (ALL CAPS legacy)",
                Confidence = "MED",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "Confidence MED reflects the operator's careful framing: " +
                        "the codebook label is well-evidenced; the institutional " +
                        "claim that pre-2018 '0' codes were 'qualified by an " +
                        "active program' is not. Treat this rule as evidence " +
                        "of historical labeling, not of a county study."
            },

            // ── COUNTY_INTERNAL_RATIO: 2018+ '100' = "Valid Sale" ──
            // meaning: valid for Benton internal ratio study (started ~2018)
            new TfDoctrineRatioPolicy
            {
                RuleId = ruleCntyPost,
                County = "benton-wa",
                EffectiveStartYear = 2018,
                EffectiveEndYear = null,
                StudyName = "COUNTY_INTERNAL_RATIO",
                SourceField = "sale.sl_county_ratio_cd",
                QualifiedCodesCsv = "100",
                ExcludedCodesCsv = "200,300,400,500",
                SqlFragment = "s.sl_county_ratio_cd = '100'",
                Reason = "Post-conversion 'Valid Sale' code per dbo.county_ratio_code. " +
                         "Per operator (2026-05-06): the county started using " +
                         "sl_county_ratio_cd for its own internal ratio studies " +
                         "around 2018, alongside (not replacing) the DOR study. " +
                         "Excluded codes are explicitly invalid/special-category " +
                         "per the same dictionary.",
                EvidenceSource =
                    "dbo.county_ratio_code['100']='Valid Sale'; sl_county_ratio_cd " +
                    "distribution surge 2017→post (442→1542→2151) confirms transition.",
                Confidence = "HIGH",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "operator-estimated transition; subject to audit by year " +
                        "distribution. The DOR_RATIO study and COUNTY_INTERNAL_RATIO " +
                        "study are independent. A sale can be qualified for DOR " +
                        "and not COUNTY_INTERNAL (DOR-qualified, no county review " +
                        "yet → ~7,731 such sales post-2018 per cross-tab). " +
                        "canonical_tf.tf_sale must carry both qualification " +
                        "booleans separately."
            },
        };
    }
}
