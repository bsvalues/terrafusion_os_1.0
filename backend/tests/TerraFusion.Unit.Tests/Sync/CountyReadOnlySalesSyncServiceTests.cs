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
    public async Task PersistenceRecheckRejectsDeactivationDuringSourceRead()
    {
        using var factory = new SqliteFactory();
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
            var profile = ReadOnlyPacsConnection(connectionId);
            profile.Name = "Synthetic test source; no remote connection";
            seed.SyncSourceConnections.Add(profile);
            await seed.SaveChangesAsync();
        }

        var readEntered = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseRead = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        var external = adapter.As<IExternalReadOnlyPacsAdapter>();
        external.Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        external.Setup(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        external.Setup(value => value.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsConnectionStatus
            {
                IsConnected = true,
                DatabaseName = "benton_pacs",
            });
        external.Setup(value => value.ValidateSalesContractAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsContractProof { IsValid = true, ContractId = "pacscontract.v1" });
        adapter.Setup(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
            .Returns(async (int page, int pageSize, CancellationToken ct) =>
            {
                readEntered.TrySetResult(true);
                await releaseRead.Task.WaitAsync(ct);
                return new PacsPagedResult<PacsComparableSale>
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = 1,
                    Items = new[]
                    {
                        new PacsComparableSale
                        {
                            PacsChgOfOwnerId = 5001,
                            PropId = 1001,
                            GeoId = "SYNTHETIC-1",
                            SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                            SalePrice = 425_000m,
                        },
                    },
                };
            });
        var service = new CountyReadOnlySalesSyncService(
            factory,
            adapter.Object,
            NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var context = await CreateCountyContextAsync(Benton, BentonId, "synthetic-assessor");
        string[] auditLogsAfterEdit = Array.Empty<string>();
        var successReceiptsAfterEdit = 0;
        var run = service.SyncAsync(new CountyReadOnlySalesSyncRequest(context), timeout.Token);
        CountyReadOnlySalesSyncResult result;
        try
        {
            await readEntered.Task.WaitAsync(timeout.Token);
            await using var revoke = factory.CreateDbContext();
            var profile = await revoke.SyncSourceConnections.SingleAsync(timeout.Token);
            profile.IsActive = false;
            profile.LastConnectionErrorMessage = "SYNTHETIC_DISCONNECT";
            await revoke.SaveChangesAsync(timeout.Token);

            // The edit commits during extraction, before PersistAsync's transaction begins.
            // EF legitimately logs seed/profile writes; preserve those logs, not an empty store.
            await using var snapshot = factory.CreateDbContext();
            auditLogsAfterEdit = (await snapshot.AuditLogs.AsNoTracking().ToListAsync(timeout.Token))
                .Select(log => JsonSerializer.Serialize(log))
                .OrderBy(serialized => serialized, StringComparer.Ordinal)
                .ToArray();
            Assert.NotEmpty(auditLogsAfterEdit);
            successReceiptsAfterEdit = await snapshot.AuditEvents.AsNoTracking()
                .CountAsync(entry => entry.Action == "valuation.readonly-sales-synced", timeout.Token);
        }
        catch (OperationCanceledException) when (timeout.IsCancellationRequested)
        {
            throw new Xunit.Sdk.XunitException(
                "WAL003E_FIXTURE_TIMEOUT: extraction/edit deadline expired; not behavioral RED. " +
                "No acceptance; drain remains unproven until owned test-host exit.");
        }
        finally
        {
            releaseRead.TrySetResult(true);
            try
            {
                // Bound the wait independently of cooperative cancellation in SyncAsync.
                result = await run.WaitAsync(TimeSpan.FromSeconds(15));
            }
            catch (Exception exception) when (exception is TimeoutException
                || (exception is OperationCanceledException && timeout.IsCancellationRequested))
            {
                // Request cancellation without waiting on potentially stuck callbacks.
                // WaitAsync does not stop the underlying task; host exit must establish drain.
                _ = timeout.CancelAsync();
                throw new Xunit.Sdk.XunitException(
                    "WAL003E_FIXTURE_TIMEOUT: bounded Sync completion/drain failed; not behavioral RED. " +
                    "Cancellation requested; no acceptance; drain unproven until owned test-host exit.");
            }
        }

        Assert.Equal(CountyReadOnlySalesSyncDisposition.Denied, result.Disposition);
        Assert.Equal(CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured, result.DenialCode);
        Assert.Null(result.Receipt);
        await using var verify = factory.CreateDbContext();
        Assert.Empty(await verify.ComparableSales.ToListAsync());
        // AuditEvents checks success receipts; AuditLogs checks additional EF persistence.
        Assert.Equal(successReceiptsAfterEdit, await verify.AuditEvents.AsNoTracking()
            .CountAsync(entry => entry.Action == "valuation.readonly-sales-synced"));
        var auditLogsAfterDenial = (await verify.AuditLogs.AsNoTracking().ToListAsync())
            .Select(log => JsonSerializer.Serialize(log))
            .OrderBy(serialized => serialized, StringComparer.Ordinal)
            .ToArray();
        Assert.Equal(auditLogsAfterEdit, auditLogsAfterDenial);
        var persistedProfile = await verify.SyncSourceConnections.SingleAsync();
        Assert.False(persistedProfile.IsActive);
        Assert.Null(persistedProfile.LastSuccessfulConnectionAtUtc);
        Assert.Null(persistedProfile.UpdatedBy);
        Assert.Equal("SYNTHETIC_DISCONNECT", persistedProfile.LastConnectionErrorMessage);
        adapter.Verify(value => value.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(value => value.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(value => value.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(value => value.ValidateSalesContractAsync(It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"), Times.Once);
        adapter.VerifyNoOtherCalls();
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

    // WAL003E matrix: synthetic storage fixtures; external adapter calls are mocked.
    // These additions are source-prepared coverage, not newly observed behavioral RED.
    [Theory]
    [InlineData("delete", CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured)]
    [InlineData("replace", CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch)]
    [InlineData("ambiguous", CountyReadOnlySalesSyncDenialCode.ConnectionAmbiguous)]
    [InlineData("move-county", CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured)]
    [InlineData("remove-readonly", CountyReadOnlySalesSyncDenialCode.ConnectionNotReadOnly)]
    [InlineData("source-family", CountyReadOnlySalesSyncDenialCode.ConnectionNotReadOnly)]
    [InlineData("connection-type", CountyReadOnlySalesSyncDenialCode.ConnectionNotReadOnly)]
    [InlineData("server", CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch)]
    [InlineData("database", CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch)]
    [InlineData("auth-mode", CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch)]
    [InlineData("username", CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch)]
    [InlineData("options", CountyReadOnlySalesSyncDenialCode.SourceIdentityMismatch)]
    public async Task PersistenceRecheckDeniesDisqualifyingEditsWithoutSavingCandidates(
        string edit, CountyReadOnlySalesSyncDenialCode expectedCode)
    {
        // Removing any final admission branch or saving on denial must fail this matrix.
        using var factory = new SqliteFactory();
        var connectionId = await SeedRecheckMatrixAsync(factory);
        var outcome = await RunPausedRecheckAsync(factory, connectionId, edit,
            new[] { RecheckSale(5001, 1001, 425_000m) });

        Assert.NotNull(outcome.Result);
        Assert.Equal(CountyReadOnlySalesSyncDisposition.Denied, outcome.Result.Disposition);
        Assert.Equal(expectedCode, outcome.Result.DenialCode);
        Assert.Null(outcome.Result.Receipt);
        Assert.Null(outcome.Cancellation);
        AssertRecheckSnapshotUnchanged(outcome.AfterEdit, outcome.AfterRun);
    }

    [Theory]
    [InlineData("no-edit", false)]
    [InlineData("no-edit", true)]
    [InlineData("descriptive", false)]
    [InlineData("foreign-modify", false)]
    [InlineData("foreign-add", false)]
    [InlineData("foreign-deactivate", false)]
    public async Task PersistenceRecheckPreservesAllowedChangesAndForeignCounty(
        string edit, bool emptyPage)
    {
        // Overbroad drift denial, lost empty-page completion or foreign writes must fail.
        using var factory = new SqliteFactory();
        var connectionId = await SeedRecheckMatrixAsync(factory);
        var rows = emptyPage ? Array.Empty<PacsComparableSale>()
            : new[] { RecheckSale(5001, 1001, 425_000m) };
        var outcome = await RunPausedRecheckAsync(factory, connectionId, edit, rows);

        Assert.NotNull(outcome.Result);
        Assert.Equal(CountyReadOnlySalesSyncDisposition.Completed, outcome.Result.Disposition);
        Assert.Equal(CountyReadOnlySalesSyncDenialCode.None, outcome.Result.DenialCode);
        Assert.Null(outcome.Cancellation);
        var receipt = Assert.IsType<CountyReadOnlySalesSyncReceipt>(outcome.Result.Receipt);
        Assert.Equal(BentonId, receipt.CountyId);
        Assert.Equal(connectionId, receipt.ConnectionId);
        Assert.Equal(emptyPage ? 0 : 1, receipt.SourceRows);
        Assert.Equal(emptyPage ? 0 : 1, receipt.AddedSales);
        Assert.Equal(0, receipt.UpdatedSales);
        var localSales = outcome.AfterRun.Sales.Where(s => s.CountyId == BentonId).ToArray();
        Assert.Equal(emptyPage ? 0 : 1, localSales.Length);
        if (!emptyPage)
        {
            var sale = Assert.Single(localSales);
            Assert.Equal(425_000m, sale.SalePrice);
            Assert.Equal("SYNTHETIC-1001", sale.ParcelId);
            Assert.Equal("county-readonly-sync", sale.IngestedBy);
            Assert.Equal($"county-readonly-sync:{connectionId:D}:5001", sale.VerificationSource);
            Assert.Equal(5001, sale.PacsChgOfOwnerId);
            Assert.Equal(1001, sale.PacsPropId);
        }
        Assert.Equal(SerializeRecheckRows(outcome.AfterEdit.Sales.Where(s => s.CountyId == FranklinId)),
            SerializeRecheckRows(outcome.AfterRun.Sales.Where(s => s.CountyId == FranklinId)));
        Assert.Equal(SerializeRecheckRows(outcome.AfterEdit.Connections.Where(c => c.CountyId == FranklinId)),
            SerializeRecheckRows(outcome.AfterRun.Connections.Where(c => c.CountyId == FranklinId)));
        Assert.Equal(outcome.AfterEdit.Connections.Length, outcome.AfterRun.Connections.Length);
        var before = Assert.Single(outcome.AfterEdit.Connections.Where(c => c.Id == connectionId));
        var after = Assert.Single(outcome.AfterRun.Connections.Where(c => c.Id == connectionId));
        Assert.Equal(RegistrationIdentity(before), RegistrationIdentity(after));
        Assert.NotNull(after.LastSuccessfulConnectionAtUtc);
        Assert.Null(after.LastConnectionErrorAtUtc);
        Assert.Null(after.LastConnectionErrorMessage);
        Assert.Equal("synthetic-assessor", after.UpdatedBy);

        var priorReceiptIds = outcome.AfterEdit.Receipts.Select(r => r.Id).ToHashSet();
        Assert.Equal(SerializeRecheckRows(outcome.AfterEdit.Receipts),
            SerializeRecheckRows(outcome.AfterRun.Receipts.Where(r => priorReceiptIds.Contains(r.Id))));
        var success = Assert.Single(outcome.AfterRun.Receipts.Where(r => !priorReceiptIds.Contains(r.Id)));
        Assert.Equal("valuation.readonly-sales-synced", success.Action);
        Assert.Equal(BentonId, success.CountyId);
        Assert.Equal(connectionId.ToString("D"), success.EntityId);
        var priorAuditIds = outcome.AfterEdit.AuditLogs.Select(a => a.Id).ToHashSet();
        Assert.Equal(SerializeRecheckRows(outcome.AfterEdit.AuditLogs),
            SerializeRecheckRows(outcome.AfterRun.AuditLogs.Where(a => priorAuditIds.Contains(a.Id))));
        var newAudits = outcome.AfterRun.AuditLogs.Where(a => !priorAuditIds.Contains(a.Id)).ToArray();
        Assert.All(newAudits, a => Assert.Equal("EntityFramework", a.Source));
        var expectedAuditTypes = emptyPage
            ? new[] { "AuditEvent_Added", "SyncSourceConnection_Modified" }
            : new[] { "AuditEvent_Added", "ComparableSale_Added", "SyncSourceConnection_Modified" };
        Assert.Equal(expectedAuditTypes.OrderBy(t => t, StringComparer.Ordinal),
            newAudits.Select(a => a.Type).OrderBy(t => t, StringComparer.Ordinal));
    }

    [Fact]
    public async Task PersistenceRecheckDeniedSecondImportPreservesEarlierSaleLineageAndReceipts()
    {
        // A SaveChanges before final denial would overwrite the prior sale and add a new one.
        using var factory = new SqliteFactory();
        var connectionId = await SeedRecheckMatrixAsync(factory);
        var first = await RunPausedRecheckAsync(factory, connectionId, "no-edit",
            new[] { RecheckSale(5001, 1001, 425_000m) });
        Assert.NotNull(first.Result);
        Assert.Equal(CountyReadOnlySalesSyncDisposition.Completed, first.Result.Disposition);
        Assert.NotNull(first.Result.Receipt);
        var originalSale = Assert.Single(first.AfterRun.Sales.Where(s => s.CountyId == BentonId));
        Assert.Equal(425_000m, originalSale.SalePrice);
        Assert.Equal($"county-readonly-sync:{connectionId:D}:5001", originalSale.VerificationSource);
        var previousSuccess = first.AfterRun.Connections.Single(c => c.Id == connectionId)
            .LastSuccessfulConnectionAtUtc;
        Assert.NotNull(previousSuccess);
        Assert.Single(first.AfterRun.Receipts);

        var second = await RunPausedRecheckAsync(factory, connectionId, "deactivate",
            new[] { RecheckSale(5001, 1001, 555_000m), RecheckSale(5002, 1002, 600_000m) });

        Assert.NotNull(second.Result);
        Assert.Equal(CountyReadOnlySalesSyncDisposition.Denied, second.Result.Disposition);
        Assert.Equal(CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured, second.Result.DenialCode);
        Assert.Null(second.Result.Receipt);
        AssertRecheckSnapshotUnchanged(second.AfterEdit, second.AfterRun);
        Assert.Equal(SerializeRecheckRows(first.AfterRun.Sales), SerializeRecheckRows(second.AfterRun.Sales));
        Assert.Equal(SerializeRecheckRows(first.AfterRun.Receipts), SerializeRecheckRows(second.AfterRun.Receipts));
        var disconnected = second.AfterRun.Connections.Single(c => c.Id == connectionId);
        Assert.False(disconnected.IsActive);
        Assert.Equal(previousSuccess, disconnected.LastSuccessfulConnectionAtUtc);
        Assert.Equal("SYNTHETIC_DISCONNECT", disconnected.LastConnectionErrorMessage);
    }

    [Fact]
    public async Task PersistenceRecheckCancellationDuringReadPropagatesWithoutPersistence()
    {
        // Swallowing cancellation or persisting the returned page must fail this control.
        using var factory = new SqliteFactory();
        var connectionId = await SeedRecheckMatrixAsync(factory);
        var outcome = await RunPausedRecheckAsync(factory, connectionId, "no-edit",
            new[] { RecheckSale(5001, 1001, 425_000m) }, cancelWhilePaused: true);

        Assert.Null(outcome.Result);
        Assert.NotNull(outcome.Cancellation);
        AssertRecheckSnapshotUnchanged(outcome.AfterEdit, outcome.AfterRun);
    }

    private static async Task<Guid> SeedRecheckMatrixAsync(SqliteFactory factory)
    {
        var connectionId = Guid.NewGuid();
        await using var db = factory.CreateDbContext();
        db.Counties.AddRange(
            new County { Id = BentonId, Name = "Benton", State = "WA", FipsCode = "53005" },
            new County { Id = FranklinId, Name = "Franklin", State = "WA", FipsCode = "53021" });
        var local = ReadOnlyPacsConnection(connectionId);
        local.Name = "Synthetic WAL003E local fixture";
        local.Username = "synthetic-reader";
        local.LastConnectionErrorAtUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        local.LastConnectionErrorMessage = "SYNTHETIC_PRIOR_ERROR";
        var foreign = ReadOnlyPacsConnection(Guid.NewGuid());
        foreign.CountyId = FranklinId;
        foreign.Name = "Synthetic WAL003E foreign fixture";
        db.SyncSourceConnections.AddRange(local, foreign);
        db.ComparableSales.Add(new ComparableSale
        {
            Id = Guid.NewGuid(), CountyId = FranklinId, ParcelId = "SYNTHETIC-FOREIGN",
            SaleDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice = 300_000m, SalesYear = 2026, IngestedBy = "synthetic-foreign-fixture",
        });
        await db.SaveChangesAsync();
        return connectionId;
    }

    private static PacsComparableSale RecheckSale(int saleId, int propId, decimal price) => new()
    {
        PacsChgOfOwnerId = saleId, PropId = propId, GeoId = $"SYNTHETIC-{propId}",
        SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc), SalePrice = price,
    };

    private sealed record RecheckSnapshot(
        ComparableSale[] Sales, SyncSourceConnection[] Connections, AuditLog[] AuditLogs, AuditEvent[] Receipts);

    private sealed record PausedRecheckOutcome(
        CountyReadOnlySalesSyncResult? Result, OperationCanceledException? Cancellation,
        RecheckSnapshot AfterEdit, RecheckSnapshot AfterRun);

    private static async Task<RecheckSnapshot> SnapshotRecheckAsync(
        SqliteFactory factory, CancellationToken cancellationToken = default)
    {
        await using var db = factory.CreateDbContext();
        return new(
            await db.ComparableSales.AsNoTracking().ToArrayAsync(cancellationToken),
            await db.SyncSourceConnections.AsNoTracking().ToArrayAsync(cancellationToken),
            await db.AuditLogs.AsNoTracking().ToArrayAsync(cancellationToken),
            await db.AuditEvents.AsNoTracking()
                .Where(e => e.Action == "valuation.readonly-sales-synced").ToArrayAsync(cancellationToken));
    }

    private static string[] SerializeRecheckRows<T>(IEnumerable<T> rows) =>
        rows.Select(row => JsonSerializer.Serialize(row)).OrderBy(row => row, StringComparer.Ordinal).ToArray();

    private static void AssertRecheckSnapshotUnchanged(RecheckSnapshot before, RecheckSnapshot after)
    {
        Assert.Equal(SerializeRecheckRows(before.Sales), SerializeRecheckRows(after.Sales));
        Assert.Equal(SerializeRecheckRows(before.Connections), SerializeRecheckRows(after.Connections));
        Assert.Equal(SerializeRecheckRows(before.AuditLogs), SerializeRecheckRows(after.AuditLogs));
        Assert.Equal(SerializeRecheckRows(before.Receipts), SerializeRecheckRows(after.Receipts));
    }

    private static string RegistrationIdentity(SyncSourceConnection profile) => JsonSerializer.Serialize(new
    {
        profile.Id, profile.CountyId, profile.Name, profile.SourceSystem, profile.ConnectionType,
        profile.Server, profile.Database, profile.AuthMode, profile.Username, profile.AdditionalOptions,
        profile.IsActive, profile.Notes, profile.CreatedAt, profile.CreatedBy,
    });

    private static async Task ApplyRecheckEditAsync(
        SqliteFactory factory, Guid connectionId, string edit, CancellationToken cancellationToken)
    {
        await using var db = factory.CreateDbContext();
        var local = await db.SyncSourceConnections.SingleAsync(c => c.Id == connectionId, cancellationToken);
        switch (edit)
        {
            case "no-edit": return;
            case "delete": db.SyncSourceConnections.Remove(local); break;
            case "deactivate":
                local.IsActive = false;
                local.LastConnectionErrorMessage = "SYNTHETIC_DISCONNECT";
                break;
            case "replace":
                local.IsActive = false;
                var replacement = ReadOnlyPacsConnection(Guid.NewGuid());
                replacement.Name = "Synthetic replacement";
                replacement.Username = local.Username;
                db.SyncSourceConnections.Add(replacement);
                break;
            case "ambiguous":
                var second = ReadOnlyPacsConnection(Guid.NewGuid());
                second.Name = "Synthetic second active registration";
                db.SyncSourceConnections.Add(second);
                break;
            case "move-county": local.CountyId = FranklinId; break;
            case "remove-readonly": local.AdditionalOptions = "Encrypt=True"; break;
            case "source-family": local.SourceSystem = "PROVAL"; break;
            case "connection-type": local.ConnectionType = "Odbc"; break;
            case "server": local.Server = "synthetic-other-server"; break;
            case "database": local.Database = "synthetic_other_database"; break;
            case "auth-mode": local.AuthMode = "SqlAuth"; break;
            case "username": local.Username = "Synthetic-Reader"; break; // Case alone remains identity drift.
            case "options": local.AdditionalOptions = "Encrypt=True;ApplicationIntent=ReadOnly;TrustServerCertificate=True"; break;
            case "descriptive":
                local.Name = "Synthetic renamed label";
                local.Notes = "Synthetic descriptive edit only";
                break;
            case "foreign-modify":
                var changed = await db.SyncSourceConnections.SingleAsync(c => c.CountyId == FranklinId, cancellationToken);
                changed.Server = "synthetic-foreign-edited";
                changed.LastConnectionErrorMessage = "SYNTHETIC_FOREIGN_ERROR";
                break;
            case "foreign-add":
                var added = ReadOnlyPacsConnection(Guid.NewGuid());
                added.CountyId = FranklinId;
                added.Name = "Synthetic added foreign registration";
                db.SyncSourceConnections.Add(added);
                break;
            case "foreign-deactivate":
                var retired = await db.SyncSourceConnections.SingleAsync(c => c.CountyId == FranklinId, cancellationToken);
                retired.IsActive = false;
                break;
            default: throw new ArgumentOutOfRangeException(nameof(edit), edit, "Unknown synthetic test edit.");
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<PausedRecheckOutcome> RunPausedRecheckAsync(
        SqliteFactory factory, Guid connectionId, string edit, IReadOnlyList<PacsComparableSale> rows,
        bool cancelWhilePaused = false)
    {
        var readEntered = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseRead = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var runCancellation = CancellationTokenSource.CreateLinkedTokenSource(deadline.Token);
        var adapter = new Mock<IPacsAdapter>(MockBehavior.Strict);
        var external = adapter.As<IExternalReadOnlyPacsAdapter>();
        external.Setup(x => x.MatchesSource("benton-pacs-ro", "benton_pacs")).Returns(true);
        external.Setup(x => x.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);
        external.Setup(x => x.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new PacsConnectionStatus { IsConnected = true, DatabaseName = "benton_pacs" });
        external.Setup(x => x.ValidateSalesContractAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new PacsContractProof { IsValid = true, ContractId = "pacscontract.v1" });
        adapter.Setup(x => x.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()))
            .Returns(async (int page, int pageSize, CancellationToken ct) =>
            {
                readEntered.TrySetResult(true);
                await releaseRead.Task.WaitAsync(ct);
                ct.ThrowIfCancellationRequested();
                return new PacsPagedResult<PacsComparableSale>
                {
                    Page = page, PageSize = pageSize, TotalCount = rows.Count, Items = rows,
                };
            });
        var service = new CountyReadOnlySalesSyncService(
            factory, adapter.Object, NullLogger<CountyReadOnlySalesSyncService>.Instance);
        var context = await CreateCountyContextAsync(Benton, BentonId, "synthetic-assessor");
        var run = service.SyncAsync(new CountyReadOnlySalesSyncRequest(context), runCancellation.Token);
        RecheckSnapshot? afterEdit = null;
        CountyReadOnlySalesSyncResult? result = null;
        OperationCanceledException? cancellation = null;
        try
        {
            await readEntered.Task.WaitAsync(deadline.Token);
            await ApplyRecheckEditAsync(factory, connectionId, edit, deadline.Token);
            // Commit and snapshot while extraction is paused, BEFORE the persistence transaction.
            afterEdit = await SnapshotRecheckAsync(factory, deadline.Token);
            Assert.NotEmpty(afterEdit.AuditLogs);
            if (cancelWhilePaused) _ = runCancellation.CancelAsync();
        }
        catch (OperationCanceledException) when (deadline.IsCancellationRequested)
        {
            throw new Xunit.Sdk.XunitException(
                "WAL003E_FIXTURE_TIMEOUT: extraction/edit deadline expired; not behavioral RED. " +
                "No acceptance; drain remains unproven until owned test-host exit.");
        }
        finally
        {
            releaseRead.TrySetResult(true);
            try
            {
                // WaitAsync bounds the wait, not the underlying task. Success means actual completion.
                result = await run.WaitAsync(TimeSpan.FromSeconds(15));
            }
            catch (OperationCanceledException exception) when (
                cancelWhilePaused && runCancellation.IsCancellationRequested && !deadline.IsCancellationRequested)
            {
                cancellation = exception; // The actual Sync task completed with requested cancellation.
            }
            catch (Exception exception) when (exception is TimeoutException
                || (exception is OperationCanceledException && deadline.IsCancellationRequested))
            {
                _ = runCancellation.CancelAsync();
                throw new Xunit.Sdk.XunitException(
                    "WAL003E_FIXTURE_TIMEOUT: bounded Sync completion/drain failed; not behavioral RED. " +
                    "Cancellation requested; no acceptance; drain unproven until owned test-host exit.");
            }
        }
        Assert.NotNull(afterEdit);
        var afterRun = await SnapshotRecheckAsync(factory);
        adapter.Verify(x => x.GetComparableSalesAsync(1, 500, It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(x => x.HasServerEnforcedReadOnlyAccessAsync(It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(x => x.GetSalesConnectionStatusAsync(It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(x => x.ValidateSalesContractAsync(It.IsAny<CancellationToken>()), Times.Once);
        external.Verify(x => x.MatchesSource("benton-pacs-ro", "benton_pacs"),
            Times.Exactly(result?.Disposition == CountyReadOnlySalesSyncDisposition.Completed ? 2 : 1));
        adapter.VerifyNoOtherCalls();
        return new(result, cancellation, afterEdit, afterRun);
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
