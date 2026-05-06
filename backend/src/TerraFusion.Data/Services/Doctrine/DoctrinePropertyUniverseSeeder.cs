using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.DoctrineTf;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Data.Services.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-4: seed the six initial universe rules for Benton.
///
/// <para>Idempotent. Each rule has a deterministic
/// <see cref="TfDoctrinePropertyUniverse.RuleId"/> so repeat
/// invocations are no-ops.</para>
///
/// <para>Per design doc §"Initial seed-rule design": broad first
/// pass — no overfitting. Tightening property_use_cd coverage waits
/// on a profiling drain that captures live distributions.</para>
/// </summary>
public sealed class DoctrinePropertyUniverseSeeder
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<DoctrinePropertyUniverseSeeder> _logger;

    public DoctrinePropertyUniverseSeeder(
        TerraFusionDbContext db,
        ILogger<DoctrinePropertyUniverseSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<int> SeedAsync(CancellationToken cancellationToken = default)
    {
        var seedRules = BuildBentonSeed();

        var existingIds = await _db.TfDoctrinePropertyUniverses
            .Select(r => r.RuleId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var existingSet = new HashSet<Guid>(existingIds);

        var added = 0;
        foreach (var rule in seedRules)
        {
            if (existingSet.Contains(rule.RuleId)) continue;
            _db.TfDoctrinePropertyUniverses.Add(rule);
            added++;
        }

        if (added > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation(
                "DoctrinePropertyUniverseSeeder: inserted {Added} rule(s); existing {Existing}",
                added, existingSet.Count);
        }
        else
        {
            _logger.LogDebug(
                "DoctrinePropertyUniverseSeeder: no new rules; {Existing} already present",
                existingSet.Count);
        }

        return added;
    }

    /// <summary>
    /// Six locked seed rules, all evidence-cited. Precedence values
    /// match the design doc §"Locked precedence" exactly.
    /// </summary>
    private static TfDoctrinePropertyUniverse[] BuildBentonSeed()
    {
        // Deterministic GUIDs — d0c7d0c7 = "doctrine seed", 0040 = SYNC-DOCTRINE-4,
        // final group encodes county-fips '53005' (Benton WA).
        var ruleConvLegacy   = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005010");
        var ruleAgCurrentUse = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005020");
        var rulePersonalProp = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005030");
        var ruleMobileHome   = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005040");
        var ruleRealComm     = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005050");
        var ruleRealResid    = Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005060");

        var approvedAt = new DateTime(2026, 5, 6, 0, 0, 0, DateTimeKind.Utc);
        var approver = "operator-bsval";

        return new[]
        {
            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleConvLegacy,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 1,
                UniverseCode = UniverseCodes.ConversionLegacy,
                PropTypeCdCsv = null,
                PropertyUseMode = "ANY",
                PropertyUseCdCsv = null,
                AgApplyValue = null,
                AgUseCdCsv = null,
                RequiresLegacyMarker = true,
                LegacyMarkerType = "CREATED_DT_PRE_2017",
                LegacyMarkerValue = null,
                Reason = "CONVERSION_LEGACY: only fires when current PACS domain rules can't " +
                         "classify confidently AND a legacy marker is present. Conservative.",
                EvidenceSource = "design doc §Locked precedence; PACS conversion 2017 historical fact",
                Confidence = "MED",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "Initial marker = CREATED_DT_PRE_2017. SOURCE_SYSTEM and IMPORT_BATCH " +
                        "variants reserved for future tightening.",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleAgCurrentUse,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 2,
                UniverseCode = UniverseCodes.AgCurrentUse,
                PropTypeCdCsv = null,
                PropertyUseMode = "ANY",
                PropertyUseCdCsv = null,
                AgApplyValue = "T",
                AgUseCdCsv = null,
                RequiresLegacyMarker = false,
                Reason = "AG_CURRENT_USE: ag/current-use/open-space valuation universe overrides " +
                         "normal R/commercial splits when ag_apply='T'.",
                EvidenceSource = "dbo.land_detail.ag_apply distributions audited 2026-05-06; " +
                                 "T/AG=27381 attr-rows, T/OSP=65, T/CNV=23",
                Confidence = "HIGH",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "Single AG_CURRENT_USE bucket per design doc §Out of scope. Future " +
                        "split into AG/OSP/CNV deferred until profiling.",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = rulePersonalProp,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 3,
                UniverseCode = UniverseCodes.PersonalProperty,
                PropTypeCdCsv = "P,B",
                PropertyUseMode = "ANY",
                PropertyUseCdCsv = null,
                AgApplyValue = null,
                AgUseCdCsv = null,
                RequiresLegacyMarker = false,
                Reason = "PERSONAL_PROPERTY: BPP / business-personal schedules have distinct " +
                         "attribute semantics from real property.",
                EvidenceSource = "Benton personal-property monitor (operator-supplied); " +
                                 "PACS prop_type_cd ∈ {P,B} for business personal property",
                Confidence = "HIGH",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "Widening beyond {P,B} deferred until Benton-specific evidence " +
                        "supports more types.",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleMobileHome,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 4,
                UniverseCode = UniverseCodes.MobileHome,
                PropTypeCdCsv = "MH",
                PropertyUseMode = "ANY",
                PropertyUseCdCsv = null,
                AgApplyValue = null,
                AgUseCdCsv = null,
                RequiresLegacyMarker = false,
                Reason = "MOBILE_HOME: real-but-not-stick-built; PACS attribute namespace " +
                         "diverges from stick-built residential.",
                EvidenceSource = "PACS prop_type_cd='MH' distribution audit; ~1% of rows",
                Confidence = "HIGH",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleRealComm,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 5,
                UniverseCode = UniverseCodes.RealCommercial,
                PropTypeCdCsv = "R",
                PropertyUseMode = "EXCLUDE",
                // EXCLUDE: residential property_use codes excluded from this rule;
                // remaining codes route to commercial. Tighten after profiling drain.
                PropertyUseCdCsv = "11,12,13,14,18",
                AgApplyValue = "F",
                AgUseCdCsv = null,
                RequiresLegacyMarker = false,
                Reason = "REAL_COMMERCIAL: broad non-residential real-property bucket. Tighten " +
                         "PropertyUseCdCsv against observed commercial distribution after first " +
                         "profiling drain.",
                EvidenceSource = "Operator audit of property_use_cd dominant cells (R/11,12,13,14,18 " +
                                 "are residential majority — exclude → commercial)",
                Confidence = "MED",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "EXCLUDE mode is the broad first-pass approach. Replace with INCLUDE " +
                        "when commercial property_use_cd distribution is known.",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleRealResid,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 6,
                UniverseCode = UniverseCodes.RealResidential,
                PropTypeCdCsv = "R",
                PropertyUseMode = "ANY",
                PropertyUseCdCsv = null,
                AgApplyValue = "F",
                AgUseCdCsv = null,
                RequiresLegacyMarker = false,
                Reason = "REAL_RESIDENTIAL: default real-property residential bucket after higher-" +
                         "precedence rules resolve.",
                EvidenceSource = "PACS prop_type_cd='R' distribution audit; ~61% of rows; " +
                                 "remainder after AG/MH/PP/COMMERCIAL filtered",
                Confidence = "MED",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "MED rather than HIGH because the ag_apply='F' guard is conservative; " +
                        "a row with ag_apply=NULL (genuinely missing land row) won't match " +
                        "this rule and will fall through to UNKNOWN. That's intentional — " +
                        "reflect the data faithfully.",
            },
        };
    }
}
