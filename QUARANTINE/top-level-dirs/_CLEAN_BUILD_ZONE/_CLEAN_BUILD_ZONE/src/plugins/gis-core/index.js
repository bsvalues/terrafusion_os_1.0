import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import React from 'react';
import { createRoot } from 'react-dom/client';

import styles from './index.module.css';
function GisCorePlugin({ context }) {
  const [parcelData, setParcelData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedParcel, setSelectedParcel] = React.useState('');
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
  return _jsxs('div', {
    className: styles.root,
    children: [
      _jsxs('div', {
        className: styles.header,
        children: [
          _jsx('div', { className: styles.title, children: 'GIS Core' }),
          _jsx('div', {
            className: styles.subtitle,
            children: 'Interactive Parcel Viewer & Mapping',
          }),
        ],
      }),
      _jsxs('div', {
        className: styles.info,
        children: [
          _jsxs('div', { children: ['County: ', context.countyConfig?.countyId ?? 'unknown'] }),
          _jsxs('div', { children: ['Legacy: ', context.countyConfig?.legacySystem ?? 'unknown'] }),
          _jsxs('div', { children: ['Session: ', context.sessionId ?? 'none'] }),
        ],
      }),
      _jsxs('div', {
        className: styles.controls,
        children: [
          _jsxs('div', {
            className: styles.searchGroup,
            children: [
              _jsx('input', {
                type: 'text',
                placeholder: 'Enter Parcel ID (e.g., 123-456-789)',
                value: selectedParcel,
                onChange: (e) => setSelectedParcel(e.target.value),
                className: styles.input,
              }),
              _jsx('button', {
                className: styles.button,
                onClick: handleSearchParcel,
                disabled: loading || !selectedParcel,
                children: 'Search Parcel',
              }),
            ],
          }),
          _jsx('button', {
            className: styles.button,
            onClick: handleLoadParcels,
            disabled: loading,
            children: loading ? 'Loading...' : 'Load Area Parcels',
          }),
        ],
      }),
      parcelData &&
        _jsxs('div', {
          className: styles.results,
          children: [
            _jsx('div', { className: styles.resultsTitle, children: 'GIS Data:' }),
            _jsxs('div', {
              className: styles.mapPlaceholder,
              children: [
                '\uD83D\uDCCD Interactive Map Placeholder',
                _jsx('div', {
                  className: styles.mapNote,
                  children: 'Production: Leaflet/Cesium integration with Harris PACS overlay',
                }),
              ],
            }),
            _jsx('pre', {
              className: styles.resultsData,
              children: JSON.stringify(parcelData, null, 2),
            }),
          ],
        }),
    ],
  });
}
export default {
  mount: async (el, context) => {
    const root = createRoot(el);
    root.render(_jsx(GisCorePlugin, { context: context }));
    el.__tf_root = root;
  },
  unmount: async (el) => {
    const root = el.__tf_root;
    try {
      root?.unmount();
    } catch {
      // Ignore unmount errors
    }
    delete el.__tf_root;
  },
};
