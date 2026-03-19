import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import styles from './index.module.css';

function GisCorePlugin({ context }: { context: any }) {
  const [parcelData, setParcelData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedParcel, setSelectedParcel] = React.useState<string>('');

  const handleLoadParcels = async () => {
    setLoading(true);
    try {
      const result = await context.os.invoke('gis.loadParcels', {
        county: context.countyConfig?.countyId,
        bounds: { north: 46.3, south: 46.1, east: -119.1, west: -119.5 },
      });
      setParcelData(result);
    } catch (err) {
      setParcelData({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchParcel = async () => {
    if (!selectedParcel) return;
    setLoading(true);
    try {
      const result = await context.os.invoke('gis.searchParcel', {
        county: context.countyConfig?.countyId,
        parcelId: selectedParcel,
      });
      setParcelData(result);
    } catch (err) {
      setParcelData({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>GIS Core</div>
        <div className={styles.subtitle}>Interactive Parcel Viewer & Mapping</div>
      </div>

      <div className={styles.info}>
        <div>County: {context.countyConfig?.countyId ?? 'unknown'}</div>
        <div>Legacy: {context.countyConfig?.legacySystem ?? 'unknown'}</div>
        <div>Session: {context.sessionId ?? 'none'}</div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchGroup}>
          <input
            type='text'
            placeholder='Enter Parcel ID (e.g., 123-456-789)'
            value={selectedParcel}
            onChange={(e) => setSelectedParcel(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.button}
            onClick={handleSearchParcel}
            disabled={loading || !selectedParcel}
          >
            Search Parcel
          </button>
        </div>

        <button className={styles.button} onClick={handleLoadParcels} disabled={loading}>
          {loading ? 'Loading...' : 'Load Area Parcels'}
        </button>
      </div>

      {parcelData && (
        <div className={styles.results}>
          <div className={styles.resultsTitle}>GIS Data:</div>
          <div className={styles.mapPlaceholder}>
            📍 Interactive Map Placeholder
            <div className={styles.mapNote}>
              Production: Leaflet/Cesium integration with Harris PACS overlay
            </div>
          </div>
          <pre className={styles.resultsData}>{JSON.stringify(parcelData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/** Plugin host elements carry a __tf_root stash for lifecycle management */
type PluginHostElement = HTMLElement & { __tf_root?: Root };

export default {
  mount: async (el: HTMLElement, context: any) => {
    const root: Root = createRoot(el);
    root.render(<GisCorePlugin context={context} />);
    (el as PluginHostElement).__tf_root = root;
  },
  unmount: async (el: HTMLElement) => {
    const root: Root | undefined = (el as PluginHostElement).__tf_root;
    try {
      root?.unmount();
    } catch {
      // Ignore unmount errors
    }
    delete (el as PluginHostElement).__tf_root;
  },
};
