using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Services
{
    public class SecurityService : ISecurityService
    {
        public System.Threading.Tasks.Task<SecurityDataDto> GetSecurityDataAsync()
        {
            var mockData = new SecurityDataDto
            {
                ThreatsDetected = 42,
                AnomaliesFound = 13,
                SystemResilienceScore = 0.99,
                RecentThreats = new List<ThreatDetailsDto>
                {
                    new ThreatDetailsDto { ThreatType = "Anomalous Login", Severity = "High", Timestamp = DateTime.UtcNow.AddHours(-1), Status = "Mitigated" },
                    new ThreatDetailsDto { ThreatType = "Data Exfiltration Attempt", Severity = "Critical", Timestamp = DateTime.UtcNow.AddHours(-3), Status = "Blocked" },
                    new ThreatDetailsDto { ThreatType = "SQL Injection", Severity = "Medium", Timestamp = DateTime.UtcNow.AddDays(-1), Status = "Investigating" },
                }
            };

            return Task.FromResult(mockData);
        }
    }
}
