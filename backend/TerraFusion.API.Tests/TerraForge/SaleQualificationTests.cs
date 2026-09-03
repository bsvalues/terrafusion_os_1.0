// Slice 1.4 — sale qualification queue + decisioning
//
// Verifies:
//   GET  /api/terraforge/sale-qualification
//     1. Empty DB → total 0, items empty
//     2. Pending sales (QualificationDecision == null) returned for status=pending
//     3. SalesYear filter — sales assigned to wrong tax year excluded
//     4. Date-window fallback — SalesYear null, SaleDate in lookback range → included
//     5. County isolation — different CountyId excluded
//     6. Status=staff-confirmed filter returns only StaffConfirmed decisions
//     7. Pagination — page 2 with pageSize 1 returns correct item
//
//   PATCH /api/terraforge/sale-qualification/{saleId}
//     8. Records decision on valid sale → 200 with decision fields
//     9. Unknown saleId → 404
//    10. Wrong county → 404 (county isolation)

using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Auth;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
// Disambiguate: TerraFusion.Core.Entities.Task vs System.Threading.Tasks.Task
using Task = System.Threading.Tasks.Task;
// Disambiguate: TerraFusion.Core.Entities.ComparableSale vs TerraFusion.API.Services.ComparableSale
using ComparableSale = TerraFusion.Core.Entities.ComparableSale;

namespace TerraFusion.API.Tests.TerraForge;

/// <summary>
/// Unit tests for TerraForgeController.GetSaleQualification and PatchSaleQualification (Slice 1.4).
///
/// Benton County GUID: 19190019-1919-1919-1919-191919191919 (hardcoded in controller).
/// taxYear=2026 lookback: 2024-01-01 … 2026-01-01 UTC.
/// </summary>
public sealed class SaleQualificationTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid OtherCountyId =
        Guid.Parse("22222222-2222-2222-2222-222222222222");

    // Lookback window for taxYear=2026
    private static readonly DateTime LookbackStart =
        new(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime LookbackEnd =
        new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly TerraForgeController _sut;

    public SaleQualificationTests()
    {
        _db  = TestDbContextFactory.CreateInMemoryContext();
        var countyRuntime = CreateCountyRuntime();
        _sut = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>(),
            Mock.Of<ISaleQualificationService>(),
            countyRuntime.Resolver,
            countyRuntime.ContextProvider)
        {
            ControllerContext = ControllerTestSetup.WithCountyClaim(BentonId),
        };
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ────────────────────────────────────────────────────────────

    private ComparableSale MakeSale(
        Guid?    countyId            = null,
        int?     salesYear           = 2026,
        DateTime? saleDate           = null,
        decimal  salePrice           = 350_000m,
        string?  recommendation      = "qualified",
        string?  decision            = null,
        string?  decisionSource      = null)
    {
        return new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = countyId ?? BentonId,
            ParcelId                    = "100000000000001",
            SaleDate                    = saleDate ?? new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            SalesYear                   = salesYear,
            QualificationRecommendation = recommendation,
            QualificationDecision       = decision,
            DecisionSource              = decisionSource,
        };
    }

    private void Seed(params ComparableSale[] sales)
    {
        _db.ComparableSales.AddRange(sales);
        _db.SaveChanges();
    }

    private static JsonElement ParseOkBody(IActionResult result)
    {
        var ok   = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);
        return JsonDocument.Parse(json).RootElement;
    }

    // ── GET tests ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetSaleQualification_EmptyDb_ReturnsTotalZero()
    {
        var body = ParseOkBody(
            await _sut.GetSaleQualification(taxYear: 2026, status: "pending"));

        Assert.Equal(0, body.GetProperty("total").GetInt32());
        Assert.Equal(0, body.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task GetSaleQualification_PendingSales_ReturnedForStatusPending()
    {
        Seed(
            MakeSale(decision: null),          // ← pending
            MakeSale(decision: "qualified")    // ← decided — excluded
        );

        var body = ParseOkBody(
            await _sut.GetSaleQualification(taxYear: 2026, status: "pending"));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
        Assert.Equal(1, body.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task GetSaleQualification_SalesYearFilter_ExcludesWrongYear()
    {
        Seed(
            MakeSale(salesYear: 2026),   // ← in
            MakeSale(salesYear: 2025)    // ← out: wrong tax year assignment
        );

        var body = ParseOkBody(
            await _sut.GetSaleQualification(taxYear: 2026, status: "pending"));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetSaleQualification_DateWindowFallback_NullSalesYearIncludedWhenInWindow()
    {
        var inWindow  = new DateTime(2025, 3, 15, 0, 0, 0, DateTimeKind.Utc);
        var outWindow = new DateTime(2023, 12, 31, 0, 0, 0, DateTimeKind.Utc);

        Seed(
            MakeSale(salesYear: null, saleDate: inWindow),    // ← in: date falls in 2024-2026
            MakeSale(salesYear: null, saleDate: outWindow)    // ← out: date before lookback
        );

        var body = ParseOkBody(
            await _sut.GetSaleQualification(taxYear: 2026, status: "pending"));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetSaleQualification_DifferentCounty_Excluded()
    {
        Seed(
            MakeSale(countyId: BentonId),        // ← in
            MakeSale(countyId: OtherCountyId)    // ← out: wrong county
        );

        var body = ParseOkBody(
            await _sut.GetSaleQualification(taxYear: 2026, status: "pending"));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Theory]
    [InlineData("wa-franklin")]
    [InlineData("22222222-2222-2222-2222-222222222222")]
    public async Task GetSaleQualification_CallerSelectedDifferentCounty_IsForbidden(
        string requestedCounty)
    {
        Seed(MakeSale(countyId: OtherCountyId));

        var result = await _sut.GetSaleQualification(
            taxYear: 2026,
            countyId: requestedCounty,
            status: "pending");

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task GetSaleQualification_StaffConfirmedFilter_ReturnsOnlyStaffDecisions()
    {
        Seed(
            MakeSale(decision: null),                               // ← pending: excluded
            MakeSale(decision: "qualified", decisionSource: "StaffConfirmed"),  // ← in
            MakeSale(decision: "qualified", decisionSource: "AppraiserFinal")   // ← out: wrong source
        );

        var body = ParseOkBody(
            await _sut.GetSaleQualification(taxYear: 2026, status: "staff-confirmed"));

        Assert.Equal(1, body.GetProperty("total").GetInt32());
    }

    [Fact]
    public async Task GetSaleQualification_Pagination_Page2ReturnsSecondItem()
    {
        var sale1 = MakeSale(saleDate: new DateTime(2025, 12, 1, 0, 0, 0, DateTimeKind.Utc));
        var sale2 = MakeSale(saleDate: new DateTime(2025, 11, 1, 0, 0, 0, DateTimeKind.Utc));
        Seed(sale1, sale2);

        // Page 2, pageSize 1 — ordered descending by SaleDate so sale2 comes second
        var body = ParseOkBody(
            await _sut.GetSaleQualification(taxYear: 2026, status: "pending",
                page: 2, pageSize: 1));

        Assert.Equal(2, body.GetProperty("total").GetInt32());
        Assert.Equal(1, body.GetProperty("items").GetArrayLength());

        // Verify the item on page 2 is sale2 (older date = second after desc sort)
        var item = body.GetProperty("items")[0];
        Assert.Equal(sale2.Id.ToString(), item.GetProperty("saleId").GetString());
    }

    // ── PATCH tests ────────────────────────────────────────────────────────

    [Fact]
    public async Task PatchSaleQualification_RecordsDecision_Returns200WithFields()
    {
        var sale = MakeSale(decision: null);
        Seed(sale);

        var body = ParseOkBody(
            await _sut.PatchSaleQualification(
                sale.Id,
                new SaleQualificationPatchDto
                {
                    QualificationDecision = "qualified",
                    ResearchNotes         = "Verified arms-length transfer",
                    DecidedBy             = "bspencer",
                    DecisionSource        = "StaffConfirmed",
                }));

        Assert.Equal(sale.Id.ToString(), body.GetProperty("saleId").GetString());
        Assert.Equal("qualified", body.GetProperty("qualificationDecision").GetString());
        Assert.Equal("bspencer", body.GetProperty("decidedBy").GetString());
        Assert.False(body.GetProperty("decidedAt").ValueKind == JsonValueKind.Null);

        // Confirm persisted
        var persisted = await _db.ComparableSales.FindAsync(sale.Id);
        Assert.NotNull(persisted);
        Assert.Equal("qualified",        persisted!.QualificationDecision);
        Assert.Equal("StaffConfirmed",   persisted!.DecisionSource);
        Assert.Equal("Verified arms-length transfer", persisted!.DecisionReason);
    }

    [Fact]
    public async Task PatchSaleQualification_UnknownSaleId_Returns404()
    {
        var result = await _sut.PatchSaleQualification(
            Guid.NewGuid(),
            new SaleQualificationPatchDto { QualificationDecision = "qualified" });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task PatchSaleQualification_WrongCounty_Returns404()
    {
        var sale = MakeSale(countyId: OtherCountyId);
        Seed(sale);

        // The controller filters by BentonCountyId — a different county's sale is not found
        var result = await _sut.PatchSaleQualification(
            sale.Id,
            new SaleQualificationPatchDto { QualificationDecision = "qualified" });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task SaleQualification_WithoutAuthenticatedCanonicalContext_FailsClosed()
    {
        var controller = new TerraForgeController(
            _db,
            NullLogger<TerraForgeController>.Instance,
            Mock.Of<IOlsRegressionService>(),
            Mock.Of<ISaleQualificationService>(),
            ControllerTestSetup.CountyResolverFor(BentonId))
        {
            ControllerContext = ControllerTestSetup.WithCountyClaim(BentonId),
        };

        Assert.IsType<ForbidResult>(
            await controller.GetSaleQualification(taxYear: 2026, status: "pending"));
    }

    [Fact]
    public void EverySaleQualificationEndpoint_RequiresAssessorPolicy()
    {
        var endpoints = typeof(TerraForgeController)
            .GetMethods()
            .Where(method => method.GetCustomAttributes(inherit: true)
                .OfType<Microsoft.AspNetCore.Mvc.Routing.HttpMethodAttribute>()
                .Any(attribute => attribute.Template?.StartsWith(
                    "sale-qualification", StringComparison.Ordinal) == true))
            .ToArray();

        Assert.Equal(7, endpoints.Length);
        Assert.All(endpoints, endpoint => Assert.Contains(
            endpoint.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
                .Cast<AuthorizeAttribute>(),
            attribute => attribute.Policy == "RequireAssessor"));
    }

    private static (ICountyResolver Resolver,
        AuthenticatedCanonicalCountyContextProvider ContextProvider) CreateCountyRuntime()
    {
        var countyIds = WashingtonCountyRegistry.Counties
            .Select((county, index) => new
            {
                county.Key,
                Id = county.Key == "wa-benton"
                    ? BentonId
                    : county.Key == "wa-franklin"
                        ? OtherCountyId
                        : new Guid(index + 1, 0, 0, new byte[8]),
            })
            .ToDictionary(entry => entry.Key, entry => entry.Id, StringComparer.Ordinal);
        Guid? Resolve(string value)
        {
            if (Guid.TryParse(value, out var id) && countyIds.Values.Contains(id))
            {
                return id;
            }
            return WashingtonCountyRegistry.TryResolve(value, out var county)
                ? countyIds[county.Key]
                : null;
        }

        var resolver = new Mock<ICountyResolver>();
        resolver.Setup(candidate => candidate.TryResolveAsync(
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((value, _) => Task.FromResult(Resolve(value)));
        resolver.Setup(candidate => candidate.ResolveAsync(
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<string, CancellationToken>((value, _) => Resolve(value) is { } id
                ? Task.FromResult(id)
                : throw new CountyNotFoundException(value));
        var accessor = new Mock<IRequestUserContextAccessor>();
        accessor.SetupGet(candidate => candidate.Current).Returns(new RequestUserContext(
            true,
            "benton-assessor",
            "wa-benton",
            ["Assessor"]));
        var provider = new AuthenticatedCanonicalCountyContextProvider(
            new AuthenticatedCountyAuthorityBinding(accessor.Object, resolver.Object),
            new AuthenticatedCanonicalCountyContext(resolver.Object));
        return (resolver.Object, provider);
    }
}
