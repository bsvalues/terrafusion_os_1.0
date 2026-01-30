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

    // ═══════════════════════════════════════════════════════════════════════════════
    // Phase 25: ExplainGPT v2 - Source Highlighting & Trace Carousel
    // ═══════════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Phase 25: Source attribution for an explanation.
    /// Links a specific source document/trace entry to the explanation.
    /// </summary>
    public sealed class ExplainSourceAttributionDto
    {
        /// <summary>
        /// Unique identifier for this source (e.g., RAG doc id, trace entry id).
        /// </summary>
        public string SourceId { get; init; } = string.Empty;

        /// <summary>
        /// Human-readable title for the source (e.g., "Parcel 123 Summary").
        /// </summary>
        public string SourceTitle { get; init; } = string.Empty;

        /// <summary>
        /// Type of source: "rag", "note", "external", "cama", "policy".
        /// </summary>
        public string SourceType { get; init; } = "rag";

        /// <summary>
        /// Short text excerpt from the source (typically first 200 chars).
        /// </summary>
        public string? Snippet { get; init; }

        /// <summary>
        /// Relevance score (0.0-1.0) if available from RAG retrieval.
        /// </summary>
        public decimal? RelevanceScore { get; init; }
    }

    /// <summary>
    /// Phase 25: A segment of the explanation with source attribution.
    /// Allows fine-grained linking between explanation text and sources.
    /// </summary>
    public sealed class ExplainSegmentDto
    {
        /// <summary>
        /// Unique identifier for this segment (e.g., "S1", "S2").
        /// </summary>
        public string SegmentId { get; init; } = string.Empty;

        /// <summary>
        /// The explanation text for this segment.
        /// </summary>
        public string Text { get; init; } = string.Empty;

        /// <summary>
        /// Source IDs that support this segment.
        /// </summary>
        public IReadOnlyList<string> SourceIds { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Phase 25: A step in the explanation trace (carousel step).
    /// Provides step-by-step breakdown of how the explanation was generated.
    /// </summary>
    public sealed class ExplainStepDto
    {
        /// <summary>
        /// Unique identifier for this step (e.g., "step1", "step2").
        /// </summary>
        public string StepId { get; init; } = string.Empty;

        /// <summary>
        /// Human-readable title (e.g., "Step 1 – Identify comparables").
        /// </summary>
        public string Title { get; init; } = string.Empty;

        /// <summary>
        /// Optional detailed description of this step.
        /// </summary>
        public string? Description { get; init; }

        /// <summary>
        /// Source IDs relevant to this step.
        /// </summary>
        public IReadOnlyList<string> SourceIds { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Phase 25: Enhanced ExplainGPT response with source highlighting and trace steps.
    /// Backward compatible with v1 (segments/sources/steps can be empty).
    /// </summary>
    public sealed class ExplainResponseV2Dto
    {
        /// <summary>
        /// Unique identifier for this explanation (for audit trail).
        /// </summary>
        public string ExplanationId { get; init; } = Guid.NewGuid().ToString("N")[..12];

        /// <summary>
        /// The full explanation text (same as v1 Explanation field).
        /// </summary>
        public string FullText { get; init; } = string.Empty;

        /// <summary>
        /// Short summary (1-2 sentences) for UI previews.
        /// </summary>
        public string? Summary { get; init; }

        /// <summary>
        /// Key points extracted from the explanation.
        /// </summary>
        public IReadOnlyList<string> KeyPoints { get; init; } = Array.Empty<string>();

        /// <summary>
        /// Context type that was explained.
        /// </summary>
        public string ContextType { get; init; } = string.Empty;

        /// <summary>
        /// Processing time in milliseconds.
        /// </summary>
        public int ProcessingTimeMs { get; set; }

        /// <summary>
        /// Confidence score (0.0-1.0) of the explanation.
        /// </summary>
        public decimal Confidence { get; init; }

        // ═══════════════════════════════════════════════════════════════════════
        // Phase 25: New V2 Fields
        // ═══════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Explanation broken into segments with source attribution.
        /// If empty, frontend shows FullText as single block (v1 behavior).
        /// </summary>
        public IReadOnlyList<ExplainSegmentDto> Segments { get; init; } = Array.Empty<ExplainSegmentDto>();

        /// <summary>
        /// All sources that contributed to this explanation.
        /// </summary>
        public IReadOnlyList<ExplainSourceAttributionDto> Sources { get; init; } = Array.Empty<ExplainSourceAttributionDto>();

        /// <summary>
        /// Step-by-step trace of how the explanation was generated.
        /// If empty, frontend hides the steps carousel.
        /// </summary>
        public IReadOnlyList<ExplainStepDto> Steps { get; init; } = Array.Empty<ExplainStepDto>();

        /// <summary>
        /// Related actions user might want to take.
        /// </summary>
        public IReadOnlyList<RelatedAction> RelatedActions { get; init; } = Array.Empty<RelatedAction>();
    }
}
