using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
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
                    "Server=pacs;Database=benton_pacs;Encrypt=True;TrustServerCertificate=True;Application Name=TerraFusion-Test",
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
                    "Server=pacs;Database=benton_pacs;Encrypt=True;TrustServerCertificate=True;Application Name=TerraFusion-Test;ApplicationIntent=ReadOnly",
            }).Build();

        using var adapter = new PacsSqlAdapter(NullLogger<PacsSqlAdapter>.Instance, configuration);

        Assert.IsAssignableFrom<IExternalReadOnlyPacsAdapter>(adapter);
        Assert.True(adapter.MatchesSource("PACS", "BENTON_PACS"));
        Assert.False(adapter.MatchesSource("franklin-pacs", "benton_pacs"));
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
        adapter.Setup(value => value.GetConnectionStatusAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PacsConnectionStatus
            {
                IsConnected = true,
                DatabaseName = "benton_pacs",
                ServerName = "b***o",
            });
        adapter.Setup(value => value.ValidateContractAsync(It.IsAny<CancellationToken>()))
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
                        PropId = 1001,
                        GeoId = "BEN-1001",
                        SaleDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 425_000m,
                        PropTypeCd = "R1",
                    },
                    new PacsComparableSale
                    {
                        PropId = 1002,
                        GeoId = "BEN-1002",
                        SaleDate = new DateTime(2026, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                        SalePrice = 390_000m,
                        PropTypeCd = "R1",
                    },
                },
            });
        var service = new CountyReadOnlySalesSyncService(factory, adapter.Object);
        var benton = await CreateCountyContextAsync(Benton, BentonId, "benton-assessor");
        var franklin = await CreateCountyContextAsync(Franklin, FranklinId, "franklin-assessor");

        var first = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(benton));
        var second = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(benton));
        var foreign = await service.SyncAsync(new CountyReadOnlySalesSyncRequest(franklin));

        Assert.Equal(CountyReadOnlySalesSyncDisposition.Completed, first.Disposition);
        Assert.Equal(2, first.Receipt!.AddedSales);
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
        });
        Assert.Equal(2, await verify.AuditEvents.CountAsync(trace =>
            trace.CountyId == BentonId
            && trace.UserId == "benton-assessor"
            && trace.Action == "valuation.readonly-sales-synced"));
        Assert.Empty(await verify.ComparableSales.Where(sale => sale.CountyId == FranklinId).ToListAsync());
        adapter.Verify(value => value.GetComparableSalesAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
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
        var service = new CountyReadOnlySalesSyncService(factory, adapter.Object);
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
            await seed.SaveChangesAsync();
        }
        var adapter = new Mock<IPacsAdapter>();
        adapter.As<IExternalReadOnlyPacsAdapter>()
            .Setup(value => value.MatchesSource("benton-pacs-ro", "benton_pacs"))
            .Returns(true);
        var service = new CountyReadOnlySalesSyncService(factory, adapter.Object);
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
