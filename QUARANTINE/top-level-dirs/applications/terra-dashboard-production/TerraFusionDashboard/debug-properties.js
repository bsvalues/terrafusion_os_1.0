// Debug script to test property data fetching
const fetch = require('node-fetch');

async function testPropertyFetch() {
  try {
    const response = await fetch('http://localhost:5000/api/properties?limit=5');
    const data = await response.json();
    console.log('Properties fetched:', data.length);
    console.log('Sample property:', JSON.stringify(data[0], null, 2));
    console.log('All property IDs:', data.map(p => p.id));
  } catch (error) {
    console.error('Error:', error);
  }
}

testPropertyFetch();