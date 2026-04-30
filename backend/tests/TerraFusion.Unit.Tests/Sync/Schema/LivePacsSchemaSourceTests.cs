using System;
using System.Linq;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C48-C unit tests for <see cref="LivePacsSchemaSource"/>.
/// Drives the source with a fake introspector so tests verify
/// translation logic without requiring a live database connection.
/// </summary>
public sealed class LivePacsSchemaSourceTests
{
    private static LivePacsSchemaSourceOptions DefaultOptions =>
        LivePacsSchemaSourceOptions.ForBentonHarrisPacs("test-fixture");

    [Fact]
    public async Task ReadAsync_HappyPath_TranslatesIntoExpectedShape()
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("chg_of_owner"));
        fake.Tables.Add(new IntrospectedTable("sale"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("chg_of_owner", "chg_of_owner_id", "int", false, 1),
            new IntrospectedColumn("chg_of_owner", "deed_dt",          "datetime", true, 2),
            new IntrospectedColumn("sale",         "chg_of_owner_id",  "int", false, 1),
            new IntrospectedColumn("sale",         "sl_price",         "numeric", true, 2),
        });
        fake.PrimaryKeys.AddRange(new[]
        {
            new IntrospectedPrimaryKeyMember("chg_of_owner", "chg_of_owner_id", 1),
            new IntrospectedPrimaryKeyMember("sale",         "chg_of_owner_id", 1),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);

        var data = await sut.ReadAsync(CancellationToken.None);

        data.Tables.Should().HaveCount(2);
        data.Columns.Should().HaveCount(4);
        data.Dictionaries.Should().BeEmpty();

        var chg = data.Tables.Single(t => t.TableName == "chg_of_owner");
        chg.IdentityTuple.Should().ContainSingle().Which.Should().Be("chg_of_owner_id");
        chg.ConversionEra.Should().Be(PacsConversionEra.Both);
        chg.PiiClassification.Should().Be(PiiClassification.None);
        chg.DictionaryReferences.Should().BeEmpty();
        chg.ProvenancePath.Should().StartWith("live-introspection://test-fixture/dbo/chg_of_owner");

        var deedDt = data.Columns.Single(c => c.ColumnName == "deed_dt");
        deedDt.DeclaredType.Should().Be("datetime");
        deedDt.Nullable.Should().BeTrue();
        deedDt.ConversionEra.Should().Be(PacsConversionEra.Both);
        deedDt.PiiClassification.Should().Be(PiiClassification.None);
        deedDt.DictionaryRef.Should().BeNull();
        deedDt.ProvenanceLine.Should().Contain("chg_of_owner.deed_dt");
    }

    [Fact]
    public async Task ReadAsync_CompositePrimaryKey_PreservesOrdinalOrder()
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("imprv"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv", "prop_id",   "int", false, 1),
            new IntrospectedColumn("imprv", "imprv_id",  "int", false, 2),
        });
        // Insert PKs OUT OF ORDER to verify the source sorts by ordinal:
        fake.PrimaryKeys.AddRange(new[]
        {
            new IntrospectedPrimaryKeyMember("imprv", "imprv_id", 2),
            new IntrospectedPrimaryKeyMember("imprv", "prop_id",  1),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);

        var data = await sut.ReadAsync(CancellationToken.None);

        var imprv = data.Tables.Single();
        imprv.IdentityTuple.Should().Equal("prop_id", "imprv_id");
    }

    [Fact]
    public async Task ReadAsync_MissingPrimaryKey_FallsBackToConventionalIdColumn()
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("hood_cd_lookup"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("hood_cd_lookup", "hood_cd_lookup_id", "int", false, 1),
            new IntrospectedColumn("hood_cd_lookup", "hood_descr",        "varchar", true, 2),
        });
        // No primary keys declared.

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);

        var data = await sut.ReadAsync(CancellationToken.None);

        var t = data.Tables.Single();
        t.IdentityTuple.Should().ContainSingle().Which.Should().Be("hood_cd_lookup_id");
    }

    [Fact]
    public async Task ReadAsync_MissingPrimaryKeyAndNoConventionalColumn_LeavesIdentityTupleEmpty()
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("orphan_lookup"));
        fake.Columns.Add(
            new IntrospectedColumn("orphan_lookup", "code", "varchar", false, 1));

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);

        var data = await sut.ReadAsync(CancellationToken.None);

        data.Tables.Single().IdentityTuple.Should().BeEmpty();
    }

    [Fact]
    public async Task ReadAsync_NullIntrospectionResult_ThrowsExplicitFailure()
    {
        var fake = new FakePacsSchemaIntrospector { ReturnNullResult = true };
        var sut = new LivePacsSchemaSource(fake, DefaultOptions);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        (await act.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*null*HG7*");
    }

    [Fact]
    public void Constructor_NullIntrospector_Throws()
    {
        var act = () => new LivePacsSchemaSource(null!, DefaultOptions);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_NullOptions_Throws()
    {
        var act = () => new LivePacsSchemaSource(new FakePacsSchemaIntrospector(), null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task ReadAsync_VersionStamp_CarriesPacsReleaseLabel()
    {
        var fake = new FakePacsSchemaIntrospector();
        var options = new LivePacsSchemaSourceOptions("benton-pacs-prod", "dbo", "Harris PACS 9.0.4.2");
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        data.Version.PacsRelease.Should().Be("Harris PACS 9.0.4.2");
        data.Version.IngestedAt.Kind.Should().Be(DateTimeKind.Utc);
        data.Version.SourceFileHashes.Keys.Should().Contain(k => k.Contains("benton-pacs-prod"));
    }

    [Fact]
    public async Task ReadAsync_BuildsCatalogSuccessfully_WhenWiredThroughBuildAsync()
    {
        // End-to-end check: verify the source plays nicely with the
        // existing PacsSchemaCatalog.BuildAsync construction-time
        // validation (HG6, integrity, etc.).
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("sale"));
        fake.Columns.Add(new IntrospectedColumn("sale", "chg_of_owner_id", "int", false, 1));
        fake.PrimaryKeys.Add(new IntrospectedPrimaryKeyMember("sale", "chg_of_owner_id", 1));

        var source = new LivePacsSchemaSource(fake, DefaultOptions);

        var catalog = await PacsSchemaCatalog.BuildAsync(source, CancellationToken.None);

        catalog.Coverage.TableCount.Should().Be(1);
        catalog.Coverage.ColumnCount.Should().Be(1);
        var sale = catalog.TryGetTable("sale");
        sale.HasValue.Should().BeTrue();
        sale.Value!.ProvenancePath.Should().NotBeNullOrWhiteSpace();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Slice C48-F: dictionary inference. Heuristic grounded in real Harris
    // PACS shape — first column ends in _cd AND second column ends in _desc
    // or _dsc. Conservative on purpose: rich entities like neighborhood
    // (which has code + year + name + percent columns) deliberately do NOT
    // match.
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C48F_InferDictionaries_ClassicCodeDescPair_IsMatched()
    {
        var fake = new FakePacsSchemaIntrospector();
        // Mirrors real Harris PACS imprv_det_class shape.
        fake.Tables.Add(new IntrospectedTable("imprv_det_class"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv_det_class", "imprv_det_class_cd", "char",    false, 1),
            new IntrospectedColumn("imprv_det_class", "imprv_det_cls_desc", "varchar", true,  2),
            new IntrospectedColumn("imprv_det_class", "sys_flag",           "varchar", true,  3),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().ContainSingle();
        var d = data.Dictionaries[0];
        d.DictionaryName.Should().Be("imprv_det_class");
        d.KeyColumn.Should().Be("imprv_det_class_cd");
        d.DescriptionColumn.Should().Be("imprv_det_cls_desc");
        d.ConversionEra.Should().Be(PacsConversionEra.Both);
        d.ProvenancePath.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task C48F_InferDictionaries_DscSuffix_IsAlsoMatched()
    {
        // Harris PACS uses both _desc and _dsc (e.g. imprv_det_meth_dsc).
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("imprv_det_meth"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv_det_meth", "imprv_det_meth_cd",  "char",    false, 1),
            new IntrospectedColumn("imprv_det_meth", "imprv_det_meth_dsc", "varchar", true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().ContainSingle().Which.DescriptionColumn.Should().Be("imprv_det_meth_dsc");
    }

    [Fact]
    public async Task C48F_InferDictionaries_RichEntity_IsNotMatched()
    {
        // neighborhood has hood_cd as first column but second column is
        // hood_yr (numeric), not a description. Should NOT match.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("neighborhood"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("neighborhood", "hood_cd",       "varchar", false, 1),
            new IntrospectedColumn("neighborhood", "hood_yr",       "numeric", false, 2),
            new IntrospectedColumn("neighborhood", "hood_name",     "varchar", true,  3),
            new IntrospectedColumn("neighborhood", "hood_land_pct", "numeric", true,  4),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().BeEmpty();
    }

    [Fact]
    public async Task C48F_InferDictionaries_NonCodeFirstColumn_IsNotMatched()
    {
        // chg_of_owner first column is chg_of_owner_id (ends in _id, not
        // _cd). MUST NOT classify as a dictionary even though there's a
        // description-like column further down.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("chg_of_owner"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("chg_of_owner", "chg_of_owner_id", "int",      false, 1),
            new IntrospectedColumn("chg_of_owner", "grantor_desc",    "varchar",  true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().BeEmpty();
    }

    [Fact]
    public async Task C48F_InferDictionaries_SingleColumnTable_IsNotMatched()
    {
        // A table with only one column can't be a code+desc dictionary.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("alone"));
        fake.Columns.Add(new IntrospectedColumn("alone", "alone_cd", "char", false, 1));

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().BeEmpty();
    }

    [Fact]
    public async Task C48F_InferDictionaries_DisabledViaOption_ReturnsEmpty()
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("imprv_det_class"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv_det_class", "imprv_det_class_cd", "char",    false, 1),
            new IntrospectedColumn("imprv_det_class", "imprv_det_cls_desc", "varchar", true,  2),
        });

        var optionsNoInfer = DefaultOptions with { InferDictionaries = false };
        var sut = new LivePacsSchemaSource(fake, optionsNoInfer);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().BeEmpty();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Slice C48-P: extended heuristic accepts Hungarian-notation
    // (szLandSoilCode/szLandSoilDesc) + snake_case (_code/_desc) variants
    // alongside the original C48-F (_cd / _desc / _dsc) patterns.
    // ────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task C48P_InferDictionaries_HungarianNotation_IsMatched()
    {
        // Mirrors real Harris PACS land_soil shape:
        // szLandSoilCode (col 1) + szLandSoilDesc (col 2).
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("land_soil"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("land_soil", "szLandSoilCode", "varchar", false, 1),
            new IntrospectedColumn("land_soil", "szLandSoilDesc", "varchar", true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().ContainSingle();
        var d = data.Dictionaries[0];
        d.DictionaryName.Should().Be("land_soil");
        d.KeyColumn.Should().Be("szLandSoilCode");
        d.DescriptionColumn.Should().Be("szLandSoilDesc");
    }

    [Fact]
    public async Task C48P_InferDictionaries_SnakeCaseCodeDesc_IsMatched()
    {
        // Mirrors real Harris PACS land_state_type shape:
        // land_state_type_code + land_state_type_desc.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("land_state_type"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("land_state_type", "land_state_type_code", "varchar", false, 1),
            new IntrospectedColumn("land_state_type", "land_state_type_desc", "varchar", true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().ContainSingle().Which.KeyColumn.Should().Be("land_state_type_code");
    }

    [Fact]
    public async Task C48P_InferDictionaries_LowercaseCodeIsNotMatchedAsHungarianCode()
    {
        // Defensive: a column name ending in lowercase 'code' (e.g.
        // 'decode', 'geocode') as a SUBSTRING must NOT match the
        // Hungarian rule. The case-sensitive 'Code' check guards
        // against this. The case-insensitive '_code' rule still
        // matches snake_case but requires the underscore separator,
        // so 'decode' stays unmatched.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("decode_log"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("decode_log", "decode",     "varchar", false, 1),
            new IntrospectedColumn("decode_log", "operator",   "varchar", true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Should().BeEmpty();
    }

    [Fact]
    public async Task C48P_InferDictionaries_OriginalC48FPatternsStillMatched()
    {
        // Regression guard: the C48-P extension is purely additive.
        // Pre-existing _cd / _desc / _dsc columns must continue to
        // match unchanged.
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("imprv_det_class"),
            new IntrospectedTable("imprv_det_meth"),
        });
        fake.Columns.AddRange(new[]
        {
            // _cd + _desc: classic
            new IntrospectedColumn("imprv_det_class", "imprv_det_class_cd", "char",    false, 1),
            new IntrospectedColumn("imprv_det_class", "imprv_det_cls_desc", "varchar", true,  2),
            // _cd + _dsc: original C48-F variant
            new IntrospectedColumn("imprv_det_meth",  "imprv_det_meth_cd",  "char",    false, 1),
            new IntrospectedColumn("imprv_det_meth",  "imprv_det_meth_dsc", "varchar", true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Select(d => d.DictionaryName).Should().BeEquivalentTo(
            new[] { "imprv_det_class", "imprv_det_meth" });
    }

    [Fact]
    public async Task C48F_InferDictionaries_MultipleDictionariesAndNonDictionaries_OnlyDictsReturned()
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.AddRange(new[]
        {
            new IntrospectedTable("imprv_det_class"),  // dict
            new IntrospectedTable("property_use"),     // dict
            new IntrospectedTable("neighborhood"),     // not dict (rich entity)
            new IntrospectedTable("sale"),             // not dict
        });
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv_det_class", "imprv_det_class_cd", "char",    false, 1),
            new IntrospectedColumn("imprv_det_class", "imprv_det_cls_desc", "varchar", true,  2),

            new IntrospectedColumn("property_use",    "property_use_cd",    "varchar", false, 1),
            new IntrospectedColumn("property_use",    "property_use_desc",  "varchar", true,  2),

            new IntrospectedColumn("neighborhood",    "hood_cd",            "varchar", false, 1),
            new IntrospectedColumn("neighborhood",    "hood_yr",            "numeric", false, 2),

            new IntrospectedColumn("sale",            "chg_of_owner_id",    "int",     false, 1),
            new IntrospectedColumn("sale",            "sl_price",           "numeric", true,  2),
        });

        var sut = new LivePacsSchemaSource(fake, DefaultOptions);
        var data = await sut.ReadAsync(CancellationToken.None);

        data.Dictionaries.Select(d => d.DictionaryName).Should().BeEquivalentTo(
            new[] { "imprv_det_class", "property_use" });
    }
}
