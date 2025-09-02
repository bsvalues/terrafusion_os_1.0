using System;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.Models
{
    public enum PluginStatus
    {
        Pending,        // Submitted, awaiting review
        Approved,       // Approved and available in the marketplace
        Rejected,       // Rejected during review
        Disabled        // Disabled by admin or author
    }

    public class Plugin
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string Version { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        [StringLength(50)]
        public string Category { get; set; }

        [Required]
        public string AuthorId { get; set; }

        public PluginStatus Status { get; set; }

        // URL to the stored plugin package (e.g., in Azure Blob Storage)
        public string PackageUrl { get; set; }

        // URL to the plugin's icon
        public string IconUrl { get; set; }

        // Stores permissions as a JSON array string
        public string PermissionsJson { get; set; }

        public DateTime SubmittedAt { get; set; }
        public DateTime? LastUpdatedAt { get; set; }
    }
}
