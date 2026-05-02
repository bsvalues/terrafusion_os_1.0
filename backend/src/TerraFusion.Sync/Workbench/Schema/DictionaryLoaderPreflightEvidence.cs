using System;
using System.Collections.Generic;
using System.Linq;
using TerraFusion.Sync.Workbench.Pacs;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice BENTON-SYNC-6-B: in-memory accumulator for dictionary-loader
/// FK / era / PII preflight outcomes during a single SyncAtlas
/// invocation. Per the
/// <c>docs/sync/dictionary-loader-preflight-evidence-policy.md</c>
/// policy (BENTON-SYNC-6-A), each loader call produces one record
/// with the three preflight outcomes; the run produces one
/// <see cref="DictionaryLoaderPreflightEvidence"/> document.
///
/// <para>Pure in-memory state — no I/O. Persistence is the
/// <see cref="DictionaryLoaderPreflightEvidenceArtifact"/> writer's
/// job. Mirrors the
/// <see cref="PacsSchemaCatalogHealthReporter"/> /
/// <see cref="PacsSchemaInvariantReportArtifact"/> split.</para>
///
/// <para>HG7 fail-closed: the builder finalizes whatever records it
/// holds at the moment of finalization, even if a later preflight
/// throws. Caller is expected to pass the builder up to the call site
/// that owns finalization (typically a try/finally block) so a
/// failed run still produces a partial artifact recording the
/// loader call that failed.</para>
/// </summary>
public sealed class DictionaryLoaderPreflightEvidenceBuilder
{
    private readonly List<DictionaryLoaderPreflightEvidenceRecord> _records = new();
    private DateTime? _runStartedAtUtc;

    /// <summary>Catalog identity envelope (operator-supplied).</summary>
    public Guid CountyId { get; }

    /// <summary>Catalog identity envelope (operator-supplied).</summary>
    public Guid SourceConnectionId { get; }

    /// <summary>Catalog metadata snapshot. May be null when not declared.</summary>
    public string? PacsRelease { get; }

    /// <summary>Manifest engagement snapshot from the catalog.</summary>
    public bool ConversionManifestEngaged { get; }

    /// <summary>Manifest engagement snapshot from the catalog.</summary>
    public bool PiiManifestEngaged { get; }

    /// <summary>Manifest engagement snapshot from the catalog.</summary>
    public bool ExportedFkManifestEngaged { get; }

    /// <summary>Records appended so far. Snapshot semantics.</summary>
    public IReadOnlyList<DictionaryLoaderPreflightEvidenceRecord> Records => _records;

    public DictionaryLoaderPreflightEvidenceBuilder(
        Guid countyId,
        Guid sourceConnectionId,
        string? pacsRelease,
        bool conversionManifestEngaged,
        bool piiManifestEngaged,
        bool exportedFkManifestEngaged)
    {
        CountyId = countyId;
        SourceConnectionId = sourceConnectionId;
        PacsRelease = pacsRelease;
        ConversionManifestEngaged = conversionManifestEngaged;
        PiiManifestEngaged = piiManifestEngaged;
        ExportedFkManifestEngaged = exportedFkManifestEngaged;
    }

    /// <summary>
    /// Append one fully-populated record to the evidence run. The
    /// run's <c>RunId</c> timestamp is stamped from the first
    /// record's <see cref="DictionaryLoaderPreflightEvidenceRecord.StartedAtUtc"/>.
    /// </summary>
    public void Append(DictionaryLoaderPreflightEvidenceRecord record)
    {
        if (record is null) throw new ArgumentNullException(nameof(record));
        _runStartedAtUtc ??= record.StartedAtUtc;
        _records.Add(record);
    }

    /// <summary>
    /// Snapshot the current builder state into an immutable
    /// <see cref="DictionaryLoaderPreflightEvidence"/> document.
    /// Safe to call multiple times — useful from a finally block
    /// that needs to write whatever was reached before a throw.
    /// </summary>
    public DictionaryLoaderPreflightEvidence Build()
    {
        var summary = ComputeSummary(_records);
        var runId = (_runStartedAtUtc ?? DateTime.UtcNow).ToString("O");

        return new DictionaryLoaderPreflightEvidence(
            SchemaVersion: "1.0.0",
            RunId: runId,
            CountyId: CountyId,
            SourceConnectionId: SourceConnectionId,
            PacsRelease: PacsRelease,
            ManifestEngagement: new DictionaryLoaderPreflightEvidenceManifestEngagement(
                ConversionManifest: ConversionManifestEngaged,
                PiiManifest: PiiManifestEngaged,
                ExportedFkManifest: ExportedFkManifestEngaged),
            Records: _records.ToArray(),
            Summary: summary);
    }

    /// <summary>
    /// Compute the summary block from the records. Pure function so
    /// the writer test can verify
    /// <c>Summary_RecomputedFromRecords_MatchesPersisted</c>.
    /// </summary>
    public static DictionaryLoaderPreflightEvidenceSummary ComputeSummary(
        IReadOnlyList<DictionaryLoaderPreflightEvidenceRecord> records)
    {
        if (records is null) throw new ArgumentNullException(nameof(records));
        return new DictionaryLoaderPreflightEvidenceSummary(
            LoaderCallCount: records.Count,
            FkPassCount:     records.Count(r => r.FkPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Pass),
            FkWarnCount:     records.Count(r => r.FkPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Warn),
            FkFailCount:     records.Count(r => r.FkPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Fail),
            FkSkippedCount:  records.Count(r => r.FkPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Skipped),
            EraPassCount:    records.Count(r => r.EraPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Pass),
            EraWarnCount:    records.Count(r => r.EraPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Warn),
            EraFailCount:    records.Count(r => r.EraPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Fail),
            EraSkippedCount: records.Count(r => r.EraPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Skipped),
            PiiPassCount:    records.Count(r => r.PiiPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Pass),
            PiiWarnCount:    records.Count(r => r.PiiPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Warn),
            PiiFailCount:    records.Count(r => r.PiiPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Fail),
            PiiSkippedCount: records.Count(r => r.PiiPreflight.Outcome == DictionaryLoaderPreflightEvidenceOutcome.Skipped));
    }
}

/// <summary>
/// Slice BENTON-SYNC-6-B: top-level evidence document for a single
/// SyncAtlas dictionary-loader invocation. Logical shape pinned by
/// <c>docs/sync/dictionary-loader-preflight-evidence-policy.md</c>.
/// </summary>
public sealed record DictionaryLoaderPreflightEvidence(
    string SchemaVersion,
    string RunId,
    Guid CountyId,
    Guid SourceConnectionId,
    string? PacsRelease,
    DictionaryLoaderPreflightEvidenceManifestEngagement ManifestEngagement,
    IReadOnlyList<DictionaryLoaderPreflightEvidenceRecord> Records,
    DictionaryLoaderPreflightEvidenceSummary Summary);

/// <summary>Snapshot of catalog manifest engagement at evidence-run start.</summary>
public sealed record DictionaryLoaderPreflightEvidenceManifestEngagement(
    bool ConversionManifest,
    bool PiiManifest,
    bool ExportedFkManifest);

/// <summary>One loader-call record with the three preflight outcomes.</summary>
public sealed record DictionaryLoaderPreflightEvidenceRecord(
    string ConfigKey,
    string TargetTable,
    string TargetColumn,
    DateTime StartedAtUtc,
    DateTime CompletedAtUtc,
    DictionaryLoaderPreflightEvidenceFk FkPreflight,
    DictionaryLoaderPreflightEvidenceEra EraPreflight,
    DictionaryLoaderPreflightEvidencePii PiiPreflight);

/// <summary>FK preflight outcome captured for a single loader call.</summary>
public sealed record DictionaryLoaderPreflightEvidenceFk(
    string Stance,
    DictionaryLoaderPreflightEvidenceOutcome Outcome,
    string? ConstraintName,
    string? Confidence,
    string? Message)
{
    public static DictionaryLoaderPreflightEvidenceFk Skipped() =>
        new("Skipped", DictionaryLoaderPreflightEvidenceOutcome.Skipped, null, null, null);

    public static DictionaryLoaderPreflightEvidenceFk From(
        DictionaryLoaderPreflightStance stance,
        DictionaryLoaderPreflightResult result)
    {
        if (result is null) throw new ArgumentNullException(nameof(result));
        return new DictionaryLoaderPreflightEvidenceFk(
            Stance: stance.ToString(),
            Outcome: ToEvidence(result.Outcome),
            ConstraintName: result.MatchedEdge?.ConstraintName,
            Confidence: result.MatchedEdge is null ? null : result.MatchedEdge.Confidence.ToString(),
            Message: string.IsNullOrEmpty(result.Message) ? null : result.Message);
    }

    private static DictionaryLoaderPreflightEvidenceOutcome ToEvidence(
        DictionaryLoaderPreflightOutcome outcome) => outcome switch
    {
        DictionaryLoaderPreflightOutcome.Pass => DictionaryLoaderPreflightEvidenceOutcome.Pass,
        DictionaryLoaderPreflightOutcome.Warn => DictionaryLoaderPreflightEvidenceOutcome.Warn,
        DictionaryLoaderPreflightOutcome.Fail => DictionaryLoaderPreflightEvidenceOutcome.Fail,
        _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, null),
    };
}

/// <summary>Era preflight outcome captured for a single loader call.</summary>
public sealed record DictionaryLoaderPreflightEvidenceEra(
    string Stance,
    DictionaryLoaderPreflightEvidenceOutcome Outcome,
    string? MatchedEra,
    string? Provenance,
    string? Message)
{
    public static DictionaryLoaderPreflightEvidenceEra Skipped() =>
        new("Skipped", DictionaryLoaderPreflightEvidenceOutcome.Skipped, null, null, null);

    public static DictionaryLoaderPreflightEvidenceEra From(
        ConversionEraPreflightStance stance,
        ConversionEraPreflightResult result)
    {
        if (result is null) throw new ArgumentNullException(nameof(result));
        return new DictionaryLoaderPreflightEvidenceEra(
            Stance: stance.ToString(),
            Outcome: ToEvidence(result.Outcome),
            MatchedEra: result.MatchedEra.ToString(),
            Provenance: result.Provenance.ToString(),
            Message: string.IsNullOrEmpty(result.Message) ? null : result.Message);
    }

    private static DictionaryLoaderPreflightEvidenceOutcome ToEvidence(
        ConversionEraPreflightOutcome outcome) => outcome switch
    {
        ConversionEraPreflightOutcome.Pass => DictionaryLoaderPreflightEvidenceOutcome.Pass,
        ConversionEraPreflightOutcome.Warn => DictionaryLoaderPreflightEvidenceOutcome.Warn,
        ConversionEraPreflightOutcome.Fail => DictionaryLoaderPreflightEvidenceOutcome.Fail,
        _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, null),
    };
}

/// <summary>PII preflight outcome captured for a single loader call.</summary>
public sealed record DictionaryLoaderPreflightEvidencePii(
    string Stance,
    DictionaryLoaderPreflightEvidenceOutcome Outcome,
    string? MatchedClassification,
    bool ManifestEngaged,
    bool TableExhaustive,
    string? Message)
{
    public static DictionaryLoaderPreflightEvidencePii Skipped() =>
        new("Skipped", DictionaryLoaderPreflightEvidenceOutcome.Skipped, null, false, false, null);

    public static DictionaryLoaderPreflightEvidencePii From(
        PiiClassificationPreflightStance stance,
        PiiClassificationPreflightResult result)
    {
        if (result is null) throw new ArgumentNullException(nameof(result));
        return new DictionaryLoaderPreflightEvidencePii(
            Stance: stance.ToString(),
            Outcome: ToEvidence(result.Outcome),
            MatchedClassification: result.MatchedClassification.ToString(),
            ManifestEngaged: result.ManifestEngaged,
            TableExhaustive: result.TableExhaustive,
            Message: string.IsNullOrEmpty(result.Message) ? null : result.Message);
    }

    private static DictionaryLoaderPreflightEvidenceOutcome ToEvidence(
        PiiClassificationPreflightOutcome outcome) => outcome switch
    {
        PiiClassificationPreflightOutcome.Pass => DictionaryLoaderPreflightEvidenceOutcome.Pass,
        PiiClassificationPreflightOutcome.Warn => DictionaryLoaderPreflightEvidenceOutcome.Warn,
        PiiClassificationPreflightOutcome.Fail => DictionaryLoaderPreflightEvidenceOutcome.Fail,
        _ => throw new ArgumentOutOfRangeException(nameof(outcome), outcome, null),
    };
}

/// <summary>
/// Aggregated outcome counts for the run. Internally consistent
/// with <c>Records</c>; recompute via
/// <see cref="DictionaryLoaderPreflightEvidenceBuilder.ComputeSummary"/>
/// to verify.
/// </summary>
public sealed record DictionaryLoaderPreflightEvidenceSummary(
    int LoaderCallCount,
    int FkPassCount,
    int FkWarnCount,
    int FkFailCount,
    int FkSkippedCount,
    int EraPassCount,
    int EraWarnCount,
    int EraFailCount,
    int EraSkippedCount,
    int PiiPassCount,
    int PiiWarnCount,
    int PiiFailCount,
    int PiiSkippedCount);

/// <summary>
/// Slice BENTON-SYNC-6-B: outcome enum used in the evidence
/// artifact. Distinct from the per-preflight
/// <c>*PreflightOutcome</c> enums because the artifact carries
/// an additional <see cref="Skipped"/> value (an un-migrated
/// configKey produces a Skipped record honoring HG-FK-3 /
/// HG-CONV-3 / HG-PII-3 no-silent-default-pass).
/// </summary>
public enum DictionaryLoaderPreflightEvidenceOutcome
{
    Pass = 1,
    Warn = 2,
    Fail = 3,
    Skipped = 4,
}
