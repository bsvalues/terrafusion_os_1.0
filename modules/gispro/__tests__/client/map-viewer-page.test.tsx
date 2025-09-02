import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import MapViewerPage from '@/pages/map-viewer-page';
import '@testing-library/jest-dom';

// Mock the fetch function to return test data
global.fetch = jest.fn();

// Mock the components that might be difficult to render in tests
jest.mock('@/components/maps/enhanced-map-viewer', () => ({
  __esModule: true,
  default: jest.fn(({ children, mapLayers }) => (
    <div data-testid="mock-map-viewer">
      <div data-testid="map-layers">
        {JSON.stringify(mapLayers)}
      </div>
      {children}
    </div>
  ))
}));

jest.mock('@/components/maps/enhanced-layer-control', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-layer-control" />)
}));

jest.mock('@/components/layout/sidebar', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-sidebar" />)
}));

jest.mock('@/components/layout/header', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-header" />)
}));

describe('MapViewerPage', () => {
  beforeEach(() => {
    // Reset the fetch mock before each test
    jest.clearAllMocks();
    
    // Mock successful response for map layers
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 1,
          name: 'Property Boundaries',
          source: 'county_gis',
          type: 'vector',
          visible: true,
          opacity: 0.8, // Note: Already in 0-1 scale as the API would return
          zindex: 10,
          order: 1,
          metadata: {
            style: {
              color: '#ff0000',
              weight: 2
            },
            description: 'Current property boundaries'
          }
        },
        {
          id: 2,
          name: 'Zoning',
          source: 'county_gis',
          type: 'vector',
          visible: true,
          opacity: 0.5, // Note: Already in 0-1 scale as the API would return
          zindex: 5,
          order: 2,
          metadata: {
            style: {
              color: '#0000ff',
              weight: 1
            },
            description: 'Current zoning'
          }
        }
      ])
    });
  });

  test('renders map viewer with layers from API', async () => {
    await act(async () => {
      render(<MapViewerPage />);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/map-layers', expect.any(Object));
    
    // Wait for the map layers to be loaded and rendered
    await waitFor(() => {
      const mapLayersEl = screen.getByTestId('map-layers');
      const layersData = JSON.parse(mapLayersEl.textContent || '[]');
      
      // Check that we have the expected number of layers
      expect(layersData.length).toBe(2);
      
      // Check that the layer data is correctly formatted for the map component
      expect(layersData[0].name).toBe('Property Boundaries');
      expect(layersData[1].name).toBe('Zoning');
      
      // Check that each layer has the expected structure
      layersData.forEach((layer: any) => {
        expect(layer).toHaveProperty('name');
        expect(layer).toHaveProperty('data');
        expect(layer).toHaveProperty('style');
        expect(layer.data.type).toBe('FeatureCollection');
      });
    });
    
    // Verify the layer control component is rendered
    expect(screen.getByTestId('mock-layer-control')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Override the fetch mock to simulate an error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    await act(async () => {
      render(<MapViewerPage />);
    });

    // Wait for the error to be handled
    await waitFor(() => {
      const mapLayersEl = screen.getByTestId('map-layers');
      const layersData = JSON.parse(mapLayersEl.textContent || '[]');
      
      // Should render with empty layers array on error
      expect(layersData.length).toBe(0);
    });
    
    // Even with API errors, the page should still render
    expect(screen.getByTestId('mock-map-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-layer-control')).toBeInTheDocument();
  });

  test('correctly formats map layer styles', async () => {
    await act(async () => {
      render(<MapViewerPage />);
    });
    
    // Wait for the map layers to be loaded and rendered
    await waitFor(() => {
      const mapLayersEl = screen.getByTestId('map-layers');
      const layersData = JSON.parse(mapLayersEl.textContent || '[]');
      
      // Check that layer styles are correctly formatted
      expect(layersData[0].style.color).toBe('#ff0000');
      expect(layersData[0].style.weight).toBe(2);
      expect(layersData[1].style.color).toBe('#0000ff');
      expect(layersData[1].style.weight).toBe(1);
    });
  });
});