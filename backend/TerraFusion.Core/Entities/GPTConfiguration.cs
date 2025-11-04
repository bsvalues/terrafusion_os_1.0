// TerraFusionGPT Suite: Core Database Entities
// Elite Government OS Engineering - Moved from AI to Core for proper dependency chain

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities
{
    /// <summary>
    /// GPT Configuration entity - stores all GPT definitions
    /// </summary>
    [Table("GPTConfigurations")]
    public class GPTConfiguration
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string DisplayName { get; set; } = string.Empty;

        [Column(TypeName = "text")]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? IconUrl { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        public bool IsSystemGPT { get; set; } = false;
        public bool IsPublic { get; set; } = false;

        [MaxLength(450)]
        public string? CreatedByUserId { get; set; }

        public int? CountyId { get; set; }

        // Model Configuration
        [Required]
        [MaxLength(50)]
        public string ModelProvider { get; set; } = string.Empty; // OpenAI, Anthropic, Azure, Local

        [Required]
        [MaxLength(100)]
        public string ModelName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "text")]
        public string SystemPrompt { get; set; } = string.Empty;

        [Column(TypeName = "decimal(3,2)")]
        public decimal Temperature { get; set; } = 0.7m;

        public int MaxTokens { get; set; } = 4000;

        [Column(TypeName = "decimal(3,2)")]
        public decimal TopP { get; set; } = 1.0m;

        [Column(TypeName = "decimal(3,2)")]
        public decimal FrequencyPenalty { get; set; } = 0.0m;

        [Column(TypeName = "decimal(3,2)")]
        public decimal PresencePenalty { get; set; } = 0.0m;

        // RAG Configuration
        public bool EnableRAG { get; set; } = false;
        public int? RAGDatasetId { get; set; }
        public int RAGTopK { get; set; } = 5;

        [Column(TypeName = "decimal(3,2)")]
        public decimal RAGScoreThreshold { get; set; } = 0.7m;

        // Function Calling
        public bool EnableFunctions { get; set; } = false;

        [Column(TypeName = "jsonb")]
        public string? FunctionsJson { get; set; }

        // Access Control
        [MaxLength(100)]
        public string? RequiredRole { get; set; }

        [Column(TypeName = "jsonb")]
        public string? AllowedCounties { get; set; }

        // Usage & Analytics
        public long TotalConversations { get; set; } = 0;
        public long TotalMessages { get; set; } = 0;
        public long TotalTokensUsed { get; set; } = 0;

        [Column(TypeName = "decimal(18,4)")]
        public decimal TotalCost { get; set; } = 0;

        [Column(TypeName = "decimal(3,2)")]
        public decimal? AverageRating { get; set; }

        public int RatingCount { get; set; } = 0;

        // Marketplace
        public int InstallCount { get; set; } = 0;
        public bool IsFeatured { get; set; } = false;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; } = 0;

        // Status
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Archived, UnderReview

        [MaxLength(20)]
        public string Version { get; set; } = "1.0";

        // Audit fields
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string UpdatedBy { get; set; } = "System";
    }

    /// <summary>
    /// GPT Conversation entity - stores conversation sessions
    /// </summary>
    [Table("GPTConversations")]
    public class GPTConversation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int GPTConfigurationId { get; set; }

        [Required]
        [MaxLength(450)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public int CountyId { get; set; }

        [MaxLength(500)]
        public string? Title { get; set; }

        // Conversation metadata
        public int TotalMessages { get; set; } = 0;
        public long TotalTokensUsed { get; set; } = 0;

        [Column(TypeName = "decimal(18,4)")]
        public decimal TotalCost { get; set; } = 0;

        public int? Duration { get; set; } // seconds

        // Rating & Feedback
        public int? Rating { get; set; } // 1-5 stars

        [Column(TypeName = "text")]
        public string? Feedback { get; set; }

        // Status
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active"; // Active, Archived, Deleted

        // Audit
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastMessageAt { get; set; }

        // Navigation properties
        [ForeignKey("GPTConfigurationId")]
        public GPTConfiguration? GPTConfiguration { get; set; }
    }
}
