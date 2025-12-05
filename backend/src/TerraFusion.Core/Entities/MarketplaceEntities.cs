using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities
{
    public class PluginSubmission
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public DateTime SubmittedAt { get; set; }
        public PluginStatus Status { get; set; }
        public string? ReviewNotes { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }

    public class PluginInstallation
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PluginId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public DateTime InstalledAt { get; set; }
        public DateTime? UninstalledAt { get; set; }
        public PluginInstallationStatus Status { get; set; }
        public string? Configuration { get; set; }
    }

    public class PluginRevenue
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PluginId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string? TransactionId { get; set; }
    }

    public class PluginAnalytics
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string PluginId { get; set; } = string.Empty;
        public string CountyId { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public DateTime RecordedAt { get; set; }
        public string? Metrics { get; set; }
    }

    public enum PluginStatus
    {
        Pending,
        Approved,
        Rejected,
        Suspended
    }

    public enum PluginInstallationStatus
    {
        Active,
        Inactive,
        Suspended,
        Updating
    }
}
