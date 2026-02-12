/**
 * Data Import Testing Script
 *
 * This script tests the data import functionality through the API.
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://localhost:3000/api/data-import';
const TEST_CSV_PATH = path.join(__dirname, '../uploads/test-properties.csv');

async function testValidation() {
  console.log('Testing CSV validation...');

  const formData = new FormData();
  formData.append('file', fs.createReadStream(TEST_CSV_PATH));

  try {
    const response = await fetch(`${API_BASE_URL}/upload-validate`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('Validation result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error testing validation:', error);
    throw error;
  }
}

async function testImport(filePath) {
  console.log('Testing property import...');

  try {
    const response = await fetch(`${API_BASE_URL}/import-properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    const result = await response.json();
    console.log('Import result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error testing import:', error);
    throw error;
  }
}

async function testStaging(filePath) {
  console.log('Testing property staging...');

  try {
    const response = await fetch(`${API_BASE_URL}/stage-properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });

    const result = await response.json();
    console.log('Staging result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error testing staging:', error);
    throw error;
  }
}

async function testGetStagedProperties() {
  console.log('Testing get staged properties...');

  try {
    const response = await fetch(`${API_BASE_URL}/staged-properties`);
    const result = await response.json();
    console.log('Staged properties:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error getting staged properties:', error);
    throw error;
  }
}

async function testCommitStagedProperties(stagingIds) {
  console.log('Testing commit staged properties...');

  try {
    const response = await fetch(`${API_BASE_URL}/commit-staged-properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stagingIds }),
    });

    const result = await response.json();
    console.log('Commit result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error committing staged properties:', error);
    throw error;
  }
}

async function run() {
  try {
    // Test validation
    const validationResult = await testValidation();

    if (validationResult && validationResult.filePath) {
      // Test directly importing properties
      await testImport(validationResult.filePath);

      // Test staging properties
      const stagingResult = await testStaging(validationResult.filePath);

      // Test getting staged properties
      await testGetStagedProperties();

      // Test committing staged properties
      if (stagingResult && stagingResult.stagingIds && stagingResult.stagingIds.length > 0) {
        await testCommitStagedProperties(stagingResult.stagingIds);
      }
    }

    console.log('All tests completed successfully.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
run();
