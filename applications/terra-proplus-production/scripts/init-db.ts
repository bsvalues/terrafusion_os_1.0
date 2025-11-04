import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../shared/schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  console.log('Initializing database...');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool, { schema });
    
    // Push schema to the database
    console.log('Creating tables based on schema...');
    
    // Create tables
    await createTables(db);
    
    // Insert sample data
    console.log('Inserting sample data...');
    await insertSampleData(db);
    
    console.log('Database initialized successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

async function createTables(db: any) {
  // Use raw SQL queries to create the tables since we can't use drizzle-kit directly
  
  // Users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'appraiser',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Properties table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code VARCHAR(10) NOT NULL,
      property_type TEXT NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms TEXT NOT NULL,
      square_feet TEXT NOT NULL,
      lot_size TEXT,
      year_built INTEGER NOT NULL,
      description TEXT NOT NULL,
      parcel_number VARCHAR(50) NOT NULL,
      zoning TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Appraisals table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS appraisals (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id),
      appraiser_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'in_progress',
      purpose TEXT,
      market_value NUMERIC,
      valuation_method TEXT,
      effective_date DATE,
      report_date DATE
    )
  `);
  
  // Comparables table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comparables (
      id SERIAL PRIMARY KEY,
      appraisal_id INTEGER NOT NULL REFERENCES appraisals(id),
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code VARCHAR(10) NOT NULL,
      property_type TEXT NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms TEXT NOT NULL,
      square_feet TEXT NOT NULL,
      lot_size TEXT,
      year_built INTEGER NOT NULL,
      sale_price NUMERIC NOT NULL,
      sale_date DATE NOT NULL,
      distance NUMERIC NOT NULL,
      notes TEXT,
      adjusted_value NUMERIC,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Adjustments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS adjustments (
      id SERIAL PRIMARY KEY,
      comparable_id INTEGER NOT NULL REFERENCES comparables(id),
      feature_name TEXT NOT NULL,
      description TEXT,
      amount NUMERIC NOT NULL,
      is_additive BOOLEAN NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Attachments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attachments (
      id SERIAL PRIMARY KEY,
      appraisal_id INTEGER NOT NULL REFERENCES appraisals(id),
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_url TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Market data table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS market_data (
      id SERIAL PRIMARY KEY,
      zip_code VARCHAR(10) NOT NULL,
      period TEXT NOT NULL,
      median_sale_price NUMERIC NOT NULL,
      average_sale_price NUMERIC NOT NULL,
      average_price_per_sqft NUMERIC NOT NULL,
      total_sales INTEGER NOT NULL,
      average_days_on_market NUMERIC NOT NULL,
      property_type TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function insertSampleData(db: any) {
  // Sample users
  const adminUser = await db.execute(`
    INSERT INTO users (username, email, first_name, last_name, password, role)
    VALUES ('admin', 'admin@terrafusionpro.com', 'Admin', 'User', '$2a$10$JGX7CbB0XnU5jBSXQGcFQeAun0jDfkUeM0dXkWvuFhBhQ1Y5HVjx.', 'admin')
    ON CONFLICT (username) DO NOTHING
    RETURNING id
  `);
  
  const appraiserUser = await db.execute(`
    INSERT INTO users (username, email, first_name, last_name, password, role)
    VALUES ('appraiser', 'appraiser@terrafusionpro.com', 'Sample', 'Appraiser', '$2a$10$uPG8jdgO3PLj.dR9BUGcS.yl3Kjzq0lqJkSyOQ.mKuG1D9IQdMHSq', 'appraiser')
    ON CONFLICT (username) DO NOTHING
    RETURNING id
  `);
  
  // Sample properties
  const property1 = await db.execute(`
    INSERT INTO properties (
      address, city, state, zip_code, property_type, bedrooms, bathrooms, 
      square_feet, lot_size, year_built, description, parcel_number, zoning
    )
    VALUES (
      '123 Main St', 'Portland', 'OR', '97201', 'Single Family', 3, '2.5', 
      '2100', '0.25', 2005, 'Beautiful modern home with open floor plan', 'R123456', 'Residential'
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `);
  
  const property2 = await db.execute(`
    INSERT INTO properties (
      address, city, state, zip_code, property_type, bedrooms, bathrooms, 
      square_feet, lot_size, year_built, description, parcel_number, zoning
    )
    VALUES (
      '456 Oak Ave', 'Portland', 'OR', '97202', 'Condo', 2, '2', 
      '1400', NULL, 2015, 'Downtown luxury condo with city views', 'C789012', 'Mixed Use'
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `);
  
  // Sample market data
  await db.execute(`
    INSERT INTO market_data (
      zip_code, period, median_sale_price, average_sale_price, 
      average_price_per_sqft, total_sales, average_days_on_market, property_type
    )
    VALUES 
      ('97201', '2023-Q1', 550000, 575000, 325, 45, 28, 'Single Family'),
      ('97201', '2023-Q2', 565000, 585000, 330, 52, 25, 'Single Family'),
      ('97201', '2023-Q3', 570000, 590000, 335, 48, 27, 'Single Family'),
      ('97201', '2023-Q4', 560000, 580000, 330, 38, 32, 'Single Family'),
      ('97202', '2023-Q1', 425000, 440000, 380, 36, 24, 'Condo'),
      ('97202', '2023-Q2', 435000, 450000, 385, 42, 22, 'Condo'),
      ('97202', '2023-Q3', 440000, 455000, 390, 40, 23, 'Condo'),
      ('97202', '2023-Q4', 430000, 445000, 385, 30, 26, 'Condo')
    ON CONFLICT DO NOTHING
  `);
  
  // Only create appraisals if we have properties and users
  if (property1.rows.length > 0 && appraiserUser.rows.length > 0) {
    const propertyId = property1.rows[0].id;
    const appraiserId = appraiserUser.rows[0].id;
    
    // Sample appraisal
    const appraisal = await db.execute(`
      INSERT INTO appraisals (
        property_id, appraiser_id, status, purpose, market_value, 
        valuation_method, effective_date, report_date
      )
      VALUES (
        $1, $2, 'in_progress', 'Refinance', 550000, 
        'Sales Comparison', CURRENT_DATE, CURRENT_DATE
      )
      RETURNING id
    `, [propertyId, appraiserId]);
    
    // Only create comparables if we have an appraisal
    if (appraisal.rows.length > 0) {
      const appraisalId = appraisal.rows[0].id;
      
      // Sample comparable
      const comparable = await db.execute(`
        INSERT INTO comparables (
          appraisal_id, address, city, state, zip_code, property_type, 
          bedrooms, bathrooms, square_feet, lot_size, year_built, 
          sale_price, sale_date, distance, notes
        )
        VALUES (
          $1, '789 Elm St', 'Portland', 'OR', '97201', 'Single Family', 
          3, '2', '2000', '0.2', 2003, 
          540000, '2023-08-15', 0.5, 'Similar layout, slightly smaller'
        )
        RETURNING id
      `, [appraisalId]);
      
      // Only create adjustments if we have a comparable
      if (comparable.rows.length > 0) {
        const comparableId = comparable.rows[0].id;
        
        // Sample adjustments
        await db.execute(`
          INSERT INTO adjustments (comparable_id, feature_name, description, amount, is_additive)
          VALUES 
            ($1, 'Square Footage', '100 sqft smaller', 10000, true),
            ($1, 'Bathrooms', '0.5 fewer bathrooms', 5000, true),
            ($1, 'Age', '2 years older', 2000, false)
        `, [comparableId]);
      }
    }
  }
}

main().catch(console.error);