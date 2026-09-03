using System.Reflection;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Import;
using Xunit;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvIntakeDuplicateDecisionTests
{
    private const string LowercaseHash =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    private static readonly WashingtonCountyIdentity Benton = Resolve("Benton");
    private static readonly WashingtonCountyIdentity Franklin = Resolve("Franklin");

    [Fact]
    public void Decide_ReturnsFirstSeenThenDuplicateForProtected002DIdentity()
    {
        var decision = new CountyCsvIntakeDuplicateDecision(1);
        var identity = Identity(Benton);
        var original = identity with { };

        var first = decision.Decide(identity);
        var duplicate = decision.Decide(identity with
        {
            County = identity.County with { },
            Content = identity.Content with { },
        });

        AssertResult(
            first,
            CountyCsvIntakeDuplicateDisposition.FirstSeen,
            CountyCsvIntakeDuplicateDenialCode.None);
        AssertResult(
            duplicate,
            CountyCsvIntakeDuplicateDisposition.Duplicate,
            CountyCsvIntakeDuplicateDenialCode.None);
        Assert.Equal(original, identity);
    }

    [Fact]
    public void Decide_AcceptsAll39CanonicalCountiesForBothClosedDatasets()
    {
        var decision = new CountyCsvIntakeDuplicateDecision(78);
        var identities = WashingtonCountyRegistry.Counties
            .SelectMany(county => new[]
            {
                Identity(county, CountyCsvDataset.Parcels),
                Identity(county, CountyCsvDataset.Sales),
            })
            .ToArray();

        Assert.Equal(78, identities.Length);
        Assert.All(
            identities,
            identity => AssertResult(
                decision.Decide(identity),
                CountyCsvIntakeDuplicateDisposition.FirstSeen,
                CountyCsvIntakeDuplicateDenialCode.None));

        Assert.All(
            identities,
            identity => AssertResult(
                decision.Decide(identity),
                CountyCsvIntakeDuplicateDisposition.Duplicate,
                CountyCsvIntakeDuplicateDenialCode.None));
    }

    [Fact]
    public void Decide_SeparatesEvery002DIdentityComponent()
    {
        var decision = new CountyCsvIntakeDuplicateDecision(5);
        var identities = new[]
        {
            Identity(Benton),
            Identity(Franklin),
            Identity(Benton, CountyCsvDataset.Sales),
            Identity(Benton, hash: new string('b', 64)),
            Identity(Benton, byteLength: 21),
        };

        Assert.Equal(5, identities.Select(identity => identity.IdempotencyKey).Distinct().Count());
        Assert.All(
            identities,
            identity => AssertResult(
                decision.Decide(identity),
                CountyCsvIntakeDuplicateDisposition.FirstSeen,
                CountyCsvIntakeDuplicateDenialCode.None));
        AssertResult(
            decision.Decide(Identity(Benton)),
            CountyCsvIntakeDuplicateDisposition.Duplicate,
            CountyCsvIntakeDuplicateDenialCode.None);
    }

    [Fact]
    public void Decide_DeniesInvalidEvidenceWithoutMutatingCapacity()
    {
        var decision = new CountyCsvIntakeDuplicateDecision(1);
        var valid = Identity(Benton);
        var invalidCases = new[]
        {
            Case(null, CountyCsvIntakeDuplicateDenialCode.InvalidIdentity),
            Case(
                valid with { ContractId = "wal.county-upload.csv-idempotency.v2" },
                CountyCsvIntakeDuplicateDenialCode.InvalidIdentity),
            Case(
                valid with { County = null! },
                CountyCsvIntakeDuplicateDenialCode.NonCanonicalCounty),
            Case(
                valid with { County = Benton with { Key = "wa-not-benton" } },
                CountyCsvIntakeDuplicateDenialCode.NonCanonicalCounty),
            Case(
                valid with { Dataset = CountyCsvDataset.Unspecified },
                CountyCsvIntakeDuplicateDenialCode.UnsupportedDataset),
            Case(
                valid with { Content = null! },
                CountyCsvIntakeDuplicateDenialCode.InvalidContentEvidence),
            Case(
                valid with { Content = valid.Content with { Sha256 = new string('A', 64) } },
                CountyCsvIntakeDuplicateDenialCode.InvalidContentEvidence),
            Case(
                valid with { Content = valid.Content with { ByteLength = 0 } },
                CountyCsvIntakeDuplicateDenialCode.InvalidContentEvidence),
            Case(
                valid with { Content = valid.Content with { ByteLength = (long)int.MaxValue + 1 } },
                CountyCsvIntakeDuplicateDenialCode.InvalidContentEvidence),
            Case(
                valid with { IdempotencyKey = "not-a-key" },
                CountyCsvIntakeDuplicateDenialCode.IdempotencyKeyMismatch),
            Case(
                valid with { IdempotencyKey = new string('0', 64) },
                CountyCsvIntakeDuplicateDenialCode.IdempotencyKeyMismatch),
        };

        foreach (var (identity, denialCode) in invalidCases)
        {
            AssertResult(
                decision.Decide(identity),
                CountyCsvIntakeDuplicateDisposition.Denied,
                denialCode);
        }

        AssertResult(
            decision.Decide(valid),
            CountyCsvIntakeDuplicateDisposition.FirstSeen,
            CountyCsvIntakeDuplicateDenialCode.None);
    }

    [Fact]
    public void Decide_ChecksKnownDuplicateBeforeCapacityAndDeniesNewIdentityAtCapacity()
    {
        var decision = new CountyCsvIntakeDuplicateDecision(1);
        var firstIdentity = Identity(Benton);

        AssertResult(
            decision.Decide(firstIdentity),
            CountyCsvIntakeDuplicateDisposition.FirstSeen,
            CountyCsvIntakeDuplicateDenialCode.None);
        AssertResult(
            decision.Decide(Identity(Franklin)),
            CountyCsvIntakeDuplicateDisposition.Denied,
            CountyCsvIntakeDuplicateDenialCode.CapacityExceeded);
        AssertResult(
            decision.Decide(firstIdentity),
            CountyCsvIntakeDuplicateDisposition.Duplicate,
            CountyCsvIntakeDuplicateDenialCode.None);
    }

    [Fact]
    public async Task Decide_ParallelSameIdentityHasExactlyOneFirstSeenDecision()
    {
        var decision = new CountyCsvIntakeDuplicateDecision(1);
        var identity = Identity(Benton);
        var results = await Task.WhenAll(
            Enumerable.Range(0, 64).Select(_ => Task.Run(() => decision.Decide(identity))));

        Assert.Single(
            results.Where(result =>
                result.Disposition == CountyCsvIntakeDuplicateDisposition.FirstSeen));
        Assert.Equal(
            63,
            results.Count(result =>
                result.Disposition == CountyCsvIntakeDuplicateDisposition.Duplicate));
        Assert.DoesNotContain(
            results,
            result => result.Disposition == CountyCsvIntakeDuplicateDisposition.Denied);
    }

    [Fact]
    public async Task Decide_ParallelDistinctIdentitiesAreAllLinearizedAsFirstSeen()
    {
        var identities = WashingtonCountyRegistry.Counties
            .SelectMany(county => new[]
            {
                Identity(county, CountyCsvDataset.Parcels),
                Identity(county, CountyCsvDataset.Sales),
            })
            .ToArray();
        var decision = new CountyCsvIntakeDuplicateDecision(identities.Length);

        var results = await Task.WhenAll(
            identities.Select(identity => Task.Run(() => decision.Decide(identity))));

        Assert.All(
            results,
            result => AssertResult(
                result,
                CountyCsvIntakeDuplicateDisposition.FirstSeen,
                CountyCsvIntakeDuplicateDenialCode.None));
    }

    [Fact]
    public void Decide_PrivateCollisionBranchDeniesWithoutProductionTestSeam()
    {
        var decisionType = typeof(CountyCsvIntakeDuplicateDecision);
        var snapshotType = decisionType.GetNestedType("IdentitySnapshot", BindingFlags.NonPublic);
        Assert.NotNull(snapshotType);
        var constructor = Assert.Single(
            snapshotType!.GetConstructors(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
                .Where(candidate => candidate.GetParameters().Length == 4));
        var decideValidated = decisionType.GetMethod(
            "DecideValidated",
            BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(decideValidated);
        var key = new string('0', 64);
        var content = new CountyCsvContentEvidence(20, LowercaseHash);
        var firstSnapshot = constructor.Invoke(
            new object[] { key, Benton, CountyCsvDataset.Parcels, content });
        var collisionSnapshot = constructor.Invoke(
            new object[] { key, Franklin, CountyCsvDataset.Parcels, content });
        var decision = new CountyCsvIntakeDuplicateDecision(1);

        var first = Assert.IsType<CountyCsvIntakeDuplicateDecisionResult>(
            decideValidated!.Invoke(decision, new[] { firstSnapshot }));
        var collision = Assert.IsType<CountyCsvIntakeDuplicateDecisionResult>(
            decideValidated.Invoke(decision, new[] { collisionSnapshot }));

        AssertResult(
            first,
            CountyCsvIntakeDuplicateDisposition.FirstSeen,
            CountyCsvIntakeDuplicateDenialCode.None);
        AssertResult(
            collision,
            CountyCsvIntakeDuplicateDisposition.Denied,
            CountyCsvIntakeDuplicateDenialCode.KeyCollision);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(4097)]
    public void Constructor_DeniesUnboundedCapacity(int capacity)
    {
        Assert.Throws<ArgumentOutOfRangeException>(
            () => new CountyCsvIntakeDuplicateDecision(capacity));
    }

    [Fact]
    public void ContractSurface_IsPerInstanceBoundedSynchronousAndStateOpaque()
    {
        var decisionType = typeof(CountyCsvIntakeDuplicateDecision);

        Assert.True(decisionType.IsSealed);
        Assert.Equal(
            "wal.county-upload.csv-duplicate-decision.v1",
            CountyCsvIntakeDuplicateDecision.ContractId);
        var operation = Assert.Single(
            decisionType.GetMethods(
                BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly));
        Assert.Equal(nameof(CountyCsvIntakeDuplicateDecision.Decide), operation.Name);
        Assert.Equal(typeof(CountyCsvIntakeDuplicateDecisionResult), operation.ReturnType);
        Assert.Equal(
            new[] { typeof(CountyCsvIntakeIdempotencyIdentity) },
            operation.GetParameters().Select(parameter => parameter.ParameterType));
        Assert.Empty(
            decisionType.GetProperties(
                BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly));
        Assert.All(
            decisionType.GetFields(
                BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Static),
            field => Assert.True(field.IsLiteral));
        Assert.Single(
            decisionType.GetFields(BindingFlags.NonPublic | BindingFlags.Instance)
                .Where(field => field.FieldType == typeof(object)));
        Assert.DoesNotContain(
            decisionType.GetMethods(BindingFlags.Public | BindingFlags.Instance),
            method => method.Name.Contains("Reset", StringComparison.Ordinal)
                || method.Name.Contains("Remove", StringComparison.Ordinal)
                || method.Name.Contains("Count", StringComparison.Ordinal)
                || typeof(Task).IsAssignableFrom(method.ReturnType));
    }

    private static (
        CountyCsvIntakeIdempotencyIdentity? Identity,
        CountyCsvIntakeDuplicateDenialCode DenialCode) Case(
            CountyCsvIntakeIdempotencyIdentity? identity,
            CountyCsvIntakeDuplicateDenialCode denialCode) =>
        (identity, denialCode);

    private static CountyCsvIntakeIdempotencyIdentity Identity(
        WashingtonCountyIdentity county,
        CountyCsvDataset dataset = CountyCsvDataset.Parcels,
        string hash = LowercaseHash,
        long byteLength = 20) =>
        CountyCsvIntakeIdempotency.Create(Receipt(county, dataset, hash, byteLength));

    private static CountyCsvCountyBoundIntakeReceipt Receipt(
        WashingtonCountyIdentity county,
        CountyCsvDataset dataset,
        string hash,
        long byteLength)
    {
        var content = new CountyCsvContentEvidence(byteLength, hash);
        return new CountyCsvCountyBoundIntakeReceipt(
            CountyCsvCountyBoundIntake.ContractId,
            new CountyCsvCountyBinding(
                county,
                dataset,
                CountyDataMode.CountyProvided,
                CountyDataExposure.Protected,
                CountyDataAction.Operate),
            new CountyCsvIntakeReceipt(
                CountyCsvIntakeEnvelope.ContractId,
                "fixture.csv",
                "csv",
                "text/csv",
                content,
                new CountyCsvDocument(
                    Array.AsReadOnly(new[] { "parcel_id" }),
                    Array.AsReadOnly<IReadOnlyList<string>>([]),
                    byteLength,
                    content.Sha256)));
    }

    private static void AssertResult(
        CountyCsvIntakeDuplicateDecisionResult result,
        CountyCsvIntakeDuplicateDisposition disposition,
        CountyCsvIntakeDuplicateDenialCode denialCode)
    {
        Assert.Equal(CountyCsvIntakeDuplicateDecision.ContractId, result.ContractId);
        Assert.Equal(disposition, result.Disposition);
        Assert.Equal(denialCode, result.DenialCode);
    }

    private static WashingtonCountyIdentity Resolve(string value)
    {
        Assert.True(WashingtonCountyRegistry.TryResolve(value, out var county));
        return county;
    }
}
