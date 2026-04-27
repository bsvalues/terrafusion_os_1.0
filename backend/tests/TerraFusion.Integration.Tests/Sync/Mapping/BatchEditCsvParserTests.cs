using FluentAssertions;
using TerraFusion.Sync.Workbench.Mapping;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Mapping;

/// <summary>
/// Slice C11-B tests for <see cref="BatchEditCsvParser"/> — pure
/// CSV-to-row tokenization. No DbContext, no I/O. Mirrors the
/// CliArgsParserTests pattern: every contract bullet point in the
/// C11-A policy doc gets one or more failing-input fixtures.
/// </summary>
public class BatchEditCsvParserTests
{
    private const string MinimalValidCsv =
        "scope,source_schema,source_table,source_column,source_value,review_status\n" +
        "code_value,dbo,sale,wac_cd,458-61A-203(1),Mapped\n";

    [Fact]
    public void BatchEditCsvParser_AcceptsMinimalValidCsv()
    {
        var result = BatchEditCsvParser.Parse(MinimalValidCsv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        var row = result.Rows[0];
        row.LineNumber.Should().Be(2);
        row.Scope.Should().Be("code_value");
        row.SourceSchema.Should().Be("dbo");
        row.SourceTable.Should().Be("sale");
        row.SourceColumn.Should().Be("wac_cd");
        row.SourceValue.Should().Be("458-61A-203(1)");
        row.ReviewStatus.Should().Be("Mapped");
        row.CanonicalTarget.Should().BeNull();
        row.CanonicalValue.Should().BeNull();
        row.CanonicalValueNullRaw.Should().BeNull();
        row.IsExcludedRaw.Should().BeNull();
        row.Notes.Should().BeNull();
    }

    [Fact]
    public void BatchEditCsvParser_RejectsMissingRequiredColumn()
    {
        // Missing review_status from header.
        var csv =
            "scope,source_schema,source_table,source_column,source_value\n" +
            "code_value,dbo,sale,wac_cd,X\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().NotBeNull();
        result.HeaderError.Should().Contain("review_status");
        result.Rows.Should().BeEmpty();
    }

    [Fact]
    public void BatchEditCsvParser_RejectsUnknownColumn()
    {
        // "source-value" with a hyphen is a typo for "source_value".
        var csv =
            "scope,source_schema,source_table,source_column,source-value,review_status\n" +
            "code_value,dbo,sale,wac_cd,X,Mapped\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().NotBeNull();
        result.HeaderError.Should().Contain("unknown column");
        result.HeaderError.Should().Contain("source-value");
    }

    [Fact]
    public void BatchEditCsvParser_RejectsDuplicateColumn()
    {
        // Same column listed twice (operator copy-paste mistake).
        var csv =
            "scope,scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,column,dbo,sale,wac_cd,X,Mapped\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().NotBeNull();
        result.HeaderError.Should().Contain("duplicate");
    }

    [Fact]
    public void BatchEditCsvParser_HeaderColumnsAreCaseInsensitive()
    {
        // Operator wrote "Scope" with a capital S — accept.
        var csv =
            "Scope,Source_Schema,SOURCE_TABLE,source_column,source_value,review_status\n" +
            "column,dbo,sale,wac_cd,,Mapped\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        result.Rows[0].Scope.Should().Be("column");
    }

    [Fact]
    public void BatchEditCsvParser_HandlesUtf8Bom()
    {
        // U+FEFF prepended to the otherwise-valid CSV.
        var csv = "﻿" + MinimalValidCsv;

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        result.Rows[0].Scope.Should().Be("code_value");
    }

    [Fact]
    public void BatchEditCsvParser_HandlesQuotedCommasAndNewlines()
    {
        // Operator note contains a literal comma AND a newline. The
        // RFC 4180 doubled-quote convention is also exercised.
        var csv =
            "scope,source_schema,source_table,source_column,source_value,review_status,notes\n" +
            "code_value,dbo,sale,wac_cd,X,Mapped,\"Line one, with comma\nLine two with \"\"quoted\"\" word\"\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        result.Rows[0].Notes.Should().Be("Line one, with comma\nLine two with \"quoted\" word");
    }

    [Fact]
    public void BatchEditCsvParser_HandlesCrlfLineEndings()
    {
        var csv =
            "scope,source_schema,source_table,source_column,source_value,review_status\r\n" +
            "code_value,dbo,sale,wac_cd,X,Mapped\r\n" +
            "code_value,dbo,sale,wac_cd,Y,Excluded\r\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(2);
        result.Rows[0].SourceValue.Should().Be("X");
        result.Rows[1].SourceValue.Should().Be("Y");
    }

    [Fact]
    public void BatchEditCsvParser_HandlesTrailingNewline()
    {
        // CSV without trailing newline.
        var csv =
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "column,dbo,sale,wac_cd,,Mapped";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        result.Rows[0].Scope.Should().Be("column");
    }

    [Fact]
    public void BatchEditCsvParser_SkipsBlankLines()
    {
        var csv =
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,X,Mapped\n" +
            "\n" +                                // blank line between rows
            "code_value,dbo,sale,wac_cd,Y,Excluded\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(2);
    }

    [Fact]
    public void BatchEditCsvParser_RejectsEmptyInput()
    {
        var result = BatchEditCsvParser.Parse(string.Empty);

        result.HeaderError.Should().NotBeNull();
        result.HeaderError.Should().Contain("empty");
        result.Rows.Should().BeEmpty();
    }

    [Fact]
    public void BatchEditCsvParser_PreservesAllOptionalFields()
    {
        // Every optional column populated; verify the parser pipes them
        // through verbatim (semantic validation lives in the service).
        var csv =
            "scope,source_schema,source_table,source_column,source_value,review_status," +
                "canonical_target,canonical_value,canonical_value_null,is_excluded,notes\n" +
            "code_value,dbo,sale,wac_cd,Y,Excluded,,ExemptTransfer,,true,REET exemption\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        var row = result.Rows[0];
        row.CanonicalTarget.Should().BeNull();        // empty cell
        row.CanonicalValue.Should().Be("ExemptTransfer");
        row.CanonicalValueNullRaw.Should().BeNull();  // empty cell
        row.IsExcludedRaw.Should().Be("true");
        row.Notes.Should().Be("REET exemption");
    }

    [Fact]
    public void BatchEditCsvParser_PassesSourceValueVerbatim()
    {
        // Whitespace-padded source_value — the parser MUST NOT trim;
        // the service trims for matching but reports raw value.
        // (Use quotes so embedded spaces round-trip cleanly.)
        var csv =
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,\"  X  \",Mapped\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        result.Rows[0].SourceValue.Should().Be("  X  ");
    }

    [Fact]
    public void BatchEditCsvParser_LineNumbersTrackPhysicalLines()
    {
        var csv =
            "scope,source_schema,source_table,source_column,source_value,review_status\n" +
            "code_value,dbo,sale,wac_cd,X,Mapped\n" +
            "code_value,dbo,sale,wac_cd,Y,Excluded\n" +
            "code_value,dbo,sale,wac_cd,Z,Deferred\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(3);
        result.Rows[0].LineNumber.Should().Be(2);
        result.Rows[1].LineNumber.Should().Be(3);
        result.Rows[2].LineNumber.Should().Be(4);
    }

    [Fact]
    public void BatchEditCsvParser_OptionalColumnsCanBeReordered()
    {
        // Operator put `notes` first, then `is_excluded`. Parser
        // resolves columns by name, so order is irrelevant.
        var csv =
            "notes,scope,source_schema,source_table,source_column,source_value,review_status,is_excluded\n" +
            "REET,code_value,dbo,sale,wac_cd,Y,Excluded,true\n";

        var result = BatchEditCsvParser.Parse(csv);

        result.HeaderError.Should().BeNull();
        result.Rows.Should().HaveCount(1);
        var row = result.Rows[0];
        row.Notes.Should().Be("REET");
        row.IsExcludedRaw.Should().Be("true");
        row.ReviewStatus.Should().Be("Excluded");
    }
}
