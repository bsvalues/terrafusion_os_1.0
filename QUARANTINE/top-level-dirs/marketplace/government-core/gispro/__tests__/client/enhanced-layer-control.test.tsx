import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnhancedLayerControl from '@/components/maps/enhanced-layer-control';
import '@testing-library/jest-dom';

// Mock the fetch function for API calls
global.fetch = jest.fn();

describe('EnhancedLayerControl', () => {
  const mockLayers = [
    {
      id: 1,
      name: 'Parcel Boundaries',
      visible: true,
      opacity: 0.8,
      zindex: 10,
      order: 1
    },
    {
      id: 2,
      name: 'Zoning',
      visible: false,
      opacity: 0.5,
      zindex: 5,
      order: 2
    },
    {
      id: 3,
      name: 'Aerial Imagery',
      visible: true,
      opacity: 1.0,
      zindex: 1,
      order: 3
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful response for PATCH requests
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (options?.method === 'PATCH') {
        const layerId = url.toString().split('/').pop();
        const requestBody = JSON.parse(options.body as string);
        
        // Return updated layer
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockLayers.find(layer => layer.id === Number(layerId)),
            ...requestBody
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => ([])
      });
    });
  });

  test('renders list of map layers', () => {
    render(<EnhancedLayerControl layers={mockLayers} onLayersChanged={jest.fn()} />);
    
    // Check all layer names are displayed
    expect(screen.getByText('Parcel Boundaries')).toBeInTheDocument();
    expect(screen.getByText('Zoning')).toBeInTheDocument();
    expect(screen.getByText('Aerial Imagery')).toBeInTheDocument();
  });

  test('toggles layer visibility when checkbox is clicked', async () => {
    const mockOnLayersChanged = jest.fn();
    render(<EnhancedLayerControl 
      layers={mockLayers} 
      onLayersChanged={mockOnLayersChanged} 
    />);
    
    // Find the checkbox for the first layer (Parcel Boundaries)
    const visibilityCheckbox = screen.getAllByRole('checkbox')[0];
    expect(visibilityCheckbox).toBeChecked(); // Should be checked since visible=true
    
    // Click the checkbox to toggle visibility
    fireEvent.click(visibilityCheckbox);
    
    // Check that the API was called to update the layer
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/map-layers/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"visible":false')
        })
      );
      
      // Check that the onLayersChanged callback was called
      expect(mockOnLayersChanged).toHaveBeenCalled();
    });
  });

  test('updates layer opacity when slider is moved', async () => {
    const mockOnLayersChanged = jest.fn();
    render(<EnhancedLayerControl 
      layers={mockLayers} 
      onLayersChanged={mockOnLayersChanged} 
    />);
    
    // Find the opacity slider for the first layer
    const opacitySliders = screen.getAllByRole('slider');
    
    // Change the opacity slider value
    fireEvent.change(opacitySliders[0], { target: { value: '0.5' } });
    
    // Check that the API was called to update the layer
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/map-layers/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"opacity":0.5')
        })
      );
      
      // Check that the onLayersChanged callback was called
      expect(mockOnLayersChanged).toHaveBeenCalled();
    });
  });

  test('displays layer opacity as percentage', () => {
    render(<EnhancedLayerControl layers={mockLayers} onLayersChanged={jest.fn()} />);
    
    // The Parcel Boundaries layer has 0.8 opacity, which should be displayed as 80%
    expect(screen.getByText('80%')).toBeInTheDocument();
    
    // The Zoning layer has 0.5 opacity, which should be displayed as 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    // The Aerial Imagery layer has 1.0 opacity, which should be displayed as 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('sorts layers by order property', () => {
    // Create a new array with different order than the original order
    const unorderedLayers = [
      mockLayers[1], // Zoning, order: 2
      mockLayers[2], // Aerial Imagery, order: 3
      mockLayers[0]  // Parcel Boundaries, order: 1
    ];
    
    render(<EnhancedLayerControl layers={unorderedLayers} onLayersChanged={jest.fn()} />);
    
    // Get all layer names
    const layerNames = screen.getAllByText(/Parcel Boundaries|Zoning|Aerial Imagery/);
    
    // The layers should be displayed in order: Parcel Boundaries, Zoning, Aerial Imagery
    expect(layerNames[0]).toHaveTextContent('Parcel Boundaries');
    expect(layerNames[1]).toHaveTextContent('Zoning');
    expect(layerNames[2]).toHaveTextContent('Aerial Imagery');
  });

  test('handles errors from API gracefully', async () => {
    // Mock an error response
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });
    });
    
    const mockOnLayersChanged = jest.fn();
    render(<EnhancedLayerControl 
      layers={mockLayers} 
      onLayersChanged={mockOnLayersChanged} 
    />);
    
    // Find the checkbox for the first layer
    const visibilityCheckbox = screen.getAllByRole('checkbox')[0];
    
    // Click the checkbox to toggle visibility
    fireEvent.click(visibilityCheckbox);
    
    // Check that error handling shows a user-friendly message
    await waitFor(() => {
      // Look for error message
      expect(screen.getByText(/Failed to update layer/i)).toBeInTheDocument();
      
      // The onLayersChanged callback should not be called when there's an error
      expect(mockOnLayersChanged).not.toHaveBeenCalled();
    });
  });
});