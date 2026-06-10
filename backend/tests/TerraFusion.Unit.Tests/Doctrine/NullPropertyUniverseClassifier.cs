using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Sync.Doctrine;

namespace TerraFusion.Unit.Tests.Doctrine;

/// <summary>
/// Test double for <see cref="IPropertyUniverseClassifier"/> that
/// always returns <see cref="UniverseCodes.Unknown"/> with the
/// <see cref="UniverseQuarantineReasons.UniverseNotEvaluated"/>
/// hint. Mirrors the production behavior when a property row is
/// missing for the given prop_id.
///
/// <para>Use this double when a test does not need to exercise
/// universe classification rules but must satisfy the constructor
/// dependency.</para>
/// </summary>
public sealed class NullPropertyUniverseClassifier : IPropertyUniverseClassifier
{
    public Task<UniverseClassification> ClassifyAsync(
        UniverseClassifierInput input,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new UniverseClassification(
            UniverseCode: UniverseCodes.Unknown,
            RuleId: null,
            Confidence: "LOW",
            Reason: "test double: classifier disabled",
            QuarantineReasonHint: UniverseQuarantineReasons.UniverseNotEvaluated));

    public void InvalidateCache(string? county = null) { /* no-op */ }
}
