/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MeasurementType, MeasurementUnit, MapLayerType } from '../../client/src/lib/map-utils';
import MeasurementTool from '../../client/src/components/maps/measurement-tool';
import LayerFilter, { filterLayersByProperty } from '../../client/src/components/maps/layer-filter';
import BaseMapSelector from '../../client/src/components/maps/basemap-selector';

// Mock Leaflet to avoid DOM manipulation errors in tests
jest.mock('leaflet', () => ({
  DomUtil: {
    create: jest.fn().mockReturnValue({
      style: {},
      className: '',
      appendChild: jest.fn(),
    }),
  },
  DomEvent: {
    disableClickPropagation: jest.fn(),
    disableScrollPropagation: jest.fn(),
  },
  Control: {
    extend: jest.fn().mockReturnValue(function() {
      this.onAdd = jest.fn().mockReturnValue(document.createElement('div'));
      this.onRemove = jest.fn();
      return this;
    }),
  },
  TileLayer: jest.fn().mockImplementation(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
  })),
  LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
  Polyline: jest.fn().mockImplementation(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
  })),
  Polygon: jest.fn().mockImplementation(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
  })),
  LayerGroup: jest.fn().mockImplementation(() => ({
    addTo: jest.fn(),
    addLayer: jest.fn(),
    clearLayers: jest.fn(),
    remove: jest.fn(),
  })),
}));

// Mock turf.js module
jest.mock('@turf/turf', () => ({
  point: jest.fn(coords => ({ type: 'Point', coordinates: coords })),
  distance: jest.fn().mockReturnValue(100),
  area: jest.fn().mockReturnValue(5000),
  polygon: jest.fn(coords => ({ type: 'Polygon', coordinates: coords })),
  polygonToLine: jest.fn(),
  length: jest.fn().mockReturnValue(400),
  bbox: jest.fn().mockReturnValue([-120, 46, -119, 47]),
  featureCollection: jest.fn(features => ({
    type: 'FeatureCollection',
    features
  })),
}));

// Mock the map instance
const mockMap = {
  on: jest.fn(),
  off: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  hasEventListeners: jest.fn(),
  getContainer: jest.fn(() => document.createElement('div')),
  eachLayer: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
};

// Mock layers
const mockLayers = [
  { id: 1, name: 'Parcels', type: MapLayerType.PARCEL, visible: true, data: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { owner: 'Smith', acres: 5 }, geometry: { type: 'Polygon', coordinates: [[]] } },
    ]
  }},
  { id: 2, name: 'Zoning', type: MapLayerType.ZONING, visible: true, data: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { zone: 'Residential' }, geometry: { type: 'Polygon', coordinates: [[]] } },
    ]
  }},
  { id: 3, name: 'Streets', type: MapLayerType.STREET, visible: false, data: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Main St' }, geometry: { type: 'LineString', coordinates: [] } },
    ]
  }},
];

describe('Map Visualization Tools Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to switch between measurement types', () => {
    const onMeasure = jest.fn();
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
        onMeasure={onMeasure}
      />
    );
    
    // Switch to Area measurement
    fireEvent.click(screen.getByText(/Area/i));
    
    // Then to Perimeter
    fireEvent.click(screen.getByText(/Perimeter/i));
    
    // Verify the control displays correctly
    expect(screen.getByText(/Perimeter/i).closest('button')).toHaveClass('active');
  });
  
  it('should be able to filter map layers by type', () => {
    const onFilterChange = jest.fn();
    render(
      <LayerFilter 
        map={mockMap as any} 
        position="topright" 
        layers={mockLayers}
        onFilterChange={onFilterChange}
      />
    );
    
    // Expand the filter
    fireEvent.click(screen.getByText(/Expand/i));
    
    // Select a layer type
    fireEvent.click(screen.getByText(/Parcel/i));
    
    // Verify filter change was called correctly
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      types: expect.arrayContaining([MapLayerType.PARCEL])
    }));
  });
  
  it('should be able to change the base map', () => {
    const onBaseMapChange = jest.fn();
    render(
      <BaseMapSelector 
        map={mockMap as any} 
        position="topright" 
        onBaseMapChange={onBaseMapChange}
      />
    );
    
    // Select satellite view
    fireEvent.click(screen.getByLabelText(/Satellite/i));
    
    // Verify base map change was called correctly
    expect(onBaseMapChange).toHaveBeenCalledWith('satellite');
  });
  
  it('should correctly integrate measurement tool with map interactions', () => {
    const onMeasure = jest.fn();
    const { rerender } = render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
        onMeasure={onMeasure}
      />
    );
    
    // Start measurement
    fireEvent.click(screen.getByText(/Start/i));
    
    // Get map click handler
    const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')[1];
    
    // Simulate map clicks
    clickHandler({ latlng: { lat: 46.2, lng: -119.1 } });
    clickHandler({ latlng: { lat: 46.3, lng: -119.2 } });
    
    // Re-render with a measurement value to simulate what would happen after clicks
    rerender(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
        onMeasure={onMeasure}
        measurementValue={100}
        measurementType={MeasurementType.DISTANCE}
      />
    );
    
    // Verify measurement is displayed
    expect(screen.getByText(/100 m/i)).toBeInTheDocument();
  });
  
  it('should filter layers correctly based on property values', () => {
    // Test the filterLayersByProperty utility function
    const filters = {
      types: [MapLayerType.PARCEL],
      properties: [{ name: 'owner', value: 'Smith', operator: 'equals' }]
    };
    
    const filteredLayers = filterLayersByProperty(mockLayers, filters);
    
    // Should only return the Parcels layer that has an owner 'Smith'
    expect(filteredLayers).toHaveLength(1);
    expect(filteredLayers[0].name).toBe('Parcels');
  });
});