// ============================================================================
// PHASE 36: OpenTelemetry Distributed Tracing Interface
// ============================================================================
// Abstraction layer for distributed tracing operations
// Enables DI-based tracing with testable no-op implementation
// ============================================================================

using System.Diagnostics;

namespace TerraFusion.AI.Tracing;

/// <summary>
/// Interface for TerraFusion distributed tracing operations.
/// Provides an abstraction layer over System.Diagnostics.Activity for testability.
/// </summary>
public interface ITerraFusionTracer
{
    /// <summary>
    /// Gets the SystemGPT ActivitySource for creating spans in the GPT pipeline.
    /// </summary>
    ActivitySource SystemGptSource { get; }

    /// <summary>
    /// Gets the Atlas ActivitySource for creating spans in the Atlas/Forecast pipeline.
    /// </summary>
    ActivitySource AtlasSource { get; }

    /// <summary>
    /// Starts a new span/activity with the given name from the SystemGPT source.
    /// </summary>
    /// <param name="spanName">The name of the span (use TracingConstants.SpanNames).</param>
    /// <param name="kind">The kind of activity (default: Internal).</param>
    /// <param name="parentContext">Optional parent context for span hierarchy.</param>
    /// <returns>The started Activity, or null if sampling is disabled.</returns>
    Activity? StartSystemGptSpan(
        string spanName,
        ActivityKind kind = ActivityKind.Internal,
        ActivityContext? parentContext = null);

    /// <summary>
    /// Starts a new span/activity with the given name from the Atlas source.
    /// </summary>
    /// <param name="spanName">The name of the span (use TracingConstants.SpanNames).</param>
    /// <param name="kind">The kind of activity (default: Internal).</param>
    /// <param name="parentContext">Optional parent context for span hierarchy.</param>
    /// <returns>The started Activity, or null if sampling is disabled.</returns>
    Activity? StartAtlasSpan(
        string spanName,
        ActivityKind kind = ActivityKind.Internal,
        ActivityContext? parentContext = null);

    /// <summary>
    /// Sets a tag/attribute on the current activity.
    /// </summary>
    /// <param name="activity">The activity to tag (can be null).</param>
    /// <param name="key">The attribute key (use TracingConstants.Attributes).</param>
    /// <param name="value">The attribute value.</param>
    void SetAttribute(Activity? activity, string key, string value);

    /// <summary>
    /// Sets a numeric tag/attribute on the current activity.
    /// </summary>
    /// <param name="activity">The activity to tag (can be null).</param>
    /// <param name="key">The attribute key (use TracingConstants.Attributes).</param>
    /// <param name="value">The numeric attribute value.</param>
    void SetAttribute(Activity? activity, string key, int value);

    /// <summary>
    /// Sets a boolean tag/attribute on the current activity.
    /// </summary>
    /// <param name="activity">The activity to tag (can be null).</param>
    /// <param name="key">The attribute key (use TracingConstants.Attributes).</param>
    /// <param name="value">The boolean attribute value.</param>
    void SetAttribute(Activity? activity, string key, bool value);

    /// <summary>
    /// Sets a double tag/attribute on the current activity.
    /// </summary>
    /// <param name="activity">The activity to tag (can be null).</param>
    /// <param name="key">The attribute key (use TracingConstants.Attributes).</param>
    /// <param name="value">The double attribute value.</param>
    void SetAttribute(Activity? activity, string key, double value);

    /// <summary>
    /// Sets the status of the activity.
    /// </summary>
    /// <param name="activity">The activity to set status on (can be null).</param>
    /// <param name="code">The status code.</param>
    /// <param name="description">Optional description (typically for errors).</param>
    void SetStatus(Activity? activity, ActivityStatusCode code, string? description = null);

    /// <summary>
    /// Records an exception on the activity.
    /// </summary>
    /// <param name="activity">The activity to record the exception on (can be null).</param>
    /// <param name="exception">The exception to record.</param>
    void RecordException(Activity? activity, Exception exception);

    /// <summary>
    /// Adds an event to the activity.
    /// </summary>
    /// <param name="activity">The activity to add the event to (can be null).</param>
    /// <param name="name">The event name.</param>
    /// <param name="tags">Optional tags for the event.</param>
    void AddEvent(Activity? activity, string name, ActivityTagsCollection? tags = null);

    /// <summary>
    /// Gets the current activity context for propagation.
    /// </summary>
    /// <returns>The current activity context, or default if none active.</returns>
    ActivityContext GetCurrentContext();

    /// <summary>
    /// Checks if tracing is enabled and sampling is active.
    /// </summary>
    bool IsEnabled { get; }
}
