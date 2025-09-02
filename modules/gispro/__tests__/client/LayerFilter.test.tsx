/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import LayerFilter from '../../client/src/components/maps/layer-filter';
import { MapLayerType } from '../../client/src/lib/map-utils';
import '@testing-library/jest-dom';

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
}));

// Mock the map instance
const mockMap = {
  on: jest.fn(),
  off: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  hasEventListeners: jest.fn(),
  getContainer: jest.fn(() => document.createElement('div')),
};

// Mock layers
const mockLayers = [
  { id: 1, name: 'Parcels', type: MapLayerType.PARCEL, visible: true },
  { id: 2, name: 'Zoning', type: MapLayerType.ZONING, visible: true },
  { id: 3, name: 'Streets', type: MapLayerType.STREET, visible: false },
  { id: 4, name: 'Hydrology', type: MapLayerType.HYDROLOGY, visible: true },
];

describe('LayerFilter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render layer filter controls correctly', () => {
    render(
      <LayerFilter 
        map={mockMap as any} 
        position="topright" 
        layers={mockLayers}
      />
    );
    
    // Check for title and filter sections
    expect(screen.getByText(/Layer Filter/i)).toBeInTheDocument();
    expect(screen.getByText(/Layer Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Properties/i)).toBeInTheDocument();
  });
  
  it('should filter layers by type correctly', () => {
    const onFilterChange = jest.fn();
    render(
      <LayerFilter 
        map={mockMap as any} 
        position="topright" 
        layers={mockLayers}
        onFilterChange={onFilterChange}
      />
    );
    
    // Toggle a layer type filter
    fireEvent.click(screen.getByLabelText(/Parcels/i));
    
    // Verify filter change callback was called with correct filters
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      types: expect.arrayContaining([MapLayerType.PARCEL])
    }));
  });
  
  it('should filter layers by property values correctly', () => {
    const onFilterChange = jest.fn();
    render(
      <LayerFilter 
        map={mockMap as any} 
        position="topright" 
        layers={mockLayers}
        onFilterChange={onFilterChange}
      />
    );
    
    // Enter property filter
    const input = screen.getByPlaceholderText(/Enter property name/i);
    fireEvent.change(input, { target: { value: 'owner' } });
    
    const valueInput = screen.getByPlaceholderText(/Enter filter value/i);
    fireEvent.change(valueInput, { target: { value: 'Smith' } });
    
    // Apply filter
    fireEvent.click(screen.getByText(/Apply Filters/i));
    
    // Verify filter change callback was called with correct filters
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      properties: expect.arrayContaining([
        expect.objectContaining({ name: 'owner', value: 'Smith' })
      ])
    }));
  });
  
  it('should reset filters when clear button is clicked', () => {
    const onFilterChange = jest.fn();
    render(
      <LayerFilter 
        map={mockMap as any} 
        position="topright" 
        layers={mockLayers}
        onFilterChange={onFilterChange}
      />
    );
    
    // Set some filters first
    fireEvent.click(screen.getByLabelText(/Parcels/i));
    
    // Reset filters
    fireEvent.click(screen.getByText(/Clear Filters/i));
    
    // Verify filter change callback was called with empty filters
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      types: expect.arrayContaining([]),
      properties: expect.arrayContaining([])
    }));
  });
  
  it('should add multiple property filters', () => {
    const onFilterChange = jest.fn();
    render(
      <LayerFilter 
        map={mockMap as any} 
        position="topright" 
        layers={mockLayers}
        onFilterChange={onFilterChange}
      />
    );
    
    // Enter first property filter
    const input = screen.getByPlaceholderText(/Enter property name/i);
    fireEvent.change(input, { target: { value: 'owner' } });
    
    const valueInput = screen.getByPlaceholderText(/Enter filter value/i);
    fireEvent.change(valueInput, { target: { value: 'Smith' } });
    
    // Add the filter
    fireEvent.click(screen.getByText(/Add/i));
    
    // Enter second property filter
    fireEvent.change(input, { target: { value: 'acres' } });
    fireEvent.change(valueInput, { target: { value: '5' } });
    
    // Apply filters
    fireEvent.click(screen.getByText(/Apply Filters/i));
    
    // Verify filter change callback was called with both filters
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      properties: expect.arrayContaining([
        expect.objectContaining({ name: 'owner', value: 'Smith' }),
        expect.objectContaining({ name: 'acres', value: '5' })
      ])
    }));
  });
});