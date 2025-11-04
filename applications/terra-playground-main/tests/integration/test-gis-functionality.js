/**
 * GIS Functionality Testing
 *
 * This script tests the GIS components of the application including:
 * - MapBox token validation
 * - GIS layer availability
 * - Spatial operations
 * - OpenStreetMap fallback
 */

import fetch from 'node-fetch';

// Config
const API_BASE_URL = 'http://localhost:5000/api';
const GIS_ENDPOINT = `${API_BASE_URL}/gis`;

// Helper function for HTTP requests
async function makeRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error);
    return { success: false, error: error.message };
  }
}

// Test available GIS layers
async function testGISLayers() {
  console.log('Testing GIS Layers...');
  const result = await makeRequest(`${GIS_ENDPOINT}/layers`);

  if (result.success) {
    console.log(`Found ${result.data.length} GIS layers:`);
    result.data.forEach(layer => {
      console.log(`- ${layer.name} (${layer.id}): ${layer.description || 'No description'}`);
    });
    return result.data;
  } else {
    console.error('Failed to get GIS layers:', result.error || result.data);
    return null;
  }
}

// Test MapBox token validation
async function testMapBoxToken() {
  console.log('Testing MapBox Token...');
  // This endpoint might need to be adjusted based on your actual API
  const result = await makeRequest(`${GIS_ENDPOINT}/mapbox-token`);

  if (result.success) {
    if (result.data.token) {
      console.log('MapBox token is available');
      return true;
    } else {
      console.warn('MapBox token is not available, application might fall back to OpenStreetMap');
      return false;
    }
  } else {
    console.error('Failed to validate MapBox token:', result.error || result.data);
    return false;
  }
}

// Test spatial query capability
async function testSpatialQuery() {
  console.log('Testing Spatial Query Capability...');

  // Using a test bounding box for the query
  const bbox = {
    minLon: -97.5,
    minLat: 45.0,
    maxLon: -97.0,
    maxLat: 45.5,
  };

  const result = await makeRequest(`${GIS_ENDPOINT}/query/properties`, 'POST', {
    bbox,
    limit: 10,
  });

  if (result.success) {
    console.log(`Spatial query returned ${result.data.length} properties`);
    return result.data;
  } else {
    console.error('Failed to perform spatial query:', result.error || result.data);
    return null;
  }
}

// Test GIS agent operations
async function testGISAgentOperations() {
  console.log('Testing GIS Agent Operations...');

  // Test the spatial GIS agent's analyze capability
  const result = await makeRequest(
    `${API_BASE_URL}/agent-system/spatial-gis/analyze-area`,
    'POST',
    {
      bbox: {
        minLon: -97.5,
        minLat: 45.0,
        maxLon: -97.0,
        maxLat: 45.5,
      },
      layerIds: ['property-parcels'],
    }
  );

  if (result.success) {
    console.log('GIS Agent Analysis Result:', result.data);
    return result.data;
  } else {
    console.error('Failed to perform GIS agent analysis:', result.error || result.data);
    return null;
  }
}

// Test for OpenStreetMap fallback
async function testOpenStreetMapFallback() {
  console.log('Testing OpenStreetMap Fallback...');

  // Check if MapBox token is available
  const mapboxTokenAvailable = await testMapBoxToken();

  if (!mapboxTokenAvailable) {
    console.log('MapBox token not available, checking if OpenStreetMap fallback is active...');

    // This endpoint might need to be adjusted based on your actual API
    const result = await makeRequest(`${GIS_ENDPOINT}/map-provider`);

    if (result.success) {
      console.log('Map Provider:', result.data);

      if (result.data.provider === 'osm' || result.data.provider === 'openstreetmap') {
        console.log('OpenStreetMap fallback is active');
        return true;
      } else {
        console.warn('OpenStreetMap fallback is not active, map functionality might be limited');
        return false;
      }
    } else {
      console.error('Failed to check map provider:', result.error || result.data);
      return false;
    }
  } else {
    console.log('MapBox token is available, no need for OpenStreetMap fallback');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('===== STARTING GIS FUNCTIONALITY TESTS =====');

  try {
    // Test GIS layers
    await testGISLayers();

    // Test MapBox token
    const mapboxTokenAvailable = await testMapBoxToken();

    // Test OpenStreetMap fallback if MapBox token is not available
    if (!mapboxTokenAvailable) {
      await testOpenStreetMapFallback();
    }

    // Test spatial query capability
    await testSpatialQuery();

    // Test GIS agent operations
    await testGISAgentOperations();

    console.log('===== GIS FUNCTIONALITY TESTS COMPLETED =====');
  } catch (error) {
    console.error('Error running GIS functionality tests:', error);
  }
}

// Execute the tests
runAllTests().catch(console.error);
