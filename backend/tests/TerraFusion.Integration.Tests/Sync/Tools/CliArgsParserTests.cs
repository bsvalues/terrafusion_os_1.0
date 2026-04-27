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

    // ── --deep-profile-include + --deep-profile-max-tables (Slice B2.5A) ─

    [Fact]
    public void Parse_DefaultsIncludeListEmptyAndMaxTablesNull()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
        });

        err.Should().BeNull();
        args!.DeepProfileIncludeQualifiedNames.Should().BeEmpty();
        args.DeepProfileMaxTables.Should().BeNull();
    }

    [Fact]
    public void Parse_DeepProfileInclude_ParsesCommaSeparatedQualifiedNames()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
            "--deep-profile-include", "dbo.property,dbo.property_val,dbo.sale",
        });

        err.Should().BeNull();
        args!.DeepProfileIncludeQualifiedNames.Should().BeEquivalentTo(new[]
        {
            "dbo.property", "dbo.property_val", "dbo.sale",
        });
    }

    [Fact]
    public void Parse_DeepProfileInclude_TrimsWhitespaceAroundEntries()
    {
        // Operators frequently paste lists with trailing whitespace from
        // the IDE — the parser should be lenient about that, but still
        // treat each entry as a single qualified name.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
            "--deep-profile-include", " dbo.property , dbo.sale ",
        });

        err.Should().BeNull();
        args!.DeepProfileIncludeQualifiedNames.Should().BeEquivalentTo(new[]
        {
            "dbo.property", "dbo.sale",
        });
    }

    [Theory]
    [InlineData("invalid")]            // no dot
    [InlineData(".table")]             // empty schema
    [InlineData("schema.")]            // empty table
    [InlineData("schema.table.extra")] // too many dots
    public void Parse_DeepProfileInclude_RejectsBadEntry(string entry)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
            "--deep-profile-include", entry,
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile-include");
        err.Should().Contain("schema.table");
    }

    [Fact]
    public void Parse_DeepProfileInclude_RequiresDeepProfileFlag()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            // NOTE: no --deep-profile here.
            "--deep-profile-include", "dbo.property",
        });

        args.Should().BeNull();
        err.Should().Be("--deep-profile-include requires --deep-profile");
    }

    [Fact]
    public void Parse_DeepProfileMaxTables_ParsesPositiveInteger()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
            "--deep-profile-max-tables", "25",
        });

        err.Should().BeNull();
        args!.DeepProfileMaxTables.Should().Be(25);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("not-a-number")]
    public void Parse_DeepProfileMaxTables_RejectsNonPositiveOrNonInt(string value)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
            "--deep-profile-max-tables", value,
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile-max-tables");
        err.Should().Contain("positive integer");
    }

    [Fact]
    public void Parse_DeepProfileMaxTables_RequiresDeepProfileFlag()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            // NOTE: no --deep-profile here.
            "--deep-profile-max-tables", "10",
        });

        args.Should().BeNull();
        err.Should().Be("--deep-profile-max-tables requires --deep-profile");
    }

    [Fact]
    public void Parse_AllB25AFlagsTogether_AreAccepted()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--deep-profile",
            "--deep-profile-include", "dbo.property,dbo.sale",
            "--deep-profile-max-tables", "5",
        });

        err.Should().BeNull();
        args!.DeepProfile.Should().BeTrue();
        args.DeepProfileIncludeQualifiedNames.Should().HaveCount(2);
        args.DeepProfileMaxTables.Should().Be(5);
    }

    [Fact]
    public void UsageText_MentionsB25ASafetyControls()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--deep-profile-include");
        usage.Should().Contain("--deep-profile-max-tables");
    }
}
