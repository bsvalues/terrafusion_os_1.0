using System.Collections.Generic;
using System.Threading.Tasks;
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Services
{
    public interface IKnowledgeBaseService
    {
        Task<SearchResultDto> SearchAsync(string query, SearchFiltersDto filters, int page, int limit);
        Task<KnowledgeBaseItemDto?> GetByIdAsync(string id);
        Task RecordViewAsync(string itemId, string userId);

        Task<List<CategoryTreeDto>> GetCategoryTreeAsync();
        Task<List<KnowledgeBaseItemDto>> GetPopularItemsAsync(int limit);
        Task<List<KnowledgeBaseItemDto>> GetRecentlyUpdatedAsync(int limit);
        Task<List<KnowledgeBaseItemDto>> GetRelatedItemsAsync(string itemId, int limit);

        Task SubmitFeedbackAsync(string itemId, FeedbackDto feedback, string userId);
        Task<BookmarkResultDto> ToggleBookmarkAsync(string itemId, string userId);
        Task<List<KnowledgeBaseItemDto>> GetBookmarkedItemsAsync(string userId);

        Task<List<string>> GetSearchSuggestionsAsync(string partialQuery);
        Task<List<string>> GetAllTagsAsync();
        Task<SearchAnalyticsDto> GetSearchAnalyticsAsync(DateRangeDto dateRange);

        Task<List<KnowledgeBaseItemDto>> GetAIRecommendationsAsync(
            string userId,
            string userRole,
            Dictionary<string, object> currentContext,
            int limit);

        Task<byte[]> ExportSearchResultsAsync(string query, SearchFiltersDto filters, string format);
        Task<SearchResultDto> AdvancedSearchAsync(AdvancedSearchRequestDto request);

        Task<KnowledgeBaseItemDto> CreateItemAsync(CreateKnowledgeBaseItemDto createDto, string userId);
        Task<KnowledgeBaseItemDto?> UpdateItemAsync(string id, UpdateKnowledgeBaseItemDto updateDto, string userId);
        Task<bool> DeleteItemAsync(string id, string userId);
    }
}
