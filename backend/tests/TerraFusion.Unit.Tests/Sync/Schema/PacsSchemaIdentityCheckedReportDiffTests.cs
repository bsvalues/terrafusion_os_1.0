using System;
using FluentAssertions;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C54-MULTI-D unit tests for
/// <see cref="PacsSchemaIdentityCheckedReportDiff"/>. Covers:
/// happy path (matching identities), cross-county mismatch
/// rejection, cross-source-connection mismatch rejection,
/// case-sensitivity of identity comparisons, null-argument
/// validation, null-previous baseline support, and pass-through
/// of the underlying diff result.
/// </summary>
public sealed class PacsSchemaIdentityCheckedReportDiffTests
{
    private static readonly DateTime PrevTs = new(2026, 4, 30, 12, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime CurrTs = new(2026, 4, 30, 13, 0, 0, DateTimeKind.Utc);

    private static PacsCatalogIdentity Identity(
        string countyId, string sourceConnectionId, string hash = "abc") =>
        new(countyId, sourceConnectionId, "Harris-9.0", hash + new string('0', 64 - hash.Length));

    private static PacsSchemaInvariantResult Row(
        PacsSchemaInvariantSeverity severity, string code, string? table = null) =>
        new(severity, code, $"{code}: ...", table, null, $"prov:{code}");

    private static PacsSchemaInvariantReport Report(
        string version, DateTime ts, params PacsSchemaInvariantResult[] rows) =>
        new(version, ts, rows);

    [Fact]
    public void Compute_MatchingIdentities_HappyPath()
    {
        var prevIdentity = Identity("WA-Benton", "benton-prod", "v1");
        var currIdentity = Identity("WA-Benton", "benton-prod", "v2"); // hash differs OK
        var prev = Report("1.1.0", PrevTs,
            Row(PacsSchemaInvariantSeverity.Warning, "DICT-005", "lookup"));
        var curr = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Warning, "DICT-005", "lookup"),
            Row(PacsSchemaInvariantSeverity.Warning, "FK-006", "imprv"));

        var result = PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, prev, currIdentity, curr);

        result.CountyId.Should().Be("WA-Benton");
        result.SourceConnectionId.Should().Be("benton-prod");
        result.PreviousIdentity.Should().BeSameAs(prevIdentity);
        result.CurrentIdentity.Should().BeSameAs(currIdentity);
        result.Diff.Added.Should().ContainSingle().Which.Code.Should().Be("FK-006");
        result.Diff.IsUnchanged.Should().BeFalse();
    }

    [Fact]
    public void Compute_DifferentCountyId_Throws()
    {
        var prevIdentity = Identity("WA-Benton", "benton-prod");
        var currIdentity = Identity("WA-Yakima", "benton-prod");
        var prev = Report("1.1.0", PrevTs);
        var curr = Report("1.1.0", CurrTs);

        var act = () => PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, prev, currIdentity, curr);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*WA-Benton*WA-Yakima*ISOL-4*");
    }

    [Fact]
    public void Compute_DifferentSourceConnectionId_Throws()
    {
        var prevIdentity = Identity("WA-Benton", "benton-prod");
        var currIdentity = Identity("WA-Benton", "benton-staging");
        var prev = Report("1.1.0", PrevTs);
        var curr = Report("1.1.0", CurrTs);

        var act = () => PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, prev, currIdentity, curr);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*benton-prod*benton-staging*ISOL-4*");
    }

    [Fact]
    public void Compute_CountyIdCaseSensitive_Throws()
    {
        var prevIdentity = Identity("WA-Benton", "benton-prod");
        var currIdentity = Identity("wa-benton", "benton-prod");
        var prev = Report("1.1.0", PrevTs);
        var curr = Report("1.1.0", CurrTs);

        var act = () => PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, prev, currIdentity, curr);

        act.Should().Throw<InvalidOperationException>(
            "case-sensitive identity comparison per the catalog identity binding");
    }

    [Fact]
    public void Compute_NullPreviousIdentity_Throws()
    {
        var currIdentity = Identity("WA-Benton", "benton-prod");
        var curr = Report("1.1.0", CurrTs);

        var act = () => PacsSchemaIdentityCheckedReportDiff.Compute(
            null!, null, currIdentity, curr);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Compute_NullCurrentIdentity_Throws()
    {
        var prevIdentity = Identity("WA-Benton", "benton-prod");
        var prev = Report("1.1.0", PrevTs);

        var act = () => PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, prev, null!, null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Compute_NullCurrentReport_Throws()
    {
        var prevIdentity = Identity("WA-Benton", "benton-prod");
        var currIdentity = Identity("WA-Benton", "benton-prod");

        var act = () => PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, null, currIdentity, null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Compute_NullPreviousReport_BaselineEmptyCase_Allowed()
    {
        // Per ISOL-4 + the C53-CONS-E null-previous baseline,
        // a null previous report is allowed when first establishing
        // a baseline. previousIdentity is still required so the
        // operator confirms which catalog they're establishing the
        // baseline for.
        var prevIdentity = Identity("WA-Benton", "benton-prod");
        var currIdentity = Identity("WA-Benton", "benton-prod");
        var curr = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Warning, "DICT-005", "lookup"));

        var result = PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, null, currIdentity, curr);

        result.Diff.Added.Should().ContainSingle();
        result.Diff.PreviousInvariantSetVersion.Should().Be("(none)");
    }

    [Fact]
    public void Compute_PreservesUnderlyingDiffSemantics()
    {
        var prevIdentity = Identity("WA-Benton", "benton-prod", "v1");
        var currIdentity = Identity("WA-Benton", "benton-prod", "v2");
        var prev = Report("1.0.0", PrevTs,
            Row(PacsSchemaInvariantSeverity.Error, "FK-002", "ghost"));
        var curr = Report("1.1.0", CurrTs,
            Row(PacsSchemaInvariantSeverity.Warning, "FK-002", "ghost")); // severity flipped

        var result = PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, prev, currIdentity, curr);

        result.Diff.SeverityChanged.Should().ContainSingle();
        result.Diff.PreviousInvariantSetVersion.Should().Be("1.0.0");
        result.Diff.CurrentInvariantSetVersion.Should().Be("1.1.0");
    }

    [Fact]
    public void Compute_SameCountyIdSameSourceConn_DifferentReleaseLabels_Allowed()
    {
        // PacsRelease may vary between builds (operator labels it
        // differently between staging and prod runs of the same
        // catalog identity). The check is on (CountyId,
        // SourceConnectionId) only; the secondary surfaces don't
        // gate the diff.
        var prevIdentity = new PacsCatalogIdentity("WA-Benton", "benton-prod", "Harris-9.0", new string('a', 64));
        var currIdentity = new PacsCatalogIdentity("WA-Benton", "benton-prod", "Harris-9.0.4", new string('b', 64));
        var prev = Report("1.1.0", PrevTs);
        var curr = Report("1.1.0", CurrTs);

        var act = () => PacsSchemaIdentityCheckedReportDiff.Compute(
            prevIdentity, prev, currIdentity, curr);

        act.Should().NotThrow();
    }
}
