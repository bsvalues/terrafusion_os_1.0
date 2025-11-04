import fs from 'fs';
import { parse } from 'csv-parse';
import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class BentonDataImporter {
  constructor() {
    this.propertyMap = new Map();
    this.situsMap = new Map();
    this.salesMap = new Map();
    this.improvementMap = new Map();
  }

  async importData() {
    console.log('Starting Benton County data import...');
    
    try {
      await this.loadPropertyData();
      await this.loadSitusData();
      await this.loadSalesData();
      await this.loadImprovementData();
      
      await this.clearExistingData();
      await this.importProperties();
      await this.importSalesComparables();
      
      console.log('Benton County data import completed successfully');
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async loadPropertyData() {
    return new Promise((resolve, reject) => {
      console.log('Loading property values...');
      const results = [];
      
      fs.createReadStream('./attached_assets/benton_ftp/property_val.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => {
          if (data.assessed_val && parseInt(data.assessed_val) > 0) {
            this.propertyMap.set(data.prop_id, data);
          }
        })
        .on('end', () => {
          console.log(`Loaded ${this.propertyMap.size} property records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async loadSitusData() {
    return new Promise((resolve, reject) => {
      console.log('Loading situs addresses...');
      
      fs.createReadStream('./attached_assets/benton_ftp/situs.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => {
          if (data.situs_display && data.situs_display !== 'UNDETERMINED') {
            this.situsMap.set(data.prop_id, data);
          }
        })
        .on('end', () => {
          console.log(`Loaded ${this.situsMap.size} situs records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async loadSalesData() {
    return new Promise((resolve, reject) => {
      console.log('Loading sales data...');
      
      fs.createReadStream('./attached_assets/benton_ftp/sales_chg_of_owner.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => {
          if (data.sl_price && parseInt(data.sl_price) > 10000 && data.sl_dt) {
            if (!this.salesMap.has(data.prop_id)) {
              this.salesMap.set(data.prop_id, []);
            }
            this.salesMap.get(data.prop_id).push(data);
          }
        })
        .on('end', () => {
          console.log(`Loaded sales for ${this.salesMap.size} properties`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async loadImprovementData() {
    return new Promise((resolve, reject) => {
      console.log('Loading improvement data...');
      
      fs.createReadStream('./attached_assets/benton_ftp/imprv.csv')
        .pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (data) => {
          if (data.prop_id && (data.year_built || data.total_square_feet)) {
            this.improvementMap.set(data.prop_id, data);
          }
        })
        .on('end', () => {
          console.log(`Loaded ${this.improvementMap.size} improvement records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async clearExistingData() {
    console.log('Clearing existing data...');
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM sales_comparables');
      await client.query('DELETE FROM properties WHERE county_name = $1', ['Benton County']);
      console.log('Existing data cleared');
    } finally {
      client.release();
    }
  }

  async importProperties() {
    console.log('Importing properties into database...');
    const client = await pool.connect();
    
    try {
      let count = 0;
      const maxRecords = 500; // Reasonable batch for initial load
      
      for (const [propId, property] of this.propertyMap) {
        if (count >= maxRecords) break;
        
        const situs = this.situsMap.get(propId);
        const improvement = this.improvementMap.get(propId);
        
        if (!situs || !situs.situs_display) continue;
        
        const assessedValue = parseInt(property.assessed_val) || 0;
        const landValue = (parseInt(property.land_hstd_val) || 0) + (parseInt(property.land_non_hstd_val) || 0);
        const improvementValue = (parseInt(property.imprv_hstd_val) || 0) + (parseInt(property.imprv_non_hstd_val) || 0);
        
        const propertyData = {
          id: uuidv4(),
          parcel_id: propId,
          address: situs.situs_display,
          owner_name: null,
          assessed_value: assessedValue * 100, // Store in cents
          market_value: (parseInt(property.market) || assessedValue) * 100,
          land_value: landValue * 100,
          improvement_value: improvementValue * 100,
          square_footage: improvement?.total_square_feet ? parseInt(improvement.total_square_feet) : null,
          year_built: improvement?.year_built ? parseInt(improvement.year_built) : null,
          property_type: this.mapPropertyType(property.property_use_desc),
          county_name: 'Benton County',
          coordinates: null,
          last_sync_at: new Date(),
          active: true
        };
        
        await client.query(`
          INSERT INTO properties (
            id, parcel_id, address, owner_name, assessed_value, market_value,
            land_value, improvement_value, square_footage, year_built, property_type,
            county_name, coordinates, last_sync_at, active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          propertyData.id, propertyData.parcel_id, propertyData.address,
          propertyData.owner_name, propertyData.assessed_value, propertyData.market_value,
          propertyData.land_value, propertyData.improvement_value, propertyData.square_footage,
          propertyData.year_built, propertyData.property_type, propertyData.county_name,
          propertyData.coordinates, propertyData.last_sync_at, propertyData.active,
          new Date(), new Date()
        ]);
        
        count++;
        if (count % 50 === 0) {
          console.log(`Imported ${count} properties...`);
        }
      }
      
      console.log(`Successfully imported ${count} properties`);
    } finally {
      client.release();
    }
  }

  async importSalesComparables() {
    console.log('Importing sales comparables...');
    const client = await pool.connect();
    
    try {
      let count = 0;
      const maxSales = 200;
      
      // Get property IDs from our imported properties
      const propertyResult = await client.query(
        'SELECT id, parcel_id FROM properties WHERE county_name = $1',
        ['Benton County']
      );
      const propertyIdMap = new Map();
      propertyResult.rows.forEach(row => {
        propertyIdMap.set(row.parcel_id, row.id);
      });
      
      for (const [propId, sales] of this.salesMap) {
        if (count >= maxSales) break;
        
        const propertyUuid = propertyIdMap.get(propId);
        if (!propertyUuid) continue;
        
        for (const sale of sales) {
          const salePrice = parseInt(sale.sl_price);
          if (salePrice > 10000) {
            await client.query(`
              INSERT INTO sales_comparables (
                id, property_id, sale_price, sale_date, deed_type,
                verified, adjustments, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              uuidv4(), propertyUuid, salePrice * 100, new Date(sale.sl_dt),
              sale.deed_type_cd, true, null, new Date(), new Date()
            ]);
            
            count++;
            if (count >= maxSales) break;
          }
        }
      }
      
      console.log(`Successfully imported ${count} sales comparables`);
    } finally {
      client.release();
    }
  }

  mapPropertyType(useDesc) {
    if (!useDesc) return 'Unknown';
    
    const desc = useDesc.toLowerCase();
    if (desc.includes('residential') || desc.includes('single family') || desc.includes('sfr')) {
      return 'Residential';
    } else if (desc.includes('commercial') || desc.includes('retail') || desc.includes('office')) {
      return 'Commercial';
    } else if (desc.includes('industrial') || desc.includes('manufacturing')) {
      return 'Industrial';
    } else if (desc.includes('agricultural') || desc.includes('farm') || desc.includes('ag')) {
      return 'Agricultural';
    } else if (desc.includes('vacant') || desc.includes('undeveloped')) {
      return 'Vacant Land';
    } else {
      return 'Other';
    }
  }
}

async function runImport() {
  try {
    const importer = new BentonDataImporter();
    await importer.importData();
    await pool.end();
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runImport();
}

export { BentonDataImporter };