/**
 * Property Story Generator Test Script
 * 
 * This script tests the Property Story Generator service with test property data.
 */
import { PropertyStoryGenerator } from '../dist/server/services/property-story-generator.js';
import { storage } from '../dist/server/storage.js';
import fs from 'fs';
import path from 'path';

async function testPropertyStory() {
  console.log('Testing Property Story Generator...');
  
  try {
    // Create an instance of the Property Story Generator
    const generator = new PropertyStoryGenerator(storage);
    
    // Test properties
    const testPropertyIds = ['BC101', 'BC102', 'BC103'];
    
    // Test options
    const options = {
      tone: 'professional',
      includeImprovements: true,
      includeLandRecords: true,
      includeFields: true
    };
    
    console.log(`Testing story generation for properties: ${testPropertyIds.join(', ')}`);
    
    // Generate individual stories
    for (const propertyId of testPropertyIds) {
      console.log(`\nGenerating story for property ${propertyId}...`);
      try {
        const result = await generator.generatePropertyStory(propertyId, options);
        console.log(`Successfully generated story for ${propertyId} in ${result.generationTime}ms`);
        console.log(`Story length: ${result.story.length} characters`);
        console.log('Property story:');
        console.log('-'.repeat(80));
        console.log(result.story);
        console.log('-'.repeat(80));
      } catch (error) {
        console.error(`Error generating story for ${propertyId}:`, error.message);
      }
    }
    
    // Generate a comparison story
    console.log(`\nGenerating comparison story for all properties...`);
    try {
      const result = await generator.generateComparisonStory(testPropertyIds, options);
      console.log(`Successfully generated comparison story in ${result.generationTime}ms`);
      console.log(`Story length: ${result.story.length} characters`);
      console.log('Comparison story:');
      console.log('-'.repeat(80));
      console.log(result.story);
      console.log('-'.repeat(80));
    } catch (error) {
      console.error(`Error generating comparison story:`, error.message);
    }
    
    console.log('\nProperty Story Generator test completed.');
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Execute the test
testPropertyStory().catch(console.error);