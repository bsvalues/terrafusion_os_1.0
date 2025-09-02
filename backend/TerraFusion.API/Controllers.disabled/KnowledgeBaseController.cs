using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class KnowledgeBaseController : ControllerBase
    {
        private readonly IKnowledgeBaseService _knowledgeBaseService;
        private readonly ILogger<KnowledgeBaseController> _logger;

        public KnowledgeBaseController(
            IKnowledgeBaseService knowledgeBaseService,
            ILogger<KnowledgeBaseController> logger)
        {
            _knowledgeBaseService = knowledgeBaseService;
            _logger = logger;
        }

        /// <summary>
        /// Search knowledge base items with filters and pagination
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<SearchResultDto>> SearchKnowledgeBase(
            [FromQuery] string q = "",
            [FromQuery] string categories = "",
            [FromQuery] string types = "",
            [FromQuery] string difficulty = "",
            [FromQuery] string tags = "",
            [FromQuery] DateTime? dateStart = null,
            [FromQuery] DateTime? dateEnd = null,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            try
            {
                var filters = new SearchFiltersDto
                {
                    Categories = string.IsNullOrEmpty(categories) ? new List<string>() : categories.Split(',').ToList(),
                    Types = string.IsNullOrEmpty(types) ? new List<string>() : types.Split(',').ToList(),
                    Difficulty = string.IsNullOrEmpty(difficulty) ? new List<string>() : difficulty.Split(',').ToList(),
                    Tags = string.IsNullOrEmpty(tags) ? new List<string>() : tags.Split(',').ToList(),
                    DateRange = new DateRangeDto { Start = dateStart, End = dateEnd }
                };

                var result = await _knowledgeBaseService.SearchAsync(q, filters, page, limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching knowledge base with query: {Query}", q);
                return StatusCode(500, "An error occurred while searching the knowledge base");
            }
        }

        /// <summary>
        /// Get knowledge base item by ID
        /// </summary>
        [HttpGet("items/{id}")]
        public async Task<ActionResult<KnowledgeBaseItemDto>> GetKnowledgeBaseItem(string id)
        {
            try
            {
                var item = await _knowledgeBaseService.GetByIdAsync(id);
                if (item == null)
                {
                    return NotFound($"Knowledge base item with ID {id} not found");
                }

                // Record view for analytics
                await _knowledgeBaseService.RecordViewAsync(id, User.Identity?.Name ?? "anonymous");

                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving knowledge base item: {ItemId}", id);
                return StatusCode(500, "An error occurred while retrieving the knowledge base item");
            }
        }

        /// <summary>
        /// Get category tree for navigation
        /// </summary>
        [HttpGet("categories")]
        public async Task<ActionResult<List<CategoryTreeDto>>> GetCategoryTree()
        {
            try
            {
                var categories = await _knowledgeBaseService.GetCategoryTreeAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category tree");
                return StatusCode(500, "An error occurred while retrieving categories");
            }
        }

        /// <summary>
        /// Get popular/trending items
        /// </summary>
        [HttpGet("popular")]
        public async Task<ActionResult<List<KnowledgeBaseItemDto>>> GetPopularItems([FromQuery] int limit = 10)
        {
            try
            {
                var items = await _knowledgeBaseService.GetPopularItemsAsync(limit);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving popular items");
                return StatusCode(500, "An error occurred while retrieving popular items");
            }
        }

        /// <summary>
        /// Get recently updated items
        /// </summary>
        [HttpGet("recent")]
        public async Task<ActionResult<List<KnowledgeBaseItemDto>>> GetRecentlyUpdated([FromQuery] int limit = 10)
        {
            try
            {
                var items = await _knowledgeBaseService.GetRecentlyUpdatedAsync(limit);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent items");
                return StatusCode(500, "An error occurred while retrieving recent items");
            }
        }

        /// <summary>
        /// Get related items for a specific item
        /// </summary>
        [HttpGet("items/{itemId}/related")]
        public async Task<ActionResult<List<KnowledgeBaseItemDto>>> GetRelatedItems(string itemId, [FromQuery] int limit = 5)
        {
            try
            {
                var items = await _knowledgeBaseService.GetRelatedItemsAsync(itemId, limit);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving related items for: {ItemId}", itemId);
                return StatusCode(500, "An error occurred while retrieving related items");
            }
        }

        /// <summary>
        /// Submit feedback for an item
        /// </summary>
        [HttpPost("items/{itemId}/feedback")]
        public async Task<ActionResult> SubmitFeedback(string itemId, [FromBody] FeedbackDto feedback)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                await _knowledgeBaseService.SubmitFeedbackAsync(itemId, feedback, User.Identity?.Name ?? "anonymous");
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting feedback for item: {ItemId}", itemId);
                return StatusCode(500, "An error occurred while submitting feedback");
            }
        }

        /// <summary>
        /// Toggle bookmark for an item
        /// </summary>
        [HttpPost("items/{itemId}/bookmark")]
        public async Task<ActionResult<BookmarkResultDto>> ToggleBookmark(string itemId)
        {
            try
            {
                var userId = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");
                var result = await _knowledgeBaseService.ToggleBookmarkAsync(itemId, userId);
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Authentication required to bookmark items");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling bookmark for item: {ItemId}", itemId);
                return StatusCode(500, "An error occurred while toggling bookmark");
            }
        }

        /// <summary>
        /// Get user's bookmarked items
        /// </summary>
        [HttpGet("bookmarks")]
        public async Task<ActionResult<List<KnowledgeBaseItemDto>>> GetBookmarkedItems()
        {
            try
            {
                var userId = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");
                var items = await _knowledgeBaseService.GetBookmarkedItemsAsync(userId);
                return Ok(items);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Authentication required to access bookmarks");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving bookmarked items");
                return StatusCode(500, "An error occurred while retrieving bookmarks");
            }
        }

        /// <summary>
        /// Get search suggestions based on partial query
        /// </summary>
        [HttpGet("suggestions")]
        public async Task<ActionResult<List<string>>> GetSearchSuggestions([FromQuery] string q)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                {
                    return Ok(new List<string>());
                }

                var suggestions = await _knowledgeBaseService.GetSearchSuggestionsAsync(q);
                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving search suggestions for: {Query}", q);
                return StatusCode(500, "An error occurred while retrieving suggestions");
            }
        }

        /// <summary>
        /// Get all available tags
        /// </summary>
        [HttpGet("tags")]
        public async Task<ActionResult<List<string>>> GetAllTags()
        {
            try
            {
                var tags = await _knowledgeBaseService.GetAllTagsAsync();
                return Ok(tags);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tags");
                return StatusCode(500, "An error occurred while retrieving tags");
            }
        }

        /// <summary>
        /// Record item view for analytics
        /// </summary>
        [HttpPost("items/{itemId}/view")]
        public async Task<ActionResult> RecordView(string itemId)
        {
            try
            {
                await _knowledgeBaseService.RecordViewAsync(itemId, User.Identity?.Name ?? "anonymous");
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording view for item: {ItemId}", itemId);
                // Don't return error for analytics - fail silently
                return Ok();
            }
        }

        /// <summary>
        /// Get search analytics
        /// </summary>
        [HttpGet("analytics")]
        [Authorize(Roles = "Administrator,Manager")]
        public async Task<ActionResult<SearchAnalyticsDto>> GetSearchAnalytics(
            [FromQuery] DateTime? start = null,
            [FromQuery] DateTime? end = null)
        {
            try
            {
                var dateRange = new DateRangeDto { Start = start, End = end };
                var analytics = await _knowledgeBaseService.GetSearchAnalyticsAsync(dateRange);
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving search analytics");
                return StatusCode(500, "An error occurred while retrieving analytics");
            }
        }

        /// <summary>
        /// Get AI-powered content recommendations
        /// </summary>
        [HttpPost("ai-recommendations")]
        public async Task<ActionResult<List<KnowledgeBaseItemDto>>> GetAIRecommendations(
            [FromBody] AIRecommendationRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.Identity?.Name ?? "anonymous";
                var recommendations = await _knowledgeBaseService.GetAIRecommendationsAsync(
                    userId, request.UserRole, request.CurrentContext, request.Limit);
                
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving AI recommendations");
                return StatusCode(500, "An error occurred while retrieving recommendations");
            }
        }

        /// <summary>
        /// Export search results
        /// </summary>
        [HttpGet("export")]
        public async Task<ActionResult> ExportSearchResults(
            [FromQuery] string q = "",
            [FromQuery] string categories = "",
            [FromQuery] string types = "",
            [FromQuery] string format = "pdf")
        {
            try
            {
                var filters = new SearchFiltersDto
                {
                    Categories = string.IsNullOrEmpty(categories) ? new List<string>() : categories.Split(',').ToList(),
                    Types = string.IsNullOrEmpty(types) ? new List<string>() : types.Split(',').ToList()
                };

                var exportData = await _knowledgeBaseService.ExportSearchResultsAsync(q, filters, format);
                
                var contentType = format.ToLower() switch
                {
                    "pdf" => "application/pdf",
                    "csv" => "text/csv",
                    "json" => "application/json",
                    _ => "application/octet-stream"
                };

                var fileName = $"knowledge-base-export-{DateTime.UtcNow:yyyyMMdd-HHmmss}.{format}";
                
                return File(exportData, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting search results");
                return StatusCode(500, "An error occurred while exporting results");
            }
        }

        /// <summary>
        /// Advanced search with complex options
        /// </summary>
        [HttpPost("advanced-search")]
        public async Task<ActionResult<SearchResultDto>> AdvancedSearch([FromBody] AdvancedSearchRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _knowledgeBaseService.AdvancedSearchAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing advanced search");
                return StatusCode(500, "An error occurred while performing advanced search");
            }
        }

        /// <summary>
        /// Create new knowledge base item
        /// </summary>
        [HttpPost("items")]
        [Authorize(Roles = "Administrator,ContentCreator")]
        public async Task<ActionResult<KnowledgeBaseItemDto>> CreateItem([FromBody] CreateKnowledgeBaseItemDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");
                var item = await _knowledgeBaseService.CreateItemAsync(createDto, userId);
                
                return CreatedAtAction(nameof(GetKnowledgeBaseItem), new { id = item.Id }, item);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Insufficient permissions to create knowledge base items");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating knowledge base item");
                return StatusCode(500, "An error occurred while creating the item");
            }
        }

        /// <summary>
        /// Update knowledge base item
        /// </summary>
        [HttpPut("items/{id}")]
        [Authorize(Roles = "Administrator,ContentCreator")]
        public async Task<ActionResult<KnowledgeBaseItemDto>> UpdateItem(string id, [FromBody] UpdateKnowledgeBaseItemDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");
                var item = await _knowledgeBaseService.UpdateItemAsync(id, updateDto, userId);
                
                if (item == null)
                {
                    return NotFound($"Knowledge base item with ID {id} not found");
                }

                return Ok(item);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Insufficient permissions to update knowledge base items");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating knowledge base item: {ItemId}", id);
                return StatusCode(500, "An error occurred while updating the item");
            }
        }

        /// <summary>
        /// Delete knowledge base item
        /// </summary>
        [HttpDelete("items/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult> DeleteItem(string id)
        {
            try
            {
                var userId = User.Identity?.Name ?? throw new UnauthorizedAccessException("User not authenticated");
                var success = await _knowledgeBaseService.DeleteItemAsync(id, userId);
                
                if (!success)
                {
                    return NotFound($"Knowledge base item with ID {id} not found");
                }

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Insufficient permissions to delete knowledge base items");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting knowledge base item: {ItemId}", id);
                return StatusCode(500, "An error occurred while deleting the item");
            }
        }
    }
}
