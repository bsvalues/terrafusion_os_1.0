using System.ComponentModel.DataAnnotations;
using System;

namespace TerraFusion.Core.DTOs
{
    public class PluginPublishDto
    {
        [Required]
        public Guid PluginId { get; set; }

        [Required]
        public required string Version { get; set; }

        [Required]
        public required string PackageB64 { get; set; }

        [Required]
        public required string Signature { get; set; }

        [Required]
        public required string PublicKeyPem { get; set; }
    }
}
