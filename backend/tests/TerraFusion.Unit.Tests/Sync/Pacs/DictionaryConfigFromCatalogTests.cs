using System;
using System.Collections.Generic;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Pacs;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Pacs;

/// <summary>
/// Slice C48-G unit tests for
/// <see cref="DictionaryConfigFromCatalog.Build"/>. Covers happy
/// path, missing-dictionary failure, argument validation, and the
/// pivotal equivalence test that proves the catalog-driven config
/// produces a record bit-for-bit identical to the existing
/// <c>SyncAtlas/Program.cs</c> hardcoded <c>property_use</c> case.
/// </summary>
public sealed class DictionaryConfigFromCatalogTests
{
    [Fact]
    public async Task Build_HappyPath_ReturnsCatalogDrivenTargetAndColumns()
    {
        var catalog = await BuildCatalogWithDictionary(
            dictionaryName: "imprv_det_class",
            keyColumn: "imprv_det_class_cd",
            descriptionColumn: "imprv_det_cls_desc");

        var workbookSource = new DictionaryWorkbookSource("dbo", "imprv_detail", "imprv_det_class_cd");

        var result = DictionaryConfigFromCatalog.Build(
            catalog: catalog,
            dictionaryName: "imprv_det_class",
            workbookSource: workbookSource,
            canonicalTargetName: "ImprvDetailClass",
            activeFlag: new DictionaryActiveFlag("sys_flag", "sys_flag <> 'I'"));

        result.Target.PacsDictionaryTable.Should().Be("imprv_det_class");
        result.Target.WorkbookSourceTable.Should().Be("imprv_detail");
        result.Target.CanonicalTargetName.Should().Be("ImprvDetailClass");

        result.Columns.CodeColumn.Should().Be("imprv_det_class_cd");
        result.Columns.DescriptionColumn.Should().Be("imprv_det_cls_desc");
        result.Columns.ActiveFlagColumn.Should().Be("sys_flag");
        result.Columns.ActiveFlagPredicate.Should().Be("sys_flag <> 'I'");
        result.Columns.YearColumn.Should().BeNull();
    }

    /// <summary>
    /// Slice C48-G pivotal equivalence test: the helper produces the
    /// same configs that <c>SyncAtlas/Program.cs</c> hand-types for
    /// <c>"property_use"</c>. If this test passes, the SyncAtlas case
    /// CAN be migrated to the helper without behavior change.
    /// </summary>
    [Fact]
    public async Task Build_PropertyUse_EquivalentToSyncAtlasHardcodedConfig()
    {
        // Build a catalog containing the property_use dictionary with
        // the shape live PACS introspection actually produces (verified
        // by C48-E live smoke).
        var catalog = await BuildCatalogWithDictionary(
            dictionaryName: "property_use",
            keyColumn: "property_use_cd",
            descriptionColumn: "property_use_desc");

        // Hand-typed inputs matching the existing SyncAtlas config:
        //   "property_use" =>
        //     new DictionaryLoaderTargetConfig(
        //       WorkbookSourceSchema: "dbo",
        //       WorkbookSourceTable:  "property_val",
        //       WorkbookSourceColumn: "property_use_cd",
        //       PacsDictionarySchema: "dbo",
        //       PacsDictionaryTable:  "property_use",
        //       CanonicalTargetName:  "PropertyUse"),
        //     new DictionaryColumnConfig(
        //       CodeColumn:           "property_use_cd",
        //       DescriptionColumn:    "property_use_desc",
        //       ActiveFlagColumn:     null,
        //       ActiveFlagPredicate:  null,
        //       YearColumn:           null)
        var workbookSource = new DictionaryWorkbookSource("dbo", "property_val", "property_use_cd");

        var result = DictionaryConfigFromCatalog.Build(
            catalog: catalog,
            dictionaryName: "property_use",
            workbookSource: workbookSource,
            canonicalTargetName: "PropertyUse",
            activeFlag: null,
            yearColumn: null);

        // Build the hand-typed expectations.
        var expectedTarget = new DictionaryLoaderTargetConfig(
            WorkbookSourceSchema: "dbo",
            WorkbookSourceTable:  "property_val",
            WorkbookSourceColumn: "property_use_cd",
            PacsDictionarySchema: "dbo",
            PacsDictionaryTable:  "property_use",
            CanonicalTargetName:  "PropertyUse");

        var expectedColumns = new DictionaryColumnConfig(
            CodeColumn:          "property_use_cd",
            DescriptionColumn:   "property_use_desc",
            ActiveFlagColumn:    null,
            ActiveFlagPredicate: null,
            YearColumn:          null);

        // Records: value-equality. If these match, SyncAtlas's
        // hardcoded property_use case can be replaced with this
        // helper call and downstream behavior is unchanged.
        result.Target.Should().Be(expectedTarget);
        result.Columns.Should().Be(expectedColumns);
    }

    [Fact]
    public async Task Build_MissingDictionary_ThrowsInvalidOperationWithCatalogReason()
    {
        var catalog = await BuildCatalogWithDictionary(
            dictionaryName: "imprv_det_class",
            keyColumn: "imprv_det_class_cd",
            descriptionColumn: "imprv_det_cls_desc");

        var workbookSource = new DictionaryWorkbookSource("dbo", "imprv_detail", "imprv_det_class_cd");

        var act = () => DictionaryConfigFromCatalog.Build(
            catalog: catalog,
            dictionaryName: "does_not_exist",
            workbookSource: workbookSource,
            canonicalTargetName: "Imaginary");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*does_not_exist*not-found*");
    }

    [Fact]
    public async Task Build_NullCatalog_Throws()
    {
        var workbookSource = new DictionaryWorkbookSource("dbo", "x", "y");
        var act = () => DictionaryConfigFromCatalog.Build(
            catalog: null!,
            dictionaryName: "x",
            workbookSource: workbookSource,
            canonicalTargetName: "X");
        act.Should().Throw<ArgumentNullException>();
        await Task.CompletedTask;
    }

    [Fact]
    public async Task Build_NullWorkbookSource_Throws()
    {
        var catalog = await BuildCatalogWithDictionary("x", "x_cd", "x_desc");
        var act = () => DictionaryConfigFromCatalog.Build(
            catalog: catalog,
            dictionaryName: "x",
            workbookSource: null!,
            canonicalTargetName: "X");
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task Build_EmptyDictionaryName_Throws()
    {
        var catalog = await BuildCatalogWithDictionary("x", "x_cd", "x_desc");
        var workbookSource = new DictionaryWorkbookSource("dbo", "x", "y");
        var act = () => DictionaryConfigFromCatalog.Build(
            catalog: catalog,
            dictionaryName: "",
            workbookSource: workbookSource,
            canonicalTargetName: "X");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public async Task Build_EmptyCanonicalTargetName_Throws()
    {
        var catalog = await BuildCatalogWithDictionary("x", "x_cd", "x_desc");
        var workbookSource = new DictionaryWorkbookSource("dbo", "x", "y");
        var act = () => DictionaryConfigFromCatalog.Build(
            catalog: catalog,
            dictionaryName: "x",
            workbookSource: workbookSource,
            canonicalTargetName: "");
        act.Should().Throw<ArgumentException>();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private static async Task<IPacsSchemaCatalog> BuildCatalogWithDictionary(
        string dictionaryName,
        string keyColumn,
        string descriptionColumn)
    {
        var tables = new List<PacsTable>
        {
            new(
                TableName: dictionaryName,
                IdentityTuple: new[] { keyColumn },
                ConversionEra: PacsConversionEra.Both,
                DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
                PiiClassification: PiiClassification.None,
                ProvenancePath: $"fixture://{dictionaryName}"),
        };
        var columns = new List<PacsColumn>
        {
            new(
                TableName: dictionaryName,
                ColumnName: keyColumn,
                DeclaredType: "varchar",
                Nullable: false,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: $"fixture://{dictionaryName}.{keyColumn}",
                Notes: ""),
            new(
                TableName: dictionaryName,
                ColumnName: descriptionColumn,
                DeclaredType: "varchar",
                Nullable: true,
                ConversionEra: PacsConversionEra.Both,
                DictionaryRef: null,
                PiiClassification: PiiClassification.None,
                ProvenanceLine: $"fixture://{dictionaryName}.{descriptionColumn}",
                Notes: ""),
        };
        var dictionaries = new List<PacsDictionary>
        {
            new(
                DictionaryName: dictionaryName,
                KeyColumn: keyColumn,
                DescriptionColumn: descriptionColumn,
                ValueDomainSize: null,
                ConversionEra: PacsConversionEra.Both,
                ProvenancePath: $"fixture://{dictionaryName}"),
        };
        var version = new PacsSchemaVersion(
            PacsRelease: "fixture",
            SourceFileHashes: new Dictionary<string, string> { ["fixture"] = "0" },
            IngestedAt: DateTime.UtcNow,
            ConversionManifestHash: "fixture-no-manifest");

        var data = new PacsSchemaSourceData(tables, columns, dictionaries, version);
        var source = new InMemoryPacsSchemaSource(data);
        return await PacsSchemaCatalog.BuildAsync(source, CancellationToken.None);
    }
}
