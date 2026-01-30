using System;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    public class AICommandDto
    {
        public int Id { get; set; }
        
        [Required]
        public required string Command { get; set; }
        
        [Required]
        public required string CommandType { get; set; }
        
        public required string Parameters { get; set; } // JSON parameters
        
        public int? TargetAgentId { get; set; }
        
        public required string TargetAgentType { get; set; }
        
        public string Status { get; set; } = "Pending";
        
        public required string Result { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExecutedAt { get; set; }
        
        public DateTime? CompletedAt { get; set; }
        
        public required string CreatedBy { get; set; }
        
        public int Priority { get; set; } = 0;
        
        public required string ErrorMessage { get; set; }
        
        public int RetryCount { get; set; } = 0;
        
        public int MaxRetries { get; set; } = 3;
    }
    
    public class AICommandCreateDto
    {
        [Required]
        public required string Command { get; set; }
        
        [Required]
        public required string CommandType { get; set; }
        
        public required string Parameters { get; set; }
        
        public int? TargetAgentId { get; set; }
        
        public required string TargetAgentType { get; set; }
        
        public int Priority { get; set; } = 0;
    }
    
    public class AICommandResponseDto
    {
        public int Id { get; set; }
        public required string Status { get; set; }
        public required string Result { get; set; }
        public required string ErrorMessage { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}