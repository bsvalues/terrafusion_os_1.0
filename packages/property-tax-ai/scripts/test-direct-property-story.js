/**
 * Direct Property Story Generator Test Script
 * 
 * This script tests the integration with OpenAI's API for property story generation.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check OpenAI API key
function isOpenAIApiKeyValid() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // Basic validation check
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return false;
  }
  
  // OpenAI API keys typically have a specific format and length
  if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
    return false;
  }
  
  return true;
}

// Initialize OpenAI client
let openai;
try {
  if (!isOpenAIApiKeyValid()) {
    throw new Error('OpenAI API key is missing or invalid');
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error('OpenAI initialization error:', error.message);
  process.exit(1);
}

// Mock property data for testing
const testProperties = {
  'BC001': {
    propertyId: 'BC001',
    address: '1320 N Louis Lane, Benton WA',
    parcelNumber: '12345-123-123',
    propertyType: 'residential',
    status: 'active',
    acres: 0.25,
    value: 375000,
    yearBuilt: 1985,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2400,
    zoning: 'R-1',
    landUse: 'Single Family Residential'
  },
  'BC002': {
    propertyId: 'BC002',
    address: '456 Commercial Parkway, Benton WA',
    parcelNumber: '12345-456-789',
    propertyType: 'commercial',
    status: 'active',
    acres: 1.2,
    value: 820000,
    yearBuilt: 2001,
    squareFeet: 5500,
    zoning: 'C-2',
    landUse: 'Commercial Retail'
  }
};

/**
 * Generate property story using OpenAI
 */
async function generatePropertyStory(propertyId, options = {}) {
  try {
    const property = testProperties[propertyId];
    
    if (!property) {
      throw new Error(`Property not found: ${propertyId}`);
    }
    
    // Build the prompt
    let promptContent = `Generate a detailed description of the following property:\n\n`;
    promptContent += `Property ID: ${property.propertyId}\n`;
    promptContent += `Address: ${property.address}\n`;
    promptContent += `Type: ${property.propertyType}\n`;
    promptContent += `Assessed Value: $${property.value.toLocaleString()}\n`;
    promptContent += `Land Area: ${property.acres} acres\n`;
    
    if (property.yearBuilt) {
      promptContent += `Year Built: ${property.yearBuilt}\n`;
    }
    
    if (property.squareFeet) {
      promptContent += `Square Feet: ${property.squareFeet}\n`;
    }
    
    if (property.bedrooms && property.bathrooms) {
      promptContent += `Bedrooms/Bathrooms: ${property.bedrooms}/${property.bathrooms}\n`;
    }
    
    if (property.zoning && property.landUse) {
      promptContent += `Zoning: ${property.zoning}, Land Use: ${property.landUse}\n`;
    }
    
    promptContent += `\nFocus the description on market aspects. Be objective and factual while maintaining readability.`;
    
    console.log('Generating story with prompt:', promptContent);
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "You are an expert property assessor and real estate analyst. Write informative, factual, and objective descriptions of properties based on assessment data."
        },
        { 
          role: "user", 
          content: promptContent
        }
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating property story:', error);
    return `Error generating property story: ${error.message}`;
  }
}

/**
 * Generate property comparison using OpenAI
 */
async function generatePropertyComparison(propertyIds, options = {}) {
  try {
    // Build the comparison prompt
    let promptContent = `Compare and contrast the following ${propertyIds.length} properties:\n\n`;
    
    propertyIds.forEach((propertyId, index) => {
      const property = testProperties[propertyId];
      
      if (!property) {
        throw new Error(`Property not found: ${propertyId}`);
      }
      
      promptContent += `Property ${index + 1}:\n`;
      promptContent += `Property ID: ${property.propertyId}\n`;
      promptContent += `Address: ${property.address}\n`;
      promptContent += `Type: ${property.propertyType}\n`;
      promptContent += `Assessment: $${property.value.toLocaleString()}\n`;
      promptContent += `Land Area: ${property.acres} acres\n`;
      promptContent += `Year Built: ${property.yearBuilt}\n`;
      promptContent += `Square Feet: ${property.squareFeet}\n`;
      promptContent += `\n`;
    });
    
    promptContent += `\nFocus on highlighting the key similarities and differences between these properties in terms of value, location, and characteristics. Provide insights on their relative market positions.`;
    
    console.log('Generating comparison with prompt:', promptContent);
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system", 
          content: "You are an expert property assessor and real estate analyst. Write informative, factual, and objective comparisons of properties based on assessment data."
        },
        { 
          role: "user", 
          content: promptContent
        }
      ],
      max_tokens: 1500,
      temperature: 0.5,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating property comparison:', error);
    return `Error generating property comparison: ${error.message}`;
  }
}

async function runTests() {
  try {
    console.log('Testing Direct Property Story Generator...');
    
    // Check if OpenAI API key is valid
    console.log(`OpenAI API Key Valid: ${isOpenAIApiKeyValid() ? 'Yes ✓' : 'No ✗'}`);
    
    // Test 1: Generate residential property story
    console.log('\nTest 1: Generate residential property story');
    const residentialStory = await generatePropertyStory('BC001');
    console.log('\nResidential Property Story:');
    console.log(residentialStory);
    
    // Test 2: Generate commercial property story
    console.log('\nTest 2: Generate commercial property story');
    const commercialStory = await generatePropertyStory('BC002');
    console.log('\nCommercial Property Story:');
    console.log(commercialStory);
    
    // Test 3: Generate property comparison
    console.log('\nTest 3: Generate property comparison');
    const comparisonStory = await generatePropertyComparison(['BC001', 'BC002']);
    console.log('\nProperty Comparison:');
    console.log(comparisonStory);
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test runner error:', error);
  }
}

// Run the tests
runTests();