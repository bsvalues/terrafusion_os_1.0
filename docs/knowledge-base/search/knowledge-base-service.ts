import { KnowledgeBaseItem, SearchFilters, SearchResult, CategoryTree } from './types';

export class KnowledgeBaseService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  /**
   * Search knowledge base items with filters and pagination
   */
  async searchKnowledgeBase(
    query: string,
    filters: SearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString()
    });

    // Add filters to params
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }
    if (filters.types.length > 0) {
      params.append('types', filters.types.join(','));
    }
    if (filters.difficulty.length > 0) {
      params.append('difficulty', filters.difficulty.join(','));
    }
    if (filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters.dateRange.start) {
      params.append('dateStart', filters.dateRange.start.toISOString());
    }
    if (filters.dateRange.end) {
      params.append('dateEnd', filters.dateRange.end.toISOString());
    }

    const response = await fetch(`${this.baseUrl}/knowledge-base/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get knowledge base item by ID
   */
  async getKnowledgeBaseItem(id: string): Promise<KnowledgeBaseItem> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/items/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch item: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get category tree for navigation
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/categories`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get popular/trending items
   */
  async getPopularItems(limit: number = 10): Promise<KnowledgeBaseItem[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/popular?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch popular items: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get recently updated items
   */
  async getRecentlyUpdated(limit: number = 10): Promise<KnowledgeBaseItem[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/recent?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch recent items: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get related items for a specific item
   */
  async getRelatedItems(itemId: string, limit: number = 5): Promise<KnowledgeBaseItem[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/items/${itemId}/related?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch related items: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Submit feedback for an item
   */
  async submitFeedback(itemId: string, helpful: boolean, comment?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/items/${itemId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        helpful,
        comment
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
  }

  /**
   * Bookmark/unbookmark an item
   */
  async toggleBookmark(itemId: string): Promise<{ bookmarked: boolean }> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/items/${itemId}/bookmark`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle bookmark: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's bookmarked items
   */
  async getBookmarkedItems(): Promise<KnowledgeBaseItem[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/bookmarks`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/suggestions?q=${encodeURIComponent(partialQuery)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all available tags
   */
  async getAllTags(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/tags`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Record item view for analytics
   */
  async recordView(itemId: string): Promise<void> {
    await fetch(`${this.baseUrl}/knowledge-base/items/${itemId}/view`, {
      method: 'POST'
    });
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
    topQueries: Array<{ query: string; count: number }>;
    topItems: Array<{ itemId: string; title: string; views: number }>;
    categoryDistribution: Array<{ category: string; count: number }>;
  }> {
    const params = new URLSearchParams();
    
    if (dateRange?.start) {
      params.append('start', dateRange.start.toISOString());
    }
    if (dateRange?.end) {
      params.append('end', dateRange.end.toISOString());
    }

    const response = await fetch(`${this.baseUrl}/knowledge-base/analytics?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * AI-powered content recommendations
   */
  async getAIRecommendations(
    userRole: string,
    currentContext?: string,
    limit: number = 5
  ): Promise<KnowledgeBaseItem[]> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/ai-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userRole,
        currentContext,
        limit
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch AI recommendations: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Export search results
   */
  async exportSearchResults(
    query: string,
    filters: SearchFilters,
    format: 'pdf' | 'csv' | 'json' = 'pdf'
  ): Promise<Blob> {
    const params = new URLSearchParams({
      q: query,
      format
    });

    // Add filters to params (same as search)
    if (filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }
    if (filters.types.length > 0) {
      params.append('types', filters.types.join(','));
    }

    const response = await fetch(`${this.baseUrl}/knowledge-base/export?${params}`);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Full-text search with advanced options
   */
  async advancedSearch(options: {
    query: string;
    exactPhrase?: string;
    anyWords?: string[];
    excludeWords?: string[];
    author?: string;
    dateRange?: { start: Date; end: Date };
    sortBy?: 'relevance' | 'date' | 'popularity' | 'rating';
    sortOrder?: 'asc' | 'desc';
  }): Promise<SearchResult> {
    const response = await fetch(`${this.baseUrl}/knowledge-base/advanced-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Advanced search failed: ${response.statusText}`);
    }

    return response.json();
  }
}
