import fs from 'fs';
import { parse } from 'csv-parse';
import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class CompleteBentonImporter {
  constructor() {
    this.propertyMap = new Map();
    this.situsMap = new Map();
    this.ownerMap = new Map();
    this.importedCount = 0;
    this.batchSize = 500;
  }

  async importAllProperties() {
    console.log('Starting complete Benton County property import...');
    
    try {
      await this.loadAllData();
      await this.processProperties();
      
      console.log(`Import completed: ${this.importedCount} properties processed`);
      return this.importedCount;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async loadAllData() {
    console.log('Loading property values...');
    await this.loadPropertyValues();
    
    console.log('Loading situs addresses...');
    await this.loadSitusAddresses();
    
    console.log('Loading owner information...');
    await this.loadOwnerData();
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
        .on('end', () => {
          console.log(`Loaded ${count} property value records`);
          resolve();
        })
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
        .on('end', () => {
          console.log(`Loaded ${count} situs address records`);
          resolve();
        })
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
        .on('end', () => {
          console.log(`Loaded ${count} owner records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processProperties() {
    const propertyIds = Array.from(this.propertyMap.keys());
    console.log(`Processing ${propertyIds.length} properties in batches of ${this.batchSize}`);

    for (let i = 0; i < propertyIds.length; i += this.batchSize) {
      const batch = propertyIds.slice(i, i + this.batchSize);
      await this.processBatch(batch);
      console.log(`Processed ${Math.min(i + this.batchSize, propertyIds.length)}/${propertyIds.length} properties`);
    }
  }

  async processBatch(propertyIds) {
    const properties = [];

    for (const propId of propertyIds) {
      const property = this.transformProperty(propId);
      if (property) {
        properties.push(property);
      }
    }

    if (properties.length > 0) {
      await this.insertProperties(properties);
      this.importedCount += properties.length;
    }
  }

  transformProperty(propId) {
    const propertyData = this.propertyMap.get(propId);
    const situsData = this.situsMap.get(propId);
    const ownerData = this.ownerMap.get(propId);

    if (!propertyData) return null;

    const address = this.buildAddress(situsData);
    const assessedValue = this.parseValue(propertyData.assessed_val);
    
    // Skip properties with zero or invalid assessed values
    if (assessedValue <= 0) return null;

    return {
      id: uuidv4(),
      parcel_id: propId,
      address: address,
      owner_name: ownerData?.owner_name || ownerData?.name || null,
      assessed_value: assessedValue.toFixed(2),
      market_value: this.parseValue(propertyData.market || propertyData.appraised_val)?.toFixed(2) || null,
      land_value: this.parseValue(propertyData.land_hstd_val || propertyData.land_non_hstd_val)?.toFixed(2) || "0.00",
      improvement_value: this.parseValue(propertyData.imprv_hstd_val || propertyData.imprv_non_hstd_val)?.toFixed(2) || "0.00",
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
    
    let address = parts.join(' ').trim();
    
    if (!address && situsData.situs_addr) {
      address = situsData.situs_addr;
    }

    // Add city
    const city = situsData.city || this.determineCity(situsData) || 'Benton County';
    if (address && !address.includes('WA')) {
      address += `, ${city}, WA`;
    } else if (!address) {
      address = `${city}, WA`;
    }

    return address;
  }

  determineCity(situsData) {
    const zipCode = situsData?.zip_code || situsData?.zip;
    
    // Benton County ZIP codes to cities
    const zipToCityMap = {
      '99336': 'Kennewick',
      '99337': 'Kennewick', 
      '99338': 'Kennewick',
      '99352': 'Richland',
      '99353': 'Richland',
      '99354': 'Richland',
      '99350': 'Prosser',
      '99320': 'Benton City',
      '99322': 'Finley',
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
    
    if (desc.includes('residential') || desc.includes('single family') || desc.includes('sfr')) return 'Residential';
    if (desc.includes('commercial') || desc.includes('retail') || desc.includes('office')) return 'Commercial';
    if (desc.includes('industrial') || desc.includes('manufacturing')) return 'Industrial';
    if (desc.includes('agricultural') || desc.includes('farm') || desc.includes('ag')) return 'Agricultural';
    if (desc.includes('vacant') || desc.includes('undeveloped')) return 'Vacant Land';
    if (desc.includes('government') || desc.includes('public')) return 'Government';
    if (desc.includes('school') || desc.includes('education')) return 'Educational';
    
    return useDesc;
  }

  async insertProperties(properties) {
    const client = await pool.connect();
    
    try {
      // Use parameterized queries to avoid SQL injection and handle special characters
      const placeholders = properties.map((_, i) => {
        const offset = i * 16;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`;
      }).join(',');

      const values = properties.flatMap(p => [
        p.id, p.parcel_id, p.address, p.owner_name, p.assessed_value, p.market_value, 
        p.land_value, p.improvement_value, p.square_footage, p.year_built, 
        p.property_type, p.county_name, p.active, p.last_sync_at, p.created_at, p.updated_at
      ]);

      const query = `
        INSERT INTO properties (id, parcel_id, address, owner_name, assessed_value, market_value, land_value, improvement_value, square_footage, year_built, property_type, county_name, active, last_sync_at, created_at, updated_at)
        VALUES ${placeholders}
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
      `;

      await client.query(query, values);
    } catch (error) {
      console.error('Insert batch failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }
}

async function runCompleteImport() {
  const importer = new CompleteBentonImporter();
  
  try {
    const imported = await importer.importAllProperties();
    console.log(`Import completed: ${imported} properties processed`);
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

runCompleteImport();