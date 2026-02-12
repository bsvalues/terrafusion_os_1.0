import { BentonArcGISImporter } from './server/benton-arcgis-importer.js';

async function runArcGISImport() {
  const importer = new BentonArcGISImporter();
  
  try {
    const imported = await importer.importAllProperties();
    console.log(`Import completed: ${imported} properties added to database`);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

runArcGISImport();