using System;
using System.IO;
using System.Linq;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C51-PII-B unit tests. Covers the eight minimum cases
/// declared in the C51-PII-A implementation contract:
///
/// 1. Manifest absent + RequirePiiManifest=false → all None (C48-B legacy preserved)
/// 2. Manifest absent + RequirePiiManifest=true → build fails
/// 3. Manifest with column entry → column tagged
/// 4. Manifest with table entry → columns inherit
/// 5. Column override on tagged table → column wins
/// 6. Empty Reason → fails (audit-trail integrity)
/// 7. Duplicate column entry → fails
/// 8. TableExhaustiveFlags naming non-existent table → build fails
/// 9. TableExhaustiveFlags naming real table: un-annotated columns get None
///
/// Plus null-path source coverage and invalid-classification coverage.
/// </summary>
public sealed class PacsPiiManifestTests : IDisposable
{
    private readonly string _tempDir;

    public PacsPiiManifestTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"c51-pii-b-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, recursive: true); } catch { /* ignore */ }
    }

    private string WriteManifest(string content)
    {
        var path = Path.Combine(_tempDir, "manifest.json");
        File.WriteAllText(path, content);
        return path;
    }

    private static FakePacsSchemaIntrospector BuildFakeIntrospection()
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("chg_of_owner"));
        fake.Tables.Add(new IntrospectedTable("imprv_det_class"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("chg_of_owner",    "chg_of_owner_id", "int",     false, 1),
            new IntrospectedColumn("chg_of_owner",    "grantor_cv",      "varchar", true,  2),
            new IntrospectedColumn("chg_of_owner",    "grantee_cv",      "varchar", true,  3),
            new IntrospectedColumn("imprv_det_class", "imprv_det_class_cd",  "varchar", false, 1),
            new IntrospectedColumn("imprv_det_class", "imprv_det_class_desc", "varchar", true, 2),
        });
        fake.PrimaryKeys.AddRange(new[]
        {
            new IntrospectedPrimaryKeyMember("chg_of_owner",    "chg_of_owner_id",    1),
            new IntrospectedPrimaryKeyMember("imprv_det_class", "imprv_det_class_cd", 1),
        });
        return fake;
    }

    [Fact]
    public async Task ReadAsync_ManifestAbsent_NotRequired_KeepsNoneDefault()
    {
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: null, RequirePiiManifest: false);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        data.Tables.Should().OnlyContain(t => t.PiiClassification == PiiClassification.None);
        data.Columns.Should().OnlyContain(c => c.PiiClassification == PiiClassification.None);
    }

    [Fact]
    public async Task ReadAsync_ManifestRequired_NoPath_FailsClosed()
    {
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: null, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*RequirePiiManifest=true*PiiManifestPath*HG-PII-3*");
    }

    [Fact]
    public async Task ReadAsync_ManifestWithColumnEntry_ColumnTagged()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026-PII-tagging",
              "columns": [
                { "table": "chg_of_owner", "column": "grantor_cv",
                  "classification": "Direct", "reason": "Grantor full name from deed." }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var grantor = data.Columns.Single(c => c.ColumnName == "grantor_cv");
        grantor.PiiClassification.Should().Be(PiiClassification.Direct);

        var grantee = data.Columns.Single(c => c.ColumnName == "grantee_cv");
        grantee.PiiClassification.Should().Be(PiiClassification.None,
            "un-annotated column stays None when manifest engaged");
    }

    [Fact]
    public async Task ReadAsync_ManifestWithTableEntry_ColumnsInheritTablePii()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "tables": [
                { "name": "chg_of_owner", "classification": "Indirect",
                  "reason": "Sales chain table; combined with owner reveals identity." }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var table = data.Tables.Single(t => t.TableName == "chg_of_owner");
        table.PiiClassification.Should().Be(PiiClassification.Indirect);

        var cols = data.Columns.Where(c => c.TableName == "chg_of_owner").ToList();
        cols.Should().OnlyContain(c => c.PiiClassification == PiiClassification.Indirect,
            "columns inherit table-level classification");
    }

    [Fact]
    public async Task ReadAsync_ColumnOverridesTableEntry()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "tables": [
                { "name": "chg_of_owner", "classification": "Indirect", "reason": "Sales chain." }
              ],
              "columns": [
                { "table": "chg_of_owner", "column": "grantor_cv",
                  "classification": "Direct", "reason": "Grantor full name." }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var grantor = data.Columns.Single(c => c.ColumnName == "grantor_cv");
        grantor.PiiClassification.Should().Be(PiiClassification.Direct,
            "column-level entry beats table-level entry");

        var grantee = data.Columns.Single(c => c.ColumnName == "grantee_cv");
        grantee.PiiClassification.Should().Be(PiiClassification.Indirect,
            "un-annotated column inherits table-level Indirect");
    }

    [Fact]
    public async Task ReadAsync_EmptyReason_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "columns": [
                { "table": "chg_of_owner", "column": "grantor_cv",
                  "classification": "Direct", "reason": "" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*empty 'reason'*audit-trail*");
    }

    [Fact]
    public async Task ReadAsync_DuplicateColumnEntry_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "columns": [
                { "table": "chg_of_owner", "column": "grantor_cv", "classification": "Direct",   "reason": "first" },
                { "table": "chg_of_owner", "column": "grantor_cv", "classification": "Indirect", "reason": "second" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*duplicate*chg_of_owner.grantor_cv*");
    }

    [Fact]
    public async Task ReadAsync_TableExhaustiveFlags_UnknownTable_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "tableExhaustive": [ "this_table_does_not_exist" ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*TableExhaustiveFlags*this_table_does_not_exist*HG-PII-2*");
    }

    [Fact]
    public async Task ReadAsync_TableExhaustiveFlags_KnownTable_PreservesNoneOnUnannotated()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "tableExhaustive": [ "imprv_det_class" ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var cls = data.Tables.Single(t => t.TableName == "imprv_det_class");
        cls.PiiClassification.Should().Be(PiiClassification.None);

        var clsCols = data.Columns.Where(c => c.TableName == "imprv_det_class").ToList();
        clsCols.Should().OnlyContain(c => c.PiiClassification == PiiClassification.None,
            "exhaustive-flagged table with no entries asserts every column is None");
    }

    [Fact]
    public async Task ReadAsync_InvalidClassification_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "columns": [
                { "table": "chg_of_owner", "column": "grantor_cv",
                  "classification": "VeryPii", "reason": "bogus value" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null, InferDictionaries: false,
            PiiManifestPath: manifestPath, RequirePiiManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*invalid 'classification' value 'VeryPii'*");
    }

    [Fact]
    public async Task JsonFilePacsPiiManifestSource_NullPath_ReturnsNull()
    {
        var sut = new JsonFilePacsPiiManifestSource(null);

        var result = await sut.ReadAsync(CancellationToken.None);

        result.Should().BeNull();
    }
}
