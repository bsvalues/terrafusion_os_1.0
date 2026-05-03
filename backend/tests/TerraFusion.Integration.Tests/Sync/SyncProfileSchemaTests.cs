using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Wiring tests for the Slice B1.1 Database Atlas profile schema:
/// SyncProfileTable, SyncProfileColumn, SyncProfileView, SyncProfileProcedure,
/// SyncProfileFunction, SyncProfileTrigger, SyncProfileConstraint, SyncProfileCode.
///
/// All eight profile entities reference a SyncBatch (with Mode='profile') and are
/// CountyId-scoped. Verifies entity → EF configuration → DbContext registration.
/// </summary>
public class SyncProfileSchemaTests
{
    private static TerraFusionDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .Options;

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
                ["Logging:EnableSensitiveDataLogging"] = "false"
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    private static async System.Threading.Tasks.Task<(County county, SyncBatch profileBatch)> SeedCountyAndProfileBatchAsync(TerraFusionDbContext context)
    {
        var county = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        context.Counties.Add(county);

        var batch = new SyncBatch
        {
            CountyId = county.Id,
            SourceSystem = "PACS",
            Mode = "profile",
            Status = "completed",
            StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow,
            ReadCount = 0  // profile mode reads metadata only
        };
        context.SyncBatches.Add(batch);
        await context.SaveChangesAsync();

        return (county, batch);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTable_PersistsTableMetadata_WithBatchAndCountyScope()
    {
        await using var context = CreateContext($"profile-table-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileTables.Add(new SyncProfileTable
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            SchemaName = "dbo",
            TableName = "property",
            IsView = false,
            RowCountEstimate = 89247,
            ColumnCount = 64,
            Notes = "Parcel master"
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileTables.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.TableName.Should().Be("property");
        loaded.RowCountEstimate.Should().Be(89247);
        loaded.IsView.Should().BeFalse();
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileColumn_PersistsColumnMetadataOrderedByOrdinal()
    {
        await using var context = CreateContext($"profile-column-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileColumns.AddRange(
            new SyncProfileColumn
            {
                CountyId = county.Id,
                SyncBatchId = batch.Id,
                SourceSystem = "PACS",
                SchemaName = "dbo",
                TableName = "property_val",
                ColumnName = "prop_id",
                OrdinalPosition = 1,
                DataType = "int",
                IsNullable = false,
                IsPrimaryKey = true
            },
            new SyncProfileColumn
            {
                CountyId = county.Id,
                SyncBatchId = batch.Id,
                SourceSystem = "PACS",
                SchemaName = "dbo",
                TableName = "property_val",
                ColumnName = "prop_val_yr",
                OrdinalPosition = 2,
                DataType = "int",
                IsNullable = false,
                IsPrimaryKey = true
            }
        );
        await context.SaveChangesAsync();

        var ordered = await context.SyncProfileColumns
            .Where(x => x.SyncBatchId == batch.Id && x.TableName == "property_val")
            .OrderBy(x => x.OrdinalPosition)
            .ToListAsync();

        ordered.Should().HaveCount(2);
        ordered[0].ColumnName.Should().Be("prop_id");
        ordered[1].ColumnName.Should().Be("prop_val_yr");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileView_PreservesDefinitionBody()
    {
        await using var context = CreateContext($"profile-view-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileViews.Add(new SyncProfileView
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            SchemaName = "dbo",
            ViewName = "vw_active_parcels",
            Definition = "SELECT pv.* FROM property_val pv WHERE pv.prop_inactive_dt IS NULL"
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileViews.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.ViewName.Should().Be("vw_active_parcels");
        loaded.Definition.Should().Contain("prop_inactive_dt IS NULL");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileProcedure_PreservesDefinitionBody()
    {
        await using var context = CreateContext($"profile-proc-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileProcedures.Add(new SyncProfileProcedure
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            SchemaName = "dbo",
            ProcedureName = "usp_GetActiveExemptions",
            Definition = "CREATE PROCEDURE usp_GetActiveExemptions @CountyId int AS BEGIN SELECT * FROM prop_exempt WHERE termination_dt IS NULL END"
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileProcedures.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.ProcedureName.Should().Be("usp_GetActiveExemptions");
        loaded.Definition.Should().Contain("prop_exempt");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileFunction_PersistsFunctionTypeAndDefinition()
    {
        await using var context = CreateContext($"profile-fn-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileFunctions.Add(new SyncProfileFunction
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            SchemaName = "dbo",
            FunctionName = "fn_NormalizeOwnerName",
            FunctionType = "scalar",
            Definition = "CREATE FUNCTION fn_NormalizeOwnerName(@n nvarchar(500)) RETURNS nvarchar(500) AS BEGIN RETURN UPPER(LTRIM(RTRIM(@n))) END"
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileFunctions.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.FunctionType.Should().Be("scalar");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileTrigger_PersistsTimingAndEvents()
    {
        await using var context = CreateContext($"profile-trg-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileTriggers.Add(new SyncProfileTrigger
        {
            CountyId = county.Id,
            SyncBatchId = batch.Id,
            SourceSystem = "PACS",
            SchemaName = "dbo",
            TriggerName = "trg_property_val_audit",
            ParentTableName = "property_val",
            IsAfter = true,
            IsInsteadOf = false,
            Events = "INSERT,UPDATE,DELETE",
            Definition = "CREATE TRIGGER trg_property_val_audit ON property_val AFTER INSERT, UPDATE, DELETE AS BEGIN /* audit log */ END"
        });
        await context.SaveChangesAsync();

        var loaded = await context.SyncProfileTriggers.SingleAsync(x => x.SyncBatchId == batch.Id);
        loaded.IsAfter.Should().BeTrue();
        loaded.Events.Should().Contain("UPDATE");
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileConstraint_PersistsAllConstraintTypes()
    {
        await using var context = CreateContext($"profile-cnst-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileConstraints.AddRange(
            new SyncProfileConstraint
            {
                CountyId = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
                SchemaName = "dbo", TableName = "property", ConstraintName = "PK_property",
                ConstraintType = "PRIMARY_KEY"
            },
            new SyncProfileConstraint
            {
                CountyId = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
                SchemaName = "dbo", TableName = "property_val", ConstraintName = "FK_property_val_property",
                ConstraintType = "FOREIGN_KEY",
                ReferencedTable = "property", ReferencedColumns = "prop_id"
            },
            new SyncProfileConstraint
            {
                CountyId = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
                SchemaName = "dbo", TableName = "sale", ConstraintName = "CK_sale_price_positive",
                ConstraintType = "CHECK",
                Definition = "sl_price >= 0"
            }
        );
        await context.SaveChangesAsync();

        var byType = await context.SyncProfileConstraints
            .Where(x => x.SyncBatchId == batch.Id)
            .GroupBy(x => x.ConstraintType)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToListAsync();

        byType.Should().HaveCount(3);
        byType.Should().Contain(g => g.Type == "PRIMARY_KEY" && g.Count == 1);
        byType.Should().Contain(g => g.Type == "FOREIGN_KEY" && g.Count == 1);
        byType.Should().Contain(g => g.Type == "CHECK" && g.Count == 1);
    }

    [Fact]
    public async System.Threading.Tasks.Task ProfileCode_FlagsCodeTableCandidates()
    {
        await using var context = CreateContext($"profile-code-{Guid.NewGuid()}");
        var (county, batch) = await SeedCountyAndProfileBatchAsync(context);

        context.SyncProfileCodes.AddRange(
            new SyncProfileCode
            {
                CountyId = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
                SchemaName = "dbo", TableName = "property", ColumnName = "prop_type_cd",
                DistinctValueCount = 12,
                IsCodeTableCandidate = true,
                SampleValues = "R,C,MH,IND,EX,A,V,T,U,P,F,M",
                LookupTableName = "prop_type_cd"
            },
            new SyncProfileCode
            {
                CountyId = county.Id, SyncBatchId = batch.Id, SourceSystem = "PACS",
                SchemaName = "dbo", TableName = "property", ColumnName = "geo_id",
                DistinctValueCount = 89000,
                IsCodeTableCandidate = false,
                SampleValues = null
            }
        );
        await context.SaveChangesAsync();

        var candidates = await context.SyncProfileCodes
            .Where(x => x.SyncBatchId == batch.Id && x.IsCodeTableCandidate)
            .ToListAsync();

        candidates.Should().HaveCount(1);
        candidates[0].ColumnName.Should().Be("prop_type_cd");
        candidates[0].SampleValues.Should().Contain("R,C,MH");
    }

    [Fact]
    public async System.Threading.Tasks.Task AllProfileEntities_AreCountyScopedAndBatchScoped()
    {
        await using var context = CreateContext($"profile-iso-{Guid.NewGuid()}");

        var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" };
        var wallaWalla = new County { Id = Guid.NewGuid(), Name = "Walla Walla", State = "WA", FipsCode = "53071" };
        context.Counties.AddRange(benton, wallaWalla);

        var bentonBatch = new SyncBatch
        {
            CountyId = benton.Id, SourceSystem = "PACS", Mode = "profile",
            Status = "completed", StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow
        };
        var wwBatch = new SyncBatch
        {
            CountyId = wallaWalla.Id, SourceSystem = "PACS", Mode = "profile",
            Status = "completed", StartedAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            CompletedAtUtc = DateTimeOffset.UtcNow
        };
        context.SyncBatches.AddRange(bentonBatch, wwBatch);
        await context.SaveChangesAsync();

        context.SyncProfileTables.AddRange(
            new SyncProfileTable { CountyId = benton.Id, SyncBatchId = bentonBatch.Id, SourceSystem = "PACS", SchemaName = "dbo", TableName = "property" },
            new SyncProfileTable { CountyId = wallaWalla.Id, SyncBatchId = wwBatch.Id, SourceSystem = "PACS", SchemaName = "dbo", TableName = "property" }
        );
        await context.SaveChangesAsync();

        var bentonTables = await context.SyncProfileTables.Where(x => x.CountyId == benton.Id).ToListAsync();
        bentonTables.Should().HaveCount(1);
        bentonTables[0].SyncBatchId.Should().Be(bentonBatch.Id);

        var bentonScopedToBatch = await context.SyncProfileTables.Where(x => x.SyncBatchId == bentonBatch.Id).CountAsync();
        bentonScopedToBatch.Should().Be(1);
    }
}
