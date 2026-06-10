using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Sync Bridge v1: TerraFusion-native canonical parcel identity.
///
/// <para>Per <c>docs/pacs/pacs-sync-bridge-v1-spec.md</c>: this is
/// THE canonical TF parcel identity table. <see cref="TfParcelId"/>
/// is TF's own identity; PACS keys (prop_id, prop_val_yr, sup_num)
/// live in <c>sync_bridge.source_xref</c> as lineage, not as
/// authority.</para>
///
/// <para>Per the doctrine rule: <c>product.parcel</c> is not allowed
/// to mean "PACS parcel." It means "TerraFusion runtime parcel
/// derived from a proven PACS/source truth row." Every row in this
/// table MUST have a corresponding <c>SourceXref</c> entry.</para>
///
/// <para><see cref="CurrentOwnerId"/> and
/// <see cref="CurrentAssessmentId"/> are nullable in v1; they
/// become NOT NULL in Phase 2 once the owner / assessment domains
/// land. The "no <c>tf_parcel.current_owner_id</c> unless lineage-
/// backed owner exists" rule is enforced at the application layer
/// for now; a check constraint can be added after Phase 2.</para>
/// </summary>
public sealed class TfParcel
{
    public Guid TfParcelId { get; set; } = Guid.NewGuid();
    public Guid CountyId { get; set; }

    public string? ParcelNumber { get; set; }
    public string? SitusAddress { get; set; }
    public string? LegalDescription { get; set; }

    /// <summary>'ACTIVE' | 'INACTIVE' | 'WITHDRAWN' | 'UNDER_REVIEW'.</summary>
    public string ParcelStatus { get; set; } = "ACTIVE";

    /// <summary>'R' | 'MH' | 'P' (P only when explicitly authorized).</summary>
    public string? PropertyType { get; set; }

    public Guid? CurrentOwnerId { get; set; }
    public Guid? CurrentAssessmentId { get; set; }

    /// <summary>
    /// Slice G2 (Phase 2 closure): conversion-era marker derived
    /// via
    /// <see cref="TerraFusion.Core.Entities.TruthPacs.ConversionEras.MajorityOfTruth"/>
    /// over the contributing truth row(s). Closes the parity gap
    /// where every other canonical_tf entity (TfImprovement,
    /// TfSale, TfLand, TfOwner, TfAssessmentWsdor,
    /// TfImprovementFeature) already carries this column. Nullable
    /// for back-compat with rows projected before this slice.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
