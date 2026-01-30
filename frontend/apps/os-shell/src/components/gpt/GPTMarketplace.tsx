// TerraFusionGPT Suite: Marketplace Component
// Elite Government OS Engineering - GPT Discovery & Installation

import React, { useState, useEffect } from 'react';
import {
  Search,
  Star,
  Download,
  TrendingUp,
  Sparkles,
  Grid3x3,
  List,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { gptAPI, GPTConfiguration } from '@/services/gptAPI';
import { gptHub } from '@/services/gptHub';

interface GPTMarketplaceProps {
  onSelectGPT?: (gpt: GPTConfiguration) => void;
  onInstallGPT?: (gpt: GPTConfiguration) => void;
}

type ViewMode = 'grid' | 'list';
type FilterTab = 'all' | 'featured' | 'popular' | 'system';

/**
 * GPT Marketplace - Discover and install GPTs
 */
export const GPTMarketplace: React.FC<GPTMarketplaceProps> = ({ onSelectGPT, onInstallGPT }) => {
  // State
  const [allGPTs, setAllGPTs] = useState<GPTConfiguration[]>([]);
  const [filteredGPTs, setFilteredGPTs] = useState<GPTConfiguration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  /**
   * Load GPTs on mount
   */
  useEffect(() => {
    loadGPTs();
  }, []);

  /**
   * Connect to SignalR for marketplace updates
   */
  useEffect(() => {
    const connectHub = async () => {
      try {
        if (!gptHub.isConnected()) {
          await gptHub.start({
            onNewGPT: (data) => {
              // Add new GPT to list
              setAllGPTs((prev) => [data.gpt, ...prev]);
            },
            onGPTUpdate: (update) => {
              // Update GPT in list
              setAllGPTs((prev) =>
                prev.map((gpt) =>
                  gpt.id === update.gptId
                    ? { ...gpt, ...update.data }
                    : gpt
                )
              );
            },
          });
        }

        await gptHub.subscribeToMarketplace();
      } catch (err) {
        console.error('Failed to connect to marketplace hub:', err);
      }
    };

    connectHub();
  }, []);

  /**
   * Load GPTs based on active tab
   */
  const loadGPTs = async () => {
    setIsLoading(true);

    try {
      let gpts: GPTConfiguration[] = [];

      switch (activeTab) {
        case 'featured':
          gpts = await gptAPI.getFeaturedGPTs();
          break;
        case 'popular':
          gpts = await gptAPI.getPopularGPTs(20);
          break;
        case 'system':
          gpts = await gptAPI.getSystemGPTs();
          break;
        case 'all':
        default:
          gpts = await gptAPI.getAvailableGPTs();
          break;
      }

      setAllGPTs(gpts);
      setFilteredGPTs(gpts);

      // Extract categories
      const cats = Array.from(new Set(gpts.map((g) => g.category).filter(Boolean))) as string[];
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load GPTs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reload GPTs when tab changes
   */
  useEffect(() => {
    loadGPTs();
  }, [activeTab]);

  /**
   * Filter GPTs based on search and category
   */
  useEffect(() => {
    let filtered = allGPTs;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (gpt) =>
          gpt.displayName.toLowerCase().includes(query) ||
          gpt.description?.toLowerCase().includes(query) ||
          gpt.category?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((gpt) => gpt.category === selectedCategory);
    }

    setFilteredGPTs(filtered);
  }, [searchQuery, selectedCategory, allGPTs]);

  /**
   * Handle search
   */
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length > 2) {
      try {
        const results = await gptAPI.searchGPTs(query);
        setFilteredGPTs(results);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }
  };

  /**
   * Render GPT card
   */
  const renderGPTCard = (gpt: GPTConfiguration) => {
    return (
      <Card
        key={gpt.id}
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onSelectGPT?.(gpt)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {gpt.iconUrl ? (
                <img src={gpt.iconUrl} alt={gpt.displayName} className="h-12 w-12 rounded-lg" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {gpt.displayName.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-lg">{gpt.displayName}</CardTitle>
                {gpt.category && (
                  <Badge variant="secondary" className="mt-1">
                    {gpt.category}
                  </Badge>
                )}
              </div>
            </div>

            {gpt.isFeatured && (
              <Badge variant="default" className="bg-yellow-500">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="line-clamp-2 mb-4">{gpt.description}</CardDescription>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              {gpt.averageRating?.toFixed(1) || 'N/A'} ({gpt.ratingCount})
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {gpt.installCount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              {gpt.modelProvider}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {gpt.modelName}
            </Badge>
            {gpt.enableRAG && (
              <Badge variant="outline" className="text-xs">
                RAG
              </Badge>
            )}
          </div>

          {gpt.price > 0 ? (
            <Badge variant="default">${gpt.price.toFixed(2)}</Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}

          <Button
            className="w-full mt-4"
            onClick={(e) => {
              e.stopPropagation();
              onInstallGPT?.(gpt);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render GPT list item
   */
  const renderGPTListItem = (gpt: GPTConfiguration) => {
    return (
      <Card
        key={gpt.id}
        className="cursor-pointer hover:shadow-lg transition-shadow mb-3"
        onClick={() => onSelectGPT?.(gpt)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {gpt.iconUrl ? (
              <img src={gpt.iconUrl} alt={gpt.displayName} className="h-16 w-16 rounded-lg" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {gpt.displayName.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{gpt.displayName}</h3>
                {gpt.isFeatured && (
                  <Badge variant="default" className="bg-yellow-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {gpt.category && <Badge variant="secondary">{gpt.category}</Badge>}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                {gpt.description}
              </p>

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {gpt.averageRating?.toFixed(1) || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {gpt.installCount.toLocaleString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {gpt.modelProvider}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {gpt.modelName}
                </Badge>
              </div>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                onInstallGPT?.(gpt);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">GPT Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discover and install government GPTs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search GPTs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b">
          <TabsList>
            <TabsTrigger value="all">All GPTs</TabsTrigger>
            <TabsTrigger value="featured">
              <Sparkles className="h-4 w-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="popular">
              <TrendingUp className="h-4 w-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="system">System GPTs</TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading GPTs...</p>
                </div>
              ) : filteredGPTs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">No GPTs found</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredGPTs.map(renderGPTCard)}
                </div>
              ) : (
                <div className="space-y-3">{filteredGPTs.map(renderGPTListItem)}</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
};

export default GPTMarketplace;
