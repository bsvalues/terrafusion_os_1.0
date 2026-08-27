using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using FluentAssertions;
using TerraFusion.Core.Sync.Profiles;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync;

public sealed class ReadOnlyCountySourceAdapterContractTests
{
    [Fact]
    public void Adapter_exposes_only_one_bounded_read_operation()
    {
        var methods = typeof(IReadOnlyCountySourceAdapter).GetMethods();

        methods.Should().ContainSingle();
        methods[0].Name.Should().Be(nameof(IReadOnlyCountySourceAdapter.ReadPageAsync));
        methods[0].ReturnType.Should().Be<Task<ReadOnlySourceReadPage>>();
        methods.Select(method => method.Name).Should().NotContain(name =>
            new[] { "write", "update", "delete", "execute", "connect", "sync" }
                .Any(verb => name.Contains(verb, StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public void Source_profile_requires_explicit_governed_identities()
    {
        var profile = new ReadOnlyCountySourceProfile(
            Guid.NewGuid(),
            "WA-005",
            "mock-harris-export",
            "sql-family",
            "bounded-select",
            "schema-v1",
            "mapping-v1",
            "watermark-v1",
            TimeSpan.FromHours(24));

        profile.CountyCode.Should().Be("WA-005");
        profile.SourceIdentity.Should().Be("mock-harris-export");
        profile.SourceFamily.Should().Be("sql-family");
        profile.ExtractionMethod.Should().Be("bounded-select");
        profile.SchemaVersion.Should().Be("schema-v1");
        profile.MappingVersion.Should().Be("mapping-v1");
        profile.CheckpointStrategy.Should().Be("watermark-v1");
        profile.FreshnessTarget.Should().Be(TimeSpan.FromHours(24));
        typeof(ReadOnlyCountySourceProfile)
            .GetProperties()
            .Select(property => property.Name)
            .Should()
            .NotContain(name =>
                new[] { "connection", "credential", "password", "secret" }
                    .Any(term => name.Contains(term, StringComparison.OrdinalIgnoreCase)));

        var constructWithBlankSource = () => new ReadOnlyCountySourceProfile(
            Guid.NewGuid(),
            "WA-005",
            " ",
            "sql-family",
            "bounded-select",
            "schema-v1",
            "mapping-v1",
            "watermark-v1",
            TimeSpan.FromHours(24));
        constructWithBlankSource.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Guarded_command_has_no_public_constructor()
    {
        typeof(ReadOnlySourceCommand)
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .Should()
            .BeEmpty();
    }

    [Theory]
    [InlineData("SELECT parcel_id, updated_at FROM parcels WHERE county_id = @countyId")]
    [InlineData("  select COUNT(*) FROM source_rows WHERE changed_at > @checkpoint  ")]
    public void Guard_accepts_one_explicit_parameterized_select(string commandText)
    {
        var guarded = ReadOnlySourceCommandGuard.RequireRead(commandText);

        guarded.Text.Should().Be(commandText.Trim());
        var request = new ReadOnlySourceReadRequest(
            guarded,
            new Dictionary<string, object?> { ["countyId"] = Guid.NewGuid() },
            maxRows: 500,
            checkpoint: "checkpoint-1");
        request.MaxRows.Should().Be(500);
    }

    [Theory]
    [InlineData("INSERT INTO parcels(id) VALUES (1)")]
    [InlineData("UPDATE parcels SET value = 1")]
    [InlineData("DELETE FROM parcels")]
    [InlineData("MERGE parcels USING incoming ON 1 = 1 WHEN MATCHED THEN UPDATE SET value = 1")]
    [InlineData("CREATE TABLE copy(id int)")]
    [InlineData("ALTER TABLE parcels ADD value int")]
    [InlineData("DROP TABLE parcels")]
    [InlineData("TRUNCATE TABLE parcels")]
    [InlineData("EXEC refresh_parcels")]
    [InlineData("BEGIN TRANSACTION")]
    [InlineData("WITH changed AS (DELETE FROM parcels RETURNING *) SELECT * FROM changed")]
    [InlineData("SELECT * INTO parcel_copy FROM parcels")]
    [InlineData("SELECT next value for parcel_sequence")]
    [InlineData("SELECT * FROM parcels FOR UPDATE")]
    public void Guard_rejects_dml_ddl_execution_and_ambiguous_operations(string commandText)
    {
        var act = () => ReadOnlySourceCommandGuard.RequireRead(commandText);

        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("SELECT * FROM parcels; SELECT * FROM owners")]
    [InlineData("SELECT * FROM parcels SELECT * FROM owners")]
    [InlineData("SELECT * FROM parcels GO SELECT * FROM owners")]
    [InlineData("SELECT * FROM parcels;")]
    [InlineData("SELECT * FROM parcels -- trusted read")]
    [InlineData("SELECT * FROM parcels /* trusted read */")]
    [InlineData("SELECT * FROM #temporary")]
    [InlineData("SELECT\n* FROM parcels")]
    [InlineData("SEL\u200bECT * FROM parcels")]
    public void Guard_rejects_multiple_statements_comments_and_obfuscation(string commandText)
    {
        var act = () => ReadOnlySourceCommandGuard.RequireRead(commandText);

        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("WITH rows AS (SELECT * FROM parcels) SELECT * FROM rows")]
    [InlineData("EXPLAIN SELECT * FROM parcels")]
    [InlineData("SHOW TABLES")]
    [InlineData("VALUES (1)")]
    public void Guard_rejects_blank_or_ambiguous_commands(string commandText)
    {
        var act = () => ReadOnlySourceCommandGuard.RequireRead(commandText);

        act.Should().Throw<ArgumentException>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(10001)]
    public void Read_request_rejects_unbounded_page_sizes(int maxRows)
    {
        var command = ReadOnlySourceCommandGuard.RequireRead("SELECT parcel_id FROM parcels");
        var act = () => new ReadOnlySourceReadRequest(
            command,
            new Dictionary<string, object?>(),
            maxRows);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
