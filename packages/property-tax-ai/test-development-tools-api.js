/**
 * Development Tools API Test Script
 *
 * This script tests the Development Tools API endpoints, specifically:
 * - Code Snippets Library
 * - Data Visualization Workshop
 * - UI Component Playground
 *
 * Run with: node test-development-tools-api.js
 */

const fetch = require('node-fetch');

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Helper function to make API requests
 */
async function makeRequest(path, method = 'GET', body = null) {
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
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${path}:`, error);
    return { status: 500, error: error.message };
  }
}

/**
 * Test Code Snippets API endpoints
 */
async function testCodeSnippetsAPI() {
  console.log('\n=== Testing Code Snippets API ===\n');
  
  // Get metadata first
  console.log('1. Getting code snippet metadata...');
  const metadataResult = await makeRequest('/code-snippets/metadata');
  console.log(`Status: ${metadataResult.status}`);
  console.log('Metadata:', metadataResult.data);
  
  // Create a test snippet
  console.log('\n2. Creating a test code snippet...');
  const createResult = await makeRequest('/code-snippets', 'POST', {
    name: 'Test Utility Function',
    description: 'A simple utility function for testing',
    language: 'javascript',
    snippetType: 'UTILITY',
    code: `/**
 * Formats a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  }).format(amount);
}`,
    tags: ['utility', 'formatting', 'currency'],
    createdBy: 1,
    isPublic: true
  });
  
  console.log(`Status: ${createResult.status}`);
  console.log('Created snippet:', createResult.data);
  
  // Save the ID for later operations
  const snippetId = createResult.data?.id;
  
  if (snippetId) {
    // Get all snippets
    console.log('\n3. Getting all code snippets...');
    const listResult = await makeRequest('/code-snippets');
    console.log(`Status: ${listResult.status}`);
    console.log(`Found ${listResult.data?.length || 0} snippets`);
    
    // Get the specific snippet
    console.log('\n4. Getting specific code snippet...');
    const getResult = await makeRequest(`/code-snippets/${snippetId}`);
    console.log(`Status: ${getResult.status}`);
    console.log('Retrieved snippet:', getResult.data);
    
    // Update the snippet
    console.log('\n5. Updating code snippet...');
    const updateResult = await makeRequest(`/code-snippets/${snippetId}`, 'PUT', {
      description: 'An updated utility function for testing',
      tags: ['utility', 'formatting', 'currency', 'updated']
    });
    console.log(`Status: ${updateResult.status}`);
    console.log('Updated snippet:', updateResult.data);
    
    // Generate a snippet with AI
    console.log('\n6. Generating a code snippet with AI...');
    const generateResult = await makeRequest('/code-snippets/generate', 'POST', {
      prompt: 'Create a function that converts Celsius to Fahrenheit',
      language: 'javascript',
      snippetType: 'FUNCTION'
    });
    console.log(`Status: ${generateResult.status}`);
    console.log('Generated snippet:', generateResult.data);
    
    // Delete the test snippet
    console.log('\n7. Deleting code snippet...');
    const deleteResult = await makeRequest(`/code-snippets/${snippetId}`, 'DELETE');
    console.log(`Status: ${deleteResult.status}`);
    console.log('Snippet deleted successfully');
  }
}

/**
 * Test Data Visualizations API endpoints
 */
async function testDataVisualizationsAPI() {
  console.log('\n=== Testing Data Visualizations API ===\n');
  
  // Get metadata first
  console.log('1. Getting data visualization metadata...');
  const metadataResult = await makeRequest('/data-visualizations/metadata');
  console.log(`Status: ${metadataResult.status}`);
  console.log('Metadata:', metadataResult.data);
  
  // Sample data source for visualizations
  const sampleDataSource = {
    data: [
      { month: 'Jan', sales: 1000, profit: 200 },
      { month: 'Feb', sales: 1500, profit: 350 },
      { month: 'Mar', sales: 1200, profit: 250 },
      { month: 'Apr', sales: 1800, profit: 450 },
      { month: 'May', sales: 2000, profit: 500 },
      { month: 'Jun', sales: 2200, profit: 550 }
    ],
    type: 'json',
    source: 'manual'
  };
  
  // Create a test visualization
  console.log('\n2. Creating a test data visualization...');
  const createResult = await makeRequest('/data-visualizations', 'POST', {
    name: 'Monthly Sales and Profit',
    description: 'Chart showing monthly sales and profit data',
    visualizationType: 'BAR_CHART',
    dataSource: sampleDataSource,
    configuration: {
      xAxis: { dataKey: 'month' },
      yAxis: { label: 'Amount ($)' },
      series: [
        { dataKey: 'sales', name: 'Sales', color: '#8884d8' },
        { dataKey: 'profit', name: 'Profit', color: '#82ca9d' }
      ],
      legend: { position: 'top' }
    },
    createdBy: 1,
    isPublic: true
  });
  
  console.log(`Status: ${createResult.status}`);
  console.log('Created visualization:', createResult.data);
  
  // Save the ID for later operations
  const vizId = createResult.data?.id;
  
  if (vizId) {
    // Get all visualizations
    console.log('\n3. Getting all data visualizations...');
    const listResult = await makeRequest('/data-visualizations');
    console.log(`Status: ${listResult.status}`);
    console.log(`Found ${listResult.data?.length || 0} visualizations`);
    
    // Get the specific visualization
    console.log('\n4. Getting specific data visualization...');
    const getResult = await makeRequest(`/data-visualizations/${vizId}`);
    console.log(`Status: ${getResult.status}`);
    console.log('Retrieved visualization:', getResult.data);
    
    // Update the visualization
    console.log('\n5. Updating data visualization...');
    const updateResult = await makeRequest(`/data-visualizations/${vizId}`, 'PUT', {
      description: 'Updated chart showing monthly sales and profit data',
      configuration: {
        ...createResult.data.configuration,
        title: 'Monthly Performance',
        theme: 'assessment-blues'
      }
    });
    console.log(`Status: ${updateResult.status}`);
    console.log('Updated visualization:', updateResult.data);
    
    // Generate a visualization config with AI
    console.log('\n6. Generating a visualization config with AI...');
    const generateResult = await makeRequest('/data-visualizations/generate-config', 'POST', {
      dataSource: {
        data: [
          { county: 'Benton', residential: 15000, commercial: 5000, agricultural: 8000 },
          { county: 'Franklin', residential: 12000, commercial: 3500, agricultural: 9500 },
          { county: 'Grant', residential: 9000, commercial: 4200, agricultural: 12000 }
        ],
        type: 'json',
        source: 'manual'
      },
      visualizationType: 'PIE_CHART',
      description: 'Property assessment value distribution by county and category'
    });
    console.log(`Status: ${generateResult.status}`);
    console.log('Generated visualization config:', generateResult.data);
    
    // Delete the test visualization
    console.log('\n7. Deleting data visualization...');
    const deleteResult = await makeRequest(`/data-visualizations/${vizId}`, 'DELETE');
    console.log(`Status: ${deleteResult.status}`);
    console.log('Visualization deleted successfully');
  }
}

/**
 * Test UI Component Templates API endpoints
 */
async function testUIComponentTemplatesAPI() {
  console.log('\n=== Testing UI Component Templates API ===\n');
  
  // Get metadata first
  console.log('1. Getting UI component metadata...');
  const metadataResult = await makeRequest('/ui-components/metadata');
  console.log(`Status: ${metadataResult.status}`);
  console.log('Metadata:', metadataResult.data);
  
  // Create a test component
  console.log('\n2. Creating a test UI component template...');
  const createResult = await makeRequest('/ui-components', 'POST', {
    name: 'Property Card',
    description: 'A card component to display property details',
    componentType: 'DISPLAY',
    framework: 'react',
    code: `import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';

/**
 * PropertyCard - Displays a property with its details
 * @param {Object} props
 * @param {string} props.address - Property address
 * @param {string} props.propertyType - Type of property
 * @param {number} props.value - Property value
 * @param {string} props.status - Status (e.g., "Active", "Pending")
 * @param {string} props.image - Image URL
 */
export const PropertyCard = ({ 
  address, 
  propertyType, 
  value, 
  status, 
  image 
}) => {
  return (
    <Card sx={{ maxWidth: 345, mb: 2 }}>
      {image && (
        <Box 
          sx={{ 
            height: 140, 
            backgroundImage: \`url(\${image})\`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
          }} 
        />
      )}
      <CardContent>
        <Typography variant="h6" noWrap>
          {address}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {propertyType}
          </Typography>
          <Chip 
            label={status} 
            size="small" 
            color={status === 'Active' ? 'success' : 'default'} 
          />
        </Box>
        <Typography variant="h6" sx={{ mt: 1 }}>
          ${value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;`,
    tags: ['property', 'card', 'display', 'material-ui'],
    createdBy: 1,
    isPublic: true
  });
  
  console.log(`Status: ${createResult.status}`);
  console.log('Created component:', createResult.data);
  
  // Save the ID for later operations
  const componentId = createResult.data?.id;
  
  if (componentId) {
    // Get all components
    console.log('\n3. Getting all UI component templates...');
    const listResult = await makeRequest('/ui-components');
    console.log(`Status: ${listResult.status}`);
    console.log(`Found ${listResult.data?.length || 0} components`);
    
    // Get the specific component
    console.log('\n4. Getting specific UI component template...');
    const getResult = await makeRequest(`/ui-components/${componentId}`);
    console.log(`Status: ${getResult.status}`);
    console.log('Retrieved component:', getResult.data);
    
    // Update the component
    console.log('\n5. Updating UI component template...');
    const updateResult = await makeRequest(`/ui-components/${componentId}`, 'PUT', {
      description: 'An updated card component for displaying property details',
      tags: ['property', 'card', 'display', 'material-ui', 'responsive']
    });
    console.log(`Status: ${updateResult.status}`);
    console.log('Updated component:', updateResult.data);
    
    // Generate a component with AI
    console.log('\n6. Generating a UI component with AI...');
    const generateResult = await makeRequest('/ui-components/generate', 'POST', {
      prompt: 'Create a form component for adding a new property assessment with fields for address, property type, assessed value, and property description',
      framework: 'react',
      componentType: 'FORM'
    });
    console.log(`Status: ${generateResult.status}`);
    console.log('Generated component:', generateResult.data);
    
    // Delete the test component
    console.log('\n7. Deleting UI component template...');
    const deleteResult = await makeRequest(`/ui-components/${componentId}`, 'DELETE');
    console.log(`Status: ${deleteResult.status}`);
    console.log('Component deleted successfully');
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Development Tools API Tests...');
  
  try {
    await testCodeSnippetsAPI();
    await testDataVisualizationsAPI();
    await testUIComponentTemplatesAPI();
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Run the tests
runTests();