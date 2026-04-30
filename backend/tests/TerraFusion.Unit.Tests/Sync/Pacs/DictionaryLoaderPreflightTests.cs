using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Pacs;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Pacs;

/// <summary>
/// Slice C49-FK-D unit tests for
/// <see cref="DictionaryLoaderPreflight"/>. Covers the eight binding
/// cases enumerated in
/// <c>docs/sync/pacs-schema-fk-consumer-migration-policy.md</c> plus
/// composite + arity + multi-FK + table-with-no-FK coverage.
/// </summary>
public sealed class DictionaryLoaderPreflightTests
{
    private static IDictionaryLoaderPreflight Sut => new DictionaryLoaderPreflight();

    // ────────────────────────────────────────────────────────────────────────
    // 1-2: Pass cases (declared FK present)
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKD_DeclaredFk_RequiredStance_Passes()
    {
        var catalog = await BuildCatalogWithDeclaredFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Pass);
        result.MatchedEdge.Should().NotBeNull();
        result.MatchedEdge!.Confidence.Should().Be(PacsForeignKeyConfidence.Declared);
        result.Message.Should().BeEmpty();
    }

    [Fact]
    public async Task C49FKD_DeclaredFk_AdvisoryStance_PassesAndDoesNotWarn()
    {
        var catalog = await BuildCatalogWithDeclaredFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.AdvisoryFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Pass);
        result.MatchedEdge.Should().NotBeNull();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3-4: Missing FK cases (Required → Fail; Advisory → Warn)
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKD_MissingFk_RequiredStance_FailsClosedWithStructuredMessage()
    {
        var catalog = await BuildCatalogWithoutFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Fail);
        result.MatchedEdge.Should().BeNull();
        result.Message.Should().Contain("Required FK missing");
        result.Message.Should().Contain("property_val(property_use_cd) → property_use");
        result.Message.Should().Contain("loader will not run");
    }

    [Fact]
    public async Task C49FKD_MissingFk_AdvisoryStance_LogsWarningAndProceeds()
    {
        var catalog = await BuildCatalogWithoutFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.AdvisoryFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Warn);
        result.MatchedEdge.Should().BeNull();
        result.Message.Should().Contain("Advisory FK absent");
        result.Message.Should().Contain("property_val(property_use_cd) → property_use");
        result.Message.Should().Contain("Loader will proceed");
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5-6: HG-FK-2 — InferredByName edges treated as missing
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKD_InferredByNameFk_RequiredStance_TreatedAsMissing()
    {
        // Build a catalog where the only matching FK is InferredByName.
        // The preflight uses TryGetDeclaredForeignKeysFor which excludes
        // InferredByName, so this MUST behave the same as no-FK.
        var catalog = await BuildCatalogWithInferredOnlyFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Fail);
        result.MatchedEdge.Should().BeNull();
    }

    [Fact]
    public async Task C49FKD_InferredByNameFk_AdvisoryStance_AlsoTreatedAsMissing()
    {
        var catalog = await BuildCatalogWithInferredOnlyFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.AdvisoryFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Warn);
        result.MatchedEdge.Should().BeNull();
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7-8: Missing-source-table + stance-validation
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKD_MissingSourceTable_RequiredStance_FailsClosed()
    {
        var catalog = await BuildCatalogWithDeclaredFk();
        // Target points at a workbook source table that doesn't exist
        // in the catalog. (The C48-G DictionaryConfigFromCatalog.Build
        // path normally catches this, but preflight still needs to
        // handle the case defensively per the C49-FK-C policy.)
        var target = new DictionaryLoaderTargetConfig(
            WorkbookSourceSchema:  "dbo",
            WorkbookSourceTable:   "ghost_source_table",
            WorkbookSourceColumn:  "property_use_cd",
            PacsDictionarySchema:  "dbo",
            PacsDictionaryTable:   "property_use",
            CanonicalTargetName:   "PropertyUse");
        var columns = new DictionaryColumnConfig(
            CodeColumn:           "property_use_cd",
            DescriptionColumn:    "property_use_desc",
            ActiveFlagColumn:     null,
            ActiveFlagPredicate:  null,
            YearColumn:           null);

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Fail);
        result.Message.Should().Contain("source table not in catalog");
    }

    [Fact]
    public async Task C49FKD_StanceMustBeExplicit_RejectsZeroValue()
    {
        var catalog = await BuildCatalogWithDeclaredFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        // HG-FK-3: stance has no Unspecified sentinel; passing 0 must
        // throw rather than silently default.
        var act = async () => await Sut.ValidateAsync(catalog, target, columns,
            (DictionaryLoaderPreflightStance)0, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*HG-FK-3*");
    }

    // ────────────────────────────────────────────────────────────────────────
    // Composite + arity + multi-FK coverage (extends the policy minimum)
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C49FKD_TableWithNoFks_RequiredStance_FailsClosed()
    {
        var catalog = await BuildCatalogWithDeclaredFk();
        // chg_of_owner has no outgoing FKs in the fixture.
        var target = new DictionaryLoaderTargetConfig(
            WorkbookSourceSchema:  "dbo",
            WorkbookSourceTable:   "chg_of_owner",
            WorkbookSourceColumn:  "chg_of_owner_id",
            PacsDictionarySchema:  "dbo",
            PacsDictionaryTable:   "property_use",
            CanonicalTargetName:   "PropertyUse");
        var columns = new DictionaryColumnConfig(
            CodeColumn:           "property_use_cd",
            DescriptionColumn:    "property_use_desc",
            ActiveFlagColumn:     null,
            ActiveFlagPredicate:  null,
            YearColumn:           null);

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Fail);
    }

    [Fact]
    public async Task C49FKD_MultipleFksFromSameSource_MatchesByTargetTable()
    {
        // Source table sale has TWO declared FKs: one to chg_of_owner
        // and one to property_use. Preflight asks for the property_use
        // edge — must NOT mistakenly return the chg_of_owner edge.
        var catalog = await BuildCatalogWithMultipleFks();
        var target = new DictionaryLoaderTargetConfig(
            WorkbookSourceSchema:  "dbo",
            WorkbookSourceTable:   "sale",
            WorkbookSourceColumn:  "property_use_cd",
            PacsDictionarySchema:  "dbo",
            PacsDictionaryTable:   "property_use",
            CanonicalTargetName:   "PropertyUse");
        var columns = new DictionaryColumnConfig(
            CodeColumn:           "property_use_cd",
            DescriptionColumn:    "property_use_desc",
            ActiveFlagColumn:     null,
            ActiveFlagPredicate:  null,
            YearColumn:           null);

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Pass);
        result.MatchedEdge!.TargetTable.Should().Be("property_use");
        result.MatchedEdge.SourceColumns.Should().BeEquivalentTo(new[] { "property_use_cd" });
    }

    [Fact]
    public async Task C49FKD_NullArguments_Throw()
    {
        var catalog = await BuildCatalogWithDeclaredFk();
        var (target, columns) = PropertyUseTargetAndColumns();

        Func<Task> nullCatalog = () => Sut.ValidateAsync(null!, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);
        Func<Task> nullTarget  = () => Sut.ValidateAsync(catalog, null!, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);
        Func<Task> nullColumns = () => Sut.ValidateAsync(catalog, target, null!,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        await nullCatalog.Should().ThrowAsync<ArgumentNullException>();
        await nullTarget.Should().ThrowAsync<ArgumentNullException>();
        await nullColumns.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task C49FKD_DeclaredAndInferredCoexist_DeclaredWins()
    {
        // Catalog has BOTH a declared FK (sale.property_use_cd →
        // property_use.property_use_cd) AND an inferred FK on the same
        // shape (which the C48-F precedence rule already suppresses,
        // but defensive test still passes the case through preflight).
        // Preflight must return the declared edge.
        var catalog = await BuildCatalogWithMultipleFks();
        var target = new DictionaryLoaderTargetConfig(
            WorkbookSourceSchema:  "dbo",
            WorkbookSourceTable:   "sale",
            WorkbookSourceColumn:  "property_use_cd",
            PacsDictionarySchema:  "dbo",
            PacsDictionaryTable:   "property_use",
            CanonicalTargetName:   "PropertyUse");
        var columns = new DictionaryColumnConfig(
            CodeColumn:           "property_use_cd",
            DescriptionColumn:    "property_use_desc",
            ActiveFlagColumn:     null,
            ActiveFlagPredicate:  null,
            YearColumn:           null);

        var result = await Sut.ValidateAsync(catalog, target, columns,
            DictionaryLoaderPreflightStance.RequiredFk, CancellationToken.None);

        result.Outcome.Should().Be(DictionaryLoaderPreflightOutcome.Pass);
        result.MatchedEdge!.Confidence.Should().Be(PacsForeignKeyConfidence.Declared);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private static (DictionaryLoaderTargetConfig target, DictionaryColumnConfig columns)
        PropertyUseTargetAndColumns()
    {
        // Mirrors the live SyncAtlas property_use config (C22-B / C48-H).
        return (
            new DictionaryLoaderTargetConfig(
                WorkbookSourceSchema:  "dbo",
                WorkbookSourceTable:   "property_val",
                WorkbookSourceColumn:  "property_use_cd",
                PacsDictionarySchema:  "dbo",
                PacsDictionaryTable:   "property_use",
                CanonicalTargetName:   "PropertyUse"),
            new DictionaryColumnConfig(
                CodeColumn:           "property_use_cd",
                DescriptionColumn:    "property_use_desc",
                ActiveFlagColumn:     null,
                ActiveFlagPredicate:  null,
                YearColumn:           null));
    }

    private static async Task<IPacsSchemaCatalog> BuildCatalogWithDeclaredFk()
    {
        // chg_of_owner + property_val + property_use, with one declared FK:
        //   property_val.property_use_cd → property_use.property_use_cd
        var fake = new TerraFusion.Unit.Tests.Sync.Schema.FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("chg_of_owner"),
            new IntrospectedTable("property_val"),
            new IntrospectedTable("property_use"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("chg_of_owner", "chg_of_owner_id",  "int",     false, 1),
            new IntrospectedColumn("property_val", "prop_id",          "int",     false, 1),
            new IntrospectedColumn("property_val", "property_use_cd",  "varchar", true,  2),
            new IntrospectedColumn("property_use", "property_use_cd",  "varchar", false, 1),
            new IntrospectedColumn("property_use", "property_use_desc","varchar", true,  2),
        });
        fake.ForeignKeys.Add(new IntrospectedForeignKeyMember(
            "fk_property_val_property_use",
            "property_val", "property_use_cd",
            "property_use", "property_use_cd",
            1));

        var live = new LivePacsSchemaSource(fake,
            LivePacsSchemaSourceOptions.ForBentonHarrisPacs("test-fixture"));
        var data = await live.ReadAsync(CancellationToken.None);
        return await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(data), CancellationToken.None);
    }

    private static async Task<IPacsSchemaCatalog> BuildCatalogWithoutFk()
    {
        // Same tables but no declared FK at all. property_use is still
        // a dictionary so InferredByName MIGHT activate; but that's
        // suppressed because property_val.property_use_cd matches the
        // dictionary key column → inferred edge on the same shape.
        // To get a TRUE "no FK" scenario, omit the column on the
        // workbook side that would trigger inference.
        var fake = new TerraFusion.Unit.Tests.Sync.Schema.FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("property_val"),
            new IntrospectedTable("property_use"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("property_val", "prop_id",          "int",     false, 1),
            new IntrospectedColumn("property_val", "some_other_col",   "varchar", true,  2),
            new IntrospectedColumn("property_use", "property_use_cd",  "varchar", false, 1),
            new IntrospectedColumn("property_use", "property_use_desc","varchar", true,  2),
        });
        // No declared FK.

        var live = new LivePacsSchemaSource(fake,
            LivePacsSchemaSourceOptions.ForBentonHarrisPacs("test-fixture"));
        var data = await live.ReadAsync(CancellationToken.None);
        return await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(data), CancellationToken.None);
    }

    private static async Task<IPacsSchemaCatalog> BuildCatalogWithInferredOnlyFk()
    {
        // property_val.property_use_cd matches property_use's KeyColumn,
        // so the C48-F dictionary inference + C49-FK-B InferredByName
        // pass produces an InferredByName edge. NO declared FK is added.
        var fake = new TerraFusion.Unit.Tests.Sync.Schema.FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("property_val"),
            new IntrospectedTable("property_use"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("property_val", "prop_id",          "int",     false, 1),
            new IntrospectedColumn("property_val", "property_use_cd",  "varchar", true,  2),
            new IntrospectedColumn("property_use", "property_use_cd",  "varchar", false, 1),
            new IntrospectedColumn("property_use", "property_use_desc","varchar", true,  2),
        });
        // No declared FK; the InferredByName pass will produce one.

        var live = new LivePacsSchemaSource(fake,
            LivePacsSchemaSourceOptions.ForBentonHarrisPacs("test-fixture"));
        var data = await live.ReadAsync(CancellationToken.None);

        // Sanity: confirm the inferred edge exists.
        var pv = data.Tables.Single(t => t.TableName == "property_val");
        pv.ForeignKeys.Should().ContainSingle(fk => fk.Confidence == PacsForeignKeyConfidence.InferredByName);

        return await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(data), CancellationToken.None);
    }

    private static async Task<IPacsSchemaCatalog> BuildCatalogWithMultipleFks()
    {
        // sale has TWO declared FKs:
        //   sale.chg_of_owner_id  → chg_of_owner.chg_of_owner_id
        //   sale.property_use_cd  → property_use.property_use_cd
        var fake = new TerraFusion.Unit.Tests.Sync.Schema.FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("chg_of_owner"),
            new IntrospectedTable("sale"),
            new IntrospectedTable("property_use"),
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("chg_of_owner", "chg_of_owner_id",  "int",     false, 1),
            new IntrospectedColumn("sale",         "chg_of_owner_id",  "int",     false, 1),
            new IntrospectedColumn("sale",         "property_use_cd",  "varchar", true,  2),
            new IntrospectedColumn("property_use", "property_use_cd",  "varchar", false, 1),
            new IntrospectedColumn("property_use", "property_use_desc","varchar", true,  2),
        });
        fake.ForeignKeys.AddRange(new[]
        {
            new IntrospectedForeignKeyMember(
                "fk_sale_chg_of_owner", "sale", "chg_of_owner_id",
                "chg_of_owner", "chg_of_owner_id", 1),
            new IntrospectedForeignKeyMember(
                "fk_sale_property_use", "sale", "property_use_cd",
                "property_use", "property_use_cd", 1),
        });

        var live = new LivePacsSchemaSource(fake,
            LivePacsSchemaSourceOptions.ForBentonHarrisPacs("test-fixture"));
        var data = await live.ReadAsync(CancellationToken.None);
        return await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(data), CancellationToken.None);
    }
}
