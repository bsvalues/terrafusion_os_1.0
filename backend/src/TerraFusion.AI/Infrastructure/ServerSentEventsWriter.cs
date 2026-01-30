// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 PHASE 29: Server-Sent Events Writer
// Helper for formatting and writing SSE events to HTTP response
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace TerraFusion.AI.Infrastructure;

/// <summary>
/// Phase 29: Interface for writing Server-Sent Events to HTTP responses.
/// </summary>
public interface IServerSentEventsWriter
{
    /// <summary>
    /// Writes an SSE event to the response stream.
    /// </summary>
    /// <typeparam name="T">Type of event data</typeparam>
    /// <param name="response">HTTP response</param>
    /// <param name="eventType">SSE event type</param>
    /// <param name="data">Event payload</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task WriteEventAsync<T>(HttpResponse response, string eventType, T data, CancellationToken cancellationToken);

    /// <summary>
    /// Configures HTTP response headers for SSE streaming.
    /// </summary>
    void ConfigureResponseHeaders(HttpResponse response);
}

/// <summary>
/// Phase 29: Default SSE writer implementation.
/// Formats events per SSE specification and handles flushing.
/// </summary>
public sealed class ServerSentEventsWriter : IServerSentEventsWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    /// <inheritdoc />
    public void ConfigureResponseHeaders(HttpResponse response)
    {
        response.ContentType = "text/event-stream";
        response.Headers["Cache-Control"] = "no-cache, no-store";
        response.Headers["Connection"] = "keep-alive";
        response.Headers["X-Accel-Buffering"] = "no"; // Disable nginx buffering
    }

    /// <inheritdoc />
    public async Task WriteEventAsync<T>(
        HttpResponse response, 
        string eventType, 
        T data, 
        CancellationToken cancellationToken)
    {
        // SSE format:
        // event: <event-type>\n
        // data: <json-payload>\n
        // \n

        var jsonData = JsonSerializer.Serialize(data, JsonOptions);
        
        var sb = new StringBuilder();
        sb.Append("event: ").Append(eventType).Append('\n');
        sb.Append("data: ").Append(jsonData).Append('\n');
        sb.Append('\n');

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());

        await response.Body.WriteAsync(bytes, cancellationToken);
        await response.Body.FlushAsync(cancellationToken);
    }
}
