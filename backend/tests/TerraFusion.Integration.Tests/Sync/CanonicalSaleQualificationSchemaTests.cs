using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync;

/// <summary>
/// Slice C35-B wiring tests: <see cref="CanonicalSaleQualification"/>
/// entity → EF configuration → DbContext registration is correctly
/// wired. The first canonical landing table in TerraFusion.
///
/// <para>Runs against EF.InMemory. Migration safety is proven
/// separately by:
/// <list type="bullet">
/// <item>Scaffold inspection (the migration's Up() method only
///   creates the new table + indices; no destructive changes).</item>
/// <item>Local <c>dotnet ef database update</c> applied at C35-B
///   commit time and verified against postgres
///   (<c>\d "CanonicalSaleQualifications"</c>).</item>
/// </list>
/// </para>
/// </summary>
public class CanonicalSaleQualificationSchemaTests
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
                ["Logging:EnableSensitiveDataLogging"] = "false",
            })
            .Build();

        return new TerraFusionDbContext(options, configuration);
    }

    // ── DbSet wiring ──────────────────────────────────────────────────

    [Fact]
    public void DbContext_ExposesCanonicalSaleQualificationsDbSet()
    {
        using var db = CreateContext($"c35b-dbset-{Guid.NewGuid()}");
        db.CanonicalSaleQualifications.Should().NotBeNull(
            "C35-B added DbSet<CanonicalSaleQualification> to TerraFusionDbContext");
    }

    [Fact]
    public void EntityType_IsRegisteredWithCorrectTableName()
    {
        using var db = CreateContext($"c35b-table-{Guid.NewGuid()}");
        var entityType = db.Model.FindEntityType(typeof(CanonicalSaleQualification));
        entityType.Should().NotBeNull();
        entityType!.GetTableName().Should().Be("CanonicalSaleQualifications");
    }

    [Fact]
    public void PrimaryKey_IsCompositeOnCountyIdAndChgOfOwnerId()
    {
        using var db = CreateContext($"c35b-pk-{Guid.NewGuid()}");
        var entityType = db.Model.FindEntityType(typeof(CanonicalSaleQualification))!;
        var pk = entityType.FindPrimaryKey();
        pk.Should().NotBeNull(
            "per D0-D, the canonical sale identity is (CountyId, ChgOfOwnerId)");
        pk!.Properties.Should().HaveCount(2);
        pk.Properties.Select(p => p.Name).Should().BeEquivalentTo(
            new[] { "CountyId", "ChgOfOwnerId" });
    }

    [Fact]
    public void TwoExpectedIndicesExist()
    {
        using var db = CreateContext($"c35b-idx-{Guid.NewGuid()}");
        var entityType = db.Model.FindEntityType(typeof(CanonicalSaleQualification))!;
        var indexNames = entityType.GetIndexes()
            .Select(i => i.GetDatabaseName()!)
            .ToList();

        indexNames.Should().Contain("IX_CanonSaleQual_Workbook_Decision",
            "primary consumer index — per-workbook decision rollups");
        indexNames.Should().Contain("IX_CanonSaleQual_County_Decision",
            "secondary consumer index — county-wide decision rollups");
    }

    // ── Roundtrip ─────────────────────────────────────────────────────

    [Fact]
    public async Task Roundtrip_PersistsAndReloadsAllFields()
    {
        var dbName = $"c35b-roundtrip-{Guid.NewGuid()}";
        var countyId = Guid.NewGuid();
        var workbookId = Guid.NewGuid();
        var lockedAt = new DateTime(2026, 4, 28, 19, 16, 46, DateTimeKind.Utc);
        var saleDate = new DateTime(2018, 6, 15, 0, 0, 0, DateTimeKind.Utc);

        // Insert
        await using (var db = CreateContext(dbName))
        {
            db.CanonicalSaleQualifications.Add(new CanonicalSaleQualification
            {
                CountyId                    = countyId,
                ChgOfOwnerId                = 12345,
                ComputedDecision            = CanonicalSaleQualificationDecision.Excluded,
                WacCdSourceValue            = "458-61A-203(1)",
                WacCdCanonicalValue         = "458-61A-203(1) — REET exemption: transfer by deed",
                WacCdAxisDecision           = CanonicalSaleAxisDecision.Excluded,
                SlRatioTypeCdSourceValue    = "00",
                SlRatioTypeCdCanonicalValue = "00 — Unqualified",
                SlRatioTypeCdAxisDecision   = CanonicalSaleAxisDecision.Excluded,
                SourceWorkbookId            = workbookId,
                SourceWorkbookLockedAt      = lockedAt,
                SaleDate                    = saleDate,
                SalePrice                   = 450000.00m,
                CreatedBy                   = "c36-transform",
                UpdatedBy                   = "c36-transform",
            });
            await db.SaveChangesAsync();
        }

        // Reload + assert
        await using (var db = CreateContext(dbName))
        {
            var row = await db.CanonicalSaleQualifications
                .AsNoTracking()
                .SingleAsync(r => r.CountyId == countyId && r.ChgOfOwnerId == 12345);

            row.ComputedDecision.Should().Be(CanonicalSaleQualificationDecision.Excluded);
            row.WacCdSourceValue.Should().Be("458-61A-203(1)");
            row.WacCdCanonicalValue.Should().Be(
                "458-61A-203(1) — REET exemption: transfer by deed");
            row.WacCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.Excluded);
            row.SlRatioTypeCdSourceValue.Should().Be("00");
            row.SlRatioTypeCdCanonicalValue.Should().Be("00 — Unqualified");
            row.SlRatioTypeCdAxisDecision.Should().Be(CanonicalSaleAxisDecision.Excluded);
            row.SourceWorkbookId.Should().Be(workbookId);
            row.SourceWorkbookLockedAt.Should().Be(lockedAt);
            row.SaleDate.Should().Be(saleDate);
            row.SalePrice.Should().Be(450000.00m);
            row.CreatedBy.Should().Be("c36-transform");
            row.UpdatedBy.Should().Be("c36-transform");
        }
    }

    [Fact]
    public async Task PrimaryKey_RejectsDuplicateInsert()
    {
        // Per the C35-A "idempotent re-write" contract, the same
        // (CountyId, ChgOfOwnerId) cannot be inserted twice. C36
        // will use Upsert/Update for re-evaluation.
        var dbName = $"c35b-pk-dup-{Guid.NewGuid()}";
        var countyId = Guid.NewGuid();

        await using var db = CreateContext(dbName);
        db.CanonicalSaleQualifications.Add(new CanonicalSaleQualification
        {
            CountyId = countyId, ChgOfOwnerId = 1,
            ComputedDecision = CanonicalSaleQualificationDecision.Qualified,
            WacCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SourceWorkbookId = Guid.NewGuid(),
            SourceWorkbookLockedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        // Second insert with same PK — InMemory provider rejects at Add() time.
        // (Real Postgres would reject at SaveChanges; either path proves the PK
        // collision is caught.)
        Action act = () => db.CanonicalSaleQualifications.Add(new CanonicalSaleQualification
        {
            CountyId = countyId, ChgOfOwnerId = 1,
            ComputedDecision = CanonicalSaleQualificationDecision.Excluded,
            WacCdAxisDecision = CanonicalSaleAxisDecision.Excluded,
            SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Excluded,
            SourceWorkbookId = Guid.NewGuid(),
            SourceWorkbookLockedAt = DateTime.UtcNow,
        });

        act.Should().Throw<InvalidOperationException>(
            "primary key collision must be rejected; C36 uses Update for re-evaluation");
        // (Avoid the unused-async warning.)
        await Task.CompletedTask;
    }

    [Fact]
    public async Task UpdateInPlace_PreservesPrimaryKeyAndOverwritesDecision()
    {
        // C35-A's idempotent re-write contract: re-evaluating the same
        // sale against a re-locked workbook overwrites the decision in
        // place. PK stays put. Audit trail of prior decisions lives in
        // AuditLogs (FISMA-required), not in this table.
        var dbName = $"c35b-update-{Guid.NewGuid()}";
        var countyId = Guid.NewGuid();
        var firstWorkbookId = Guid.NewGuid();
        var secondWorkbookId = Guid.NewGuid();

        await using (var db = CreateContext(dbName))
        {
            db.CanonicalSaleQualifications.Add(new CanonicalSaleQualification
            {
                CountyId = countyId, ChgOfOwnerId = 99,
                ComputedDecision = CanonicalSaleQualificationDecision.Qualified,
                WacCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
                SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
                SourceWorkbookId = firstWorkbookId,
                SourceWorkbookLockedAt = DateTime.UtcNow.AddDays(-1),
            });
            await db.SaveChangesAsync();
        }

        // Re-evaluation against a re-locked workbook
        await using (var db = CreateContext(dbName))
        {
            var row = await db.CanonicalSaleQualifications
                .SingleAsync(r => r.CountyId == countyId && r.ChgOfOwnerId == 99);
            row.ComputedDecision = CanonicalSaleQualificationDecision.Excluded;
            row.WacCdAxisDecision = CanonicalSaleAxisDecision.Excluded;
            row.SourceWorkbookId = secondWorkbookId;
            row.SourceWorkbookLockedAt = DateTime.UtcNow;
            row.UpdatedBy = "c36-transform-reevaluation";
            await db.SaveChangesAsync();
        }

        await using (var db = CreateContext(dbName))
        {
            var rows = await db.CanonicalSaleQualifications
                .AsNoTracking()
                .Where(r => r.CountyId == countyId && r.ChgOfOwnerId == 99)
                .ToListAsync();

            rows.Should().HaveCount(1, "idempotent re-write — single row, not appended");
            rows[0].ComputedDecision.Should().Be(
                CanonicalSaleQualificationDecision.Excluded);
            rows[0].SourceWorkbookId.Should().Be(secondWorkbookId);
            rows[0].UpdatedBy.Should().Be("c36-transform-reevaluation");
        }
    }

    // ── Sovereign-county isolation ────────────────────────────────────

    [Fact]
    public async Task CompositeKey_AllowsSameChgOfOwnerIdInDifferentCounties()
    {
        // Two counties may both happen to have a sale with chg_of_owner_id = 1
        // (extremely unlikely in practice but allowed by the schema). The
        // composite PK (CountyId, ChgOfOwnerId) keeps them separate.
        var dbName = $"c35b-county-iso-{Guid.NewGuid()}";
        var bentonId = Guid.NewGuid();
        var yakimaId = Guid.NewGuid();
        var lockedAt = DateTime.UtcNow;

        await using var db = CreateContext(dbName);
        db.CanonicalSaleQualifications.Add(new CanonicalSaleQualification
        {
            CountyId = bentonId, ChgOfOwnerId = 1,
            ComputedDecision = CanonicalSaleQualificationDecision.Qualified,
            WacCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SourceWorkbookId = Guid.NewGuid(),
            SourceWorkbookLockedAt = lockedAt,
        });
        db.CanonicalSaleQualifications.Add(new CanonicalSaleQualification
        {
            CountyId = yakimaId, ChgOfOwnerId = 1,    // ← same chg_of_owner_id, different county
            ComputedDecision = CanonicalSaleQualificationDecision.Excluded,
            WacCdAxisDecision = CanonicalSaleAxisDecision.Excluded,
            SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Excluded,
            SourceWorkbookId = Guid.NewGuid(),
            SourceWorkbookLockedAt = lockedAt,
        });

        await db.SaveChangesAsync();

        var benton = await db.CanonicalSaleQualifications.AsNoTracking()
            .SingleAsync(r => r.CountyId == bentonId);
        var yakima = await db.CanonicalSaleQualifications.AsNoTracking()
            .SingleAsync(r => r.CountyId == yakimaId);

        benton.ComputedDecision.Should().Be(CanonicalSaleQualificationDecision.Qualified);
        yakima.ComputedDecision.Should().Be(CanonicalSaleQualificationDecision.Excluded);
    }

    // ── Enum storage ──────────────────────────────────────────────────

    [Fact]
    public void DecisionEnums_StoredAsInt()
    {
        using var db = CreateContext($"c35b-enum-{Guid.NewGuid()}");
        var entityType = db.Model.FindEntityType(typeof(CanonicalSaleQualification))!;

        entityType.FindProperty(nameof(CanonicalSaleQualification.ComputedDecision))!
            .ClrType.Should().Be(typeof(CanonicalSaleQualificationDecision));
        entityType.FindProperty(nameof(CanonicalSaleQualification.WacCdAxisDecision))!
            .ClrType.Should().Be(typeof(CanonicalSaleAxisDecision));
        entityType.FindProperty(nameof(CanonicalSaleQualification.SlRatioTypeCdAxisDecision))!
            .ClrType.Should().Be(typeof(CanonicalSaleAxisDecision));

        // Enum int values are pinned per C35-A's policy (forward-compat
        // without string-rename migration).
        ((int)CanonicalSaleQualificationDecision.Qualified).Should().Be(1);
        ((int)CanonicalSaleQualificationDecision.Excluded).Should().Be(2);
        ((int)CanonicalSaleQualificationDecision.Inconclusive).Should().Be(3);

        ((int)CanonicalSaleAxisDecision.Qualified).Should().Be(1);
        ((int)CanonicalSaleAxisDecision.Excluded).Should().Be(2);
        ((int)CanonicalSaleAxisDecision.NotMapped).Should().Be(3);
    }
}
