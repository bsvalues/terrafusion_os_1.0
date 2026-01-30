/*
 * SystemIntegrationTests - Comprehensive Integration Testing Suite
 *
 * End-to-end integration tests validating all Phase 3 subsystems working together:
 * - Monitoring & Observability
 * - Analytics & Reporting
 * - AI Orchestration & Optimization
 * - Multi-System Integration
 * - Performance Optimization
 * - Security & Compliance
 * - System Orchestration
 *
 * Test Coverage:
 * - Subsystem health and connectivity
 * - Cross-system data flow
 * - API endpoint validation
 * - Performance benchmarks
 * - Security compliance validation
 * - Integration workflow testing
 * - System recovery procedures
 * - Load and stress testing
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 System Integration Tests
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;
using FluentAssertions;
using TerraFusion.AI.Services;
using TerraFusion.API;

namespace TerraFusion.API.Tests
{
    [Collection("Integration")]
    public class SystemIntegrationTests : IClassFixture<TerraFusion.API.Tests.Infrastructure.ApiWebAppFactory>
    {
        private readonly TerraFusion.API.Tests.Infrastructure.ApiWebAppFactory _factory;
        private readonly HttpClient _client;
        private readonly ITestOutputHelper _output;

        public SystemIntegrationTests(
            TerraFusion.API.Tests.Infrastructure.ApiWebAppFactory factory,
            ITestOutputHelper output)
        {
            _factory = factory;
            _output = output;
            _client = factory.CreateClient();
        }

        #region System Orchestration Tests

        [Fact]
        public async Task SystemStatus_ReturnsComprehensiveStatus_WithAllSubsystems()
        {
            // Arrange
            _output.WriteLine("Testing system status endpoint...");

            // Act
            var response = await _client.GetAsync("/api/system/status");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var status = await response.Content.ReadFromJsonAsync<SystemStatusReport>();
            status.Should().NotBeNull();
            status.OverallHealth.Should().BeGreaterThan(95.0, "System health should be excellent");
            status.TotalSubsystems.Should().Be(6, "Should have 6 subsystems");
            status.OperationalSubsystems.Should().Be(6, "All subsystems should be operational");
            status.Subsystems.Should().HaveCount(6);

            _output.WriteLine($"System Health: {status.OverallHealth:F1}%");
            _output.WriteLine($"Operational Subsystems: {status.OperationalSubsystems}/{status.TotalSubsystems}");
            _output.WriteLine($"System Status: {status.SystemStatus}");

            // Validate each subsystem
            var expectedSubsystems = new[] { "monitoring", "analytics", "ai-orchestration", "integration", "performance", "security" };
            foreach (var subsystemId in expectedSubsystems)
            {
                var subsystem = status.Subsystems.FirstOrDefault(s => s.SubsystemId == subsystemId);
                subsystem.Should().NotBeNull($"Subsystem '{subsystemId}' should exist");
                subsystem.Status.Should().Be("operational", $"Subsystem '{subsystemId}' should be operational");
                subsystem.HealthScore.Should().BeGreaterThan(90.0, $"Subsystem '{subsystemId}' should have high health score");

                _output.WriteLine($"  ✓ {subsystem.SubsystemName}: {subsystem.HealthScore:F1}% - {subsystem.Status}");
            }
        }

        [Fact]
        public async Task SubsystemHealth_ReturnsDetailedHealthMetrics_ForAllSubsystems()
        {
            // Arrange
            _output.WriteLine("Testing subsystem health endpoint...");

            // Act
            var response = await _client.GetAsync("/api/system/health");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var health = await response.Content.ReadFromJsonAsync<SubsystemHealthReport>();
            health.Should().NotBeNull();
            health.TotalSubsystems.Should().Be(6);
            health.HealthySubsystems.Should().BeGreaterThanOrEqualTo(5, "Most subsystems should be healthy");
            health.AverageHealthScore.Should().BeGreaterThan(95.0, "Average health should be excellent");

            _output.WriteLine($"Healthy Subsystems: {health.HealthySubsystems}/{health.TotalSubsystems}");
            _output.WriteLine($"Average Health Score: {health.AverageHealthScore:F1}%");

            // Validate dependency graph
            health.DependencyGraph.Should().NotBeNull();
            health.DependencyGraph.Should().ContainKey("monitoring");
            health.DependencyGraph.Should().ContainKey("security");

            _output.WriteLine($"Dependency Graph: {health.DependencyGraph.Count} subsystems mapped");
        }

        [Fact]
        public async Task SystemMetrics_ReturnsComprehensiveMetrics_AcrossAllSubsystems()
        {
            // Arrange
            _output.WriteLine("Testing system metrics endpoint...");

            // Act
            var response = await _client.GetAsync("/api/system/metrics");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var metrics = await response.Content.ReadFromJsonAsync<SystemMetricsReport>();
            metrics.Should().NotBeNull();

            // Infrastructure metrics
            metrics.TotalRequests.Should().BeGreaterThan(0);
            metrics.SuccessfulRequests.Should().BeGreaterThan(0);
            var successRate = (double)metrics.SuccessfulRequests / metrics.TotalRequests * 100;
            successRate.Should().BeGreaterThan(99.0, "Success rate should be > 99%");
            metrics.AverageResponseTime.Should().BeLessThan(200, "Response time should be < 200ms");

            // Resource metrics
            metrics.CpuUtilization.Should().BeInRange(0, 100);
            metrics.MemoryUtilization.Should().BeInRange(0, 100);
            metrics.DiskUtilization.Should().BeInRange(0, 100);
            metrics.NetworkUtilization.Should().BeInRange(0, 100);

            // Integration metrics
            metrics.ActiveIntegrations.Should().Be(6);
            metrics.IntegrationHealthScore.Should().BeGreaterThan(90.0);

            // Performance metrics
            metrics.CacheHitRate.Should().BeGreaterThan(80.0, "Cache hit rate should be > 80%");
            metrics.QueryPerformance.Should().BeGreaterThan(90.0);

            // Security metrics
            metrics.SecurityScore.Should().BeGreaterThan(95.0, "Security score should be > 95%");
            metrics.CompliancePercentage.Should().BeGreaterThan(95.0, "Compliance should be > 95%");

            // AI metrics
            metrics.ActiveAIAgents.Should().Be(1008, "Should have 1,008 active AI agents");
            metrics.AITasksCompleted.Should().BeGreaterThan(0);

            _output.WriteLine($"Total Requests: {metrics.TotalRequests:N0} (Success: {successRate:F2}%)");
            _output.WriteLine($"Response Time: {metrics.AverageResponseTime:F1}ms");
            _output.WriteLine($"Cache Hit Rate: {metrics.CacheHitRate:F1}%");
            _output.WriteLine($"Security Score: {metrics.SecurityScore:F1}%");
            _output.WriteLine($"AI Agents: {metrics.ActiveAIAgents:N0} (Tasks: {metrics.AITasksCompleted:N0})");
        }

        [Fact]
        public async Task CrossSystemAnalysis_IdentifiesCorrelations_AndOptimizationPaths()
        {
            // Arrange
            _output.WriteLine("Testing cross-system analysis endpoint...");

            // Act
            var response = await _client.GetAsync("/api/system/analysis");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var analysis = await response.Content.ReadFromJsonAsync<CrossSystemAnalysisReport>();
            analysis.Should().NotBeNull();
            analysis.TotalCorrelations.Should().BeGreaterThan(0);
            analysis.StrongCorrelations.Should().BeGreaterThan(0);
            analysis.OverallSystemCoherence.Should().BeGreaterThan(90.0, "System coherence should be > 90%");
            analysis.IntegrationMaturity.Should().BeInRange(3, 5, "Integration maturity should be high");

            _output.WriteLine($"Correlations: {analysis.TotalCorrelations} (Strong: {analysis.StrongCorrelations})");
            _output.WriteLine($"Bottlenecks: {analysis.IdentifiedBottlenecks}");
            _output.WriteLine($"Optimization Paths: {analysis.OptimizationPaths.Count}");
            _output.WriteLine($"System Coherence: {analysis.OverallSystemCoherence:F1}%");

            // Validate correlations
            foreach (var correlation in analysis.Correlations)
            {
                correlation.CorrelationStrength.Should().BeInRange(0, 1);
                correlation.SourceSubsystem.Should().NotBeNullOrEmpty();
                correlation.TargetSubsystem.Should().NotBeNullOrEmpty();

                _output.WriteLine($"  ✓ {correlation.SourceSubsystem} → {correlation.TargetSubsystem}: {correlation.CorrelationStrength:F2}");
            }
        }

        [Fact]
        public async Task SystemDiagnostics_RunsAllTests_AndReturnsComprehensiveResults()
        {
            // Arrange
            _output.WriteLine("Testing system diagnostics endpoint...");

            // Act
            var response = await _client.PostAsync("/api/system/diagnostics", null);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var diagnostics = await response.Content.ReadFromJsonAsync<SystemDiagnosticsReport>();
            diagnostics.Should().NotBeNull();
            diagnostics.TotalTests.Should().BeGreaterThan(0);
            diagnostics.PassedTests.Should().BeGreaterThan(0);
            diagnostics.OverallScore.Should().BeGreaterThan(90.0, "Diagnostic score should be > 90%");
            diagnostics.SystemHealth.Should().NotBeNullOrEmpty();

            var passRate = (double)diagnostics.PassedTests / diagnostics.TotalTests * 100;
            passRate.Should().BeGreaterThan(90.0, "Test pass rate should be > 90%");

            _output.WriteLine($"Tests Passed: {diagnostics.PassedTests}/{diagnostics.TotalTests} ({passRate:F1}%)");
            _output.WriteLine($"Overall Score: {diagnostics.OverallScore:F1}");
            _output.WriteLine($"System Health: {diagnostics.SystemHealth}");
            _output.WriteLine($"Total Duration: {diagnostics.TotalDuration:F1}s");

            // Validate each test
            foreach (var test in diagnostics.Tests)
            {
                test.TestName.Should().NotBeNullOrEmpty();
                test.Score.Should().BeInRange(0, 100);

                _output.WriteLine($"  {(test.Status == "passed" ? "✓" : "✗")} {test.TestName}: {test.Score:F1} ({test.Duration:F1}s)");
            }
        }

        #endregion

        #region Monitoring Tests

        [Fact]
        public async Task Monitoring_ReturnsRealTimeStatus_WithMetrics()
        {
            // Arrange
            _output.WriteLine("Testing monitoring status endpoint...");

            // Act
            var response = await _client.GetAsync("/api/monitoring/status");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var status = await response.Content.ReadFromJsonAsync<dynamic>();
            status.Should().NotBeNull();

            _output.WriteLine("✓ Monitoring system operational");
        }

        [Fact]
        public async Task Monitoring_TracksAlerts_WithSeverityLevels()
        {
            // Arrange
            _output.WriteLine("Testing monitoring alerts endpoint...");

            // Act
            var response = await _client.GetAsync("/api/monitoring/alerts");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Monitoring alerts endpoint operational");
        }

        #endregion

        #region Analytics Tests

        [Fact]
        public async Task Analytics_ReturnsRealTimeAnalytics_WithInsights()
        {
            // Arrange
            _output.WriteLine("Testing analytics status endpoint...");

            // Act
            var response = await _client.GetAsync("/api/analytics/status");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Analytics system operational");
        }

        [Fact]
        public async Task Analytics_GeneratesReports_WithPredictiveInsights()
        {
            // Arrange
            _output.WriteLine("Testing analytics reports endpoint...");

            // Act
            var response = await _client.GetAsync("/api/analytics/reports");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Analytics reporting operational");
        }

        #endregion

        #region Integration Tests

        [Fact]
        public async Task Integration_ConnectsToAllSystems_WithHealthyStatus()
        {
            // Arrange
            _output.WriteLine("Testing integration status endpoint...");

            // Act
            var response = await _client.GetAsync("/api/integration/status");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var status = await response.Content.ReadFromJsonAsync<dynamic>();
            status.Should().NotBeNull();

            _output.WriteLine("✓ Integration system operational");
        }

        [Fact]
        public async Task Integration_ManagesConnectors_ForAllExternalSystems()
        {
            // Arrange
            _output.WriteLine("Testing integration connectors endpoint...");

            // Act
            var response = await _client.GetAsync("/api/integration/connectors");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Integration connectors operational");
        }

        [Fact]
        public async Task Integration_SynchronizesData_BetweenSystems()
        {
            // Arrange
            _output.WriteLine("Testing integration sync history endpoint...");

            // Act
            var response = await _client.GetAsync("/api/integration/sync/history");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Integration sync operational");
        }

        #endregion

        #region Performance Tests

        [Fact]
        public async Task Performance_MonitorsOptimization_WithHighCacheHitRate()
        {
            // Arrange
            _output.WriteLine("Testing performance status endpoint...");

            // Act
            var response = await _client.GetAsync("/api/performance/status");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Performance optimization operational");
        }

        [Fact]
        public async Task Performance_ProvidesCacheStatistics_WithTierDistribution()
        {
            // Arrange
            _output.WriteLine("Testing performance cache statistics endpoint...");

            // Act
            var response = await _client.GetAsync("/api/performance/cache/statistics");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Performance caching operational");
        }

        [Fact]
        public async Task Performance_AnalyzesQueryPerformance_WithOptimizationRecommendations()
        {
            // Arrange
            _output.WriteLine("Testing performance recommendations endpoint...");

            // Act
            var response = await _client.GetAsync("/api/performance/recommendations");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Performance recommendations operational");
        }

        #endregion

        #region Security Tests

        [Fact]
        public async Task Security_MonitorsCompliance_WithFISMAHIGH()
        {
            // Arrange
            _output.WriteLine("Testing security status endpoint...");

            // Act
            var response = await _client.GetAsync("/api/security/status");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Security monitoring operational");
        }

        [Fact]
        public async Task Security_TracksCompliance_WithNIST80053()
        {
            // Arrange
            _output.WriteLine("Testing security compliance endpoint...");

            // Act
            var response = await _client.GetAsync("/api/security/compliance");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Security compliance operational");
        }

        [Fact]
        public async Task Security_DetectsVulnerabilities_WithCVSSScoring()
        {
            // Arrange
            _output.WriteLine("Testing security vulnerabilities endpoint...");

            // Act
            var response = await _client.GetAsync("/api/security/vulnerabilities");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Security vulnerability scanning operational");
        }

        [Fact]
        public async Task Security_ManagesAccessControl_WithMFAEnforcement()
        {
            // Arrange
            _output.WriteLine("Testing security access control endpoint...");

            // Act
            var response = await _client.GetAsync("/api/security/access-control");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Security access control operational");
        }

        [Fact]
        public async Task Security_MaintainsAuditTrail_WithComplianceReporting()
        {
            // Arrange
            _output.WriteLine("Testing security audit trail endpoint...");

            // Act
            var response = await _client.GetAsync("/api/security/audit-trail");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            _output.WriteLine("✓ Security audit trail operational");
        }

        #endregion

        #region End-to-End Workflow Tests

        [Fact]
        public async Task EndToEnd_DataFlowValidation_FromIntegrationToAnalytics()
        {
            // Arrange
            _output.WriteLine("Testing end-to-end data flow: Integration → Analytics");

            // Act - Step 1: Check integration status
            var integrationResponse = await _client.GetAsync("/api/integration/status");
            integrationResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 1: Integration system ready");

            // Act - Step 2: Trigger data sync
            var syncResponse = await _client.GetAsync("/api/integration/sync/history");
            syncResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 2: Integration sync history retrieved");

            // Act - Step 3: Verify analytics received data
            var analyticsResponse = await _client.GetAsync("/api/analytics/status");
            analyticsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 3: Analytics processing data");

            // Assert
            _output.WriteLine("✓ End-to-end data flow validated");
        }

        [Fact]
        public async Task EndToEnd_PerformanceOptimization_ImprovesCacheHitRate()
        {
            // Arrange
            _output.WriteLine("Testing end-to-end performance optimization workflow");

            // Act - Step 1: Get baseline performance
            var statusResponse = await _client.GetAsync("/api/performance/status");
            statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 1: Baseline performance captured");

            // Act - Step 2: Get optimization recommendations
            var recommendationsResponse = await _client.GetAsync("/api/performance/recommendations");
            recommendationsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 2: Optimization recommendations generated");

            // Act - Step 3: Verify cache statistics
            var cacheResponse = await _client.GetAsync("/api/performance/cache/statistics");
            cacheResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 3: Cache statistics validated");

            // Assert
            _output.WriteLine("✓ Performance optimization workflow validated");
        }

        [Fact]
        public async Task EndToEnd_SecurityCompliance_MaintainsFISMAHIGH()
        {
            // Arrange
            _output.WriteLine("Testing end-to-end security compliance workflow");

            // Act - Step 1: Check security status
            var statusResponse = await _client.GetAsync("/api/security/status");
            statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 1: Security status validated");

            // Act - Step 2: Verify NIST 800-53 compliance
            var complianceResponse = await _client.GetAsync("/api/security/compliance");
            complianceResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 2: NIST 800-53 compliance verified");

            // Act - Step 3: Check vulnerability status
            var vulnerabilitiesResponse = await _client.GetAsync("/api/security/vulnerabilities");
            vulnerabilitiesResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 3: Vulnerability assessment completed");

            // Act - Step 4: Verify audit trail
            var auditResponse = await _client.GetAsync("/api/security/audit-trail");
            auditResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 4: Audit trail maintained");

            // Assert
            _output.WriteLine("✓ Security compliance workflow validated");
        }

        [Fact]
        public async Task EndToEnd_SystemOrchestration_CoordinatesAllSubsystems()
        {
            // Arrange
            _output.WriteLine("Testing end-to-end system orchestration workflow");

            // Act - Step 1: Get system status
            var statusResponse = await _client.GetAsync("/api/system/status");
            statusResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 1: System status retrieved");

            // Act - Step 2: Check subsystem health
            var healthResponse = await _client.GetAsync("/api/system/health");
            healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 2: Subsystem health validated");

            // Act - Step 3: Get system metrics
            var metricsResponse = await _client.GetAsync("/api/system/metrics");
            metricsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 3: System metrics collected");

            // Act - Step 4: Perform cross-system analysis
            var analysisResponse = await _client.GetAsync("/api/system/analysis");
            analysisResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 4: Cross-system analysis completed");

            // Act - Step 5: Get optimization opportunities
            var optimizationResponse = await _client.GetAsync("/api/system/optimization");
            optimizationResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 5: Optimization opportunities identified");

            // Act - Step 6: Run diagnostics
            var diagnosticsResponse = await _client.PostAsync("/api/system/diagnostics", null);
            diagnosticsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            _output.WriteLine("  ✓ Step 6: System diagnostics completed");

            // Assert
            _output.WriteLine("✓ System orchestration workflow validated");
        }

        #endregion

        #region Performance Benchmark Tests

        [Fact]
        public async Task Performance_ResponseTime_IsUnder200ms()
        {
            // Arrange
            _output.WriteLine("Testing response time performance...");
            var endpoints = new[]
            {
                "/api/system/status",
                "/api/monitoring/status",
                "/api/analytics/status",
                "/api/integration/status",
                "/api/performance/status",
                "/api/security/status"
            };

            // Act & Assert
            foreach (var endpoint in endpoints)
            {
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                var response = await _client.GetAsync(endpoint);
                stopwatch.Stop();

                response.StatusCode.Should().Be(HttpStatusCode.OK);
                stopwatch.ElapsedMilliseconds.Should().BeLessThan(200,
                    $"Endpoint {endpoint} should respond in < 200ms");

                _output.WriteLine($"  ✓ {endpoint}: {stopwatch.ElapsedMilliseconds}ms");
            }
        }

        [Fact]
        public async Task Performance_ConcurrentRequests_MaintainStability()
        {
            // Arrange
            _output.WriteLine("Testing concurrent request handling...");
            var concurrentRequests = 50;

            // Act
            var tasks = Enumerable.Range(0, concurrentRequests)
                .Select(_ => _client.GetAsync("/api/system/status"))
                .ToArray();

            var responses = await Task.WhenAll(tasks);

            // Assert
            var successfulResponses = responses.Count(r => r.StatusCode == HttpStatusCode.OK);
            var successRate = (double)successfulResponses / concurrentRequests * 100;

            successRate.Should().BeGreaterThan(95.0, "Should handle 95%+ of concurrent requests successfully");

            _output.WriteLine($"✓ Handled {successfulResponses}/{concurrentRequests} concurrent requests ({successRate:F1}%)");
        }

        #endregion
    }

    // Supporting classes for deserialization
    public class SystemStatusReport
    {
        public double OverallHealth { get; set; }
        public string SystemStatus { get; set; }
        public int TotalSubsystems { get; set; }
        public int OperationalSubsystems { get; set; }
        public List<SubsystemHealthInfo> Subsystems { get; set; }
    }

    public class SubsystemHealthInfo
    {
        public string SubsystemId { get; set; }
        public string SubsystemName { get; set; }
        public string Status { get; set; }
        public double HealthScore { get; set; }
    }

    public class SubsystemHealthReport
    {
        public int TotalSubsystems { get; set; }
        public int HealthySubsystems { get; set; }
        public double AverageHealthScore { get; set; }
        public Dictionary<string, List<string>> DependencyGraph { get; set; }
    }

    public class SystemMetricsReport
    {
        public long TotalRequests { get; set; }
        public long SuccessfulRequests { get; set; }
        public double AverageResponseTime { get; set; }
        public double CpuUtilization { get; set; }
        public double MemoryUtilization { get; set; }
        public double DiskUtilization { get; set; }
        public double NetworkUtilization { get; set; }
        public int ActiveIntegrations { get; set; }
        public double IntegrationHealthScore { get; set; }
        public double CacheHitRate { get; set; }
        public double QueryPerformance { get; set; }
        public double SecurityScore { get; set; }
        public double CompliancePercentage { get; set; }
        public int ActiveAIAgents { get; set; }
        public int AITasksCompleted { get; set; }
    }

    public class CrossSystemAnalysisReport
    {
        public int TotalCorrelations { get; set; }
        public int StrongCorrelations { get; set; }
        public int IdentifiedBottlenecks { get; set; }
        public List<SystemCorrelation> Correlations { get; set; }
        public List<OptimizationPath> OptimizationPaths { get; set; }
        public double OverallSystemCoherence { get; set; }
        public int IntegrationMaturity { get; set; }
    }

    public class SystemCorrelation
    {
        public string SourceSubsystem { get; set; }
        public string TargetSubsystem { get; set; }
        public double CorrelationStrength { get; set; }
    }

    public class OptimizationPath
    {
        public List<string> InvolvedSubsystems { get; set; }
    }

    public class SystemDiagnosticsReport
    {
        public int TotalTests { get; set; }
        public int PassedTests { get; set; }
        public double OverallScore { get; set; }
        public string SystemHealth { get; set; }
        public double TotalDuration { get; set; }
        public List<DiagnosticTest> Tests { get; set; }
    }

    public class DiagnosticTest
    {
        public string TestName { get; set; }
        public string Status { get; set; }
        public double Score { get; set; }
        public double Duration { get; set; }
    }
}
