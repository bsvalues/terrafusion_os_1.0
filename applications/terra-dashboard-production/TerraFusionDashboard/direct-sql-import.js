import fs from 'fs';
import { parse } from 'csv-parse';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function directSQLImport() {
  console.log('Direct SQL import starting...');
  
  const client = await pool.connect();
  
  try {
    // Check current count
    const currentResult = await client.query('SELECT COUNT(*) FROM properties WHERE active = true');
    const currentCount = parseInt(currentResult.rows[0].count);
    console.log(`Current properties in database: ${currentCount}`);
    
    // Load CSV data and find missing properties
    const propertyData = await loadCSVData('./attached_assets/benton_ftp/property_val.csv');
    const situsData = await loadCSVData('./attached_assets/benton_ftp/situs.csv');
    const ownerData = await loadCSVData('./attached_assets/benton_ftp/owner.csv');
    
    console.log(`CSV data loaded: ${Object.keys(propertyData).length} properties`);
    
    // Get existing parcel IDs
    const existingResult = await client.query('SELECT parcel_id FROM properties');
    const existingIds = new Set(existingResult.rows.map(row => row.parcel_id));
    
    // Find missing properties
    const missingIds = Object.keys(propertyData).filter(id => !existingIds.has(id));
    console.log(`Missing properties to import: ${missingIds.length}`);
    
    if (missingIds.length === 0) {
      console.log('All properties already imported');
      return;
    }
    
    // Import missing properties in chunks
    const chunkSize = 2000;
    let imported = 0;
    
    for (let i = 0; i < missingIds.length; i += chunkSize) {
      const chunk = missingIds.slice(i, i + chunkSize);
      const values = chunk.map(propId => {
        const prop = propertyData[propId];
        const situs = situsData[propId] || {};
        const owner = ownerData[propId] || {};
        
        const assessedValue = parseFloat(prop.assessed_val || 0);
        if (assessedValue <= 0) return null;
        
        const address = buildAddress(situs);
        const city = determineCity(situs);
        
        return `(
          gen_random_uuid(),
          '${propId}',
          '${address.replace(/'/g, "''")}',
          ${owner.owner_name ? `'${owner.owner_name.replace(/'/g, "''")}'` : 'NULL'},
          ${assessedValue},
          ${parseFloat(prop.market || 0) || 'NULL'},
          ${parseFloat(prop.land_hstd_val || prop.land_non_hstd_val || 0)},
          ${parseFloat(prop.imprv_hstd_val || prop.imprv_non_hstd_val || 0)},
          ${parseInt(situs.square_feet) || 'NULL'},
          ${parseInt(situs.year_built) || 'NULL'},
          '${mapPropertyType(prop.property_use_desc)}',
          'Benton County',
          true,
          NOW(),
          NOW(),
          NOW()
        )`;
      }).filter(Boolean).join(',');
      
      if (values) {
        await client.query(`
          INSERT INTO properties (id, parcel_id, address, owner_name, assessed_value, market_value, land_value, improvement_value, square_footage, year_built, property_type, county_name, active, last_sync_at, created_at, updated_at)
          VALUES ${values}
        `);
        
        imported += chunk.length;
        console.log(`Imported ${imported}/${missingIds.length} missing properties`);
      }
    }
    
    // Final count
    const finalResult = await client.query('SELECT COUNT(*) FROM properties WHERE active = true');
    const finalCount = parseInt(finalResult.rows[0].count);
    console.log(`Import complete: ${finalCount} total properties in database`);
    
  } catch (error) {
    console.error('Direct import failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

function loadCSVData(filePath) {
  return new Promise((resolve, reject) => {
    const data = {};
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        if (row.prop_id) {
          data[row.prop_id] = row;
        }
      })
      .on('end', () => resolve(data))
      .on('error', reject);
  });
}

function buildAddress(situs) {
  const parts = [];
  if (situs.house_num) parts.push(situs.house_num);
  if (situs.street_name) parts.push(situs.street_name);
  if (situs.street_type) parts.push(situs.street_type);
  
  let address = parts.join(' ').trim() || situs.situs_addr || '';
  const city = determineCity(situs) || 'Benton County';
  
  if (address && !address.includes('WA')) {
    address += `, ${city}, WA`;
  } else if (!address) {
    address = `${city}, WA`;
  }
  
  return address;
}

function determineCity(situs) {
  const zipCode = situs?.zip_code || situs?.zip;
  const zipToCityMap = {
    '99336': 'Kennewick', '99337': 'Kennewick', '99338': 'Kennewick',
    '99352': 'Richland', '99353': 'Richland', '99354': 'Richland',
    '99350': 'Prosser', '99320': 'Benton City', '99322': 'Finley',
    '99315': 'West Richland'
  };
  return zipToCityMap[zipCode] || 'Benton County';
}

function mapPropertyType(useDesc) {
  if (!useDesc) return 'Unknown';
  
  const desc = useDesc.toLowerCase();
  if (desc.includes('residential') || desc.includes('single family')) return 'Residential';
  if (desc.includes('commercial') || desc.includes('retail')) return 'Commercial';
  if (desc.includes('industrial')) return 'Industrial';
  if (desc.includes('agricultural') || desc.includes('farm')) return 'Agricultural';
  if (desc.includes('vacant')) return 'Vacant Land';
  if (desc.includes('government')) return 'Government';
  
  return useDesc;
}

directSQLImport();