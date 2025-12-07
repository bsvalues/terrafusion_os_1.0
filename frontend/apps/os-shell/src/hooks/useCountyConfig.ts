import { useEffect, useState } from 'react';

type CountyConfig = {
  countyId?: string;
  legacySystem?: string;
  requiredModules?: string[];
  conversionMappings?: Record<string, string>;
  error?: string;
};

export function useCountyConfig() {
  const [config, setConfig] = useState<CountyConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await window.electronAPI?.getCountyConfig?.();
        if (mounted) setConfig(data || null);
      } catch (err) {
        if (mounted) setConfig({ error: String(err) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading };
}
