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
        // SYNC-DOCTRINE-4-IMPL-V2: deactivate V1 seed rules first, then
        // insert V2 rules. Live replay of V1 surfaced that the locked
        // CREATED_DT_PRE_2017 marker fires for 100 % of Benton rows
        // because PACS PropCreateDt is a 1980-01-01 sentinel from the
        // 2017 ProVal conversion. V2 reorders CONVERSION_LEGACY to the
        // last precedence (escape hatch) and relaxes REAL_RESIDENTIAL
        // / REAL_COMMERCIAL ag_apply guards to wildcard so the modern
        // rules can fire without land_detail joins (which arrive in a
        // separate slice).
        var deactivated = await DeactivateLegacyV1RulesAsync(cancellationToken)
            .ConfigureAwait(false);

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

        if (added > 0 || deactivated > 0)
        {
            await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            _logger.LogInformation(
                "DoctrinePropertyUniverseSeeder: inserted {Added} V2 rule(s); deactivated {Deactivated} V1 rule(s); existing {Existing}",
                added, deactivated, existingSet.Count);
        }
        else
        {
            _logger.LogDebug(
                "DoctrinePropertyUniverseSeeder: no changes; {Existing} already present",
                existingSet.Count);
        }

        return added;
    }

    /// <summary>
    /// SYNC-DOCTRINE-4-IMPL-V2: mark V1 seed rules inactive.
    /// V1 GUIDs are preserved (audit trail) but the classifier
    /// excludes them via <see cref="TfDoctrinePropertyUniverse.ActiveFlag"/>.
    /// Idempotent: setting an already-inactive row's flag to false
    /// is a no-op via EF change-tracking.
    /// </summary>
    private async Task<int> DeactivateLegacyV1RulesAsync(CancellationToken cancellationToken)
    {
        var v1RuleIds = LegacyV1RuleIds();
        var rows = await _db.TfDoctrinePropertyUniverses
            .Where(r => v1RuleIds.Contains(r.RuleId) && r.ActiveFlag)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        foreach (var row in rows)
        {
            row.ActiveFlag = false;
            row.Notes = (row.Notes is null ? string.Empty : row.Notes + " | ") +
                "DEACTIVATED 2026-05-06 by SYNC-DOCTRINE-4-IMPL-V2 (live replay surfaced " +
                "PropCreateDt sentinel; V2 reorders CONVERSION_LEGACY to last precedence " +
                "and relaxes ag_apply guards on REAL_RESIDENTIAL/REAL_COMMERCIAL).";
        }
        return rows.Count;
    }

    private static Guid[] LegacyV1RuleIds() => new[]
    {
        Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005010"),  // V1 CONVERSION_LEGACY
        Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005020"),  // V1 AG_CURRENT_USE
        Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005030"),  // V1 PERSONAL_PROPERTY
        Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005040"),  // V1 MOBILE_HOME
        Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005050"),  // V1 REAL_COMMERCIAL
        Guid.Parse("d0c7d0c7-0040-4001-be07-be0053005060"),  // V1 REAL_RESIDENTIAL
    };

    /// <summary>
    /// SYNC-DOCTRINE-4-IMPL-V2 seed (six rules + UNKNOWN sentinel).
    ///
    /// <para>Differences from V1 (deactivated by
    /// <see cref="DeactivateLegacyV1RulesAsync"/> at boot):</para>
    /// <list type="bullet">
    ///   <item><b>CONVERSION_LEGACY moved from precedence 1 to
    ///   precedence 7 (escape hatch).</b> The locked
    ///   <c>CREATED_DT_PRE_2017</c> marker fires for 100 % of Benton
    ///   rows because PACS PropCreateDt is a 1980-01-01 sentinel
    ///   from the 2017 ProVal conversion. Putting CONVERSION_LEGACY
    ///   first meant every row classified legacy regardless of
    ///   actual prop_type_cd. V2 makes it a true last-resort: only
    ///   fires when no modern rule matches AND a legacy marker is
    ///   present. Realizes the design doc's stated intent.</item>
    ///   <item><b>REAL_RESIDENTIAL ag_apply guard relaxed to
    ///   wildcard.</b> Until <c>land_detail</c> joins land in the
    ///   promoter (separate slice), <c>ag_apply</c> is always NULL
    ///   in the classifier input. The V1 <c>ag_apply='F'</c> guard
    ///   prevented RESIDENTIAL from firing on any row. V2 accepts
    ///   any ag_apply for the residential default — when
    ///   land_detail wiring lands, AG_CURRENT_USE (precedence 2)
    ///   will siphon ag_apply='T' rows BEFORE this rule sees them.</item>
    ///   <item><b>REAL_COMMERCIAL ag_apply guard also relaxed to
    ///   wildcard.</b> Same reasoning. The PropertyUseMode=EXCLUDE
    ///   guard against residential property_use_cd values still
    ///   discriminates commercial vs residential when
    ///   property_use_cd is non-null; with NULL property_use_cd the
    ///   EXCLUDE rule short-circuits to false (per classifier
    ///   semantics) and falls through to RESIDENTIAL.</item>
    /// </list>
    /// </summary>
    private static TfDoctrinePropertyUniverse[] BuildBentonSeed()
    {
        // V2 deterministic GUIDs — d0c7d0c7 = "doctrine seed",
        // 4002 = SYNC-DOCTRINE-4 V2, final group encodes county-fips
        // '53005' (Benton WA).
        var ruleConvLegacy   = Guid.Parse("d0c7d0c7-0040-4002-be07-be0053005010");
        var ruleAgCurrentUse = Guid.Parse("d0c7d0c7-0040-4002-be07-be0053005020");
        var rulePersonalProp = Guid.Parse("d0c7d0c7-0040-4002-be07-be0053005030");
        var ruleMobileHome   = Guid.Parse("d0c7d0c7-0040-4002-be07-be0053005040");
        var ruleRealComm     = Guid.Parse("d0c7d0c7-0040-4002-be07-be0053005050");
        var ruleRealResid    = Guid.Parse("d0c7d0c7-0040-4002-be07-be0053005060");

        var approvedAt = new DateTime(2026, 5, 6, 14, 30, 0, DateTimeKind.Utc);
        var approver = "operator-bsval";

        return new[]
        {
            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleAgCurrentUse,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 1,
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
                Notes = "V2 precedence 1 (was V1 precedence 2). Single AG_CURRENT_USE bucket " +
                        "per design doc §Out of scope. Future split into AG/OSP/CNV deferred " +
                        "until profiling. Won't fire from promoter wiring until land_detail " +
                        "joins land in a separate slice (ag_apply currently passed as NULL).",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = rulePersonalProp,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 2,
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
                Notes = "V2 precedence 2 (was V1 precedence 3). Widening beyond {P,B} deferred " +
                        "until Benton-specific evidence supports more types.",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleMobileHome,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 3,
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
                Notes = "V2 precedence 3 (was V1 precedence 4).",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleRealComm,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 4,
                UniverseCode = UniverseCodes.RealCommercial,
                PropTypeCdCsv = "R",
                PropertyUseMode = "EXCLUDE",
                // EXCLUDE: residential property_use codes excluded from this rule;
                // remaining codes route to commercial. Tighten after profiling drain.
                PropertyUseCdCsv = "11,12,13,14,18",
                AgApplyValue = null,  // V2: relaxed from 'F' to wildcard
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
                Notes = "V2 precedence 4 (was V1 precedence 5). ag_apply guard relaxed from " +
                        "'F' to wildcard so it can fire without land_detail joins. EXCLUDE " +
                        "with NULL property_use_cd evaluates to false in classifier (no value " +
                        "to compare), so this rule defaults out and falls through to " +
                        "REAL_RESIDENTIAL — that's correct for now since property_use_cd is " +
                        "always NULL in promoter input.",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleRealResid,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 5,
                UniverseCode = UniverseCodes.RealResidential,
                PropTypeCdCsv = "R",
                PropertyUseMode = "ANY",
                PropertyUseCdCsv = null,
                AgApplyValue = null,  // V2: relaxed from 'F' to wildcard
                AgUseCdCsv = null,
                RequiresLegacyMarker = false,
                Reason = "REAL_RESIDENTIAL: default real-property residential bucket. After " +
                         "higher-precedence rules (AG/PP/MH/COMMERCIAL) resolve, any " +
                         "prop_type_cd='R' row routes here.",
                EvidenceSource = "PACS prop_type_cd='R' distribution audit; ~61% of rows; " +
                                 "remainder after AG/MH/PP/COMMERCIAL filtered",
                Confidence = "MED",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "V2 precedence 5 (was V1 precedence 6). ag_apply guard relaxed from " +
                        "'F' to wildcard so this fires as the genuine 'R' catchall today, even " +
                        "without land_detail joins. When AG_CURRENT_USE wiring lands, ag_apply='T' " +
                        "rows are siphoned at precedence 1 before reaching this rule.",
            },

            new TfDoctrinePropertyUniverse
            {
                RuleId = ruleConvLegacy,
                County = "benton-wa",
                EffectiveStartYear = 1990,
                EffectiveEndYear = null,
                Precedence = 7,  // V2: moved from 1 to last (escape hatch)
                UniverseCode = UniverseCodes.ConversionLegacy,
                PropTypeCdCsv = null,
                PropertyUseMode = "ANY",
                PropertyUseCdCsv = null,
                AgApplyValue = null,
                AgUseCdCsv = null,
                RequiresLegacyMarker = true,
                LegacyMarkerType = "CREATED_DT_PRE_2017",
                LegacyMarkerValue = null,
                Reason = "CONVERSION_LEGACY: escape hatch. Fires only when no modern rule " +
                         "matches AND a legacy marker is present. Realizes the design doc's " +
                         "stated intent: 'only when current PACS domain rules can't classify " +
                         "confidently AND a legacy marker is present.'",
                EvidenceSource = "design doc §Locked precedence (intent); SYNC-DOCTRINE-4 live " +
                                 "replay 2026-05-06 surfaced V1 over-classification (100% of " +
                                 "rows hit at precedence 1 due to PropCreateDt 1980-01-01 sentinel)",
                Confidence = "MED",
                ApprovedBy = approver,
                ApprovedAt = approvedAt,
                Notes = "V2 precedence 7 — last (escape hatch), was V1 precedence 1. Marker " +
                        "remains CREATED_DT_PRE_2017 but its over-fire risk is structurally " +
                        "neutralized by ordering. Future tightening (SOURCE_SYSTEM / " +
                        "IMPORT_BATCH variants) optional, no longer urgent.",
            },
        };
    }
}
