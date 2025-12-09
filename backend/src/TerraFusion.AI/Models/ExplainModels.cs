// ═══════════════════════════════════════════════════════════════════════════════
// 📚 TerraFusion ExplainGPT Models
// Phase 13: "Explain This" - Make TerraFusion Self-Explaining
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using System.ComponentModel.DataAnnotations;

namespace TerraFusion.AI.Models
{
    /// <summary>
    /// Request model for the ExplainGPT endpoint.
    /// Allows any screen/workflow/data in TerraFusion to explain itself.
    /// </summary>
    public class ExplainRequest
    {
        /// <summary>
        /// The type of context being explained.
        /// Examples: "GPTStudio", "PropertyCard", "AssessmentWorkflow", "RAGTrace"
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string ContextType { get; set; } = string.Empty;

        /// <summary>
        /// Optional identifier for a specific item within the context.
        /// Examples: property ID, workflow ID, conversation ID
        /// </summary>
        [MaxLength(200)]
        public string? ContextId { get; set; }

        /// <summary>
        /// Additional metadata to enrich the explanation.
        /// Examples: { "propertyType": "residential", "county": "benton" }
        /// </summary>
        public Dictionary<string, object>? Metadata { get; set; }

        /// <summary>
        /// Optional specific question about the context.
        /// If null, provides a general explanation.
        /// </summary>
        [MaxLength(500)]
        public string? Question { get; set; }

        /// <summary>
        /// Target audience for the explanation.
        /// Defaults to "county-staff" for government-appropriate language.
        /// </summary>
        [MaxLength(50)]
        public string Audience { get; set; } = "county-staff";
    }

    /// <summary>
    /// Response model for the ExplainGPT endpoint.
    /// </summary>
    public class ExplainResponse
    {
        /// <summary>
        /// The explanation text in plain language.
        /// </summary>
        public string Explanation { get; set; } = string.Empty;

        /// <summary>
        /// A short summary (1-2 sentences) for UI previews.
        /// </summary>
        public string Summary { get; set; } = string.Empty;

        /// <summary>
        /// Key points extracted from the explanation.
        /// </summary>
        public List<string> KeyPoints { get; set; } = new();

        /// <summary>
        /// Related topics or actions the user might want to explore.
        /// </summary>
        public List<RelatedAction> RelatedActions { get; set; } = new();

        /// <summary>
        /// Context type that was explained.
        /// </summary>
        public string ContextType { get; set; } = string.Empty;

        /// <summary>
        /// Processing time in milliseconds.
        /// </summary>
        public int ProcessingTimeMs { get; set; }

        /// <summary>
        /// Confidence score (0.0-1.0) of the explanation.
        /// </summary>
        public decimal Confidence { get; set; }
    }

    /// <summary>
    /// Related action suggestion from ExplainGPT.
    /// </summary>
    public class RelatedAction
    {
        /// <summary>
        /// Label for the action (e.g., "View Assessment History")
        /// </summary>
        public string Label { get; set; } = string.Empty;

        /// <summary>
        /// Action type (e.g., "navigate", "open-modal", "run-workflow")
        /// </summary>
        public string ActionType { get; set; } = string.Empty;

        /// <summary>
        /// Target for the action (e.g., route path, modal ID)
        /// </summary>
        public string Target { get; set; } = string.Empty;
    }
}
