using System;
using System.Collections.Generic;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C51-PII-D unit tests. Covers the 15-case binding matrix
/// from the C51-PII-C policy:
///
///  1. Required + None + Engaged+Exhaustive          → Pass
///  2. Required + None + Engaged+Non-exhaustive      → Fail
///  3. Required + None + Not Engaged                 → Fail
///  4. Required + Indirect (any engagement)          → Fail
///  5. Required + Direct (any engagement)            → Fail
///  6. AllowIndirectWithCare + None / Indirect + Engaged → Pass
///  7. AllowIndirectWithCare + Direct + Engaged      → Fail
///  8. AllowIndirectWithCare + (any) + Not Engaged   → Fail
///  9. AllowDirectWithExplicitConsentAudit + Direct + Engaged → Pass
/// 10. AllowDirectWithExplicitConsentAudit + Direct + Not Engaged → Fail
/// 11. AllowAny + (any) + (any)                     → Pass
/// 12. Stance 0 / undefined                          → ArgumentException
/// 13. Null catalog / empty columns                  → ArgumentNullException / ArgumentException
/// 14. Composite Direct + None under AllowAny        → Pass
/// 15. Composite Direct + None under Required        → Fail (worst PII dominates)
/// </summary>
public sealed class PiiClassificationPreflightTests
{
    private static IPacsSchemaCatalog BuildCatalog(
        bool engaged,
        bool exhaustive,
        PiiClassification tablePii,
        IReadOnlyDictionary<string, PiiClassification> columnPii)
    {
        var columns = new List<PacsColumn>();
        foreach (var (col, p) in columnPii)
        {
            columns.Add(new PacsColumn(
                TableName: "owner",
                ColumnName: col,
                DeclaredType: "varchar",
                Nullable: true,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: p,
                ProvenanceLine: $"fixture://owner.{col}",
                Notes: string.Empty));
        }
        var table = new PacsTable(
            TableName: "owner",
            IdentityTuple: new[] { "owner_id" },
            ConversionEra: PacsConversionEra.Both,
            DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
            PiiClassification: tablePii,
            ProvenancePath: "fixture://owner",
            ForeignKeys: Array.Empty<PacsForeignKey>());

        var version = new PacsSchemaVersion(
            PacsRelease: "fixture",
            SourceFileHashes: new Dictionary<string, string> { ["fixture"] = "fixture-hash" },
            IngestedAt: new DateTime(2026, 4, 30, 12, 0, 0, DateTimeKind.Utc),
            ConversionManifestHash: "no-conversion-manifest-supplied");

        PacsPiiManifest? manifest = null;
        if (engaged)
        {
            manifest = new PacsPiiManifest(
                ManifestPath: "fixture://pii-manifest",
                ManifestVersion: "1.0.0",
                ManifestEvent: "fixture-event",
                TableExhaustiveFlags: exhaustive
                    ? (IReadOnlySet<string>)new HashSet<string>(StringComparer.Ordinal) { "owner" }
                    : new HashSet<string>(StringComparer.Ordinal),
                TableEntries: Array.Empty<PacsPiiTableEntry>(),
                ColumnEntries: Array.Empty<PacsPiiColumnEntry>());
        }

        var data = new PacsSchemaSourceData(
            new[] { table },
            columns,
            Array.Empty<PacsDictionary>(),
            version,
            manifest);
        var source = new InMemoryPacsSchemaSource(data);
        return PacsSchemaCatalog.BuildAsync(source, CancellationToken.None).GetAwaiter().GetResult();
    }

    [Fact]
    public async Task Case1_Required_None_EngagedExhaustive_Pass()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: true, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["owner_id"] = PiiClassification.None });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "owner_id" },
            PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Pass);
        r.MatchedClassification.Should().Be(PiiClassification.None);
        r.ManifestEngaged.Should().BeTrue();
        r.TableExhaustive.Should().BeTrue();
    }

    [Fact]
    public async Task Case2_Required_None_EngagedNonExhaustive_Fail()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["owner_id"] = PiiClassification.None });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "owner_id" },
            PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
        r.Message.Should().Contain("HG-PII-2");
    }

    [Fact]
    public async Task Case3_Required_None_NotEngaged_Fail()
    {
        var catalog = BuildCatalog(engaged: false, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["owner_id"] = PiiClassification.None });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "owner_id" },
            PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
        r.ManifestEngaged.Should().BeFalse();
        r.Message.Should().Contain("not engaged");
    }

    [Fact]
    public async Task Case4_Required_Indirect_Fail()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: true, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["addr"] = PiiClassification.Indirect });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "addr" },
            PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
        r.MatchedClassification.Should().Be(PiiClassification.Indirect);
    }

    [Fact]
    public async Task Case5_Required_Direct_Fail()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: true, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["full_name"] = PiiClassification.Direct });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "full_name" },
            PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
        r.MatchedClassification.Should().Be(PiiClassification.Direct);
    }

    [Fact]
    public async Task Case6_AllowIndirect_NoneOrIndirect_Engaged_Pass()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification>
            {
                ["safe"]      = PiiClassification.None,
                ["addr_part"] = PiiClassification.Indirect,
            });
        var sut = new PiiClassificationPreflight();
        var rNone = await sut.ValidateAsync(catalog, "owner", new[] { "safe" },
            PiiClassificationPreflightStance.AllowIndirectWithCare, CancellationToken.None);
        var rInd = await sut.ValidateAsync(catalog, "owner", new[] { "addr_part" },
            PiiClassificationPreflightStance.AllowIndirectWithCare, CancellationToken.None);
        rNone.Outcome.Should().Be(PiiClassificationPreflightOutcome.Pass);
        rInd.Outcome.Should().Be(PiiClassificationPreflightOutcome.Pass);
    }

    [Fact]
    public async Task Case7_AllowIndirect_Direct_Fail()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["full_name"] = PiiClassification.Direct });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "full_name" },
            PiiClassificationPreflightStance.AllowIndirectWithCare, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
        r.Message.Should().Contain("Direct");
    }

    [Fact]
    public async Task Case8_AllowIndirect_NotEngaged_Fail()
    {
        var catalog = BuildCatalog(engaged: false, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["safe"] = PiiClassification.None });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "safe" },
            PiiClassificationPreflightStance.AllowIndirectWithCare, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
        r.ManifestEngaged.Should().BeFalse();
    }

    [Fact]
    public async Task Case9_AllowDirectAudit_Direct_Engaged_Pass()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["full_name"] = PiiClassification.Direct });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "full_name" },
            PiiClassificationPreflightStance.AllowDirectWithExplicitConsentAudit, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Pass);
        r.MatchedClassification.Should().Be(PiiClassification.Direct);
    }

    [Fact]
    public async Task Case10_AllowDirectAudit_NotEngaged_Fail()
    {
        var catalog = BuildCatalog(engaged: false, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["full_name"] = PiiClassification.None });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "full_name" },
            PiiClassificationPreflightStance.AllowDirectWithExplicitConsentAudit, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
    }

    [Fact]
    public async Task Case11_AllowAny_AnyClass_AnyEngagement_Pass()
    {
        var catalog = BuildCatalog(engaged: false, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["full_name"] = PiiClassification.Direct });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "full_name" },
            PiiClassificationPreflightStance.AllowAny, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Pass);
        r.MatchedClassification.Should().Be(PiiClassification.Direct,
            "AllowAny passes Direct but reports it honestly");
    }

    [Fact]
    public async Task Case12_StanceZeroOrUndefined_ArgumentException()
    {
        var catalog = BuildCatalog(engaged: false, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["c"] = PiiClassification.None });
        var sut = new PiiClassificationPreflight();
        var act0 = async () => await sut.ValidateAsync(catalog, "owner", new[] { "c" },
            (PiiClassificationPreflightStance)0, CancellationToken.None);
        var actUndef = async () => await sut.ValidateAsync(catalog, "owner", new[] { "c" },
            (PiiClassificationPreflightStance)999, CancellationToken.None);
        await act0.Should().ThrowAsync<ArgumentException>().WithMessage("*HG-PII-3*");
        await actUndef.Should().ThrowAsync<ArgumentException>().WithMessage("*HG-PII-3*");
    }

    [Fact]
    public async Task Case13_NullArgs_ArgumentExceptions()
    {
        var catalog = BuildCatalog(engaged: false, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification> { ["c"] = PiiClassification.None });
        var sut = new PiiClassificationPreflight();
        var nullCatalog = async () => await sut.ValidateAsync(null!, "owner", new[] { "c" },
            PiiClassificationPreflightStance.AllowAny, CancellationToken.None);
        var emptyTable = async () => await sut.ValidateAsync(catalog, "", new[] { "c" },
            PiiClassificationPreflightStance.AllowAny, CancellationToken.None);
        var nullCols = async () => await sut.ValidateAsync(catalog, "owner", null!,
            PiiClassificationPreflightStance.AllowAny, CancellationToken.None);
        var emptyCols = async () => await sut.ValidateAsync(catalog, "owner", Array.Empty<string>(),
            PiiClassificationPreflightStance.AllowAny, CancellationToken.None);
        await nullCatalog.Should().ThrowAsync<ArgumentNullException>();
        await emptyTable.Should().ThrowAsync<ArgumentException>();
        await nullCols.Should().ThrowAsync<ArgumentNullException>();
        await emptyCols.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task Case14_Composite_DirectAndNone_AllowAny_Pass()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: false, PiiClassification.None,
            new Dictionary<string, PiiClassification>
            {
                ["safe"]      = PiiClassification.None,
                ["full_name"] = PiiClassification.Direct,
            });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "safe", "full_name" },
            PiiClassificationPreflightStance.AllowAny, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Pass);
        r.MatchedClassification.Should().Be(PiiClassification.Direct,
            "worst-PII reported even on Pass under AllowAny");
    }

    [Fact]
    public async Task Case15_Composite_DirectAndNone_Required_Fail_WorstColumnNamed()
    {
        var catalog = BuildCatalog(engaged: true, exhaustive: true, PiiClassification.None,
            new Dictionary<string, PiiClassification>
            {
                ["safe"]      = PiiClassification.None,
                ["full_name"] = PiiClassification.Direct,
            });
        var sut = new PiiClassificationPreflight();
        var r = await sut.ValidateAsync(catalog, "owner", new[] { "safe", "full_name" },
            PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding, CancellationToken.None);
        r.Outcome.Should().Be(PiiClassificationPreflightOutcome.Fail);
        r.MatchedClassification.Should().Be(PiiClassification.Direct);
        r.Message.Should().Contain("full_name", "offending column named in composite Fail");
    }
}
