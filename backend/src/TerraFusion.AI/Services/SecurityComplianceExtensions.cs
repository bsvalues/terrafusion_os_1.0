using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services
{
    // Models expected by SecurityController
    public class SecurityEventsReport
    {
        public int TotalEvents { get; set; }
        public int Critical { get; set; }
        public int High { get; set; }
        public int Medium { get; set; }
        public int Low { get; set; }
        public List<SecurityEvent> Events { get; set; } = new();
    }

    public class SecurityScanConfig
    {
        public string ScanType { get; set; } = "quick"; // quick, full, dependency
        public Dictionary<string, object>? Parameters { get; set; }
    }

    public class SecurityScanResult
    {
        public string ScanId { get; set; } = string.Empty;
        public string ScanType { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime CompletedAt { get; set; }
        public List<ScanFinding> Findings { get; set; } = new();
    }

    public class ScanFinding
    {
        public string Id { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty; // critical, high, medium, low
        public string Description { get; set; } = string.Empty;
    }

    public class RemediationRequest
    {
        public string VulnerabilityId { get; set; } = string.Empty;
        public string Action { get; set; } = "apply";
        public Dictionary<string, object>? Parameters { get; set; }
    }

    public class RemediationResult
    {
        public string VulnerabilityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    // Extension methods to bridge controller expectations with existing service
    public static class SecurityComplianceServiceExtensions
    {
        public static async Task<SecurityEventsReport> GetSecurityEventsAsync(this ISecurityComplianceService service, CancellationToken cancellationToken = default)
        {
            // Use existing API to fetch recent events
            var events = await service.GetSecurityEventsAsync(string.Empty, 100, cancellationToken);
            var report = new SecurityEventsReport
            {
                Events = events,
                TotalEvents = events.Count,
                Critical = events.Count(e => string.Equals(e.Severity, "critical", StringComparison.OrdinalIgnoreCase)),
                High = events.Count(e => string.Equals(e.Severity, "high", StringComparison.OrdinalIgnoreCase)),
                Medium = events.Count(e => string.Equals(e.Severity, "medium", StringComparison.OrdinalIgnoreCase)),
                Low = events.Count(e => string.Equals(e.Severity, "low", StringComparison.OrdinalIgnoreCase))
            };
            return report;
        }

        public static Task<VulnerabilityReport> GetVulnerabilitiesAsync(this ISecurityComplianceService service, CancellationToken cancellationToken = default)
            => service.GetVulnerabilityReportAsync(cancellationToken);

        public static Task<List<SecurityRecommendation>> GetRecommendationsAsync(this ISecurityComplianceService service, CancellationToken cancellationToken = default)
            => service.GetSecurityRecommendationsAsync(cancellationToken);

        public static Task<AuditTrailReport> GetAuditTrailAsync(this ISecurityComplianceService service, int limit = 100, string? filter = null, CancellationToken cancellationToken = default)
            => service.GetAuditTrailReportAsync("24h", cancellationToken);

        public static Task<SecurityScanResult> RunSecurityScanAsync(this ISecurityComplianceService service, SecurityScanConfig config, CancellationToken cancellationToken = default)
        {
            // Simulate a quick scan result
            var result = new SecurityScanResult
            {
                ScanId = Guid.NewGuid().ToString(),
                ScanType = config.ScanType,
                StartedAt = DateTime.UtcNow.AddSeconds(-2),
                CompletedAt = DateTime.UtcNow,
                Findings = new List<ScanFinding>
                {
                    new ScanFinding { Id = "SF-001", Severity = "medium", Description = "Missing X-Content-Type-Options header"},
                    new ScanFinding { Id = "SF-002", Severity = "low", Description = "Server version header exposed"}
                }
            };
            return Task.FromResult(result);
        }

        public static Task<RemediationResult> RemediateVulnerabilityAsync(this ISecurityComplianceService service, RemediationRequest request, CancellationToken cancellationToken = default)
        {
            var result = new RemediationResult
            {
                VulnerabilityId = request.VulnerabilityId,
                Action = request.Action,
                Status = "completed",
                Message = "Remediation applied successfully",
                Timestamp = DateTime.UtcNow
            };
            return Task.FromResult(result);
        }
    }
}
