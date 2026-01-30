import React, { useState } from 'react';
import { pluginService } from '../../services/pluginService';
import { usePluginStore } from '../../stores/pluginStore';

export const PluginManager: React.FC = () => {
  const { installedPlugins, enabledPlugins } = usePluginStore();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    try {
      await pluginService.install(url);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install plugin');
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = (id: string) => {
    if (enabledPlugins.includes(id)) {
      pluginService.disable(id);
    } else {
      pluginService.enable(id);
    }
  };

  return (
    <div className='p-4 bg-white dark:bg-gray-800 h-full text-gray-900 dark:text-white'>
      <h2 className='text-xl font-bold mb-4'>Plugin Manager</h2>

      <form onSubmit={handleInstall} className='mb-6 flex gap-2'>
        <input
          type='url'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder='Enter plugin manifest URL...'
          className='flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600'
          disabled={loading}
        />
        <button
          type='submit'
          disabled={loading || !url}
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
        >
          {loading ? 'Installing...' : 'Install'}
        </button>
      </form>

      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200'>
          {error}
        </div>
      )}

      <div className='space-y-2'>
        {installedPlugins.length === 0 ? (
          <p className='text-gray-500 dark:text-gray-400 text-center py-8'>No plugins installed.</p>
        ) : (
          installedPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className='flex items-center justify-between p-3 border rounded dark:border-gray-700'
            >
              <div>
                <h3 className='font-medium'>{plugin.name}</h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  v{plugin.version} • {plugin.description}
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    enabledPlugins.includes(plugin.id)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {enabledPlugins.includes(plugin.id) ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => togglePlugin(plugin.id)}
                  className={`px-3 py-1 text-sm rounded border ${
                    enabledPlugins.includes(plugin.id)
                      ? 'border-red-200 text-red-600 hover:bg-red-50'
                      : 'border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {enabledPlugins.includes(plugin.id) ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
