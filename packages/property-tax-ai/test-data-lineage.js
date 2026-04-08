/**
 * Data Lineage Testing Script
 * 
 * This script tests the data lineage tracking functionality by:
 * 1. Creating a test property
 * 2. Updating the property value multiple times
 * 3. Querying the data lineage API to verify changes are tracked properly
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

async function makeRequest(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${path}`, options);
  return await response.json();
}

async function testDataLineage() {
  console.log('============================================');
  console.log('STARTING DATA LINEAGE TESTING');
  console.log('============================================');
  
  // Step 1: Create a test property
  console.log('\n1. Creating test property...');
  const testProperty = {
    propertyId: `TEST-${Date.now()}`,
    address: '123 Test Avenue',
    parcelNumber: `P-${Date.now()}`,
    propertyType: 'residential',
    acres: '1.5',
    value: '250000',
    status: 'active',
    extraFields: {
      yearBuilt: 2005,
      bedrooms: 3,
      bathrooms: 2
    }
  };
  
  const createdProperty = await makeRequest('/properties', 'POST', testProperty);
  console.log(`Property created: ${createdProperty.propertyId}`);
  
  // Step 2: Update the property value
  console.log('\n2. Updating property value (first update)...');
  const firstUpdate = {
    value: '275000',
  };
  
  const firstUpdateResult = await makeRequest(`/properties/${createdProperty.id}`, 'PATCH', firstUpdate);
  console.log(`Property value updated to: ${firstUpdateResult.value}`);
  
  // Wait briefly to ensure timestamps are different
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Update the property value again
  console.log('\n3. Updating property value (second update)...');
  const secondUpdate = {
    value: '300000',
  };
  
  const secondUpdateResult = await makeRequest(`/properties/${createdProperty.id}`, 'PATCH', secondUpdate);
  console.log(`Property value updated to: ${secondUpdateResult.value}`);
  
  // Wait briefly to ensure timestamps are different
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Query data lineage API for this property
  console.log('\n4. Querying data lineage for property...');
  const propertyLineage = await makeRequest(`/data-lineage/property/${createdProperty.propertyId}`);
  
  console.log('Property Lineage Results:');
  console.log(JSON.stringify(propertyLineage, null, 2));
  
  // Step 5: Query data lineage API for specific field (property value)
  console.log('\n5. Querying data lineage for property value field...');
  const fieldLineage = await makeRequest(`/data-lineage/property/${createdProperty.propertyId}/field/value`);
  
  console.log('Field Lineage Results:');
  console.log(JSON.stringify(fieldLineage, null, 2));
  
  // Step 6: Query data lineage by source type
  console.log('\n6. Querying data lineage by source type (manual)...');
  const sourceLineage = await makeRequest('/data-lineage/source/manual');
  
  console.log('Source Lineage Results:');
  console.log(`Found ${sourceLineage.totalRecords} records from manual source`);
  
  // Step 7: Query data lineage by date range
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  console.log('\n7. Querying data lineage by date range (today)...');
  const dateRangeLineage = await makeRequest(`/data-lineage/date-range?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`);
  
  console.log('Date Range Lineage Results:');
  console.log(`Found ${dateRangeLineage.totalRecords} records for today`);
  
  console.log('\n============================================');
  console.log('DATA LINEAGE TESTING COMPLETE');
  console.log('============================================');
}

testDataLineage().catch(error => {
  console.error('Error during data lineage testing:', error);
});