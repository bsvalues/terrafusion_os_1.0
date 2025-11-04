import fs from 'fs';
import { parse } from 'csv-parse';
import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class FastBentonImporter {
  constructor() {
    this.propertyMap = new Map();
    this.situsMap = new Map();
    this.ownerMap = new Map();
    this.batchSize = 1000; // Larger batches for speed
    this.importedCount = 0;
  }

  async importAllProperties() {
    console.log('Fast Benton County import starting...');
    
    // Load all data into memory first
    await this.loadAllData();
    
    // Process all properties at once
    await this.bulkInsertProperties();
    
    console.log(`Import completed: ${this.importedCount} properties`);
    return this.importedCount;
  }

  async loadAllData() {
    const [propertyData, situsData, ownerData] = await Promise.all([
      this.loadPropertyValues(),
      this.loadSitusAddresses(), 
      this.loadOwnerData()
    ]);
    
    console.log(`Loaded ${propertyData} property values, ${situsData} addresses, ${ownerData} owners`);
  }

  loadPropertyValues() {
    return new Promise((resolve, reject) => {
      let count = 0;
      fs.createReadStream('./attached_assets/benton_ftp/property_val.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => {
          if (data.assessed_val && parseFloat(data.assessed_val) > 0) {
            this.propertyMap.set(data.prop_id, data);
            count++;
          }
        })
        .on('end', () => resolve(count))
        .on('error', reject);
    });
  }

  loadSitusAddresses() {
    return new Promise((resolve, reject) => {
      let count = 0;
      fs.createReadStream('./attached_assets/benton_ftp/situs.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => {
          if (data.prop_id) {
            this.situsMap.set(data.prop_id, data);
            count++;
          }
        })
        .on('end', () => resolve(count))
        .on('error', reject);
    });
  }

  loadOwnerData() {
    return new Promise((resolve, reject) => {
      let count = 0;
      fs.createReadStream('./attached_assets/benton_ftp/owner.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => {
          if (data.prop_id) {
            this.ownerMap.set(data.prop_id, data);
            count++;
          }
        })
        .on('end', () => resolve(count))
        .on('error', reject);
    });
  }

  async bulkInsertProperties() {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      const propertyIds = Array.from(this.propertyMap.keys());
      console.log(`Processing ${propertyIds.length} properties in bulk...`);
      
      // Create a temporary table for bulk insert
      await client.query(`
        CREATE TEMP TABLE temp_properties (
          id UUID,
          parcel_id VARCHAR(50),
          address TEXT,
          owner_name TEXT,
          assessed_value DECIMAL(15,2),
          market_value DECIMAL(15,2),
          land_value DECIMAL(15,2),
          improvement_value DECIMAL(15,2),
          square_footage INTEGER,
          year_built INTEGER,
          property_type VARCHAR(50),
          county_name VARCHAR(100),
          active BOOLEAN,
          last_sync_at TIMESTAMP,
          created_at TIMESTAMP,
          updated_at TIMESTAMP
        )
      `);
      
      // Process in large batches
      for (let i = 0; i < propertyIds.length; i += this.batchSize) {
        const batch = propertyIds.slice(i, i + this.batchSize);
        await this.insertBatch(client, batch);
        
        if (i % 5000 === 0) {
          console.log(`Processed ${Math.min(i + this.batchSize, propertyIds.length)}/${propertyIds.length} properties`);
        }
      }
      
      // Move from temp table to main table
      await client.query(`
        INSERT INTO properties 
        SELECT * FROM temp_properties
        ON CONFLICT (parcel_id) DO UPDATE SET
          address = EXCLUDED.address,
          owner_name = EXCLUDED.owner_name,
          assessed_value = EXCLUDED.assessed_value,
          market_value = EXCLUDED.market_value,
          land_value = EXCLUDED.land_value,
          improvement_value = EXCLUDED.improvement_value,
          square_footage = EXCLUDED.square_footage,
          year_built = EXCLUDED.year_built,
          property_type = EXCLUDED.property_type,
          active = EXCLUDED.active,
          last_sync_at = EXCLUDED.last_sync_at,
          updated_at = EXCLUDED.updated_at
      `);
      
      await client.query('COMMIT');
      this.importedCount = propertyIds.length;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async insertBatch(client, propertyIds) {
    const values = [];
    
    for (const propId of propertyIds) {
      const property = this.transformProperty(propId);
      if (property) {
        values.push([
          property.id, property.parcel_id, property.address, property.owner_name,
          property.assessed_value, property.market_value, property.land_value, 
          property.improvement_value, property.square_footage, property.year_built,
          property.property_type, property.county_name, property.active,
          property.last_sync_at, property.created_at, property.updated_at
        ]);
      }
    }
    
    if (values.length > 0) {
      const placeholders = values.map((_, i) => {
        const offset = i * 16;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`;
      }).join(',');
      
      const flatValues = values.flat();
      
      await client.query(`
        INSERT INTO temp_properties VALUES ${placeholders}
      `, flatValues);
    }
  }

  transformProperty(propId) {
    const propertyData = this.propertyMap.get(propId);
    const situsData = this.situsMap.get(propId);
    const ownerData = this.ownerMap.get(propId);

    if (!propertyData) return null;

    const assessedValue = this.parseValue(propertyData.assessed_val);
    if (assessedValue <= 0) return null;

    return {
      id: uuidv4(),
      parcel_id: propId,
      address: this.buildAddress(situsData),
      owner_name: ownerData?.owner_name || ownerData?.name || null,
      assessed_value: assessedValue.toString(),
      market_value: this.parseValue(propertyData.market || propertyData.appraised_val)?.toString() || null,
      land_value: this.parseValue(propertyData.land_hstd_val || propertyData.land_non_hstd_val)?.toString() || "0",
      improvement_value: this.parseValue(propertyData.imprv_hstd_val || propertyData.imprv_non_hstd_val)?.toString() || "0",
      square_footage: this.parseNumber(situsData?.square_feet),
      year_built: this.parseNumber(situsData?.year_built),
      property_type: this.mapPropertyType(propertyData.property_use_desc),
      county_name: 'Benton County',
      active: true,
      last_sync_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  buildAddress(situsData) {
    if (!situsData) return 'Benton County, WA';

    const parts = [];
    if (situsData.house_num) parts.push(situsData.house_num);
    if (situsData.street_name) parts.push(situsData.street_name);
    if (situsData.street_type) parts.push(situsData.street_type);
    
    let address = parts.join(' ').trim() || situsData.situs_addr || '';
    
    const city = this.determineCity(situsData) || 'Benton County';
    if (address && !address.includes('WA')) {
      address += `, ${city}, WA`;
    } else if (!address) {
      address = `${city}, WA`;
    }

    return address;
  }

  determineCity(situsData) {
    const zipCode = situsData?.zip_code || situsData?.zip;
    const zipToCityMap = {
      '99336': 'Kennewick', '99337': 'Kennewick', '99338': 'Kennewick',
      '99352': 'Richland', '99353': 'Richland', '99354': 'Richland',
      '99350': 'Prosser', '99320': 'Benton City', '99322': 'Finley',
      '99315': 'West Richland'
    };
    return zipToCityMap[zipCode] || 'Benton County';
  }

  parseValue(value) {
    if (!value) return 0;
    const parsed = parseFloat(value.toString().replace(/[,$]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }

  parseNumber(value) {
    if (!value) return null;
    const parsed = parseInt(value.toString().replace(/[,$]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  mapPropertyType(useDesc) {
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
}

async function runFastImport() {
  const importer = new FastBentonImporter();
  
  try {
    const imported = await importer.importAllProperties();
    console.log(`Fast import completed: ${imported} properties processed`);
    process.exit(0);
  } catch (error) {
    console.error('Fast import failed:', error.message);
    process.exit(1);
  }
}

runFastImport();