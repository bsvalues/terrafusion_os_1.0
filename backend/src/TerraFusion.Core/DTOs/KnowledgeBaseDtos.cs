using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.Core.DTOs
{
    // Core item DTO
    public class KnowledgeBaseItemDto
    {
        [Required]
        public string Id { get; set; } = string.Empty;
        [Required]
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string> Categories { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public string Type { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    // Category tree for navigation
    public class CategoryTreeDto
    {
        public string Name { get; set; } = string.Empty;
        public List<CategoryTreeDto> Children { get; set; } = new();
    }

    // Feedback submission
    public class FeedbackDto
    {
        [Range(1,5)]
        public int Rating { get; set; } = 5;
        public string Comment { get; set; } = string.Empty;
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    // Bookmark result
    public class BookmarkResultDto
    {
        public bool IsBookmarked { get; set; }
        public int TotalBookmarks { get; set; }
    }

    // Search filters and range
    // DateRangeDto moved to dedicated file to avoid duplication

    public class SearchFiltersDto
    {
        public List<string> Categories { get; set; } = new();
        public List<string> Types { get; set; } = new();
        public List<string> Difficulty { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public DateRangeDto? DateRange { get; set; }
    }

    public class SearchResultDto
    {
        public List<KnowledgeBaseItemDto> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
    }

    // Analytics output
    public class SearchAnalyticsDto
    {
        public int TotalSearches { get; set; }
        public List<string> TopQueries { get; set; } = new();
        public List<string> TopCategories { get; set; } = new();
        public Dictionary<string, int> TagUsage { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    // AI recommendation request
    public class AIRecommendationRequestDto
    {
        [Required]
        public string UserRole { get; set; } = string.Empty;
        public Dictionary<string, object> CurrentContext { get; set; } = new();
        [Range(1, 100)]
        public int Limit { get; set; } = 10;
    }

    // Advanced search request
    public class AdvancedSearchRequestDto
    {
        public string Query { get; set; } = string.Empty;
        public SearchFiltersDto Filters { get; set; } = new();
        public int Page { get; set; } = 1;
        public int Limit { get; set; } = 20;
        public string SortBy { get; set; } = "relevance";
        public bool Desc { get; set; } = true;
    }

    // Create/Update DTOs
    public class CreateKnowledgeBaseItemDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        [Required]
        public string Content { get; set; } = string.Empty;
        public List<string> Categories { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public string Type { get; set; } = string.Empty;
    }

    public class UpdateKnowledgeBaseItemDto
    {
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? Content { get; set; }
        public List<string>? Categories { get; set; }
        public List<string>? Tags { get; set; }
        public string? Type { get; set; }
    }
}
