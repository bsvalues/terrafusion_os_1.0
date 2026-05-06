using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Doctrine;

/// <summary>
/// SYNC-DOCTRINE-1 (B1): year-aware sales-ratio qualification
/// lookup service.
///
/// <para>Resolves <c>(county, studyName, saleYear, code)</c> tuples
/// against rules in <c>doctrine_tf.tf_doctrine_ratio_policy</c>.
/// Used by the sale truth promoter (B2) to populate
/// <c>truth_pacs.sale.dor_ratio_qualified</c> and
/// <c>truth_pacs.sale.county_ratio_qualified</c> instead of a
/// hardcoded constant.</para>
///
/// <para>Both studies expose the same evaluation contract.
/// The promoter calls <see cref="EvaluateAsync"/> twice per
/// sale: once for <c>StudyName="DOR"</c> and once for
/// <c>StudyName="BENTON_INTERNAL"</c>, then writes both booleans.
/// canonical_tf.tf_sale carries both verbatim.</para>
/// </summary>
public interface IRatioQualificationPolicy
{
    /// <summary>
    /// Look up the policy rule applicable to the given study /
    /// county / sale-year, then evaluate the input code against it.
    /// </summary>
    /// <param name="county">Lowercase-hyphenated county slug.</param>
    /// <param name="studyName">Closed vocab: 'DOR' | 'BENTON_INTERNAL'.</param>
    /// <param name="saleYear">YEAR(sale.sl_dt). 0 → "no rule applies".</param>
    /// <param name="code">PACS code value being evaluated. NULL allowed.</param>
    Task<RatioPolicyEvaluation> EvaluateAsync(
        string county,
        string studyName,
        int saleYear,
        string? code,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of <see cref="IRatioQualificationPolicy.EvaluateAsync"/>.
/// </summary>
/// <param name="Reviewed">
/// True if a code value was provided AND a matching rule exists for
/// the (county, study, year) scope. False if code is null/empty OR
/// no rule covers this year window.
/// </param>
/// <param name="Qualified">
/// True if Reviewed AND code is in the rule's QualifiedCodes set
/// AND not in ExcludedCodes. Excluded wins ties.
/// </param>
/// <param name="Code">The input code, echoed back unchanged.</param>
/// <param name="StudyName">The study queried, echoed back.</param>
/// <param name="RuleId">The rule that matched, or NULL if none.</param>
/// <param name="EvidenceSource">
/// The matching rule's <c>EvidenceSource</c>, for inclusion in
/// truth-layer audit if the operator wants traceability per row.
/// </param>
public sealed record RatioPolicyEvaluation(
    bool Reviewed,
    bool Qualified,
    string? Code,
    string StudyName,
    Guid? RuleId,
    string? EvidenceSource);
