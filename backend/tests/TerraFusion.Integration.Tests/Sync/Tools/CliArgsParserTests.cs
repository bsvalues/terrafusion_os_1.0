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

    // ── Slice C5 — Mapping Workbook export mode ─────────────────────────
    //
    // Three-way mode mutex now: profile / generate-workbook / export-workbook.
    // The parser must (a) accept a complete export invocation, (b) reject
    // export-only flags in other modes, (c) reject other-mode flags in
    // export mode, (d) reject the two workbook bool-toggles together.

    private const string ValidWorkbookId = "a767c8a2-5b8a-4846-af8b-c3496601e924";

    [Fact]
    public void Parse_ExportMappingWorkbook_MinimalFlags_Accepted()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb-export",
        });

        err.Should().BeNull();
        args!.ExportMappingWorkbook.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.OutputDirectory.Should().Be("/tmp/wb-export");
        args.ExportFormat.Should().Be("both");          // default
        args.ConnectionId.Should().BeNull();            // not required
        args.GenerateMappingWorkbook.Should().BeFalse();
    }

    [Theory]
    [InlineData("csv")]
    [InlineData("md")]
    [InlineData("both")]
    [InlineData("CSV")]
    [InlineData("Md")]
    [InlineData("BOTH")]
    public void Parse_ExportMappingWorkbook_FormatAcceptsValidValues(string format)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
            "--format", format,
        });

        err.Should().BeNull();
        args!.ExportFormat.Should().Be(format.ToLowerInvariant());
    }

    [Fact]
    public void Parse_ExportMappingWorkbook_FormatRejectsUnknownValue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
            "--format", "xlsx",
        });

        args.Should().BeNull();
        err.Should().Contain("--format");
        err.Should().Contain("csv");
        err.Should().Contain("xlsx");
    }

    [Fact]
    public void Parse_ExportMappingWorkbook_WorkbookIdRequired()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            // no --workbook-id
            "--output-dir", "/tmp/wb",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
    }

    [Fact]
    public void Parse_ExportMappingWorkbook_OutputDirRequired()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            // no --output-dir
        });

        args.Should().BeNull();
        err.Should().Contain("--output-dir");
    }

    [Fact]
    public void Parse_ExportMappingWorkbook_WorkbookIdInvalidGuid_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", "not-a-guid",
            "--output-dir", "/tmp/wb",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("not a valid GUID");
    }

    [Fact]
    public void Parse_ExportAndGenerateWorkbookFlags_AreMutuallyExclusive()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "wb",
            "--latest-profile-batch",
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
        });

        args.Should().BeNull();
        err.Should().Contain("--generate-mapping-workbook");
        err.Should().Contain("--export-mapping-workbook");
        err.Should().Contain("mutually exclusive");
    }

    [Fact]
    public void Parse_ExportFlags_NotAllowedInProfileMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            // No mode toggles → profile mode
            "--workbook-id", ValidWorkbookId,
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_OutputDirFlag_NotAllowedInProfileMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--output-dir", "/tmp/wb",
        });

        args.Should().BeNull();
        err.Should().Contain("--output-dir");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_FormatFlag_NotAllowedInProfileMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--format", "csv",
        });

        args.Should().BeNull();
        err.Should().Contain("--format");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_ExportFlags_NotAllowedInGenerateMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "wb",
            "--latest-profile-batch",
            "--workbook-id", ValidWorkbookId,
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_GenerateFlags_NotAllowedInExportMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
            "--workbook-name", "should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-name");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Fact]
    public void Parse_DeepProfileFlag_NotAllowedInExportMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
            "--deep-profile",
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile");
        err.Should().Contain("export");
    }

    [Fact]
    public void Parse_ExportMode_ConnectionIdNotRequired()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
        });

        err.Should().BeNull();
        args!.ConnectionId.Should().BeNull();
    }

    [Fact]
    public void Parse_FullExportFlagSet_RoundTripsAllFields()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/abs/path/to/export",
            "--format", "md",
            "--operator", "bsval",
        });

        err.Should().BeNull();
        args!.ExportMappingWorkbook.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.OutputDirectory.Should().Be("/abs/path/to/export");
        args.ExportFormat.Should().Be("md");
        args.OperatorId.Should().Be("bsval");
        args.GenerateMappingWorkbook.Should().BeFalse();
        args.DeepProfile.Should().BeFalse();
    }

    [Fact]
    public void UsageText_MentionsMappingWorkbookExportFlags()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--export-mapping-workbook");
        usage.Should().Contain("--workbook-id");
        usage.Should().Contain("--output-dir");
        usage.Should().Contain("--format");
        usage.Should().Contain("csv");
        usage.Should().Contain("md");
        usage.Should().Contain("both");
    }

    // ── Slice C8-C — Sales qualification sample runner ──────────────────
    //
    // Four-way mode mutex now: profile / generate-workbook /
    // export-workbook / qualify-sales. The parser must (a) accept a
    // complete qualify-sales invocation, (b) require its three flags,
    // (c) reject the new flags in other modes, (d) reject other-mode
    // flags here, (e) refuse to mix any two of the three workbook bool
    // toggles.

    [Fact]
    public void Parse_QualifySales_MinimalFlags_Accepted()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "100",
        });

        err.Should().BeNull();
        args!.QualifySales.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.SourceConnectionId.Should().Be(Guid.Parse(ValidConnection));
        args.MaxSales.Should().Be(100);
        args.ConnectionId.Should().BeNull();      // not required in qualify mode
        args.GenerateMappingWorkbook.Should().BeFalse();
        args.ExportMappingWorkbook.Should().BeFalse();
    }

    [Fact]
    public void Parse_QualifySalesRequiresWorkbookId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            // no --workbook-id
            "--source-connection-id", ValidConnection,
            "--max-sales", "100",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_QualifySalesRequiresSourceConnectionId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            // no --source-connection-id
            "--max-sales", "100",
        });

        args.Should().BeNull();
        err.Should().Contain("--source-connection-id");
        err.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_QualifySalesRequiresMaxSales()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            // no --max-sales
        });

        args.Should().BeNull();
        err.Should().Contain("--max-sales");
        err.Should().Contain("--qualify-sales");
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    [InlineData("not-a-number")]
    public void Parse_QualifySalesRejectsNonPositiveMaxSales(string raw)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", raw,
        });

        args.Should().BeNull();
        err.Should().Contain("--max-sales");
        err.Should().Contain("positive integer");
    }

    [Fact]
    public void Parse_QualifySalesMutuallyExclusiveWithProfileGenerateExport()
    {
        // qualify-sales + generate-mapping-workbook → mutex error.
        var (args1, err1) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
            "--generate-mapping-workbook",
            "--workbook-name", "wb",
            "--latest-profile-batch",
        });
        args1.Should().BeNull();
        err1.Should().Contain("mutually exclusive");

        // qualify-sales + export-mapping-workbook → mutex error.
        var (args2, err2) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
            "--export-mapping-workbook",
            "--output-dir", "/tmp/wb",
        });
        args2.Should().BeNull();
        err2.Should().Contain("mutually exclusive");
    }

    [Fact]
    public void Parse_QualifySalesFlags_NotAllowedInProfileMode()
    {
        // --source-connection-id outside qualify-sales is rejected.
        var (args1, err1) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--source-connection-id", ValidConnection,
        });
        args1.Should().BeNull();
        err1.Should().Contain("--source-connection-id");
        err1.Should().Contain("--qualify-sales");

        // --max-sales outside qualify-sales is rejected.
        var (args2, err2) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--max-sales", "10",
        });
        args2.Should().BeNull();
        err2.Should().Contain("--max-sales");
        err2.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_QualifySalesFlags_NotAllowedInGenerateOrExportMode()
    {
        // --source-connection-id in generate mode → rejected.
        var (args1, err1) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "wb",
            "--latest-profile-batch",
            "--source-connection-id", ValidConnection,
        });
        args1.Should().BeNull();
        err1.Should().Contain("--source-connection-id");
        err1.Should().Contain("--qualify-sales");

        // --max-sales in export mode → rejected.
        var (args2, err2) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
            "--max-sales", "10",
        });
        args2.Should().BeNull();
        err2.Should().Contain("--max-sales");
        err2.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_DeepProfileFlag_NotAllowedInQualifySalesMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
            "--deep-profile",
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile");
        err.Should().Contain("Sales qualification");
    }

    [Fact]
    public void Parse_QualifySales_RejectsConflictingWorkbookGenerationFlags()
    {
        // --workbook-name is a generate-mode-only flag and must not
        // appear in qualify-sales.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
            "--workbook-name", "should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-name");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Fact]
    public void Parse_QualifySales_RejectsConflictingExportFlags()
    {
        // --output-dir is an export-mode-only flag and must not appear
        // in qualify-sales.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
            "--output-dir", "/tmp/should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--output-dir");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_ExistingModesRemainCompatible()
    {
        // Profile mode (no mode toggles) — still parses cleanly with
        // the existing required flags.
        var (profileArgs, profileErr) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
        });
        profileErr.Should().BeNull();
        profileArgs!.QualifySales.Should().BeFalse();
        profileArgs.SourceConnectionId.Should().BeNull();
        profileArgs.MaxSales.Should().BeNull();

        // Generate mode — round-trips cleanly.
        var (genArgs, genErr) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--workbook-name", "wb",
            "--latest-profile-batch",
        });
        genErr.Should().BeNull();
        genArgs!.QualifySales.Should().BeFalse();

        // Export mode — round-trips cleanly.
        var (expArgs, expErr) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/wb",
        });
        expErr.Should().BeNull();
        expArgs!.QualifySales.Should().BeFalse();
    }

    [Fact]
    public void Parse_FullQualifySalesFlagSet_RoundTripsAllFields()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "250",
            "--operator", "bsval",
        });

        err.Should().BeNull();
        args!.QualifySales.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.SourceConnectionId.Should().Be(Guid.Parse(ValidConnection));
        args.MaxSales.Should().Be(250);
        args.OperatorId.Should().Be("bsval");
        args.ExportMappingWorkbook.Should().BeFalse();
        args.GenerateMappingWorkbook.Should().BeFalse();
        args.DeepProfile.Should().BeFalse();
    }

    [Fact]
    public void UsageText_MentionsQualifySalesFlags()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--qualify-sales");
        usage.Should().Contain("--source-connection-id");
        usage.Should().Contain("--max-sales");
    }

    // ── Slice C9-B — Mapping Workbook edit ──────────────────────────────
    //
    // Five-way mode mutex now: profile / generate / export / qualify /
    // edit. The edit mode requires --workbook-id + --source +
    // at-least-one mutation; rejects scope-incorrect mutators
    // (--canonical-target with --source-value, --canonical-value
    // without it, etc.); rejects all other modes' flags.

    [Fact]
    public void Parse_EditMappingWorkbookSetsMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--source-value", "458-61A-203(1)",
            "--review-status", "Mapped",
        });

        err.Should().BeNull();
        args!.EditMappingWorkbook.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.EditSourceSchema.Should().Be("dbo");
        args.EditSourceTable.Should().Be("sale");
        args.EditSourceColumn.Should().Be("wac_cd");
        args.EditSourceValue.Should().Be("458-61A-203(1)");
        args.EditReviewStatus.Should().Be("Mapped");
        args.ConnectionId.Should().BeNull();
    }

    [Fact]
    public void Parse_EditRequiresWorkbookId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            // no --workbook-id
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--edit-mapping-workbook");
    }

    [Fact]
    public void Parse_EditRequiresSource()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            // no --source
            "--review-status", "Mapped",
        });

        args.Should().BeNull();
        err.Should().Contain("--source");
        err.Should().Contain("--edit-mapping-workbook");
    }

    [Theory]
    [InlineData("dbosale.waccd")]      // 1 dot
    [InlineData("dbo.sale")]           // 2 parts
    [InlineData("dbo.sale.wac_cd.x")]  // 4 parts
    [InlineData("dbo..wac_cd")]        // empty middle
    [InlineData(".sale.wac_cd")]       // empty schema
    [InlineData("dbo.sale.")]          // empty column
    public void Parse_EditRejectsInvalidSourceFormat(string badSource)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", badSource,
            "--review-status", "Mapped",
        });

        args.Should().BeNull();
        err.Should().Contain("--source");
        err.Should().Contain("schema.table.column");
    }

    [Fact]
    public void Parse_EditRequiresAtLeastOneMutation()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            // no mutation flags at all
        });

        args.Should().BeNull();
        err.Should().Contain("at least one mutation field");
    }

    [Fact]
    public void Parse_EditRejectsProfileFlags()
    {
        // --connection-id is profile-mode-only and must not appear in
        // edit mode (parser tolerates it for backward-compat in workbook
        // generate/export modes but in edit mode it's a profile leak).
        // Also test --deep-profile rejection.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
            "--deep-profile",
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile");
        err.Should().Contain("Mapping Workbook edit");
    }

    [Fact]
    public void Parse_EditRejectsGenerateFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
            "--workbook-name", "should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-name");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Fact]
    public void Parse_EditRejectsExportFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
            "--output-dir", "/tmp/should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--output-dir");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_EditRejectsQualifyFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
            "--source-connection-id", ValidConnection,
        });

        args.Should().BeNull();
        err.Should().Contain("--source-connection-id");
        err.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_EditMutuallyExclusiveWithOtherModes()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
            "--qualify-sales",
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
    }

    [Fact]
    public void Parse_EditRejectsCanonicalTargetWithSourceValue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--source-value", "458-61A-203(1)",
            "--canonical-target", "PropertyUse",  // column-only field
        });

        args.Should().BeNull();
        err.Should().Contain("--canonical-target");
        err.Should().Contain("column-scope");
    }

    [Fact]
    public void Parse_EditRejectsCanonicalValueWithoutSourceValue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            // no --source-value (column scope)
            "--canonical-value", "TransferByDeed",  // code-value-only
        });

        args.Should().BeNull();
        err.Should().Contain("--canonical-value");
        err.Should().Contain("code-value-scope");
    }

    [Fact]
    public void Parse_EditRejectsCanonicalValueNullWithoutSourceValue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--canonical-value-null",
        });

        args.Should().BeNull();
        err.Should().Contain("--canonical-value-null");
        err.Should().Contain("code-value-scope");
    }

    [Fact]
    public void Parse_EditRejectsIsExcludedWithoutSourceValue()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--is-excluded", "true",
        });

        args.Should().BeNull();
        err.Should().Contain("--is-excluded");
        err.Should().Contain("code-value-scope");
    }

    [Fact]
    public void Parse_EditRejectsCanonicalValueAndCanonicalValueNullTogether()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--source-value", "458-61A-203(1)",
            "--canonical-value", "X",
            "--canonical-value-null",
        });

        args.Should().BeNull();
        err.Should().Contain("--canonical-value");
        err.Should().Contain("mutually exclusive");
    }

    [Theory]
    [InlineData("Mapped",       true)]
    [InlineData("Excluded",     true)]
    [InlineData("Deferred",     true)]
    [InlineData("NeedsReview",  true)]
    [InlineData("InProgress",   true)]
    [InlineData("mapped",       true)]   // case-insensitive
    [InlineData("MAPPED",       true)]
    [InlineData("BananaStatus", false)]
    [InlineData("",             false)]
    [InlineData("   ",          false)]
    public void Parse_EditRejectsInvalidReviewStatus(string status, bool valid)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--source-value", "458-61A-203(1)",
            "--review-status", status,
        });

        if (valid)
        {
            err.Should().BeNull();
            args!.EditReviewStatus.Should().Be(status);
        }
        else
        {
            args.Should().BeNull();
            err.Should().Contain("--review-status");
        }
    }

    [Theory]
    [InlineData("true",  true)]
    [InlineData("false", true)]
    [InlineData("True",  true)]   // case-insensitive
    [InlineData("FALSE", true)]
    [InlineData("yes",   false)]
    [InlineData("0",     false)]
    [InlineData("",      false)]
    public void Parse_EditRejectsInvalidIsExcluded(string raw, bool valid)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--source-value", "458-61A-203(1)",
            "--is-excluded", raw,
        });

        if (valid)
        {
            err.Should().BeNull();
            args!.EditIsExcluded.Should().Be(raw.Equals("true", StringComparison.OrdinalIgnoreCase));
        }
        else
        {
            args.Should().BeNull();
            err.Should().Contain("--is-excluded");
        }
    }

    [Fact]
    public void Parse_EditAllowsColumnNotes()
    {
        // Notes flag is allowed at column scope (no --source-value).
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--notes", "Review by EOD Friday",
            "--review-status", "InProgress",
        });

        err.Should().BeNull();
        args!.EditSourceValue.Should().BeNull();   // column scope
        args.EditNotes.Should().Be("Review by EOD Friday");
    }

    [Fact]
    public void Parse_EditAllowsCodeValueNotes()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--source-value", "458-61A-217(1)",
            "--review-status", "Excluded",
            "--is-excluded", "true",
            "--notes", "REET exemption; not arms-length.",
        });

        err.Should().BeNull();
        args!.EditSourceValue.Should().Be("458-61A-217(1)");
        args.EditNotes.Should().Be("REET exemption; not arms-length.");
    }

    [Fact]
    public void Parse_EditFlags_NotAllowedInProfileMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--source", "dbo.sale.wac_cd",
        });

        args.Should().BeNull();
        err.Should().Contain("--source");
        err.Should().Contain("--edit-mapping-workbook");
    }

    [Fact]
    public void Parse_FullEditFlagSet_RoundTripsAllFields()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--source-value", "458-61A-217(1)",
            "--canonical-value", "ExemptTransfer",
            "--review-status", "Excluded",
            "--is-excluded", "true",
            "--notes", "Operator-marked exempt.",
            "--operator", "bsval",
        });

        err.Should().BeNull();
        args!.EditMappingWorkbook.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.EditSourceSchema.Should().Be("dbo");
        args.EditSourceTable.Should().Be("sale");
        args.EditSourceColumn.Should().Be("wac_cd");
        args.EditSourceValue.Should().Be("458-61A-217(1)");
        args.EditCanonicalValue.Should().Be("ExemptTransfer");
        args.EditCanonicalValueNull.Should().BeFalse();
        args.EditReviewStatus.Should().Be("Excluded");
        args.EditIsExcluded.Should().BeTrue();
        args.EditNotes.Should().Be("Operator-marked exempt.");
        args.OperatorId.Should().Be("bsval");
    }

    [Fact]
    public void UsageText_MentionsEditFlags()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--edit-mapping-workbook");
        usage.Should().Contain("--source");
        usage.Should().Contain("--source-value");
        usage.Should().Contain("--canonical-target");
        usage.Should().Contain("--canonical-value");
        usage.Should().Contain("--canonical-value-null");
        usage.Should().Contain("--review-status");
        usage.Should().Contain("--is-excluded");
        usage.Should().Contain("--notes");
    }
}
