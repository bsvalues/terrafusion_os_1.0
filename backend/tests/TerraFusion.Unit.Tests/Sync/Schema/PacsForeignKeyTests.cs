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
/// Slice C49-FK-B unit tests for the foreign-key edge surface of
/// <see cref="LivePacsSchemaSource"/> + <see cref="PacsSchemaCatalog"/>.
/// Covers the seven binding test cases enumerated in
/// <c>docs/sync/pacs-schema-foreign-key-inference-policy.md</c>:
/// declared FK read, composite shape, dangling-table refusal,
/// dangling-column refusal, provenance, confidence, and the
/// non-mutation guarantee. Plus inference + catalog API tests
/// covering the InferredByName heuristic and the
/// declared-vs-all lookup split.
/// </summary>
public sealed class PacsForeignKeyTests
{
    private static LivePacsSchemaSourceOptions DefaultOptions =>
        LivePacsSchemaSourceOptions.ForBentonHarrisPacs("test-fixture");

    // ────────────────────────────────────────────────────────────────────────
    // Binding tests 1-2: declared FK + composite shape
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKB_DeclaredEdge_IsReadFromIntrospection()
    {
        var fake = SaleChgOfOwnerFakeWithDeclaredFk(
            constraintName: "fk_sale_chg_of_owner",
            ordinalPosition: 1);

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        var sale = data.Tables.Single(t => t.TableName == "sale");
        sale.ForeignKeys.Should().ContainSingle();

        var fk = sale.ForeignKeys[0];
        fk.ConstraintName.Should().Be("fk_sale_chg_of_owner");
        fk.SourceTable.Should().Be("sale");
        fk.SourceColumns.Should().BeEquivalentTo(new[] { "chg_of_owner_id" });
        fk.TargetTable.Should().Be("chg_of_owner");
        fk.TargetColumns.Should().BeEquivalentTo(new[] { "chg_of_owner_id" });
        fk.Confidence.Should().Be(PacsForeignKeyConfidence.Declared);
        fk.ProvenanceSource.Should().Be(PacsForeignKeySource.InformationSchema);
    }

    [Fact]
    public async Task C49FKB_CompositeFk_PreservesOrdinalStableColumnPairs()
    {
        // Composite FK: two-column edge from imprv (prop_id, imprv_id) →
        // imprv_master (prop_id, imprv_id). Verify ordinal positions
        // map source columns to target columns correctly.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("imprv"),
            new IntrospectedTable("imprv_master"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv",        "prop_id",  "int", false, 1),
            new IntrospectedColumn("imprv",        "imprv_id", "int", false, 2),
            new IntrospectedColumn("imprv_master", "prop_id",  "int", false, 1),
            new IntrospectedColumn("imprv_master", "imprv_id", "int", false, 2),
        });
        // Add rows in NON-ordinal order to ensure the implementation reorders them.
        fake.ForeignKeys.AddRange(new[]
        {
            new IntrospectedForeignKeyMember("fk_imprv_master", "imprv", "imprv_id", "imprv_master", "imprv_id", 2),
            new IntrospectedForeignKeyMember("fk_imprv_master", "imprv", "prop_id",  "imprv_master", "prop_id",  1),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        var imprv = data.Tables.Single(t => t.TableName == "imprv");
        var fk = imprv.ForeignKeys.Single();
        fk.SourceColumns.Should().Equal("prop_id", "imprv_id");
        fk.TargetColumns.Should().Equal("prop_id", "imprv_id");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Binding tests 3-4: dangling-table + dangling-column refusal
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKB_DanglingSourceTable_IsRefusedAtCatalogConstruction()
    {
        // Build introspection with an FK whose SourceTable is a ghost.
        // The fake introspector returns the FK but the catalog should
        // refuse to build because it can't be attached to any
        // declared PacsTable.
        var fake = SaleChgOfOwnerFakeWithDeclaredFk("fk_ok", 1);
        // Ghost source-table FK: tables list does NOT contain
        // "ghost_table" so the FK becomes orphaned.
        fake.ForeignKeys.Add(new IntrospectedForeignKeyMember(
            "fk_ghost", "ghost_table", "ghost_col", "chg_of_owner", "chg_of_owner_id", 1));

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);

        // The live source filters/groups FKs by SourceTable, so the
        // ghost FK simply doesn't get attached to any PacsTable. The
        // catalog itself is the integrity gate for FKs that DO get
        // attached. Here we test the catalog path: simulate a corrupted
        // source that emits a PacsTable carrying a dangling FK.
        var data = await sut.ReadAsync(CancellationToken.None);
        var corrupted = AttachOrphanFkToFirstTable(data, "fk_dangling_target", targetTable: "ghost_target");

        var act = async () => await PacsSchemaCatalog.BuildAsync(
            new InMemoryPacsSchemaSource(corrupted), CancellationToken.None);

        // C53-CONS-C: the catalog still refuses to build with a
        // dangling FK target; the message is now the engine's FK-002
        // wrapped in the unified report exception.
        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*FK-002*ghost_target*");
    }

    [Fact]
    public async Task C49FKB_DanglingSourceColumn_IsRefusedAtCatalogConstruction()
    {
        var fake = SaleChgOfOwnerFakeWithDeclaredFk("fk_ok", 1);
        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        // Corrupt: replace the existing FK's source column with a
        // column name that isn't declared on the source table.
        var corrupted = ReplaceFkSourceColumn(
            data, ghostColumnName: "ghost_col_does_not_exist");

        var act = async () => await PacsSchemaCatalog.BuildAsync(
            new InMemoryPacsSchemaSource(corrupted), CancellationToken.None);

        // C53-CONS-C: dangling-column refusal now via engine FK-003.
        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*FK-003*ghost_col_does_not_exist*");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Binding tests 5-6: provenance + confidence
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKB_EveryFk_HasNonEmptyProvenancePath()
    {
        var fake = SaleChgOfOwnerFakeWithDeclaredFk("fk_sale_chg_of_owner", 1);
        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        foreach (var t in data.Tables)
        {
            foreach (var fk in t.ForeignKeys)
            {
                fk.ProvenancePath.Should().NotBeNullOrWhiteSpace();
            }
        }
    }

    [Fact]
    public async Task C49FKB_EveryFk_HasExplicitConfidence()
    {
        var fake = SaleChgOfOwnerFakeWithDeclaredFk("fk_sale_chg_of_owner", 1);
        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        foreach (var t in data.Tables)
        {
            foreach (var fk in t.ForeignKeys)
            {
                Enum.IsDefined(typeof(PacsForeignKeyConfidence), fk.Confidence).Should().BeTrue();
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Binding test 7: FK pass does not mutate Table/Column/Dictionary records
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKB_FkPass_DoesNotMutateColumnsOrDictionaries()
    {
        var fake = SaleChgOfOwnerFakeWithDeclaredFk("fk_sale_chg_of_owner", 1);
        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        // Columns should match introspection 1:1 in name + type.
        data.Columns.Should().HaveCount(fake.Columns.Count);
        foreach (var introspected in fake.Columns)
        {
            var translated = data.Columns.Single(c =>
                c.TableName == introspected.TableName &&
                c.ColumnName == introspected.ColumnName);
            translated.DeclaredType.Should().Be(introspected.DataType);
            translated.Nullable.Should().Be(introspected.Nullable);
        }
        // Dictionaries unaffected by the FK pass (no dictionary in this fixture).
        data.Dictionaries.Should().BeEmpty();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Inference tests: InferredByName + declared precedence
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKB_InferredFk_BindsCdColumnToDictionary()
    {
        // sale.sl_ratio_type_cd column on a non-dictionary table should
        // be inferred to point at the sl_ratio_type_cd_lookup
        // dictionary (whose KeyColumn IS sl_ratio_type_cd).
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("sale"),
            new IntrospectedTable("sl_ratio_type_cd_lookup"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("sale",                    "chg_of_owner_id",   "int",     false, 1),
            new IntrospectedColumn("sale",                    "sl_ratio_type_cd",  "varchar", true,  2),
            new IntrospectedColumn("sl_ratio_type_cd_lookup", "sl_ratio_type_cd",  "varchar", false, 1),
            new IntrospectedColumn("sl_ratio_type_cd_lookup", "sl_ratio_type_desc","varchar", true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        var sale = data.Tables.Single(t => t.TableName == "sale");
        sale.ForeignKeys.Should().ContainSingle();
        var fk = sale.ForeignKeys[0];
        fk.Confidence.Should().Be(PacsForeignKeyConfidence.InferredByName);
        fk.ProvenanceSource.Should().Be(PacsForeignKeySource.Heuristic);
        fk.ConstraintName.Should().BeNull();
        fk.SourceColumns.Should().BeEquivalentTo(new[] { "sl_ratio_type_cd" });
        fk.TargetTable.Should().Be("sl_ratio_type_cd_lookup");
    }

    [Fact]
    public async Task C49FKB_DeclaredEdge_TakesPrecedenceOverInferredByName()
    {
        // Same shape as InferredFk_BindsCdColumnToDictionary, but ALSO
        // include a DECLARED FK for the same (sale, sl_ratio_type_cd)
        // pair. The declared edge should be the only one returned;
        // the inference pass must suppress the duplicate.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("sale"),
            new IntrospectedTable("sl_ratio_type_cd_lookup"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("sale",                    "sl_ratio_type_cd",  "varchar", true,  1),
            new IntrospectedColumn("sl_ratio_type_cd_lookup", "sl_ratio_type_cd",  "varchar", false, 1),
            new IntrospectedColumn("sl_ratio_type_cd_lookup", "sl_ratio_type_desc","varchar", true,  2),
        });
        fake.ForeignKeys.Add(new IntrospectedForeignKeyMember(
            "fk_sale_ratio_type", "sale", "sl_ratio_type_cd",
            "sl_ratio_type_cd_lookup", "sl_ratio_type_cd", 1));

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        var sale = data.Tables.Single(t => t.TableName == "sale");
        sale.ForeignKeys.Should().ContainSingle();
        sale.ForeignKeys[0].Confidence.Should().Be(PacsForeignKeyConfidence.Declared);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Catalog API tests: TryGetDeclaredForeignKeysFor vs TryGetAllForeignKeysFor
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKB_TryGetDeclared_ExcludesInferredEdges()
    {
        var catalog = await BuildCatalogWithMixedFks();

        var declared = catalog.TryGetDeclaredForeignKeysFor("sale");

        declared.HasValue.Should().BeTrue();
        declared.Value!.Should().OnlyContain(fk =>
            fk.Confidence == PacsForeignKeyConfidence.Declared ||
            fk.Confidence == PacsForeignKeyConfidence.Exported);
    }

    [Fact]
    public async Task C49FKB_TryGetAll_IncludesInferredEdges()
    {
        var catalog = await BuildCatalogWithMixedFks();

        var all = catalog.TryGetAllForeignKeysFor("sale");

        all.HasValue.Should().BeTrue();
        all.Value!.Should().Contain(fk => fk.Confidence == PacsForeignKeyConfidence.InferredByName);
    }

    [Fact]
    public async Task C49FKB_TryGetForeignKeysForUnknownTable_ReturnsNotFound()
    {
        var catalog = await BuildCatalogWithMixedFks();

        var declared = catalog.TryGetDeclaredForeignKeysFor("does_not_exist");
        var all      = catalog.TryGetAllForeignKeysFor("does_not_exist");

        declared.HasValue.Should().BeFalse();
        declared.Reason.Should().Be(PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.ReasonNotFound);
        all.HasValue.Should().BeFalse();
        all.Reason.Should().Be(PacsSchemaLookupResult<IReadOnlyList<PacsForeignKey>>.ReasonNotFound);
    }

    [Fact]
    public async Task C49FKB_TableWithNoFks_ReturnsEmptyList()
    {
        var fake = SaleChgOfOwnerFakeWithDeclaredFk("fk_sale_chg_of_owner", 1);
        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var source = new InMemoryPacsSchemaSource(await sut.ReadAsync(CancellationToken.None));
        var catalog = await PacsSchemaCatalog.BuildAsync(source, CancellationToken.None);

        // chg_of_owner is the TARGET of the FK, not the source.
        // Therefore it has no outgoing FKs from its perspective.
        var declared = catalog.TryGetDeclaredForeignKeysFor("chg_of_owner");

        declared.HasValue.Should().BeTrue();
        declared.Value!.Should().BeEmpty();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private static FakePacsSchemaIntrospector SaleChgOfOwnerFakeWithDeclaredFk(
        string constraintName, int ordinalPosition)
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("chg_of_owner"),
            new IntrospectedTable("sale"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("chg_of_owner", "chg_of_owner_id", "int", false, 1),
            new IntrospectedColumn("sale",         "chg_of_owner_id", "int", false, 1),
            new IntrospectedColumn("sale",         "sl_price",        "numeric", true, 2),
        });
        fake.PrimaryKeys.AddRange(new[]
        {
            new IntrospectedPrimaryKeyMember("chg_of_owner", "chg_of_owner_id", 1),
            new IntrospectedPrimaryKeyMember("sale",         "chg_of_owner_id", 1),
        });
        fake.ForeignKeys.Add(new IntrospectedForeignKeyMember(
            constraintName,
            "sale",         "chg_of_owner_id",
            "chg_of_owner", "chg_of_owner_id",
            ordinalPosition));
        return fake;
    }

    private static PacsSchemaSourceData AttachOrphanFkToFirstTable(
        PacsSchemaSourceData data, string fkName, string targetTable)
    {
        // Replace the first table's ForeignKeys with one pointing at a
        // non-existent target table, simulating a corrupted source.
        var firstTable = data.Tables[0];
        var orphanFk = new PacsForeignKey(
            ConstraintName:    fkName,
            SourceTable:       firstTable.TableName,
            SourceColumns:     new[] { "chg_of_owner_id" },
            TargetTable:       targetTable,
            TargetColumns:     new[] { "id" },
            ProvenanceSource:  PacsForeignKeySource.InformationSchema,
            ProvenancePath:    "fixture://orphan-fk",
            Confidence:        PacsForeignKeyConfidence.Declared,
            ConversionEra:     PacsConversionEra.Both);
        var newTables = data.Tables
            .Select((t, i) => i == 0 ? t with { ForeignKeys = new[] { orphanFk } } : t)
            .ToList();
        return new PacsSchemaSourceData(newTables, data.Columns, data.Dictionaries, data.Version);
    }

    private static PacsSchemaSourceData ReplaceFkSourceColumn(
        PacsSchemaSourceData data, string ghostColumnName)
    {
        // Find the table whose ForeignKeys is non-empty and replace
        // the first FK's SourceColumns with a ghost column name.
        var newTables = data.Tables.Select(t =>
        {
            if (t.ForeignKeys.Count == 0) return t;
            var fk = t.ForeignKeys[0] with { SourceColumns = new[] { ghostColumnName } };
            return t with { ForeignKeys = new[] { fk } };
        }).ToList();
        return new PacsSchemaSourceData(newTables, data.Columns, data.Dictionaries, data.Version);
    }

    private static async Task<IPacsSchemaCatalog> BuildCatalogWithMixedFks()
    {
        // Build a catalog containing:
        //   - 1 declared FK (sale.chg_of_owner_id → chg_of_owner.chg_of_owner_id)
        //   - 1 inferred FK (sale.sl_ratio_type_cd → sl_ratio_type_cd_lookup
        //                    via dictionary inference)
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("chg_of_owner"),
            new IntrospectedTable("sale"),
            new IntrospectedTable("sl_ratio_type_cd_lookup"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("chg_of_owner",            "chg_of_owner_id",   "int",     false, 1),
            new IntrospectedColumn("sale",                    "chg_of_owner_id",   "int",     false, 1),
            new IntrospectedColumn("sale",                    "sl_ratio_type_cd",  "varchar", true,  2),
            new IntrospectedColumn("sl_ratio_type_cd_lookup", "sl_ratio_type_cd",  "varchar", false, 1),
            new IntrospectedColumn("sl_ratio_type_cd_lookup", "sl_ratio_type_desc","varchar", true,  2),
        });
        fake.ForeignKeys.Add(new IntrospectedForeignKeyMember(
            "fk_sale_chg_of_owner", "sale", "chg_of_owner_id",
            "chg_of_owner", "chg_of_owner_id", 1));

        var live = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await live.ReadAsync(CancellationToken.None);
        return await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(data), CancellationToken.None);
    }
}
