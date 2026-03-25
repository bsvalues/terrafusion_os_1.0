// CARD-14C: Harden and prove the canonical-only ingest boundary established in CARD-14B.
//
// Three assertions the co-founder requires:
//   1. canonical hit  → ingest succeeds, property data populated
//   2. canonical miss → Success=false, ErrorCode="PROPERTY_NOT_SYNCED"
//   3. no IPacsAdapter dependency remains anywhere in the service type (static boundary proof)
//
// Bonus: cache-hit path verified as a fast-exit that does NOT reach the DB.

using System;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Metrics;
using TerraFusion.Core.Models;
using TerraFusion.Core.Services;
using TerraFusion.Data;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R14;

[Trait("Category", "R14")]
[Trait("Category", "CARD-14C")]
[Trait("Surface", "ValuationIngestBoundary")]
public sealed class ValuationIngestBoundaryTests
{
    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Build an isolated InMemory DbContext. Each test gets its own DB so
    /// there is no state bleed between test cases.
    /// </summary>
    private static TerraFusionDbContext BuildTestContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var configuration = new ConfigurationBuilder().Build();
        return new TerraFusionDbContext(options, configuration);
    }

    /// <summary>
    /// Wire up the service under test with all non-DB dependencies mocked/no-op.
    /// </summary>
    private static PropertyValuationAIEnhancementService BuildService(
        ITerraFusionDbContext db,
        IRedisCacheService cache)
    {
        var logger = new Mock<ILogger<PropertyValuationAIEnhancementService>>();
        logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(false);

        var validationService = new Mock<IPropertyDataValidationService>();

        var metricsLogger = new Mock<ILogger<TerraFusionMetricsExporter>>();
        var metrics = new TerraFusionMetricsExporter(metricsLogger.Object);

        var performanceMonitor = new Mock<IPerformanceMonitor>();
        performanceMonitor
            .Setup(m => m.StartActivity(It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(new Mock<IDisposable>().Object);

        var syncService = new Mock<ITerraFusionSyncService>();

        return new PropertyValuationAIEnhancementService(
            logger.Object,
            db,
            validationService.Object,
            cache,
            metrics,
            performanceMonitor.Object,
            syncService.Object);
    }

    /// <summary>
    /// A mock IRedisCacheService that always returns null (cache miss).
    /// </summary>
    private static IRedisCacheService CacheMiss()
    {
        var mock = new Mock<IRedisCacheService>();
        mock.Setup(c => c.GetAsync<PropertyData>(It.IsAny<string>()))
            .ReturnsAsync((PropertyData?)null);
        mock.Setup(c => c.SetAsync(It.IsAny<string>(), It.IsAny<PropertyData>(), It.IsAny<TimeSpan?>()))
            .Returns(Task.CompletedTask);
        return mock.Object;
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 1 — Canonical hit → ingest succeeds
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task IngestPropertyDataAsync_CanonicalHit_ReturnsSuccessWithPropertyData()
    {
        // Arrange — seed a real Property in the InMemory canonical store
        await using var ctx = BuildTestContext();

        var testCountyId = Guid.NewGuid();
        const string testParcelId = "12345-BENTON";

        ctx.Properties.Add(new Property
        {
            Id = Guid.NewGuid(),
            PropertyId = "P001",
            ParcelId = testParcelId,
            ParcelNumber = "12345",
            Address = "123 Main St",
            OwnerName = "Jane Doe",
            PropertyType = "SFR",
            YearBuilt = 1985,
            AssessedValue = 250_000m,
            LandValue = 80_000m,
            ImprovementValue = 170_000m,
            MarketValue = 300_000m,
            TaxYear = 2024,
            CountyId = testCountyId,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
        });
        await ctx.SaveChangesAsync();

        var svc = BuildService(ctx, CacheMiss());

        // Act
        var result = await svc.IngestPropertyDataAsync("BENTON", testParcelId);

        // Assert
        result.Success.Should().BeTrue(
            because: "a property that exists in the canonical store must yield a successful ingest");
        result.ErrorCode.Should().BeNull(
            because: "no error condition applies when the canonical record is present");
        result.PropertyData.Should().NotBeNull();
        result.PropertyData!.ParcelId.Should().Be(testParcelId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 2 — Canonical miss → PROPERTY_NOT_SYNCED
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task IngestPropertyDataAsync_CanonicalMiss_ReturnsPropertyNotSynced()
    {
        // Arrange — empty canonical store; the parcel has never been synced
        await using var ctx = BuildTestContext();

        var svc = BuildService(ctx, CacheMiss());

        // Act
        var result = await svc.IngestPropertyDataAsync("BENTON", "DOES-NOT-EXIST");

        // Assert
        result.Success.Should().BeFalse(
            because: "a parcel absent from the canonical store must not appear to succeed");
        result.ErrorCode.Should().Be("PROPERTY_NOT_SYNCED",
            because: "the canonical miss error code must be PROPERTY_NOT_SYNCED — not a silent null or a PACS fallback");
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 3 — Cache hit → fast-exit without DB query
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task IngestPropertyDataAsync_CacheHit_ReturnsCachedData()
    {
        // Arrange — empty canonical store; success must come from cache only
        await using var ctx = BuildTestContext();

        var cachedData = new PropertyData
        {
            ParcelId = "CACHED-PARCEL",
            CountyCode = "BENTON",
            PropertyType = "SFR",
            SquareFootage = 1_200m,
        };

        var cacheMock = new Mock<IRedisCacheService>();
        cacheMock.Setup(c => c.GetAsync<PropertyData>(It.IsAny<string>()))
            .ReturnsAsync(cachedData);

        var svc = BuildService(ctx, cacheMock.Object);

        // Act
        var result = await svc.IngestPropertyDataAsync("BENTON", "CACHED-PARCEL");

        // Assert
        result.Success.Should().BeTrue(
            because: "a valid cache hit must satisfy the ingest step without hitting the DB");
        result.ErrorCode.Should().BeNull();
        result.PropertyData.Should().NotBeNull();
        result.PropertyData!.ParcelId.Should().Be("CACHED-PARCEL");
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 4 — Static boundary: constructor has no IPacsAdapter parameter
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public void NoPacsAdapterDependency_ConstructorHasNoIPacsAdapterParameter()
    {
        // CARD-14B removed IPacsAdapter from the constructor.
        // If IPacsAdapter ever re-enters, this test is the trip-wire.

        var ctors = typeof(PropertyValuationAIEnhancementService).GetConstructors();

        ctors.Should().HaveCount(1,
            because: "the service must have exactly one constructor so the boundary is unambiguous");

        var pacsParam = ctors[0]
            .GetParameters()
            .FirstOrDefault(p =>
                p.ParameterType.Name.Contains("PacsAdapter", StringComparison.OrdinalIgnoreCase));

        pacsParam.Should().BeNull(
            because: "PropertyValuationAIEnhancementService must not accept any IPacsAdapter. " +
                     "PACS terminates at TerraFusionSync; app workflows read canonical only.");
    }

    // ─────────────────────────────────────────────────────────────────
    // Test 5 — Static boundary: type holds no IPacsAdapter field
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public void NoPacsAdapterDependency_TypeHasNoIPacsAdapterField()
    {
        var fields = typeof(PropertyValuationAIEnhancementService)
            .GetFields(BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Public);

        var pacsField = fields.FirstOrDefault(f =>
            f.FieldType.Name.Contains("PacsAdapter", StringComparison.OrdinalIgnoreCase));

        pacsField.Should().BeNull(
            because: "no backing field of IPacsAdapter type must exist in the service. " +
                     "If this fails, a PACS trapdoor has been re-introduced.");
    }
}
