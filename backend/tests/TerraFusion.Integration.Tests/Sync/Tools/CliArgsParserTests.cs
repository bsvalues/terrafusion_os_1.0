using FluentAssertions;
using TerraFusion.Tools.SyncAtlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Tools;

/// <summary>
/// Tests for <see cref="CliArgsParser"/> — pure argument parsing, no I/O.
/// Verifies all required flags, optional defaults, error messages, and help.
/// </summary>
public class CliArgsParserTests
{
    private const string ValidDb = "Host=localhost;Port=5432;Database=terrafusion;Username=postgres";
    private const string ValidCounty = "11111111-2222-3333-4444-555555555555";
    private const string ValidConnection = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    [Fact]
    public void Parse_AllRequiredFlags_ReturnsCliArgs()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection
        });

        err.Should().BeNull();
        args.Should().NotBeNull();
        args!.TerraFusionDbConnectionString.Should().Be(ValidDb);
        args.CountyId.Should().Be(Guid.Parse(ValidCounty));
        args.ConnectionId.Should().Be(Guid.Parse(ValidConnection));
        args.OperatorId.Should().Be(CliArgsParser.DefaultOperatorId);
        args.ShowHelp.Should().BeFalse();
    }

    [Fact]
    public void Parse_OperatorOverride_OverridesDefault()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--operator", "bsval"
        });

        err.Should().BeNull();
        args!.OperatorId.Should().Be("bsval");
    }

    [Fact]
    public void Parse_NoArguments_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(Array.Empty<string>());

        args.Should().BeNull();
        err.Should().Contain("no arguments");
    }

    [Fact]
    public void Parse_UnknownFlag_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--frobulate"
        });

        args.Should().BeNull();
        err.Should().Contain("unknown argument");
        err.Should().Contain("--frobulate");
    }

    [Fact]
    public void Parse_FlagWithoutValue_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id"  // no value follows
        });

        args.Should().BeNull();
        err.Should().Contain("--county-id requires a value");
    }

    [Fact]
    public void Parse_InvalidGuid_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", "not-a-guid",
            "--connection-id", ValidConnection
        });

        args.Should().BeNull();
        err.Should().Contain("--county-id is not a valid GUID");
    }

    [Fact]
    public void Parse_MissingRequiredDb_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection
        });

        args.Should().BeNull();
        err.Should().Be("--db is required");
    }

    [Fact]
    public void Parse_MissingCountyId_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--connection-id", ValidConnection
        });

        args.Should().BeNull();
        err.Should().Be("--county-id is required");
    }

    [Fact]
    public void Parse_MissingConnectionId_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty
        });

        args.Should().BeNull();
        err.Should().Be("--connection-id is required");
    }

    [Theory]
    [InlineData("--help")]
    [InlineData("-h")]
    [InlineData("/?")]
    public void Parse_HelpFlag_ReturnsShowHelp(string flag)
    {
        var (args, err) = CliArgsParser.Parse(new[] { flag });

        err.Should().BeNull();
        args.Should().NotBeNull();
        args!.ShowHelp.Should().BeTrue();
    }

    [Fact]
    public void UsageText_MentionsAllRequiredFlags()
    {
        var usage = CliArgsParser.UsageText;

        usage.Should().Contain("--db");
        usage.Should().Contain("--county-id");
        usage.Should().Contain("--connection-id");
        usage.Should().Contain("--operator");
    }

    // ── --deep-profile (Slice B2.4) ──────────────────────────────────────

    [Fact]
    public void Parse_DefaultsDeepProfileToFalse()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection
        });

        err.Should().BeNull();
        args!.DeepProfile.Should().BeFalse();
    }

    [Fact]
    public void Parse_DeepProfileFlag_SetsDeepProfileTrue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile"
        });

        err.Should().BeNull();
        args!.DeepProfile.Should().BeTrue();
    }

    [Fact]
    public void Parse_DeepProfileFlag_TakesNoValue()
    {
        // The flag is a boolean — passing what looks like a value should NOT
        // be consumed as the flag's value. Here "--operator" follows
        // --deep-profile and must still be recognized as its own flag.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
            "--operator", "bsval"
        });

        err.Should().BeNull();
        args!.DeepProfile.Should().BeTrue();
        args.OperatorId.Should().Be("bsval");
    }

    [Fact]
    public void UsageText_MentionsDeepProfileFlag()
    {
        CliArgsParser.UsageText.Should().Contain("--deep-profile");
    }
}
