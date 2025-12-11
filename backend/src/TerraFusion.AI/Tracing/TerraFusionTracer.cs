// ============================================================================
// PHASE 36: OpenTelemetry Distributed Tracing Implementation
// ============================================================================
// Production implementation using System.Diagnostics.ActivitySource
// Integrates with existing TelemetryConfiguration in TerraFusion.Core
// ============================================================================

using System.Diagnostics;

namespace TerraFusion.AI.Tracing;

/// <summary>
/// Production implementation of ITerraFusionTracer using System.Diagnostics.ActivitySource.
/// Creates spans for the SystemGPT and Atlas pipelines with proper hierarchy and attributes.
/// </summary>
public sealed class TerraFusionTracer : ITerraFusionTracer, IDisposable
{
    private readonly ActivitySource _systemGptSource;
    private readonly ActivitySource _atlasSource;
    private bool _disposed;

    /// <summary>
    /// Initializes a new instance of TerraFusionTracer with the SPEC LOCK ActivitySources.
    /// </summary>
    public TerraFusionTracer()
    {
        _systemGptSource = new ActivitySource(
            TracingConstants.ActivitySources.SystemGpt,
            TracingConstants.Version);

        _atlasSource = new ActivitySource(
            TracingConstants.ActivitySources.Atlas,
            TracingConstants.Version);
    }

    /// <inheritdoc />
    public ActivitySource SystemGptSource => _systemGptSource;

    /// <inheritdoc />
    public ActivitySource AtlasSource => _atlasSource;

    /// <inheritdoc />
    public bool IsEnabled => _systemGptSource.HasListeners() || _atlasSource.HasListeners();

    /// <inheritdoc />
    public Activity? StartSystemGptSpan(
        string spanName,
        ActivityKind kind = ActivityKind.Internal,
        ActivityContext? parentContext = null)
    {
        if (_disposed) return null;

        return parentContext.HasValue
            ? _systemGptSource.StartActivity(spanName, kind, parentContext.Value)
            : _systemGptSource.StartActivity(spanName, kind);
    }

    /// <inheritdoc />
    public Activity? StartAtlasSpan(
        string spanName,
        ActivityKind kind = ActivityKind.Internal,
        ActivityContext? parentContext = null)
    {
        if (_disposed) return null;

        return parentContext.HasValue
            ? _atlasSource.StartActivity(spanName, kind, parentContext.Value)
            : _atlasSource.StartActivity(spanName, kind);
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, string value)
    {
        activity?.SetTag(key, value);
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, int value)
    {
        activity?.SetTag(key, value);
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, bool value)
    {
        activity?.SetTag(key, value);
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, double value)
    {
        activity?.SetTag(key, value);
    }

    /// <inheritdoc />
    public void SetStatus(Activity? activity, ActivityStatusCode code, string? description = null)
    {
        activity?.SetStatus(code, description);
    }

    /// <inheritdoc />
    public void RecordException(Activity? activity, Exception exception)
    {
        if (activity == null || exception == null) return;

        var tags = new ActivityTagsCollection
        {
            { "exception.type", exception.GetType().FullName ?? exception.GetType().Name },
            { "exception.message", exception.Message }
        };

        if (!string.IsNullOrEmpty(exception.StackTrace))
        {
            tags.Add("exception.stacktrace", exception.StackTrace);
        }

        activity.AddEvent(new ActivityEvent("exception", tags: tags));
        activity.SetStatus(ActivityStatusCode.Error, exception.Message);
    }

    /// <inheritdoc />
    public void AddEvent(Activity? activity, string name, ActivityTagsCollection? tags = null)
    {
        if (activity == null) return;

        var activityEvent = tags != null
            ? new ActivityEvent(name, tags: tags)
            : new ActivityEvent(name);

        activity.AddEvent(activityEvent);
    }

    /// <inheritdoc />
    public ActivityContext GetCurrentContext()
    {
        return Activity.Current?.Context ?? default;
    }

    /// <summary>
    /// Disposes the ActivitySources.
    /// </summary>
    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _systemGptSource.Dispose();
        _atlasSource.Dispose();
    }
}
