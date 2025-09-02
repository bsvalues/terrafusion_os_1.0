/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapViewer } from '../../client/src/components/maps/map-viewer';
import { MapLayer } from '@shared/schema';

// Mock Leaflet map and related components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  GeoJSON: () => <div data-testid="geojson-layer" />,
  LayersControl: {
    BaseLayer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="base-layer">{children}</div>
    ),
    Overlay: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="overlay-layer">{children}</div>
    ),
  },
  useMap: () => ({
    setView: jest.fn(),
    fitBounds: jest.fn(),
  }),
}));

describe('MapViewer Component', () => {
  const mockLayers: MapLayer[] = [
    { id: 1, name: 'Parcels', type: 'geojson', source: '/api/layers/parcels', visible: true },
    { id: 2, name: 'Roads', type: 'geojson', source: '/api/layers/roads', visible: false },
    { id: 3, name: 'Zoning', type: 'geojson', source: '/api/layers/zoning', visible: false },
  ];

  test('should render map with default layers', () => {
    render(<MapViewer mapLayers={mockLayers} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  test('should display parcel layer by default', () => {
    render(<MapViewer mapLayers={mockLayers} />);
    
    expect(screen.getAllByTestId('geojson-layer').length).toBeGreaterThan(0);
  });

  test('should focus on a parcel when parcelId is provided', () => {
    render(<MapViewer mapLayers={mockLayers} parcelId="12345678901234" />);
    
    // Since we're mocking useMap, we can't directly test the setView function
    // but we can check if the component renders with the parcel ID
    expect(screen.getByText(/12345678901234/i)).toBeInTheDocument();
  });
  
  test('should provide layer toggle controls', () => {
    render(<MapViewer mapLayers={mockLayers} enableLayerControl={true} />);
    
    expect(screen.getAllByTestId('overlay-layer').length).toBe(mockLayers.length);
  });
});