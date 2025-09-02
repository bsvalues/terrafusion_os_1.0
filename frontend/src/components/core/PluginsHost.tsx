import React, { useEffect, useState, useRef, useMemo } from 'react';

import styles from './PluginsHost.module.css';

// Plugin system types
interface PluginContext {
  moduleName: string;
  countyConfig: any;
  sessionId: string | null;
  os: {
    invoke: (method: string, payload?: any) => Promise<any>;
    emit: (event: string, data?: any) => void;
  };
}

interface PluginModule {
  mount: (el: HTMLElement, context: PluginContext) => Promise<void>;
  unmount?: (el: HTMLElement) => Promise<void>;
}

type OSState = {
  status: 'disconnected' | 'connecting' | 'authenticated' | 'error';
  sessionId?: string | null;
  loadedModules?: string[];
  lastError?: string | null;
};

type ModuleStatus = 'loading' | 'loaded' | 'denied' | 'error';

// Discover plugins at build time. We place plugins under src/plugins/{name}/index.tsx
const pluginGlobs = import.meta.glob('../../plugins/**/index.tsx');

const PluginsHost: React.FC = () => {
  const [state, setState] = useState<OSState>({ status: 'disconnected', loadedModules: [] });
  const [statuses, setStatuses] = useState<Record<string, ModuleStatus>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const mountedRefs = useRef<Map<string, HTMLElement>>(new Map());
  const loadedPlugins = useRef<Map<string, PluginModule>>(new Map());

  // Map of module name -> loader
  const loaders = useMemo(() => {
    const map = new Map<string, () => Promise<PluginModule>>();
    for (const [path, loader] of Object.entries(pluginGlobs)) {
      // Expect path like ../../plugins/{name}/index.tsx
      const match = path.match(/plugins\/(.+?)\/index\.tsx$/);
      if (match) {
        const name = match[1];
        map.set(name, async () => {
          const mod: any = await (loader as any)();
          return mod && mod.default ? (mod.default as PluginModule) : (mod as PluginModule);
        });
      }
    }
    return map;
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const s = await window.electronAPI.getOSConnectionState();
        setState(s);
      } catch {}
    })();
    try {
      unsubscribe = window.electronAPI.onOSConnectionState((s: any) => {
        // Merge moduleStatuses coming from bridge if present
        if (s && s.moduleStatuses) {
          setStatuses((prev) => ({ ...prev, ...s.moduleStatuses }));
        }
        setState(s);
      });
    } catch {}
    return () => {
      try {
        unsubscribe?.();
      } catch {}
    };
  }, []);

  // Attempt to load and mount plugins when loadedModules updates
  useEffect(() => {
    const mods = state.loadedModules || [];
    mods.forEach(async (name) => {
      if (loadedPlugins.current.has(name)) return; // already mounted or loaded
      const mountEl = document.querySelector(
        `.${styles.mount}[data-module="${name}"]`
      ) as HTMLElement | null;
      const loader = loaders.get(name);
      if (!mountEl || !loader) {
        setStatuses((prev) => ({ ...prev, [name]: 'error' }));
        setErrors((prev) => ({ ...prev, [name]: `Mount point or loader not found for ${name}` }));
        return;
      }

      try {
        // Validate plugin manifest before mounting
        const manifestValid = await validatePluginManifest(name);
        if (!manifestValid) {
          setStatuses((prev) => ({ ...prev, [name]: 'error' }));
          setErrors((prev) => ({ ...prev, [name]: `Invalid or missing manifest for ${name}` }));
          return;
        }

        const plugin = await loader();
        const context = await buildPluginContext(name, state);
        await plugin.mount(mountEl, context);
        loadedPlugins.current.set(name, plugin);
        mountedRefs.current.set(name, mountEl);
        setStatuses((prev) => ({ ...prev, [name]: 'loaded' }));
      } catch (err: any) {
        setStatuses((prev) => ({ ...prev, [name]: 'error' }));
        setErrors((prev) => ({ ...prev, [name]: String(err) }));
      }
    });
  }, [state.loadedModules, loaders, state.sessionId, state.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [name, plugin] of loadedPlugins.current) {
        const el = mountedRefs.current.get(name);
        try {
          if (plugin.unmount && el) plugin.unmount(el);
        } catch {}
      }
      loadedPlugins.current.clear();
      mountedRefs.current.clear();
    };
  }, []);

  const mods = state.loadedModules || [];

  return (
    <section className={styles.container} aria-label='Terrafusion Plugins Host'>
      <header className={styles.header}>
        <h3 className={styles.title}>Kernel Modules</h3>
        <div
className={styles.status} data-status={state.status}>
          Status: {state.status}
        </div>
      </header>

      {state.lastError && (
        <div className={styles.error} role='status'>
          {state.lastError}
        </div>
      )}

      <div className={styles.grid}>
        {mods.length === 0 && <div className={styles.placeholder}>No modules loaded yet</div>}
        {mods.map((m) => (
          <div key={m} className={styles.card} id={`plugin-${m}`}>
            <div className={styles.cardHeader}>
              <span className={styles.moduleIcon}>🧩</span>
              <span
className={styles.moduleName}>{m}</span>
              {statuses[m] === 'loading' && <span title='Loading'>⏳</span>}
              {statuses[m] === 'loaded' && <span title='Loaded'>✅</span>}
              {statuses[m] === 'denied' && <span title='Denied'>❌</span>}
              {statuses[m] === 'error' && <span title='Error'>⚠️</span>}
            </div>
            {errors[m] && (
              <div className={styles.error} role='status'>
                {errors[m]}
              </div>
            )}
            <div className={styles.mount} data-module={m} />
          </div>
        ))}
      </div>
    </section>
  );
};

async function validatePluginManifest(moduleName: string): Promise<boolean> {
  try {
    const manifestUrl = `../../plugins/${moduleName}/manifest.json`;
    const response = await fetch(manifestUrl);
    if (!response.ok) return false;

    const manifest = await response.json();
    // Basic validation - in production, verify signature via backend
    return manifest.name === moduleName && manifest.signature && manifest.hash;
  } catch {
    return false;
  }
}

async function buildPluginContext(moduleName: string, osState: OSState): Promise<PluginContext> {
  try {
    const countyConfig = await window.electronAPI.getCountyConfig();
    return {
      moduleName,
      countyConfig,
      sessionId: osState.sessionId,
      os: {
        invoke: async (method: string, payload?: any) => {
          return await window.electronAPI.invokePlugin(moduleName, method, payload);
        },
        emit: (event: string, data?: any) => {
          window.electronAPI.emitPlugin(moduleName, event, data);
        },
      },
    };
  } catch (err) {
    console.warn('Failed to build plugin context:', err);
    return {
      moduleName,
      countyConfig: null,
      sessionId: osState.sessionId,
      os: {
        invoke: async () => {
          throw new Error('OS bridge unavailable');
        },
        emit: () => {
          console.warn('OS bridge unavailable');
        },
      },
    };
  }
}

export default PluginsHost;
