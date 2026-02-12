---
title: GeoAPI
sidebar_position: 4
---

# GeoAPI Package

The `geo-api` package provides a unified interface for working with geospatial data and mapping providers in the Terrafusion platform. It abstracts away the differences between various mapping libraries (Mapbox, OpenLayers) to provide a consistent API for geospatial operations.

## Package Structure

```
packages/geo-api/
├── src/
│   ├── index.ts                  # Main export file
│   ├── geo-api.ts                # Core GeoAPI facade class
│   ├── providers/                # Provider implementations
│   │   ├── mapbox-provider.ts    # Mapbox implementation
│   │   ├── openlayers-provider.ts # OpenLayers implementation
│   │   └── provider-interface.ts  # Common provider interface
│   ├── models/                   # Geospatial data models
│   │   ├── coordinate.ts         # Coordinate structures
│   │   └── layer.ts              # Layer definitions
│   └── utils/                    # Utility functions
│       ├── projection.ts         # Projection utilities
│       └── geometry.ts           # Geometry helpers
├── tests/                        # Unit tests
├── package.json
└── tsconfig.json
```

## Core Concepts

### Provider Interface

The GeoAPI is built around a provider interface that abstracts mapping libraries:

```typescript
// From provider-interface.ts
export interface GeoProvider {
  initialize(config: ProviderConfig): Promise<void>;
  createMap(element: HTMLElement, options: MapOptions): Map;
  addLayer(map: Map, layer: Layer): void;
  removeLayer(map: Map, layerId: string): void;
  fitBounds(map: Map, bounds: BoundingBox): void;
  getFeatureAtPoint(map: Map, point: Point): Feature | null;
  // Additional methods...
}
```

### Map Abstraction

The GeoAPI provides a unified Map abstraction:

```typescript
// From geo-api.ts
export class GeoAPI {
  private provider: GeoProvider;

  constructor(providerType: 'mapbox' | 'openlayers', config: ProviderConfig) {
    this.provider = this.createProvider(providerType);
    this.provider.initialize(config);
  }

  private createProvider(type: 'mapbox' | 'openlayers'): GeoProvider {
    switch (type) {
      case 'mapbox':
        return new MapboxProvider();
      case 'openlayers':
        return new OpenLayersProvider();
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  createMap(element: HTMLElement, options: MapOptions): Map {
    return this.provider.createMap(element, options);
  }

  // Additional methods that delegate to the provider...
}
```

## Usage

### Basic Map Initialization

```typescript
import { GeoAPI } from '@terrafusion/geo-api';

// Create a GeoAPI instance with your preferred provider
const geoApi = new GeoAPI('mapbox', {
  apiKey: 'your-mapbox-token',
  // Additional configuration...
});

// Create a map in a DOM element
const map = geoApi.createMap(document.getElementById('map-container'), {
  center: { lat: 47.751076, lng: -120.740135 }, // Center on Washington state
  zoom: 7,
  style: 'streets',
});

// Add a GeoJSON layer
geoApi.addLayer(map, {
  id: 'parcels',
  type: 'fill',
  source: {
    type: 'geojson',
    data: parcelData, // Your GeoJSON data
  },
  paint: {
    'fill-color': '#0080ff',
    'fill-opacity': 0.5,
    'fill-outline-color': '#000000',
  },
});
```

### Working with Layers

```typescript
// Add a WMS layer
geoApi.addLayer(map, {
  id: 'aerial-imagery',
  type: 'raster',
  source: {
    type: 'wms',
    url: 'https://imagery.example.org/wms',
    layers: 'aerial',
    tileSize: 256,
  },
});

// Remove a layer
geoApi.removeLayer(map, 'aerial-imagery');

// Toggle layer visibility
geoApi.setLayerVisibility(map, 'parcels', false);
```

### Spatial Operations

```typescript
// Get a feature at a specific point
const point = { x: 100, y: 200 }; // Screen coordinates
const feature = geoApi.getFeatureAtPoint(map, point);

// Fit the map to a bounding box
geoApi.fitBounds(map, {
  north: 48.2,
  south: 46.9,
  east: -119.0,
  west: -122.2,
});

// Get distance between two points
const distance = geoApi.utils.calculateDistance(
  { lat: 47.6062, lng: -122.3321 }, // Seattle
  { lat: 47.6588, lng: -117.426 } // Spokane
);
```

## Provider-Specific Features

While most functionality is abstracted, you can access provider-specific features when needed:

```typescript
// Get the underlying provider instance
const mapboxProvider = geoApi.getProviderInstance() as MapboxProvider;

// Use Mapbox-specific functionality
mapboxProvider.enableTerrain();
```

## Best Practices

1. **Provider Agnostic Code**: Write code that works with any provider when possible
2. **Error Handling**: Handle potential errors from geospatial operations
3. **Performance**: Be mindful of layer count and complexity with large datasets
4. **Responsive Design**: Ensure maps resize properly on different screen sizes
