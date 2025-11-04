namespace TerraFusion.API.Attributes;

/// <summary>
/// ProduceTo Attribute - Marks API endpoints for enhanced production data routing
/// with championship-level monitoring and performance optimization
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
public class ProduceToAttribute : Attribute
{
    /// <summary>
    /// Content type that this endpoint produces (e.g., "application/json", "application/xml")
    /// </summary>
    public string ContentType { get; }

    /// <summary>
    /// HTTP status code for successful responses (default: 200 OK)
    /// </summary>
    public int StatusCode { get; set; } = 200;

    /// <summary>
    /// Enable championship-level performance monitoring for this endpoint
    /// </summary>
    public bool EnablePerformanceMonitoring { get; set; } = true;

    /// <summary>
    /// Enable FISMA-High audit logging for government compliance
    /// </summary>
    public bool EnableAuditLogging { get; set; } = true;

    /// <summary>
    /// Response type returned by this endpoint (for Swagger/OpenAPI documentation)
    /// </summary>
    public Type? ResponseType { get; set; }

    /// <summary>
    /// Initializes a new instance of ProduceToAttribute
    /// </summary>
    /// <param name="contentType">Content type produced by this endpoint</param>
    public ProduceToAttribute(string contentType)
    {
        ContentType = contentType ?? throw new ArgumentNullException(nameof(contentType));
    }

    /// <summary>
    /// Initializes a new instance of ProduceToAttribute with response type
    /// </summary>
    /// <param name="contentType">Content type produced by this endpoint</param>
    /// <param name="responseType">Type of response object returned</param>
    public ProduceToAttribute(string contentType, Type responseType)
        : this(contentType)
    {
        ResponseType = responseType ?? throw new ArgumentNullException(nameof(responseType));
    }
}
