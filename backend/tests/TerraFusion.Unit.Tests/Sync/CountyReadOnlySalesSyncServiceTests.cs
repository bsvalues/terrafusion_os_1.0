using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Auth;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.PACS;
using TerraFusion.Core.Sync;
using TerraFusion.Data;
using TerraFusion.Data.Services.Sync;
using Xunit;
using Task = System.Threading.Tasks.Task;
using ICountyResolver = TerraFusion.Core.Services.ICountyResolver;
using CountyNotFoundException = TerraFusion.Core.Services.CountyNotFoundException;
using IOlsRegressionService = TerraFusion.API.Services.IOlsRegressionService;
using ISaleQualificationService = TerraFusion.API.Services.ISaleQualificationService;

namespace TerraFusion.Unit.Tests.Sync;

public sealed class CountyReadOnlySalesSyncServiceTests
{
    private static readonly Guid BentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid FranklinId = Guid.Parse("26260026-2626-2626-2626-262626262626");
    private static readonly WashingtonCountyIdentity Benton = WashingtonCountyRegistry.Counties
        .Single(county => county.Key == "wa-benton");
    private static readonly WashingtonCountyIdentity Franklin = WashingtonCountyRegistry.Counties
        .Single(county => county.Key == "wa-franklin");

    [Fact]
    public void PacsSqlAdapterDoesNotQualifySourceWithoutReadOnlyIntent()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:PacsConnection"] =
                    "Server=pacs;Database=benton_pacs;Encrypt=True;TrustServerCertificate=False;Application Name=TerraFusion-Test",
            }).Build();

        using var adapter = new PacsSqlAdapter(NullLogger<PacsSqlAdapter>.Instance, configuration);

        Assert.False(adapter.MatchesSource("pacs", "benton_pacs"));
    }

    [Fact]
    public void PacsSqlAdapterWithReadOnlyIntentQualifiesAsExternalReadOnlyBoundary()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:PacsConnection"] =
                    "Server=pacs;Database=benton_pacs;Encrypt=True;TrustServerCertificate=False;Application Name=TerraFusion-Test;ApplicationIntent=ReadOnly",
            }).Build();

        using var adapter = new PacsSqlAdapter(NullLogger<PacsSqlAdapter>.Instance, configuration);

        Assert.IsAssignableFrom<IExternalReadOnlyPacsAdapter>(adapter);
        Assert.True(adapter.MatchesSource("PACS", "BENTON_PACS"));
        Assert.False(adapter.MatchesSource("franklin-pacs", "benton_pacs"));
    }

    [Fact]
    public void PacsSqlAdapterPersistsTheRequiredAuditApplicationName()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:PacsConnection"] =
                    "Server=pacs;Database=benton_pacs;Encrypt=True;TrustServerCertificate=False;Application Name=TerraFusion-Other;ApplicationIntent=ReadOnly",
            }).Build();

        using var adapter = new PacsSqlAdapter(NullLogger<PacsSqlAdapter>.Instance, configuration);

        foreach (var fieldName in new[] { "_connectionString", "_salesConnectionString" })
        {
            var field = typeof(PacsSqlAdapter).GetField(
                fieldName,
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            var value = Assert.IsType<string>(field?.GetValue(adapter));
            Assert.Equal(
                "TerraFusion-OS",
                new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(value).ApplicationName);
        }
    }

    [Fact]
    public void PacsSqlAdapterRejectsTrustServerCertificateBypass()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["ConnectionStrings:PacsConnection"] =
                    "Server=pacs;Database=benton_pacs;Encrypt=True;TrustServerCertificate=True;Application Name=TerraFusion-Test;ApplicationIntent=ReadOnly",
            }).Build();

        var exception = Assert.Throws<PacsContractViolationException>(() =>
            new PacsSqlAdapter(NullLogger<PacsSqlAdapter>.Instance, configuration));

        Assert.Equal(PacsErrorCodes.ConnectionFailed, exception.ErrorCode);
        Assert.Contains("TrustServerCertificate=false", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task SyncRejectsAConnectionWhoseLoginStillHasWriteAuthority()
    {
        var factory = new InMemoryFactory();
        var connectionId = Guid.Parse("55550055-5555-5555-5555-555555555555");
        await using (var seed = factory.CreateDbContext())
        {
            seed.Counties.Add(new County
            {
                Id = BentonId,
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
            });
            seed.SyncSourceConnections.Add(new SyncSourceConnection
            {
                Id = connectionId,
                CountyId = BentonId,
                Name = "Benton PACS source",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "benton-pacs-ro",
                Database = "benton_pacs",
                AuthMode = "WindowsIntegrated",
                AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly",
                IsActive = true,
            });
            await seed.SaveChangesAsync();
        }

        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var context = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");

        var result = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(context));

        Assert.Equal(CountyReadOnlySalesSyncDisposition.Denied, result.Disposition);
        Assert.Equal(CountyReadOnlySalesSyncDenialCode.SourceWriteAuthorityDetected, result.DenialCode);
        await using var verify = factory.CreateDbContext();
        var connection = await verify.SyncSourceConnections.SingleAsync();
        Assert.Equal("SOURCE_WRITE_AUTHORITY_DETECTED", connection.LastConnectionErrorMessage);
        Assert.Empty(await verify.ComparableSales.ToListAsync());
        Assert.Empty(await verify.AuditEvents.ToListAsync());
    }

    [Fact]
    public async Task SyncIsCountyBoundDurableIdempotentAndNeverUsesDevelopmentAdapter()
    {
        var factory = new InMemoryFactory();
        await using (var seed = factory.CreateDbContext())
        {
            seed.Counties.AddRange(
                new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" },
                new County { Id = FranklinId, Name = "Franklin", State = "WA", FipsCode = "53021" });
            seed.SyncSourceConnections.Add(new SyncSourceConnection
            {
                Id = Guid.Parse("55550055-5555-5555-5555-555555555555"),
                CountyId = BentonId,
                Name = "Benton PACS production read replica",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "benton-pacs-ro",
                Database = "benton_pacs",
                AuthMode = "WindowsIntegrated",
                AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly",
                IsActive = true,
            });
            await seed.SaveChangesAsync();
        }

        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsConnectionStatus
            {
                IsConnected = true,
                DatabaseName = "benton_pacs",
                ServerName = "b***o",
            });
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.ValidateSalesContractAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsContractProof { IsValid = true, ContractId = "pacscontract.v1" });
        adapter.Setup(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsPagedResult<PacsComparableSale>
            {
                Page = 1,
                PageSize = 500,
                TotalCount = 3,
                Items = new[]
                {
                    new PacsComparableSale
                    {
                        PacsChgOfOwnerId = 5001,
                        PropId = 1001,
                        GeoId = "BEN-1001",
                        SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 425_000m,
                        PropTypeCd = "A1",
                        Consideration = " 425000 ",
                        SaleComment = " arms-length review pending ",
                    },
                    new PacsComparableSale
                    {
                        PacsChgOfOwnerId = 5002,
                        PropId = 1002,
                        GeoId = "BEN-1002",
                        SaleDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 390_000m,
                        PropTypeCd = "ZZ",
                    },
                    new PacsComparableSale
                    {
                        PacsChgOfOwnerId = 5001,
                        PropId = 1001,
                        GeoId = "BEN-1001",
                        SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 425_000m,
                        PropTypeCd = "A1",
                        Consideration = " 425000 ",
                        SaleComment = " arms-length review pending ",
                    },
                },
            });
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var benton = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");
        var franklin = await CreateCountyContextAsync(Franklin, FranklinId, "franklin-assessor");

        var first = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(benton));
        var second = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(benton));
        var foreign = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(franklin));

        Assert.Equal(CountyReadOnlySalesSyncDisposition.Completed, first.Disposition);
        Assert.Equal(2, first.Receipt!.SourceRows);
        Assert.Equal(2, first.Receipt.AddedSales);
        Assert.Equal(2, first.Receipt.AvailableSales);
        Assert.Equal(CountyReadOnlySalesSyncDisposition.Completed, second.Disposition);
        Assert.Equal(0, second.Receipt!.AddedSales);
        Assert.Equal(2, second.Receipt.UpdatedSales);
        Assert.Equal(CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured, foreign.DenialCode);

        await using var verify = factory.CreateDbContext();
        var sales = await verify.ComparableSales.OrderBy(sale => sale.ParcelId).ToListAsync();
        Assert.Equal(2, sales.Count);
        Assert.All(sales, sale =>
        {
            Assert.Equal(BentonId, sale.CountyId);
            Assert.Equal("county-readonly-sync", sale.IngestedBy);
            Assert.StartsWith("county-readonly-sync:55550055-", sale.VerificationSource);
            Assert.True(sale.PacsChgOfOwnerId > 0);
            Assert.True(sale.PacsPropId > 0);
        });
        Assert.Equal("multifamily", sales[0].PropertyType);
        Assert.Equal("A1", sales[0].ImprvTypeCode);
        Assert.Equal("unknown", sales[1].PropertyType);
        Assert.Equal("ZZ", sales[1].ImprvTypeCode);
        Assert.Equal(" 425000 ", sales[0].PacsConsideration);
        Assert.Equal(" arms-length review pending ", sales[0].RawComment);
        Assert.Equal(2, await verify.AuditEvents.CountAsync(trace =>
            trace.CountyId == BentonId
            && trace.UserId == "benton-assessor"
            && trace.Action == "valuation.readonly-sales-synced"));
        Assert.Empty(await verify.ComparableSales.Where(sale => sale.CountyId == FranklinId).ToListAsync());
        adapter.Verify(value => value.GetComparableSalesAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task ReplacingTheRegisteredConnectionPreservesCountyPacsSaleIdentity()
    {
        var factory = new InMemoryFactory();
        var retiredConnectionId = Guid.Parse("55550055-5555-5555-5555-555555555555");
        var replacementConnectionId = Guid.Parse("66660066-6666-6666-6666-666666666666");
        await using (var seed = factory.CreateDbContext())
        {
            seed.Counties.Add(new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" });
            seed.SyncSourceConnections.Add(ReadOnlyPacsConnection(retiredConnectionId));
            await seed.SaveChangesAsync();
        }

        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsConnectionStatus { IsConnected = true, DatabaseName = "benton_pacs" });
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.ValidateSalesContractAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsContractProof { IsValid = true, ContractId = "pacscontract.v1" });
        adapter.Setup(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsPagedResult<PacsComparableSale>
            {
                Page = 1,
                PageSize = 500,
                TotalCount = 1,
                Items =
                [
                    new PacsComparableSale
                    {
                        PacsChgOfOwnerId = 5001,
                        PropId = 1001,
                        GeoId = "BEN-1001",
                        SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 425_000m,
                    },
                ],
            });
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var context = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");

        var first = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(context));
        await using (var replace = factory.CreateDbContext())
        {
            (await replace.SyncSourceConnections.SingleAsync()).IsActive = false;
            replace.SyncSourceConnections.Add(ReadOnlyPacsConnection(replacementConnectionId));
            await replace.SaveChangesAsync();
        }
        var second = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(context));

        Assert.Equal(1, first.Receipt!.AddedSales);
        Assert.Equal(0, second.Receipt!.AddedSales);
        Assert.Equal(1, second.Receipt.UpdatedSales);
        await using var verify = factory.CreateDbContext();
        var persisted = await verify.ComparableSales.SingleAsync();
        Assert.Equal(BentonId, persisted.CountyId);
        Assert.Equal(5001, persisted.PacsChgOfOwnerId);
        Assert.Equal(1001, persisted.PacsPropId);
        Assert.StartsWith($"county-readonly-sync:{replacementConnectionId:D}:", persisted.VerificationSource);
    }

    [Fact]
    public async Task SyncRejectsConflictingDatesForTheSamePacsSourceIdentity()
    {
        var factory = new InMemoryFactory();
        await using (var seed = factory.CreateDbContext())
        {
            seed.Counties.Add(new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" });
            seed.SyncSourceConnections.Add(new SyncSourceConnection
            {
                Id = Guid.Parse("56560056-5656-5656-5656-565656565656"),
                CountyId = BentonId,
                Name = "Benton PACS production read replica",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "benton-pacs-ro",
                Database = "benton_pacs",
                AuthMode = "WindowsIntegrated",
                AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly",
                IsActive = true,
            });
            await seed.SaveChangesAsync();
        }

        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsConnectionStatus { IsConnected = true, DatabaseName = "benton_pacs" });
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.ValidateSalesContractAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsContractProof { IsValid = true, ContractId = "pacscontract.v1" });
        adapter.Setup(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsPagedResult<PacsComparableSale>
            {
                Page = 1,
                PageSize = 500,
                TotalCount = 2,
                Items = new[]
                {
                    new PacsComparableSale
                    {
                        PacsChgOfOwnerId = 5001,
                        PropId = 1001,
                        GeoId = "BEN-1001",
                        SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 425_000m,
                    },
                    new PacsComparableSale
                    {
                        PacsChgOfOwnerId = 5001,
                        PropId = 1001,
                        GeoId = "BEN-1001",
                        SaleDate = new DateTime(2026, 1, 16, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 425_000m,
                    },
                },
            });
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var context = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");

        var result = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(context));

        Assert.Equal(CountyReadOnlySalesSyncDisposition.Denied, result.Disposition);
        Assert.Equal(CountyReadOnlySalesSyncDenialCode.SourceDataInvalid, result.DenialCode);
        await using var verify = factory.CreateDbContext();
        Assert.Empty(await verify.ComparableSales.ToListAsync());
        Assert.Equal("SOURCE_DATA_INVALID", (await verify.SyncSourceConnections.SingleAsync()).LastConnectionErrorMessage);
    }

    [Fact]
    public async Task SyncRejectsInvalidOrOverLimitVerbatimPacsFields()
    {
        var invalidFields = new (string? Consideration, string? SaleComment)[]
        {
            ("invalid\u0001consideration", null),
            (new string('c', 501), null),
            (null, "invalid\u0001comment"),
            (null, new string('m', 501)),
        };

        foreach (var invalid in invalidFields)
        {
            var factory = new InMemoryFactory();
            var connectionId = Guid.NewGuid();
            await using (var seed = factory.CreateDbContext())
            {
                seed.Counties.Add(new County
                {
                    Id = BentonId,
                    Name = "Benton",
                    State = "WA",
                    FipsCode = "53005",
                });
                seed.SyncSourceConnections.Add(new SyncSourceConnection
                {
                    Id = connectionId,
                    CountyId = BentonId,
                    Name = "Benton PACS source",
                    SourceSystem = "PACS",
                    ConnectionType = "SqlServer",
                    Server = "benton-pacs-ro",
                    Database = "benton_pacs",
                    AuthMode = "WindowsIntegrated",
                    AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly",
                    IsActive = true,
                });
                await seed.SaveChangesAsync();
            }

            var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
            adapter.As<IExternalReadOnlyPacsAdapter>()
                .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
                .Returns(true);
            adapter.As<IExternalReadOnlyPacsAdapter>()
                .Setup(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
            adapter.As<IExternalReadOnlyPacsAdapter>()
                .Setup(value => value.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PacsConnectionStatus
                {
                    IsConnected = true,
                    DatabaseName = "benton_pacs",
                });
            adapter.As<IExternalReadOnlyPacsAdapter>()
                .Setup(value => value.ValidateSalesContractAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PacsContractProof { IsValid = true, ContractId = "pacscontract.v1" });
            adapter.Setup(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PacsPagedResult<PacsComparableSale>
                {
                    Page = 1,
                    PageSize = 500,
                    TotalCount = 1,
                    Items = new[]
                    {
                        new PacsComparableSale
                        {
                            PacsChgOfOwnerId = 5001,
                            PropId = 1001,
                            GeoId = "BEN-1001",
                            SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                            SalePrice = 425_000m,
                            Consideration = invalid.Consideration,
                            SaleComment = invalid.SaleComment,
                        },
                    },
                });
            var service = new CountyReadOnlySalesSyncService(
                factory,
                adapter.Object,
                NullLogger<CountyReadOnlySalesSyncService>.Instance);
            var context = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");

            var result = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(context));

            Assert.Equal(CountyReadOnlySalesSyncDisposition.Denied, result.Disposition);
            Assert.Equal(CountyReadOnlySalesSyncDenialCode.SourceDataInvalid, result.DenialCode);
            await using var verify = factory.CreateDbContext();
            Assert.Empty(await verify.ComparableSales.ToListAsync());
            Assert.Equal(
                "SOURCE_DATA_INVALID",
                (await verify.SyncSourceConnections.SingleAsync()).LastConnectionErrorMessage);
        }
    }

    [Fact]
    public async Task RelationalPersistenceFailureRollsBackSalesSuccessStateAndAuditReceipt()
    {
        using var factory = new SqliteFactory();
        var connectionId = Guid.Parse("55550055-5555-5555-5555-555555555555");
        await using (var seed = factory.CreateDbContext())
        {
            seed.Counties.Add(new County
            {
                Id = BentonId,
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
            });
            seed.SyncSourceConnections.Add(new SyncSourceConnection
            {
                Id = connectionId,
                CountyId = BentonId,
                Name = "Benton PACS source",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "benton-pacs-ro",
                Database = "benton_pacs",
                AuthMode = "WindowsIntegrated",
                AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly",
                IsActive = true,
            });
            await seed.SaveChangesAsync();
            await seed.Database.ExecuteSqlRawAsync("""
                CREATE TRIGGER fail_county_sync_audit
                BEFORE INSERT ON AuditEvents
                WHEN NEW.Action = 'valuation.readonly-sales-synced'
                BEGIN
                    SELECT RAISE(ABORT, 'forced audit persistence failure');
                END;
                """);
        }

        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsConnectionStatus
            {
                IsConnected = true,
                DatabaseName = "benton_pacs",
                ServerName = "b***o",
            });
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.ValidateSalesContractAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsContractProof { IsValid = true, ContractId = "pacscontract.v1" });
        adapter.Setup(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsPagedResult<PacsComparableSale>
            {
                Page = 1,
                PageSize = 500,
                TotalCount = 1,
                Items = new[]
                {
                    new PacsComparableSale
                    {
                        PacsChgOfOwnerId = 5001,
                        PropId = 1001,
                        GeoId = "BEN-1001",
                        SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 425_000m,
                        PropTypeCd = "R1",
                    },
                },
            });
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var context = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");

        var result = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(context));

        Assert.Equal(CountyReadOnlySalesSyncDisposition.Failed, result.Disposition);
        await using var verify = factory.CreateDbContext();
        Assert.Empty(await verify.ComparableSales.ToListAsync());
        Assert.Empty(await verify.AuditEvents.ToListAsync());
        var source = await verify.SyncSourceConnections.SingleAsync();
        Assert.Null(source.LastSuccessfulConnectionAtUtc);
        Assert.Null(source.UpdatedBy);
        Assert.Equal("READ_ONLY_SYNC_FAILED", source.LastConnectionErrorMessage);
    }

    [Fact]
    public async Task AvailabilityDoesNotBorrowAnotherCountysConnectedSales()
    {
        var factory = new InMemoryFactory();
        await using (var seed = factory.CreateDbContext())
        {
            seed.Counties.AddRange(
                new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" },
                new County { Id = FranklinId, Name = "Franklin", State = "WA", FipsCode = "53021" });
            seed.ComparableSales.Add(new ComparableSale
            {
                Id = Guid.NewGuid(),
                CountyId = BentonId,
                ParcelId = "BEN-ONLY",
                SaleDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                SalePrice = 100_000m,
                PropertyType = "unknown",
                IngestedBy = "county-readonly-sync",
                VerificationSource = "county-readonly-sync:source:1",
            });
            await seed.SaveChangesAsync();
        }
        var adapter = new Mock<IPacsAdapter>();
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var franklin = await CreateCountyContextAsync(Franklin, FranklinId, "franklin-assessor");

        var availability = await service.GetAvailabilityAsync(franklin);

        Assert.False(availability.SalesReviewAvailable);
        Assert.Equal(0, availability.AvailableSales);
        Assert.Equal("not-configured", availability.Status);
    }

    [Fact]
    public async Task AvailabilityFailsClosedAfterConnectionFailureOrSourceIdentityDrift()
    {
        var factory = new InMemoryFactory();
        var connectionId = Guid.Parse("55550055-5555-5555-5555-555555555555");
        await using (var seed = factory.CreateDbContext())
        {
            seed.Counties.Add(new County
            {
                Id = BentonId,
                Name = "Benton",
                State = "WA",
                FipsCode = "53005",
            });
            seed.SyncSourceConnections.Add(new SyncSourceConnection
            {
                Id = connectionId,
                CountyId = BentonId,
                Name = "Benton PACS production read replica",
                SourceSystem = "PACS",
                ConnectionType = "SqlServer",
                Server = "benton-pacs-ro",
                Database = "benton_pacs",
                AuthMode = "WindowsIntegrated",
                AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly",
                IsActive = true,
                LastSuccessfulConnectionAtUtc = new DateTimeOffset(2026, 9, 3, 10, 0, 0, TimeSpan.Zero),
                LastConnectionErrorAtUtc = new DateTimeOffset(2026, 9, 3, 10, 1, 0, TimeSpan.Zero),
            });
            seed.ComparableSales.Add(new ComparableSale
            {
                Id = Guid.NewGuid(),
                CountyId = BentonId,
                ParcelId = "BEN-ONLY",
                SaleDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                SalePrice = 100_000m,
                PropertyType = "unknown",
                IngestedBy = "county-readonly-sync",
                VerificationSource = $"county-readonly-sync:{connectionId:D}:1",
            });
            seed.ComparableSales.Add(new ComparableSale
            {
                Id = Guid.NewGuid(),
                CountyId = BentonId,
                ParcelId = "BEN-RETIRED-SOURCE",
                SaleDate = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
                SalePrice = 110_000m,
                PropertyType = "unknown",
                IngestedBy = "county-readonly-sync",
                VerificationSource = "county-readonly-sync:77770077-7777-7777-7777-777777777777:2",
            });
            await seed.SaveChangesAsync();
        }
        var adapter = new Mock<IPacsAdapter>();
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var benton = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");

        var failed = await service.GetAvailabilityAsync(benton);

        Assert.True(failed.ConnectionConfigured);
        Assert.False(failed.SalesReviewAvailable);
        Assert.Equal(1, failed.AvailableSales);
        Assert.Equal("last-sync-failed", failed.Status);

        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(false);
        var drifted = await service.GetAvailabilityAsync(benton);

        Assert.False(drifted.ConnectionConfigured);
        Assert.False(drifted.SalesReviewAvailable);
        Assert.Equal("source-identity-mismatch", drifted.Status);
    }

    [Fact]
    public async Task TerraForgeAdmissionUsesOnlyTheExactActiveConnection()
    {
        var factory = new InMemoryFactory();
        var activeConnectionId = Guid.NewGuid();
        await using var db = factory.CreateDbContext();
        db.ComparableSales.AddRange(
            ConnectedSale(activeConnectionId, "active"),
            ConnectedSale(Guid.NewGuid(), "retired"),
            new ComparableSale
            {
                Id = Guid.NewGuid(),
                CountyId = BentonId,
                ParcelId = "UPLOADED",
                SaleDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                SalePrice = 300_000m,
                SalesYear = 2026,
                IngestedBy = "county-upload",
                VerificationSource = "county-upload:batch",
            });
        await db.SaveChangesAsync();

        var resolver = new StaticCountyResolver(Benton, BentonId);
        var accessor = new StaticContextAccessor(new RequestUserContext(
            true,
            "benton-assessor",
            Benton.Key,
            ["Assessor"]));
        var provider = new AuthenticatedCanonicalCountyContextProvider(
            new AuthenticatedCountyAuthorityBinding(accessor, resolver),
            new AuthenticatedCanonicalCountyContext(resolver));
        var sync = new Mock<ICountyReadOnlySalesSyncService>();
        sync.Setup(candidate => candidate.GetAvailabilityAsync(
                It.IsAny<AuthenticatedCanonicalCountyContextResult>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CountyReadOnlySalesSyncAvailability(
                ICountyReadOnlySalesSyncService.ContractId,
                BentonId,
                activeConnectionId,
                true,
                "PACS",
                DateTimeOffset.UtcNow,
                1,
                "2025-06-01",
                2026,
                true,
                "available"));
        var controller = new TerraForgeController(
            db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>(),
            Mock.Of<ISaleQualificationService>(),
            resolver,
            provider,
            sync.Object);

        var result = await controller.GetSaleQualification(
            taxYear: 2026,
            admissionSource: "county-readonly-sync",
            status: "pending");
        var ok = Assert.IsType<OkObjectResult>(result);
        var body = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value)).RootElement;

        Assert.Equal(1, body.GetProperty("total").GetInt32());

        var missingSource = await controller.GetSaleQualification(
            taxYear: 2026,
            status: "pending");
        Assert.IsType<BadRequestObjectResult>(missingSource);

        var canonicalResult = await controller.GetSaleQualification(
            taxYear: 2026,
            admissionSource: "canonical",
            status: "pending");
        var canonicalOk = Assert.IsType<OkObjectResult>(canonicalResult);
        var canonicalBody = JsonDocument.Parse(JsonSerializer.Serialize(canonicalOk.Value)).RootElement;
        Assert.Equal(1, canonicalBody.GetProperty("total").GetInt32());
        Assert.Equal("UPLOADED", canonicalBody.GetProperty("items")[0].GetProperty("parcelId").GetString());

        ComparableSale ConnectedSale(Guid connectionId, string suffix) => new()
        {
            Id = Guid.NewGuid(),
            CountyId = BentonId,
            ParcelId = $"CONNECTED-{suffix}",
            SaleDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice = 300_000m,
            SalesYear = 2026,
            IngestedBy = "county-readonly-sync",
            VerificationSource = $"county-readonly-sync:{connectionId:D}:{suffix}",
        };
    }

    private static SyncSourceConnection ReadOnlyPacsConnection(Guid connectionId) => new()
    {
        Id = connectionId,
        CountyId = BentonId,
        Name = "Benton PACS production read replica",
        SourceSystem = "PACS",
        ConnectionType = "SqlServer",
        Server = "benton-pacs-ro",
        Database = "benton_pacs",
        AuthMode = "WindowsIntegrated",
        AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly",
        IsActive = true,
    };

    private static async Task<AuthenticatedCanonicalCountyContextResult> CreateCountyContextAsync(
        WashingtonCountyIdentity county,
        Guid countyId,
        string actorId)
    {
        var resolver = new StaticCountyResolver(county, countyId);
        var binding = await new AuthenticatedCountyAuthorityBinding(
                new StaticContextAccessor(new RequestUserContext(
                    IsAuthenticated: true,
                    UserId: actorId,
                    CountyId: county.Key,
                    Roles: Array.Empty<string>())),
                resolver)
            .BindCurrentAsync();
        return await new AuthenticatedCanonicalCountyContext(resolver).EstablishAsync(binding);
    }

    private sealed class InMemoryFactory : IDbContextFactory<TerraFusionDbContext>
    {
        private readonly DbContextOptions<TerraFusionDbContext> _options =
            new DbContextOptionsBuilder<TerraFusionDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;
        private readonly IConfiguration _configuration = new ConfigurationBuilder().Build();

        public TerraFusionDbContext CreateDbContext() => new(_options, _configuration);

        public Task<TerraFusionDbContext> CreateDbContextAsync(
            CancellationToken cancellationToken = default) => Task.FromResult(CreateDbContext());
    }

    private sealed class SqliteFactory : IDbContextFactory<TerraFusionDbContext>, IDisposable
    {
        private readonly SqliteConnection _connection = new("Data Source=:memory:");
        private readonly DbContextOptions<TerraFusionDbContext> _options;
        private readonly IConfiguration _configuration = new ConfigurationBuilder().Build();

        public SqliteFactory()
        {
            _connection.Open();
            _options = new DbContextOptionsBuilder<TerraFusionDbContext>()
                .UseSqlite(_connection)
                .Options;
            using var db = CreateDbContext();
            db.Database.EnsureCreated();
        }

        public TerraFusionDbContext CreateDbContext() => new SqliteTerraFusionDbContext(_options, _configuration);

        public Task<TerraFusionDbContext> CreateDbContextAsync(
            CancellationToken cancellationToken = default) => Task.FromResult(CreateDbContext());

        public void Dispose() => _connection.Dispose();
    }

    private sealed class SqliteTerraFusionDbContext(
        DbContextOptions<TerraFusionDbContext> options,
        IConfiguration configuration) : TerraFusionDbContext(options, configuration)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // SQLite ignores schemas. Prefix schema-qualified table names so the complete
            // TerraFusion model can be created without unrelated cross-schema collisions.
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                var schema = entityType.GetSchema();
                if (string.IsNullOrWhiteSpace(schema))
                {
                    continue;
                }

                entityType.SetTableName($"{schema}_{entityType.GetTableName()}");
                entityType.SetSchema(null);
            }
        }
    }

    private sealed class StaticContextAccessor(RequestUserContext current)
        : IRequestUserContextAccessor
    {
        public RequestUserContext Current { get; } = current;
    }

    private sealed class StaticCountyResolver(
        WashingtonCountyIdentity county,
        Guid countyId) : ICountyResolver
    {
        public Task<Guid> ResolveAsync(string countyIdOrCode, CancellationToken ct = default) =>
            Task.FromResult(string.Equals(countyIdOrCode, county.Key, StringComparison.Ordinal)
                ? countyId
                : throw new CountyNotFoundException(countyIdOrCode));

        public Task<Guid?> TryResolveAsync(string countyIdOrCode, CancellationToken ct = default) =>
            Task.FromResult<Guid?>(string.Equals(countyIdOrCode, county.Key, StringComparison.Ordinal)
                ? countyId
                : null);
    }
}
