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
/// Slice C48-B unit tests for <see cref="PacsSchemaCatalog"/>. Each
/// hard guard from <c>docs/sync/pacs-schema-catalog-as-code-policy.md</c>
/// has at least one fact below; lookup hits / misses, conversion-era
/// branching, and provenance enforcement round out the coverage.
/// </summary>
public sealed class PacsSchemaCatalogTests
{
    [Fact]
    public async Task BuildAsync_HappyPath_ProducesExpectedCoverage()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var source = new InMemoryPacsSchemaSource(data);

        var catalog = await PacsSchemaCatalog.BuildAsync(source, CancellationToken.None);

        catalog.Coverage.TableCount.Should().Be(3);
        catalog.Coverage.ColumnCount.Should().Be(9);
        catalog.Coverage.DictionaryCount.Should().Be(1);
        catalog.Version.PacsRelease.Should().Be("PACS-9.0.4-fixture");
    }

    [Fact]
    public async Task BuildAsync_NullSource_ThrowsArgumentNullException()
    {
        var act = async () => await PacsSchemaCatalog.BuildAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    // ============================================================================
    // HG1 — PII-free.  The catalog stores schema metadata only; no parcel rows.
    // The catalog records carry a PiiClassification metadata flag but never the
    // underlying PII data itself.
    // ============================================================================

    [Fact]
    public async Task HG1_CatalogRecordsCarryPiiMetadataFlagButNoActualPiiData()
    {
        var catalog = await BuildFixtureCatalog();

        // The grantor_cv column is classified as Direct PII — the
        // *classification* is metadata; the column data itself is never in the catalog.
        var grantor = catalog.TryGetColumn("chg_of_owner", "grantor_cv");
        grantor.HasValue.Should().BeTrue();
        grantor.Value!.PiiClassification.Should().Be(PiiClassification.Direct);

        // Spot-check that the record has no field that would leak PII.
        // PacsColumn carries: TableName, ColumnName, DeclaredType, Nullable,
        // ConversionEra, DictionaryRef, PiiClassification, ProvenanceLine, Notes.
        // None of these hold parcel-row PII; this is structurally enforced by the type.
        typeof(PacsColumn).GetProperties()
            .Select(p => p.Name)
            .Should()
            .NotContain(new[] { "Value", "RowData", "ParcelData", "OwnerName" });
    }

    // ============================================================================
    // HG2 — County-agnostic.  The catalog records have NO CountyId field.
    // ============================================================================

    [Fact]
    public void HG2_CatalogRecordTypesHaveNoCountyIdField()
    {
        typeof(PacsTable).GetProperties().Select(p => p.Name).Should().NotContain("CountyId");
        typeof(PacsColumn).GetProperties().Select(p => p.Name).Should().NotContain("CountyId");
        typeof(PacsDictionary).GetProperties().Select(p => p.Name).Should().NotContain("CountyId");
        typeof(PacsSchemaVersion).GetProperties().Select(p => p.Name).Should().NotContain("CountyId");
    }

    // ============================================================================
    // HG3 — Read-only at runtime.  The catalog has no public mutation methods,
    // and exposed collections are IReadOnly...
    // ============================================================================

    [Fact]
    public async Task HG3_CatalogHasNoMutationMethodsAndExposesReadOnlyCollections()
    {
        var catalog = await BuildFixtureCatalog();

        // The interface surface contains no Add/Remove/Set/Clear/Mutate/Update methods.
        var mutationVerbs = new[] { "Add", "Remove", "Set", "Clear", "Mutate", "Update", "Insert", "Delete" };
        var methodNames = typeof(IPacsSchemaCatalog).GetMethods().Select(m => m.Name);
        foreach (var verb in mutationVerbs)
        {
            methodNames.Should().NotContain(n => n.StartsWith(verb, StringComparison.Ordinal),
                $"interface MUST NOT expose any method starting with '{verb}' (HG3).");
        }

        // Exposed collections are IReadOnlyCollection<T>.
        catalog.Tables.Should().BeAssignableTo<IReadOnlyCollection<PacsTable>>();
        catalog.Columns.Should().BeAssignableTo<IReadOnlyCollection<PacsColumn>>();
        catalog.Dictionaries.Should().BeAssignableTo<IReadOnlyCollection<PacsDictionary>>();
    }

    // ============================================================================
    // HG4 — Versioned.  The catalog exposes a stable Version stamp uniquely
    // identifying the materialized catalog.
    // ============================================================================

    [Fact]
    public async Task HG4_CatalogVersionIsStableAcrossCalls()
    {
        var catalog = await BuildFixtureCatalog();

        var v1 = catalog.Version;
        var v2 = catalog.Version;

        v1.Should().BeSameAs(v2);
        v1.SourceFileHashes.Should().NotBeEmpty();
        v1.ConversionManifestHash.Should().NotBeNullOrWhiteSpace();
    }

    // ============================================================================
    // HG5 — Conversion-aware.  Every column carries a ConversionEra; readers
    // declaring RequireEra get typed mismatch results, never silent partial reads.
    // ============================================================================

    [Fact]
    public async Task HG5_TryGetColumnForEra_PostFixtureRequiringPre_ReturnsMismatch()
    {
        var catalog = await BuildFixtureCatalog();

        var result = catalog.TryGetColumnForEra("imprv", "imprv_status_cd", PacsConversionEra.Pre2017);

        result.HasValue.Should().BeFalse();
        result.Reason.Should().Be(PacsSchemaLookupResult<PacsColumn>.ReasonConversionEraMismatch);
    }

    [Fact]
    public async Task HG5_TryGetColumnForEra_BothColumnSatisfiesAnyEra()
    {
        var catalog = await BuildFixtureCatalog();

        var pre = catalog.TryGetColumnForEra("sale", "sl_ratio_type_cd", PacsConversionEra.Pre2017);
        var post = catalog.TryGetColumnForEra("sale", "sl_ratio_type_cd", PacsConversionEra.Post2017);

        pre.HasValue.Should().BeTrue();
        post.HasValue.Should().BeTrue();
        pre.Value!.ConversionEra.Should().Be(PacsConversionEra.Both);
    }

    [Fact]
    public async Task HG5_TryGetColumnForEra_UnknownColumnSurfacesAmbiguous()
    {
        var catalog = await BuildFixtureCatalog();

        var result = catalog.TryGetColumnForEra("imprv", "ambiguous_legacy_flag", PacsConversionEra.Post2017);

        result.HasValue.Should().BeFalse();
        result.Reason.Should().Be(PacsSchemaLookupResult<PacsColumn>.ReasonAmbiguousConversionEra);
    }

    // ============================================================================
    // HG6 — Source-traceable.  Build refuses to construct a catalog with any
    // record missing provenance.
    // ============================================================================

    [Fact]
    public async Task HG6_BuildRefusesTableMissingProvenance()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var corrupted = new PacsSchemaSourceData(
            data.Tables.Select(t => t.TableName == "imprv"
                ? t with { ProvenancePath = "" }
                : t).ToList(),
            data.Columns,
            data.Dictionaries,
            data.Version);

        var act = async () => await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(corrupted), CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*ProvenancePath*HG6*");
    }

    [Fact]
    public async Task HG6_BuildRefusesColumnMissingProvenance()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var corrupted = new PacsSchemaSourceData(
            data.Tables,
            data.Columns.Select(c => c.ColumnName == "wac_cd"
                ? c with { ProvenanceLine = "   " }
                : c).ToList(),
            data.Dictionaries,
            data.Version);

        var act = async () => await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(corrupted), CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*ProvenanceLine*HG6*");
    }

    [Fact]
    public async Task HG6_BuildRefusesDictionaryMissingProvenance()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var corrupted = new PacsSchemaSourceData(
            data.Tables,
            data.Columns,
            data.Dictionaries.Select(d => d with { ProvenancePath = "" }).ToList(),
            data.Version);

        var act = async () => await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(corrupted), CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*ProvenancePath*HG6*");
    }

    // ============================================================================
    // HG7 — Failure surfaces explicitly.  Lookups for missing entities return a
    // typed not-found result, never null.
    // ============================================================================

    [Fact]
    public async Task HG7_TryGetTable_UnknownReturnsNotFound()
    {
        var catalog = await BuildFixtureCatalog();

        var result = catalog.TryGetTable("does_not_exist");

        result.HasValue.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Reason.Should().Be(PacsSchemaLookupResult<PacsTable>.ReasonNotFound);
    }

    [Fact]
    public async Task HG7_TryGetColumn_UnknownReturnsNotFound()
    {
        var catalog = await BuildFixtureCatalog();

        var result = catalog.TryGetColumn("sale", "unknown_column");

        result.HasValue.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Reason.Should().Be(PacsSchemaLookupResult<PacsColumn>.ReasonNotFound);
    }

    [Fact]
    public async Task HG7_TryGetDictionary_UnknownReturnsNotFound()
    {
        var catalog = await BuildFixtureCatalog();

        var result = catalog.TryGetDictionary("not_a_dictionary");

        result.HasValue.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Reason.Should().Be(PacsSchemaLookupResult<PacsDictionary>.ReasonNotFound);
    }

    [Fact]
    public async Task HG7_NullOrEmptyArguments_ReturnNotFoundNeverThrow()
    {
        var catalog = await BuildFixtureCatalog();

        catalog.TryGetTable("").HasValue.Should().BeFalse();
        catalog.TryGetTable(null!).HasValue.Should().BeFalse();
        catalog.TryGetColumn("", "x").HasValue.Should().BeFalse();
        catalog.TryGetColumn("x", "").HasValue.Should().BeFalse();
        catalog.TryGetDictionary("").HasValue.Should().BeFalse();
    }

    // ============================================================================
    // Internal integrity — dangling column references must be rejected.
    // ============================================================================

    [Fact]
    public async Task BuildAsync_RejectsColumnReferencingUndeclaredTable()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var corrupted = new PacsSchemaSourceData(
            data.Tables,
            data.Columns.Append(new PacsColumn(
                TableName: "ghost_table",
                ColumnName: "ghost_column",
                DeclaredType: "int",
                Nullable: true,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: "fixture://ghost",
                Notes: "")).ToList(),
            data.Dictionaries,
            data.Version);

        var act = async () => await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(corrupted), CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*ghost_table*ghost_column*dangling column references*");
    }

    [Fact]
    public async Task BuildAsync_RejectsDuplicateTableNames()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var corrupted = new PacsSchemaSourceData(
            data.Tables.Append(data.Tables[0]).ToList(),  // dup the first table
            data.Columns,
            data.Dictionaries,
            data.Version);

        var act = async () => await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(corrupted), CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*Duplicate table names*");
    }

    // ============================================================================
    // Provenance round-trip — found records preserve provenance verbatim.
    // ============================================================================

    [Fact]
    public async Task Provenance_TableLookupReturnsExactProvenancePathFromSource()
    {
        var catalog = await BuildFixtureCatalog();

        var sale = catalog.TryGetTable("sale");

        sale.HasValue.Should().BeTrue();
        sale.Value!.ProvenancePath.Should().Be(PacsSchemaCatalogTestFixture.SchemaVersionFixturePath + "#sale");
    }

    [Fact]
    public async Task Provenance_ColumnLookupReturnsExactProvenanceLineFromSource()
    {
        var catalog = await BuildFixtureCatalog();

        var col = catalog.TryGetColumn("imprv", "imprv_state_cd");

        col.HasValue.Should().BeTrue();
        col.Value!.ProvenanceLine.Should().Be(PacsSchemaCatalogTestFixture.SchemaVersionFixturePath + "#imprv.imprv_state_cd");
    }

    // ============================================================================
    // Lookup-hit basic cases — simple successful retrieval.
    // ============================================================================

    [Fact]
    public async Task TryGetTable_KnownTable_ReturnsFound()
    {
        var catalog = await BuildFixtureCatalog();

        var result = catalog.TryGetTable("chg_of_owner");

        result.HasValue.Should().BeTrue();
        result.Value!.TableName.Should().Be("chg_of_owner");
        result.Value.IdentityTuple.Should().ContainSingle().Which.Should().Be("chg_of_owner_id");
    }

    [Fact]
    public async Task TryGetColumn_KnownDictionaryColumn_PreservesDictionaryRef()
    {
        var catalog = await BuildFixtureCatalog();

        var col = catalog.TryGetColumn("sale", "sl_ratio_type_cd");

        col.HasValue.Should().BeTrue();
        col.Value!.DictionaryRef.Should().NotBeNull();
        col.Value.DictionaryRef!.DictionaryTable.Should().Be("sl_ratio_type_cd_lookup");
    }

    [Fact]
    public async Task TryGetDictionary_KnownDictionary_PreservesDomainSize()
    {
        var catalog = await BuildFixtureCatalog();

        var dict = catalog.TryGetDictionary("sl_ratio_type_cd_lookup");

        dict.HasValue.Should().BeTrue();
        dict.Value!.ValueDomainSize.Should().Be(12);
    }

    // ============================================================================
    // Helper.
    // ============================================================================

    private static async Task<IPacsSchemaCatalog> BuildFixtureCatalog()
    {
        var data = PacsSchemaCatalogTestFixture.BuildRepresentative();
        var source = new InMemoryPacsSchemaSource(data);
        return await PacsSchemaCatalog.BuildAsync(source, CancellationToken.None);
    }
}
