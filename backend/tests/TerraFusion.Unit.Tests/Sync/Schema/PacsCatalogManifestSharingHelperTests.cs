using System;
using System.IO;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C54-MULTI-C unit tests for
/// <see cref="PacsCatalogManifestSharingHelper"/>. Covers the
/// happy-path share for each manifest family, argument validation,
/// hash determinism, and receipt content.
/// </summary>
public sealed class PacsCatalogManifestSharingHelperTests : IDisposable
{
    private readonly string _tempDir;
    private readonly PacsCatalogIdentity _sourceIdentity;
    private readonly PacsCatalogIdentity _targetIdentity;

    public PacsCatalogManifestSharingHelperTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"c54-multi-c-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
        _sourceIdentity = new PacsCatalogIdentity("WA-Benton",  "benton-prod",  "Harris-9.0", new string('a', 64));
        _targetIdentity = new PacsCatalogIdentity("WA-Yakima",  "yakima-prod",  "Harris-9.0", new string('b', 64));
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, recursive: true); } catch { /* ignore */ }
    }

    private string WriteFile(string name, string content)
    {
        var path = Path.Combine(_tempDir, name);
        File.WriteAllText(path, content);
        return path;
    }

    [Fact]
    public async Task SharePiiManifestAsync_HappyPath_CopiesAndReturnsReceipt()
    {
        var source = WriteFile("benton-pii.json", """
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026-PII",
              "columns": [
                { "table": "chg_of_owner", "column": "grantor_cv",
                  "classification": "Direct", "reason": "Grantor name." }
              ]
            }
            """);
        var target = Path.Combine(_tempDir, "yakima-pii.json");

        var receipt = await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, target, _sourceIdentity, _targetIdentity, CancellationToken.None);

        File.Exists(target).Should().BeTrue();
        File.ReadAllText(target).Should().Contain("grantor_cv");
        receipt.ManifestKind.Should().Be("pii");
        receipt.SourcePath.Should().Be(source);
        receipt.TargetPath.Should().Be(target);
        receipt.SourceSha256.Should().HaveLength(64);
        receipt.TargetSha256.Should().Be(receipt.SourceSha256, "clean copy → identical hash");
        receipt.SourceCatalogIdentity.CountyId.Should().Be("WA-Benton");
        receipt.TargetCatalogIdentity.CountyId.Should().Be("WA-Yakima");
        receipt.SharedAtUtc.Should().BeBefore(DateTime.UtcNow.AddSeconds(1));
    }

    [Fact]
    public async Task ShareConversionManifestAsync_HappyPath()
    {
        var source = WriteFile("benton-conv.json", """
            {
              "manifestVersion": "1.0.0",
              "conversionEvent": "Benton-2017",
              "tables": [
                { "name": "pp_seg_history", "era": "Pre2017",
                  "reason": "Conversion-only snapshot." }
              ]
            }
            """);
        var target = Path.Combine(_tempDir, "yakima-conv.json");

        var receipt = await PacsCatalogManifestSharingHelper.ShareConversionManifestAsync(
            source, target, _sourceIdentity, _targetIdentity, CancellationToken.None);

        receipt.ManifestKind.Should().Be("conversion");
        File.Exists(target).Should().BeTrue();
    }

    [Fact]
    public async Task ShareExportedFkManifestAsync_HappyPath()
    {
        var source = WriteFile("benton-fk.json", """
            {
              "manifestVersion": "1.0.0",
              "manifestEvent": "Benton-2026-FK",
              "edges": [
                {
                  "constraintName": "EXP_x",
                  "sourceTable": "imprv",
                  "sourceColumns": ["primary_use_cd"],
                  "targetTable": "property_use",
                  "targetColumns": ["property_use_cd"],
                  "reason": "promoted"
                }
              ]
            }
            """);
        var target = Path.Combine(_tempDir, "yakima-fk.json");

        var receipt = await PacsCatalogManifestSharingHelper.ShareExportedFkManifestAsync(
            source, target, _sourceIdentity, _targetIdentity, CancellationToken.None);

        receipt.ManifestKind.Should().Be("exported-fk");
        File.Exists(target).Should().BeTrue();
    }

    [Fact]
    public async Task SharePiiManifestAsync_MalformedJson_ThrowsAndDoesNotProduceReceipt()
    {
        var source = WriteFile("malformed.json", "{ not valid json");
        var target = Path.Combine(_tempDir, "target.json");

        var act = async () => await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, target, _sourceIdentity, _targetIdentity, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidDataException>();
        // Note: the file IS copied before validation runs, so the
        // target may exist on disk even though the share "did not
        // complete" from the operator's POV. That's expected — the
        // receipt is the success signal; the absence of one means
        // the share is incomplete and the operator may inspect the
        // partial copy if desired.
    }

    [Fact]
    public async Task SharePiiManifestAsync_MissingSource_Throws()
    {
        var source = Path.Combine(_tempDir, "does-not-exist.json");
        var target = Path.Combine(_tempDir, "target.json");

        var act = async () => await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, target, _sourceIdentity, _targetIdentity, CancellationToken.None);

        await act.Should().ThrowAsync<FileNotFoundException>();
    }

    [Fact]
    public async Task SharePiiManifestAsync_SamePathForSourceAndTarget_Throws()
    {
        var path = WriteFile("only.json", """{"manifestVersion":"1","manifestEvent":"x"}""");

        var act = async () => await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            path, path, _sourceIdentity, _targetIdentity, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*identical*distinct paths*");
    }

    [Fact]
    public async Task SharePiiManifestAsync_EmptySourcePath_Throws()
    {
        var target = Path.Combine(_tempDir, "target.json");

        var act = async () => await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            "", target, _sourceIdentity, _targetIdentity, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task SharePiiManifestAsync_EmptyTargetPath_Throws()
    {
        var source = WriteFile("src.json", """{"manifestVersion":"1","manifestEvent":"x"}""");

        var act = async () => await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, "", _sourceIdentity, _targetIdentity, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task SharePiiManifestAsync_NullIdentity_Throws()
    {
        var source = WriteFile("src.json", """{"manifestVersion":"1","manifestEvent":"x"}""");
        var target = Path.Combine(_tempDir, "target.json");

        var act1 = async () => await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, target, null!, _targetIdentity, CancellationToken.None);
        var act2 = async () => await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, target, _sourceIdentity, null!, CancellationToken.None);

        await act1.Should().ThrowAsync<ArgumentNullException>();
        await act2.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task SharePiiManifestAsync_CreatesParentDirectoryWhenMissing()
    {
        var source = WriteFile("src.json", """
            { "manifestVersion": "1.0.0", "manifestEvent": "x" }
            """);
        var nested = Path.Combine(_tempDir, "deep", "nested", "target.json");

        var receipt = await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, nested, _sourceIdentity, _targetIdentity, CancellationToken.None);

        File.Exists(nested).Should().BeTrue();
        receipt.TargetPath.Should().Be(nested);
    }

    [Fact]
    public async Task SharePiiManifestAsync_HashesDeterministicAcrossRuns()
    {
        var source = WriteFile("src.json", """
            { "manifestVersion": "1.0.0", "manifestEvent": "x" }
            """);
        var target1 = Path.Combine(_tempDir, "t1.json");
        var target2 = Path.Combine(_tempDir, "t2.json");

        var r1 = await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, target1, _sourceIdentity, _targetIdentity, CancellationToken.None);
        var r2 = await PacsCatalogManifestSharingHelper.SharePiiManifestAsync(
            source, target2, _sourceIdentity, _targetIdentity, CancellationToken.None);

        r1.SourceSha256.Should().Be(r2.SourceSha256);
        r1.TargetSha256.Should().Be(r2.TargetSha256);
    }
}
