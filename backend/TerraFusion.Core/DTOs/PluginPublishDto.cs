using System.ComponentModel.DataAnnotations;
using System;

namespace TerraFusion.Core.DTOs
{
    public class PluginPublishDto
    {
        [Required]
        public Guid PluginId { get; set; }

        [Required]
        public string Version { get; set; }

        [Required]
        public string PackageB64 { get; set; }

        [Required]
        public string Signature { get; set; }

        [Required]
        public string PublicKeyPem { get; set; }
    }
}
