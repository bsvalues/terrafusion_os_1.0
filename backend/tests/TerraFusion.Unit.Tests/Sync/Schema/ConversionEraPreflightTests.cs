using System;
using System.Collections.Generic;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C50-CONV-D unit tests. Covers the binding 10-case test
/// matrix from the C50-CONV-C policy
/// (<c>docs/sync/pacs-schema-conversion-era-consumer-migration-policy.md</c>):
///
/// 1.  Engaged + column annotated Both    + Required → Pass
/// 2.  Engaged + column annotated Post2017 + Required → Pass
/// 3.  Engaged + column annotated Pre2017  + Required → Fail
/// 4.  Engaged + column UNANNOTATED        + Required → Fail (Unknown)
/// 5.  NOT engaged                          + Required → Pass (Both)
/// 6.  Engaged + column annotated Pre2017  + AllowPre2017 → Pass
/// 7.  Engaged + column UNANNOTATED        + AllowPre2017 → Fail (Unknown)
/// 8.  Engaged + column UNANNOTATED        + AllowAny → Pass
/// 9.  Stance value 0 / undefined → ArgumentException
/// 10. Null catalog / empty columns → ArgumentNullException / ArgumentException
///
/// Plus tests for composite columns, structured-message format,
/// and worst-era selection.
/// </summary>
public sealed class ConversionEraPreflightTests
{
    private const string ManifestEngagedStamp =
        "manifest@/fake/path/manifest.json#1.0.0#Benton-2017-Harris-PACS-9.0-conversion";

    private const string ManifestNotEngagedStamp = "no-conversion-manifest-supplied";

    /// <summary>
    /// Build a small catalog with a single table and configurable
    /// column eras. Used by every test to keep the fixture surface
    /// minimal.
    /// </summary>
    private static IPacsSchemaCatalog BuildCatalog(
        bool manifestEngaged,
        PacsConversionEra tableEra,
        IReadOnlyDictionary<string, PacsConversionEra> columnEras)
    {
        var columns = new List<PacsColumn>();
        foreach (var (colName, colEra) in columnEras)
        {
            columns.Add(new PacsColumn(
                TableName:        "imprv_detail",
                ColumnName:       colName,
                DeclaredType:     "varchar",
                Nullable:         true,
                ConversionEra:    colEra,
                DictionaryRef:    null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine:   $"fixture://imprv_detail.{colName}",
                Notes:            string.Empty));
        }

        var table = new PacsTable(
            TableName:           "imprv_detail",
            IdentityTuple:       new[] { "imprv_det_id" },
            ConversionEra:       tableEra,
            DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
            PiiClassification:   PiiClassification.None,
            ProvenancePath:      "fixture://imprv_detail",
            ForeignKeys:         Array.Empty<PacsForeignKey>());

        var version = new PacsSchemaVersion(
            PacsRelease: "fixture",
            SourceFileHashes: new Dictionary<string, string> { ["fixture"] = "fixture-hash" },
            IngestedAt: new DateTime(2026, 4, 30, 12, 0, 0, DateTimeKind.Utc),
            ConversionManifestHash: manifestEngaged ? ManifestEngagedStamp : ManifestNotEngagedStamp);

        var data = new PacsSchemaSourceData(
            new[] { table },
            columns,
            Array.Empty<PacsDictionary>(),
            version);

        var source = new InMemoryPacsSchemaSource(data);
        return PacsSchemaCatalog.BuildAsync(source, CancellationToken.None).GetAwaiter().GetResult();
    }

    // ----------------------------------------------------------------------
    // Test matrix case 1
    // ----------------------------------------------------------------------
    [Fact]
    public async Task Case1_Required_ColumnBoth_Pass()
    {
        var catalog = BuildCatalog(
            manifestEngaged: true,
            tableEra: PacsConversionEra.Both,
            columnEras: new Dictionary<string, PacsConversionEra> { ["imprv_det_meth_cd"] = PacsConversionEra.Both });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "imprv_det_meth_cd" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Pass);
        result.MatchedEra.Should().Be(PacsConversionEra.Both);
        result.Provenance.Should().Be(ConversionEraPreflightProvenance.ColumnEntry);
    }

    // Test matrix case 2
    [Fact]
    public async Task Case2_Required_ColumnPost2017_Pass()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Both,
            new Dictionary<string, PacsConversionEra> { ["new_col"] = PacsConversionEra.Post2017 });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "new_col" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Pass);
        result.MatchedEra.Should().Be(PacsConversionEra.Post2017);
    }

    // Test matrix case 3
    [Fact]
    public async Task Case3_Required_ColumnPre2017_Fail()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Both,
            new Dictionary<string, PacsConversionEra> { ["ascend_orig_meth_cd"] = PacsConversionEra.Pre2017 });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "ascend_orig_meth_cd" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Fail);
        result.MatchedEra.Should().Be(PacsConversionEra.Pre2017);
        result.Message.Should().Contain("Pre2017");
        result.Message.Should().Contain("RequirePost2017OrBoth");
    }

    // Test matrix case 4
    [Fact]
    public async Task Case4_Required_ColumnUnknownAndUnannotatedTable_Fail()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Unknown,
            new Dictionary<string, PacsConversionEra> { ["unannotated_col"] = PacsConversionEra.Unknown });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "unannotated_col" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Fail);
        result.MatchedEra.Should().Be(PacsConversionEra.Unknown);
        result.Provenance.Should().Be(ConversionEraPreflightProvenance.ManifestEngagedNoEntry);
        result.Message.Should().Contain("Unknown");
        result.Message.Should().Contain("HG-CONV-2");
    }

    // Test matrix case 5
    [Fact]
    public async Task Case5_NotEngaged_Required_PassWithBothBackwardsCompat()
    {
        var catalog = BuildCatalog(manifestEngaged: false, tableEra: PacsConversionEra.Both,
            columnEras: new Dictionary<string, PacsConversionEra> { ["any_col"] = PacsConversionEra.Both });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "any_col" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Pass);
        result.MatchedEra.Should().Be(PacsConversionEra.Both);
        result.Provenance.Should().Be(ConversionEraPreflightProvenance.ManifestNotEngaged,
            "the C50-CONV-B backwards-compat bridge surfaces honestly via the provenance flag");
    }

    // Test matrix case 6
    [Fact]
    public async Task Case6_AllowPre2017_ColumnPre2017_Pass()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Pre2017,
            new Dictionary<string, PacsConversionEra> { ["historical_col"] = PacsConversionEra.Pre2017 });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "historical_col" },
            ConversionEraPreflightStance.AllowPre2017, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Pass);
        result.MatchedEra.Should().Be(PacsConversionEra.Pre2017);
    }

    // Test matrix case 7
    [Fact]
    public async Task Case7_AllowPre2017_ColumnUnknown_Fail()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Unknown,
            new Dictionary<string, PacsConversionEra> { ["unannotated_col"] = PacsConversionEra.Unknown });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "unannotated_col" },
            ConversionEraPreflightStance.AllowPre2017, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Fail);
        result.MatchedEra.Should().Be(PacsConversionEra.Unknown);
    }

    // Test matrix case 8
    [Fact]
    public async Task Case8_AllowAny_ColumnUnknown_Pass()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Unknown,
            new Dictionary<string, PacsConversionEra> { ["unannotated_col"] = PacsConversionEra.Unknown });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "unannotated_col" },
            ConversionEraPreflightStance.AllowAny, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Pass);
        result.MatchedEra.Should().Be(PacsConversionEra.Unknown,
            "AllowAny passes Unknown but reports the era honestly");
    }

    // Test matrix case 9
    [Fact]
    public async Task Case9_Stance0_OrUndefined_ArgumentException()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Both,
            new Dictionary<string, PacsConversionEra> { ["c"] = PacsConversionEra.Both });
        var sut = new ConversionEraPreflight();

        var actZero = async () => await sut.ValidateAsync(catalog, "imprv_detail", new[] { "c" },
            (ConversionEraPreflightStance)0, CancellationToken.None);
        var actUndef = async () => await sut.ValidateAsync(catalog, "imprv_detail", new[] { "c" },
            (ConversionEraPreflightStance)999, CancellationToken.None);

        await actZero.Should().ThrowAsync<ArgumentException>().WithMessage("*HG-CONV-3*");
        await actUndef.Should().ThrowAsync<ArgumentException>().WithMessage("*HG-CONV-3*");
    }

    // Test matrix case 10
    [Fact]
    public async Task Case10_NullArgs_ArgumentExceptions()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Both,
            new Dictionary<string, PacsConversionEra> { ["c"] = PacsConversionEra.Both });
        var sut = new ConversionEraPreflight();

        var actNullCatalog = async () => await sut.ValidateAsync(null!, "imprv_detail", new[] { "c" },
            ConversionEraPreflightStance.AllowAny, CancellationToken.None);
        var actEmptyTable = async () => await sut.ValidateAsync(catalog, "", new[] { "c" },
            ConversionEraPreflightStance.AllowAny, CancellationToken.None);
        var actNullColumns = async () => await sut.ValidateAsync(catalog, "imprv_detail", null!,
            ConversionEraPreflightStance.AllowAny, CancellationToken.None);
        var actEmptyColumns = async () => await sut.ValidateAsync(catalog, "imprv_detail", Array.Empty<string>(),
            ConversionEraPreflightStance.AllowAny, CancellationToken.None);

        await actNullCatalog.Should().ThrowAsync<ArgumentNullException>();
        await actEmptyTable.Should().ThrowAsync<ArgumentException>();
        await actNullColumns.Should().ThrowAsync<ArgumentNullException>();
        await actEmptyColumns.Should().ThrowAsync<ArgumentException>();
    }

    // ----------------------------------------------------------------------
    // Additional coverage beyond the 10-case binding matrix
    // ----------------------------------------------------------------------
    [Fact]
    public async Task Composite_WorstEraDominates_FailWhenAnyColumnIsPre()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Both,
            new Dictionary<string, PacsConversionEra>
            {
                ["good"]    = PacsConversionEra.Both,
                ["bad_pre"] = PacsConversionEra.Pre2017,
            });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "good", "bad_pre" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Fail);
        result.MatchedEra.Should().Be(PacsConversionEra.Pre2017,
            "worst era across composite wins (Pre2017 > Both severity)");
        result.Message.Should().Contain("bad_pre", "the offending column is named in the message");
    }

    [Fact]
    public async Task Composite_UnknownBeatsPre_WorstEraIsUnknown()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Unknown,
            new Dictionary<string, PacsConversionEra>
            {
                ["pre_col"]     = PacsConversionEra.Pre2017,
                ["unknown_col"] = PacsConversionEra.Unknown,
            });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "pre_col", "unknown_col" },
            ConversionEraPreflightStance.AllowPre2017, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Fail);
        result.MatchedEra.Should().Be(PacsConversionEra.Unknown,
            "Unknown severity > Pre2017 severity");
    }

    [Fact]
    public async Task Message_Format_MatchesC50CONVCBindingShape()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Both,
            new Dictionary<string, PacsConversionEra> { ["ascend_x"] = PacsConversionEra.Pre2017 });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "ascend_x" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        // Format binding: [ConversionEraPreflight] <Outcome> for
        // '<table>(<columns>)' under <stance>: matched era <Era>
        // from <provenance>. <reason>
        result.Message.Should().StartWith("[ConversionEraPreflight] Fail for 'imprv_detail(ascend_x)'");
        result.Message.Should().Contain("under RequirePost2017OrBoth");
        result.Message.Should().Contain("matched era Pre2017 from column-entry");
    }

    [Fact]
    public async Task ColumnNotInCatalog_FallsBackToTableEra()
    {
        var catalog = BuildCatalog(true, PacsConversionEra.Pre2017,
            new Dictionary<string, PacsConversionEra> { ["other_col"] = PacsConversionEra.Both });
        var sut = new ConversionEraPreflight();

        var result = await sut.ValidateAsync(catalog, "imprv_detail", new[] { "missing_col" },
            ConversionEraPreflightStance.RequirePost2017OrBoth, CancellationToken.None);

        result.Outcome.Should().Be(ConversionEraPreflightOutcome.Fail);
        result.MatchedEra.Should().Be(PacsConversionEra.Pre2017,
            "table-level era applies when column is not in catalog");
        result.Provenance.Should().Be(ConversionEraPreflightProvenance.TableEntryInherited);
    }
}
