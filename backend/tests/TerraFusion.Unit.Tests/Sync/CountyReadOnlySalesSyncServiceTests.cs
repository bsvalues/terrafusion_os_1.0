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
using Xunit.Abstractions;
using Task = System.Threading.Tasks.Task;
using ICountyResolver = TerraFusion.Core.Services.ICountyResolver;
using CountyNotFoundException = TerraFusion.Core.Services.CountyNotFoundException;
using IOlsRegressionService = TerraFusion.API.Services.IOlsRegressionService;
using ISaleQualificationService = TerraFusion.API.Services.ISaleQualificationService;

namespace TerraFusion.Unit.Tests.Sync;

public sealed class CountyReadOnlySalesSyncServiceTests
{
    private readonly ITestOutputHelper _output;

    public CountyReadOnlySalesSyncServiceTests(ITestOutputHelper output) => _output = output;

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
            new[] { RecheckSale(5001, 1001, 425_000m) }, _output);

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
        var outcome = await RunPausedRecheckAsync(factory, connectionId, edit, rows, _output);

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
            new[] { RecheckSale(5001, 1001, 425_000m) }, _output);
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
            new[] { RecheckSale(5001, 1001, 555_000m), RecheckSale(5002, 1002, 600_000m) }, _output);

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
            new[] { RecheckSale(5001, 1001, 425_000m) }, _output, cancelWhilePaused: true);

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
        ITestOutputHelper output, bool cancelWhilePaused = false, RecheckDiagnosticControl? diagnosticControl = null)
    {
        using var scheduling = new RecheckSchedulingObservation(output);
        var readEntered = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseRead = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var diagnostics = new RecheckPhaseCapture();
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        diagnostics.Mark(RecheckDiagnosticPhase.DeadlineStarted);
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
                diagnostics.Mark(RecheckDiagnosticPhase.MockEntered);
                scheduling.Capture(RecheckSchedulingPhase.MockEntered);
                readEntered.TrySetResult(true);
                diagnostics.Mark(RecheckDiagnosticPhase.EntrySignaled);
                await RecheckReleaseWait(releaseRead.Task, ct);
                diagnostics.Mark(RecheckDiagnosticPhase.ReleaseObserved);
                scheduling.Capture(RecheckSchedulingPhase.ReleaseObserved);
                ct.ThrowIfCancellationRequested();
                diagnostics.Mark(RecheckDiagnosticPhase.CancellationCheckPassed);
                var pageResult = new PacsPagedResult<PacsComparableSale>
                {
                    Page = page, PageSize = pageSize, TotalCount = rows.Count, Items = rows,
                };
                diagnostics.Mark(RecheckDiagnosticPhase.RowsReturned);
                return pageResult;
            });
        var service = new CountyReadOnlySalesSyncService(
            factory, adapter.Object, NullLogger<CountyReadOnlySalesSyncService>.Instance);
        Task<CountyReadOnlySalesSyncResult>? run = null;
        RecheckSnapshot? afterEdit = null;
        CountyReadOnlySalesSyncResult? result = null;
        OperationCanceledException? cancellation = null;
        Exception? firstFailure = null;
        var phase = RecheckDiagnosticPhase.ContextStarted;
        var firstPhase = phase;
        long? firstElapsed = null;
        bool firstDeadlineCancelled = false;
        RecheckTaskSnapshot? requestedBefore = null;
        RecheckTaskSnapshot? requestedAfter = null;

        RecheckTaskSnapshot Observe() => new(readEntered.Task.Status, releaseRead.Task.Status,
            run?.Status, deadline.IsCancellationRequested, runCancellation.IsCancellationRequested);

        RecheckFailureEvidence Evidence(RecheckDiagnosticPhase failedPhase, Exception caught,
            RecheckTaskSnapshot beforeRequest, RecheckTaskSnapshot afterRequest) => new(
                failedPhase, diagnostics.ElapsedMilliseconds, firstFailure,
                firstFailure is null ? null : firstPhase, caught,
                beforeRequest.EntryStatus, beforeRequest.ReleaseStatus, beforeRequest.SyncStatus,
                beforeRequest.DeadlineCancelled, beforeRequest.RunCancelled, afterRequest.RunCancelled)
            {
                FirstElapsedMilliseconds = firstElapsed,
                FirstDeadlineCancelled = firstFailure is null ? null : firstDeadlineCancelled,
                AfterRequest = afterRequest,
                Phases = diagnostics.Snapshot(),
            };

        try
        {
            diagnostics.Mark(phase);
            var context = await CreateCountyContextAsync(Benton, BentonId, "synthetic-assessor");
            diagnostics.Mark(RecheckDiagnosticPhase.ContextCompleted);
            phase = RecheckDiagnosticPhase.SyncStarting;
            diagnostics.Mark(phase);
            run = service.SyncAsync(new CountyReadOnlySalesSyncRequest(context), runCancellation.Token);
            diagnostics.Mark(RecheckDiagnosticPhase.SyncTaskObtained);
            phase = RecheckDiagnosticPhase.EntryWaiting;
            diagnostics.Mark(phase);
            await readEntered.Task.WaitAsync(deadline.Token);
            diagnostics.Mark(RecheckDiagnosticPhase.EntryObserved);
            phase = RecheckDiagnosticPhase.EditStarted;
            diagnostics.Mark(phase);
            await ApplyRecheckEditAsync(factory, connectionId, edit, deadline.Token);
            diagnostics.Mark(RecheckDiagnosticPhase.EditCompleted);
            // Commit and snapshot while extraction is paused, BEFORE the persistence transaction.
            phase = RecheckDiagnosticPhase.SnapshotStarted;
            diagnostics.Mark(phase);
            afterEdit = await SnapshotRecheckAsync(factory, deadline.Token);
            phase = RecheckDiagnosticPhase.SnapshotCompleted;
            diagnostics.Mark(phase);
            Assert.NotEmpty(afterEdit.AuditLogs);
            diagnosticControl?.ThrowAfterSnapshot(afterEdit);
            if (cancelWhilePaused)
            {
                requestedBefore = Observe();
                _ = runCancellation.CancelAsync();
                requestedAfter = Observe();
                diagnostics.Mark(RecheckDiagnosticPhase.RunCancellationRequested);
            }
        }
        catch (Exception exception)
        {
            // Retain the first safe identity across finally, including non-timeout edit/assertion failures.
            firstFailure = exception;
            firstPhase = phase;
            firstElapsed = diagnostics.ElapsedMilliseconds;
            firstDeadlineCancelled = deadline.IsCancellationRequested;
        }
        finally
        {
            releaseRead.TrySetResult(true);
            diagnostics.Mark(RecheckDiagnosticPhase.ReleaseSignaled);
            if (run is not null)
            {
                try
                {
                    diagnostics.Mark(RecheckDiagnosticPhase.DrainStarted);
                    scheduling.Capture(RecheckSchedulingPhase.DrainStarted);
                    // WaitAsync bounds the wait, not the underlying task. Success means actual completion.
                    result = await RecheckDrainWait(run);
                    diagnostics.Mark(RecheckDiagnosticPhase.DrainFinished);
                    scheduling.Capture(RecheckSchedulingPhase.DrainFinished);
                    diagnosticControl?.ThrowAfterRealDrain(result);
                }
                catch (OperationCanceledException exception) when (
                    cancelWhilePaused && runCancellation.IsCancellationRequested && !deadline.IsCancellationRequested)
                {
                    cancellation = exception; // The actual Sync task completed with requested cancellation.
                    diagnostics.Mark(RecheckDiagnosticPhase.DrainFinished);
                    scheduling.Capture(RecheckSchedulingPhase.DrainFinished);
                }
                catch (Exception exception) when (exception is TimeoutException
                    || (exception is OperationCanceledException && deadline.IsCancellationRequested))
                {
                    var beforeRequest = Observe();
                    _ = runCancellation.CancelAsync();
                    var afterRequest = Observe();
                    diagnostics.Mark(RecheckDiagnosticPhase.RunCancellationRequested);
                    throw RecheckTimeoutFailure(draining: true,
                        evidence: Evidence(RecheckDiagnosticPhase.DrainStarted, exception, beforeRequest, afterRequest));
                }
                catch (Exception exception)
                {
                    // An unexpected drain fault must not mask an earlier failure or leak provider text.
                    var observed = Observe();
                    var failure = RecheckTimeoutFailure(draining: true,
                        evidence: Evidence(RecheckDiagnosticPhase.DrainStarted, exception, observed, observed));
                    if (exception is OperationCanceledException canceled)
                        throw new OperationCanceledException(failure.Message, canceled.CancellationToken);
                    throw failure;
                }
            }
        }
        if (firstFailure is not null)
        {
            var observed = Observe();
            var failure = RecheckTimeoutFailure(draining: false,
                evidence: Evidence(firstPhase, firstFailure, requestedBefore ?? observed, requestedAfter ?? observed));
            if (firstFailure is OperationCanceledException canceled && !firstDeadlineCancelled)
                throw new OperationCanceledException(failure.Message, canceled.CancellationToken);
            throw failure;
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

    [Theory]
    [InlineData(false, "System.TimeoutException", "WaitingForActivation", false)]
    [InlineData(true, "System.OperationCanceledException", "Canceled", true)]
    public void FixtureDiagnosticDistinguishesDrainWaitFromCompletedDeadlineCancellation(
        bool deadlineExpired, string expectedType, string expectedSyncStatus, bool expectedCancelledBefore)
    {
        // The old single marker loses whether Sync was still pending or already canceled.
        var pending = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        Task sync = deadlineExpired ? Task.FromCanceled(new CancellationToken(true)) : pending.Task;
        Exception caught = deadlineExpired
            ? new OperationCanceledException("SYNTHETIC_PRIVATE_PROVIDER_MESSAGE")
            : new TimeoutException("SYNTHETIC_PRIVATE_PROVIDER_MESSAGE");
        var evidence = new RecheckFailureEvidence(
            RecheckDiagnosticPhase.DrainStarted, 23, null, null, caught,
            Task.CompletedTask.Status, Task.CompletedTask.Status, sync.Status,
            deadlineExpired, expectedCancelledBefore, true);

        var failure = RecheckTimeoutFailure(draining: true, evidence: evidence);

        Assert.Contains($"caughtType={expectedType}", failure.Message);
        Assert.Contains($"syncStatus={expectedSyncStatus}", failure.Message);
        Assert.Contains($"deadlineCancelled={deadlineExpired}", failure.Message);
        Assert.Contains($"runCancelledBeforeRequest={expectedCancelledBefore}", failure.Message);
        Assert.Contains("runCancelledAfterRequest=True", failure.Message);
        Assert.Contains("entryStatus=RanToCompletion", failure.Message);
        Assert.Contains("releaseStatus=RanToCompletion", failure.Message);
        Assert.Contains("phase=DrainStarted", failure.Message);
        Assert.Contains("elapsedMs=23", failure.Message);
        Assert.Contains("WAL003E_FIXTURE_TIMEOUT:", failure.Message);
        Assert.Contains("no acceptance", failure.Message);
        Assert.DoesNotContain("SYNTHETIC_PRIVATE_PROVIDER_MESSAGE", failure.ToString());
    }

    [Fact]
    public void FixtureDiagnosticRetainsFirstFailureSeparatelyFromDrainFailure()
    {
        // A finally/drain failure must not erase the earlier edit failure's safe identity.
        var evidence = new RecheckFailureEvidence(
            RecheckDiagnosticPhase.DrainStarted, 31,
            new InvalidOperationException("SYNTHETIC_PRIVATE_EDIT_PAYLOAD"),
            RecheckDiagnosticPhase.EditStarted,
            new TimeoutException("SYNTHETIC_PRIVATE_DRAIN_PAYLOAD"),
            TaskStatus.RanToCompletion, TaskStatus.RanToCompletion, TaskStatus.WaitingForActivation,
            false, false, true);

        var failure = RecheckTimeoutFailure(draining: true, evidence: evidence);

        Assert.Contains("firstType=System.InvalidOperationException", failure.Message);
        Assert.Contains("firstPhase=EditStarted", failure.Message);
        Assert.Contains("caughtType=System.TimeoutException", failure.Message);
        Assert.Contains("phase=DrainStarted", failure.Message);
        Assert.Contains("elapsedMs=31", failure.Message);
        Assert.DoesNotContain("SYNTHETIC_PRIVATE_EDIT_PAYLOAD", failure.ToString());
        Assert.DoesNotContain("SYNTHETIC_PRIVATE_DRAIN_PAYLOAD", failure.ToString());
        Assert.Contains("drain unproven", failure.Message);
    }

    [Fact]
    public void FixtureDiagnosticKeepsInvocationEvidenceSeparateAndDoesNotLeakExceptionPayloads()
    {
        // Formatting another invocation must neither reuse first-error state nor expose messages.
        var first = new RecheckFailureEvidence(
            RecheckDiagnosticPhase.EditStarted, 7,
            new InvalidOperationException("SYNTHETIC_PRIVATE_FIRST_ERROR"), RecheckDiagnosticPhase.EditStarted,
            new OperationCanceledException("SYNTHETIC_PRIVATE_CONNECTION_STRING"),
            TaskStatus.RanToCompletion, TaskStatus.WaitingForActivation, TaskStatus.Canceled,
            true, true, true);
        var second = new RecheckFailureEvidence(
            RecheckDiagnosticPhase.DrainStarted, 19, null, null,
            new TimeoutException("SYNTHETIC_PRIVATE_ROW_VALUE"),
            TaskStatus.WaitingForActivation, TaskStatus.RanToCompletion, TaskStatus.Faulted,
            false, false, true);

        var firstFailure = RecheckTimeoutFailure(draining: false, evidence: first);
        var secondFailure = RecheckTimeoutFailure(draining: true, evidence: second);

        Assert.Contains("elapsedMs=7", firstFailure.Message);
        Assert.Contains("firstType=System.InvalidOperationException", firstFailure.Message);
        Assert.Contains("phase=EditStarted", firstFailure.Message);
        Assert.Contains("elapsedMs=19", secondFailure.Message);
        Assert.Contains("phase=DrainStarted", secondFailure.Message);
        Assert.Contains("entryStatus=WaitingForActivation", secondFailure.Message);
        Assert.Contains("syncStatus=Faulted", secondFailure.Message);
        Assert.Contains("firstType=none", secondFailure.Message);
        Assert.DoesNotContain("System.OperationCanceledException", secondFailure.Message);
        Assert.DoesNotContain("SYNTHETIC_PRIVATE_CONNECTION_STRING", firstFailure.ToString());
        Assert.DoesNotContain("SYNTHETIC_PRIVATE_FIRST_ERROR", firstFailure.ToString());
        Assert.DoesNotContain("SYNTHETIC_PRIVATE_ROW_VALUE", secondFailure.ToString());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task FixtureDiagnosticCapturesRealPausedFixtureAndPreservesFirstFailure(bool failDrain)
    {
        using var factory = new SqliteFactory();
        var connectionId = await SeedRecheckMatrixAsync(factory);
        var control = new RecheckDiagnosticControl(failDrain);

        var failure = await Assert.ThrowsAsync<Xunit.Sdk.XunitException>(() =>
            RunPausedRecheckAsync(factory, connectionId, "deactivate",
                new[] { RecheckSale(5001, 1001, 425_000m) }, _output, diagnosticControl: control));

        Assert.True(control.FirstTriggered);
        Assert.Equal(failDrain, control.DrainTriggered);
        Assert.NotNull(control.AfterEdit);
        AssertRecheckSnapshotUnchanged(control.AfterEdit, await SnapshotRecheckAsync(factory));
        Assert.False(control.AfterEdit.Connections.Single(c => c.Id == connectionId).IsActive);
        Assert.Empty(control.AfterEdit.Sales.Where(s => s.CountyId == BentonId));
        Assert.Contains("firstType=System.InvalidOperationException", failure.Message);
        Assert.Contains("firstPhase=SnapshotCompleted", failure.Message);
        Assert.Contains(failDrain ? "caughtType=System.TimeoutException"
            : "caughtType=System.InvalidOperationException", failure.Message);
        Assert.Contains("syncStatus=RanToCompletion", failure.Message);
        Assert.Contains("entryStatus=RanToCompletion", failure.Message);
        Assert.Contains("releaseStatus=RanToCompletion", failure.Message);
        Assert.Contains("deadlineCancelled=False", failure.Message);
        Assert.Contains("runCancelledBeforeRequest=False", failure.Message);
        Assert.Contains($"runCancelledAfterRequest={failDrain}", failure.Message);
        if (failDrain) Assert.Contains("syncStatusAfterRequest=RanToCompletion", failure.Message);
        Assert.DoesNotContain("SYNTHETIC_PRIVATE", failure.ToString());
        Assert.Null(failure.InnerException);

        var stamps = System.Text.RegularExpressions.Regex.Matches(
            failure.Message, @"(?m)^phaseStamp=(\w+):(\d+)$");
        var phases = stamps.Select(match => match.Groups[1].Value).ToArray();
        foreach (var expected in new[] { "DeadlineStarted", "ContextCompleted", "SyncTaskObtained",
            "MockEntered", "EntryObserved", "EditStarted", "EditCompleted", "SnapshotCompleted",
            "ReleaseSignaled", "ReleaseObserved", "CancellationCheckPassed", "RowsReturned",
            "DrainStarted", "DrainFinished" })
            Assert.Contains(expected, phases);
        Assert.Equal(phases.Length, phases.Distinct(StringComparer.Ordinal).Count());
        var elapsed = stamps.Select(match => long.Parse(match.Groups[2].Value,
            System.Globalization.CultureInfo.InvariantCulture)).ToArray();
        Assert.NotEmpty(elapsed);
        Assert.All(elapsed, value => Assert.True(value >= 0));
        Assert.Equal(elapsed.OrderBy(value => value), elapsed);
    }

    // These fixture waits do not require the caller's synchronization context.
    private static System.Runtime.CompilerServices.ConfiguredTaskAwaitable RecheckReleaseWait(
        Task release, CancellationToken cancellationToken) =>
        release.WaitAsync(cancellationToken).ConfigureAwait(false);

    private static System.Runtime.CompilerServices.ConfiguredTaskAwaitable<CountyReadOnlySalesSyncResult>
        RecheckDrainWait(Task<CountyReadOnlySalesSyncResult> run) =>
        run.WaitAsync(TimeSpan.FromSeconds(15)).ConfigureAwait(false);

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task FixtureWaitPolicyCompletesWithoutPumpingCapturedContext(bool drain)
    {
        // Capturing either real fixture wait strands its continuation behind this owned queue.
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        using var cancellation = CancellationTokenSource.CreateLinkedTokenSource(deadline.Token);
        var antecedent = new TaskCompletionSource<CountyReadOnlySalesSyncResult>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        var gated = new RecheckPolicyContext();
        // Task-result identity only: this is NOT an actual Sync result or acceptance receipt.
        var sentinel = new CountyReadOnlySalesSyncResult(CountyReadOnlySalesSyncDisposition.Denied,
            CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured, null);
        CountyReadOnlySalesSyncResult? forwarded = null;
        Task? probe = null;
        bool registered = false, continued = false;
        Exception? firstFailure = null, cleanupFailure = null;

        async Task ProbeAsync()
        {
            Assert.Same(gated, SynchronizationContext.Current);
            Assert.False(antecedent.Task.IsCompleted);
            if (drain)
                forwarded = await RecheckDrainWait(antecedent.Task);
            else
                await RecheckReleaseWait(antecedent.Task, cancellation.Token);
            continued = true;
        }

        try
        {
            var previous = SynchronizationContext.Current;
            try
            {
                SynchronizationContext.SetSynchronizationContext(gated);
                probe = ProbeAsync();
            }
            finally { SynchronizationContext.SetSynchronizationContext(previous); }

            // Invocation returned from its incomplete await before the antecedent can complete.
            Assert.False(antecedent.Task.IsCompleted);
            Assert.False(probe.IsCompleted);
            Assert.False(continued);
            registered = true;
            antecedent.TrySetResult(sentinel);
            var winner = await Task.WhenAny(probe, gated.Posted)
                .WaitAsync(deadline.Token).ConfigureAwait(true);
            if (winner == gated.Posted)
            {
                Assert.Equal(1, gated.PostCount);
                Assert.Equal(1, gated.Queued);
                Assert.False(probe.IsCompleted);
                Assert.False(continued);
            }
            Assert.True(winner == probe, drain
                ? "WAL007C_DRAIN_CAPTURE_DEPENDENCE: Post acknowledged while probe remained pending"
                : "WAL007C_RELEASE_CAPTURE_DEPENDENCE: Post acknowledged while probe remained pending");
            await probe.WaitAsync(TimeSpan.FromSeconds(15)).ConfigureAwait(true);
            Assert.True(continued);
            Assert.Equal(0, gated.PostCount);
            Assert.Equal(0, gated.Queued);
            if (drain) Assert.Same(sentinel, forwarded);
            Assert.False(deadline.IsCancellationRequested);
        }
        catch (Exception exception) { firstFailure = exception; }
        finally
        {
            try
            {
                cancellation.Cancel();
                antecedent.TrySetResult(sentinel);
                if (probe is not null)
                {
                    var settled = ObserveRecheckPolicyProbeAsync(probe);
                    await Task.WhenAny(settled, gated.Posted)
                        .WaitAsync(TimeSpan.FromSeconds(15)).ConfigureAwait(true);
                    for (var count = 0; count < 8 && gated.PumpOne(); count++) { }
                    await settled.WaitAsync(TimeSpan.FromSeconds(15)).ConfigureAwait(true);
                    Assert.True(probe.IsCompleted);
                    Assert.Equal(0, gated.Queued);
                    Assert.InRange(gated.PostCount, 0, 1);
                }
            }
            catch (Exception exception) { cleanupFailure = exception; }
        }

        try
        {
            _output.WriteLine($"WAL007C_POLICY kind={(drain ? "DRAIN" : "RELEASE")} registered={registered} "
                + $"posts={gated.PostCount} queued={gated.Queued} terminal={probe?.IsCompleted == true} "
                + $"firstFailure={firstFailure is not null} cleanupFailure={cleanupFailure is not null}");
        }
        catch (Exception) { /* Output cannot replace the primary failure or cleanup failure. */ }
        if (firstFailure is not null)
            System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(firstFailure).Throw();
        if (cleanupFailure is not null)
            System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(cleanupFailure).Throw();
    }

    private static async Task ObserveRecheckPolicyProbeAsync(Task probe)
    {
        try { await probe.ConfigureAwait(false); }
        catch (Exception) { /* Observe terminal faults during cleanup; the primary assertion is retained. */ }
    }

    // Finite queue owned by one theory invocation; not a replacement xUnit scheduler.
    private sealed class RecheckPolicyContext : SynchronizationContext
    {
        private readonly object _gate = new();
        private readonly Queue<(SendOrPostCallback Callback, object? State)> _queue = new();
        private readonly TaskCompletionSource<bool> _posted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _posts;
        public Task Posted => _posted.Task;
        public int PostCount { get { lock (_gate) return _posts; } }
        public int Queued { get { lock (_gate) return _queue.Count; } }

        public override void Post(SendOrPostCallback callback, object? state)
        {
            lock (_gate)
            {
                _queue.Enqueue((callback, state));
                _posts++;
            }
            _posted.TrySetResult(true); // Positive acknowledgement only after retaining the callback.
        }

        public bool PumpOne()
        {
            (SendOrPostCallback Callback, object? State) item;
            lock (_gate)
            {
                Assert.InRange(_posts, 0, 8);
                if (!_queue.TryDequeue(out item)) return false;
            }
            var previous = Current;
            SetSynchronizationContext(this);
            try { item.Callback(item.State); }
            finally { SetSynchronizationContext(previous); }
            return true;
        }
    }

    private enum RecheckSchedulingPhase
    {
        MockEntered, ReleaseObserved, DrainStarted, DrainFinished,
    }

    private sealed class RecheckSchedulingObservation : IDisposable
    {
        private readonly ITestOutputHelper _output;
        private readonly string?[] _observations = new string?[4];

        public RecheckSchedulingObservation(ITestOutputHelper output) => _output = output;

        public void Capture(RecheckSchedulingPhase phase)
        {
            // Inspect only the current context; never unwrap it or emit arbitrary type names.
            var context = SynchronizationContext.Current;
            var category = context is null ? "NONE" : context.GetType().FullName switch
            {
                "Xunit.Sdk.AsyncTestSyncContext" => "XUNIT_ASYNC",
                "Xunit.Sdk.MaxConcurrencySyncContext" => "XUNIT_MAX_CONCURRENCY",
                _ => "OTHER",
            };
            var isDefault = TaskScheduler.Current == TaskScheduler.Default;
            var observation = $"WAL007C_CONTEXT phase={phase} observed=True context={category} defaultScheduler={isDefault}";
            Interlocked.CompareExchange(ref _observations[(int)phase], observation, null);
        }

        public void Dispose()
        {
            // One invocation-local block on success or unwind. Missing output is not evidence.
            // Never let a diagnostic sink failure replace the fixture's existing exception.
            try
            {
                var lines = new List<string> { "WAL007C_CONTEXT_BEGIN" };
                foreach (var phase in Enum.GetValues<RecheckSchedulingPhase>())
                    lines.Add(Volatile.Read(ref _observations[(int)phase])
                        ?? $"WAL007C_CONTEXT phase={phase} observed=False");
                lines.Add("WAL007C_CONTEXT_END");
                _output.WriteLine(string.Join(Environment.NewLine, lines));
            }
            catch (Exception)
            {
                // Best-effort observations only; existing assertions and failures stay authoritative.
            }
        }
    }

    private enum RecheckDiagnosticPhase
    {
        DeadlineStarted, ContextStarted, ContextCompleted, SyncStarting, SyncTaskObtained,
        MockEntered, EntrySignaled, EntryWaiting, EntryObserved, EditStarted, EditCompleted,
        SnapshotStarted, SnapshotCompleted, ReleaseSignaled, ReleaseObserved,
        CancellationCheckPassed, RowsReturned, DrainStarted, DrainFinished, RunCancellationRequested,
    }

    private sealed record RecheckPhaseStamp(RecheckDiagnosticPhase Phase, long ElapsedMilliseconds);

    private sealed record RecheckTaskSnapshot(
        TaskStatus EntryStatus, TaskStatus ReleaseStatus, TaskStatus? SyncStatus,
        bool DeadlineCancelled, bool RunCancelled);

    private sealed class RecheckPhaseCapture
    {
        private readonly long _started = System.Diagnostics.Stopwatch.GetTimestamp();
        private readonly long[] _ticks = new long[Enum.GetValues<RecheckDiagnosticPhase>().Length];

        public long ElapsedMilliseconds => (long)System.Diagnostics.Stopwatch.GetElapsedTime(_started).TotalMilliseconds;

        public void Mark(RecheckDiagnosticPhase phase)
        {
            // One bounded atomic slot per fixed phase; no locks, callbacks, queues or shared state.
            var tick = System.Diagnostics.Stopwatch.GetTimestamp() - _started + 1;
            Interlocked.CompareExchange(ref _ticks[(int)phase], tick, 0);
        }

        public RecheckPhaseStamp[] Snapshot()
        {
            var stamps = new List<RecheckPhaseStamp>(_ticks.Length);
            foreach (var phase in Enum.GetValues<RecheckDiagnosticPhase>())
            {
                var tick = Interlocked.Read(ref _ticks[(int)phase]);
                if (tick != 0)
                    stamps.Add(new(phase,
                        (long)System.Diagnostics.Stopwatch.GetElapsedTime(0, tick - 1).TotalMilliseconds));
            }
            return stamps.OrderBy(stamp => stamp.ElapsedMilliseconds).ThenBy(stamp => stamp.Phase).ToArray();
        }
    }

    private sealed record RecheckFailureEvidence(
        RecheckDiagnosticPhase Phase, long ElapsedMilliseconds,
        Exception? FirstFailure, RecheckDiagnosticPhase? FirstFailurePhase, Exception CaughtFailure,
        TaskStatus EntryStatus, TaskStatus ReleaseStatus, TaskStatus? SyncStatus,
        bool DeadlineCancelled, bool RunCancelledBeforeRequest, bool RunCancelledAfterRequest)
    {
        public long? FirstElapsedMilliseconds { get; init; }
        public bool? FirstDeadlineCancelled { get; init; }
        public RecheckTaskSnapshot? AfterRequest { get; init; }
        public RecheckPhaseStamp[] Phases { get; init; } = [];
    }

    private static Xunit.Sdk.XunitException RecheckTimeoutFailure(
        bool draining, RecheckFailureEvidence? evidence = null)
    {
        var message = draining
            ? "WAL003E_FIXTURE_TIMEOUT: bounded Sync completion/drain failed; not behavioral RED. " +
                "Cancellation requested; no acceptance; drain unproven until owned test-host exit."
            : "WAL003E_FIXTURE_TIMEOUT: extraction/edit deadline expired; not behavioral RED. " +
                "No acceptance; drain remains unproven until owned test-host exit.";
        if (evidence is null) return new(message);
        if (evidence.CaughtFailure is not (TimeoutException or OperationCanceledException))
            message = "WAL003E_FIXTURE_FAILURE: observed fixture failure; no acceptance. " +
                "See captured task state; no timing cause asserted.";
        else if (evidence.CaughtFailure is OperationCanceledException && !evidence.DeadlineCancelled)
            message = "WAL003E_FIXTURE_CANCELED: observed cancellation; no acceptance. " +
                "See captured task state; no timing cause asserted.";

        // Only fixed codes, exception TYPE identity and scalar observations leave this helper.
        // Never attach original exceptions as InnerException/Data, or format their messages/stacks.
        var fields = new List<string>
        {
            message,
            $"phase={evidence.Phase}",
            FormattableString.Invariant($"elapsedMs={evidence.ElapsedMilliseconds}"),
            $"firstType={evidence.FirstFailure?.GetType().FullName ?? "none"}",
            $"firstPhase={evidence.FirstFailurePhase?.ToString() ?? "none"}",
            $"firstElapsedMs={evidence.FirstElapsedMilliseconds?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "unknown"}",
            $"firstDeadlineCancelled={evidence.FirstDeadlineCancelled?.ToString() ?? "unknown"}",
            $"caughtType={evidence.CaughtFailure.GetType().FullName}",
            $"entryStatus={evidence.EntryStatus}",
            $"releaseStatus={evidence.ReleaseStatus}",
            $"syncStatus={evidence.SyncStatus?.ToString() ?? "NotStarted"}",
            $"syncIsCompleted={evidence.SyncStatus is TaskStatus.RanToCompletion or TaskStatus.Canceled or TaskStatus.Faulted}",
            $"syncIsCanceled={evidence.SyncStatus == TaskStatus.Canceled}",
            $"syncIsFaulted={evidence.SyncStatus == TaskStatus.Faulted}",
            $"deadlineCancelled={evidence.DeadlineCancelled}",
            $"runCancelledBeforeRequest={evidence.RunCancelledBeforeRequest}",
            $"runCancelledAfterRequest={evidence.RunCancelledAfterRequest}",
        };
        if (evidence.AfterRequest is { } after)
        {
            fields.Add($"entryStatusAfterRequest={after.EntryStatus}");
            fields.Add($"releaseStatusAfterRequest={after.ReleaseStatus}");
            fields.Add($"syncStatusAfterRequest={after.SyncStatus?.ToString() ?? "NotStarted"}");
            fields.Add($"deadlineCancelledAfterRequest={after.DeadlineCancelled}");
        }
        foreach (var stamp in evidence.Phases)
            fields.Add(FormattableString.Invariant($"phaseStamp={stamp.Phase}:{stamp.ElapsedMilliseconds}"));
        return new(string.Join("\n", fields));
    }

    private sealed class RecheckDiagnosticControl(bool failDrain)
    {
        public bool FirstTriggered { get; private set; }
        public bool DrainTriggered { get; private set; }
        public RecheckSnapshot? AfterEdit { get; private set; }

        public void ThrowAfterSnapshot(RecheckSnapshot snapshot)
        {
            AfterEdit = snapshot;
            FirstTriggered = true;
            throw new InvalidOperationException("SYNTHETIC_PRIVATE_FIRST_FAILURE");
        }

        public void ThrowAfterRealDrain(CountyReadOnlySalesSyncResult result)
        {
            // This control never supplies a Sync result: the real service must finish its denial.
            Assert.Equal(CountyReadOnlySalesSyncDisposition.Denied, result.Disposition);
            Assert.Equal(CountyReadOnlySalesSyncDenialCode.ConnectionNotConfigured, result.DenialCode);
            Assert.Null(result.Receipt);
            if (!failDrain) return;
            DrainTriggered = true;
            // Inject only AFTER actual completion; this is not a simulated 15-second wait.
            throw new TimeoutException("SYNTHETIC_PRIVATE_DRAIN_FAILURE");
        }
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
