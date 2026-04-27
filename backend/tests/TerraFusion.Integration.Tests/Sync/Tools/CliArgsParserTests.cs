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

    // ── Slice C4 — Mapping Workbook draft mode flags ────────────────────
    //
    // The parser's job in workbook mode is to switch the validation
    // matrix: --connection-id is no longer required (loader resolves it
    // from the batch), --workbook-name becomes required, exactly one of
    // --profile-batch-id / --latest-profile-batch is required, and
    // profile-mode-only flags are rejected. These tests pin every cell
    // of that matrix.

    private const string ValidProfileBatch = "6342a924-c235-43d5-b68c-0c0a70ead1e2";

    [Fact]
    public void Parse_GenerateMappingWorkbookFlag_LatestBatch_SetsTrue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--latest-profile-batch",
            "--workbook-name", "Benton OLTP wb",
        });

        err.Should().BeNull();
        args!.GenerateMappingWorkbook.Should().BeTrue();
        args.LatestProfileBatch.Should().BeTrue();
        args.ProfileBatchId.Should().BeNull();
        args.WorkbookName.Should().Be("Benton OLTP wb");
        args.ConnectionId.Should().BeNull();      // not required in workbook mode
        args.ReplaceExistingDraft.Should().BeFalse();
        args.MappingMaxCandidates.Should().BeNull();
    }

    [Fact]
    public void Parse_GenerateMappingWorkbookFlag_ExplicitBatch_SetsTrue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--profile-batch-id", ValidProfileBatch,
            "--workbook-name", "explicit-batch wb",
        });

        err.Should().BeNull();
        args!.GenerateMappingWorkbook.Should().BeTrue();
        args.ProfileBatchId.Should().Be(Guid.Parse(ValidProfileBatch));
        args.LatestProfileBatch.Should().BeFalse();
    }

    [Fact]
    public void Parse_WorkbookNameRequiredWhenGenerateMappingWorkbook()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--latest-profile-batch",
            // no --workbook-name
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-name");
    }

    [Fact]
    public void Parse_ProfileBatchIdOrLatestRequiredWhenGenerateMappingWorkbook()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "missing-batch wb",
            // no --profile-batch-id and no --latest-profile-batch
        });

        args.Should().BeNull();
        err.Should().Contain("--profile-batch-id");
        err.Should().Contain("--latest-profile-batch");
    }

    [Fact]
    public void Parse_ProfileBatchIdAndLatestAreMutuallyExclusive()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "two-modes wb",
            "--profile-batch-id", ValidProfileBatch,
            "--latest-profile-batch",
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
    }

    [Fact]
    public void Parse_ReplaceExistingDraftAllowedOnlyWithGenerateMappingWorkbook()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            // No --generate-mapping-workbook here.
            "--replace-existing-draft",
        });

        args.Should().BeNull();
        err.Should().Contain("--replace-existing-draft");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Fact]
    public void Parse_MappingMaxCandidatesAllowedOnlyWithGenerateMappingWorkbook()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--mapping-max-candidates", "25",
        });

        args.Should().BeNull();
        err.Should().Contain("--mapping-max-candidates");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("not-a-number")]
    public void Parse_MappingMaxCandidatesMustBePositive(string raw)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "cap wb",
            "--latest-profile-batch",
            "--mapping-max-candidates", raw,
        });

        args.Should().BeNull();
        err.Should().Contain("--mapping-max-candidates");
        err.Should().Contain("positive integer");
    }

    [Fact]
    public void Parse_ProfileBatchIdInvalidGuid_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "wb",
            "--profile-batch-id", "not-a-guid",
        });

        args.Should().BeNull();
        err.Should().Contain("--profile-batch-id");
        err.Should().Contain("not a valid GUID");
    }

    [Fact]
    public void Parse_DeepProfileNotAllowedInWorkbookMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "wb",
            "--latest-profile-batch",
            "--deep-profile",
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile");
        err.Should().Contain("Mapping Workbook");
    }

    [Fact]
    public void Parse_ConnectionIdNotRequiredInWorkbookMode()
    {
        // Sanity: omitting --connection-id is FINE in workbook mode (the
        // loader resolves it from the batch). The pre-C4 parser would
        // have rejected this with "--connection-id is required."
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "no-connection wb",
            "--latest-profile-batch",
        });

        err.Should().BeNull();
        args!.ConnectionId.Should().BeNull();
    }

    [Fact]
    public void Parse_ExistingProfileFlagsRemainCompatible()
    {
        // Backward-compat regression: profile mode (no
        // --generate-mapping-workbook) still parses with the same shape
        // it had pre-C4, including the deep-profile family of flags.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--operator", "bsval",
            "--deep-profile",
            "--deep-profile-include", "dbo.property,dbo.sale",
            "--deep-profile-max-tables", "5",
        });

        err.Should().BeNull();
        args!.GenerateMappingWorkbook.Should().BeFalse();
        args.WorkbookName.Should().BeNull();
        args.ProfileBatchId.Should().BeNull();
        args.LatestProfileBatch.Should().BeFalse();
        args.ReplaceExistingDraft.Should().BeFalse();
        args.MappingMaxCandidates.Should().BeNull();
        args.DeepProfile.Should().BeTrue();
        args.DeepProfileIncludeQualifiedNames.Should().HaveCount(2);
        args.DeepProfileMaxTables.Should().Be(5);
    }

    [Fact]
    public void Parse_FullWorkbookFlagSet_RoundTripsAllFields()
    {
        // Every workbook-mode flag in one call — pins the shape of a
        // complete workbook invocation.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--profile-batch-id", ValidProfileBatch,
            "--workbook-name", "Benton PACS OLTP Mapping Workbook",
            "--replace-existing-draft",
            "--mapping-max-candidates", "50",
            "--operator", "bsval",
        });

        err.Should().BeNull();
        args!.GenerateMappingWorkbook.Should().BeTrue();
        args.ProfileBatchId.Should().Be(Guid.Parse(ValidProfileBatch));
        args.LatestProfileBatch.Should().BeFalse();
        args.WorkbookName.Should().Be("Benton PACS OLTP Mapping Workbook");
        args.ReplaceExistingDraft.Should().BeTrue();
        args.MappingMaxCandidates.Should().Be(50);
        args.OperatorId.Should().Be("bsval");
        args.CountyId.Should().Be(Guid.Parse(ValidCounty));
    }

    [Fact]
    public void UsageText_MentionsMappingWorkbookFlags()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--generate-mapping-workbook");
        usage.Should().Contain("--profile-batch-id");
        usage.Should().Contain("--latest-profile-batch");
        usage.Should().Contain("--workbook-name");
        usage.Should().Contain("--replace-existing-draft");
        usage.Should().Contain("--mapping-max-candidates");
    }
}
