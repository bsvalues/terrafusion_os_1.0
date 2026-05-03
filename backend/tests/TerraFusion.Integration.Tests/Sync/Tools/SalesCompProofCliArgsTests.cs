using FluentAssertions;
using TerraFusion.Tools.SalesCompProof;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Tools;

/// <summary>
/// Slice C37-D tests for <see cref="CliArgs"/>.
/// Pure parser, no I/O. Verifies every required flag, optional
/// defaults, error messages, and help output.
///
/// <para>Locks the C37-C tool's CLI contract: any parser regression
/// fails closed before it ships to operators.</para>
/// </summary>
public class SalesCompProofCliArgsTests
{
    private const string ValidDb         = "Host=localhost;Port=5432;Database=terrafusion;Username=postgres";
    private const string ValidCounty     = "11111111-2222-3333-4444-555555555555";
    private const string ValidWorkbook   = "a767c8a2-5b8a-4846-af8b-c3496601e924";
    private const string ValidConnection = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    private static string[] AllRequired() => new[]
    {
        "--db",                    ValidDb,
        "--county-id",             ValidCounty,
        "--workbook-id",           ValidWorkbook,
        "--source-connection-id",  ValidConnection,
        "--max-sales",             "1000",
    };

    // ── Happy path ──────────────────────────────────────────────────────

    [Fact]
    public void Parse_AllRequiredFlags_ReturnsCliArgsWithDefaultOperator()
    {
        var (args, err) = CliArgs.Parse(AllRequired());

        err.Should().BeNull();
        args.Should().NotBeNull();
        args!.TerraFusionDbConnectionString.Should().Be(ValidDb);
        args.CountyId.Should().Be(Guid.Parse(ValidCounty));
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbook));
        args.SourceConnectionId.Should().Be(Guid.Parse(ValidConnection));
        args.MaxSales.Should().Be(1000);
        args.OperatorId.Should().Be("c37c-live-proof");
        args.ShowHelp.Should().BeFalse();
    }

    [Fact]
    public void Parse_OperatorOverride_OverridesDefault()
    {
        var argv = AllRequired().Concat(new[] { "--operator", "bsval-2026-04-28" }).ToArray();

        var (args, err) = CliArgs.Parse(argv);

        err.Should().BeNull();
        args!.OperatorId.Should().Be("bsval-2026-04-28");
    }

    // ── Help ────────────────────────────────────────────────────────────

    [Fact]
    public void Parse_HelpFlag_ReturnsShowHelp()
    {
        var (args, err) = CliArgs.Parse(new[] { "--help" });
        err.Should().BeNull();
        args.Should().NotBeNull();
        args!.ShowHelp.Should().BeTrue();
    }

    [Fact]
    public void Parse_ShortHelpFlag_ReturnsShowHelp()
    {
        var (args, err) = CliArgs.Parse(new[] { "-h" });
        err.Should().BeNull();
        args!.ShowHelp.Should().BeTrue();
    }

    [Fact]
    public void UsageText_MentionsAllRequiredFlags()
    {
        var usage = CliArgs.UsageText;
        usage.Should().Contain("--db");
        usage.Should().Contain("--county-id");
        usage.Should().Contain("--workbook-id");
        usage.Should().Contain("--source-connection-id");
        usage.Should().Contain("--max-sales");
        // The operator runbook references the locked Path 1 workbook.
        usage.Should().Contain("a767c8a2-5b8a-4846-af8b-c3496601e924");
        // Shape of evidence files is part of the tool's contract;
        // operators rely on these paths being stable.
        usage.Should().Contain("c37-comp-eligibility-live-proof");
    }

    // ── Required-flag enforcement ───────────────────────────────────────

    [Fact]
    public void Parse_NoArguments_ReturnsError()
    {
        var (args, err) = CliArgs.Parse(Array.Empty<string>());
        args.Should().BeNull();
        err.Should().Contain("no arguments");
    }

    [Fact]
    public void Parse_MissingDb_ReturnsError()
    {
        var argv = AllRequired().Where((_, i) => i != 0 && i != 1).ToArray(); // drop --db pair
        var (args, err) = CliArgs.Parse(argv);
        args.Should().BeNull();
        err.Should().Contain("--db");
    }

    [Fact]
    public void Parse_MissingCountyId_ReturnsError()
    {
        var argv = AllRequired().Where((_, i) => i != 2 && i != 3).ToArray();
        var (args, err) = CliArgs.Parse(argv);
        args.Should().BeNull();
        err.Should().Contain("--county-id");
    }

    [Fact]
    public void Parse_OmittedWorkbookId_AcceptedAsNull()
    {
        // Slice C42-A: --workbook-id is optional. When omitted the
        // tool resolves the C41-B county active-workbook pointer.
        // The parser MUST accept omission and set WorkbookId = null;
        // resolution (and the fail-closed behavior when no pointer
        // exists) lives in the runner.
        var argv = AllRequired().Where((_, i) => i != 4 && i != 5).ToArray();
        var (args, err) = CliArgs.Parse(argv);
        err.Should().BeNull();
        args.Should().NotBeNull();
        args!.WorkbookId.Should().BeNull(
            "C42-A: omitted --workbook-id parses as null; runner consults the active-workbook pointer");
    }

    [Fact]
    public void Parse_MissingSourceConnectionId_ReturnsError()
    {
        var argv = AllRequired().Where((_, i) => i != 6 && i != 7).ToArray();
        var (args, err) = CliArgs.Parse(argv);
        args.Should().BeNull();
        err.Should().Contain("--source-connection-id");
    }

    [Fact]
    public void Parse_MissingMaxSales_ReturnsError()
    {
        var argv = AllRequired().Where((_, i) => i != 8 && i != 9).ToArray();
        var (args, err) = CliArgs.Parse(argv);
        args.Should().BeNull();
        err.Should().Contain("--max-sales");
    }

    // ── Per-flag value-required enforcement ─────────────────────────────

    [Theory]
    [InlineData("--db")]
    [InlineData("--county-id")]
    [InlineData("--workbook-id")]
    [InlineData("--source-connection-id")]
    [InlineData("--max-sales")]
    [InlineData("--operator")]
    public void Parse_FlagWithoutValue_ReturnsError(string flag)
    {
        // Trailing flag with no value after it.
        var (args, err) = CliArgs.Parse(new[] { flag });
        args.Should().BeNull();
        err.Should().Contain(flag);
        err.Should().Contain("requires a value");
    }

    // ── Type validation ─────────────────────────────────────────────────

    [Theory]
    [InlineData("--county-id",            "not-a-guid")]
    [InlineData("--workbook-id",          "still-not-a-guid")]
    [InlineData("--source-connection-id", "absolutely-not-a-guid")]
    public void Parse_NonGuidArgument_ReturnsError(string flag, string badValue)
    {
        var argv = new[] { flag, badValue };
        var (args, err) = CliArgs.Parse(argv);
        args.Should().BeNull();
        err.Should().Contain(flag);
        err.Should().Contain("not a guid");
        err.Should().Contain(badValue);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-5")]
    [InlineData("not-a-number")]
    public void Parse_InvalidMaxSales_ReturnsError(string badValue)
    {
        var argv = new[] { "--max-sales", badValue };
        var (args, err) = CliArgs.Parse(argv);
        args.Should().BeNull();
        err.Should().Contain("--max-sales");
        err.Should().Contain("positive integer");
    }

    [Fact]
    public void Parse_PositiveMaxSales_Accepted()
    {
        var argv = AllRequired().ToArray();
        argv[9] = "1"; // smallest valid
        var (args, err) = CliArgs.Parse(argv);
        err.Should().BeNull();
        args!.MaxSales.Should().Be(1);
    }

    [Fact]
    public void Parse_LargeMaxSales_Accepted()
    {
        var argv = AllRequired().ToArray();
        argv[9] = "1000000";
        var (args, err) = CliArgs.Parse(argv);
        err.Should().BeNull();
        args!.MaxSales.Should().Be(1_000_000);
    }

    // ── Unknown flags ───────────────────────────────────────────────────

    [Fact]
    public void Parse_UnknownFlag_ReturnsError()
    {
        var argv = AllRequired().Concat(new[] { "--frobulate" }).ToArray();
        var (args, err) = CliArgs.Parse(argv);
        args.Should().BeNull();
        err.Should().Contain("unknown flag");
        err.Should().Contain("--frobulate");
    }

    // ── Help wins over partial args (parser invariant) ──────────────────

    [Fact]
    public void Parse_HelpWithOtherFlags_ReturnsShowHelpRegardlessOfMissingRequired()
    {
        // The --help flag short-circuits the required-flag check so
        // operators can request usage without needing to supply
        // dummy values for every other flag.
        var (args, err) = CliArgs.Parse(new[] { "--help", "--max-sales", "100" });
        err.Should().BeNull();
        args.Should().NotBeNull();
        args!.ShowHelp.Should().BeTrue();
    }

    // ── Locked Path 1 workbook smoke ────────────────────────────────────

    [Fact]
    public void Parse_LockedBentonWorkbook_RoundTrips()
    {
        // The Path 1 destination workbook id from operator memory:
        // a767c8a2-5b8a-4846-af8b-c3496601e924. Lock the parser
        // round-trips it cleanly because this is the intended target
        // of the C37-C tool.
        var (args, err) = CliArgs.Parse(AllRequired());
        err.Should().BeNull();
        args!.WorkbookId.Should().Be(Guid.Parse("a767c8a2-5b8a-4846-af8b-c3496601e924"));
    }
}
