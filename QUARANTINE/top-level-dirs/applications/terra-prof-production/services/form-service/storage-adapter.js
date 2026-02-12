/**
 * TerraFusionPro Storage Adapter
 * 
 * This adapter provides a way to use the ESM storage module from CommonJS.
 */

// Since we can't use require() with ESM modules, we'll use dynamic import
// and export a promise-based API.

async function initializeAdapter() {
  try {
    // Dynamically import the ESM module
    const storage = await import('../../packages/shared/storage.js');
    
    // Return the storage module functions
    return {
      create: storage.create,
      find: storage.find,
      findById: storage.findById,
      update: storage.update,
      remove: storage.remove,
      query: storage.query,
      tables: storage.tables,
      initializeDatabase: storage.initializeDatabase,
      closeDatabase: storage.closeDatabase,
      runMigrations: storage.runMigrations
    };
  } catch (error) {
    console.error('Error importing storage module:', error);
    throw error;
  }
}

// Export a promise that resolves to the storage module
module.exports = initializeAdapter();