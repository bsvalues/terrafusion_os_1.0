/**
 * Map Provider Service
 *
 * A unified service for managing map providers with QGIS as the primary focus.
 * This service enables our Terrafusion platform to seamlessly work with different
 * mapping backends while maintaining a consistent interface.
 */

import { create } from 'zustand';

// Available map provider types
export type MapProviderType = 'qgis' | 'mapbox' | 'arcgis' | 'google';

// Map provider configuration
export interface MapProviderConfig {
  type: MapProviderType;
  name: string;
  description: string;
  isOpenSource: boolean;
  apiKeyRequired: boolean;
  logoUrl?: string;
  website?: string;
  featureHighlights?: string[];
  isEnabled: boolean;
}

// Map provider store state
interface MapProviderState {
  currentProvider: MapProviderType;
  providers: Record<MapProviderType, MapProviderConfig>;
  setCurrentProvider: (provider: MapProviderType) => void;
  isProviderEnabled: (provider: MapProviderType) => boolean;
  enableProvider: (provider: MapProviderType, enabled: boolean) => void;
}

// Create the map provider store
export const useMapProvider = create<MapProviderState>((set, get) => ({
  // Default to QGIS as our primary focus
  currentProvider: 'qgis',

  // Provider configurations
  providers: {
    qgis: {
      type: 'qgis',
      name: 'QGIS',
      description:
        'Open-source Geographic Information System with advanced spatial analysis capabilities',
      isOpenSource: true,
      apiKeyRequired: false,
      logoUrl: '/qgis-logo.svg',
      website: 'https://qgis.org',
      featureHighlights: [
        'Completely open-source and free',
        'Advanced spatial analysis tools',
        'Extensive plugin ecosystem',
        'Desktop-to-web workflow',
        'Community-driven development',
      ],
      isEnabled: true,
    },
    mapbox: {
      type: 'mapbox',
      name: 'Mapbox',
      description: 'Customizable mapping platform for interactive visualizations',
      isOpenSource: false,
      apiKeyRequired: true,
      website: 'https://mapbox.com',
      isEnabled: false,
    },
    arcgis: {
      type: 'arcgis',
      name: 'ArcGIS',
      description: 'Industry-standard GIS platform with comprehensive toolset',
      isOpenSource: false,
      apiKeyRequired: true,
      website: 'https://www.esri.com/en-us/arcgis/about-arcgis/overview',
      isEnabled: false,
    },
    google: {
      type: 'google',
      name: 'Google Maps',
      description: 'Global mapping platform with extensive POI data',
      isOpenSource: false,
      apiKeyRequired: true,
      website: 'https://maps.google.com',
      isEnabled: false,
    },
  },

  // Set the current map provider
  setCurrentProvider: provider => {
    if (get().isProviderEnabled(provider)) {
      set({ currentProvider: provider });
    } else {
      console.warn(`Provider ${provider} is not enabled`);
    }
  },

  // Check if a provider is enabled
  isProviderEnabled: provider => {
    return get().providers[provider]?.isEnabled || false;
  },

  // Enable or disable a provider
  enableProvider: (provider, enabled) => {
    set(state => ({
      providers: {
        ...state.providers,
        [provider]: {
          ...state.providers[provider],
          isEnabled: enabled,
        },
      },
    }));

    // If disabling the current provider, switch to a different enabled provider
    if (!enabled && get().currentProvider === provider) {
      const fallbackProvider = Object.entries(get().providers).find(
        ([key, config]) => config.isEnabled && key !== provider
      );

      if (fallbackProvider) {
        set({ currentProvider: fallbackProvider[0] as MapProviderType });
      }
    }
  },
}));

/**
 * Hook to get the configuration for the current map provider
 */
export function useCurrentMapProvider() {
  const { currentProvider, providers } = useMapProvider();
  return providers[currentProvider];
}

/**
 * Get the appropriate attribution text for a map provider
 */
export function getMapProviderAttribution(provider: MapProviderType): string {
  switch (provider) {
    case 'qgis':
      return (
        '© <a href="https://qgis.org" target="_blank" rel="noopener">QGIS</a> | ' +
        'OpenStreetMap contributors | <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      );
    case 'mapbox':
      return (
        '© <a href="https://www.mapbox.com/" target="_blank" rel="noopener">Mapbox</a> | ' +
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      );
    case 'arcgis':
      return '© <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>';
    case 'google':
      return '© Google Maps';
    default:
      return '© OpenStreetMap contributors';
  }
}
