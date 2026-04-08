/**
 * Benton County Data Importer
 * 
 * This script imports authentic Benton County property data 
 * from CSV/JSON files downloaded from the county's FTP server.
 * It converts the data into our application's schema format
 * and stores it in our database.
 */
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { db } = require('../server/db');
const { properties } = require('../shared/schema');
const { eq } = require('drizzle-orm');

// Data directory containing Benton County files
const DATA_DIR = path.join(__dirname, '..', 'data', 'benton-county');

// Check if data directory exists
if (!fs.existsSync(DATA_DIR)) {
  console.error(`Error: Data directory not found: ${DATA_DIR}`);
  console.error('Please run fetch-benton-county-data.py first to download the data.');
  process.exit(1);
}

/**
 * Read and parse CSV files
 */
async function readCSVFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    console.log(`Successfully parsed ${records.length} records from ${path.basename(filePath)}`);
    return records;
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Read and parse JSON files
 */
async function readJSONFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    const records = Array.isArray(data) ? data : [data];
    console.log(`Successfully parsed ${records.length} records from ${path.basename(filePath)}`);
    return records;
  } catch (error) {
    console.error(`Error parsing JSON file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Convert Benton County property data to our schema format
 */
function convertToSchemaFormat(propertyData) {
  return {
    propertyId: propertyData.parcel_id || propertyData.parcelId || propertyData.property_id || propertyData.propertyId,
    address: propertyData.situs_address || propertyData.address || propertyData.property_address,
    parcelNumber: propertyData.parcel_number || propertyData.parcelNumber || propertyData.parcel_id,
    propertyType: propertyData.property_type || propertyData.propertyType || 'Unknown',
    acres: parseFloat(propertyData.acres || propertyData.land_area || 0),
    value: parseInt(propertyData.assessed_value || propertyData.assessedValue || propertyData.total_value || 0, 10),
    status: propertyData.status || 'active',
    extraFields: {
      yearBuilt: parseInt(propertyData.year_built || propertyData.yearBuilt || 0, 10),
      squareFootage: parseInt(propertyData.square_footage || propertyData.squareFootage || 0, 10),
      bedrooms: parseInt(propertyData.bedrooms || 0, 10),
      bathrooms: parseFloat(propertyData.bathrooms || 0),
      zoning: propertyData.zone_code || propertyData.zoning || '',
      taxCode: propertyData.tax_code || propertyData.taxCode || '',
      lastSaleDate: propertyData.last_sale_date || propertyData.lastSaleDate || '',
      lastSalePrice: parseInt(propertyData.last_sale_price || propertyData.lastSalePrice || 0, 10),
      assessedValue: parseInt(propertyData.assessed_value || propertyData.assessedValue || 0, 10),
      dataSource: 'Benton County FTP'
    }
  };
}

/**
 * Find property data files and import them
 */
async function importPropertyData() {
  console.log('Starting Benton County property data import...');
  
  // Get list of files in data directory
  const files = fs.readdirSync(DATA_DIR);
  const dataFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.csv' || ext === '.json';
  });
  
  if (dataFiles.length === 0) {
    console.log('No data files found. Please run fetch-benton-county-data.py first.');
    return;
  }
  
  console.log(`Found ${dataFiles.length} data files to process.`);
  
  let importedCount = 0;
  let errorCount = 0;
  
  // Process each data file
  for (const file of dataFiles) {
    const filePath = path.join(DATA_DIR, file);
    const ext = path.extname(file).toLowerCase();
    
    let records = [];
    if (ext === '.csv') {
      records = await readCSVFile(filePath);
    } else if (ext === '.json') {
      records = await readJSONFile(filePath);
    }
    
    console.log(`Processing ${records.length} records from ${file}...`);
    
    // Convert and import each record
    for (const record of records) {
      try {
        const propertyData = convertToSchemaFormat(record);
        
        // Only proceed if we have a valid property ID
        if (!propertyData.propertyId) {
          console.warn('Skipping record with missing property ID');
          continue;
        }
        
        // Check if property already exists
        const existingProperty = await db.select()
          .from(properties)
          .where(eq(properties.propertyId, propertyData.propertyId))
          .limit(1);
        
        if (existingProperty.length > 0) {
          // Update existing property
          await db.update(properties)
            .set(propertyData)
            .where(eq(properties.propertyId, propertyData.propertyId));
          console.log(`Updated property: ${propertyData.propertyId}`);
        } else {
          // Insert new property
          await db.insert(properties).values(propertyData);
          console.log(`Imported new property: ${propertyData.propertyId}`);
        }
        
        importedCount++;
      } catch (error) {
        console.error(`Error importing property:`, error.message);
        errorCount++;
      }
    }
  }
  
  console.log(`Import completed. ${importedCount} properties imported/updated. ${errorCount} errors.`);
}

// Run the import process
importPropertyData()
  .then(() => {
    console.log('Benton County data import completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during import:', error);
    process.exit(1);
  });