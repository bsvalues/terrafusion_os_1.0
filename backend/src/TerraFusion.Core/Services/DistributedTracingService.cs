using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using System.Net.Http;
using System.Text;


#pragma warning disable CS1998 // Async method lacks 'await' operators

namespace TerraFusion.Core.Services
{
    public interface IDistributedTracingService
    {
        Task<string> StartTraceAsync(string operationName, Dictionary<string, object>? tags = null);
        Task<string> StartSpanAsync(string traceId, string operationName, string? parentSpanId = null, Dictionary<string, object>? tags = null);
        Task FinishSpanAsync(string spanId, Dictionary<string, object>? tags = null);
        Task LogEventAsync(string traceId, string spanId, string eventName, Dictionary<string, object>? data = null);
        Task<TraceMetrics?> GetTraceMetricsAsync(string traceId);
        Task<List<TraceSpan>> GetTraceSpansAsync(string traceId);
        Task FlushTracesAsync();
    }

    public class TraceSpan
    {
        public required string SpanId { get; set; }
        public required string TraceId { get; set; }
        public required string ParentSpanId { get; set; }
        public required string OperationName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public TimeSpan? Duration => EndTime?.Subtract(StartTime);
        public Dictionary<string, object> Tags { get; set; } = new Dictionary<string, object>();
        public List<TraceEvent> Events { get; set; } = new List<TraceEvent>();
        public string Status { get; set; } = "active";
        public required string ServiceName { get; set; }
        public required string UserId { get; set; }
        public required string RequestId { get; set; }
    }

    public class TraceEvent
    {
        public required string EventId { get; set; }
        public required string Name { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Data { get; set; } = new Dictionary<string, object>();
        public string Level { get; set; } = "info";
    }

    public class TraceMetrics
    {
        public required string TraceId { get; set; }
        public TimeSpan TotalDuration { get; set; }
        public int SpanCount { get; set; }
        public int ErrorCount { get; set; }
        public Dictionary<string, double> ServiceLatencies { get; set; } = new Dictionary<string, double>();
        public Dictionary<string, int> OperationCounts { get; set; } = new Dictionary<string, int>();
        public List<string> CriticalPath { get; set; } = new List<string>();
        public double ThroughputRpm { get; set; }
        public double ErrorRate { get; set; }
    }

    public class DistributedTracingService : IDistributedTracingService
    {
        private readonly ILogger<DistributedTracingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly Dictionary<string, TraceSpan> _activeSpans;
        private readonly Dictionary<string, List<TraceSpan>> _traces;
        private readonly object _lock = new object();

        // Jaeger/OpenTelemetry configuration
        private readonly string _jaegerEndpoint;
        private readonly string _serviceName;
        private readonly bool _enableSampling;
        private readonly double _samplingRate;

        public DistributedTracingService(
            ILogger<DistributedTracingService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _activeSpans = new Dictionary<string, TraceSpan>();
            _traces = new Dictionary<string, List<TraceSpan>>();

            _jaegerEndpoint = configuration["Tracing:JaegerEndpoint"] ?? "http://localhost:14268/api/traces";
            _serviceName = configuration["Tracing:ServiceName"] ?? "TerraFusion.API";
            _enableSampling = configuration.GetValue<bool>("Tracing:EnableSampling", true);
            _samplingRate = configuration.GetValue<double>("Tracing:SamplingRate", 0.1);
        }

        public async Task<string> StartTraceAsync(string operationName, Dictionary<string, object>? tags = null)
        {
            var traceId = GenerateTraceId();
            var spanId = GenerateSpanId();

            var span = new TraceSpan
            {
                TraceId = traceId,
                SpanId = spanId,
                ParentSpanId = "root",
                OperationName = operationName,
                StartTime = DateTime.UtcNow,
                ServiceName = _serviceName,
                Tags = tags ?? new Dictionary<string, object>(),
                UserId = "system",
                RequestId = Guid.NewGuid().ToString()
            };

            // Add default tags
            span.Tags["service.name"] = _serviceName;
            span.Tags["trace.root"] = true;
            span.Tags["operation.name"] = operationName;

            lock (_lock)
            {
                _activeSpans[spanId] = span;
                if (!_traces.ContainsKey(traceId))
                {
                    _traces[traceId] = new List<TraceSpan>();
                }
                _traces[traceId].Add(span);
            }

            _logger.LogInformation("Started trace {TraceId} with root span {SpanId} for operation {OperationName}",
                traceId, spanId, operationName);

            return traceId;
        }

        public async Task<string> StartSpanAsync(string traceId, string operationName, string? parentSpanId = null, Dictionary<string, object>? tags = null)
        {
            var spanId = GenerateSpanId();

            var span = new TraceSpan
            {
                SpanId = spanId,
                TraceId = traceId,
                ParentSpanId = parentSpanId ?? "root",
                OperationName = operationName,
                StartTime = DateTime.UtcNow,
                ServiceName = _serviceName,
                Tags = tags ?? new Dictionary<string, object>(),
                UserId = "system",
                RequestId = Guid.NewGuid().ToString()
            };

            // Add default tags
            span.Tags["service.name"] = _serviceName;
            span.Tags["operation.name"] = operationName;
            if (parentSpanId != null)
            {
                span.Tags["parent.span.id"] = parentSpanId;
            }

            lock (_lock)
            {
                _activeSpans[spanId] = span;
                if (_traces.ContainsKey(traceId))
                {
                    _traces[traceId].Add(span);
                }
            }

            _logger.LogDebug("Started span {SpanId} for trace {TraceId} operation {OperationName}",
                spanId, traceId, operationName);

            return spanId;
        }

        public async Task FinishSpanAsync(string spanId, Dictionary<string, object>? tags = null)
        {
            TraceSpan? span = null;

            lock (_lock)
            {
                if (_activeSpans.TryGetValue(spanId, out span))
                {
                    span.EndTime = DateTime.UtcNow;
                    span.Status = "completed";

                    if (tags != null)
                    {
                        foreach (var tag in tags)
                        {
                            span.Tags[tag.Key] = tag.Value;
                        }
                    }

                    _activeSpans.Remove(spanId);
                }
            }

            if (span != null)
            {
                _logger.LogDebug("Finished span {SpanId} for trace {TraceId} with duration {Duration}ms",
                    spanId, span.TraceId, span.Duration?.TotalMilliseconds);

                // Send to Jaeger if configured
                if (!string.IsNullOrEmpty(_jaegerEndpoint) && ShouldSample())
                {
                    await SendSpanToJaegerAsync(span);
                }
            }
        }

        public async Task LogEventAsync(string traceId, string spanId, string eventName, Dictionary<string, object>? data = null)
        {
            var traceEvent = new TraceEvent
            {
                EventId = Guid.NewGuid().ToString(),
                Name = eventName,
                Timestamp = DateTime.UtcNow,
                Data = data ?? new Dictionary<string, object>()
            };

            lock (_lock)
            {
                if (_activeSpans.TryGetValue(spanId, out var span))
                {
                    span.Events.Add(traceEvent);
                }
            }

            _logger.LogInformation("Logged event {EventName} for span {SpanId} in trace {TraceId}",
                eventName, spanId, traceId);
        }

        public async Task<TraceMetrics?> GetTraceMetricsAsync(string traceId)
        {
            List<TraceSpan>? spans;
            lock (_lock)
            {
                if (!_traces.TryGetValue(traceId, out spans))
                {
                    return null;
                }
                spans = new List<TraceSpan>(spans); // Create copy to avoid lock issues
            }

            var metrics = new TraceMetrics
            {
                TraceId = traceId,
                SpanCount = spans.Count
            };

            var completedSpans = spans.Where(s => s.EndTime.HasValue).ToList();
            if (completedSpans.Any())
            {
                var rootSpan = completedSpans.FirstOrDefault(s => s.ParentSpanId == null);
                if (rootSpan != null)
                {
                    metrics.TotalDuration = rootSpan.Duration ?? TimeSpan.Zero;
                }

                // Calculate service latencies
                foreach (var serviceGroup in completedSpans.GroupBy(s => s.ServiceName))
                {
                    var avgLatency = serviceGroup.Average(s => s.Duration?.TotalMilliseconds ?? 0);
                    metrics.ServiceLatencies[serviceGroup.Key] = avgLatency;
                }

                // Calculate operation counts
                foreach (var operationGroup in completedSpans.GroupBy(s => s.OperationName))
                {
                    metrics.OperationCounts[operationGroup.Key] = operationGroup.Count();
                }

                // Calculate error rate
                var errorSpans = completedSpans.Count(s => s.Tags.ContainsKey("error") && (bool)s.Tags["error"]);
                metrics.ErrorCount = errorSpans;
                metrics.ErrorRate = completedSpans.Count > 0 ? (double)errorSpans / completedSpans.Count : 0;

                // Calculate critical path
                metrics.CriticalPath = CalculateCriticalPath(completedSpans);
            }

            return metrics;
        }

        public async Task<List<TraceSpan>> GetTraceSpansAsync(string traceId)
        {
            lock (_lock)
            {
                if (_traces.TryGetValue(traceId, out var spans))
                {
                    return new List<TraceSpan>(spans);
                }
            }
            return new List<TraceSpan>();
        }

        public async Task FlushTracesAsync()
        {
            List<TraceSpan> allSpans;
            lock (_lock)
            {
                allSpans = _traces.Values.SelectMany(spans => spans).ToList();
            }

            if (!string.IsNullOrEmpty(_jaegerEndpoint))
            {
                foreach (var span in allSpans.Where(s => s.EndTime.HasValue))
                {
                    if (ShouldSample())
                    {
                        await SendSpanToJaegerAsync(span);
                    }
                }
            }

            _logger.LogInformation("Flushed {SpanCount} spans to tracing backend", allSpans.Count);
        }

        private string GenerateTraceId()
        {
            return Guid.NewGuid().ToString("N")[..16]; // 16-character hex string
        }

        private string GenerateSpanId()
        {
            return Guid.NewGuid().ToString("N")[..8]; // 8-character hex string
        }

        private bool ShouldSample()
        {
            if (!_enableSampling) return true;
            return Random.Shared.NextDouble() < _samplingRate;
        }

        private List<string> CalculateCriticalPath(List<TraceSpan> spans)
        {
            var criticalPath = new List<string>();

            // Find the root span
            var rootSpan = spans.FirstOrDefault(s => s.ParentSpanId == null);
            if (rootSpan == null) return criticalPath;

            // Build span hierarchy
            var spanDict = spans.ToDictionary(s => s.SpanId, s => s);
            var childrenDict = spans.GroupBy(s => s.ParentSpanId)
                .ToDictionary(g => g.Key, g => g.ToList());

            // Traverse the longest path
            TraverseLongestPath(rootSpan, spanDict, childrenDict, criticalPath);

            return criticalPath;
        }

        private void TraverseLongestPath(TraceSpan currentSpan, Dictionary<string, TraceSpan> spanDict,
            Dictionary<string, List<TraceSpan>> childrenDict, List<string> path)
        {
            path.Add(currentSpan.OperationName);

            if (childrenDict.TryGetValue(currentSpan.SpanId, out var children))
            {
                // Find child with longest duration
                var longestChild = children
                    .Where(c => c.Duration.HasValue && c.Duration.Value.TotalMilliseconds > 0)
                    .OrderByDescending(c => c.Duration!.Value.TotalMilliseconds)
                    .FirstOrDefault();

                if (longestChild != null)
                {
                    TraverseLongestPath(longestChild, spanDict, childrenDict, path);
                }
            }
        }

        private async Task SendSpanToJaegerAsync(TraceSpan span)
        {
            try
            {
                var jaegerSpan = new
                {
                    traceID = span.TraceId,
                    spanID = span.SpanId,
                    parentSpanID = span.ParentSpanId,
                    operationName = span.OperationName,
                    startTime = ((DateTimeOffset)span.StartTime).ToUnixTimeMilliseconds() * 1000, // microseconds
                    duration = (long)(span.Duration?.TotalMilliseconds * 1000 ?? 0), // microseconds
                    tags = span.Tags.Select(kvp => new { key = kvp.Key, value = kvp.Value.ToString() }).ToArray(),
                    logs = span.Events.Select(e => new
                    {
                        timestamp = ((DateTimeOffset)e.Timestamp).ToUnixTimeMilliseconds() * 1000,
                        fields = e.Data.Select(kvp => new { key = kvp.Key, value = kvp.Value.ToString() }).ToArray()
                    }).ToArray(),
                    process = new
                    {
                        serviceName = _serviceName,
                        tags = new[]
                        {
                            new { key = "service.name", value = _serviceName },
                            new { key = "service.version", value = "1.0.0" }
                        }
                    }
                };

                var json = JsonSerializer.Serialize(new { spans = new[] { jaegerSpan } });
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(_jaegerEndpoint, content);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to send span to Jaeger: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending span to Jaeger");
            }
        }
    }
}
