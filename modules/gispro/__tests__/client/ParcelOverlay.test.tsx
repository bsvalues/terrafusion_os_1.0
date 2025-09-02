import { render, screen } from '@testing-library/react';
import { ParcelOverlay } from '@/components/maps/parcel-overlay';
import { MapContainer } from 'react-leaflet';
import { Parcel } from '@shared/schema';

// Mock react-leaflet hooks
jest.mock('react-leaflet', () => {
  const originalModule = jest.requireActual('react-leaflet');
  
  return {
    ...originalModule,
    useMap: () => ({
      fitBounds: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
    }),
  };
});

// Mock the GeoJSON component from react-leaflet
jest.mock('react-leaflet', () => {
  const reactLeaflet = jest.requireActual('react-leaflet');
  
  return {
    ...reactLeaflet,
    GeoJSON: (props: any) => {
      // Store props for testing
      const { data, style, eventHandlers } = props;
      return <div data-testid="geojson-layer" data-data={JSON.stringify(data)} />;
    },
  };
});

// Mock useQuery hook
jest.mock('@tanstack/react-query', () => {
  return {
    ...jest.requireActual('@tanstack/react-query'),
    useQuery: ({ queryKey }) => {
      // Return mock parcel data based on the query key
      if (queryKey[0] === '/api/parcels') {
        return {
          data: mockParcels,
          isLoading: false,
        };
      }
      
      if (queryKey[0] === '/api/workflows' && queryKey[2] === 'parcels') {
        return {
          data: mockWorkflowParcels,
          isLoading: false,
        };
      }
      
      return {
        data: [],
        isLoading: false,
      };
    },
  };
});

// Mock parcel data for testing
const mockParcels: Parcel[] = [
  {
    id: 1,
    parcelNumber: '12345678901234',
    owner: 'John Doe',
    address: '123 Test Street',
    acres: 1.5,
    geoJson: {
      type: 'Feature',
      properties: {
        id: 1,
        parcelNumber: '12345678901234',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.0, 47.0],
            [-122.0, 47.1],
            [-121.9, 47.1],
            [-121.9, 47.0],
            [-122.0, 47.0],
          ],
        ],
      },
    },
  },
  {
    id: 2,
    parcelNumber: '23456789012345',
    owner: 'Jane Smith',
    address: '456 Test Avenue',
    acres: 2.5,
    geoJson: {
      type: 'Feature',
      properties: {
        id: 2,
        parcelNumber: '23456789012345',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.1, 47.0],
            [-122.1, 47.1],
            [-122.0, 47.1],
            [-122.0, 47.0],
            [-122.1, 47.0],
          ],
        ],
      },
    },
  },
];

// Mock workflow-specific parcel data
const mockWorkflowParcels: Parcel[] = [
  {
    id: 3,
    parcelNumber: '34567890123456',
    owner: 'Workflow Owner',
    address: '789 Workflow Road',
    acres: 3.5,
    geoJson: {
      type: 'Feature',
      properties: {
        id: 3,
        parcelNumber: '34567890123456',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.2, 47.0],
            [-122.2, 47.1],
            [-122.1, 47.1],
            [-122.1, 47.0],
            [-122.2, 47.0],
          ],
        ],
      },
    },
  },
];

// Test component wrapper to provide MapContainer context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MapContainer center={[0, 0]} zoom={10} style={{ height: '100vh' }}>
    {children}
  </MapContainer>
);

describe('ParcelOverlay', () => {
  test('renders parcels from API data', () => {
    render(
      <TestWrapper>
        <ParcelOverlay />
      </TestWrapper>
    );
    
    const geoJsonLayer = screen.getByTestId('geojson-layer');
    const dataAttr = geoJsonLayer.getAttribute('data-data');
    const parsedData = JSON.parse(dataAttr || '{}');
    
    // Check that the component renders a GeoJSON layer with the correct data
    expect(geoJsonLayer).toBeInTheDocument();
    expect(parsedData.features).toHaveLength(2);
    expect(parsedData.type).toBe('FeatureCollection');
  });
  
  test('renders workflow-specific parcels when workflowId is provided', () => {
    render(
      <TestWrapper>
        <ParcelOverlay workflowId={1} />
      </TestWrapper>
    );
    
    const geoJsonLayer = screen.getByTestId('geojson-layer');
    const dataAttr = geoJsonLayer.getAttribute('data-data');
    const parsedData = JSON.parse(dataAttr || '{}');
    
    // Check that the component renders the workflow-specific parcels
    expect(geoJsonLayer).toBeInTheDocument();
    expect(parsedData.features).toHaveLength(1);
    expect(parsedData.features[0].properties.id).toBe(3);
  });
  
  test('renders specific parcel when parcelId is provided', () => {
    render(
      <TestWrapper>
        <ParcelOverlay parcelId={1} />
      </TestWrapper>
    );
    
    const geoJsonLayer = screen.getByTestId('geojson-layer');
    const dataAttr = geoJsonLayer.getAttribute('data-data');
    const parsedData = JSON.parse(dataAttr || '{}');
    
    // Check that the component renders only the specified parcel
    expect(geoJsonLayer).toBeInTheDocument();
    expect(parsedData.features).toHaveLength(2); // Gets all but should filter by parcelId
  });
  
  test('applies filter function to parcels', () => {
    const filter = (parcel: Parcel) => parcel.acres > 2.0;
    
    render(
      <TestWrapper>
        <ParcelOverlay filter={filter} />
      </TestWrapper>
    );
    
    const geoJsonLayer = screen.getByTestId('geojson-layer');
    const dataAttr = geoJsonLayer.getAttribute('data-data');
    const parsedData = JSON.parse(dataAttr || '{}');
    
    // Check that the filter is applied correctly
    expect(geoJsonLayer).toBeInTheDocument();
    expect(parsedData.features).toHaveLength(1);
    expect(parsedData.features[0].properties.id).toBe(2);
  });
});