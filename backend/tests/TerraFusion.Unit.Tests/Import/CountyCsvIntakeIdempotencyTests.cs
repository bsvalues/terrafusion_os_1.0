using System.Reflection;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Import;
using Xunit;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvIntakeIdempotencyTests
{
    private const string LowercaseHash =
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    private static readonly WashingtonCountyIdentity Benton = Resolve("Benton");
    private static readonly WashingtonCountyIdentity Franklin = Resolve("Franklin");

    [Fact]
    public void Create_UsesExactVersionedPreimageAndReturnsCanonicalImmutableSnapshot()
    {
        var sourceContent = new CountyCsvContentEvidence(20, LowercaseHash);
        var receipt = Receipt(Benton with { }, CountyCsvDataset.Parcels, content: sourceContent);

        var identity = CountyCsvIntakeIdempotency.Create(receipt);

        Assert.Equal(CountyCsvIntakeIdempotency.ContractId, identity.ContractId);
        Assert.Equal(
            "0e65b1bd4dda1a88af70007de17592a6fc521b666a9b99bf92a284184f2fcbbf",
            identity.IdempotencyKey);
        Assert.Same(Benton, identity.County);
        Assert.Equal(CountyCsvDataset.Parcels, identity.Dataset);
        Assert.Equal(sourceContent, identity.Content);
        Assert.NotSame(sourceContent, identity.Content);
    }

    [Fact]
    public void Create_AcceptsEveryCanonicalCountyForBothClosedDatasets()
    {
        var keys = new HashSet<string>(StringComparer.Ordinal);

        foreach (var county in WashingtonCountyRegistry.Counties)
        {
            foreach (var dataset in new[] { CountyCsvDataset.Parcels, CountyCsvDataset.Sales })
            {
                var identity = CountyCsvIntakeIdempotency.Create(Receipt(county, dataset));

                Assert.Same(county, identity.County);
                Assert.Equal(dataset, identity.Dataset);
                Assert.Matches("^[0-9a-f]{64}$", identity.IdempotencyKey);
                Assert.True(keys.Add(identity.IdempotencyKey));
            }
        }

        Assert.Equal(78, keys.Count);
    }

    [Fact]
    public void Create_IsDeterministicAndSeparatesEveryKeyComponent()
    {
        var baseline = CountyCsvIntakeIdempotency.Create(Receipt(Benton));
        var equivalent = CountyCsvIntakeIdempotency.Create(Receipt(Benton with { }));
        var differentCounty = CountyCsvIntakeIdempotency.Create(Receipt(Franklin));
        var differentDataset = CountyCsvIntakeIdempotency.Create(
            Receipt(Benton, CountyCsvDataset.Sales));
        var differentHash = CountyCsvIntakeIdempotency.Create(
            Receipt(Benton, hash: new string('b', 64)));
        var differentLength = CountyCsvIntakeIdempotency.Create(
            Receipt(Benton, byteLength: 21));

        Assert.Equal(baseline, equivalent);
        Assert.Equal(
            5,
            new HashSet<string>(StringComparer.Ordinal)
            {
                baseline.IdempotencyKey,
                differentCounty.IdempotencyKey,
                differentDataset.IdempotencyKey,
                differentHash.IdempotencyKey,
                differentLength.IdempotencyKey,
            }.Count);
    }

    [Fact]
    public void Create_RejectsNullMalformedAndWrongContractReceipts()
    {
        var valid = Receipt(Benton);
        var cases = new CountyCsvCountyBoundIntakeReceipt?[]
        {
            null,
            valid with { ContractId = "wal.county-upload.csv-county-bound-intake.v2" },
            valid with { Binding = null! },
            valid with { IntakeReceipt = null! },
            valid with
            {
                IntakeReceipt = valid.IntakeReceipt with
                {
                    ContractId = "wal.county-upload.csv-envelope.v2",
                },
            },
            valid with
            {
                IntakeReceipt = valid.IntakeReceipt with { Content = null! },
            },
            valid with
            {
                IntakeReceipt = valid.IntakeReceipt with { Document = null! },
            },
        };

        foreach (var candidate in cases)
        {
            AssertError(
                CountyCsvIntakeIdempotencyErrorCode.InvalidReceipt,
                () => CountyCsvIntakeIdempotency.Create(candidate));
        }
    }

    [Fact]
    public void Create_RejectsAlteredOrUnknownCountyIdentity()
    {
        foreach (var county in new[]
        {
            Benton with { Key = "wa-not-benton" },
            Benton with { Slug = "not-benton-wa" },
            Benton with { Name = "Benton County" },
            Benton with { FipsCode = "53099" },
        })
        {
            AssertError(
                CountyCsvIntakeIdempotencyErrorCode.NonCanonicalCounty,
                () => CountyCsvIntakeIdempotency.Create(Receipt(county)));
        }
    }

    [Theory]
    [InlineData(CountyCsvDataset.Unspecified)]
    [InlineData((CountyCsvDataset)(-1))]
    [InlineData((CountyCsvDataset)int.MaxValue)]
    public void Create_RejectsUnsupportedDataset(CountyCsvDataset dataset)
    {
        AssertError(
            CountyCsvIntakeIdempotencyErrorCode.UnsupportedDataset,
            () => CountyCsvIntakeIdempotency.Create(Receipt(Benton, dataset)));
    }

    [Fact]
    public void Create_RejectsAnyPostureDrift()
    {
        var valid = Receipt(Benton);
        var cases = new[]
        {
            valid with
            {
                Binding = valid.Binding with { DataMode = CountyDataMode.Public },
            },
            valid with
            {
                Binding = valid.Binding with { Exposure = CountyDataExposure.Public },
            },
            valid with
            {
                Binding = valid.Binding with { Action = CountyDataAction.Read },
            },
            valid with
            {
                Binding = valid.Binding with { DataMode = (CountyDataMode)int.MaxValue },
            },
        };

        foreach (var candidate in cases)
        {
            AssertError(
                CountyCsvIntakeIdempotencyErrorCode.InvalidBindingPosture,
                () => CountyCsvIntakeIdempotency.Create(candidate));
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")]
    [InlineData("gaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    [InlineData("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    [InlineData("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    public void Create_RejectsMalformedContentHash(string? hash)
    {
        AssertError(
            CountyCsvIntakeIdempotencyErrorCode.InvalidContentEvidence,
            () => CountyCsvIntakeIdempotency.Create(Receipt(Benton, hash: hash!)));
    }

    [Theory]
    [InlineData(0L)]
    [InlineData(-1L)]
    [InlineData((long)int.MaxValue + 1)]
    public void Create_RejectsOutOfBoundByteLength(long byteLength)
    {
        AssertError(
            CountyCsvIntakeIdempotencyErrorCode.InvalidContentEvidence,
            () => CountyCsvIntakeIdempotency.Create(Receipt(Benton, byteLength: byteLength)));
    }

    [Fact]
    public void Create_RejectsContentAndDocumentLengthMismatch()
    {
        var receipt = Receipt(Benton);
        var mismatched = receipt with
        {
            IntakeReceipt = receipt.IntakeReceipt with
            {
                Document = receipt.IntakeReceipt.Document with { InputBytes = 21 },
            },
        };

        AssertError(
            CountyCsvIntakeIdempotencyErrorCode.InvalidContentEvidence,
            () => CountyCsvIntakeIdempotency.Create(mismatched));
    }

    [Fact]
    public void Create_ValidatesOnlyTheIdentityBearingPredecessorSubset()
    {
        var valid = Receipt(Benton);
        var ignoredPredecessorDrift = valid with
        {
            IntakeReceipt = valid.IntakeReceipt with
            {
                FileName = null!,
                Format = "xlsx",
                MediaType = "application/octet-stream",
                Document = valid.IntakeReceipt.Document with
                {
                    Headers = null!,
                    Rows = null!,
                },
            },
        };

        var baseline = CountyCsvIntakeIdempotency.Create(valid);
        var subsetIdentity = CountyCsvIntakeIdempotency.Create(ignoredPredecessorDrift);

        Assert.Equal(baseline, subsetIdentity);
    }

    [Fact]
    public void ContractSurface_HasOnePureReceiptToIdentityOperationAndNoState()
    {
        Assert.Equal(
            "wal.county-upload.csv-idempotency.v1",
            CountyCsvIntakeIdempotency.ContractId);

        var operation = Assert.Single(
            typeof(CountyCsvIntakeIdempotency).GetMethods(
                BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly));
        Assert.Equal(nameof(CountyCsvIntakeIdempotency.Create), operation.Name);
        Assert.Equal(typeof(CountyCsvIntakeIdempotencyIdentity), operation.ReturnType);
        Assert.Equal(
            new[] { typeof(CountyCsvCountyBoundIntakeReceipt) },
            operation.GetParameters().Select(parameter => parameter.ParameterType));
        Assert.Empty(
            typeof(CountyCsvIntakeIdempotency).GetFields(
                BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Instance));
    }

    private static CountyCsvCountyBoundIntakeReceipt Receipt(
        WashingtonCountyIdentity county,
        CountyCsvDataset dataset = CountyCsvDataset.Parcels,
        string hash = LowercaseHash,
        long byteLength = 20,
        CountyCsvContentEvidence? content = null)
    {
        var evidence = content ?? new CountyCsvContentEvidence(byteLength, hash);
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
                evidence,
                new CountyCsvDocument(
                    Array.AsReadOnly(new[] { "parcel_id" }),
                    Array.AsReadOnly<IReadOnlyList<string>>([]),
                    byteLength,
                    evidence.Sha256)));
    }

    private static void AssertError(
        CountyCsvIntakeIdempotencyErrorCode expected,
        Action action)
    {
        var exception = Assert.Throws<CountyCsvIntakeIdempotencyException>(action);
        Assert.Equal(expected, exception.ErrorCode);
    }

    private static WashingtonCountyIdentity Resolve(string value)
    {
        Assert.True(WashingtonCountyRegistry.TryResolve(value, out var county));
        return county;
    }
}
