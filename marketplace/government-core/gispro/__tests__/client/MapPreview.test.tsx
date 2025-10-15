/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapPreview } from '../../client/src/components/maps/map-preview';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
jest.mock('../../client/src/lib/map-utils', () => ({
  getDummyParcelData: jest.fn(() => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
    },
    properties: {
      parcelId: 'test-parcel',
      address: '123 Test St',
      acres: 1.5
    }
  })),
  DEFAULT_MAP_LAYERS: [
    { id: 1, name: 'Parcels', visible: true, source: 'local', type: 'vector' },
    { id: 2, name: 'Roads', visible: true, source: 'local', type: 'vector' }
  ]
}));

describe('MapPreview Component', () => {
  const queryClient = new QueryClient();
  
  beforeEach(() => {
    // Setup component with required context
    render(
      <QueryClientProvider client={queryClient}>
        <MapPreview parcelId="12345678" />
      </QueryClientProvider>
    );
  });
  
  test('Renders map container', () => {
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
  
  test('Renders parcel information', () => {
    expect(screen.getByText(/Parcel Information/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Test St/i)).toBeInTheDocument();
    expect(screen.getByText(/1.5/i)).toBeInTheDocument();
  });
  
  test('Toggles map layers', () => {
    const layerToggle = screen.getByLabelText(/Parcels/i);
    expect(layerToggle).toBeChecked();
    
    fireEvent.click(layerToggle);
    expect(layerToggle).not.toBeChecked();
    
    fireEvent.click(layerToggle);
    expect(layerToggle).toBeChecked();
  });
  
  test('Triggers full map view when button clicked', () => {
    const onOpenFullMap = jest.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MapPreview 
          parcelId="12345678" 
          enableFullMap={true}
          onOpenFullMap={onOpenFullMap}
        />
      </QueryClientProvider>
    );
    
    const viewFullMapButton = screen.getByText(/View Full Map/i);
    fireEvent.click(viewFullMapButton);
    
    expect(onOpenFullMap).toHaveBeenCalled();
  });
});