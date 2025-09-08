import { render, screen, fireEvent } from '@testing-library/react';
import { ParcelPopup } from '@/components/maps/parcel-popup';
import { Parcel } from '@shared/schema';
import { GeoJSONFeature } from '@/lib/map-utils';

// Mock turf functions
jest.mock('@turf/turf', () => ({
  area: jest.fn(() => 10000), // 10000 square meters (roughly 2.47 acres)
}));

// Sample parcel data for testing
const mockParcel: Parcel = {
  id: 1,
  parcelNumber: '123456789012345',
  owner: 'John Doe',
  address: '123 Test Street',
  acres: 2.5,
  zoning: 'Residential'
};

// Sample GeoJSON feature for testing
const mockFeature: GeoJSONFeature = {
  type: 'Feature',
  properties: {
    id: 1,
    parcelNumber: '123456789012345',
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
};

describe('ParcelPopup', () => {
  test('renders parcel information correctly', () => {
    render(
      <ParcelPopup
        parcel={mockParcel}
        feature={mockFeature}
      />
    );
    
    // Check that the component displays the correct parcel information
    expect(screen.getByText(/Parcel 1/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText(/123-45-678-9012-345/i)).toBeInTheDocument();
    expect(screen.getByText(/Residential/i)).toBeInTheDocument();
    
    // Check that area calculation is displayed
    expect(screen.getByText(/2.5 acres/i)).toBeInTheDocument();
  });
  
  test('triggers onViewDetails callback when Details button is clicked', () => {
    const handleViewDetails = jest.fn();
    
    render(
      <ParcelPopup
        parcel={mockParcel}
        feature={mockFeature}
        onViewDetails={handleViewDetails}
      />
    );
    
    // Find and click the Details button
    const detailsButton = screen.getByText(/Details/i);
    fireEvent.click(detailsButton);
    
    // Check that the callback was called with the correct parameter
    expect(handleViewDetails).toHaveBeenCalledWith(mockParcel.id);
  });
  
  test('triggers onSelectParcel callback when Select button is clicked', () => {
    const handleSelectParcel = jest.fn();
    
    render(
      <ParcelPopup
        parcel={mockParcel}
        feature={mockFeature}
        onSelectParcel={handleSelectParcel}
      />
    );
    
    // Find and click the Select button
    const selectButton = screen.getByText(/Select/i);
    fireEvent.click(selectButton);
    
    // Check that the callback was called with the correct parameter
    expect(handleSelectParcel).toHaveBeenCalledWith(mockParcel.id);
  });
  
  test('buttons are not displayed when callbacks are not provided', () => {
    render(
      <ParcelPopup
        parcel={mockParcel}
        feature={mockFeature}
      />
    );
    
    // Check that the buttons are not displayed
    expect(screen.queryByText(/Details/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select/i)).not.toBeInTheDocument();
  });
  
  test('close button works when provided', () => {
    const handleClose = jest.fn();
    
    render(
      <ParcelPopup
        parcel={mockParcel}
        feature={mockFeature}
        onClose={handleClose}
      />
    );
    
    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /×/i });
    fireEvent.click(closeButton);
    
    // Check that the callback was called
    expect(handleClose).toHaveBeenCalled();
  });
  
  test('handles missing data gracefully', () => {
    const incompleteParcel: Parcel = {
      id: 2,
      parcelNumber: '987654321098765',
      // Missing other fields
    };
    
    render(
      <ParcelPopup
        parcel={incompleteParcel}
        feature={mockFeature}
      />
    );
    
    // Check that it renders with the minimum available data
    expect(screen.getByText(/Parcel 2/i)).toBeInTheDocument();
    expect(screen.getByText('987-65-432-1098-765')).toBeInTheDocument();
    expect(screen.getByText('Unknown Owner')).toBeInTheDocument();
    
    // Should not have address or zoning
    expect(screen.queryByText(/Residential/i)).not.toBeInTheDocument();
  });
});