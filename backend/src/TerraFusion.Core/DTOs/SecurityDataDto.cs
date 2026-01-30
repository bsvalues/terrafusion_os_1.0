namespace TerraFusion.Core.DTOs
{
    public class SecurityDataDto
    {
        public int ThreatsDetected { get; set; }
        public int AnomaliesFound { get; set; }
        public double SystemResilienceScore { get; set; }
        public List<ThreatDetailsDto> RecentThreats { get; set; } = new List<ThreatDetailsDto>();
    }

    public class ThreatDetailsDto
    {
        public string ThreatType { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
