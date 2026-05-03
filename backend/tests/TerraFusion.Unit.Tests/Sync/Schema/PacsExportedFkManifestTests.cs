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
/// Slice C52-OVR-B unit tests. Covers the eight minimum cases
/// declared in the C52-OVR-A implementation contract:
///
/// 1. Manifest absent + RequireExportedFkManifest=false → catalog unchanged from C49-FK-B baseline
/// 2. Manifest absent + RequireExportedFkManifest=true → build fails
/// 3. Manifest with valid entry → entry surfaces with Exported confidence
/// 4. Entry shape-matches Declared edge → Declared preserved, Exported dropped (HG-OVR-2)
/// 5. Empty Reason → fails (audit integrity)
/// 6. Duplicate ConstraintName → fails
/// 7. Source/target arity mismatch → fails
/// 8. Entry surfaces in TryGetDeclaredForeignKeysFor (per HG-FK-1)
/// </summary>
public sealed class PacsExportedFkManifestTests : IDisposable
{
    private readonly string _tempDir;

    public PacsExportedFkManifestTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"c52-ovr-b-{Guid.NewGuid():N}");
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

    private static FakePacsSchemaIntrospector BuildFakeIntrospection(bool withDeclaredFk = false)
    {
        var fake = new FakePacsSchemaIntrospector();
        fake.Tables.Add(new IntrospectedTable("imprv"));
        fake.Tables.Add(new IntrospectedTable("property_use"));
        fake.Columns.AddRange(new[]
        {
            new IntrospectedColumn("imprv",        "imprv_id",         "int",     false, 1),
            new IntrospectedColumn("imprv",        "primary_use_cd",   "varchar", true,  2),
            new IntrospectedColumn("property_use", "property_use_cd",  "varchar", false, 1),
            new IntrospectedColumn("property_use", "property_use_desc","varchar", true,  2),
        });
        fake.PrimaryKeys.AddRange(new[]
        {
            new IntrospectedPrimaryKeyMember("imprv",        "imprv_id",        1),
            new IntrospectedPrimaryKeyMember("property_use", "property_use_cd", 1),
        });
        if (withDeclaredFk)
        {
            fake.ForeignKeys.Add(new IntrospectedForeignKeyMember(
                ConstraintName: "DECL_imprv_primary_use_cd",
                SourceTable:    "imprv",
                SourceColumn:   "primary_use_cd",
                TargetTable:    "property_use",
                TargetColumn:   "property_use_cd",
                OrdinalPosition: 1));
        }
        return fake;
    }

    [Fact]
    public async Task Case1_ManifestAbsent_NotRequired_BaselineUnchanged()
    {
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: null,
            RequireExportedFkManifest: false);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var imprvFks = data.Tables.Single(t => t.TableName == "imprv").ForeignKeys;
        imprvFks.Should().BeEmpty("no Declared, no Exported, no Inferred (dictionaries off)");
    }

    [Fact]
    public async Task Case2_ManifestRequired_NoPath_FailsClosed()
    {
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: null,
            RequireExportedFkManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*RequireExportedFkManifest=true*ExportedFkManifestPath*HG-OVR-3*");
    }

    [Fact]
    public async Task Case3_ManifestWithValidEntry_SurfacesAsExported()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "edges": [
                {
                  "constraintName": "EXP_imprv_primary_use_cd",
                  "sourceTable": "imprv",
                  "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use",
                  "targetColumns": ["property_use_cd"],
                  "reason": "Engine does not declare; operator-promoted from inferred."
                }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: manifestPath,
            RequireExportedFkManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var imprvFks = data.Tables.Single(t => t.TableName == "imprv").ForeignKeys;
        imprvFks.Should().HaveCount(1);
        var fk = imprvFks[0];
        fk.ConstraintName.Should().Be("EXP_imprv_primary_use_cd");
        fk.Confidence.Should().Be(PacsForeignKeyConfidence.Exported);
        fk.ProvenanceSource.Should().Be(PacsForeignKeySource.ExportFile);
        fk.ProvenancePath.Should().Contain(manifestPath);
    }

    [Fact]
    public async Task Case4_EntryShapeMatchesDeclared_DeclaredPreserved_ExportedDropped_HGOVR2()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "edges": [
                {
                  "constraintName": "EXP_should_be_dropped",
                  "sourceTable": "imprv",
                  "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use",
                  "targetColumns": ["property_use_cd"],
                  "reason": "Operator did not realize this FK is engine-declared."
                }
              ]
            }
            """);
        var fake = BuildFakeIntrospection(withDeclaredFk: true);
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: manifestPath,
            RequireExportedFkManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        var imprvFks = data.Tables.Single(t => t.TableName == "imprv").ForeignKeys;
        imprvFks.Should().HaveCount(1, "the Exported entry shape-matched the Declared edge and was dropped");
        var fk = imprvFks[0];
        fk.ConstraintName.Should().Be("DECL_imprv_primary_use_cd");
        fk.Confidence.Should().Be(PacsForeignKeyConfidence.Declared);
    }

    [Fact]
    public async Task Case5_EmptyReason_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "edges": [
                {
                  "constraintName": "EXP_x",
                  "sourceTable": "imprv",
                  "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use",
                  "targetColumns": ["property_use_cd"],
                  "reason": ""
                }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: manifestPath,
            RequireExportedFkManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*empty 'reason'*audit-trail*");
    }

    [Fact]
    public async Task Case6_DuplicateConstraintName_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "edges": [
                { "constraintName": "EXP_dup", "sourceTable": "imprv", "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use", "targetColumns": ["property_use_cd"], "reason": "first" },
                { "constraintName": "EXP_dup", "sourceTable": "imprv", "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use", "targetColumns": ["property_use_cd"], "reason": "second contradicts" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: manifestPath,
            RequireExportedFkManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*duplicate*EXP_dup*");
    }

    [Fact]
    public async Task Case7_ArityMismatch_FailsClosed()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "edges": [
                {
                  "constraintName": "EXP_arity",
                  "sourceTable": "imprv",
                  "sourceColumns": ["a", "b"],
                  "targetTable": "property_use",
                  "targetColumns": ["one"],
                  "reason": "broken"
                }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: manifestPath,
            RequireExportedFkManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var act = async () => await sut.ReadAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage("*arity mismatch*");
    }

    [Fact]
    public async Task Case8_ExportedSurfacesInTryGetDeclaredForeignKeysFor()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026",
              "edges": [
                {
                  "constraintName": "EXP_promoted",
                  "sourceTable": "imprv",
                  "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use",
                  "targetColumns": ["property_use_cd"],
                  "reason": "Promoted by operator."
                }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: manifestPath,
            RequireExportedFkManifest: true);
        var liveSource = new LivePacsSchemaSource(fake, options);
        var catalog = await PacsSchemaCatalog.BuildAsync(liveSource, CancellationToken.None);

        // Per HG-FK-1, Declared+Exported are queryable together via
        // TryGetDeclaredForeignKeysFor.
        var lookup = catalog.TryGetDeclaredForeignKeysFor("imprv");
        lookup.HasValue.Should().BeTrue();
        var fks = lookup.Value!;
        fks.Should().HaveCount(1);
        fks[0].ConstraintName.Should().Be("EXP_promoted");
        fks[0].Confidence.Should().Be(PacsForeignKeyConfidence.Exported);
    }

    [Fact]
    public async Task ReadAsync_VersionStampReflectsExportedManifestEngagement()
    {
        var manifestPath = WriteManifest("""
            {
              "manifestVersion": "2.0.0",
              "manifestEvent": "Benton-2026-promotion-pass-1",
              "edges": [
                { "constraintName": "EXP_x", "sourceTable": "imprv", "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use", "targetColumns": ["property_use_cd"], "reason": "promoted" }
              ]
            }
            """);
        var fake = BuildFakeIntrospection();
        var options = new LivePacsSchemaSourceOptions(
            "test", "dbo", null,
            InferDictionaries: false,
            ExportedFkManifestPath: manifestPath,
            RequireExportedFkManifest: true);
        var sut = new LivePacsSchemaSource(fake, options);

        var data = await sut.ReadAsync(CancellationToken.None);

        data.Version.SourceFileHashes.Keys.Should().Contain(k => k.StartsWith("exported-fk-manifest@"));
        var stamp = data.Version.SourceFileHashes
            .First(kv => kv.Key.StartsWith("exported-fk-manifest@")).Value;
        stamp.Should().Contain("2.0.0").And.Contain("Benton-2026-promotion-pass-1").And.Contain("edges=1");
    }

    [Fact]
    public async Task JsonFilePacsExportedFkManifestSource_NullPath_ReturnsNull()
    {
        var sut = new JsonFilePacsExportedFkManifestSource(null);
        var result = await sut.ReadAsync(CancellationToken.None);
        result.Should().BeNull();
    }
}
