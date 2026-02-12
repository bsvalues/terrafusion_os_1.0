/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import BaseMapSelector from '../../client/src/components/maps/basemap-selector';
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
  TileLayer: jest.fn().mockImplementation(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
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

describe('BaseMapSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render base map options correctly', () => {
    render(<BaseMapSelector map={mockMap as any} position="topright" />);
    
    // Verify the component renders with expected base map options
    expect(screen.getByText(/Base Map/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Street/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Satellite/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Topographic/i)).toBeInTheDocument();
  });
  
  it('should switch to satellite view when selected', () => {
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
    
    // Verify callback was called with satellite option
    expect(onBaseMapChange).toHaveBeenCalledWith('satellite');
  });
  
  it('should switch to topographic view when selected', () => {
    const onBaseMapChange = jest.fn();
    render(
      <BaseMapSelector 
        map={mockMap as any} 
        position="topright" 
        onBaseMapChange={onBaseMapChange}
      />
    );
    
    // Select topographic view
    fireEvent.click(screen.getByLabelText(/Topographic/i));
    
    // Verify callback was called with topo option
    expect(onBaseMapChange).toHaveBeenCalledWith('topo');
  });
  
  it('should switch to street view when selected', () => {
    const onBaseMapChange = jest.fn();
    render(
      <BaseMapSelector 
        map={mockMap as any} 
        position="topright" 
        initialBaseMap="satellite"
        onBaseMapChange={onBaseMapChange}
      />
    );
    
    // Select street view
    fireEvent.click(screen.getByLabelText(/Street/i));
    
    // Verify callback was called with street option
    expect(onBaseMapChange).toHaveBeenCalledWith('street');
  });
  
  it('should use the initial base map setting', () => {
    render(
      <BaseMapSelector 
        map={mockMap as any} 
        position="topright" 
        initialBaseMap="satellite"
      />
    );
    
    // Check if satellite is selected
    expect(screen.getByLabelText(/Satellite/i)).toBeChecked();
    expect(screen.getByLabelText(/Street/i)).not.toBeChecked();
  });
});