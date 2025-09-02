using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    public class PluginSubmissionDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [RegularExpression(@"^\d+\.\d+\.\d+$", ErrorMessage = "Version must follow semver format (x.y.z)")]
        public string Version { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public string Category { get; set; }

        // Represents the plugin package as a base64 encoded string or a URL to the package
        [Required]
        public string PackageData { get; set; }

        // The plugin manifest content
        [Required]
        public string ManifestJson { get; set; }
        
        // Security properties for signature verification
        public string Signature { get; set; } = string.Empty;
        public string PublicKeyPem { get; set; } = string.Empty;
        public string AuthorId { get; set; } = string.Empty;
    }
}
