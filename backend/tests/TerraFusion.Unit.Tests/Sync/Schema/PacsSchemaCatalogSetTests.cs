using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C54-MULTI-B unit tests for <see cref="PacsSchemaCatalogSet"/>.
/// Covers the eight minimum cases declared in the C54-MULTI-A
/// implementation contract:
///
///  1. Happy path: two catalogs in one set, lookup by each identity returns the right one.
///  2. Lookup miss: identity not registered → typed Miss result.
///  3. Duplicate identity at build time → throws.
///  4. Duplicate manifest path without allow-shared → throws.
///  5. Same county, different source-connection → both load.
///  6. Lookup with empty / null identity components → typed Miss.
///  7. Per-catalog invariant report: catalog A's report has no rows pointing to catalog B's tables.
///  8. AllowSharedManifestPath=true on both colliding entries → build succeeds.
///
/// Plus identity-derivation and version-hash determinism tests.
/// </summary>
public sealed class PacsSchemaCatalogSetTests
{
    private static PacsSchemaSourceData BuildSourceData(string tableName, string version = "fixture-v1")
    {
        var table = new PacsTable(
            TableName: tableName,
            IdentityTuple: new[] { "id" },
            ConversionEra: PacsConversionEra.Both,
            DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
            PiiClassification: PiiClassification.None,
            ProvenancePath: $"fixture://{tableName}",
            ForeignKeys: Array.Empty<PacsForeignKey>());
        var col = new PacsColumn(
            TableName: tableName,
            ColumnName: "id",
            DeclaredType: "int",
            Nullable: false,
            ConversionEra: PacsConversionEra.Both,
            DictionaryRef: null,
            PiiClassification: PiiClassification.None,
            ProvenanceLine: $"fixture://{tableName}.id",
            Notes: string.Empty);
        var schemaVersion = new PacsSchemaVersion(
            PacsRelease: $"PACS-{version}",
            SourceFileHashes: new Dictionary<string, string> { [$"fixture://{tableName}"] = $"hash-{version}" },
            IngestedAt: DateTime.UtcNow,
            ConversionManifestHash: "no-conversion-manifest-supplied");
        return new PacsSchemaSourceData(
            new[] { table },
            new[] { col },
            Array.Empty<PacsDictionary>(),
            schemaVersion);
    }

    private static IPacsSchemaSource Source(string tableName, string version = "fixture-v1") =>
        new InMemoryPacsSchemaSource(BuildSourceData(tableName, version));

    [Fact]
    public async Task Case1_HappyPath_TwoCatalogs_LookupByEachIdentityReturnsRightOne()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton",  "benton-prod",  Source("benton_table")),
            new("WA-Yakima",  "yakima-prod",  Source("yakima_table")),
        };

        var set = await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        set.Catalogs.Should().HaveCount(2);
        set.Identities.Should().HaveCount(2);

        var benton = set.TryGetCatalog("WA-Benton", "benton-prod");
        benton.HasValue.Should().BeTrue();
        benton.Value!.TryGetTable("benton_table").HasValue.Should().BeTrue();
        benton.Value!.TryGetTable("yakima_table").HasValue.Should().BeFalse();

        var yakima = set.TryGetCatalog("WA-Yakima", "yakima-prod");
        yakima.HasValue.Should().BeTrue();
        yakima.Value!.TryGetTable("yakima_table").HasValue.Should().BeTrue();
        yakima.Value!.TryGetTable("benton_table").HasValue.Should().BeFalse();
    }

    [Fact]
    public async Task Case2_UnregisteredIdentity_ReturnsTypedMiss()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-prod", Source("benton_table")),
        };
        var set = await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        var ghost = set.TryGetCatalog("WA-Ghost", "phantom-conn");

        ghost.HasValue.Should().BeFalse();
        ghost.Reason.Should().Be(PacsSchemaLookupResult<IPacsSchemaCatalog>.ReasonNotFound);
        ghost.Value.Should().BeNull();
    }

    [Fact]
    public async Task Case3_DuplicateIdentity_AtBuildTime_Throws()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-prod", Source("t1")),
            new("WA-Benton", "benton-prod", Source("t2")),  // same primary key
        };

        var act = async () => await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Duplicate*WA-Benton*benton-prod*C54-MULTI-A*");
    }

    [Fact]
    public async Task Case4_DuplicateManifestPath_WithoutAllowShared_Throws()
    {
        var sharedPath = "/fake/shared/manifest.json";
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-prod", Source("t1"),
                ManifestPaths: new HashSet<string> { sharedPath },
                AllowSharedManifestPath: false),
            new("WA-Yakima", "yakima-prod", Source("t2"),
                ManifestPaths: new HashSet<string> { sharedPath },
                AllowSharedManifestPath: false),
        };

        var act = async () => await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Manifest path*shared*ISOL-1*");
    }

    [Fact]
    public async Task Case5_SameCounty_DifferentSourceConnection_BothLoad()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-live",    Source("live_table")),
            new("WA-Benton", "benton-staging", Source("staging_table")),
        };

        var set = await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        set.Catalogs.Should().HaveCount(2);

        var live    = set.TryGetCatalog("WA-Benton", "benton-live");
        var staging = set.TryGetCatalog("WA-Benton", "benton-staging");

        live.HasValue.Should().BeTrue();
        staging.HasValue.Should().BeTrue();
        live.Value!.TryGetTable("live_table").HasValue.Should().BeTrue();
        staging.Value!.TryGetTable("staging_table").HasValue.Should().BeTrue();
    }

    [Fact]
    public async Task Case6_EmptyOrWhitespaceLookupComponents_ReturnTypedMiss()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-prod", Source("t1")),
        };
        var set = await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        var emptyCounty = set.TryGetCatalog("", "benton-prod");
        var emptyConn   = set.TryGetCatalog("WA-Benton", "");

        emptyCounty.HasValue.Should().BeFalse();
        emptyConn.HasValue.Should().BeFalse();
    }

    [Fact]
    public async Task Case7_PerCatalogInvariantReport_NoCrossPollination()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-prod", Source("benton_table")),
            new("WA-Yakima", "yakima-prod", Source("yakima_table")),
        };
        var set = await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        var benton = set.TryGetCatalog("WA-Benton", "benton-prod").Value!;
        var yakima = set.TryGetCatalog("WA-Yakima", "yakima-prod").Value!;

        // Each catalog has its own InvariantReport. ISOL-4 means
        // result rows for one catalog cannot reference the other's
        // tables. Use Should().NotContain since AllSatisfy fails
        // on empty collections (clean catalogs may produce zero
        // rows).
        benton.InvariantReport.Results
            .Should().NotContain(r => r.TableName == "yakima_table");
        yakima.InvariantReport.Results
            .Should().NotContain(r => r.TableName == "benton_table");

        // Catalogs are distinct instances (no aliasing).
        benton.Should().NotBeSameAs(yakima);
        benton.InvariantReport.Should().NotBeSameAs(yakima.InvariantReport);
    }

    [Fact]
    public async Task Case8_DuplicateManifestPath_BothAllowShared_BuildSucceeds()
    {
        var sharedPath = "/fake/shared/cross-county.json";
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-prod", Source("t1"),
                ManifestPaths: new HashSet<string> { sharedPath },
                AllowSharedManifestPath: true),
            new("WA-Yakima", "yakima-prod", Source("t2"),
                ManifestPaths: new HashSet<string> { sharedPath },
                AllowSharedManifestPath: true),
        };

        var set = await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        set.Catalogs.Should().HaveCount(2);
    }

    [Fact]
    public async Task BuildAsync_NullEntries_Throws()
    {
        var act = async () => await PacsSchemaCatalogSet.BuildAsync(null!, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task BuildAsync_EmptyEntries_Throws()
    {
        var act = async () => await PacsSchemaCatalogSet.BuildAsync(
            Array.Empty<PacsCatalogSetEntry>(), CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task BuildAsync_EntryWithEmptyCountyId_Throws()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("", "conn", Source("t1")),
        };
        var act = async () => await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task DeriveFromCatalog_PopulatesAllFields()
    {
        var data = BuildSourceData("benton_table", "v9.0.4");
        var catalog = await PacsSchemaCatalog.BuildAsync(
            new InMemoryPacsSchemaSource(data), CancellationToken.None);

        var identity = PacsCatalogIdentity.DeriveFromCatalog(
            "WA-Benton", "benton-prod", catalog);

        identity.CountyId.Should().Be("WA-Benton");
        identity.SourceConnectionId.Should().Be("benton-prod");
        identity.PacsRelease.Should().Be("PACS-v9.0.4");
        identity.SchemaVersionHash.Should().HaveLength(64);  // SHA-256 hex
    }

    [Fact]
    public void ComputeSchemaVersionHash_DeterministicAcrossInvocations()
    {
        var v = new PacsSchemaVersion(
            PacsRelease: "Harris PACS 9.0",
            SourceFileHashes: new Dictionary<string, string> { ["a"] = "1", ["b"] = "2" },
            IngestedAt: new DateTime(2026, 4, 30, 12, 0, 0, DateTimeKind.Utc),
            ConversionManifestHash: "no-conversion-manifest-supplied");

        var h1 = PacsCatalogIdentity.ComputeSchemaVersionHash(v);
        var h2 = PacsCatalogIdentity.ComputeSchemaVersionHash(v);

        h1.Should().Be(h2);
        h1.Should().HaveLength(64);
        h1.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public void ComputeSchemaVersionHash_DifferentInputsProduceDifferentHashes()
    {
        var v1 = new PacsSchemaVersion("X", new Dictionary<string, string> { ["a"] = "1" },
            new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), "conv-A");
        var v2 = new PacsSchemaVersion("X", new Dictionary<string, string> { ["a"] = "2" },
            new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), "conv-A");

        PacsCatalogIdentity.ComputeSchemaVersionHash(v1)
            .Should().NotBe(PacsCatalogIdentity.ComputeSchemaVersionHash(v2));
    }

    [Fact]
    public async Task Identities_PopulatesFromBuiltCatalogs()
    {
        var entries = new List<PacsCatalogSetEntry>
        {
            new("WA-Benton", "benton-prod", Source("benton_table", "v1")),
            new("WA-Yakima", "yakima-prod", Source("yakima_table", "v2")),
        };

        var set = await PacsSchemaCatalogSet.BuildAsync(entries, CancellationToken.None);

        set.Identities.Should().HaveCount(2);
        set.Identities.Select(i => i.CountyId).Should().BeEquivalentTo(new[] { "WA-Benton", "WA-Yakima" });
        set.Identities.Should().AllSatisfy(i =>
            i.SchemaVersionHash.Should().HaveLength(64));
    }
}
