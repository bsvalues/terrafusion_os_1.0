/**
 * Advanced Data Lineage Testing Script
 * 
 * This script tests more advanced aspects of the data lineage tracking functionality by:
 * 1. Creating multiple test properties
 * 2. Updating various fields across the properties
 * 3. Testing all data lineage API endpoints
 * 4. Validating data provenance chains
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

// Helper utility to format log messages
const logSection = (title) => {
  console.log('\n' + '='.repeat(50));
  console.log(`${title}`);
  console.log('='.repeat(50));
};

// Helper utility to create timestamp prefixes to make test property IDs unique
const getTimestampSuffix = () => Date.now().toString().substring(7);

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
  
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    return await response.json();
  } catch (error) {
    console.error(`Error making request to ${path}:`, error);
    throw error;
  }
}

async function testAdvancedDataLineage() {
  logSection('STARTING ADVANCED DATA LINEAGE TESTING');
  
  const testProperties = [];
  const sources = ['import', 'manual', 'api', 'calculated'];
  
  try {
    // Step 1: Create multiple test properties with different sources
    logSection('1. Creating multiple test properties');
    
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const suffix = getTimestampSuffix();
      
      const testProperty = {
        propertyId: `TEST-${source.toUpperCase()}-${suffix}`,
        address: `${i + 100} Test ${source.charAt(0).toUpperCase() + source.slice(1)} Avenue`,
        parcelNumber: `P-${source}-${suffix}`,
        propertyType: i % 2 === 0 ? 'residential' : 'commercial',
        acres: `${1 + i * 0.5}`,
        value: `${200000 + i * 50000}`,
        status: 'active',
        extraFields: {
          yearBuilt: 2000 + i * 5,
          bedrooms: i % 2 === 0 ? 3 : 4,
          bathrooms: i % 2 === 0 ? 2 : 3,
          // Add source info directly in extraFields since we can't directly manipulate the lineage
          source: source,
          sourceDetails: {
            importSource: source === 'import' ? 'CSV Import' : null,
            apiSource: source === 'api' ? 'External API' : null,
            calculationMethod: source === 'calculated' ? 'Assessment Algorithm' : null,
            manualOperator: source === 'manual' ? 'Test Operator' : null
          }
        }
      };
      
      const createdProperty = await makeRequest('/properties', 'POST', testProperty);
      console.log(`Property created: ${createdProperty.propertyId}`);
      testProperties.push(createdProperty);
      
      // Note: Since we don't have a direct API for creating lineage records,
      // we'll rely on the built-in lineage tracking that happens during property 
      // updates, which records changes with 'manual' source by default
      
      // Add a brief delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 2: Update some property values (which will automatically create lineage records)
    logSection('2. Updating property values');
    
    // Update each property with a different value
    for (let i = 0; i < testProperties.length; i++) {
      const property = testProperties[i];
      const source = sources[(i + 1) % sources.length]; // Rotate sources for reference
      
      // Update property value with source info in extraFields
      const propertyUpdate = {
        value: `${parseInt(property.value) + 25000}`,
        extraFields: {
          ...property.extraFields,
          updateSource: source, // This won't actually change the lineage source type in our system,
                               // but helps us reference it in the property data
          updateReason: `Value update demonstration for source: ${source}`
        }
      };
      
      const updatedProperty = await makeRequest(`/properties/${property.id}`, 'PATCH', propertyUpdate);
      console.log(`Property ${property.propertyId} value updated to: ${updatedProperty.value}`);
      
      // Add a brief delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 3: Query lineage by various sources
    logSection('3. Querying lineage by various sources');
    
    for (const source of sources) {
      const sourceLineage = await makeRequest(`/data-lineage/source/${source}`);
      console.log(`\nSource '${source}' lineage results:`);
      console.log(`- Found ${sourceLineage.totalRecords} records`);
      console.log(`- First record field: ${sourceLineage.lineage[0]?.fieldName}`);
      console.log(`- First record property: ${sourceLineage.lineage[0]?.propertyId}`);
    }
    
    // Step 4: Query property lineage for the first property
    logSection('4. Querying complete property lineage');
    
    const firstProperty = testProperties[0];
    const propertyLineage = await makeRequest(`/data-lineage/property/${firstProperty.propertyId}`);
    
    console.log(`\nProperty ${firstProperty.propertyId} lineage:`);
    console.log(`- Total fields with lineage: ${Object.keys(propertyLineage.lineage).length}`);
    
    for (const field in propertyLineage.lineage) {
      console.log(`\nField '${field}' changes:`);
      propertyLineage.lineage[field].forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.oldValue} → ${record.newValue} (${record.source})`);
      });
    }
    
    // Step 5: Query lineage by date range
    logSection('5. Querying lineage by date range');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    const dateRangeLineage = await makeRequest(
      `/data-lineage/date-range?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
    );
    
    console.log(`\nDate range lineage results for today:`);
    console.log(`- Total records: ${dateRangeLineage.totalRecords}`);
    console.log(`- Unique properties: ${new Set(dateRangeLineage.lineage.map(record => record.propertyId)).size}`);
    console.log(`- Unique fields: ${new Set(dateRangeLineage.lineage.map(record => record.fieldName)).size}`);
    console.log(`- Unique sources: ${new Set(dateRangeLineage.lineage.map(record => record.source)).size}`);
    
    // Step 6: Query data provenance by getting property-field lineage (more detailed check)
    logSection('6. Querying specific field lineage (similar to provenance)');
    
    for (let i = 0; i < 2; i++) { // Test first 2 properties
      const property = testProperties[i];
      console.log(`\nData lineage for ${property.propertyId}, field 'value':`);
      
      // Use the field-specific endpoint instead of provenance
      const fieldLineage = await makeRequest(`/data-lineage/property/${property.propertyId}/field/value`);
      
      if (fieldLineage.lineage && fieldLineage.lineage.length > 0) {
        console.log(`- Changes: ${fieldLineage.lineage.length}`);
        console.log(`- Current value: ${fieldLineage.lineage[0].newValue}`);
        console.log(`- First recorded: ${fieldLineage.lineage[fieldLineage.lineage.length-1].changeTimestamp}`);
        console.log(`- Last modified: ${fieldLineage.lineage[0].changeTimestamp}`);
        console.log(`- Change sources: ${fieldLineage.lineage.map(c => c.source).join(', ')}`);
      } else {
        console.log(`- No lineage data found for property ${property.propertyId}, field 'value'`);
      }
    }
    
    logSection('ADVANCED DATA LINEAGE TESTING COMPLETE');
    
  } catch (error) {
    console.error('Error during advanced data lineage testing:', error);
  }
}

testAdvancedDataLineage();