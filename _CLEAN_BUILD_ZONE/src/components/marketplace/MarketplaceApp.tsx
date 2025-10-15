import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Star, Filter, List, ChevronRight, Inventory2, GridView } from '@mui/icons-material';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  ratingCount: number;
  icon?: string;
}

interface Category {
  name: string;
  count: number;
  icon: string;
}

export const MarketplaceApp: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('downloads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  useEffect(() => {
    loadPlugins();
    loadCategories();
  }, [searchQuery, selectedCategory, sortBy]);

  const loadPlugins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sort', sortBy);

      const response = await axios.get(`/api/marketplace/plugins?${params}`);
      setPlugins(response.data.plugins);
    } catch (error) {
      console.error('Failed to load plugins:', error);
      // Load mock data for demo
      setPlugins([
        {
          id: 'costforge-ai',
          name: 'CostForge AI',
          version: '2.1.0',
          description: 'AI-powered property valuation and cost estimation for government assessments',
          author: 'Terrafusion',
          category: 'AI & Analytics',
          tags: ['ai', 'valuation', 'property', 'assessment'],
          downloads: 15420,
          rating: 4.8,
          ratingCount: 342
        },
        {
          id: 'harris-pacs',
          name: 'Harris PACS Integration',
          version: '1.5.2',
          description: 'Direct integration with Harris PACS property assessment systems',
          author: 'Terrafusion',
          category: 'Data Integration',
          tags: ['harris', 'pacs', 'integration', 'property'],
          downloads: 8930,
          rating: 4.6,
          ratingCount: 156
        },
        {
          id: 'gis-core',
          name: 'GIS Core Engine',
          version: '3.0.1',
          description: 'Advanced GIS mapping and spatial analysis for government operations',
          author: 'Terrafusion',
          category: 'Mapping & GIS',
          tags: ['gis', 'mapping', 'spatial', 'analysis'],
          downloads: 12750,
          rating: 4.9,
          ratingCount: 289
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/marketplace/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Load mock categories
      setCategories([
        { name: 'AI & Analytics', count: 12, icon: '🤖' },
        { name: 'Data Integration', count: 8, icon: '🔗' },
        { name: 'Mapping & GIS', count: 15, icon: '🗺️' },
        { name: 'Financial', count: 6, icon: '💰' },
        { name: 'Compliance', count: 9, icon: '📋' }
      ]);
    }
  };

  const installPlugin = async (plugin: Plugin) => {
    try {
      await axios.post(`/api/marketplace/plugins/${plugin.id}/download`);
      alert(`Installing ${plugin.name}...`);
    } catch (error) {
      alert('Failed to install plugin');
    }
  };

  const ratePlugin = async (plugin: Plugin, rating: number) => {
    try {
      await axios.post(`/api/marketplace/plugins/${plugin.id}/rate`, { rating });
      loadPlugins();
    } catch (error) {
      alert('Failed to rate plugin');
    }
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star}
            sx={{ fontSize: 16 }}
            className={`${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const PluginCard: React.FC<{ plugin: Plugin }> = ({ plugin }) => (
    <div className="tf-card hover:tf-animate-glow transition-all cursor-pointer"
         onClick={() => setSelectedPlugin(plugin)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-tf-trust-blue to-tf-transcend-cyan rounded-lg flex items-center justify-center text-white text-xl">
            {plugin.icon || <Inventory2 sx={{ fontSize: 24 }} />}
          </div>
          <div>


            <h3 className="tf-heading-3">{plugin.name}</h3>
            <p

className="text-sm text-gray-500">v{plugin.version} by {plugin.author}</p>
          </div>
        </div>
        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
          {plugin.category}
        </span>
      </div>


      <p className="text-gray-600 mb-4 line-clamp-2">{plugin.description}</p>
      
      <div

className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Download sx={{ fontSize: 14 }} />
            <span>{plugin.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            {renderStars(plugin.rating)}
            <span>({plugin.ratingCount})</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            installPlugin(plugin);
          }}
          className="tf-btn-primary"
        >
          Install
        </button>
      </div>
    </div>
  );

  const PluginListItem: React.FC<{ plugin: Plugin }> = ({ plugin }) => (
    <div className="tf-card hover:tf-animate-glow transition-all flex items-center justify-between cursor-pointer"
         onClick={() => setSelectedPlugin(plugin)}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-gradient-to-br from-tf-trust-blue to-tf-transcend-cyan rounded-lg flex items-center justify-center text-white">
          {plugin.icon || <Inventory2 sx={{ fontSize: 20 }} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">


            <h3 className="tf-heading-4">{plugin.name}</h3>
            <span

className="text-sm text-gray-500">v{plugin.version}</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
              {plugin.category}
            </span>
          </div>
          <p className="text-sm text-gray-600">{plugin.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Download sx={{ fontSize: 14 }} />
            <span>{plugin.downloads.toLocaleString()}</span>
          </div>
        </div>


        <div className="flex items-center gap-1">
          {renderStars(plugin.rating)}
        </div>
        <button

onClick={(e) => {
            e.stopPropagation();
            installPlugin(plugin);
          }}
          className="tf-btn-primary"
        >
          Install
        </button>
      </div>
    </div>
  );

  const PluginModal: React.FC<{ plugin: Plugin; onClose: () => void }> = ({ plugin, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         onClick={onClose}>
      <div className="tf-glass-heavy rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-tf-trust-blue to-tf-transcend-cyan rounded-lg flex items-center justify-center text-white text-2xl">
                {plugin.icon || <Inventory2 sx={{ fontSize: 32 }} />}
              </div>
              <div>


                <h2 className="tf-heading-2">{plugin.name}</h2>
                <p

className="text-gray-500">v{plugin.version} by {plugin.author}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="mb-6">


            <h3 className="tf-heading-3 mb-2">Description</h3>
            <p

className="text-gray-600">{plugin.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>


              <h4 className="tf-heading-4 mb-1">Category</h4>
              <p

className="text-gray-600">{plugin.category}</p>
            </div>
            <div>


              <h4 className="tf-heading-4 mb-1">License</h4>
              <p

className="text-gray-600">Government Use</p>
            </div>
            <div>


              <h4 className="tf-heading-4 mb-1">Downloads</h4>
              <p

className="text-gray-600">{plugin.downloads.toLocaleString()}</p>
            </div>
            <div>


              <h4 className="tf-heading-4 mb-1">Rating</h4>
              <div

className="flex items-center gap-2">
                {renderStars(plugin.rating)}
                <span className="text-gray-600">({plugin.ratingCount} reviews)</span>
              </div>
            </div>
          </div>

          <div className="mb-6">


            <h3 className="tf-heading-3 mb-2">Tags</h3>
            <div

className="flex flex-wrap gap-2">
              {plugin.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="tf-heading-3 mb-2">Rate this plugin</h3>
            {renderStars(0, true, (rating) => ratePlugin(plugin, rating))}
          </div>

          <div className="flex gap-4">


            <button
              onClick={() => installPlugin(plugin)}
              className="tf-btn-primary flex-1"
            >
              Install Plugin
            </button>
            <button

onClick={() => window.open(`https://github.com/Terrafusion/${plugin.name}`, '_blank')}
              className="tf-btn-secondary"
            >
              View Source
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="tf-glass-light min-h-screen">
      <div className="tf-glass-heavy border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">


            <h1 className="tf-heading-display tf-text-gradient">🚀 Terrafusion Marketplace</h1>
            <div

className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" sx={{ fontSize: 20 }} />


                <input
                  type="text"
                  placeholder="Search government modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-tf-trust-blue"
                />
              </div>
              <select

value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tf-trust-blue"
              >


                <option value="downloads">Most Downloads</option>
                <option

value="rating">Highest Rated</option>


                <option value="name">Name</option>
                <option

value="updated">Recently Updated</option>
              </select>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-tf-trust-blue text-white' : ''}`}
                >


                  <GridView sx={{ fontSize: 20 }} />
                </button>
                <button

onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-tf-trust-blue text-white' : ''}`}
                >
                  <List sx={{ fontSize: 20 }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64">


            <h2 className="tf-heading-2 mb-4">Categories</h2>
            <ul

className="space-y-2">
              <li>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 ${
                    !selectedCategory ? 'bg-tf-trust-blue text-white' : ''
                  }`}
                >
                  All Categories
                </button>
              </li>
              {categories.map((category) => (
                <li key={category.name}>
                  <button
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center justify-between ${
                      selectedCategory === category.name ? 'bg-tf-trust-blue text-white' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">


                      <span>{category.icon}</span>
                      <span

className="capitalize">{category.name}</span>
                    </span>
                    <span className="text-sm opacity-75">{category.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tf-trust-blue"></div>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {plugins.map((plugin) => (
                  viewMode === 'grid' 
                    ? <PluginCard key={plugin.id} plugin={plugin} />
                    : <PluginListItem key={plugin.id} plugin={plugin} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedPlugin && (
        <PluginModal plugin={selectedPlugin} onClose={() => setSelectedPlugin(null)} />
      )}
    </div>
  );
};

export default MarketplaceApp;
