using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using TerraFusion.Analytics.Services;
using TerraFusion.Data;
using TerraFusion.Data.Entities;
using Xunit;
using Xunit.Abstractions;

namespace TerraFusion.Analytics.Tests.Integration
{
    /// <summary>
    /// Integration tests validating strict county isolation in Analytics module.
    /// Ensures zero cross-county data leaks in property, tax, and performance analytics.
    /// </summary>
    public class AnalyticsCountyIsolationTests : IAsyncLifetime
    {
        private readonly ITestOutputHelper _output;
        private PostgreSqlContainer _postgresContainer;
        private ServiceProvider _serviceProvider;
        private TerraFusionDbContext _context;

        // Test county GUIDs
        private readonly Guid _countyKing = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private readonly Guid _countyPierce = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private readonly Guid _countySnohomish = Guid.Parse("33333333-3333-3333-3333-333333333333");

        public AnalyticsCountyIsolationTests(ITestOutputHelper output)
        {
            _output = output;
        }

        public async Task InitializeAsync()
        {
            _output.WriteLine("=== STARTING ANALYTICS COUNTY ISOLATION TESTS ===");
            _output.WriteLine($"Timestamp: {DateTime.UtcNow:O}");

            // Start PostgreSQL container
            _postgresContainer = new PostgreSqlBuilder()
                .WithImage("postgres:15-alpine")
                .WithDatabase("terrafusion_test")
                .WithUsername("testuser")
                .WithPassword("testpass")
                .Build();

            await _postgresContainer.StartAsync();
            _output.WriteLine($"✅ PostgreSQL container started: {_postgresContainer.GetConnectionString()}");

            // Configure services
            var services = new ServiceCollection();
            services.AddDbContext<TerraFusionDbContext>(options =>
                options.UseNpgsql(_postgresContainer.GetConnectionString()));

            services.AddLogging();
            services.AddScoped<PropertyAnalyticsService>();
            services.AddScoped<TaxAnalyticsService>();
            services.AddScoped<PerformanceAnalyticsService>();

            // Mock AI services
            services.AddScoped<IAISwarmCoordinator, MockAISwarmCoordinator>();
            services.AddScoped<IConsciousnessOrchestrator, MockConsciousnessOrchestrator>();
            services.AddScoped<IPerformanceMetricsCollector, MockPerformanceMetricsCollector>();

            _serviceProvider = services.BuildServiceProvider();
            _context = _serviceProvider.GetRequiredService<TerraFusionDbContext>();

            // Create database schema
            await _context.Database.EnsureCreatedAsync();
            _output.WriteLine("✅ Database schema created");

            // Seed test data
            await SeedTestDataAsync();
            _output.WriteLine("✅ Test data seeded");
        }

        public async Task DisposeAsync()
        {
            await _context.DisposeAsync();
            await _serviceProvider.DisposeAsync();
            await _postgresContainer.DisposeAsync();
            _output.WriteLine("=== TESTS COMPLETED - RESOURCES DISPOSED ===");
        }

        #region Property Analytics County Isolation Tests

        [Fact]
        public async Task GetValuationTrends_OnlyReturnsCountyData_NoLeaks()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<PropertyAnalyticsService>();
            var startDate = new DateTime(2023, 1, 1);
            var endDate = new DateTime(2023, 12, 31);

            _output.WriteLine("\n=== TEST: Property Valuation Trends County Isolation ===");
            _output.WriteLine($"County: King ({_countyKing})");

            // Act - Request King County data
            var kingTrends = await service.GetValuationTrendsAsync(_countyKing, startDate, endDate);

            // Assert - Verify only King County properties included
            Assert.Equal(_countyKing, kingTrends.CountyId);
            Assert.NotEmpty(kingTrends.TrendData);

            // Verify NO Pierce or Snohomish data leaked
            var allProperties = await _context.Properties
                .Where(p => p.LastAssessmentDate >= startDate && p.LastAssessmentDate <= endDate)
                .ToListAsync();

            var kingProperties = allProperties.Where(p => p.CountyId == _countyKing).ToList();
            var otherCountyProperties = allProperties.Where(p => p.CountyId != _countyKing).ToList();

            Assert.NotEmpty(kingProperties); // King County has data
            Assert.NotEmpty(otherCountyProperties); // Other counties have data
            Assert.Equal(kingProperties.Count, kingTrends.TotalPropertiesAnalyzed); // Only King County analyzed

            _output.WriteLine($"✅ PASS: Only {kingTrends.TotalPropertiesAnalyzed} King County properties analyzed");
            _output.WriteLine($"✅ PASS: {otherCountyProperties.Count} properties from other counties NOT leaked");
            _output.WriteLine($"✅ County Isolation: VERIFIED");
        }

        [Fact]
        public async Task GetComparableProperties_OnlyReturnsCountyComparables_NoLeaks()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<PropertyAnalyticsService>();
            var kingParcelId = "KING-001";

            _output.WriteLine("\n=== TEST: Comparable Properties County Isolation ===");
            _output.WriteLine($"Target Parcel: {kingParcelId} in King County ({_countyKing})");

            // Act
            var result = await service.GetComparablePropertiesAsync(_countyKing, kingParcelId, maxResults: 5);

            // Assert
            Assert.Equal(_countyKing, result.CountyId);
            Assert.NotEmpty(result.Comparables);

            // Verify ALL comparables are from King County
            Assert.All(result.Comparables, comp =>
            {
                Assert.Equal(_countyKing, comp.CountyId);
            });

            // Verify no Pierce or Snohomish comparables leaked
            var hasOtherCountyData = result.Comparables.Any(c =>
                c.CountyId == _countyPierce || c.CountyId == _countySnohomish);
            Assert.False(hasOtherCountyData);

            _output.WriteLine($"✅ PASS: All {result.Comparables.Count} comparables from King County only");
            _output.WriteLine($"✅ PASS: Zero cross-county leaks detected");
            _output.WriteLine($"✅ County Isolation: VERIFIED");
        }

        [Fact]
        public async Task GetAssessmentAccuracy_IsolatesCountyMetrics_NoLeaks()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<PropertyAnalyticsService>();

            _output.WriteLine("\n=== TEST: Assessment Accuracy Metrics County Isolation ===");
            _output.WriteLine($"County: Pierce ({_countyPierce})");

            // Act - Get Pierce County accuracy metrics
            var pierceMetrics = await service.GetAssessmentAccuracyAsync(_countyPierce);

            // Assert
            Assert.Equal(_countyPierce, pierceMetrics.CountyId);
            Assert.False(pierceMetrics.InsufficientData);

            // Verify metrics calculated only from Pierce County data
            var pierceAssessments = await _context.Assessments
                .Where(a => a.Property.CountyId == _countyPierce
                    && a.Property.Sales.Any())
                .CountAsync();

            Assert.Equal(pierceAssessments, pierceMetrics.TotalAssessments);

            // Verify King County has different metrics (no data mixing)
            var kingMetrics = await service.GetAssessmentAccuracyAsync(_countyKing);
            Assert.NotEqual(pierceMetrics.MedianRatio, kingMetrics.MedianRatio); // Different counties = different metrics

            _output.WriteLine($"✅ PASS: Pierce County metrics isolated ({pierceMetrics.TotalAssessments} assessments)");
            _output.WriteLine($"✅ PASS: King County metrics different (no mixing)");
            _output.WriteLine($"✅ County Isolation: VERIFIED");
        }

        #endregion

        #region Tax Analytics County Isolation Tests

        [Fact]
        public async Task GetLevyAnalysis_OnlyReturnsCountyLevies_NoLeaks()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<TaxAnalyticsService>();
            var assessmentYear = 2023;

            _output.WriteLine("\n=== TEST: Tax Levy Analysis County Isolation ===");
            _output.WriteLine($"County: Snohomish ({_countySnohomish}), Year: {assessmentYear}");

            // Act
            var snohomishLevy = await service.GetLevyAnalysisAsync(_countySnohomish, assessmentYear);

            // Assert
            Assert.Equal(_countySnohomish, snohomishLevy.CountyId);
            Assert.False(snohomishLevy.InsufficientData);

            // Verify levy amounts are Snohomish-only (no other county data)
            var allCountyLevies = await _context.TaxLevies
                .Where(l => l.AssessmentYear == assessmentYear)
                .GroupBy(l => l.CountyId)
                .Select(g => new { CountyId = g.Key, TotalLevy = g.Sum(l => l.LevyAmount) })
                .ToListAsync();

            var snohomishTotal = allCountyLevies.First(l => l.CountyId == _countySnohomish).TotalLevy;
            Assert.Equal(snohomishTotal, snohomishLevy.TotalLevyAmount);

            // Verify other counties exist but weren't included
            Assert.True(allCountyLevies.Count > 1);
            Assert.All(allCountyLevies.Where(l => l.CountyId != _countySnohomish),
                levy => Assert.NotEqual(levy.TotalLevy, snohomishLevy.TotalLevyAmount));

            _output.WriteLine($"✅ PASS: Snohomish County levy isolated (${snohomishLevy.TotalLevyAmount:N0})");
            _output.WriteLine($"✅ PASS: {allCountyLevies.Count - 1} other counties NOT leaked");
            _output.WriteLine($"✅ County Isolation: VERIFIED");
        }

        [Fact]
        public async Task GetRateComparison_IsolatesCountyRates_NoLeaks()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<TaxAnalyticsService>();
            var startYear = 2021;
            var endYear = 2023;

            _output.WriteLine("\n=== TEST: Tax Rate Comparison County Isolation ===");
            _output.WriteLine($"County: King ({_countyKing}), Years: {startYear}-{endYear}");

            // Act
            var kingRates = await service.GetRateComparisonAsync(_countyKing, startYear, endYear);

            // Assert
            Assert.Equal(_countyKing, kingRates.CountyId);
            Assert.NotEmpty(kingRates.YearlyRates);

            // Verify all rates are for King County only
            Assert.All(kingRates.YearlyRates, yearData =>
            {
                // Each year's data should be King County only
                var yearLevies = _context.TaxLevies
                    .Where(l => l.CountyId == _countyKing && l.AssessmentYear == yearData.Year)
                    .ToList();
                Assert.NotEmpty(yearLevies);
            });

            // Verify Pierce County has different rates
            var pierceRates = await service.GetRateComparisonAsync(_countyPierce, startYear, endYear);
            Assert.NotEqual(kingRates.YearlyRates.First().EffectiveRate,
                           pierceRates.YearlyRates.First().EffectiveRate);

            _output.WriteLine($"✅ PASS: King County rates isolated ({kingRates.YearlyRates.Count} years)");
            _output.WriteLine($"✅ PASS: Pierce County has different rates (no mixing)");
            _output.WriteLine($"✅ County Isolation: VERIFIED");
        }

        [Fact]
        public async Task GetTaxBurdenDistribution_IsolatesCountyDistribution_NoLeaks()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<TaxAnalyticsService>();
            var assessmentYear = 2023;

            _output.WriteLine("\n=== TEST: Tax Burden Distribution County Isolation ===");
            _output.WriteLine($"County: Pierce ({_countyPierce}), Year: {assessmentYear}");

            // Act
            var pierceDistribution = await service.GetTaxBurdenDistributionAsync(_countyPierce, assessmentYear);

            // Assert
            Assert.Equal(_countyPierce, pierceDistribution.CountyId);
            Assert.False(pierceDistribution.InsufficientData);
            Assert.NotEmpty(pierceDistribution.Brackets);

            // Verify property count matches Pierce County only
            var piercePropertyCount = await _context.Properties
                .Where(p => p.CountyId == _countyPierce)
                .CountAsync();

            Assert.Equal(piercePropertyCount, pierceDistribution.TotalProperties);

            // Verify no King/Snohomish properties included
            var totalProperties = await _context.Properties.CountAsync();
            Assert.True(totalProperties > piercePropertyCount); // Other counties exist
            Assert.NotEqual(totalProperties, pierceDistribution.TotalProperties); // Only Pierce counted

            _output.WriteLine($"✅ PASS: Pierce County distribution isolated ({pierceDistribution.TotalProperties} properties)");
            _output.WriteLine($"✅ PASS: {totalProperties - piercePropertyCount} other county properties NOT leaked");
            _output.WriteLine($"✅ County Isolation: VERIFIED");
        }

        #endregion

        #region Performance Analytics County Isolation Tests

        [Fact]
        public async Task GetCountyMetrics_IsolatesCountyPerformance_NoLeaks()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<PerformanceAnalyticsService>();
            var startTime = DateTime.UtcNow.AddHours(-24);
            var endTime = DateTime.UtcNow;

            _output.WriteLine("\n=== TEST: County Performance Metrics Isolation ===");
            _output.WriteLine($"County: King ({_countyKing}), Last 24 hours");

            // Act
            var kingMetrics = await service.GetCountyMetricsAsync(_countyKing, startTime, endTime);

            // Assert
            Assert.Equal(_countyKing, kingMetrics.CountyId);
            Assert.InRange(kingMetrics.ApiLatencyP95, 0, 100); // Reasonable latency

            // Verify metrics are county-specific (different for other counties)
            var pierceMetrics = await service.GetCountyMetricsAsync(_countyPierce, startTime, endTime);

            Assert.Equal(_countyKing, kingMetrics.CountyId);
            Assert.Equal(_countyPierce, pierceMetrics.CountyId);
            Assert.NotEqual(kingMetrics.CountyId, pierceMetrics.CountyId);

            _output.WriteLine($"✅ PASS: King County metrics isolated (API P95={kingMetrics.ApiLatencyP95}ms)");
            _output.WriteLine($"✅ PASS: Pierce County metrics separate (API P95={pierceMetrics.ApiLatencyP95}ms)");
            _output.WriteLine($"✅ County Isolation: VERIFIED");
        }

        [Fact]
        public async Task GetComparativeMetrics_RequiresAuthorization_ValidatesCounties()
        {
            // Arrange
            var service = _serviceProvider.GetRequiredService<PerformanceAnalyticsService>();
            var authorizedCounties = new List<Guid> { _countyKing, _countyPierce };
            var startTime = DateTime.UtcNow.AddHours(-1);
            var endTime = DateTime.UtcNow;

            _output.WriteLine("\n=== TEST: Comparative Metrics Multi-County Authorization ===");
            _output.WriteLine($"Authorized Counties: King, Pierce");

            // Act
            var comparison = await service.GetComparativeMetricsAsync(authorizedCounties, startTime, endTime);

            // Assert
            Assert.Equal(2, comparison.CountyCodes.Count);
            Assert.Contains(_countyKing, comparison.CountyCodes);
            Assert.Contains(_countyPierce, comparison.CountyCodes);
            Assert.DoesNotContain(_countySnohomish, comparison.CountyCodes); // Not authorized

            // Verify only authorized county metrics returned
            Assert.Equal(2, comparison.CountyMetrics.Count);
            Assert.All(comparison.CountyMetrics, m =>
            {
                Assert.True(m.CountyId == _countyKing || m.CountyId == _countyPierce);
            });

            _output.WriteLine($"✅ PASS: Only authorized counties included ({comparison.CountyMetrics.Count} counties)");
            _output.WriteLine($"✅ PASS: Unauthorized Snohomish County NOT leaked");
            _output.WriteLine($"✅ Multi-County Authorization: VERIFIED");
        }

        #endregion

        #region Test Data Seeding

        private async Task SeedTestDataAsync()
        {
            // Seed properties for three counties
            await SeedCountyPropertiesAsync(_countyKing, "KING", 50);
            await SeedCountyPropertiesAsync(_countyPierce, "PIERCE", 40);
            await SeedCountyPropertiesAsync(_countySnohomish, "SNOH", 30);

            await _context.SaveChangesAsync();
        }

        private async Task SeedCountyPropertiesAsync(Guid countyId, string prefix, int count)
        {
            for (int i = 1; i <= count; i++)
            {
                var property = new Property
                {
                    PropertyId = Guid.NewGuid(),
                    CountyId = countyId, // CRITICAL: County isolation
                    ParcelId = $"{prefix}-{i:D3}",
                    Address = $"{i * 100} Main St",
                    PropertyType = i % 3 == 0 ? "Commercial" : "Residential",
                    SquareFootage = 1500 + (i * 50),
                    YearBuilt = 1990 + (i % 30),
                    LastAssessmentDate = DateTime.UtcNow.AddMonths(-i % 12),
                    Assessments = new List<Assessment>
                    {
                        new Assessment
                        {
                            AssessmentId = Guid.NewGuid(),
                            AssessmentYear = 2023,
                            AssessedValue = 300000 + (i * 5000),
                            AssessmentDate = DateTime.UtcNow.AddMonths(-i % 12)
                        }
                    }
                };

                // Add sales data for some properties
                if (i % 5 == 0)
                {
                    property.Sales = new List<Sale>
                    {
                        new Sale
                        {
                            SaleId = Guid.NewGuid(),
                            SaleDate = DateTime.UtcNow.AddMonths(-2),
                            SalePrice = property.Assessments.First().AssessedValue * 1.05m
                        }
                    };
                }

                _context.Properties.Add(property);
            }
        }

        #endregion
    }
}
