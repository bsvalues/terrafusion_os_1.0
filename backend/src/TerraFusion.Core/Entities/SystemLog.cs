using System.ComponentModel.DataAnnotations;
using TerraFusion.Core.Enums;

namespace TerraFusion.Core.Entities;

public class SystemLog
{
    public int Id { get; set; }
    
    public LogLevel Level { get; set; }
    
    [Required]
    public string Message { get; set; } = string.Empty;
    
    [StringLength(4000)]
    public string? Exception { get; set; }
    
    [StringLength(100)]
    public string? Source { get; set; }
    
    [StringLength(100)]
    public string? UserId { get; set; }
    
    [StringLength(50)]
    public string? SessionId { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    [StringLength(200)]
    public string? RequestPath { get; set; }
    
    [StringLength(50)]
    public string? HttpMethod { get; set; }
    
    public int? StatusCode { get; set; }
}
