using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using TerraFusion.AI.Services;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using PropertyValuationRequest = TerraFusion.Core.DTOs.PropertyValuationRequest;
using Xunit;
using Xunit.Abstractions;

namespace TerraFusion.AI.Tests
{
    public class IntegrationTests : IDisposable
    {
        private readonly ITestOutputHelper _output;
        private readonly IServiceProvider _serviceProvider;
        private readonly IHost _host;

        public IntegrationTests(ITestOutputHelper output)
        {
            _output = output;

            _host = Host.CreateDefaultBuilder()
                .ConfigureServices(services =>
                {
                    services.AddLogging(builder => builder.AddConsole());
                    services.AddScoped<IPropertyValuationService, PropertyValuationService>();
                    services.AddScoped<IMLModelService, MLModelService>();
                    services.AddScoped<AIEngineService>();
                    // Register for interface access in tests using fully qualified name to resolve ambiguity
                    services.AddScoped<TerraFusion.Core.Interfaces.IAIEngineService>(provider => (TerraFusion.Core.Interfaces.IAIEngineService)provider.GetService<AIEngineService>()!);
                })
                .Build();

            _serviceProvider = _host.Services;
        }

        [Fact]
        public async Task PropertyValuation_EndToEnd_Integration_Test()
        {
            // Arrange
            var valuationService = _serviceProvider.GetRequiredService<IPropertyValuationService>();
            var request = new PropertyValuationRequest
            {
                PropertyId = "TEST-001",
                Location = "Seattle, WA",
                SquareFootage = 2500m,
                Bedrooms = 4,
                Bathrooms = 2.5m,
                YearBuilt = 2015,
                PropertyType = "Single Family",
                ValuationType = "Market Value"
            };

            // Act
            var result = await valuationService.AnalyzePropertyAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("TEST-001", result.PropertyId);
            Assert.True(result.EstimatedValue > 0);
            Assert.True(result.ConfidenceScore > 0.8m);
            Assert.NotEmpty(result.ComparableProperties);
            Assert.NotEmpty(result.MarketFactors);

            _output.WriteLine($"Property {result.PropertyId} valued at ${result.EstimatedValue:N0} with {result.ConfidenceScore:P} confidence");
        }

        [Fact]
        public async Task CostPrediction_EndToEnd_Integration_Test()
        {
            // Arrange
            var valuationService = _serviceProvider.GetRequiredService<IPropertyValuationService>();
            var request = new CostPredictionRequest
            {
                ProjectId = "PROJECT-001",
                ProjectType = "New Construction",
                Location = "Portland, OR",
                SquareFootage = 3000m
            };

            // Act
            var result = await valuationService.PredictCostsAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.TotalCost > 0);
            Assert.True(result.ConfidenceScore > 0.8m);
            Assert.NotEmpty(result.CostBreakdown);
            Assert.NotEmpty(result.FactorsConsidered);
            Assert.True(result.PredictionRange.Low < result.TotalCost);
            Assert.True(result.PredictionRange.High > result.TotalCost);

            _output.WriteLine($"Project cost predicted at ${result.TotalCost:N0} with {result.ConfidenceScore:P} confidence");
        }

        [Fact]
        public async Task MLModel_ROI_Prediction_Integration_Test()
        {
            // Arrange
            var mlService = _serviceProvider.GetRequiredService<IMLModelService>();
            var request = new ROIPredictionRequest
            {
                PropertyId = "ROI-TEST-001",
                InvestmentAmount = 500000m,
                TimeHorizon = "24 months",
                Region = "Seattle Metro"
            };

            // Act
            var result = await mlService.PredictROIAsync(request);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.PredictedROI > 0);
            Assert.True(result.ModelAccuracy > 0.9m);
            Assert.NotEmpty(result.RiskFactors);
            Assert.True(result.ConfidenceInterval.Low < result.PredictedROI);
            Assert.True(result.ConfidenceInterval.High > result.PredictedROI);

            _output.WriteLine($"ROI predicted at {result.PredictedROI:P} with {result.ModelAccuracy:P} model accuracy");
        }

        [Fact]
        public async Task AIEngine_Market_Analysis_Integration_Test()
        {
            // Arrange
            var aiEngine = _serviceProvider.GetRequiredService<TerraFusion.Core.Interfaces.IAIEngineService>();

            // Act
            var result = await aiEngine.ExecuteModelAsync("market_trends", new { region = "Bellevue, WA" });

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Success);
            Assert.NotNull(result.Result);

            // Cast result to expected type for property access
            dynamic marketData = result.Result;

            _output.WriteLine($"Market analysis completed successfully in {result.ExecutionTime.TotalMilliseconds}ms");
        }

        [Fact]
        public async Task Module_Interoperability_Integration_Test()
        {
            // Arrange
            var valuationService = _serviceProvider.GetRequiredService<IPropertyValuationService>();
            var mlService = _serviceProvider.GetRequiredService<IMLModelService>();
            var aiEngine = _serviceProvider.GetRequiredService<TerraFusion.Core.Interfaces.IAIEngineService>();

            var propertyRequest = new PropertyValuationRequest
            {
                PropertyId = "INTEROP-001",
                Location = "Spokane, WA",
                SquareFootage = 2200m,
                PropertyType = "Condo"
            };

            // Act - Test service interoperability
            var valuationResult = await valuationService.AnalyzePropertyAsync(propertyRequest);

            var roiRequest = new ROIPredictionRequest
            {
                PropertyId = valuationResult.PropertyId,
                InvestmentAmount = valuationResult.EstimatedValue,
                Region = "Spokane Metro"
            };
            var roiResult = await mlService.PredictROIAsync(roiRequest);

            var marketResult = await aiEngine.ExecuteModelAsync("MarketTrends", new { Location = "Spokane, WA" });

            // Assert - Verify all services work together
            Assert.NotNull(valuationResult);
            Assert.NotNull(roiResult);
            Assert.NotNull(marketResult);

            Assert.Equal(propertyRequest.PropertyId, valuationResult.PropertyId);
            Assert.True(marketResult.Success);

            _output.WriteLine($"Interoperability test: Property ${valuationResult.EstimatedValue:N0}, ROI {roiResult.PredictedROI:P}, Market AI Result Success: {marketResult.Success}");
        }

        [Fact]
        public async Task Performance_Benchmark_Test()
        {
            // Arrange
            var valuationService = _serviceProvider.GetRequiredService<IPropertyValuationService>();
            var startTime = DateTime.UtcNow;
            const int testIterations = 10;

            // Act - Run multiple valuations to test performance
            for (int i = 0; i < testIterations; i++)
            {
                var request = new PropertyValuationRequest
                {
                    PropertyId = $"PERF-{i:D3}",
                    Location = "Test Location",
                    SquareFootage = 2000m + (i * 100),
                    PropertyType = "Test"
                };

                var result = await valuationService.AnalyzePropertyAsync(request);
                Assert.NotNull(result);
            }

            var endTime = DateTime.UtcNow;
            var totalTime = endTime - startTime;
            var averageTime = totalTime.TotalMilliseconds / testIterations;

            // Assert - Verify performance meets requirements (under 5 seconds average)
            Assert.True(averageTime < 5000, $"Average response time {averageTime}ms exceeds 5000ms threshold");

            _output.WriteLine($"Performance test: {testIterations} valuations in {totalTime.TotalMilliseconds}ms (avg: {averageTime:F1}ms)");
        }

        public void Dispose()
        {
            _host?.Dispose();
        }
    }
}
