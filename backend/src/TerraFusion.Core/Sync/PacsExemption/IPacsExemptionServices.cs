using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsExemption;

public sealed class PacsExemptionLandingResult
{
    public Guid LoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int RowsLanded { get; set; }
    public int DuplicateKeyViolations { get; set; }
    public string? ErrorSummary { get; set; }
}

public sealed class PacsExemptionDictResult
{
    public string Status { get; set; } = "IN_PROGRESS";
    public int TypesUpserted { get; set; }
    public string? ErrorSummary { get; set; }
}

public sealed class PacsExemptionTruthResult
{
    public Guid PromotionLoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int Considered { get; set; }
    public int Promoted { get; set; }
    public int PriorRowsRemoved { get; set; }
    public string? ErrorSummary { get; set; }
}

public sealed class PacsExemptionCanonicalResult
{
    public Guid PromotionLoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int TruthRowsConsidered { get; set; }
    public int ExemptionsProjected { get; set; }
    public int RowsUnresolvedParcel { get; set; }
    public int DictUnbackedTypes { get; set; }
    public string? ErrorSummary { get; set; }
}

/// <summary>EXEMPTION-FACT-SEAL: lands active-supp exemption facts (COPY).</summary>
public interface IPacsExemptionLandingService
{
    Task<PacsExemptionLandingResult> LandExemptionsAsync(
        IPacsExemptionSource source, string operatorName, CancellationToken cancellationToken = default);
}

/// <summary>EXEMPTION-FACT-SEAL: upserts canonical_tf.dict_exemption_type from PACS exmpt_type.</summary>
public interface IPacsExemptionDictPopulator
{
    Task<PacsExemptionDictResult> PopulateAsync(
        IPacsExemptionSource source, Guid countyId, string operatorName, CancellationToken cancellationToken = default);
}

/// <summary>EXEMPTION-FACT-SEAL: promotes landed batch into truth_pacs.exemption_current.</summary>
public interface IPacsExemptionCurrentTruthPromoter
{
    Task<PacsExemptionTruthResult> PromoteAsync(
        Guid exemptionLoadBatchId, string operatorName, CancellationToken cancellationToken = default);
}

/// <summary>EXEMPTION-FACT-SEAL: projects truth into canonical_tf.tf_exemption.</summary>
public interface IPacsExemptionCanonicalProjector
{
    Task<PacsExemptionCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId, string operatorName, CancellationToken cancellationToken = default);
}
