// ============================================================================
// PHASE 36: Null Tracer Implementation
// ============================================================================
// No-op implementation for testing and scenarios where tracing is disabled
// Zero allocation, minimal overhead
// ============================================================================

using System.Diagnostics;

namespace TerraFusion.AI.Tracing;

/// <summary>
/// No-op implementation of ITerraFusionTracer for testing and disabled tracing scenarios.
/// All operations are no-ops with zero allocation overhead.
/// </summary>
public sealed class NullTerraFusionTracer : ITerraFusionTracer
{
    /// <summary>
    /// Singleton instance for efficiency.
    /// </summary>
    public static readonly NullTerraFusionTracer Instance = new();

    // Static empty ActivitySources (never create spans)
    private static readonly ActivitySource _emptySystemGptSource = new("Null.SystemGpt");
    private static readonly ActivitySource _emptyAtlasSource = new("Null.Atlas");

    private NullTerraFusionTracer() { }

    /// <inheritdoc />
    public ActivitySource SystemGptSource => _emptySystemGptSource;

    /// <inheritdoc />
    public ActivitySource AtlasSource => _emptyAtlasSource;

    /// <inheritdoc />
    public bool IsEnabled => false;

    /// <inheritdoc />
    public Activity? StartSystemGptSpan(
        string spanName,
        ActivityKind kind = ActivityKind.Internal,
        ActivityContext? parentContext = null)
    {
        return null; // No-op: never creates spans
    }

    /// <inheritdoc />
    public Activity? StartAtlasSpan(
        string spanName,
        ActivityKind kind = ActivityKind.Internal,
        ActivityContext? parentContext = null)
    {
        return null; // No-op: never creates spans
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, string value)
    {
        // No-op
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, int value)
    {
        // No-op
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, bool value)
    {
        // No-op
    }

    /// <inheritdoc />
    public void SetAttribute(Activity? activity, string key, double value)
    {
        // No-op
    }

    /// <inheritdoc />
    public void SetStatus(Activity? activity, ActivityStatusCode code, string? description = null)
    {
        // No-op
    }

    /// <inheritdoc />
    public void RecordException(Activity? activity, Exception exception)
    {
        // No-op
    }

    /// <inheritdoc />
    public void AddEvent(Activity? activity, string name, ActivityTagsCollection? tags = null)
    {
        // No-op
    }

    /// <inheritdoc />
    public ActivityContext GetCurrentContext()
    {
        return default; // No context
    }
}
