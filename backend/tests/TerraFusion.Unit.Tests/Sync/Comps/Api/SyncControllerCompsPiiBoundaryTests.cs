using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.API.Services.Sync;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Comps.Sales;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Comps.Api;

public sealed class SyncControllerCompsPiiBoundaryTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-1111-4111-8111-111111111111");

    // Removing the consumer gate must expose the reader and turn this 503 into
    // 200 (or 304). The fake replaces only database I/O, not the PII decision.
    [Theory]
    [InlineData("GET", false)]
    [InlineData("HEAD", false)]
    [InlineData("GET", true)]
    [InlineData("HEAD", true)]
    public async Task MissingCoverage_DeniesBeforeAnyReaderOrConditionalResponse(string method, bool conditional)
    {
        var configuration = new ConfigurationBuilder().Build();
        using var services = new ServiceCollection().AddSingleton<IConfiguration>(configuration).BuildServiceProvider();
        using var db = CreateDb();
        var reader = CreateReader();
        var controller = CreateController(db, reader.Object, services, method, conditional);

        var result = await controller.GetEligibleComps(CountyId, null, null, null);

        var denial = result.Should().BeOfType<ObjectResult>().Subject;
        denial.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        var payload = System.Text.Json.JsonSerializer.Serialize(denial.Value);
        payload.Should().Contain("PII_CANONICAL_LANDING_UNVERIFIED").And.Contain("UNKNOWN_DENY");
        controller.Response.Headers.CacheControl.ToString().Should().Contain("no-store");
        controller.Response.Headers.ETag.Should().BeEmpty();
        reader.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("non-exhaustive")]
    [InlineData("direct")]
    [InlineData("indirect")]
    [InlineData("missing-manifest")]
    [InlineData("missing-schema")]
    [InlineData("malformed-manifest")]
    [InlineData("malformed-schema")]
    [InlineData("wrong-county")]
    [InlineData("wrong-consumer")]
    [InlineData("wrong-manifest-hash")]
    [InlineData("wrong-schema-hash")]
    [InlineData("wrong-pair")]
    [InlineData("unknown-column")]
    [InlineData("missing-field")]
    [InlineData("null-schema")]
    [InlineData("null-fk-columns")]
    public async Task UnverifiedBoundArtifacts_DenyWithoutReadingCanonicalData(string condition)
    {
        using var fixture = new ReviewedPiiFixture();
        var services = fixture.ForCounty(CountyId, condition);
        using var db = CreateDb();
        var reader = CreateReader();
        var controller = CreateController(db, reader.Object, services, "GET", true);

        var result = await controller.GetEligibleComps(CountyId, null, null, null);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(503);
        controller.Response.Headers.CacheControl.ToString().Should().Contain("no-store");
        controller.Response.Headers.ETag.Should().BeEmpty();
        reader.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("null-manifest-tables")]
    [InlineData("null-manifest-columns")]
    public async Task PinnedNullManifestEntry_DeniesBeforeParserCanEscapeOrReaderRuns(string condition)
    {
        using var fixture = new ReviewedPiiFixture();
        var services = fixture.ForCounty(CountyId, condition);
        using var db = CreateDb();
        var reader = CreateReader();
        var controller = CreateController(db, reader.Object, services, "GET", true);

        var result = await controller.GetEligibleComps(CountyId, null, null, null);

        var denial = result.Should().BeOfType<ObjectResult>().Subject;
        denial.StatusCode.Should().Be(StatusCodes.Status503ServiceUnavailable);
        using var payload = JsonDocument.Parse(JsonSerializer.Serialize(denial.Value));
        payload.RootElement.GetProperty("code").GetString().Should().Be("PII_CANONICAL_LANDING_UNVERIFIED");
        payload.RootElement.GetProperty("disposition").GetString().Should().Be("UNKNOWN_DENY");
        controller.Response.Headers.CacheControl.ToString().Should().Be("no-store");
        controller.Response.Headers.ETag.Should().BeEmpty();
        reader.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ReviewedSafeCoverage_AllowsData_AndRevocationDeniesOnNextRequest()
    {
        using var fixture = new ReviewedPiiFixture();
        var services = fixture.ForCounty(CountyId);
        using var db = CreateDb();
        var reader = CreateReader();
        var controller = CreateController(db, reader.Object, services, "GET", false);
        (await controller.GetEligibleComps(CountyId, null, null, null)).Should().BeOfType<OkObjectResult>();
        reader.Verify(r => r.MaxLockedAtAsync(CountyId, null, It.IsAny<CancellationToken>()), Times.Once);
        reader.Verify(r => r.CountAsync(CountyId, null, It.IsAny<CancellationToken>()), Times.Once);
        reader.Verify(r => r.ReadPageAsync(CountyId, null, 1, 100, It.IsAny<CancellationToken>()), Times.Once);
        reader.Invocations.Clear();

        File.WriteAllText(fixture.LastManifestPath, "{}");
        var next = CreateController(db, reader.Object, services, "HEAD", true);
        (await next.GetEligibleComps(CountyId, null, null, null)).Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(503);
        reader.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CrossCountyRequest_IsForbiddenBeforeCoverageOrReader()
    {
        using var services = new ServiceCollection().BuildServiceProvider();
        using var db = CreateDb();
        var reader = CreateReader();
        var controller = CreateController(db, reader.Object, services, "GET", false);
        (await controller.GetEligibleComps(Guid.NewGuid(), null, null, null)).Should().BeOfType<ForbidResult>();
        reader.VerifyNoOtherCalls();
    }

    internal static TerraFusionDbContext CreateDb() => new(
        new DbContextOptionsBuilder<TerraFusionDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = "InMemory",
            ["Logging:EnableSensitiveDataLogging"] = "false",
        }).Build());

    private static Mock<ISalesCompEligibilityReader> CreateReader()
    {
        var reader = new Mock<ISalesCompEligibilityReader>();
        reader.Setup(r => r.MaxLockedAtAsync(CountyId, null, It.IsAny<CancellationToken>())).ReturnsAsync((DateTime?)null);
        reader.Setup(r => r.CountAsync(CountyId, null, It.IsAny<CancellationToken>())).ReturnsAsync(0);
        reader.Setup(r => r.ReadPageAsync(CountyId, null, 1, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<CompEligibleSale>());
        return reader;
    }

    private static SyncController CreateController(TerraFusionDbContext db, ISalesCompEligibilityReader reader,
        IServiceProvider services, string method, bool conditional)
    {
        var controller = new SyncController(Mock.Of<ISaleQualificationService>(), db,
            NullLogger<SyncController>.Instance, reader, Mock.Of<ISyncCountyActiveWorkbookService>(),
            Mock.Of<ISalesCompStaleReader>(), Mock.Of<ISalesCompStaleSummaryReader>());
        var http = new DefaultHttpContext
        {
            RequestServices = services,
            User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim("countyId", CountyId.ToString()) }, "Synthetic")),
        };
        http.Request.Method = method;
        if (conditional) http.Request.Headers.IfNoneMatch = "*";
        controller.ControllerContext = new ControllerContext { HttpContext = http };
        return controller;
    }
}

// Shared only by the explicitly reserved consumer/eligible/HEAD fixtures.
// It supplies real parser/catalog/preflight inputs, never a bypass/mock gate.
internal sealed class ReviewedPiiFixture : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"waco-pii-{Guid.NewGuid():N}");
    private readonly List<ServiceProvider> _providers = new();
    public string LastManifestPath { get; private set; } = "";

    public IServiceProvider ForCounty(Guid countyId, string condition = "safe")
    {
        var dir = Path.Combine(_root, Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        var manifestPath = Path.Combine(dir, "manifest.json");
        var schemaPath = Path.Combine(dir, "schema.json");
        LastManifestPath = manifestPath;
        var fields = new[] { "ChgOfOwnerId", "WacCdSourceValue", "WacCdCanonicalValue", "SlRatioTypeCdSourceValue",
            "SlRatioTypeCdCanonicalValue", "SaleDate", "SalePrice", "SourceWorkbookId", "SourceWorkbookLockedAt" };
        var classification = condition == "direct" ? "Direct" : condition == "indirect" ? "Indirect" : "None";
        File.WriteAllText(manifestPath, JsonSerializer.Serialize(new
        {
            manifestVersion = "1.0.0", manifestEvent = "synthetic-reviewed-control",
            tableExhaustive = condition == "non-exhaustive" ? Array.Empty<string>() : new[] { "sale" },
            tables = new[] { new { name = "sale", classification, reason = "Synthetic reviewed fixture; no county coverage claim." } },
            columns = Array.Empty<object>(),
        }));
        if (condition == "malformed-manifest") File.WriteAllText(manifestPath, "{");
        if (condition is "null-manifest-tables" or "null-manifest-columns")
        {
            var manifestJson = System.Text.Json.Nodes.JsonNode.Parse(File.ReadAllText(manifestPath))!;
            manifestJson[condition == "null-manifest-tables" ? "tables" : "columns"] =
                System.Text.Json.Nodes.JsonNode.Parse("[null]");
            File.WriteAllText(manifestPath, manifestJson.ToJsonString());
        }
        // Pin the actual negative artifact and pair before building the schema
        // hash, so malformed entries reach validation rather than a hash denial.
        var manifestHash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(manifestPath)));
        var data = new PacsSchemaSourceData(
            new[] { new PacsTable("sale", new[] { "ChgOfOwnerId" }, PacsConversionEra.Both,
                Array.Empty<PacsDictionaryReference>(), PiiClassification.None, "fixture://sale", Array.Empty<PacsForeignKey>()) },
            fields.Select(f => new PacsColumn("sale", f, "varchar", true, PacsConversionEra.Both, null,
                PiiClassification.None, $"fixture://sale.{f}", "")).ToArray(),
            Array.Empty<PacsDictionary>(),
            new PacsSchemaVersion("fixture", new Dictionary<string, string> { ["fixture"] = "fixture-hash" },
                new DateTime(2026, 9, 7, 0, 0, 0, DateTimeKind.Utc), "no-conversion-manifest-supplied"));
        if (condition == "null-fk-columns")
        {
            data = data with { Tables = new[] { data.Tables[0] with
            {
                ForeignKeys = new[] { new PacsForeignKey(null, "sale", null!, "sale", new[] { "ChgOfOwnerId" },
                    PacsForeignKeySource.Heuristic, "fixture://fk", PacsForeignKeyConfidence.InferredByName, PacsConversionEra.Both) },
            } } };
        }
        var projection = fields.Where(f => condition != "missing-field" || f != "SalePrice")
            .ToDictionary(f => f, f => new[] { new { Table = "sale", Column = condition == "unknown-column" ? "not_in_schema" : f } });
        File.WriteAllText(schemaPath, JsonSerializer.Serialize(new
        {
            CountyId = condition == "wrong-county" ? Guid.NewGuid() : countyId,
            Consumer = condition == "wrong-consumer" ? "other.consumer" : "sync.comps.eligible",
            ManifestSha256 = condition == "wrong-pair" ? new string('0', 64) : manifestHash,
            Schema = condition == "null-schema" ? null : data,
            Projection = projection,
        }));
        if (condition == "malformed-schema") File.WriteAllText(schemaPath, "{");
        var schemaHash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(schemaPath)));
        var prefix = $"Sync:CanonicalLandingPii:Counties:{countyId:D}:";
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [prefix + "ManifestPath"] = manifestPath,
            [prefix + "ManifestSha256"] = condition == "wrong-manifest-hash" ? new string('0', 64) : manifestHash,
            [prefix + "SchemaPath"] = schemaPath,
            [prefix + "SchemaSha256"] = condition == "wrong-schema-hash" ? new string('0', 64) : schemaHash,
        }).Build();
        if (condition == "missing-manifest") File.Delete(manifestPath);
        if (condition == "missing-schema") File.Delete(schemaPath);
        var services = new ServiceCollection().AddSingleton<IConfiguration>(configuration)
            .AddScoped<CanonicalLandingPiiBoundary>().BuildServiceProvider();
        _providers.Add(services);
        return services;
    }

    public void Dispose()
    {
        foreach (var provider in _providers) provider.Dispose();
        if (Directory.Exists(_root)) Directory.Delete(_root, recursive: true);
    }
}
