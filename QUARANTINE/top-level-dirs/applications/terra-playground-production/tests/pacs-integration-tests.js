/**
 * PACS Module Integration Tests
 *
 * These tests verify enhanced PACS module integration functionality
 */

const fetch = require('node-fetch');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function getToken() {
  const response = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
      role: 'administrator',
    }),
  });

  const data = await response.json();
  return data.token;
}

async function testGetModulesByCategory() {
  console.log('\nTesting getModulesByCategory...');
  const token = await getToken();

  const response = await fetch(`${BASE_URL}/api/pacs-modules/category/mapping`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const modules = await response.json();

  // Test that we have modules in at least 3 categories
  const categories = new Set(modules.map(m => m.category));
  console.log(`Found ${categories.size} module categories`);
  assert(categories.size >= 3, 'Expected at least 3 categories');

  // Test that each module has the required fields
  modules.forEach(module => {
    assert(module.id, 'Module should have an ID');
    assert(module.moduleName, 'Module should have a name');
    assert(module.category, 'Module should have a category');
  });

  console.log('✅ getModulesByCategory test passed!');
  return true;
}

async function testModuleDetails() {
  console.log('\nTesting getModuleDetails...');
  const token = await getToken();

  // Get all modules first
  const allModulesResponse = await fetch(`${BASE_URL}/api/pacs-modules`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const allModules = await allModulesResponse.json();
  const moduleId = allModules[0].id;

  // Get details for the first module
  const response = await fetch(`${BASE_URL}/api/pacs-modules/${moduleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const moduleDetails = await response.json();

  // Test that we got detailed module info
  assert(moduleDetails.id === moduleId, 'Module ID should match');
  assert(moduleDetails.moduleName, 'Module should have a name');
  assert(moduleDetails.description, 'Module should have a description');
  assert(moduleDetails.integration, 'Module should have integration status');
  assert(moduleDetails.apiEndpoints !== undefined, 'Module should have API endpoints information');
  assert(moduleDetails.dataSchema !== undefined, 'Module should have a data schema');

  console.log('✅ getModuleDetails test passed!');
  return true;
}

async function testModuleSyncStatus() {
  console.log('\nTesting moduleSyncStatus...');
  const token = await getToken();

  // Get all modules first
  const allModulesResponse = await fetch(`${BASE_URL}/api/pacs-modules`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const allModules = await allModulesResponse.json();
  const moduleId = allModules[0].id;

  // Update sync status for the first module
  const updateResponse = await fetch(`${BASE_URL}/api/pacs-modules/${moduleId}/sync-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      syncStatus: 'in_progress',
      lastSyncTimestamp: new Date().toISOString(),
    }),
  });

  const updateResult = await updateResponse.json();

  // Verify update was successful
  assert(updateResult.success, 'Update should be successful');
  assert(updateResult.module.id === moduleId, 'Updated module ID should match');
  assert(updateResult.module.syncStatus === 'in_progress', 'Sync status should be updated');
  assert(updateResult.module.lastSyncTimestamp, 'Last sync timestamp should be set');

  // Get updated module to verify persistence
  const getResponse = await fetch(`${BASE_URL}/api/pacs-modules/${moduleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const moduleDetails = await getResponse.json();
  assert(moduleDetails.syncStatus === 'in_progress', 'Sync status should be persisted');

  console.log('✅ moduleSyncStatus test passed!');
  return true;
}

async function runPacsIntegrationTests() {
  console.log('=== Running PACS Integration Tests ===');

  try {
    const categoryTest = await testGetModulesByCategory();
    const detailsTest = await testModuleDetails();
    const syncTest = await testModuleSyncStatus();

    console.log('\n--------------------------');
    console.log(`Test Results: ${categoryTest + detailsTest + syncTest}/3 tests passed`);
    console.log('--------------------------');

    return categoryTest && detailsTest && syncTest;
  } catch (error) {
    console.error('❌ PACS Integration tests failed:', error);
    return false;
  }
}

// If run directly
if (require.main === module) {
  runPacsIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runPacsIntegrationTests };
