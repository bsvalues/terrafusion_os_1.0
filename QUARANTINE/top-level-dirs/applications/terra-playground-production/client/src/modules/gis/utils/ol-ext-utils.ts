/**
 * OpenLayers Extension Utilities
 *
 * This file provides simplified utilities for working with OpenLayers
 * without relying on the problematic ol-ext library.
 */
import Control from 'ol/control/Control';
import { Map } from 'ol';

// Safe dynamic import function for ol-ext modules
export async function importOlExt(modulePath: string) {
  return {
    default: null,
    // Mock additional exports as needed
  };
}

// Fallback implementations for common ol-ext functions
export const olExtFallbacks = {
  // Fallback for ElevationFilter
  createElevationFilter: (options: any) => {
    // Return a minimal compatible interface
    return {
      setElevation: (value: number) => ,
      setColor: (color: any) => ,
      setLighting: (options: any) => ,
    };
  },

  // Fallback for Elevation control
  createElevationControl: (options: any) => {
    // Create a basic control that can be added to a map
    const controlDiv = document.createElement('div');
    controlDiv.className = 'ol-elevation ol-unselectable ol-control';
    controlDiv.style.display = 'none'; // Hide it since it's just a stub

    if (options.target) {
      // If a target is provided, we'll create a simple message there
      const targetElement =
        typeof options.target === 'string'
          ? document.getElementById(options.target)
          : options.target;

      if (targetElement) {
        targetElement.innerHTML =
          '<div class="elevation-fallback">Elevation profile not available</div>';
        targetElement.style.backgroundColor = '#f5f5f5';
        targetElement.style.padding = '10px';
        targetElement.style.textAlign = 'center';
        targetElement.style.color = '#666';
      }
    }

    // Create a basic OpenLayers control
    const control = new Control({
      element: controlDiv,
    });

    // Add mock methods that the original control would have
    const mockControl = Object.assign(control, {
      getProfile: () => [],
      setGeometry: () => ,
      draw: () => ,
      clear: () => ,
    });

    return mockControl;
  },

  // Fallback for Contour source
  createContourSource: (options: any) => {
    // Return a minimal compatible interface
    return {
      getFeatures: () => [],
      getBuffer: () => null,
      getProjection: () => null,
      getAttributions: () => null,
      getState: () => 'ready',
    };
  },
};

// Map service types
export interface MapProviderOptions {
  apiKey?: string;
  mapType?: string;
  center?: [number, number];
  zoom?: number;
}

export type MapProviderType = 'mapbox' | 'google' | 'qgis' | 'osm';

