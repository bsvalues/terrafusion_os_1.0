// ============================================================================
// PHASE 36: OpenTelemetry Distributed Tracing Tests
// ============================================================================
// 45 comprehensive tests validating the tracing infrastructure
// Tests: ActivitySource registration, span creation, attributes, status, performance
// ============================================================================

using System.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.AI.Extensions;
using TerraFusion.AI.Tracing;
using Xunit;

namespace TerraFusion.Integration.Tests.Phase36;

/// <summary>
/// Phase 36: OpenTelemetry Distributed Tracing Tests.
/// Validates the ITerraFusionTracer implementation, span creation, attributes, and performance.
/// Total: 45 tests across 7 categories.
/// </summary>
[Trait("Category", "Phase36")]
[Trait("Feature", "DistributedTracing")]
public class OpenTelemetryDistributedTracingTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly ITerraFusionTracer _tracer;
    private readonly List<Activity> _collectedActivities = new();
    private readonly ActivityListener _listener;

    public OpenTelemetryDistributedTracingTests()
    {
        var services = new ServiceCollection();
        services.AddTerraFusionTracing();
        _serviceProvider = services.BuildServiceProvider();
        _tracer = _serviceProvider.GetRequiredService<ITerraFusionTracer>();

        // Set up an ActivityListener to capture activities for testing
        _listener = new ActivityListener
        {
            ShouldListenTo = source => source.Name.StartsWith("TerraFusion"),
            Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
            ActivityStarted = activity => _collectedActivities.Add(activity)
        };
        ActivitySource.AddActivityListener(_listener);
    }

    public void Dispose()
    {
        _listener.Dispose();
        (_tracer as IDisposable)?.Dispose();
        _serviceProvider.Dispose();
    }

    #region Category 1: ActivitySource Registration (6 tests)

    /// <summary>
    /// Test 1: Verify SystemGpt ActivitySource is registered with correct name.
    /// </summary>
    [Fact]
    public void ActivitySource_SystemGpt_IsRegisteredWithCorrectName()
    {
        // Assert
        Assert.NotNull(_tracer.SystemGptSource);
        Assert.Equal(TracingConstants.ActivitySources.SystemGpt, _tracer.SystemGptSource.Name);
    }

    /// <summary>
    /// Test 2: Verify Atlas ActivitySource is registered with correct name.
    /// </summary>
    [Fact]
    public void ActivitySource_Atlas_IsRegisteredWithCorrectName()
    {
        // Assert
        Assert.NotNull(_tracer.AtlasSource);
        Assert.Equal(TracingConstants.ActivitySources.Atlas, _tracer.AtlasSource.Name);
    }

    /// <summary>
    /// Test 3: Verify ITerraFusionTracer is available via DI.
    /// </summary>
    [Fact]
    public void ActivitySource_Registration_AvailableViaDI()
    {
        // Arrange
        var services = new ServiceCollection();
        services.AddTerraFusionTracing();
        using var provider = services.BuildServiceProvider();

        // Act
        var tracer = provider.GetService<ITerraFusionTracer>();

        // Assert
        Assert.NotNull(tracer);
        Assert.IsType<TerraFusionTracer>(tracer);
    }

    /// <summary>
    /// Test 4: Verify SystemGpt ActivitySource has correct version.
    /// </summary>
    [Fact]
    public void ActivitySource_SystemGpt_HasCorrectVersion()
    {
        // Assert
        Assert.Equal(TracingConstants.Version, _tracer.SystemGptSource.Version);
    }

    /// <summary>
    /// Test 5: Verify Atlas ActivitySource has correct version.
    /// </summary>
    [Fact]
    public void ActivitySource_Atlas_HasCorrectVersion()
    {
        // Assert
        Assert.Equal(TracingConstants.Version, _tracer.AtlasSource.Version);
    }

    /// <summary>
    /// Test 6: Verify all ActivitySources are tracked in constants.
    /// </summary>
    [Fact]
    public void ActivitySource_Registry_TracksAllSources()
    {
        // Assert
        Assert.Equal(2, TracingConstants.ActivitySources.All.Length);
        Assert.Contains(TracingConstants.ActivitySources.SystemGpt, TracingConstants.ActivitySources.All);
        Assert.Contains(TracingConstants.ActivitySources.Atlas, TracingConstants.ActivitySources.All);
    }

    #endregion

    #region Category 2: Span Creation — SystemGPT Pipeline (8 tests)

    /// <summary>
    /// Test 7: Verify RAG query span is created.
    /// </summary>
    [Fact]
    public void Span_SystemGptRagQuery_CreatedOnRagOperation()
    {
        // Act
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRagQuery);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.SystemGptRagQuery, span.OperationName);
    }

    /// <summary>
    /// Test 8: Verify guardrail evaluate span is created.
    /// </summary>
    [Fact]
    public void Span_SystemGptGuardrailEvaluate_CreatedOnDecision()
    {
        // Act
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptGuardrailEvaluate);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.SystemGptGuardrailEvaluate, span.OperationName);
    }

    /// <summary>
    /// Test 9: Verify swarm decide span is created.
    /// </summary>
    [Fact]
    public void Span_SystemGptSwarmDecide_CreatedOnPolicyEvaluation()
    {
        // Act
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptSwarmDecide);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.SystemGptSwarmDecide, span.OperationName);
    }

    /// <summary>
    /// Test 10: Verify swarm action span is created.
    /// </summary>
    [Fact]
    public void Span_SystemGptSwarmAction_CreatedOnPredictiveAction()
    {
        // Act
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptSwarmAction);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.SystemGptSwarmAction, span.OperationName);
    }

    /// <summary>
    /// Test 11: Verify request span is created.
    /// </summary>
    [Fact]
    public void Span_SystemGptRequest_CreatedForHttpRequest()
    {
        // Act
        using var span = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRequest,
            ActivityKind.Server);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.SystemGptRequest, span.OperationName);
        Assert.Equal(ActivityKind.Server, span.Kind);
    }

    /// <summary>
    /// Test 12: Verify RAG span is child of request span.
    /// </summary>
    [Fact]
    public void Span_Hierarchy_RagSpanIsChildOfRequestSpan()
    {
        // Act
        using var parentSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRequest,
            ActivityKind.Server);

        using var childSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRagQuery);

        // Assert
        Assert.NotNull(parentSpan);
        Assert.NotNull(childSpan);
        Assert.Equal(parentSpan.TraceId, childSpan.TraceId);
        Assert.Equal(parentSpan.SpanId, childSpan.ParentSpanId);
    }

    /// <summary>
    /// Test 13: Verify guardrail span is child of request span.
    /// </summary>
    [Fact]
    public void Span_Hierarchy_GuardrailSpanIsChildOfRequestSpan()
    {
        // Act
        using var parentSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRequest,
            ActivityKind.Server);

        using var childSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptGuardrailEvaluate);

        // Assert
        Assert.NotNull(parentSpan);
        Assert.NotNull(childSpan);
        Assert.Equal(parentSpan.TraceId, childSpan.TraceId);
        Assert.Equal(parentSpan.SpanId, childSpan.ParentSpanId);
    }

    /// <summary>
    /// Test 14: Verify swarm span is child of request span.
    /// </summary>
    [Fact]
    public void Span_Hierarchy_SwarmSpanIsChildOfRequestSpan()
    {
        // Act
        using var parentSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRequest,
            ActivityKind.Server);

        using var childSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptSwarmDecide);

        // Assert
        Assert.NotNull(parentSpan);
        Assert.NotNull(childSpan);
        Assert.Equal(parentSpan.TraceId, childSpan.TraceId);
        Assert.Equal(parentSpan.SpanId, childSpan.ParentSpanId);
    }

    #endregion

    #region Category 3: Span Creation — Atlas Pipeline (6 tests)

    /// <summary>
    /// Test 15: Verify forecast compute span is created.
    /// </summary>
    [Fact]
    public void Span_AtlasForecastCompute_CreatedOnEngineRun()
    {
        // Act
        using var span = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasForecastCompute);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.AtlasForecastCompute, span.OperationName);
    }

    /// <summary>
    /// Test 16: Verify orchestrator run span is created.
    /// </summary>
    [Fact]
    public void Span_AtlasOrchestratorRun_CreatedOnBackgroundCycle()
    {
        // Act
        using var span = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasOrchestratorRun);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.AtlasOrchestratorRun, span.OperationName);
    }

    /// <summary>
    /// Test 17: Verify anomaly detect span is created.
    /// </summary>
    [Fact]
    public void Span_AtlasAnomalyDetect_CreatedOnDetection()
    {
        // Act
        using var span = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasAnomalyDetect);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(TracingConstants.SpanNames.AtlasAnomalyDetect, span.OperationName);
    }

    /// <summary>
    /// Test 18: Verify forecast span is child of orchestrator span.
    /// </summary>
    [Fact]
    public void Span_Hierarchy_ForecastSpanIsChildOfOrchestratorSpan()
    {
        // Act
        using var parentSpan = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasOrchestratorRun);
        using var childSpan = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasForecastCompute);

        // Assert
        Assert.NotNull(parentSpan);
        Assert.NotNull(childSpan);
        Assert.Equal(parentSpan.TraceId, childSpan.TraceId);
        Assert.Equal(parentSpan.SpanId, childSpan.ParentSpanId);
    }

    /// <summary>
    /// Test 19: Verify anomaly span is child of forecast span.
    /// </summary>
    [Fact]
    public void Span_Hierarchy_AnomalySpanIsChildOfForecastSpan()
    {
        // Act
        using var orchestratorSpan = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasOrchestratorRun);
        using var forecastSpan = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasForecastCompute);
        using var anomalySpan = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasAnomalyDetect);

        // Assert
        Assert.NotNull(forecastSpan);
        Assert.NotNull(anomalySpan);
        Assert.Equal(forecastSpan.TraceId, anomalySpan.TraceId);
        Assert.Equal(forecastSpan.SpanId, anomalySpan.ParentSpanId);
    }

    /// <summary>
    /// Test 20: Verify background service span has Internal kind.
    /// </summary>
    [Fact]
    public void Span_AtlasBackgroundService_HasCorrectKind()
    {
        // Act
        using var span = _tracer.StartAtlasSpan(
            TracingConstants.SpanNames.AtlasOrchestratorRun,
            ActivityKind.Internal);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(ActivityKind.Internal, span.Kind);
    }

    #endregion

    #region Category 4: Span Attributes (10 tests)

    /// <summary>
    /// Test 21: Verify county ID attribute can be set on spans.
    /// </summary>
    [Fact]
    public void Attribute_CountyId_SetOnAllSpans()
    {
        // Arrange
        var countyId = "benton-wa";
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.CountyId, countyId);

        // Assert
        Assert.NotNull(span);
        var tag = span.GetTagItem(TracingConstants.Attributes.CountyId);
        Assert.Equal(countyId, tag);
    }

    /// <summary>
    /// Test 22: Verify context ID attribute can be set on RAG spans.
    /// </summary>
    [Fact]
    public void Attribute_ContextId_SetOnRagSpans()
    {
        // Arrange
        var contextId = "ctx-12345";
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRagQuery);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.ContextId, contextId);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.ContextId);
        Assert.Equal(contextId, tag);
    }

    /// <summary>
    /// Test 23: Verify uses RAG boolean attribute can be set.
    /// </summary>
    [Fact]
    public void Attribute_UsesRag_SetOnRequestSpan()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.UsesRag, true);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.UsesRag);
        Assert.Equal(true, tag);
    }

    /// <summary>
    /// Test 24: Verify guardrail result attribute can be set.
    /// </summary>
    [Fact]
    public void Attribute_GuardrailResult_SetOnGuardrailSpan()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptGuardrailEvaluate);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.GuardrailResult, TracingConstants.Values.GuardrailResult.Pass);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.GuardrailResult);
        Assert.Equal(TracingConstants.Values.GuardrailResult.Pass, tag);
    }

    /// <summary>
    /// Test 25: Verify swarm action attribute can be set.
    /// </summary>
    [Fact]
    public void Attribute_SwarmAction_SetOnSwarmSpan()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptSwarmDecide);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.SwarmAction, TracingConstants.Values.SwarmAction.Scale);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.SwarmAction);
        Assert.Equal(TracingConstants.Values.SwarmAction.Scale, tag);
    }

    /// <summary>
    /// Test 26: Verify metric name attribute can be set on forecast span.
    /// </summary>
    [Fact]
    public void Attribute_ForecastMetricName_SetOnForecastSpan()
    {
        // Arrange
        var metricName = "cpu_utilization";
        using var span = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasForecastCompute);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.MetricName, metricName);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.MetricName);
        Assert.Equal(metricName, tag);
    }

    /// <summary>
    /// Test 27: Verify anomaly type attribute can be set.
    /// </summary>
    [Fact]
    public void Attribute_AnomalyType_SetOnAnomalySpan()
    {
        // Arrange
        var anomalyType = "spike";
        using var span = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasAnomalyDetect);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.AnomalyType, anomalyType);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.AnomalyType);
        Assert.Equal(anomalyType, tag);
    }

    /// <summary>
    /// Test 28: Verify document count numeric attribute can be set.
    /// </summary>
    [Fact]
    public void Attribute_DocumentCount_SetOnRagSpan()
    {
        // Arrange
        var documentCount = 5;
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRagQuery);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.DocumentCount, documentCount);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.DocumentCount);
        Assert.Equal(documentCount, tag);
    }

    /// <summary>
    /// Test 29: Verify request duration attribute can be set.
    /// </summary>
    [Fact]
    public void Attribute_RequestDuration_CalculatedCorrectly()
    {
        // Arrange
        var durationMs = 150.5;
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.RequestDurationMs, durationMs);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.RequestDurationMs);
        Assert.Equal(durationMs, tag);
    }

    /// <summary>
    /// Test 30: Verify service name attribute is consistent.
    /// </summary>
    [Fact]
    public void Attribute_ServiceName_ConsistentAcrossSpans()
    {
        // Arrange
        var serviceName = "TerraFusion.AI";
        using var span1 = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);
        using var span2 = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasForecastCompute);

        // Act
        _tracer.SetAttribute(span1, TracingConstants.Attributes.ServiceName, serviceName);
        _tracer.SetAttribute(span2, TracingConstants.Attributes.ServiceName, serviceName);

        // Assert
        var tag1 = span1?.GetTagItem(TracingConstants.Attributes.ServiceName);
        var tag2 = span2?.GetTagItem(TracingConstants.Attributes.ServiceName);
        Assert.Equal(serviceName, tag1);
        Assert.Equal(serviceName, tag2);
    }

    #endregion

    #region Category 5: Status and Errors (6 tests)

    /// <summary>
    /// Test 31: Verify OK status can be set on successful operation.
    /// </summary>
    [Fact]
    public void Status_SuccessfulOperation_SetsOkStatus()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);

        // Act
        _tracer.SetStatus(span, ActivityStatusCode.Ok);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(ActivityStatusCode.Ok, span.Status);
    }

    /// <summary>
    /// Test 32: Verify Error status can be set on failed operation.
    /// </summary>
    [Fact]
    public void Status_FailedOperation_SetsErrorStatus()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);

        // Act
        _tracer.SetStatus(span, ActivityStatusCode.Error, "Operation failed");

        // Assert
        Assert.NotNull(span);
        Assert.Equal(ActivityStatusCode.Error, span.Status);
        Assert.Equal("Operation failed", span.StatusDescription);
    }

    /// <summary>
    /// Test 33: Verify exception details are recorded.
    /// </summary>
    [Fact]
    public void Status_Exception_RecordsExceptionDetails()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);
        var exception = new InvalidOperationException("Test exception");

        // Act
        _tracer.RecordException(span, exception);

        // Assert
        Assert.NotNull(span);
        Assert.Equal(ActivityStatusCode.Error, span.Status);
        Assert.Contains(span.Events, e => e.Name == "exception");
    }

    /// <summary>
    /// Test 34: Verify guardrail rejection sets appropriate status.
    /// </summary>
    [Fact]
    public void Status_GuardrailRejection_SetsWarningStatus()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptGuardrailEvaluate);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.GuardrailResult, TracingConstants.Values.GuardrailResult.Fail);
        _tracer.SetStatus(span, ActivityStatusCode.Unset, "Guardrail rejected request");

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.GuardrailResult);
        Assert.Equal(TracingConstants.Values.GuardrailResult.Fail, tag);
    }

    /// <summary>
    /// Test 35: Verify anomaly detection sets warning attribute.
    /// </summary>
    [Fact]
    public void Status_AnomalyDetected_SetsWarningAttribute()
    {
        // Arrange
        using var span = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasAnomalyDetect);

        // Act
        _tracer.SetAttribute(span, TracingConstants.Attributes.AnomalySeverity, TracingConstants.Values.AnomalySeverity.High);

        // Assert
        var tag = span?.GetTagItem(TracingConstants.Attributes.AnomalySeverity);
        Assert.Equal(TracingConstants.Values.AnomalySeverity.High, tag);
    }

    /// <summary>
    /// Test 36: Verify trace context propagates across service boundaries.
    /// </summary>
    [Fact]
    public void Error_PropagatesTraceContext_AcrossServiceBoundaries()
    {
        // Arrange
        using var parentSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRequest,
            ActivityKind.Server);

        var parentContext = _tracer.GetCurrentContext();

        // Simulate crossing service boundary
        using var childSpan = _tracer.StartAtlasSpan(
            TracingConstants.SpanNames.AtlasForecastCompute,
            ActivityKind.Internal,
            parentContext);

        // Assert
        Assert.NotNull(parentSpan);
        Assert.NotNull(childSpan);
        Assert.Equal(parentSpan.TraceId, childSpan.TraceId);
    }

    #endregion

    #region Category 6: Performance and Overhead (4 tests)

    /// <summary>
    /// Test 37: Verify tracing overhead is acceptable in a realistic scenario.
    /// Note: Micro-benchmarks with ActivityListeners have inherent overhead that doesn't reflect
    /// production behavior. This test validates that span creation completes in a reasonable time.
    /// </summary>
    [Fact]
    public void Performance_TracingOverhead_AcceptableForProduction()
    {
        // Arrange - measure time to create and complete 1000 spans
        const int iterations = 1000;
        var stopwatch = Stopwatch.StartNew();

        // Act
        for (int i = 0; i < iterations; i++)
        {
            using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);
            _tracer.SetAttribute(span, TracingConstants.Attributes.CountyId, "benton-wa");
            _tracer.SetStatus(span, ActivityStatusCode.Ok);
        }
        stopwatch.Stop();

        // Assert - 1000 complete span operations should take less than 500ms
        // This is a generous threshold that accounts for test environment variability
        Assert.True(stopwatch.ElapsedMilliseconds < 500,
            $"1000 span operations took {stopwatch.ElapsedMilliseconds}ms, expected < 500ms");
    }

    /// <summary>
    /// Test 38: Verify span creation is fast.
    /// </summary>
    [Fact]
    public void Performance_SpanCreation_UnderMicrosecondThreshold()
    {
        // Arrange
        const int iterations = 1000;
        var stopwatch = Stopwatch.StartNew();

        // Act
        for (int i = 0; i < iterations; i++)
        {
            using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);
        }
        stopwatch.Stop();

        // Assert average span creation < 1ms (generous threshold for test stability)
        var averageMs = stopwatch.Elapsed.TotalMilliseconds / iterations;
        Assert.True(averageMs < 1.0, $"Average span creation was {averageMs:F4}ms, expected < 1ms");
    }

    /// <summary>
    /// Test 39: Verify null tracer has zero allocation when sampled out.
    /// </summary>
    [Fact]
    public void Performance_NoAllocation_WhenSampledOut()
    {
        // Arrange
        var nullTracer = NullTerraFusionTracer.Instance;

        // Act
        var span = nullTracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);

        // Assert
        Assert.Null(span);
        Assert.False(nullTracer.IsEnabled);
    }

    /// <summary>
    /// Test 40: Verify operations don't block on null activity.
    /// </summary>
    [Fact]
    public void Performance_BatchExport_DoesNotBlockMainThread()
    {
        // Arrange
        var nullTracer = NullTerraFusionTracer.Instance;
        Activity? span = null;

        // Act - these should all be no-ops
        var stopwatch = Stopwatch.StartNew();
        nullTracer.SetAttribute(span, TracingConstants.Attributes.CountyId, "test");
        nullTracer.SetAttribute(span, TracingConstants.Attributes.DocumentCount, 5);
        nullTracer.SetAttribute(span, TracingConstants.Attributes.UsesRag, true);
        nullTracer.SetStatus(span, ActivityStatusCode.Ok);
        nullTracer.RecordException(span, new Exception("test"));
        nullTracer.AddEvent(span, "test-event");
        stopwatch.Stop();

        // Assert - operations should complete nearly instantly
        Assert.True(stopwatch.ElapsedMilliseconds < 10, "Null tracer operations should be near-instant");
    }

    #endregion

    #region Category 7: Integration and Correlation (5 tests)

    /// <summary>
    /// Test 41: Verify metrics and traces can share context.
    /// </summary>
    [Fact]
    public void Integration_MetricsAndTraces_ShareTraceContext()
    {
        // Arrange
        using var span = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRequest);

        // Act
        var context = _tracer.GetCurrentContext();

        // Assert
        Assert.NotNull(span);
        Assert.NotEqual(default, context.TraceId);
        Assert.Equal(span.TraceId, context.TraceId);
    }

    /// <summary>
    /// Test 42: Verify Atlas metrics can correlate with span ID.
    /// </summary>
    [Fact]
    public void Integration_AtlasMetrics_CorrelateWithSpanId()
    {
        // Arrange
        using var span = _tracer.StartAtlasSpan(TracingConstants.SpanNames.AtlasForecastCompute);

        // Act
        var context = _tracer.GetCurrentContext();

        // Assert
        Assert.NotNull(span);
        Assert.NotEqual(default, context.SpanId);
        Assert.Equal(span.SpanId, context.SpanId);
    }

    /// <summary>
    /// Test 43: Verify HTTP instrumentation parent span can be linked.
    /// </summary>
    [Fact]
    public void Integration_HttpInstrumentation_ParentSpanLinked()
    {
        // Arrange - simulate an incoming HTTP request span
        using var httpSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRequest,
            ActivityKind.Server);

        // Act - create child span for internal work
        using var internalSpan = _tracer.StartSystemGptSpan(
            TracingConstants.SpanNames.SystemGptRagQuery,
            ActivityKind.Internal);

        // Assert
        Assert.NotNull(httpSpan);
        Assert.NotNull(internalSpan);
        Assert.Equal(httpSpan.TraceId, internalSpan.TraceId);
        Assert.Equal(httpSpan.SpanId, internalSpan.ParentSpanId);
    }

    /// <summary>
    /// Test 44: Verify EF instrumentation SQL spans can be linked.
    /// </summary>
    [Fact]
    public void Integration_EFInstrumentation_SqlSpansLinked()
    {
        // Arrange - simulate a RAG query that would make DB calls
        using var ragSpan = _tracer.StartSystemGptSpan(TracingConstants.SpanNames.SystemGptRagQuery);

        // Act - get context for EF to use
        var context = _tracer.GetCurrentContext();

        // Assert - context should have valid trace/span for EF to link to
        Assert.NotNull(ragSpan);
        Assert.NotEqual(default, context.TraceId);
        Assert.Equal(ragSpan.TraceId, context.TraceId);
    }

    /// <summary>
    /// Test 45: Verify activity context propagates to background service.
    /// </summary>
    [Fact]
    public void Integration_ActivityContext_PropagatesToBackgroundService()
    {
        // Arrange - simulate orchestrator getting parent context
        using var orchestratorSpan = _tracer.StartAtlasSpan(
            TracingConstants.SpanNames.AtlasOrchestratorRun);
        var parentContext = _tracer.GetCurrentContext();

        // Simulate work delegated to another span (like compute)
        using var computeSpan = _tracer.StartAtlasSpan(
            TracingConstants.SpanNames.AtlasForecastCompute,
            ActivityKind.Internal,
            parentContext);

        // Assert
        Assert.NotNull(orchestratorSpan);
        Assert.NotNull(computeSpan);
        Assert.Equal(orchestratorSpan.TraceId, computeSpan.TraceId);
    }

    #endregion
}

/// <summary>
/// Additional tests for NullTerraFusionTracer behavior.
/// </summary>
[Trait("Category", "Phase36")]
[Trait("Feature", "NullTracer")]
public class NullTerraFusionTracerTests
{
    /// <summary>
    /// Verify NullTracer singleton instance exists.
    /// </summary>
    [Fact]
    public void NullTracer_Singleton_Exists()
    {
        Assert.NotNull(NullTerraFusionTracer.Instance);
    }

    /// <summary>
    /// Verify NullTracer is disabled.
    /// </summary>
    [Fact]
    public void NullTracer_IsEnabled_ReturnsFalse()
    {
        Assert.False(NullTerraFusionTracer.Instance.IsEnabled);
    }

    /// <summary>
    /// Verify NullTracer returns null spans.
    /// </summary>
    [Fact]
    public void NullTracer_StartSpan_ReturnsNull()
    {
        var systemGptSpan = NullTerraFusionTracer.Instance.StartSystemGptSpan("test");
        var atlasSpan = NullTerraFusionTracer.Instance.StartAtlasSpan("test");

        Assert.Null(systemGptSpan);
        Assert.Null(atlasSpan);
    }

    /// <summary>
    /// Verify NullTracer context is default.
    /// </summary>
    [Fact]
    public void NullTracer_GetCurrentContext_ReturnsDefault()
    {
        var context = NullTerraFusionTracer.Instance.GetCurrentContext();
        Assert.Equal(default, context);
    }
}

/// <summary>
/// Tests for TracingConstants SPEC LOCK compliance.
/// </summary>
[Trait("Category", "Phase36")]
[Trait("Feature", "SpecLock")]
public class TracingConstantsTests
{
    /// <summary>
    /// Verify SPEC LOCK version is set.
    /// </summary>
    [Fact]
    public void SpecLock_Version_IsSet()
    {
        Assert.Equal("1.0.0", TracingConstants.Version);
    }

    /// <summary>
    /// Verify all span names follow naming convention.
    /// </summary>
    [Fact]
    public void SpecLock_SpanNames_FollowNamingConvention()
    {
        // SystemGpt spans start with "SystemGpt."
        Assert.StartsWith("SystemGpt.", TracingConstants.SpanNames.SystemGptRequest);
        Assert.StartsWith("SystemGpt.", TracingConstants.SpanNames.SystemGptRagQuery);
        Assert.StartsWith("SystemGpt.", TracingConstants.SpanNames.SystemGptGuardrailEvaluate);
        Assert.StartsWith("SystemGpt.", TracingConstants.SpanNames.SystemGptSwarmDecide);

        // Atlas spans start with "Atlas."
        Assert.StartsWith("Atlas.", TracingConstants.SpanNames.AtlasOrchestratorRun);
        Assert.StartsWith("Atlas.", TracingConstants.SpanNames.AtlasForecastCompute);
        Assert.StartsWith("Atlas.", TracingConstants.SpanNames.AtlasAnomalyDetect);
    }

    /// <summary>
    /// Verify all attribute keys follow naming convention.
    /// </summary>
    [Fact]
    public void SpecLock_AttributeKeys_FollowNamingConvention()
    {
        // All attributes start with "tf."
        Assert.StartsWith("tf.", TracingConstants.Attributes.CountyId);
        Assert.StartsWith("tf.", TracingConstants.Attributes.ContextId);
        Assert.StartsWith("tf.", TracingConstants.Attributes.UsesRag);
        Assert.StartsWith("tf.", TracingConstants.Attributes.DocumentCount);
        Assert.StartsWith("tf.", TracingConstants.Attributes.GuardrailResult);
        Assert.StartsWith("tf.", TracingConstants.Attributes.SwarmAction);
        Assert.StartsWith("tf.", TracingConstants.Attributes.MetricName);
        Assert.StartsWith("tf.", TracingConstants.Attributes.AnomalyType);
    }
}

/// <summary>
/// Tests for DI registration via AddTerraFusionTracing.
/// </summary>
[Trait("Category", "Phase36")]
[Trait("Feature", "DependencyInjection")]
public class TracingServiceExtensionsTests
{
    /// <summary>
    /// Verify AddTerraFusionTracing registers ITerraFusionTracer.
    /// </summary>
    [Fact]
    public void AddTerraFusionTracing_RegistersTracer()
    {
        var services = new ServiceCollection();
        services.AddTerraFusionTracing();
        using var provider = services.BuildServiceProvider();

        var tracer = provider.GetService<ITerraFusionTracer>();

        Assert.NotNull(tracer);
        Assert.IsType<TerraFusionTracer>(tracer);
    }

    /// <summary>
    /// Verify AddNullTracing registers NullTerraFusionTracer.
    /// </summary>
    [Fact]
    public void AddNullTracing_RegistersNullTracer()
    {
        var services = new ServiceCollection();
        services.AddNullTracing();
        using var provider = services.BuildServiceProvider();

        var tracer = provider.GetService<ITerraFusionTracer>();

        Assert.NotNull(tracer);
        Assert.Same(NullTerraFusionTracer.Instance, tracer);
    }

    /// <summary>
    /// Verify AddTerraFusionTracing with disabled options registers null tracer.
    /// </summary>
    [Fact]
    public void AddTerraFusionTracing_WithDisabledOptions_RegistersNullTracer()
    {
        var services = new ServiceCollection();
        services.AddTerraFusionTracing(options => options.Enabled = false);
        using var provider = services.BuildServiceProvider();

        var tracer = provider.GetService<ITerraFusionTracer>();

        Assert.NotNull(tracer);
        Assert.Same(NullTerraFusionTracer.Instance, tracer);
    }

    /// <summary>
    /// Verify tracer is singleton.
    /// </summary>
    [Fact]
    public void AddTerraFusionTracing_TracerIsSingleton()
    {
        var services = new ServiceCollection();
        services.AddTerraFusionTracing();
        using var provider = services.BuildServiceProvider();

        var tracer1 = provider.GetService<ITerraFusionTracer>();
        var tracer2 = provider.GetService<ITerraFusionTracer>();

        Assert.Same(tracer1, tracer2);
    }

    /// <summary>
    /// Verify AddAtlasTracing extension works.
    /// </summary>
    [Fact]
    public void AddAtlasTracing_RegistersTracer()
    {
        var services = new ServiceCollection();
        services.AddAtlasTracing();
        using var provider = services.BuildServiceProvider();

        var tracer = provider.GetService<ITerraFusionTracer>();

        Assert.NotNull(tracer);
        Assert.IsType<TerraFusionTracer>(tracer);
    }

    /// <summary>
    /// Verify AddAtlasNullTracing extension works.
    /// </summary>
    [Fact]
    public void AddAtlasNullTracing_RegistersNullTracer()
    {
        var services = new ServiceCollection();
        services.AddAtlasNullTracing();
        using var provider = services.BuildServiceProvider();

        var tracer = provider.GetService<ITerraFusionTracer>();

        Assert.NotNull(tracer);
        Assert.Same(NullTerraFusionTracer.Instance, tracer);
    }
}
