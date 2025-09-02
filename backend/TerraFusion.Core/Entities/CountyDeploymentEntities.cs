using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Entities
{
    public class CountyDeployment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CountyId { get; set; } = string.Empty;
        public string CountyName { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public int Population { get; set; }
        public CountyDeploymentType DeploymentType { get; set; }
        public List<string> RequestedModules { get; set; } = new();
        public DateTime DeployedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public CountyDeploymentStatus Status { get; set; }
        public string? ErrorMessage { get; set; }
        public string? Configuration { get; set; }
    }

    public enum CountyDeploymentType
    {
        Basic,
        Professional,
        Enterprise,
        Custom
    }

    public enum CountyDeploymentStatus
    {
        Pending,
        InProgress,
        Completed,
        Failed,
        RolledBack
    }

    public enum CountyStatus
    {
        Active,
        Inactive,
        Suspended,
        Maintenance
    }
}
