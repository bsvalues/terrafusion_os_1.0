/**
 * Enhanced Plugin Discovery Component
 * Advanced search, filtering, and AI-powered recommendations for Terrafusion Marketplace
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Star, Download, Shield, Zap, TrendingUp  } from '@mui/icons-material';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tier: 'Tier1CoreFoundation' | 'Tier2CostForgeProfessional' | 'Tier3EnterpriseSuite';
  tags: string[];
  downloads: number;
  rating: number;
  compliance_score: number;
  status: 'active' | 'beta' | 'deprecated';
  icon?: string;
  featured?: boolean;
  ai_recommended?: boolean;
  last_updated: string;
  target_users: string[];
}

interface FilterState {
  search: string;
  category: string;
  tier: string;
  minRating: number;
  minCompliance: number;
  showFeatured: boolean;
  showRecommended: boolean;
}

interface EnhancedPluginDiscoveryProps {
  plugins: Plugin[];
  onInstall: (pluginId: string) => void;
  onViewDetails: (pluginId: string) => void;
  countyProfile?: {
    size: 'small' | 'medium' | 'large';
    type: 'rural' | 'urban' | 'suburban';
    specialties: string[];
  };
}

export const EnhancedPluginDiscovery: React.FC<EnhancedPluginDiscoveryProps> = ({
  plugins,
  onInstall,
  onViewDetails,
  countyProfile
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    tier: '',
    minRating: 0,
    minCompliance: 0,
    showFeatured: false,
    showRecommended: false
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'relevance' | 'downloads' | 'rating' | 'updated'>('relevance');

  // AI-powered plugin recommendations based on county profile
  const getAIRecommendations = (plugins: Plugin[]) => {
    if (!countyProfile) return [];
    
    return plugins
      .map(plugin => ({
        ...plugin,
        relevanceScore: calculateRelevanceScore(plugin, countyProfile)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  };

  const calculateRelevanceScore = (plugin: Plugin, profile: any) => {
    let score = 0;
    
    // Base score from rating and compliance
    score += plugin.rating * 20;
    score += plugin.compliance_score * 0.5;
    
    // County size matching
    if (profile.size === 'small' && plugin.tier === 'Tier1CoreFoundation') score += 30;
    if (profile.size === 'medium' && plugin.tier === 'Tier2CostForgeProfessional') score += 30;
    if (profile.size === 'large' && plugin.tier === 'Tier3EnterpriseSuite') score += 30;
    
    // Specialty matching
    const specialtyMatch = profile.specialties.some((specialty: string) => 
      plugin.tags.includes(specialty.toLowerCase()) || 
      plugin.description.toLowerCase().includes(specialty.toLowerCase())
    );
    if (specialtyMatch) score += 25;
    
    // Download popularity
    score += Math.log(plugin.downloads + 1) * 2;
    
    return score;
  };

  // Filter and sort plugins
  const filteredPlugins = useMemo(() => {
    let filtered = plugins.filter(plugin => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          plugin.name.toLowerCase().includes(searchLower) ||
          plugin.description.toLowerCase().includes(searchLower) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          plugin.author.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && plugin.category !== filters.category) return false;

      // Tier filter
      if (filters.tier && plugin.tier !== filters.tier) return false;

      // Rating filter
      if (plugin.rating < filters.minRating) return false;

      // Compliance filter
      if (plugin.compliance_score < filters.minCompliance) return false;

      // Featured filter
      if (filters.showFeatured && !plugin.featured) return false;

      // AI Recommended filter
      if (filters.showRecommended && !plugin.ai_recommended) return false;

      return true;
    });

    // Sort plugins
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'updated':
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        case 'relevance':
        default:
          if (countyProfile) {
            const aScore = calculateRelevanceScore(a, countyProfile);
            const bScore = calculateRelevanceScore(b, countyProfile);
            return bScore - aScore;
          }
          return b.downloads - a.downloads;
      }
    });

    return filtered;
  }, [plugins, filters, sortBy, countyProfile]);

  const aiRecommendations = useMemo(() => getAIRecommendations(plugins), [plugins, countyProfile]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier1CoreFoundation': return 'bg-green-100 text-green-800 border-green-200';
      case 'Tier2CostForgeProfessional': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Tier3EnterpriseSuite': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'Tier1CoreFoundation': return 'Foundation';
      case 'Tier2CostForgeProfessional': return 'Professional';
      case 'Tier3EnterpriseSuite': return 'Enterprise';
      default: return tier;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendations Section */}
      {countyProfile && aiRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-900">AI Recommendations for Your County</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiRecommendations.map(plugin => (
              <div key={plugin.id} className="bg-white rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2"><>

                  <h4 className="font-medium text-gray-900">{plugin.name}</h4>
                  <span
</> className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">AI Pick</span>
                </div><>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plugin.description}</p>
                <div
</> className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{plugin.rating}</span>
                  </div>
                  <button
                    onClick={() => onInstall(plugin.id)}
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Install
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search plugins, categories, or features..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="w-5 h-5 grid grid-cols-2 gap-0.5"><>

                <div className="bg-current rounded-sm"></div>
                <div
</> className="bg-current rounded-sm"></div><>

                <div className="bg-current rounded-sm"></div>
                <div
</> className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="w-5 h-5 flex flex-col space-y-1"><>

                <div className="h-1 bg-current rounded"></div>
                <div
</> className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          ><>

            <option value="">All Categories</option>
            <option
</> value="Infrastructure & Integration">Infrastructure</option><>

            <option value="Assessment & Valuation">Assessment</option>
            <option
</> value="Analytics & Reporting">Analytics</option><>

            <option value="Workflow & Automation">Workflow</option>
            <option
</> value="Compliance & Audit">Compliance</option>
          </select>

          <select
            value={filters.tier}
            onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          ><>

            <option value="">All Tiers</option>
            <option
</> value="Tier1CoreFoundation">Foundation</option><>

            <option value="Tier2CostForgeProfessional">Professional</option>
            <option
</> value="Tier3EnterpriseSuite">Enterprise</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          ><>

            <option value="relevance">Most Relevant</option>
            <option
</> value="downloads">Most Downloaded</option><>

            <option value="rating">Highest Rated</option>
            <option
</> value="updated">Recently Updated</option>
          </select>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showFeatured}
                onChange={(e) => setFilters(prev => ({ ...prev, showFeatured: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600"><>

          <span>{filteredPlugins.length} plugins found</span>
          <div
</> className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filters active: {Object.values(filters).filter(Boolean).length}</span>
          </div>
        </div>
      </div>

      {/* Plugin Grid/List */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'space-y-4'
      }>
        {filteredPlugins.map(plugin => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            viewMode={viewMode}
            onInstall={onInstall}
            onViewDetails={onViewDetails}
            getTierColor={getTierColor}
            getTierLabel={getTierLabel}
          />
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4"><>

            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3
</> className="text-lg font-medium text-gray-900 mb-2">No plugins found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
};

interface PluginCardProps {
  plugin: Plugin;
  viewMode: 'grid' | 'list';
  onInstall: (pluginId: string) => void;
  onViewDetails: (pluginId: string) => void;
  getTierColor: (tier: string) => string;
  getTierLabel: (tier: string) => string;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  viewMode,
  onInstall,
  onViewDetails,
  getTierColor,
  getTierLabel
}) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2"><>

              <h3 className="text-lg font-semibold text-gray-900">{plugin.name}</h3>
              <span
</> className={`px-2 py-1 text-xs font-medium rounded-full border ${getTierColor(plugin.tier)}`}>
                {getTierLabel(plugin.tier)}
              </span>
              {plugin.featured && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Featured</span>
              )}
              {plugin.ai_recommended && (
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">AI Pick</span>
              )}
            </div><>

            <p className="text-gray-600 mb-3">{plugin.description}</p>
            <div
</> className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{plugin.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="w-4 h-4" />
                <span>{plugin.downloads.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span>{plugin.compliance_score}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4"><>

            <button
              onClick={() => onViewDetails(plugin.id)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Details
            </button>
            <button
</>
              onClick={() => onInstall(plugin.id)}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3"><>

        <h3 className="text-lg font-semibold text-gray-900 truncate">{plugin.name}</h3>
        <span
</> className={`px-2 py-1 text-xs font-medium rounded-full border ${getTierColor(plugin.tier)}`}>
          {getTierLabel(plugin.tier)}
        </span>
      </div><>

      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{plugin.description}</p>
      
      <div
</> className="flex items-center space-x-3 mb-4 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span>{plugin.rating}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Download className="w-4 h-4" />
          <span>{plugin.downloads > 1000 ? `${Math.round(plugin.downloads/1000)}k` : plugin.downloads}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Shield className="w-4 h-4 text-green-500" />
          <span>{plugin.compliance_score}%</span>
        </div>
      </div>

      {(plugin.featured || plugin.ai_recommended) && (
        <div className="flex space-x-2 mb-4">
          {plugin.featured && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Featured</span>
          )}
          {plugin.ai_recommended && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">AI Pick</span>
          )}
        </div>
      )}
      
      <div className="flex space-x-2"><>

        <button
          onClick={() => onViewDetails(plugin.id)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Details
        </button>
        <button
</>
          onClick={() => onInstall(plugin.id)}
          className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
};
