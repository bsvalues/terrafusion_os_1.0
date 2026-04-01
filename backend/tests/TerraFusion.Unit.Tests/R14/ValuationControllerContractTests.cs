// CARD-14D: Pin the HTTP/controller contract for canonical miss.
//
// Gap closed: before this change, ValuationStatus.PropertyNotSynced fell through
// to return Ok(result) — HTTP 200 with a broken payload. This file proves the
// contract is now explicit:
//
//   PropertyNotSynced → 404 Not Found  + errorCode:"PROPERTY_NOT_SYNCED"
//   Failed            → 500
//   Success           → 200
//
// Pattern: WebApplicationFactory + InMemory EF + IPropertyValuationAIEnhancementService mock.
// The DB is seeded with a known parcel so the controller's ParcelExistsInCountyAsync
// pre-guard passes, isolating the service-result→HTTP-status mapping under test.

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services;
using PropertyValuationRequest = TerraFusion.Core.Models.PropertyValuationRequest;
using TerraFusion.Data;
using Xunit;
using ApiProgram = TerraFusion.API.Program;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R14;

[Trait("Category", "R14")]
[Trait("Category", "CARD-14D")]
[Trait("Surface", "ValuationControllerContract")]
public sealed class ValuationControllerContractTests
{
    // ─────────────────────────────────────────────────────────────────
    // Constants shared across tests
    // ─────────────────────────────────────────────────────────────────
    private const string Route = "/api/propertyvaluation/enhance";
    private const string CountyCode = "BENTON";
    private const string SeededParcelId = "14D-BENTON-P1";

    // ─────────────────────────────────────────────────────────────────
    // Test 1 — PropertyNotSynced → 404 Not Found
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Enhance_PropertyNotSynced_Returns404WithErrorCode()
    {
        using var factory = await BuildFactoryAsync(
            serviceResult: PropertyNotSyncedResult(SeededParcelId));

        using var client = factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(Route, new
        {
            CountyCode,
            ParcelId = SeededParcelId,
        });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound,
            because: "a canonical miss must map to 404, not leak a 200 with broken payload");

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);

        // ASP.NET Core serializes ProblemDetails.Extensions flat at root level (RFC 7807 §3.1).
        // errorCode must be present so callers can distinguish "parcel not in canonical store"
        // from a "parcel not in county scope" 404 (which has no errorCode).
        doc.RootElement.TryGetProperty("errorCode", out var ec).Should().BeTrue(
            because: "the PROPERTY_NOT_SYNCED errorCode extension must be present at the root of the problem details JSON");
        ec.GetString().Should().Be("PROPERTY_NOT_SYNCED");
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 2 — Failed → 500 (regression guard: must not become 404)
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Enhance_ServiceFailed_Returns500()
    {
        using var factory = await BuildFactoryAsync(
            serviceResult: FailedResult(SeededParcelId));

        using var client = factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(Route, new
        {
            CountyCode,
            ParcelId = SeededParcelId,
        });

        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError,
            because: "a service-level failure must still map to 500, not accidentally become 404");
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 3 — Success → 200 (contract completeness)
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Enhance_ServiceSuccess_Returns200()
    {
        using var factory = await BuildFactoryAsync(
            serviceResult: SuccessResult(SeededParcelId));

        using var client = factory.CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(Route, new
        {
            CountyCode,
            ParcelId = SeededParcelId,
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK,
            because: "a successful valuation must still yield 200");
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers — service result builders
    // ─────────────────────────────────────────────────────────────────

    private static PropertyValuationResult PropertyNotSyncedResult(string parcelId) =>
        new()
        {
            ParcelId = parcelId,
            CountyCode = CountyCode,
            Status = ValuationStatus.PropertyNotSynced,
            ErrorMessage = $"Parcel '{parcelId}' is not in the TerraFusion canonical store. Run sync first.",
            IngestionResult = new PropertyDataIngestionResult
            {
                Success = false,
                ErrorCode = "PROPERTY_NOT_SYNCED",
            },
            Timestamp = DateTime.UtcNow,
        };

    private static PropertyValuationResult FailedResult(string parcelId) =>
        new()
        {
            ParcelId = parcelId,
            CountyCode = CountyCode,
            Status = ValuationStatus.Failed,
            ErrorMessage = "Generic pipeline failure",
            IngestionResult = new PropertyDataIngestionResult { Success = false },
            Timestamp = DateTime.UtcNow,
        };

    private static PropertyValuationResult SuccessResult(string parcelId) =>
        new()
        {
            ParcelId = parcelId,
            CountyCode = CountyCode,
            Status = ValuationStatus.Success,
            EstimatedValue = 280_000m,
            ConfidenceScore = 0.97m,
            IngestionResult = new PropertyDataIngestionResult
            {
                Success = true,
                PropertyData = new PropertyData { ParcelId = parcelId, CountyCode = CountyCode },
            },
            Timestamp = DateTime.UtcNow,
        };

    // ─────────────────────────────────────────────────────────────────
    // Helpers — factory builder
    // ─────────────────────────────────────────────────────────────────

    private static async Task<C14DFactory> BuildFactoryAsync(PropertyValuationResult serviceResult)
    {
        var factory = new C14DFactory(serviceResult);
        await factory.EnsureSeedDataAsync();
        return factory;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test infrastructure — minimal WebApplicationFactory for CARD-14D
// ─────────────────────────────────────────────────────────────────────────────

internal sealed class C14DFactory : WebApplicationFactory<ApiProgram>
{
    private const string AuthScheme = "C14DTestAuth";
    private static readonly Guid CountyId = Guid.Parse("14140014-1414-1414-1414-141414141414");
    private const string ParcelId = "14D-BENTON-P1";

    private readonly PropertyValuationResult _serviceResult;
    private readonly string _databaseName = $"c14d-{Guid.NewGuid():N}";

    public C14DFactory(PropertyValuationResult serviceResult)
    {
        _serviceResult = serviceResult;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Data Source=:memory:",
                ["ConnectionStrings:TerraFusionDatabase"] = "Host=localhost;Database=tf_test;Username=tf;Password=tf",
                ["JwtSettings:SecretKey"] = "C14D_TEST_SECRET_KEY_01234567890123456789012345678901",
                ["JwtSettings:Issuer"] = "TerraFusionTestIssuer",
                ["JwtSettings:Audience"] = "TerraFusionTestAudience",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // Replace the real DbContext with InMemory so ParcelExistsInCountyAsync works
            // against our seeded data.
            services.RemoveAll<DbContextOptions<DataDbContext>>();
            services.RemoveAll<DataDbContext>();
            services.AddDbContext<DataDbContext>(opts =>
                opts.UseInMemoryDatabase(_databaseName));

            // Mock the valuation service to return the canned result under test.
            var valuationMock = new Mock<IPropertyValuationAIEnhancementService>();
            valuationMock
                .Setup(s => s.ExecuteAIEnhancedValuationAsync(It.IsAny<PropertyValuationRequest>()))
                .ReturnsAsync(_serviceResult);
            services.RemoveAll<IPropertyValuationAIEnhancementService>();
            services.AddScoped(_ => valuationMock.Object);

            // Minimal auth setup — test scheme issues claims from request headers.
            services.AddAuthentication(opts =>
                {
                    opts.DefaultAuthenticateScheme = AuthScheme;
                    opts.DefaultChallengeScheme = AuthScheme;
                    opts.DefaultScheme = AuthScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, C14DAuthHandler>(AuthScheme, _ => { });

            services.AddAuthorization(opts =>
            {
                opts.DefaultPolicy = new AuthorizationPolicyBuilder(AuthScheme)
                    .RequireAuthenticatedUser()
                    .Build();
            });
        });
    }

    public async Task EnsureSeedDataAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DataDbContext>();
        await db.Database.EnsureCreatedAsync();

        if (!await db.Counties.AnyAsync(c => c.Id == CountyId))
        {
            db.Counties.Add(new County
            {
                Id = CountyId,
                Name = "Benton",
                State = "WA",
                FipsCode = "003",
            });
        }

        // Seed the parcel so ParcelExistsInCountyAsync passes.
        // Without this, the controller returns 404 before calling the service —
        // which would hide the status-code mapping under test.
        if (!await db.Properties.AnyAsync(p => p.ParcelId == ParcelId))
        {
            db.Properties.Add(new Property
            {
                Id = Guid.NewGuid(),
                PropertyId = "C14D-PROP-001",
                ParcelId = ParcelId,
                ParcelNumber = ParcelId,
                Address = "14 Delta Ave",
                PropertyType = "SFR",
                AssessedValue = 260_000m,
                LandValue = 90_000m,
                ImprovementValue = 170_000m,
                MarketValue = 280_000m,
                AssessmentDate = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow,
                TaxYear = 2026,
                CountyId = CountyId,
            });
        }

        await db.SaveChangesAsync();
    }

    public HttpClient CreateAuthenticatedClient()
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(AuthScheme, "token");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyId", CountyId.ToString());
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-CountyCode", "BENTON");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Test-Role", "Assessor");
        return client;
    }
}

/// <summary>
/// Minimal test auth handler: reads identity claims from request headers.
/// Mirrors the R14TestAuthHandler pattern from R14Phase2P0ControllerIntegrationTests.
/// </summary>
internal sealed class C14DAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public C14DAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override System.Threading.Tasks.Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out _))
            return System.Threading.Tasks.Task.FromResult(AuthenticateResult.NoResult());

        var countyId = Request.Headers["X-Test-CountyId"].ToString();
        var countyCode = Request.Headers["X-Test-CountyCode"].ToString();

        var claims = new List<Claim>
        {
            new("sub", "c14d-user"),
            new(ClaimTypes.NameIdentifier, "c14d-user"),
        };

        if (!string.IsNullOrWhiteSpace(countyId))
            claims.Add(new Claim("countyId", countyId));
        if (!string.IsNullOrWhiteSpace(countyCode))
            claims.Add(new Claim("countyCode", countyCode));

        var ticket = new AuthenticationTicket(
            new System.Security.Claims.ClaimsPrincipal(
                new ClaimsIdentity(claims, Scheme.Name)),
            Scheme.Name);

        return System.Threading.Tasks.Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
