// Efficient Batch Import for Benton County Property Data
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { properties, salesComparables } from './shared/schema.ts';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/defaultdb';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function batchImportBentonData() {
  console.log('Starting efficient Benton County data import...');
  
  try {
    // Load property data
    const propertyData = await loadCSVData('attached_assets/benton_ftp/property_val.csv');
    console.log(`Loaded ${propertyData.length} property value records`);
    
    // Load situs data
    const situsData = await loadCSVData('attached_assets/benton_ftp/situs.csv');
    console.log(`Loaded ${situsData.length} situs records`);
    
    // Load sales data
    const salesData = await loadCSVData('attached_assets/benton_ftp/sales_chg_of_owner.csv');
    console.log(`Loaded ${salesData.length} sales records`);
    
    // Clear existing data
    await db.delete(properties);
    await db.delete(salesComparables);
    console.log('Cleared existing data');
    
    // Process and import in batches
    const batchSize = 1000;
    let imported = 0;
    
    // Combine property and situs data
    const propertyMap = new Map();
    propertyData.forEach(prop => {
      propertyMap.set(prop.account_num, prop);
    });
    
    const processedProperties = [];
    situsData.forEach(situs => {
      const propertyVal = propertyMap.get(situs.account_num);
      if (propertyVal && situs.situs_address) {
        processedProperties.push({
          id: `prop_${situs.account_num}`,
          parcelId: situs.account_num,
          address: `${situs.situs_address}, ${situs.situs_city || 'Benton County'}, WA ${situs.situs_zip || ''}`.trim(),
          assessedValue: (parseFloat(propertyVal.total_value) || 0).toString(),
          landValue: (parseFloat(propertyVal.land_value) || 0).toString(),
          improvementValue: (parseFloat(propertyVal.improvement_value) || 0).toString(),
          propertyType: determinePropertyType(situs.use_desc || propertyVal.use_desc),
          squareFootage: parseInt(situs.sq_ft) || null,
          yearBuilt: parseInt(situs.year_built) || null,
          ownerName: situs.owner_name || '',
          county: 'Benton',
          state: 'WA',
          active: true,
          lastModified: new Date().toISOString()
        });
      }
    });
    
    console.log(`Processing ${processedProperties.length} properties in batches...`);
    
    // Import properties in batches
    for (let i = 0; i < processedProperties.length; i += batchSize) {
      const batch = processedProperties.slice(i, i + batchSize);
      try {
        await db.insert(properties).values(batch);
        imported += batch.length;
        console.log(`Imported ${imported}/${processedProperties.length} properties`);
      } catch (error) {
        console.log(`Batch ${i} failed, trying individual inserts...`);
        for (const property of batch) {
          try {
            await db.insert(properties).values([property]);
            imported++;
          } catch (e) {
            console.log(`Failed to insert property ${property.parcelId}: ${e.message}`);
          }
        }
      }
    }
    
    // Process sales comparables
    const processedSales = [];
    salesData.forEach(sale => {
      if (sale.sale_price && parseFloat(sale.sale_price) > 0) {
        processedSales.push({
          id: `sale_${sale.account_num}_${Date.now() + Math.random()}`,
          propertyId: `prop_${sale.account_num}`,
          salePrice: (parseFloat(sale.sale_price) || 0).toString(),
          saleDate: parseSaleDate(sale.sale_date) || new Date().toISOString(),
          address: sale.situs_address || 'Unknown Address',
          squareFootage: parseInt(sale.sq_ft) || null,
          yearBuilt: parseInt(sale.year_built) || null,
          propertyType: determinePropertyType(sale.use_desc),
          verified: true,
          lastModified: new Date().toISOString()
        });
      }
    });
    
    console.log(`Processing ${processedSales.length} sales comparables...`);
    
    // Import sales in batches
    let salesImported = 0;
    for (let i = 0; i < processedSales.length; i += batchSize) {
      const batch = processedSales.slice(i, i + batchSize);
      try {
        await db.insert(salesComparables).values(batch);
        salesImported += batch.length;
        console.log(`Imported ${salesImported}/${processedSales.length} sales comparables`);
      } catch (error) {
        console.log(`Sales batch ${i} failed, trying individual inserts...`);
        for (const sale of batch) {
          try {
            await db.insert(salesComparables).values([sale]);
            salesImported++;
          } catch (e) {
            console.log(`Failed to insert sale: ${e.message}`);
          }
        }
      }
    }
    
    console.log(`\n✅ Benton County import completed:`);
    console.log(`   📍 Properties imported: ${imported}`);
    console.log(`   💰 Sales comparables imported: ${salesImported}`);
    console.log(`   🏢 Terrafusion platform is ready for property assessment operations`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await sql.end();
  }
}

function loadCSVData(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      resolve([]);
      return;
    }
    
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function determinePropertyType(useDesc) {
  if (!useDesc) return 'Residential';
  const desc = useDesc.toLowerCase();
  
  if (desc.includes('single') || desc.includes('residential') || desc.includes('house')) {
    return 'Residential';
  } else if (desc.includes('commercial') || desc.includes('office') || desc.includes('retail')) {
    return 'Commercial';
  } else if (desc.includes('industrial') || desc.includes('manufacturing')) {
    return 'Industrial';
  } else if (desc.includes('agricultural') || desc.includes('farm') || desc.includes('rural')) {
    return 'Agricultural';
  } else if (desc.includes('vacant') || desc.includes('land')) {
    return 'Vacant Land';
  }
  
  return 'Residential';
}

function parseSaleDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Handle various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try parsing MM/DD/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const parsedDate = new Date(parts[2], parts[0] - 1, parts[1]);
        return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
      }
      return null;
    }
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

// Run the import
batchImportBentonData();