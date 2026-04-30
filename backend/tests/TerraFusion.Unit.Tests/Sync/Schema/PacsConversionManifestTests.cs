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
/// Slice C50-CONV-B unit tests. Covers the seven minimum cases
/// declared in the C50-CONV-A1 implementation contract:
///
/// 1. Manifest absent + RequireConversionManifest=false → all eras Both
///    (backwards-compat bridge per the C50-CONV-B commit; doc spec
///    says Unknown but the bridge keeps C48-B behavior for un-engaged
///    callers).
/// 2. Manifest absent + RequireConversionManifest=true → build fails.
/// 3. Manifest with table-only entry → table tagged, columns inherit.
/// 4. Manifest with column override on tagged table → column wins.
/// 5. Manifest with `Unknown` written explicitly → manifest-load fails (HG-CONV-2).
/// 6. Manifest with conflicting duplicate entries → manifest-load fails.
/// 7. Manifest with manifest path engaged but file missing → fails (HG-CONV-1).
///
/// Plus argument-validation and version-stamp coverage.
/// </summary>
public sealed class PacsConversionManifestTests : IDisposable
{
    private readonly string _tempDir;

    public PacsConversionManifestTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"c50-conv-b-{Guid.NewGuid():N}");
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
        fake.Tables.Add(new IntrospectedTable("imprv_detail"));
        fake.Tables.Add(new IntrospectedTable("pp_seg_history"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv_detail",   "imprv_det_id",        "int",     false, 1),
            new IntrospectedColumn("imprv_detail",   "ascend_orig_meth_cd", "varchar", true,  2),
            new IntrospectedColumn("imprv_detail",   "imprv_det_meth_cd",   "varchar", true,  3),
            new IntrospectedColumn("pp_seg_history", "pp_seg_id",           "int",     false, 1),
            new IntrospectedColumn("pp_seg_history", "snapshot_dt",         "datetime", true, 2),
        });
        fake.PrimaryKeys.AddRange(new[]
        {
            new IntrospectedPrimaryKeyMember("imprv_detail",   "imprv_det_id", 1),
            new IntrospectedPrimaryKeyMember("pp_seg_history", "pp_seg_id",    1),
        });
        return fake;
    }

    [Fact]
    public async Task ReadAsync_ManifestAbsent_NotRequired_KeepsBothDefault_BackwardsCompat()
    {
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: null,
            RequireConversionManifest: false);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        // C50-CONV-B backwards-compat bridge: manifest layer not
        // engaged → C48-B Both default preserved on every record.
        data.Tables.Should().OnlyContain(t => t.ConversionEra == PacsConversionEra.Both);
        data.Columns.Should().OnlyContain(c => c.ConversionEra == PacsConversionEra.Both);
        data.Version.ConversionManifestHash.Should().Be("no-conversion-manifest-supplied");
    }

    [Fact]
    public async Task ReadAsync_ManifestRequired_NoPath_FailsClosed()
    {
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: null,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*RequireConversionManifest=true*ConversionManifestPath*null*HG-CONV-3*");
    }

    [Fact]
    public async Task ReadAsync_ManifestPathSet_FileMissing_FailsClosed()
    {
        var fake = BuildFakeIntrospection();
        var bogusPath = Path.Combine(_tempDir, "does-not-exist.json");
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: bogusPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        // RequireConversionManifest=true: the FileNotFoundException
        // bubbles up unchanged (no wrapping; caller sees HG-CONV-1
        // message).
        await act.Should().ThrowAsync<FileNotFoundException>()
            .WithMessage("*does not exist*HG-CONV-1*");
    }

    [Fact]
    public async Task ReadAsync_ManifestWithTableEntry_ColumnsInheritTableEra()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
              "tables": [
                {
                  "name": "pp_seg_history",
                  "era": "Pre2017",
                  "reason": "Pre-2017 personal-property snapshots; never written by current PACS workflow."
                }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: manifestPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var pps = data.Tables.Single(t => t.TableName == "pp_seg_history");
        pps.ConversionEra.Should().Be(PacsConversionEra.Pre2017);

        var ppsCols = data.Columns.Where(c => c.TableName == "pp_seg_history").ToList();
        ppsCols.Should().OnlyContain(c => c.ConversionEra == PacsConversionEra.Pre2017,
            "columns inherit table-level era when not explicitly annotated");

        // Un-annotated table → Unknown (manifest engaged).
        var imprv = data.Tables.Single(t => t.TableName == "imprv_detail");
        imprv.ConversionEra.Should().Be(PacsConversionEra.Unknown);
    }

    [Fact]
    public async Task ReadAsync_ManifestWithColumnOverride_ColumnWinsOverTable()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
              "tables": [
                { "name": "imprv_detail", "era": "Both",
                  "reason": "Operationally-maintained core table." }
              ],
              "columns": [
                { "table": "imprv_detail", "column": "ascend_orig_meth_cd", "era": "Pre2017",
                  "reason": "Carried over from Ascend during 2017 conversion." }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: manifestPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var imprv = data.Tables.Single(t => t.TableName == "imprv_detail");
        imprv.ConversionEra.Should().Be(PacsConversionEra.Both);

        var ascend = data.Columns.Single(c => c.TableName == "imprv_detail" && c.ColumnName == "ascend_orig_meth_cd");
        ascend.ConversionEra.Should().Be(PacsConversionEra.Pre2017,
            "column-level annotation overrides parent table");

        var meth = data.Columns.Single(c => c.TableName == "imprv_detail" && c.ColumnName == "imprv_det_meth_cd");
        meth.ConversionEra.Should().Be(PacsConversionEra.Both,
            "un-annotated column inherits table era");
    }

    [Fact]
    public async Task ReadAsync_ManifestWithUnknownExplicit_FailsClosed_HGCONV2()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
              "tables": [
                { "name": "imprv_detail", "era": "Unknown",
                  "reason": "should not be allowed" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: manifestPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*Unknown*sentinel*HG-CONV-2*");
    }

    [Fact]
    public async Task ReadAsync_ManifestWithDuplicateTableEntries_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
              "tables": [
                { "name": "imprv_detail", "era": "Both",     "reason": "first claim" },
                { "name": "imprv_detail", "era": "Post2017", "reason": "second claim contradicts" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: manifestPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*duplicate*imprv_detail*");
    }

    [Fact]
    public async Task ReadAsync_ManifestWithEmptyReason_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
              "columns": [
                { "table": "imprv_detail", "column": "ascend_orig_meth_cd", "era": "Pre2017", "reason": "" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: manifestPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*empty*reason*audit-trail*");
    }

    [Fact]
    public async Task ReadAsync_ManifestEngaged_VersionStampReflectsManifest()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "2.3.4",
              "conversionEvent": "Benton-2017-Harris-PACS-9.0-conversion",
              "tables": [
                { "name": "imprv_detail", "era": "Both", "reason": "operational" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: manifestPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        data.Version.ConversionManifestHash.Should().Contain("manifest@");
        data.Version.ConversionManifestHash.Should().Contain("2.3.4");
        data.Version.ConversionManifestHash.Should().Contain("Benton-2017-Harris-PACS-9.0-conversion");
    }

    [Fact]
    public async Task ReadAsync_ManifestMissingRequiredFields_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            { "tables": [] }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test-fixture", "dbo", null,
            InferDictionaries: false,
            ConversionManifestPath: manifestPath,
            RequireConversionManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*manifestVersion*");
    }

    [Fact]
    public async Task JsonFilePacsConversionManifestSource_NullPath_ReturnsNull()
    {
        var sut = new JsonFilePacsConversionManifestSource(null);

        var manifest = await sut.ReadAsync(CancellationToken.None);

        manifest.Should().BeNull();
    }
}
