import React, { useState, useEffect } from 'react';
import './PluginSidebar.css';

type Plugin = {
  id: string;
  name: string;
  entryPoint: string;
  api?: string;
  tags?: string[];
  k8s?: string;
  enabled?: boolean;
  codespacesUrl?: string;
  electronUrl?: string;
  categories?: string[];
};

type SortOption = 'az' | 'za' | 'recent' | 'popular';

type PluginUsageStats = {
  [pluginId: string]: {
    count: number;
    lastLaunched: string;
  };
};

export function PluginSidebar() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [usageStats, setUsageStats] = useState<PluginUsageStats>({});
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);
  const lastFocusedPlugin = React.useRef<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [sort, setSort] = useState<SortOption>('az');
  const [category, setCategory] = useState<string>('all');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    let pluginAbort: AbortController | null = new AbortController();
    let usageAbort: AbortController | null = new AbortController();
    const fetchPlugins = async () => {
      try {
        const res = await fetch('/sidebar.json', { signal: pluginAbort!.signal });
        const data = await res.json();
        setPlugins(data);
      } catch (e) {/* ignore abort */}
    };
    fetchPlugins();
    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/plugin-usage-stats', { signal: usageAbort!.signal });
        const stats = await res.json();
        setUsageStats(stats);
      } catch {/* ignore abort */}
    };
    fetchUsage();
    const interval = setInterval(() => {
      pluginAbort?.abort(); usageAbort?.abort();
      pluginAbort = new AbortController(); usageAbort = new AbortController();
      fetchPlugins(); fetchUsage();
    }, 5000);
    return () => { clearInterval(interval); pluginAbort?.abort(); usageAbort?.abort(); };
  }, []);

  // Gather all unique categories
  const allCategories = Array.from(new Set(plugins.flatMap(p => p.categories || [])));

  let filtered = plugins.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (category !== 'all') {
    filtered = filtered.filter(p => (p.categories || []).includes(category));
  }

  // Sorting
  filtered = [...filtered];
  if (sort === 'az') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'za') filtered.sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === 'recent') filtered.sort((a, b) => {
    const la = usageStats[a.id]?.lastLaunched ? Date.parse(usageStats[a.id].lastLaunched) : 0;
    const lb = usageStats[b.id]?.lastLaunched ? Date.parse(usageStats[b.id].lastLaunched) : 0;
    return lb - la;
  });
  else if (sort === 'popular') filtered.sort((a, b) => {
    const ca = usageStats[a.id]?.count ?? 0;
    const cb = usageStats[b.id]?.count ?? 0;
    return cb - ca;
  });

  const handleLaunch = (plugin) => {
    const log = { pluginId: plugin.id, timestamp: new Date().toISOString() };
    fetch('/api/plugin-launch-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });

    if (plugin.codespacesUrl) window.open(plugin.codespacesUrl, '_blank');
    else if (plugin.electronUrl) window.open(plugin.electronUrl, '_blank');
    else window.open(plugin.entryPoint, '_blank');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-filter-bar">
        <select title="Sort plugins" value={sort} onChange={e => setSort(e.target.value as SortOption)}><>

          <option value="az">A-Z</option>
          <option
</>
value="za">Z-A</option><>

          <option value="recent">Most Recent</option>
          <option
</>
value="popular">Most Launched</option>
        </select>
        <select title="Filter by category" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat[0].toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>
      <input
        className="sidebar-search"
        type="text"
        ref={searchRef}
        placeholder="Search plugins..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        aria-label="Search plugins"
      />
      {filtered.map((plugin) => {
        const stats = usageStats[plugin.id] || { count: 0 };
        const isPopular = stats.count >= 20; // Example threshold, adjust as needed
        return (
          <div
            key={plugin.id}
            className="plugin-item"
            tabIndex={0}
            onClick={() => { setSelectedPlugin(plugin); lastFocusedPlugin.current = plugin.id; }}
            onKeyDown={e => { if (e.key === 'Enter') { setSelectedPlugin(plugin); lastFocusedPlugin.current = plugin.id; }}}
            title={plugin.codespacesUrl ? 'Codespaces' : plugin.electronUrl ? 'Electron' : 'Local'}
          >
            <span>{plugin.name}</span>
            {isPopular && <span className="plugin-badge" title="Popular">🔥</span>}<>

            <span className="plugin-usage" title="Launch count">{stats.count}</span>
            <button
</>

              className="launch-button"
              tabIndex={0}
              aria-label={`Launch ${plugin.name}`}
              onClick={e => { e.stopPropagation(); handleLaunch(plugin); }}
            >▶</button>
            <button
              className="details-button"
              tabIndex={0}
              aria-label={`View details for ${plugin.name}`}
              onClick={e => { e.stopPropagation(); setSelectedPlugin(plugin); lastFocusedPlugin.current = plugin.id; }}
            >ℹ️</button>
          </div>
        );
      })}

      {selectedPlugin && (() => {
        const stats = usageStats[selectedPlugin.id] || { count: 0 };
        const [editMode, setEditMode] = React.useState(false);
        const [editName, setEditName] = React.useState(selectedPlugin.name);
        const [editTags, setEditTags] = React.useState((selectedPlugin.tags || []).join(', '));
        const [editCategories, setEditCategories] = React.useState((selectedPlugin.categories || []).join(', '));
        const [removeConfirm, setRemoveConfirm] = React.useState(false);
        const handleEditSave = async () => {
          await fetch('/api/plugin-edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedPlugin.id,
              name: editName,
              tags: editTags.split(',').map(s => s.trim()).filter(Boolean),
              categories: editCategories.split(',').map(s => s.trim()).filter(Boolean)
            })
          });
          setEditMode(false);
        };
        const handleRemove = async () => {
          await fetch('/api/plugin-remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedPlugin.id })
          });
          setRemoveConfirm(false);
          setSelectedPlugin(null);
        };
        return (
          <div className="plugin-detail">
            {editMode ? (<>

                <h2>Edit Plugin</h2>
                <label
</>
</>>
                  Name:<>

                  <input value={editName} onChange={e => setEditName(e.target.value)} />
                </label>
                <label
</>
</>>
                  Tags (comma separated):<>

                  <input value={editTags} onChange={e => setEditTags(e.target.value)} />
                </label>
                <label
</>
</>>
                  Categories (comma separated):<>

                  <input value={editCategories} onChange={e => setEditCategories(e.target.value)} />
                </label>
                <button
</>
onClick={handleEditSave}>Save</button>
                <button onClick={() => setEditMode(false)}>Cancel</button>
            ) : (<>

                <h2>{selectedPlugin.name}</h2>
                <p
</>
</>><strong>Tags:</strong> {selectedPlugin.tags?.join(', ')}</p>
                <p><strong>API:</strong> {selectedPlugin.api}</p>
                <p><strong>K8s:</strong> {selectedPlugin.k8s}</p>
                <p><strong>Launches:</strong> {stats.count}</p>
                <p><strong>Last launched:</strong> {stats.lastLaunched ? new Date(stats.lastLaunched).toLocaleString() : 'Never'}</p><>

                <button onClick={() => handleLaunch(selectedPlugin)}>Launch</button>
                <button
</>
onClick={() => setEditMode(true)}>Edit</button><>

                <button onClick={() => setRemoveConfirm(true)}>Remove</button>
                <button
</>
onClick={() => {
                  setSelectedPlugin(null);
                  setTimeout(() => {
                    if (lastFocusedPlugin.current) {
                      const el = document.querySelector(`[data-plugin-id='${lastFocusedPlugin.current}']`) as HTMLElement;
                      if (el) el.focus();
                      else searchRef.current?.focus();
                    } else {
                      searchRef.current?.focus();
                    }
                  }, 0);
                }}>Close</button>
            )}
            {removeConfirm && (
              <div className="remove-confirm"><>

                <p>Are you sure you want to remove this plugin?</p>
                <button
</>
onClick={handleRemove}>Yes, Remove</button>
                <button onClick={() => setRemoveConfirm(false)}>Cancel</button>
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}

// 🔍 Search, 🧩 Detail view, and 📈 Launch logging complete
