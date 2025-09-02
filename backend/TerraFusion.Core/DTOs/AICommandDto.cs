using System;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    public class AICommandDto
    {
        public int Id { get; set; }
        
        [Required]
        public string Command { get; set; }
        
        [Required]
        public string CommandType { get; set; }
        
        public string Parameters { get; set; } // JSON parameters
        
        public int? TargetAgentId { get; set; }
        
        public string TargetAgentType { get; set; }
        
        public string Status { get; set; } = "Pending";
        
        public string Result { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExecutedAt { get; set; }
        
        public DateTime? CompletedAt { get; set; }
        
        public string CreatedBy { get; set; }
        
        public int Priority { get; set; } = 0;
        
        public string ErrorMessage { get; set; }
        
        public int RetryCount { get; set; } = 0;
        
        public int MaxRetries { get; set; } = 3;
    }
    
    public class AICommandCreateDto
    {
        [Required]
        public string Command { get; set; }
        
        [Required]
        public string CommandType { get; set; }
        
        public string Parameters { get; set; }
        
        public int? TargetAgentId { get; set; }
        
        public string TargetAgentType { get; set; }
        
        public int Priority { get; set; } = 0;
    }
    
    public class AICommandResponseDto
    {
        public int Id { get; set; }
        public string Status { get; set; }
        public string Result { get; set; }
        public string ErrorMessage { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}