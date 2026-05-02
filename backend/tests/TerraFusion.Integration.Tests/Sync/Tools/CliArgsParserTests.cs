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

    // ── Slice C10-B — Mapping Workbook lock ─────────────────────────────
    //
    // Six-way mode mutex now: profile / generate / export / qualify /
    // edit / lock. Lock mode requires --workbook-id only; rejects all
    // other modes' flags; tolerates --connection-id (the lock service
    // never queries PACS).

    [Fact]
    public void Parse_LockMappingWorkbookSetsMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
        });

        err.Should().BeNull();
        args!.LockMappingWorkbook.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.ConnectionId.Should().BeNull();
        args.GenerateMappingWorkbook.Should().BeFalse();
        args.ExportMappingWorkbook.Should().BeFalse();
        args.QualifySales.Should().BeFalse();
        args.EditMappingWorkbook.Should().BeFalse();
    }

    [Fact]
    public void Parse_LockRequiresWorkbookId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            // no --workbook-id
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--lock-mapping-workbook");
    }

    [Fact]
    public void Parse_LockRejectsProfileFlags()
    {
        // --deep-profile is profile-mode-only; lock mode must reject it.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--deep-profile",
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile");
        err.Should().Contain("Mapping Workbook lock");
    }

    [Fact]
    public void Parse_LockRejectsGenerateFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--workbook-name", "should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-name");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Fact]
    public void Parse_LockRejectsExportFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--output-dir");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_LockRejectsQualifyFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
        });

        args.Should().BeNull();
        err.Should().Contain("--source-connection-id");
        err.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_LockRejectsEditFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
        });

        args.Should().BeNull();
        err.Should().Contain("--source");
        err.Should().Contain("--edit-mapping-workbook");
    }

    [Fact]
    public void Parse_LockMutuallyExclusiveWithOtherModes()
    {
        // Six-way mutex sanity: lock + edit fails with a mutex error,
        // not a per-flag error.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--edit-mapping-workbook",
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
        err.Should().Contain("--lock-mapping-workbook");
    }

    [Fact]
    public void Parse_LockAllowsDbAndCountyOnly()
    {
        // Happy path: lock with the bare-minimum required flags plus
        // an optional --operator override. --connection-id is tolerated
        // (parser-side; lock service never reads it).
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--operator", "bsval",
        });

        err.Should().BeNull();
        args!.LockMappingWorkbook.Should().BeTrue();
        args.TerraFusionDbConnectionString.Should().Be(ValidDb);
        args.CountyId.Should().Be(Guid.Parse(ValidCounty));
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.OperatorId.Should().Be("bsval");
    }

    [Fact]
    public void Parse_LockMode_ExistingModesRemainCompatible()
    {
        // Sanity: adding the lock mode must not regress the other five.
        // Parse one happy-path invocation per mode and confirm the
        // expected toggle is set without an error.
        var profile = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
        });
        profile.Error.Should().BeNull();
        profile.Args!.LockMappingWorkbook.Should().BeFalse();
        profile.Args.GenerateMappingWorkbook.Should().BeFalse();

        var generate = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--generate-mapping-workbook",
            "--latest-profile-batch",
            "--workbook-name", "bench",
        });
        generate.Error.Should().BeNull();
        generate.Args!.GenerateMappingWorkbook.Should().BeTrue();
        generate.Args.LockMappingWorkbook.Should().BeFalse();

        var export = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--export-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/x",
        });
        export.Error.Should().BeNull();
        export.Args!.ExportMappingWorkbook.Should().BeTrue();
        export.Args.LockMappingWorkbook.Should().BeFalse();

        var qualify = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
        });
        qualify.Error.Should().BeNull();
        qualify.Args!.QualifySales.Should().BeTrue();
        qualify.Args.LockMappingWorkbook.Should().BeFalse();

        var edit = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
        });
        edit.Error.Should().BeNull();
        edit.Args!.EditMappingWorkbook.Should().BeTrue();
        edit.Args.LockMappingWorkbook.Should().BeFalse();
    }

    [Fact]
    public void UsageText_IncludesLockMode()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--lock-mapping-workbook");
        usage.Should().Contain("Slice C10-B");
        usage.Should().Contain("Draft→Mapped");
    }

    // ── Slice C11-B — Mapping Workbook batch edit ──────────────────────
    //
    // Seven-way mode mutex now: profile / generate / export / qualify /
    // edit / lock / batch-edit. Batch-edit requires --workbook-id +
    // --input-csv + exactly one of --dry-run / --apply.

    [Fact]
    public void Parse_BatchEditMappingWorkbookSetsMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--dry-run",
        });

        err.Should().BeNull();
        args!.BatchEditMappingWorkbook.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.InputCsvPath.Should().Be("/tmp/edits.csv");
        args.BatchEditDryRun.Should().BeTrue();
        args.BatchEditApply.Should().BeFalse();
    }

    [Fact]
    public void Parse_BatchEditRequiresWorkbookId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            // no --workbook-id
            "--input-csv", "/tmp/edits.csv",
            "--dry-run",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--batch-edit-mapping-workbook");
    }

    [Fact]
    public void Parse_BatchEditRequiresInputCsv()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            // no --input-csv
            "--dry-run",
        });

        args.Should().BeNull();
        err.Should().Contain("--input-csv");
        err.Should().Contain("--batch-edit-mapping-workbook");
    }

    [Fact]
    public void Parse_BatchEditRequiresExactlyOneOfDryRunOrApply()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            // neither --dry-run nor --apply
        });

        args.Should().BeNull();
        err.Should().Contain("--dry-run");
        err.Should().Contain("--apply");
    }

    [Fact]
    public void Parse_BatchEditRejectsBothDryRunAndApply()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--dry-run",
            "--apply",
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
        err.Should().Contain("--dry-run");
        err.Should().Contain("--apply");
    }

    [Fact]
    public void Parse_BatchEditRejectsProfileFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--dry-run",
            "--deep-profile",
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile");
        err.Should().Contain("Mapping Workbook batch edit");
    }

    [Fact]
    public void Parse_BatchEditRejectsGenerateFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--apply",
            "--workbook-name", "should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-name");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Fact]
    public void Parse_BatchEditRejectsExportFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--apply",
            "--output-dir", "/tmp/should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--output-dir");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_BatchEditRejectsQualifyFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--apply",
            "--source-connection-id", ValidConnection,
        });

        args.Should().BeNull();
        err.Should().Contain("--source-connection-id");
        err.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_BatchEditRejectsSingleRowEditFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--apply",
            "--source", "dbo.sale.wac_cd",
        });

        args.Should().BeNull();
        err.Should().Contain("--source");
        err.Should().Contain("--edit-mapping-workbook");
    }

    [Fact]
    public void Parse_BatchEditMutuallyExclusiveWithLockMode()
    {
        // Seven-way mutex check: batch-edit + lock-mapping-workbook
        // fails with the mutex error.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--apply",
            "--lock-mapping-workbook",
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
        err.Should().Contain("--batch-edit-mapping-workbook");
    }

    [Fact]
    public void Parse_BatchEditMutuallyExclusiveWithEditMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
            "--apply",
            "--edit-mapping-workbook",
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
    }

    [Fact]
    public void Parse_BatchEditFlagsRejectedInOtherModes()
    {
        // --input-csv in profile mode → rejected.
        var (a1, e1) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--input-csv", "/tmp/edits.csv",
        });
        a1.Should().BeNull();
        e1.Should().Contain("--input-csv");
        e1.Should().Contain("--batch-edit-mapping-workbook");

        // --dry-run in qualify mode → rejected.
        var (a2, e2) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--qualify-sales",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
            "--max-sales", "10",
            "--dry-run",
        });
        a2.Should().BeNull();
        e2.Should().Contain("--dry-run");
        e2.Should().Contain("--batch-edit-mapping-workbook");

        // --apply in lock mode → rejected.
        var (a3, e3) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--apply",
        });
        a3.Should().BeNull();
        e3.Should().Contain("--apply");
        e3.Should().Contain("--batch-edit-mapping-workbook");
    }

    [Fact]
    public void Parse_BatchEditMode_ExistingModesRemainCompatible()
    {
        // Sanity: adding the seventh mode must not regress the other six.
        var profile = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
        });
        profile.Error.Should().BeNull();
        profile.Args!.BatchEditMappingWorkbook.Should().BeFalse();

        var lockMode = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
        });
        lockMode.Error.Should().BeNull();
        lockMode.Args!.LockMappingWorkbook.Should().BeTrue();
        lockMode.Args.BatchEditMappingWorkbook.Should().BeFalse();

        var edit = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
            "--review-status", "Mapped",
        });
        edit.Error.Should().BeNull();
        edit.Args!.EditMappingWorkbook.Should().BeTrue();
        edit.Args.BatchEditMappingWorkbook.Should().BeFalse();
    }

    [Fact]
    public void UsageText_IncludesBatchEditMode()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--batch-edit-mapping-workbook");
        usage.Should().Contain("--input-csv");
        usage.Should().Contain("--dry-run");
        usage.Should().Contain("--apply");
        usage.Should().Contain("Slice C11-B");
    }

    // ── Slice C14-B — Mapping Workbook review progress ─────────────────
    //
    // Eight-way mode mutex now: profile / generate / export / qualify /
    // edit / lock / batch-edit / review-progress. Progress mode requires
    // only --workbook-id; rejects all other modes' input flags;
    // tolerates --connection-id (the read-only service never queries
    // PACS).

    [Fact]
    public void Parse_MappingReviewProgressSetsMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
        });

        err.Should().BeNull();
        args!.MappingReviewProgress.Should().BeTrue();
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.GenerateMappingWorkbook.Should().BeFalse();
        args.ExportMappingWorkbook.Should().BeFalse();
        args.QualifySales.Should().BeFalse();
        args.EditMappingWorkbook.Should().BeFalse();
        args.LockMappingWorkbook.Should().BeFalse();
        args.BatchEditMappingWorkbook.Should().BeFalse();
    }

    [Fact]
    public void Parse_ProgressRequiresWorkbookId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            // no --workbook-id
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--mapping-review-progress");
    }

    [Fact]
    public void Parse_ProgressRejectsProfileFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
            "--deep-profile",
        });

        args.Should().BeNull();
        err.Should().Contain("--deep-profile");
        err.Should().Contain("Mapping Workbook review progress");
    }

    [Fact]
    public void Parse_ProgressRejectsGenerateFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
            "--workbook-name", "should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-name");
        err.Should().Contain("--generate-mapping-workbook");
    }

    [Fact]
    public void Parse_ProgressRejectsExportFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
            "--output-dir", "/tmp/should-be-rejected",
        });

        args.Should().BeNull();
        err.Should().Contain("--output-dir");
        err.Should().Contain("--export-mapping-workbook");
    }

    [Fact]
    public void Parse_ProgressRejectsQualifyFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
            "--source-connection-id", ValidConnection,
        });

        args.Should().BeNull();
        err.Should().Contain("--source-connection-id");
        err.Should().Contain("--qualify-sales");
    }

    [Fact]
    public void Parse_ProgressRejectsEditFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.sale.wac_cd",
        });

        args.Should().BeNull();
        err.Should().Contain("--source");
        err.Should().Contain("--edit-mapping-workbook");
    }

    [Fact]
    public void Parse_ProgressRejectsBatchEditFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/edits.csv",
        });

        args.Should().BeNull();
        err.Should().Contain("--input-csv");
        err.Should().Contain("--batch-edit-mapping-workbook");
    }

    [Theory]
    [InlineData("--generate-mapping-workbook")]
    [InlineData("--export-mapping-workbook")]
    [InlineData("--qualify-sales")]
    [InlineData("--edit-mapping-workbook")]
    [InlineData("--lock-mapping-workbook")]
    [InlineData("--batch-edit-mapping-workbook")]
    public void Parse_ProgressMutuallyExclusiveWithOtherModes(string otherModeFlag)
    {
        // Eight-way mutex sanity: progress + any other mode toggle
        // fails with the mutex error, not a per-flag error.
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
            otherModeFlag,
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
        err.Should().Contain("--mapping-review-progress");
    }

    [Fact]
    public void Parse_ProgressMode_ExistingModesRemainCompatible()
    {
        // Sanity: adding the eighth mode must not regress the other seven.
        var profile = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
        });
        profile.Error.Should().BeNull();
        profile.Args!.MappingReviewProgress.Should().BeFalse();

        var batch = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--batch-edit-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/x.csv",
            "--dry-run",
        });
        batch.Error.Should().BeNull();
        batch.Args!.BatchEditMappingWorkbook.Should().BeTrue();
        batch.Args.MappingReviewProgress.Should().BeFalse();

        var lockMode = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--lock-mapping-workbook",
            "--workbook-id", ValidWorkbookId,
        });
        lockMode.Error.Should().BeNull();
        lockMode.Args!.LockMappingWorkbook.Should().BeTrue();
        lockMode.Args.MappingReviewProgress.Should().BeFalse();
    }

    [Fact]
    public void Parse_ProgressTolratesConnectionId()
    {
        // The progress service never queries PACS, so --connection-id
        // is tolerated (matches lock-mode posture).
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,  // tolerated
            "--mapping-review-progress",
            "--workbook-id", ValidWorkbookId,
        });

        err.Should().BeNull();
        args!.MappingReviewProgress.Should().BeTrue();
        args.ConnectionId.Should().Be(Guid.Parse(ValidConnection));
    }

    [Fact]
    public void UsageText_IncludesProgressMode()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--mapping-review-progress");
        usage.Should().Contain("Slice C14-B");
        usage.Should().Contain("read-only");
    }

    // ── Slice C22-B — PACS dictionary loader mode ──────────────────────
    //
    // Nine-way mode mutex now: profile / generate / export / qualify /
    // edit / lock / batch-edit / review-progress / load-pacs-dictionary.
    // Load-pacs-dictionary requires --workbook-id, --table, AND
    // --connection-id (it reads PACS); rejects all other modes' input
    // flags; allowlist enforced for --table.

    [Fact]
    public void Parse_LoadPacsDictionarySetsMode()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--load-pacs-dictionary",
            "--table", "property_use",
            "--workbook-id", ValidWorkbookId,
        });

        err.Should().BeNull();
        args!.LoadPacsDictionary.Should().BeTrue();
        args.PacsDictionaryTable.Should().Be("property_use");
        args.WorkbookId.Should().Be(Guid.Parse(ValidWorkbookId));
        args.ConnectionId.Should().Be(Guid.Parse(ValidConnection));
        args.MappingReviewProgress.Should().BeFalse();
        args.BatchEditMappingWorkbook.Should().BeFalse();
    }

    [Fact]
    public void Parse_LoadPacsDictionaryRequiresWorkbookId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--load-pacs-dictionary",
            "--table", "property_use",
            // no --workbook-id
        });

        args.Should().BeNull();
        err.Should().Contain("--workbook-id");
        err.Should().Contain("--load-pacs-dictionary");
    }

    [Fact]
    public void Parse_LoadPacsDictionaryRequiresTable()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--load-pacs-dictionary",
            "--workbook-id", ValidWorkbookId,
            // no --table
        });

        args.Should().BeNull();
        err.Should().Contain("--table");
        err.Should().Contain("--load-pacs-dictionary");
    }

    [Fact]
    public void Parse_LoadPacsDictionaryRequiresConnectionId()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--load-pacs-dictionary",
            "--table", "property_use",
            "--workbook-id", ValidWorkbookId,
            // no --connection-id
        });

        args.Should().BeNull();
        err.Should().Contain("--connection-id");
        err.Should().Contain("--load-pacs-dictionary");
    }

    [Fact]
    public void Parse_LoadPacsDictionaryRejectsTableNotInAllowlist()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--load-pacs-dictionary",
            "--table", "imprv_attr_val",  // not in allowlist for C22-B
            "--workbook-id", ValidWorkbookId,
        });

        args.Should().BeNull();
        err.Should().Contain("imprv_attr_val");
        err.Should().Contain("not in the dictionary loader allowlist");
        err.Should().Contain("property_use");
        err.Should().Contain("imprv_det_class",
            "C23-A added imprv_det_class to the allowlist alongside property_use");
        err.Should().Contain("land_soil",
            "C24-A added land_soil to the allowlist (RCW 84.34-sensitive)");
        err.Should().Contain("imprv_det_meth",
            "C25-A added imprv_det_meth to the allowlist (Improvement-method axis)");
        err.Should().Contain("imprv_det_sub_class",
            "C26-A added imprv_det_sub_class to the allowlist (sub-class refinement axis)");
    }

    [Fact]
    public void Parse_LoadPacsDictionaryRejectsEditFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--load-pacs-dictionary",
            "--table", "property_use",
            "--workbook-id", ValidWorkbookId,
            "--source", "dbo.property_val.property_use_cd",  // edit-mode flag
        });

        args.Should().BeNull();
        err.Should().Contain("--source");
        err.Should().Contain("--edit-mapping-workbook");
    }

    [Fact]
    public void Parse_LoadPacsDictionaryRejectsBatchEditFlags()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--load-pacs-dictionary",
            "--table", "property_use",
            "--workbook-id", ValidWorkbookId,
            "--input-csv", "/tmp/x.csv",
        });

        args.Should().BeNull();
        err.Should().Contain("--input-csv");
        err.Should().Contain("--batch-edit-mapping-workbook");
    }

    [Theory]
    [InlineData("--generate-mapping-workbook")]
    [InlineData("--export-mapping-workbook")]
    [InlineData("--qualify-sales")]
    [InlineData("--edit-mapping-workbook")]
    [InlineData("--lock-mapping-workbook")]
    [InlineData("--batch-edit-mapping-workbook")]
    [InlineData("--mapping-review-progress")]
    public void Parse_LoadPacsDictionaryMutuallyExclusiveWithOtherModes(string otherModeFlag)
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--load-pacs-dictionary",
            "--table", "property_use",
            "--workbook-id", ValidWorkbookId,
            otherModeFlag,
        });

        args.Should().BeNull();
        err.Should().Contain("mutually exclusive");
        err.Should().Contain("--load-pacs-dictionary");
    }

    [Fact]
    public void UsageText_IncludesLoadPacsDictionaryMode()
    {
        var usage = CliArgsParser.UsageText;
        usage.Should().Contain("--load-pacs-dictionary");
        usage.Should().Contain("Slice C22-B");
        usage.Should().Contain("property_use");
        usage.Should().Contain("read-only");
    }

    [Fact]
    public void IsAllowedPacsDictionaryTable_AllowlistGrowsByExplicitPolicyAmendment()
    {
        // C22-A: property_use
        CliArgsParser.IsAllowedPacsDictionaryTable("property_use").Should().BeTrue();
        CliArgsParser.IsAllowedPacsDictionaryTable("PROPERTY_USE").Should().BeTrue(
            "case-insensitive matching");

        // C23-A: imprv_det_class
        CliArgsParser.IsAllowedPacsDictionaryTable("imprv_det_class").Should().BeTrue();
        CliArgsParser.IsAllowedPacsDictionaryTable("IMPRV_DET_CLASS").Should().BeTrue();

        // C24-A: land_soil (RCW 84.34-sensitive)
        CliArgsParser.IsAllowedPacsDictionaryTable("land_soil").Should().BeTrue();
        CliArgsParser.IsAllowedPacsDictionaryTable("LAND_SOIL").Should().BeTrue();

        // C25-A: imprv_det_meth (Improvement-method axis)
        CliArgsParser.IsAllowedPacsDictionaryTable("imprv_det_meth").Should().BeTrue();
        CliArgsParser.IsAllowedPacsDictionaryTable("IMPRV_DET_METH").Should().BeTrue();

        // C26-A: imprv_det_sub_class (sub-class refinement axis)
        CliArgsParser.IsAllowedPacsDictionaryTable("imprv_det_sub_class").Should().BeTrue();
        CliArgsParser.IsAllowedPacsDictionaryTable("IMPRV_DET_SUB_CLASS").Should().BeTrue();

        // Still rejected (no policy amendment yet)
        CliArgsParser.IsAllowedPacsDictionaryTable("imprv_attr_val").Should().BeFalse();
        CliArgsParser.IsAllowedPacsDictionaryTable("nbhd_codes").Should().BeFalse();
        CliArgsParser.IsAllowedPacsDictionaryTable("imprv_det_type").Should().BeFalse(
            "imprv_det_type is lane-mismatched in Other and needs its own slice");
        CliArgsParser.IsAllowedPacsDictionaryTable("").Should().BeFalse();
    }

    // ========================================================================
    // BENTON-SYNC-2-FIX1: --schema-catalog-health mode parser regression.
    //
    // BENTON-SYNC-2 added the SchemaCatalogHealth flag to the CliArgs record
    // and a top-level branch in the dispatcher, but the mode-specific
    // validation block in Parse() was missing the corresponding `else if`
    // branch. The flag fell through to the load-pacs-dictionary `else`,
    // which then rejected the invocation with "--workbook-id is required
    // when --load-pacs-dictionary is set" — a confusing wrong-mode error
    // surfaced by BENTON-SYNC-3's live-PACS proof attempt.
    //
    // This regression test pins the corrected behavior.
    // ========================================================================

    [Fact]
    public void Parse_SchemaCatalogHealth_WithRequiredFlags_Succeeds()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--schema-catalog-health"
        });

        err.Should().BeNull(
            "BENTON-SYNC-2-FIX1: --schema-catalog-health is a valid mode and " +
            "MUST NOT fall through to the load-pacs-dictionary validation block");
        args.Should().NotBeNull();
        args!.SchemaCatalogHealth.Should().BeTrue();
        args.LoadPacsDictionary.Should().BeFalse(
            "schema-catalog-health is a distinct mode from load-pacs-dictionary");
        args.GenerateMappingWorkbook.Should().BeFalse();
        args.WorkbookId.Should().BeNull(
            "schema-catalog-health does not take --workbook-id and MUST NOT " +
            "complain about it being absent");
    }

    // ========================================================================
    // BENTON-SYNC-5: --invariant-artifact-path optional flag for the
    // schema-catalog-health mode. Persists the catalog's invariant report
    // as a byte-stable JSON artifact via PacsSchemaInvariantReportArtifact.
    // Caller-driven per the C53-CONS-D contract; absence of the flag
    // preserves stdout-only behavior.
    // ========================================================================

    [Fact]
    public void Parse_SchemaCatalogHealth_WithInvariantArtifactPath_Succeeds()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--schema-catalog-health",
            "--invariant-artifact-path", "/tmp/benton-invariant.json"
        });

        err.Should().BeNull();
        args.Should().NotBeNull();
        args!.SchemaCatalogHealth.Should().BeTrue();
        args.InvariantArtifactPath.Should().Be("/tmp/benton-invariant.json");
    }

    [Fact]
    public void Parse_SchemaCatalogHealth_WithoutInvariantArtifactPath_PathIsNull()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--schema-catalog-health"
        });

        err.Should().BeNull();
        args!.InvariantArtifactPath.Should().BeNull(
            "absence of --invariant-artifact-path preserves stdout-only behavior");
    }

    [Fact]
    public void Parse_InvariantArtifactPath_WithoutValue_ReturnsError()
    {
        var (args, err) = CliArgsParser.Parse(new[]
        {
            "--db", ValidDb,
            "--county-id", ValidCounty,
            "--connection-id", ValidConnection,
            "--schema-catalog-health",
            "--invariant-artifact-path"
        });

        args.Should().BeNull();
        err.Should().Contain("--invariant-artifact-path requires a value");
    }
}
