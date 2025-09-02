using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    public class PluginSubmissionDto
    {
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        [Required]
        [RegularExpression(@"^\d+\.\d+\.\d+$", ErrorMessage = "Version must follow semver format (x.y.z)")]
        public required string Version { get; set; }

        [Required]
        public required string Description { get; set; }

        [Required]
        public required string Category { get; set; }

        // Represents the plugin package as a base64 encoded string or a URL to the package
        [Required]
        public required string PackageData { get; set; }

        // The plugin manifest content
        [Required]
        public required string ManifestJson { get; set; }
        
        // Security properties for signature verification
        public string Signature { get; set; } = string.Empty;
        public string PublicKeyPem { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
    }
}
