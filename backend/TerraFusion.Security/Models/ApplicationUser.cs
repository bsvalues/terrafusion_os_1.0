using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Security.Models
{
    public class ApplicationUser
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? County { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastLoginAt { get; set; }
        
        public List<string> Roles { get; set; } = new();
        
        public List<string> Permissions { get; set; } = new();
        
        public string? PasswordHash { get; set; }
        
        public bool MfaEnabled { get; set; }
        
        public DateTime? PasswordChangedAt { get; set; }
    }
}
