import { describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';

/**
 * Test suite for map layer opacity handling.
 * 
 * These tests verify:
 * 1. The API handles null opacity values correctly by using a default value
 * 2. The opacity normalization from DB (0-100) to UI (0-1) works properly
 * 3. The API properly updates opacity values
 */
describe('Map Layer Opacity Handling', () => {
  const baseUrl = 'http://localhost:5000';
  
  test('GET /api/map-layers should normalize opacity values from 0-100 to 0-1', async () => {
    const response = await fetch(`${baseUrl}/api/map-layers`);
    expect(response.status).toBe(200);
    
    const layers = await response.json() as any[];
    expect(layers.length).toBeGreaterThan(0);
    
    // Check that all opacity values are between 0 and 1
    layers.forEach(layer => {
      expect(layer).toHaveProperty('opacity');
      expect(typeof layer.opacity).toBe('number');
      expect(layer.opacity).toBeGreaterThanOrEqual(0);
      expect(layer.opacity).toBeLessThanOrEqual(1);
    });
  });
  
  test('GET /api/map-layers/all should handle null opacity values by providing defaults', async () => {
    const response = await fetch(`${baseUrl}/api/map-layers/all`);
    expect(response.status).toBe(200);
    
    const layers = await response.json() as any[];
    expect(layers.length).toBeGreaterThan(0);
    
    // Check that all layers have opacity values (even if they were null in DB)
    layers.forEach(layer => {
      expect(layer).toHaveProperty('opacity');
      expect(typeof layer.opacity).toBe('number');
      expect(layer.opacity).toBeGreaterThanOrEqual(0);
      expect(layer.opacity).toBeLessThanOrEqual(1);
    });
  });
  
  test('PATCH /api/map-layers/:id should convert opacity from 0-1 to 0-100 when updating', async () => {
    // First get a layer to update
    const getResponse = await fetch(`${baseUrl}/api/map-layers`);
    const layers = await getResponse.json() as any[];
    const layerToUpdate = layers[0];
    
    // New opacity value (in UI scale 0-1)
    const newOpacity = 0.75;
    
    // Update the layer
    const updateResponse = await fetch(`${baseUrl}/api/map-layers/${layerToUpdate.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        opacity: newOpacity
      })
    });
    
    expect(updateResponse.status).toBe(200);
    const updatedLayer = await updateResponse.json() as any;
    
    // Verify the opacity was properly normalized in the response (back to 0-1 scale)
    expect(updatedLayer).toHaveProperty('opacity');
    expect(updatedLayer.opacity).toBeCloseTo(newOpacity, 2);
    
    // Verify via a subsequent GET request that the change persisted correctly
    const verifyResponse = await fetch(`${baseUrl}/api/map-layers/all`);
    const allLayers = await verifyResponse.json() as any[];
    const verifiedLayer = allLayers.find(l => l.id === layerToUpdate.id);
    
    expect(verifiedLayer).toBeDefined();
    expect(verifiedLayer.opacity).toBeCloseTo(newOpacity, 2);
  });
});