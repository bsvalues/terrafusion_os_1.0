using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Transforms.Sales;

/// <summary>
/// Slice C8-B: turns a sale row's PACS qualification signals
/// (<c>dbo.sale.wac_cd</c>, <c>dbo.sale.sl_ratio_type_cd</c>) into a
/// canonical <see cref="SalesQualificationDecision"/> using a locked
/// Mapping Workbook as the rule source.
///
/// <para>This service consumes (it does not produce) workbook
/// decisions. It loads the workbook through the C7 read model
/// (<see cref="Mapping.ISyncMappingWorkbookReadModel.LoadMappedAsync"/>),
/// which fails closed when the workbook is anything other than
/// <c>Status='Mapped'</c>. There is no path here that catches that
/// failure and proceeds — Draft / InProgress / Approved / Archived
/// workbooks all surface as <see cref="InvalidOperationException"/>
/// to the caller.</para>
///
/// <para>What this service does NOT do (per Slice C8-A policy):
/// <list type="bullet">
/// <item>Mutate any PACS row.</item>
/// <item>Mutate any canonical landing table.</item>
/// <item>Mutate the workbook (read-only via AsNoTracking in C7).</item>
/// <item>Auto-map unknown WAC codes — Unknown is excluded from comps.</item>
/// <item>Auto-exclude operator-allowed WAC codes — the
/// memory-flagged "WacCd bug blocks all comps" scenario is upheld
/// by trusting the operator's <c>IsExcluded</c> + <c>ReviewStatus</c>
/// values verbatim.</item>
/// <item>Surface any side effect to Forge / TerraAtlas / Studio /
/// Dais artifacts.</item>
/// </list>
/// </para>
///
/// <para>Decision combination uses AND-logic exclusion: a sale enters
/// the comp pool only when BOTH axes are <c>OperatorMapped</c>; any
/// axis that classifies as Excluded / Deferred / Unknown / MissingCode
/// sets <see cref="SalesQualificationDecision.IsExcludedFromComps"/>
/// to <c>true</c>.</para>
/// </summary>
public interface ISalesQualificationTransform
{
    /// <summary>
    /// Load a county-scoped, Mapped workbook and qualify a single
    /// sale source row. Throws <see cref="InvalidOperationException"/>
    /// if the workbook is not in <c>Status='Mapped'</c>.
    /// </summary>
    Task<SalesQualificationDecision> QualifyAsync(
        Guid countyId,
        Guid workbookId,
        SalesQualificationSource source,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Per-sale input shape. Both fields are nullable; the transform
/// treats <c>null</c> / whitespace as <c>MissingCode</c> on the
/// corresponding axis.
/// </summary>
public sealed record SalesQualificationSource(
    string? WacCode,
    string? SaleRatioTypeCode);

/// <summary>
/// Output of a single qualification call.
///
/// <para><see cref="CanonicalValue"/> is non-null only when
/// <see cref="DecisionStatus"/> is
/// <see cref="SalesQualificationDecisionStatus.Qualified"/>; it sources
/// from the <c>wac_cd</c> axis (the WA REET signal is the gating
/// classifier per Slice C8-A policy).</para>
///
/// <para><see cref="Reasons"/> always contains exactly two strings,
/// in deterministic order — wac axis first, ratio axis second — each
/// formatted per the C8-A reason-string contract:
/// <list type="bullet">
/// <item>OperatorMapped:    <c>"&lt;col&gt;=&lt;value&gt; operator-mapped (canonical: &lt;canonical&gt;)"</c></item>
/// <item>OperatorExcluded:  <c>"&lt;col&gt;=&lt;value&gt; operator-excluded"</c></item>
/// <item>OperatorDeferred:  <c>"&lt;col&gt;=&lt;value&gt; operator-deferred"</c></item>
/// <item>Unknown:           <c>"&lt;col&gt;=&lt;value&gt; not in workbook"</c></item>
/// <item>MissingCode:       <c>"&lt;col&gt;=&lt;missing&gt;"</c></item>
/// </list>
/// </para>
/// </summary>
public sealed record SalesQualificationDecision(
    string? CanonicalValue,
    bool IsExcludedFromComps,
    SalesQualificationDecisionStatus DecisionStatus,
    IReadOnlyList<string> Reasons);

/// <summary>
/// Closed set of decision-status values. Adding a new value is a
/// breaking change for downstream consumers — write a slice card.
/// </summary>
public enum SalesQualificationDecisionStatus
{
    /// <summary>Both axes resolved to operator-mapped values.</summary>
    Qualified,

    /// <summary>At least one axis resolved to an operator-excluded value (operator decision).</summary>
    Excluded,

    /// <summary>At least one axis resolved to an operator-deferred value (operator parked the decision).</summary>
    Deferred,

    /// <summary>At least one axis had a value the workbook did not record (workbook gap).</summary>
    Unknown,

    /// <summary>At least one axis had a null/blank source value (data gap).</summary>
    MissingCode,
}
