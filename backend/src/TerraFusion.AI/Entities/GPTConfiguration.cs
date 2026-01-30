// TerraFusionGPT Suite: Database Entities (Extended AI Entities)
// Elite Government OS Engineering - AI Platform
// Note: GPTConfiguration and GPTConversation moved to TerraFusion.Core.Entities

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TerraFusion.Core.Entities;

namespace TerraFusion.AI.Entities
{
    // NOTE: GPTConfiguration and GPTConversation have been moved to TerraFusion.Core.Entities
    // to resolve circular dependency issues (Core → AI → Core)
    // Use: using TerraFusion.Core.Entities; to access these types

    /// <summary>
    /// GPT Message entity - stores individual messages
    /// </summary>
    [Table("GPTMessages")]
    public class GPTMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ConversationId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = string.Empty; // user, assistant, system, function

        [Required]
        [Column(TypeName = "text")]
        public string Content { get; set; } = string.Empty;

        // Token usage
        public int PromptTokens { get; set; } = 0;
        public int CompletionTokens { get; set; } = 0;
        public int TotalTokens { get; set; } = 0;

        [Column(TypeName = "decimal(18,6)")]
        public decimal Cost { get; set; } = 0;

        // Model info
        [MaxLength(100)]
        public string? ModelUsed { get; set; }

        [MaxLength(50)]
        public string? Provider { get; set; }

        // Function calling
        [MaxLength(200)]
        public string? FunctionName { get; set; }

        [Column(TypeName = "jsonb")]
        public string? FunctionArgs { get; set; }

        [Column(TypeName = "jsonb")]
        public string? FunctionResult { get; set; }

        // RAG info
        [Column(TypeName = "jsonb")]
        public string? RAGDocumentsUsed { get; set; }

        [Column(TypeName = "decimal(3,2)")]
        public decimal? RAGScore { get; set; }

        // Metadata
        public int? ResponseTime { get; set; } // milliseconds

        [MaxLength(50)]
        public string? FinishReason { get; set; }

        public DateTime CreatedAt { get; set; }

        // Navigation properties
        [ForeignKey("ConversationId")]
        public GPTConversation? Conversation { get; set; }
    }

    /// <summary>
    /// RAG Dataset entity - stores document collections
    /// </summary>
    [Table("RAGDatasets")]
    public class RAGDataset
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Column(TypeName = "text")]
        public string? Description { get; set; }

        public int? CountyId { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        // Embeddings configuration
        [Required]
        [MaxLength(50)]
        public string EmbeddingProvider { get; set; } = "OpenAI";

        [Required]
        [MaxLength(100)]
        public string EmbeddingModel { get; set; } = "text-embedding-3-small";

        public int VectorDimension { get; set; } = 1536;

        // Statistics
        public int DocumentCount { get; set; } = 0;
        public int TotalChunks { get; set; } = 0;
        public DateTime? LastIndexedAt { get; set; }

        // Status
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string UpdatedBy { get; set; } = "System";
    }

    /// <summary>
    /// RAG Document entity - individual documents in datasets
    /// </summary>
    [Table("RAGDocuments")]
    public class RAGDocument
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DatasetId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "text")]
        public string Content { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? SourceUrl { get; set; }

        [MaxLength(100)]
        public string? DocumentType { get; set; }

        // Metadata
        [MaxLength(200)]
        public string? Author { get; set; }

        public DateTime? PublishedDate { get; set; }

        [Column(TypeName = "jsonb")]
        public string? Tags { get; set; }

        [Column(TypeName = "jsonb")]
        public string? Metadata { get; set; }

        // Processing
        public int ChunkCount { get; set; } = 0;
        public DateTime? ProcessedAt { get; set; }
        public DateTime? IndexedAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("DatasetId")]
        public RAGDataset? Dataset { get; set; }
    }

    /// <summary>
    /// RAG Embedding entity - stores vector embeddings for document chunks
    /// Uses pgvector extension for similarity search
    /// </summary>
    [Table("RAGEmbeddings")]
    public class RAGEmbedding
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int DocumentId { get; set; }

        [Required]
        public int DatasetId { get; set; }

        /// <summary>
        /// Chunk index within the document (0-based)
        /// </summary>
        public int ChunkIndex { get; set; }

        /// <summary>
        /// The text content of this chunk
        /// </summary>
        [Required]
        [Column(TypeName = "text")]
        public string ChunkText { get; set; } = string.Empty;

        /// <summary>
        /// The vector embedding (pgvector type)
        /// Stored as float[] in EF Core, mapped to vector(1536) in PostgreSQL
        /// </summary>
        [Required]
        [Column(TypeName = "vector(1536)")]
        public float[] Embedding { get; set; } = Array.Empty<float>();

        /// <summary>
        /// Token count of this chunk
        /// </summary>
        public int TokenCount { get; set; }

        /// <summary>
        /// Character start position in original document
        /// </summary>
        public int StartPosition { get; set; }

        /// <summary>
        /// Character end position in original document
        /// </summary>
        public int EndPosition { get; set; }

        /// <summary>
        /// Optional metadata for this chunk (JSON)
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? Metadata { get; set; }

        public DateTime CreatedAt { get; set; }

        // Navigation properties
        [ForeignKey("DocumentId")]
        public RAGDocument? Document { get; set; }

        [ForeignKey("DatasetId")]
        public RAGDataset? Dataset { get; set; }
    }

    /// <summary>
    /// GPT Marketplace Install entity - tracks installations
    /// </summary>
    [Table("GPTMarketplaceInstalls")]
    public class GPTMarketplaceInstall
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

        // Install metadata
        [MaxLength(20)]
        public string? Version { get; set; }

        public DateTime InstallDate { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public int UsageCount { get; set; } = 0;

        // Rating
        public int? Rating { get; set; }

        [Column(TypeName = "text")]
        public string? Review { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("GPTConfigurationId")]
        public GPTConfiguration? GPTConfiguration { get; set; }
    }

    /// <summary>
    /// GPT Usage Metrics entity - detailed usage tracking
    /// </summary>
    [Table("GPTUsageMetrics")]
    public class GPTUsageMetric
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int GPTConfigurationId { get; set; }

        public int? ConversationId { get; set; }
        public int? MessageId { get; set; }

        [Required]
        [MaxLength(450)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public int CountyId { get; set; }

        // Usage details
        [Required]
        [MaxLength(50)]
        public string Provider { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ModelName { get; set; } = string.Empty;

        public int PromptTokens { get; set; } = 0;
        public int CompletionTokens { get; set; } = 0;
        public int TotalTokens { get; set; } = 0;

        // Cost calculation
        [Column(TypeName = "decimal(18,6)")]
        public decimal PromptTokenCost { get; set; } = 0;

        [Column(TypeName = "decimal(18,6)")]
        public decimal CompletionTokenCost { get; set; } = 0;

        [Column(TypeName = "decimal(18,6)")]
        public decimal TotalCost { get; set; } = 0;

        // Performance
        public int? ResponseTime { get; set; } // milliseconds
        public bool Success { get; set; } = true;

        [Column(TypeName = "text")]
        public string? ErrorMessage { get; set; }

        public DateTime Timestamp { get; set; }

        // Navigation properties
        [ForeignKey("GPTConfigurationId")]
        public GPTConfiguration? GPTConfiguration { get; set; }
    }

    /// <summary>
    /// GPT Audit entity - RAG traceability and audit logging
    /// Phase 11: Every GPT/RAG answer is auditable
    /// </summary>
    [Table("GPTAudit")]
    public class GPTAudit
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// The message this audit entry relates to
        /// </summary>
        [Required]
        public int MessageId { get; set; }

        /// <summary>
        /// Conversation context
        /// </summary>
        [Required]
        public int ConversationId { get; set; }

        /// <summary>
        /// GPT configuration used
        /// </summary>
        [Required]
        public int GPTConfigurationId { get; set; }

        /// <summary>
        /// User who initiated the request
        /// </summary>
        [Required]
        [MaxLength(450)]
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// County context for data isolation
        /// </summary>
        [Required]
        public int CountyId { get; set; }

        // RAG Traceability
        /// <summary>
        /// Whether RAG was used for this response
        /// </summary>
        public bool RAGUsed { get; set; } = false;

        /// <summary>
        /// RAG dataset ID that was queried
        /// </summary>
        public int? RAGDatasetId { get; set; }

        /// <summary>
        /// JSON array of document IDs retrieved from RAG
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? RAGDocumentIds { get; set; }

        /// <summary>
        /// JSON array of chunk IDs with their similarity scores
        /// Format: [{"chunkId": 1, "score": 0.95, "text": "..."}, ...]
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? RAGChunkDetails { get; set; }

        /// <summary>
        /// Number of RAG chunks retrieved
        /// </summary>
        public int RAGChunksRetrieved { get; set; } = 0;

        /// <summary>
        /// Average similarity score across retrieved chunks
        /// </summary>
        [Column(TypeName = "decimal(5,4)")]
        public decimal? RAGAverageScore { get; set; }

        // Embedding Provider Info
        /// <summary>
        /// Embedding service used: "OpenAI" or "Simulated"
        /// </summary>
        [MaxLength(50)]
        public string? EmbeddingProvider { get; set; }

        /// <summary>
        /// Embedding model used (e.g., "text-embedding-3-small")
        /// </summary>
        [MaxLength(100)]
        public string? EmbeddingModel { get; set; }

        // LLM Provider Info
        /// <summary>
        /// LLM provider used for response generation
        /// </summary>
        [MaxLength(50)]
        public string? LLMProvider { get; set; }

        /// <summary>
        /// LLM model used for response generation
        /// </summary>
        [MaxLength(100)]
        public string? LLMModel { get; set; }

        // Performance Metrics
        /// <summary>
        /// Time spent on RAG retrieval (ms)
        /// </summary>
        public int? RAGRetrievalTimeMs { get; set; }

        /// <summary>
        /// Time spent on LLM generation (ms)
        /// </summary>
        public int? LLMGenerationTimeMs { get; set; }

        /// <summary>
        /// Total end-to-end time (ms)
        /// </summary>
        public int? TotalResponseTimeMs { get; set; }

        // Audit Metadata
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Source IP or client identifier for audit trail
        /// </summary>
        [MaxLength(100)]
        public string? ClientInfo { get; set; }

        // Navigation properties
        [ForeignKey("MessageId")]
        public GPTMessage? Message { get; set; }

        [ForeignKey("ConversationId")]
        public GPTConversation? Conversation { get; set; }

        [ForeignKey("GPTConfigurationId")]
        public GPTConfiguration? GPTConfiguration { get; set; }

        [ForeignKey("RAGDatasetId")]
        public RAGDataset? RAGDataset { get; set; }
    }
}
