/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import MeasurementTool from '../../client/src/components/maps/measurement-tool';
import { MeasurementType, MeasurementUnit } from '../../client/src/lib/map-utils';
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
  point: jest.fn(),
  distance: jest.fn().mockReturnValue(100),
  area: jest.fn().mockReturnValue(5000),
  polygon: jest.fn(),
  polygonToLine: jest.fn(),
  length: jest.fn().mockReturnValue(400),
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

describe('MeasurementTool Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render measurement tool controls correctly', () => {
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
      />
    );
    
    // Check for title and measurement type options
    expect(screen.getByText(/Measure/i)).toBeInTheDocument();
    expect(screen.getByText(/Distance/i)).toBeInTheDocument();
    expect(screen.getByText(/Area/i)).toBeInTheDocument();
    expect(screen.getByText(/Perimeter/i)).toBeInTheDocument();
  });
  
  it('should switch between measurement types', () => {
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
      />
    );
    
    // Click on Area button
    fireEvent.click(screen.getByText(/Area/i));
    
    // Verify Area button is now active
    expect(screen.getByText(/Area/i).closest('button')).toHaveClass('active');
    
    // Click on Perimeter button
    fireEvent.click(screen.getByText(/Perimeter/i));
    
    // Verify Perimeter button is now active
    expect(screen.getByText(/Perimeter/i).closest('button')).toHaveClass('active');
  });
  
  it('should start and stop measurements', () => {
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
      />
    );
    
    // Start measurement
    fireEvent.click(screen.getByText(/Start/i));
    
    // Verify button text changed to Stop
    expect(screen.getByText(/Stop/i)).toBeInTheDocument();
    
    // Stop measurement
    fireEvent.click(screen.getByText(/Stop/i));
    
    // Verify button text changed back to Start
    expect(screen.getByText(/Start/i)).toBeInTheDocument();
  });
  
  it('should change measurement units', () => {
    const onUnitChange = jest.fn();
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
        onUnitChange={onUnitChange}
      />
    );
    
    // Open units dropdown
    fireEvent.click(screen.getByText(/Units:/i));
    
    // Select Kilometers
    fireEvent.click(screen.getByText(/Kilometers/i));
    
    // Verify onUnitChange was called with correct unit
    expect(onUnitChange).toHaveBeenCalledWith(MeasurementUnit.KILOMETERS);
  });
  
  it('should reset measurement', () => {
    const onReset = jest.fn();
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
        onReset={onReset}
      />
    );
    
    // Click reset button
    fireEvent.click(screen.getByText(/Reset/i));
    
    // Verify onReset was called
    expect(onReset).toHaveBeenCalled();
  });
  
  it('should display measurement value in correct format', () => {
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
        measurementValue={1500}
        measurementType={MeasurementType.DISTANCE}
      />
    );
    
    // Verify formatted distance is displayed (1.50 km)
    expect(screen.getByText(/1.50 km/i)).toBeInTheDocument();
  });
  
  it('should display area in correct format', () => {
    render(
      <MeasurementTool 
        map={mockMap as any} 
        position="topright" 
        measurementValue={25000}
        measurementType={MeasurementType.AREA}
      />
    );
    
    // Verify formatted area is displayed (2.50 ha)
    expect(screen.getByText(/2.50 ha/i)).toBeInTheDocument();
  });
});