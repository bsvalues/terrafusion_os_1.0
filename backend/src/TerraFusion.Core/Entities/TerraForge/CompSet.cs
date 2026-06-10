using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities.TerraForge;

public sealed class CompSet
{
    public Guid CompSetId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    [StringLength(200)]
    public string Name { get; set; } = "Session Market Basket";

    [StringLength(32)]
    public string Mode { get; set; } = "market_search";

    [StringLength(32)]
    public string Status { get; set; } = "draft";

    [StringLength(32)]
    public string OfficialStatus { get; set; } = "not_official";

    [StringLength(64)]
    public string? SubjectParcelId { get; set; }

    [StringLength(100)]
    public string SourceSystem { get; set; } = "Benton comps-pool";

    [StringLength(32)]
    public string FederationStatus { get; set; } = "not_connected";

    [StringLength(100)]
    public string ProvenanceSource { get; set; } = "Benton comps-pool";

    [StringLength(32)]
    public string ProvenanceRuntime { get; set; } = "county_scoped";

    [StringLength(32)]
    public string ProvenanceMutation { get; set; } = "none";

    [StringLength(32)]
    public string ProvenancePersistence { get; set; } = "persisted";

    // ── Subject-defense promotion lineage ──────────────────────────────────
    // Populated only on derived subject_defense sets. A market_search set
    // leaves these null. The derived set links back to its market_search
    // source so the original basket is never overwritten without trace.
    public Guid? SourceCompSetId { get; set; }

    [StringLength(500)]
    public string? PromotionReason { get; set; }

    [StringLength(32)]
    public string? PromotedFromMode { get; set; }

    public DateTime? PromotedAtUtc { get; set; }

    [StringLength(200)]
    public string? PromotedBy { get; set; }

    // ── Certification (the only action that sets officialStatus = official) ──
    // Set when a fully-reviewed subject_defense set is certified as the official
    // record of defense. Certification locks the set (diagnose/review reject).
    [StringLength(200)]
    public string? CertifiedBy { get; set; }

    public DateTime? CertifiedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<CompSetCandidate> Candidates { get; set; } = new List<CompSetCandidate>();
}

public sealed class CompSetCandidate
{
    public Guid CompSetCandidateId { get; set; } = Guid.NewGuid();
    public Guid CompSetId { get; set; }
    public Guid CountyId { get; set; }

    [StringLength(64)]
    public string ParcelId { get; set; } = string.Empty;

    public decimal SalePrice { get; set; }
    public DateTime SaleDate { get; set; }
    public decimal? PricePerSqft { get; set; }

    [StringLength(64)]
    public string Qualification { get; set; } = string.Empty;

    public int Rank { get; set; }

    [StringLength(500)]
    public string? IncludeReason { get; set; }

    [StringLength(100)]
    public string ProvenanceSource { get; set; } = "Benton comps-pool";

    [StringLength(32)]
    public string ProvenanceRuntime { get; set; } = "county_scoped";

    [StringLength(32)]
    public string ProvenanceMutation { get; set; } = "none";

    [StringLength(32)]
    public string ProvenancePersistence { get; set; } = "persisted";

    // ── Comparable diagnosis (rule-based draft review aid) ──────────────────
    // Populated by the deterministic diagnosis engine. Draft only, never
    // official; does not adjust, reconcile, certify, or export.
    [StringLength(32)]
    public string? QualificationStatus { get; set; }   // strong|usable|weak|needs_review|disqualified

    [StringLength(32)]
    public string? DiagnosisStatus { get; set; }        // "draft" once diagnosed

    public bool? ReviewRequired { get; set; }

    public string? DiagnosticFlagsJson { get; set; }    // JSON array of flag strings

    [StringLength(1000)]
    public string? SupportSummary { get; set; }

    public DateTime? DiagnosedAtUtc { get; set; }

    [StringLength(200)]
    public string? DiagnosedBy { get; set; }

    [StringLength(32)]
    public string? DiagnosisVersion { get; set; }       // e.g. "rules_v1"

    public CompSet CompSet { get; set; } = null!;
}

/// <summary>
/// The human reviewer's response to a candidate's rule-based diagnosis. This is a
/// SEPARATE layer from <see cref="CompSetCandidate"/>: it never mutates the rule
/// diagnosis. A human override (with required reason) is recorded here only — the
/// rule's QualificationStatus is preserved so both layers stay independently
/// traceable. One current review row per candidate (upsert on re-review).
/// </summary>
public sealed class CompSetCandidateReview
{
    public Guid CompSetCandidateReviewId { get; set; } = Guid.NewGuid();
    public Guid CompSetId { get; set; }
    public Guid CompSetCandidateId { get; set; }
    public Guid CountyId { get; set; }

    [StringLength(64)]
    public string ParcelId { get; set; } = string.Empty;

    // accepted_for_review | needs_field_verification | needs_sale_validation
    // | reject_as_comparable | use_as_secondary_support
    [StringLength(32)]
    public string Disposition { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? ReviewerNote { get; set; }

    public string? AcknowledgedFlagsJson { get; set; }   // JSON array of acknowledged flag codes

    [StringLength(32)]
    public string? QualificationOverride { get; set; }   // optional human status; rule status preserved separately

    [StringLength(1000)]
    public string? OverrideReason { get; set; }          // required when QualificationOverride is set

    [StringLength(200)]
    public string ReviewedBy { get; set; } = "system";

    public DateTime ReviewedAtUtc { get; set; } = DateTime.UtcNow;
}
