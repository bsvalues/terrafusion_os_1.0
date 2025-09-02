import React, { useEffect, useState } from 'react';

interface Plugin {
  id: string;
  name: string;
  icon?: string;
  entryPoint: string;
  enabled: boolean;
}

const SIDEBAR_JSON = '/marketplace/plugins/sidebar.json';

export const MarketplaceSidebar: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll sidebar.json every 5 seconds for changes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchPlugins = async () => {
      try {
        const resp = await fetch(SIDEBAR_JSON + '?t=' + Date.now());
        if (resp.ok) {
          const data = await resp.json();
          setPlugins(data);
        }
      } catch (e) {
        setPlugins([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlugins();
    interval = setInterval(fetchPlugins, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col">
      <div className="p-4 border-b font-bold text-lg text-blue-700">🛒 Marketplace</div>
      {loading ? (
        <div className="p-4 text-gray-400">Loading plugins...</div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {plugins.filter(p => p.enabled).map(plugin => (
            <li
              key={plugin.id}
              className="flex items-center px-4 py-3 border-b hover:bg-blue-50 cursor-pointer group"
              onClick={() => {
                // Prefer Codespaces, then Electron, else entryPoint
                const url = (plugin as any).codespacesUrl || (plugin as any).electronUrl || plugin.entryPoint;
                if (url) window.open(url, '_blank', 'noopener');
              }}
            ><>

              <span className="text-2xl mr-3">{plugin.icon || '🔌'}</span>
              <span
</> className="font-medium mr-auto">{plugin.name}</span>
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" title="Open plugin">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M14 3h7v7m0-7L10 14" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="p-2 text-xs text-gray-400 border-t">Auto-refreshes every 5s</div>
    </aside>
  );
};
