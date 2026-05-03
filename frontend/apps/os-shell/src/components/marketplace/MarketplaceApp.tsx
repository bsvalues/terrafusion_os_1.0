import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, GridView, InfoOutlined, Inventory2, List, Search } from '@mui/icons-material';

interface Plugin {
  id: string;
  name: string;
  version?: string;
  description?: string;
  author?: string | null;
  category: string;
  tags?: string[];
  metricsAvailable?: boolean;
  downloads?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
}

interface Category {
  name: string;
  count: number;
  icon: string;
}

interface MarketplaceAppProps {
  embedded?: boolean;
}

function getCategoryGlyph(iconName: string): string {
  switch (iconName) {
    case 'Shield':
      return '🛡';
    case 'Map':
      return '🗺';
    case 'DollarSign':
      return '$';
    case 'FileCheck':
      return '📋';
    case 'Zap':
      return '⚡';
    default:
      return '📦';
  }
}

function formatAuthor(plugin: Plugin): string {
  return plugin.author?.trim() ? plugin.author : 'Registry-managed module';
}

function formatMetrics(plugin: Plugin): string {
  if (!plugin.metricsAvailable) {
    return 'Usage metrics unavailable';
  }

  if (typeof plugin.downloads === 'number') {
    return `${plugin.downloads.toLocaleString()} recorded launches`;
  }

  return 'Usage metrics unavailable';
}

export const MarketplaceApp: React.FC<MarketplaceAppProps> = ({ embedded = false }) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [installingPluginId, setInstallingPluginId] = useState<string | null>(null);

  useEffect(() => {
    void loadPlugins();
  }, [searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    void loadCategories();
  }, []);

  const loadPlugins = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sort', sortBy);

      const response = await axios.get(`/api/marketplace/plugins?${params.toString()}`);
      setPlugins(Array.isArray(response.data?.plugins) ? response.data.plugins : []);
    } catch (error) {
      console.error('Failed to load plugins:', error);
      setPlugins([]);
      setLoadError('Marketplace registry unavailable. No governed module catalog was returned.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/marketplace/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const installPlugin = async (plugin: Plugin) => {
    setStatusMessage(null);
    setInstallingPluginId(plugin.id);

    try {
      await axios.post(`/api/marketplace/plugins/${plugin.id}/download`);
      setStatusMessage(`Launch requested for ${plugin.name}.`);
    } catch (error) {
      console.error('Failed to launch plugin:', error);
      setStatusMessage(`Failed to launch ${plugin.name}.`);
    } finally {
      setInstallingPluginId(null);
    }
  };

  const PluginCard: React.FC<{ plugin: Plugin }> = ({ plugin }) => (
    <div
      className='tf-card hover:tf-animate-glow transition-all cursor-pointer'
      onClick={() => setSelectedPlugin(plugin)}
    >
      <div className='flex items-start justify-between gap-4 mb-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-12 h-12 bg-gradient-to-br from-tf-trust-blue to-tf-transcend-cyan rounded-lg flex items-center justify-center text-white text-xl'>
            <Inventory2 sx={{ fontSize: 24 }} />
          </div>
          <div className='min-w-0'>
            <h3 className='tf-heading-3 truncate'>{plugin.name}</h3>
            <p className='text-sm text-gray-500'>
              {plugin.version ? `v${plugin.version}` : 'Version unavailable'} · {formatAuthor(plugin)}
            </p>
          </div>
        </div>
        <span className='px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 shrink-0'>
          {plugin.category}
        </span>
      </div>

      <p className='text-gray-600 mb-4 line-clamp-3'>
        {plugin.description || 'No governed module description was provided by the registry.'}
      </p>

      <div className='mb-4 flex flex-wrap gap-2'>
        {(plugin.tags?.length ? plugin.tags : ['registry']).map((tag) => (
          <span key={tag} className='px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600'>
            {tag}
          </span>
        ))}
      </div>

      <div className='flex items-center justify-between gap-4'>
        <div className='text-sm text-gray-500'>{formatMetrics(plugin)}</div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            void installPlugin(plugin);
          }}
          className='tf-btn-primary'
          disabled={installingPluginId === plugin.id}
        >
          {installingPluginId === plugin.id ? 'Launching…' : 'Launch'}
        </button>
      </div>
    </div>
  );

  const PluginListItem: React.FC<{ plugin: Plugin }> = ({ plugin }) => (
    <div
      className='tf-card hover:tf-animate-glow transition-all flex items-center justify-between cursor-pointer gap-6'
      onClick={() => setSelectedPlugin(plugin)}
    >
      <div className='flex items-center gap-4 flex-1 min-w-0'>
        <div className='w-10 h-10 bg-gradient-to-br from-tf-trust-blue to-tf-transcend-cyan rounded-lg flex items-center justify-center text-white'>
          <Inventory2 sx={{ fontSize: 20 }} />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='tf-heading-4 truncate'>{plugin.name}</h3>
            <span className='text-sm text-gray-500'>
              {plugin.version ? `v${plugin.version}` : 'Version unavailable'}
            </span>
            <span className='px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600'>
              {plugin.category}
            </span>
          </div>
          <p className='text-sm text-gray-600 line-clamp-2'>
            {plugin.description || 'No governed module description was provided by the registry.'}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-6 shrink-0'>
        <div className='text-sm text-gray-500'>{formatMetrics(plugin)}</div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            void installPlugin(plugin);
          }}
          className='tf-btn-primary'
          disabled={installingPluginId === plugin.id}
        >
          {installingPluginId === plugin.id ? 'Launching…' : 'Launch'}
        </button>
      </div>
    </div>
  );

  const PluginModal: React.FC<{ plugin: Plugin; onClose: () => void }> = ({ plugin, onClose }) => (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      onClick={onClose}
    >
      <div
        className='tf-glass-heavy rounded-lg max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='p-6'>
          <div className='flex items-start justify-between mb-6 gap-4'>
            <div className='flex items-center gap-4 min-w-0'>
              <div className='w-16 h-16 bg-gradient-to-br from-tf-trust-blue to-tf-transcend-cyan rounded-lg flex items-center justify-center text-white text-2xl'>
                <Inventory2 sx={{ fontSize: 32 }} />
              </div>
              <div className='min-w-0'>
                <h2 className='tf-heading-2 truncate'>{plugin.name}</h2>
                <p className='text-gray-500'>
                  {plugin.version ? `v${plugin.version}` : 'Version unavailable'} · {formatAuthor(plugin)}
                </p>
              </div>
            </div>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
              ✕
            </button>
          </div>

          <div className='mb-6'>
            <h3 className='tf-heading-3 mb-2'>Description</h3>
            <p className='text-gray-600'>
              {plugin.description || 'No governed module description was provided by the registry.'}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
            <div>
              <h4 className='tf-heading-4 mb-1'>Category</h4>
              <p className='text-gray-600'>{plugin.category}</p>
            </div>
            <div>
              <h4 className='tf-heading-4 mb-1'>Author</h4>
              <p className='text-gray-600'>{formatAuthor(plugin)}</p>
            </div>
            <div>
              <h4 className='tf-heading-4 mb-1'>Version</h4>
              <p className='text-gray-600'>{plugin.version || 'Unavailable'}</p>
            </div>
            <div>
              <h4 className='tf-heading-4 mb-1'>Usage metrics</h4>
              <p className='text-gray-600'>{formatMetrics(plugin)}</p>
            </div>
          </div>

          <div className='mb-6 rounded-lg border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
            Ratings, reviews, source links, and AI performance telemetry are not exposed by the
            current registry-backed marketplace backend.
          </div>

          <div className='mb-6'>
            <h3 className='tf-heading-3 mb-2'>Tags</h3>
            <div className='flex flex-wrap gap-2'>
              {(plugin.tags?.length ? plugin.tags : ['registry']).map((tag) => (
                <span key={tag} className='px-3 py-1 bg-gray-100 rounded-full text-sm'>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className='flex gap-4'>
            <button
              onClick={() => void installPlugin(plugin)}
              className='tf-btn-primary flex-1'
              disabled={installingPluginId === plugin.id}
            >
              {installingPluginId === plugin.id ? 'Launching…' : 'Launch Module'}
            </button>
            <button onClick={onClose} className='tf-btn-secondary'>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={embedded ? 'w-full' : 'tf-glass-light min-h-screen'} data-testid='marketplace-registry'>
      <div className={`${embedded ? 'px-6 py-6' : 'max-w-7xl mx-auto px-4 py-8'}`}>
        {!embedded && (
          <div className='mb-8'>
            <h1 className='tf-heading-display tf-text-gradient'>TerraFusion Module Registry</h1>
            <p className='mt-3 text-gray-600 max-w-3xl'>
              This marketplace uses the registry-backed <code>/api/marketplace</code> lane only.
              Unsupported ratings, source links, AI-agent counts, and performance claims remain
              withheld until the backend publishes governed evidence for them.
            </p>
          </div>
        )}

        <div className='mb-6 rounded-xl border border-[var(--tf-transcend-highlight)]/20 bg-white/60 px-4 py-3 text-sm text-gray-700'>
          <div className='flex items-start gap-3'>
            <InfoOutlined className='mt-0.5' sx={{ fontSize: 18 }} />
            <span>
              Launch actions are real registry-backed requests. Catalog metrics display only when the
              backend supplies them.
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className='mb-6 rounded-xl border border-[var(--tf-network-blue)]/20 bg-blue-50 px-4 py-3 text-sm text-blue-900'>
            {statusMessage}
          </div>
        )}

        {loadError && (
          <div
            className='mb-6 rounded-xl border border-red-300/40 bg-red-50 px-4 py-3 text-sm text-red-900'
            data-testid='marketplace-unavailable'
          >
            {loadError}
          </div>
        )}

        <div className='tf-glass-heavy border rounded-2xl mb-8'>
          <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 px-4 py-4'>
            <div className='relative flex-1 max-w-xl'>
              <Search
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                sx={{ fontSize: 20 }}
              />
              <input
                type='text'
                placeholder='Search registry-backed modules...'
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className='pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-tf-trust-blue'
              />
            </div>

            <div className='flex items-center gap-4'>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label='Sort marketplace modules'
                className='px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tf-trust-blue'
              >
                <option value='name'>Name</option>
                <option value='version'>Version</option>
              </select>

              <div className='flex items-center border rounded-lg'>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-tf-trust-blue text-white' : ''}`}
                  aria-label='Grid view'
                >
                  <GridView sx={{ fontSize: 20 }} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-tf-trust-blue text-white' : ''}`}
                  aria-label='List view'
                >
                  <List sx={{ fontSize: 20 }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-8'>
          <aside className='lg:w-64 shrink-0'>
            <h2 className='tf-heading-2 mb-4'>Categories</h2>
            <ul className='space-y-2'>
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
                    <span className='flex items-center gap-2'>
                      <span aria-hidden='true'>{getCategoryGlyph(category.icon)}</span>
                      <span className='capitalize'>{category.name}</span>
                    </span>
                    <span className='text-sm opacity-75'>{category.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className='flex-1 min-w-0'>
            {loading ? (
              <div className='flex items-center justify-center h-64'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-tf-trust-blue'></div>
              </div>
            ) : plugins.length === 0 && !loadError ? (
              <div className='rounded-2xl border border-gray-200 bg-white/70 px-6 py-12 text-center text-gray-600'>
                No registry-backed modules matched the current filters.
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {plugins.map((plugin) =>
                  viewMode === 'grid' ? (
                    <PluginCard key={plugin.id} plugin={plugin} />
                  ) : (
                    <PluginListItem key={plugin.id} plugin={plugin} />
                  )
                )}
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
