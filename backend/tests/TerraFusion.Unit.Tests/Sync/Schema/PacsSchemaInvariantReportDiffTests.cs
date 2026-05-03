using System;
using System.Linq;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C53-CONS-E unit tests for
/// <see cref="PacsSchemaInvariantReportDiff"/>. Covers:
/// null-baseline behavior, identical reports, additions only,
/// removals only, severity changes, count deltas, mixed cases,
/// and the IsUnchanged convenience flag.
/// </summary>
public sealed class PacsSchemaInvariantReportDiffTests
{
    private static readonly DateTime PrevTs = new(2026, 4, 30, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime CurrTs = new(2026, 4, 30, 13, 0, 0, DateTimeKind.Utc);

    private static PacsSchemaInvariantResult Row(
        PacsSchemaInvariantSeverity severity, string code,
        string? table = null, string? column = null) =>
        new(severity, code, $"{code}: ...", table, column, $"prov:{code}");

    private static PacsSchemaInvariantReport Report(string version, DateTime ts,
        params PacsSchemaInvariantResult[] rows) =>
        new(version, ts, rows);

    [Fact]
    public void Compute_NullCurrent_Throws()
    {
        var prev = Report("1.0.0", PrevTs);
        var act = () => PacsSchemaInvariantReportDiff.Compute(prev, null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Compute_NullPrevious_TreatsEveryCurrentRowAsAdded()
    {
        var current = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Warning, "DICT-005", "lookup"),
            Row(PacsSchemaInvariantSeverity.Warning, "FK-006", "imprv"));

        var diff = PacsSchemaInvariantReportDiff.Compute(null, current);

        diff.PreviousInvariantSetVersion.Should().Be("(none)");
        diff.CurrentInvariantSetVersion.Should().Be("1.1.0");
        diff.Added.Should().HaveCount(2);
        diff.Removed.Should().BeEmpty();
        diff.SeverityChanged.Should().BeEmpty();
        diff.WarningDelta.Previous.Should().Be(0);
        diff.WarningDelta.Current.Should().Be(2);
        diff.WarningDelta.Diff.Should().Be(2);
        diff.IsUnchanged.Should().BeFalse();
    }

    [Fact]
    public void Compute_IdenticalReports_AreUnchanged()
    {
        var rows = new[]
        {
            Row(PacsSchemaInvariantSeverity.Warning, "DICT-005", "lookup"),
            Row(PacsSchemaInvariantSeverity.Warning, "FK-006", "imprv"),
        };
        var prev = Report("1.1.0", PrevTs, rows);
        var current = Report("1.1.0", CurrTs, rows);

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.IsUnchanged.Should().BeTrue();
        diff.Added.Should().BeEmpty();
        diff.Removed.Should().BeEmpty();
        diff.SeverityChanged.Should().BeEmpty();
        diff.WarningDelta.Diff.Should().Be(0);
    }

    [Fact]
    public void Compute_AdditionsOnly_AppearInAdded()
    {
        var prev = Report("1.1.0", PrevTs);
        var current = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Error, "FK-002", "ghost", null));

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.Added.Should().ContainSingle().Which.Code.Should().Be("FK-002");
        diff.Removed.Should().BeEmpty();
        diff.ErrorDelta.Diff.Should().Be(1);
        diff.IsUnchanged.Should().BeFalse();
    }

    [Fact]
    public void Compute_RemovalsOnly_AppearInRemoved()
    {
        var prev = Report("1.1.0", PrevTs,
            Row(PacsSchemaInvariantSeverity.Warning, "DICT-005", "stale_dict"));
        var current = Report("1.1.0", CurrTs);

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.Added.Should().BeEmpty();
        diff.Removed.Should().ContainSingle().Which.Code.Should().Be("DICT-005");
        diff.WarningDelta.Diff.Should().Be(-1);
        diff.IsUnchanged.Should().BeFalse();
    }

    [Fact]
    public void Compute_SeverityFlip_AppearsInSeverityChanged()
    {
        // Same (Code, TableName, ColumnName); severity changed
        // (e.g., suppression list demoted Error → Warning).
        var prev = Report("1.1.0", PrevTs,
            Row(PacsSchemaInvariantSeverity.Error, "FK-002", "ghost"));
        var current = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Warning, "FK-002", "ghost"));

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.Added.Should().BeEmpty();
        diff.Removed.Should().BeEmpty();
        diff.SeverityChanged.Should().ContainSingle()
            .Which.Should().Match<PacsSchemaInvariantSeverityChange>(c =>
                c.Code == "FK-002" &&
                c.TableName == "ghost" &&
                c.PreviousSeverity == PacsSchemaInvariantSeverity.Error &&
                c.CurrentSeverity == PacsSchemaInvariantSeverity.Warning);
        diff.ErrorDelta.Diff.Should().Be(-1);
        diff.WarningDelta.Diff.Should().Be(1);
        diff.IsUnchanged.Should().BeFalse();
    }

    [Fact]
    public void Compute_KeysByCodeAndTableAndColumn_NotMessageOrProvenance()
    {
        // Same (Code, table, col) but different Message and
        // Provenance — should still match (no Added/Removed),
        // and same severity so SeverityChanged is empty too.
        var prev = Report("1.1.0", PrevTs,
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Warning, "DICT-005",
                "old-message", "lookup", null, "old:provenance"));
        var current = Report("1.1.0", CurrTs,
            new PacsSchemaInvariantResult(PacsSchemaInvariantSeverity.Warning, "DICT-005",
                "new-message-different", "lookup", null, "new:provenance-different"));

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.IsUnchanged.Should().BeTrue();
    }

    [Fact]
    public void Compute_DifferentColumnSamePbCode_AreDistinctRows()
    {
        // Same code, different ColumnName → different rows.
        var prev = Report("1.1.0", PrevTs,
            Row(PacsSchemaInvariantSeverity.Error, "FK-003", "src", "col_a"));
        var current = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Error, "FK-003", "src", "col_b"));

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.Added.Should().ContainSingle().Which.ColumnName.Should().Be("col_b");
        diff.Removed.Should().ContainSingle().Which.ColumnName.Should().Be("col_a");
    }

    [Fact]
    public void Compute_MixedScenario_AllCategoriesPopulate()
    {
        var prev = Report("1.0.0", PrevTs,
            Row(PacsSchemaInvariantSeverity.Error, "FK-002", "ghost"),       // will flip → Warning
            Row(PacsSchemaInvariantSeverity.Warning, "DICT-005", "stale"),   // will be removed
            Row(PacsSchemaInvariantSeverity.Warning, "FK-006", "imprv"));    // will stay

        var current = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Warning, "FK-002", "ghost"),     // flipped from Error
            Row(PacsSchemaInvariantSeverity.Warning, "FK-006", "imprv"),     // unchanged
            Row(PacsSchemaInvariantSeverity.Error, "TBL-002", "newdup"));    // added

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.Added.Should().ContainSingle().Which.Code.Should().Be("TBL-002");
        diff.Removed.Should().ContainSingle().Which.Code.Should().Be("DICT-005");
        diff.SeverityChanged.Should().ContainSingle().Which.Code.Should().Be("FK-002");
        diff.PreviousInvariantSetVersion.Should().Be("1.0.0");
        diff.CurrentInvariantSetVersion.Should().Be("1.1.0");
        diff.ErrorDelta.Previous.Should().Be(1);
        diff.ErrorDelta.Current.Should().Be(1);
        diff.ErrorDelta.Diff.Should().Be(0);  // -1 for FK-002 flip, +1 for TBL-002 add
        diff.WarningDelta.Previous.Should().Be(2);
        diff.WarningDelta.Current.Should().Be(2);  // -1 for DICT-005 removed, +1 for FK-002 flipped
        diff.IsUnchanged.Should().BeFalse();
    }

    [Fact]
    public void Compute_PreservesTimestampsAndVersions()
    {
        var prev = Report("1.0.0", PrevTs);
        var current = Report("1.1.0", CurrTs);

        var diff = PacsSchemaInvariantReportDiff.Compute(prev, current);

        diff.PreviousProducedAtUtc.Should().Be(PrevTs);
        diff.CurrentProducedAtUtc.Should().Be(CurrTs);
        diff.PreviousInvariantSetVersion.Should().Be("1.0.0");
        diff.CurrentInvariantSetVersion.Should().Be("1.1.0");
    }

    [Fact]
    public void CountDelta_DiffIsCurrentMinusPrevious()
    {
        var d1 = new PacsSchemaInvariantCountDelta(Previous: 5, Current: 8);
        var d2 = new PacsSchemaInvariantCountDelta(Previous: 8, Current: 3);
        var d3 = new PacsSchemaInvariantCountDelta(Previous: 0, Current: 0);

        d1.Diff.Should().Be(3);
        d2.Diff.Should().Be(-5);
        d3.Diff.Should().Be(0);
    }
}
