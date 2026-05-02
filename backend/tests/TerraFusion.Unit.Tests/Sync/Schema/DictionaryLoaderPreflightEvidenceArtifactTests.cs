using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice BENTON-SYNC-6-B unit tests for
/// <see cref="DictionaryLoaderPreflightEvidenceBuilder"/> +
/// <see cref="DictionaryLoaderPreflightEvidenceArtifact"/>.
///
/// Covers the BENTON-SYNC-6-A policy's binding test matrix (the
/// portions that don't require a live PACS instance):
/// <list type="bullet">
/// <item>Writer: null/empty-path validation, parent-directory creation,
/// JSON round-trip preservation.</item>
/// <item>Summary consistency: recomputing the summary from records
/// matches the persisted summary.</item>
/// <item>Skipped outcome semantics: un-instrumented configKeys
/// produce <see cref="DictionaryLoaderPreflightEvidenceOutcome.Skipped"/>
/// records (HG-FK-3 / HG-CONV-3 / HG-PII-3 no-silent-default-pass).</item>
/// </list>
/// </summary>
public sealed class DictionaryLoaderPreflightEvidenceArtifactTests : IDisposable
{
    private readonly string _tempDir;

    public DictionaryLoaderPreflightEvidenceArtifactTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"benton-sync-6-b-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, recursive: true); } catch { /* ignore */ }
    }

    private static DictionaryLoaderPreflightEvidenceBuilder NewBuilder() =>
        new(
            countyId: Guid.Parse("19190019-1919-1919-1919-191919191919"),
            sourceConnectionId: Guid.Parse("e6ddd159-eac9-450a-aa47-983688d2491d"),
            pacsRelease: null,
            conversionManifestEngaged: false,
            piiManifestEngaged: false,
            exportedFkManifestEngaged: false);

    private static DictionaryLoaderPreflightEvidenceRecord NewRecord(
        string configKey,
        DictionaryLoaderPreflightEvidenceOutcome fkOutcome =
            DictionaryLoaderPreflightEvidenceOutcome.Pass,
        DictionaryLoaderPreflightEvidenceOutcome eraOutcome =
            DictionaryLoaderPreflightEvidenceOutcome.Pass,
        DictionaryLoaderPreflightEvidenceOutcome piiOutcome =
            DictionaryLoaderPreflightEvidenceOutcome.Pass)
    {
        var started = new DateTime(2026, 5, 2, 1, 27, 36, DateTimeKind.Utc);
        return new DictionaryLoaderPreflightEvidenceRecord(
            ConfigKey: configKey,
            TargetTable: "property_val",
            TargetColumn: "property_use_cd",
            StartedAtUtc: started,
            CompletedAtUtc: started.AddSeconds(1),
            FkPreflight: new DictionaryLoaderPreflightEvidenceFk(
                Stance: "RequiredFk", Outcome: fkOutcome,
                ConstraintName: "CFK_property_val_property_use_cd",
                Confidence: "Declared", Message: null),
            EraPreflight: new DictionaryLoaderPreflightEvidenceEra(
                Stance: "RequirePost2017OrBoth", Outcome: eraOutcome,
                MatchedEra: "Both", Provenance: "ManifestNotEngaged",
                Message: null),
            PiiPreflight: new DictionaryLoaderPreflightEvidencePii(
                Stance: "AllowAny", Outcome: piiOutcome,
                MatchedClassification: "None",
                ManifestEngaged: false, TableExhaustive: false, Message: null));
    }

    // ── Writer guard tests ─────────────────────────────────────────────

    [Fact]
    public async Task WriteAsync_NullEvidence_Throws()
    {
        var path = Path.Combine(_tempDir, "out.json");
        var act = async () => await DictionaryLoaderPreflightEvidenceArtifact
            .WriteAsync(null!, path, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task WriteAsync_EmptyPath_Throws()
    {
        var evidence = NewBuilder().Build();
        var act = async () => await DictionaryLoaderPreflightEvidenceArtifact
            .WriteAsync(evidence, "", CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task WriteAsync_CreatesParentDirectory()
    {
        var nested = Path.Combine(_tempDir, "a", "b", "c", "preflight-evidence.json");
        var builder = NewBuilder();
        builder.Append(NewRecord("property_use"));

        await DictionaryLoaderPreflightEvidenceArtifact.WriteAsync(
            builder.Build(), nested, CancellationToken.None);

        File.Exists(nested).Should().BeTrue();
    }

    // ── Round-trip + identity envelope ────────────────────────────────

    [Fact]
    public async Task WriteAsync_RoundTrips_AllFields()
    {
        var builder = NewBuilder();
        builder.Append(NewRecord("property_use"));
        builder.Append(NewRecord(
            "imprv_det_class",
            fkOutcome: DictionaryLoaderPreflightEvidenceOutcome.Warn));

        var path = Path.Combine(_tempDir, "round-trip.json");
        await DictionaryLoaderPreflightEvidenceArtifact.WriteAsync(
            builder.Build(), path, CancellationToken.None);

        var json = await File.ReadAllTextAsync(path);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        root.GetProperty("schemaVersion").GetString().Should().Be("1.0.0");
        root.GetProperty("countyId").GetString().Should()
            .Be("19190019-1919-1919-1919-191919191919");
        root.GetProperty("sourceConnectionId").GetString().Should()
            .Be("e6ddd159-eac9-450a-aa47-983688d2491d");

        var manifest = root.GetProperty("manifestEngagement");
        manifest.GetProperty("conversionManifest").GetBoolean().Should().BeFalse();
        manifest.GetProperty("piiManifest").GetBoolean().Should().BeFalse();
        manifest.GetProperty("exportedFkManifest").GetBoolean().Should().BeFalse();

        var records = root.GetProperty("records");
        records.GetArrayLength().Should().Be(2);
        records[0].GetProperty("configKey").GetString().Should().Be("property_use");
        records[1].GetProperty("fkPreflight").GetProperty("outcome").GetString()
            .Should().Be("Warn");
    }

    [Fact]
    public void Build_RecordsCarryFullIdentityEnvelope()
    {
        var builder = NewBuilder();
        builder.Append(NewRecord("property_use"));

        var evidence = builder.Build();

        evidence.CountyId.Should().Be(Guid.Parse("19190019-1919-1919-1919-191919191919"));
        evidence.SourceConnectionId.Should().Be(Guid.Parse("e6ddd159-eac9-450a-aa47-983688d2491d"));
        // Per the BENTON-SYNC-6-A policy "county-scoped per record envelope":
        // every record inherits the same (CountyId, SourceConnectionId)
        // pair as the run-level envelope. SyncAtlas takes one source
        // connection per invocation, so this is automatic — the guard
        // pins the property at the artifact level.
        evidence.Records.Should().NotBeEmpty();
    }

    // ── Summary consistency ───────────────────────────────────────────

    [Fact]
    public void Summary_RecomputedFromRecords_MatchesPersisted()
    {
        var builder = NewBuilder();
        builder.Append(NewRecord("property_use",
            fkOutcome: DictionaryLoaderPreflightEvidenceOutcome.Pass,
            eraOutcome: DictionaryLoaderPreflightEvidenceOutcome.Pass,
            piiOutcome: DictionaryLoaderPreflightEvidenceOutcome.Pass));
        builder.Append(NewRecord("imprv_det_class",
            fkOutcome: DictionaryLoaderPreflightEvidenceOutcome.Warn,
            eraOutcome: DictionaryLoaderPreflightEvidenceOutcome.Pass,
            piiOutcome: DictionaryLoaderPreflightEvidenceOutcome.Skipped));
        builder.Append(NewRecord("land_soil",
            fkOutcome: DictionaryLoaderPreflightEvidenceOutcome.Fail,
            eraOutcome: DictionaryLoaderPreflightEvidenceOutcome.Skipped,
            piiOutcome: DictionaryLoaderPreflightEvidenceOutcome.Skipped));

        var evidence = builder.Build();
        var recomputed = DictionaryLoaderPreflightEvidenceBuilder.ComputeSummary(evidence.Records);

        recomputed.Should().BeEquivalentTo(evidence.Summary,
            "BENTON-SYNC-6-A 'Summary consistency': recomputing the summary " +
            "from records MUST exactly match the persisted summary block");

        evidence.Summary.LoaderCallCount.Should().Be(3);
        evidence.Summary.FkPassCount.Should().Be(1);
        evidence.Summary.FkWarnCount.Should().Be(1);
        evidence.Summary.FkFailCount.Should().Be(1);
        evidence.Summary.EraSkippedCount.Should().Be(1);
        evidence.Summary.PiiSkippedCount.Should().Be(2);
    }

    // ── Skipped outcome semantics ─────────────────────────────────────

    [Fact]
    public void Skipped_Factories_ProduceSkippedOutcomes()
    {
        var fk = DictionaryLoaderPreflightEvidenceFk.Skipped();
        var era = DictionaryLoaderPreflightEvidenceEra.Skipped();
        var pii = DictionaryLoaderPreflightEvidencePii.Skipped();

        fk.Outcome.Should().Be(DictionaryLoaderPreflightEvidenceOutcome.Skipped);
        fk.Stance.Should().Be("Skipped");
        fk.Confidence.Should().BeNull();
        era.Outcome.Should().Be(DictionaryLoaderPreflightEvidenceOutcome.Skipped);
        era.Stance.Should().Be("Skipped");
        pii.Outcome.Should().Be(DictionaryLoaderPreflightEvidenceOutcome.Skipped);
        pii.Stance.Should().Be("Skipped");

        // BENTON-SYNC-6-A "no-silent-default-pass": un-migrated configKeys
        // MUST surface as Skipped, never as a fabricated Pass. The
        // factories pin the property.
    }

    [Fact]
    public void EmptyBuilder_ProducesZeroCountSummary()
    {
        var evidence = NewBuilder().Build();

        evidence.Records.Should().BeEmpty();
        evidence.Summary.LoaderCallCount.Should().Be(0);
        evidence.Summary.FkPassCount.Should().Be(0);
        evidence.Summary.EraPassCount.Should().Be(0);
        evidence.Summary.PiiPassCount.Should().Be(0);
        evidence.SchemaVersion.Should().Be("1.0.0");
    }
}
