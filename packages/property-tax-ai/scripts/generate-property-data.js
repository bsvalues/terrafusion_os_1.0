/**
 * Generate Property Data Script
 * 
 * This script adds sample property data to demonstrate the Property Story Generator.
 */

import fetch from 'node-fetch';

async function generatePropertyData() {
  try {
    console.log('Generating sample property data...');

    const apiKey = 'dev-key'; // This should match the key expected by validateApiKey middleware
    
    const response = await fetch('http://localhost:5000/api/properties/generate-samples', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`Success: ${result.message}`);
      console.log(`Created ${result.count} sample properties.`);
    } else {
      console.error(`Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error generating property data:', error);
  }
}

generatePropertyData();