using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice BENTON-SYNC-2 unit tests for
/// <see cref="PacsSchemaCatalogHealthReporter"/>. Covers report
/// shape derivation from catalog state, FK confidence breakdown,
/// manifest engagement detection, invariant code summarization,
/// and the human-readable text rendering.
/// </summary>
public sealed class PacsSchemaCatalogHealthReporterTests
{
    private static IPacsSchemaCatalog BuildCatalog(
        bool conversionEngaged = false,
        bool piiEngaged = false,
        bool exportedFkEngaged = false,
        params PacsForeignKey[] foreignKeys)
    {
        var sourceFileHashes = new Dictionary<string, string>
        {
            ["fixture://main"] = "deadbeef",
        };
        if (exportedFkEngaged)
        {
            sourceFileHashes["exported-fk-manifest@/fake/path"] = "v1#event#edges=1";
        }

        var version = new PacsSchemaVersion(
            PacsRelease: "Harris PACS 9.0.4-fixture",
            SourceFileHashes: sourceFileHashes,
            IngestedAt: new DateTime(2026, 4, 30, 17, 0, 0, DateTimeKind.Utc),
            ConversionManifestHash: conversionEngaged
                ? "manifest@/fake#1.0.0#event"
                : "no-conversion-manifest-supplied");

        var table = new PacsTable(
            TableName: "imprv",
            IdentityTuple: new[] { "imprv_id" },
            ConversionEra: PacsConversionEra.Both,
            DictionaryReferences: Array.Empty<PacsDictionaryReference>(),
            PiiClassification: PiiClassification.None,
            ProvenancePath: "fixture://imprv",
            ForeignKeys: foreignKeys);
        var col = new PacsColumn(
            TableName: "imprv",
            ColumnName: "imprv_id",
            DeclaredType: "int",
            Nullable: false,
            ConversionEra: PacsConversionEra.Both,
            DictionaryRef: null,
            PiiClassification: PiiClassification.None,
            ProvenanceLine: "fixture://imprv.imprv_id",
            Notes: string.Empty);

        PacsPiiManifest? piiManifest = piiEngaged
            ? new PacsPiiManifest(
                ManifestPath: "fixture://pii",
                ManifestVersion: "1.0.0",
                ManifestEvent: "fixture-pii-event",
                TableExhaustiveFlags: new HashSet<string>(StringComparer.Ordinal),
                TableEntries: Array.Empty<PacsPiiTableEntry>(),
                ColumnEntries: Array.Empty<PacsPiiColumnEntry>())
            : null;

        var data = new PacsSchemaSourceData(
            Tables: new[] { table },
            Columns: new[] { col },
            Dictionaries: Array.Empty<PacsDictionary>(),
            Version: version,
            PiiManifest: piiManifest);
        var source = new InMemoryPacsSchemaSource(data);
        return PacsSchemaCatalog.BuildAsync(source, CancellationToken.None).GetAwaiter().GetResult();
    }

    private static PacsForeignKey Fk(string name, PacsForeignKeyConfidence confidence) =>
        new(ConstraintName: name,
            SourceTable: "imprv",
            SourceColumns: new[] { "imprv_id" },
            TargetTable: "imprv",
            TargetColumns: new[] { "imprv_id" },
            ProvenanceSource: PacsForeignKeySource.InformationSchema,
            ProvenancePath: $"fixture://fk/{name}",
            Confidence: confidence,
            ConversionEra: PacsConversionEra.Both);

    [Fact]
    public void BuildReport_NullCatalog_Throws()
    {
        var act = () => PacsSchemaCatalogHealthReporter.BuildReport(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void BuildReport_CleanCatalog_PopulatesCoverageAndIdentity()
    {
        var catalog = BuildCatalog();
        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);

        report.PacsRelease.Should().Be("Harris PACS 9.0.4-fixture");
        report.TableCount.Should().Be(1);
        report.ColumnCount.Should().Be(1);
        report.DictionaryCount.Should().Be(0);
        report.IngestedAtUtc.Should().Be(new DateTime(2026, 4, 30, 17, 0, 0, DateTimeKind.Utc));
        report.IsClean.Should().BeTrue();
        report.ErrorCount.Should().Be(0);
    }

    [Fact]
    public void BuildReport_FkConfidenceBreakdown_CountsByConfidenceTier()
    {
        var catalog = BuildCatalog(
            foreignKeys: new[]
            {
                Fk("FK_A", PacsForeignKeyConfidence.Declared),
                Fk("FK_B", PacsForeignKeyConfidence.Declared),
                Fk("FK_C", PacsForeignKeyConfidence.Exported),
                Fk("FK_D", PacsForeignKeyConfidence.InferredByName),
                Fk("FK_E", PacsForeignKeyConfidence.InferredByName),
                Fk("FK_F", PacsForeignKeyConfidence.InferredByName),
            });

        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);

        report.DeclaredFkCount.Should().Be(2);
        report.ExportedFkCount.Should().Be(1);
        report.InferredByNameFkCount.Should().Be(3);
    }

    [Fact]
    public void BuildReport_ManifestEngagement_DetectedForAllThreeFamilies()
    {
        var catalog = BuildCatalog(
            conversionEngaged: true,
            piiEngaged: true,
            exportedFkEngaged: true);

        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);

        report.ConversionManifestEngaged.Should().BeTrue();
        report.PiiManifestEngaged.Should().BeTrue();
        report.ExportedFkManifestEngaged.Should().BeTrue();
    }

    [Fact]
    public void BuildReport_NoManifestsEngaged_AllFlagsFalse()
    {
        var catalog = BuildCatalog();

        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);

        report.ConversionManifestEngaged.Should().BeFalse();
        report.PiiManifestEngaged.Should().BeFalse();
        report.ExportedFkManifestEngaged.Should().BeFalse();
    }

    [Fact]
    public void BuildReport_InvariantSetVersion_Surfaced()
    {
        var catalog = BuildCatalog();
        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);

        report.InvariantSetVersion.Should().Be("1.1.0");
    }

    [Fact]
    public void Render_NullWriter_Throws()
    {
        var report = new PacsSchemaCatalogHealthReport(
            PacsRelease: "X", IngestedAtUtc: DateTime.UtcNow,
            TableCount: 1, ColumnCount: 1, DictionaryCount: 0,
            InvariantSetVersion: "1.1.0",
            ErrorCount: 0, WarningCount: 0, AdvisoryCount: 0, IsClean: true,
            WarningCodeBreakdown: Array.Empty<PacsSchemaInvariantCodeCount>(),
            AdvisoryCodeBreakdown: Array.Empty<PacsSchemaInvariantCodeCount>(),
            DeclaredFkCount: 0, ExportedFkCount: 0, InferredByNameFkCount: 0,
            ConversionManifestEngaged: false, PiiManifestEngaged: false,
            ExportedFkManifestEngaged: false);

        var act = () => PacsSchemaCatalogHealthReporter.Render(null!, report, "x", "y");

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Render_NullReport_Throws()
    {
        using var sw = new StringWriter();
        var act = () => PacsSchemaCatalogHealthReporter.Render(sw, null!, "x", "y");

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Render_HappyPath_ProducesAllFourSections()
    {
        var catalog = BuildCatalog(
            foreignKeys: new[] { Fk("FK_A", PacsForeignKeyConfidence.Declared) });
        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);
        using var sw = new StringWriter();

        PacsSchemaCatalogHealthReporter.Render(sw, report, "WA-Benton", "benton-prod");

        var output = sw.ToString();
        output.Should().Contain("[sync-atlas] Schema catalog health");
        output.Should().Contain("[sync-atlas] Invariant report");
        output.Should().Contain("[sync-atlas] FK confidence breakdown");
        output.Should().Contain("[sync-atlas] Manifest engagement");
        output.Should().Contain("WA-Benton");
        output.Should().Contain("benton-prod");
        output.Should().Contain("Harris PACS 9.0.4-fixture");
        output.Should().Contain("1 tables, 1 columns, 0 dictionaries");
        output.Should().Contain("Declared                      : 1");
    }

    [Fact]
    public void Render_NoExportedFkManifestEngaged_AnnotatesExportedLine()
    {
        var catalog = BuildCatalog(exportedFkEngaged: false);
        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);
        using var sw = new StringWriter();

        PacsSchemaCatalogHealthReporter.Render(sw, report, "x", "y");

        var output = sw.ToString();
        output.Should().Contain("Exported                      : 0");
        output.Should().Contain("(no exported FK manifest engaged)");
    }

    [Fact]
    public void Render_AllManifestsEngaged_LabelsAreEngaged()
    {
        var catalog = BuildCatalog(
            conversionEngaged: true, piiEngaged: true, exportedFkEngaged: true);
        var report = PacsSchemaCatalogHealthReporter.BuildReport(catalog);
        using var sw = new StringWriter();

        PacsSchemaCatalogHealthReporter.Render(sw, report, "x", "y");

        var output = sw.ToString();
        output.Should().Contain("Conversion manifest           : engaged");
        output.Should().Contain("PII manifest                  : engaged");
        output.Should().Contain("Exported FK manifest          : engaged");
    }

    [Fact]
    public void Render_NullPacsRelease_ShowsNotDeclared()
    {
        var report = new PacsSchemaCatalogHealthReport(
            PacsRelease: null, IngestedAtUtc: DateTime.UtcNow,
            TableCount: 0, ColumnCount: 0, DictionaryCount: 0,
            InvariantSetVersion: "1.1.0",
            ErrorCount: 0, WarningCount: 0, AdvisoryCount: 0, IsClean: true,
            WarningCodeBreakdown: Array.Empty<PacsSchemaInvariantCodeCount>(),
            AdvisoryCodeBreakdown: Array.Empty<PacsSchemaInvariantCodeCount>(),
            DeclaredFkCount: 0, ExportedFkCount: 0, InferredByNameFkCount: 0,
            ConversionManifestEngaged: false, PiiManifestEngaged: false,
            ExportedFkManifestEngaged: false);
        using var sw = new StringWriter();

        PacsSchemaCatalogHealthReporter.Render(sw, report, "x", "y");

        sw.ToString().Should().Contain("PacsRelease                   : (not declared)");
    }
}
