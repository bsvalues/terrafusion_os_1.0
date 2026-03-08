using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Instrumentation.AspNetCore;
using OpenTelemetry.Instrumentation.Http;
using OpenTelemetry.Instrumentation.EntityFrameworkCore;
using OpenTelemetry.Instrumentation.SqlClient;
using OpenTelemetry.Exporter.OpenTelemetryProtocol;
using OpenTelemetry.Exporter.Jaeger;

using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Data;

namespace TerraFusion.Core.Observability;

/// <summary>
/// Telemetry configuration options
/// </summary>
public class TelemetryOptions
{
    public string ServiceName { get; set; } = "TerraFusion";
    public string ServiceVersion { get; set; } = "1.0.0";
    public string Environment { get; set; } = "Development";
    public string? Region { get; set; }
    public string? County { get; set; }
    public bool EnableConsoleExporter { get; set; } = true;
    public bool EnableJaegerExporter { get; set; } = false;
    public bool EnablePrometheusExporter { get; set; } = true;
    public string? JaegerEndpoint { get; set; }
    public string? OTLPEndpoint { get; set; }
}

/// <summary>
/// Static telemetry configuration with government compliance requirements
/// </summary>
public static class TelemetryConfiguration
{
    // Static meter for government compliance metrics
    public static readonly Meter Meter = new("TerraFusion.Government", "1.0.0");
    
    // Government compliance counters
    public static readonly Counter<long> PropertyLookupsCounter = Meter.CreateCounter<long>(
        "terrafusion.property.lookups.total",
        description: "Total number of property lookup requests");
    
    public static readonly Counter<long> NegativeCacheHitsCounter = Meter.CreateCounter<long>(
        "terrafusion.cache.negative_hits.total",
        description: "Total number of negative cache hits (queries prevented)");
    
    public static readonly Counter<long> HarrisPacsIntegrationsCounter = Meter.CreateCounter<long>(
        "terrafusion.harris_pacs.requests.total",
        description: "Total number of Harris PACS integration requests");
    
    public static readonly Counter<long> ComplianceOperationsCounter = Meter.CreateCounter<long>(
        "terrafusion.compliance.operations.total",
        description: "Total number of government compliance operations");
    
    // Custom histograms for performance tracking
    public static readonly Histogram<double> PropertyLookupDurationHistogram = Meter.CreateHistogram<double>(
        "terrafusion.property.lookup.duration",
        unit: "ms",
        description: "Duration of property lookup operations");
    
    public static readonly Histogram<double> DatabaseQueryDurationHistogram = Meter.CreateHistogram<double>(
        "terrafusion.database.query.duration",
        unit: "ms",
        description: "Duration of database queries");
    
    public static readonly Histogram<double> CacheOperationDurationHistogram = Meter.CreateHistogram<double>(
        "terrafusion.cache.operation.duration",
        unit: "ms",
        description: "Duration of cache operations");

    /// <summary>
    /// Configure OpenTelemetry for TerraFusion OS with government compliance requirements
    /// </summary>
    public static IServiceCollection AddTerraFusionTelemetry(
        this IServiceCollection services, 
        TelemetryOptions options)
    {
        // Configure resource information for government compliance
        var resourceBuilder = ResourceBuilder.CreateDefault()
            .AddService(
                serviceName: options.ServiceName,
                serviceVersion: options.ServiceVersion,
                serviceInstanceId: Environment.MachineName)
            .AddAttributes(new Dictionary<string, object>
            {
                ["deployment.environment"] = options.Environment,
                ["government.classification"] = "unclassified",
                ["government.system"] = "property-assessment",
                ["compliance.framework"] = "fisma",
                ["compliance.level"] = "moderate",
                ["datacenter.region"] = options.Region ?? "us-west-2",
                ["county.jurisdiction"] = options.County ?? "multi-county",
                ["terrafusion.version"] = "1.0.0",
                ["terrafusion.component"] = "backend-api"
            });

        // Configure OpenTelemetry tracing
        services.AddOpenTelemetry()
            .WithTracing(builder =>
            {
                builder.SetResourceBuilder(resourceBuilder)
                    // Add standard instrumentations
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        // Government compliance: Don't record sensitive data
                        options.RecordException = true;
                        options.EnrichWithHttpRequest = EnrichHttpRequest;
                        options.EnrichWithHttpResponse = EnrichHttpResponse;
                        options.Filter = FilterHttpRequests;
                    })
                    .AddHttpClientInstrumentation(options =>
                    {
                        options.RecordException = true;
                        options.EnrichWithHttpRequestMessage = EnrichHttpClientRequest;
                        options.EnrichWithHttpResponseMessage = EnrichHttpClientResponse;
                        options.FilterHttpRequestMessage = FilterHttpClientRequests;
                    })
                    .AddEntityFrameworkCoreInstrumentation(options =>
                    {
                        options.SetDbStatementForStoredProcedure = true;
                        options.SetDbStatementForText = true;
                    })
                    .AddSqlClientInstrumentation(options =>
                    {
                        options.SetDbStatementForText = true;
                        options.SetDbStatementForStoredProcedure = true;
                    });

                // Add exporters based on configuration
                if (options.EnableJaegerExporter && !string.IsNullOrEmpty(options.JaegerEndpoint))
                {
                    builder.AddJaegerExporter(jaegerOptions =>
                    {
                        jaegerOptions.AgentHost = options.JaegerEndpoint;
                        jaegerOptions.AgentPort = 6831;
                    });
                }

                if (!string.IsNullOrEmpty(options.OTLPEndpoint))
                {
                    builder.AddOtlpExporter(otlpOptions =>
                    {
                        otlpOptions.Endpoint = new Uri(options.OTLPEndpoint);
                    });
                }
            })
            .WithMetrics(builder =>
            {
                builder.SetResourceBuilder(resourceBuilder)
                    .AddMeter("TerraFusion.Government")
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddPrometheusExporter();
            });

        return services;
    }

    /// <summary>
    /// Enrich HTTP request with government compliance data
    /// </summary>
    private static void EnrichHttpRequest(Activity activity, HttpRequest request)
    {
        // Add government compliance tags
        activity.SetTag("government.request_type", "property_assessment");
        activity.SetTag("government.compliance_level", "moderate");
        
        // Add cache status if available
        if (request.Headers.ContainsKey("X-Cache-Status"))
        {
            var cacheStatus = request.Headers["X-Cache-Status"].ToString();
            activity.SetTag("cache.status", cacheStatus);
            
            if (cacheStatus.ToString().Contains("MISS_SENTINEL"))
            {
                activity.SetTag("cache.negative_hit", "true");
                NegativeCacheHitsCounter.Add(1L, 
                    new KeyValuePair<string, object?>("cache_type", "miss_sentinel"),
                    new KeyValuePair<string, object?>("endpoint", activity.GetTagItem("http.route")?.ToString() ?? "unknown"));
            }
        }
    }

    /// <summary>
    /// Enrich HTTP response with government compliance data
    /// </summary>
    private static void EnrichHttpResponse(Activity activity, HttpResponse response)
    {
        // Add government compliance tags
        activity.SetTag("government.response_type", "property_assessment");
        activity.SetTag("government.compliance_validated", "true");
    }

    /// <summary>
    /// Filter HTTP requests for government compliance
    /// </summary>
    private static bool FilterHttpRequests(HttpContext context)
    {
        // Don't trace health checks or metrics endpoints
        var path = context.Request.Path.Value?.ToLower();
        return !path?.Contains("/health") == true && !path?.Contains("/metrics") == true;
    }

    /// <summary>
    /// Enrich HTTP client request with government compliance data
    /// </summary>
    private static void EnrichHttpClientRequest(Activity activity, HttpRequestMessage request)
    {
        activity.SetTag("government.external_service", "harris_pacs");
        activity.SetTag("government.compliance_level", "moderate");
    }

    /// <summary>
    /// Enrich HTTP client response with government compliance data
    /// </summary>
    private static void EnrichHttpClientResponse(Activity activity, HttpResponseMessage response)
    {
        activity.SetTag("government.external_service_response", "harris_pacs");
        activity.SetTag("government.compliance_validated", "true");
    }

    /// <summary>
    /// Filter HTTP client requests for government compliance
    /// </summary>
    private static bool FilterHttpClientRequests(HttpRequestMessage request)
    {
        // Don't trace internal service calls
        var uri = request.RequestUri?.ToString().ToLower();
        return !uri?.Contains("localhost") == true && !uri?.Contains("127.0.0.1") == true;
    }
}