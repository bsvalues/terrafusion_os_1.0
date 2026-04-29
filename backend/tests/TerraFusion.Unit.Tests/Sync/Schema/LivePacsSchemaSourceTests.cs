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
}
