namespace TerraFusion.Core.DTOs
{
    public class PluginSubmissionResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? PluginId { get; set; }
    }

    public class PluginInstallationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class PluginRevenue
    {
        public string PluginId { get; set; } = string.Empty;
        public string PluginName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int Installations { get; set; }
        public double Growth { get; set; }
    }

    public class PluginAnalytics
    {
        public string PluginId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public DateTime RecordedAt { get; set; }
        public string? Metrics { get; set; }
    }

}
