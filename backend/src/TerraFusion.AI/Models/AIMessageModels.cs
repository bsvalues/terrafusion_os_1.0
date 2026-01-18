/**
 * ═══════════════════════════════════════════════════════════════
 * AI MESSAGE MODELS - Request/Response DTOs
 * TerraFusion.AI - Elite Government AI Integration
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

using System;
using System.Collections.Generic;

namespace TerraFusion.AI.Models
{
    /// <summary>
    /// AI Message Request Model
    /// </summary>
    public class AIMessageRequest
    {
        public string CountyId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public MessageContext? Context { get; set; }
    }

    /// <summary>
    /// Message Context Model
    /// </summary>
    public class MessageContext
    {
        public string? PropertyId { get; set; }
        public string? SessionId { get; set; }
        public Dictionary<string, string>? AdditionalData { get; set; }
    }

    /// <summary>
    /// AI Message Response Model
    /// </summary>
    public class AIMessageResponse
    {
        public string MessageId { get; set; } = string.Empty;
        public string Response { get; set; } = string.Empty;
        public decimal Confidence { get; set; }
        public List<AIInsight> Insights { get; set; } = new();
        public int ProcessingTimeMs { get; set; }
        public bool Success { get; set; } = true;
    }

    /// <summary>
    /// AI Insight Model
    /// </summary>
    public class AIInsight
    {
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }
}
