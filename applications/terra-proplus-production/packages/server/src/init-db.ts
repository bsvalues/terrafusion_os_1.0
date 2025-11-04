import { db } from './db';
import { users, properties, appraisals, comparables, adjustments, attachments, marketData } from '../shared/schema';
import { sql } from 'drizzle-orm';

export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Create tables
    await createTables();
    
    // Insert sample data if needed
    await insertSampleData();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function createTables() {
  try {
    console.log('Creating tables...');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'appraiser',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create properties table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        property_type VARCHAR(50) NOT NULL,
        year_built INTEGER NOT NULL,
        square_feet INTEGER NOT NULL,
        bedrooms DECIMAL(3,1) NOT NULL,
        bathrooms DECIMAL(3,1) NOT NULL,
        lot_size INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        parcel_number VARCHAR(50),
        zoning VARCHAR(50),
        lot_unit VARCHAR(20),
        latitude DECIMAL(10,6),
        longitude DECIMAL(10,6),
        features JSONB,
        created_by INTEGER REFERENCES users(id)
      );
    `);
    
    // Create appraisals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS appraisals (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id),
        appraiser_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(50) NOT NULL DEFAULT 'Draft',
        purpose VARCHAR(100) NOT NULL,
        market_value INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        inspection_date TIMESTAMP,
        effective_date TIMESTAMP,
        report_type VARCHAR(50),
        client_name VARCHAR(100),
        client_email VARCHAR(100),
        client_phone VARCHAR(50),
        lender_name VARCHAR(100),
        loan_number VARCHAR(50),
        intended_use VARCHAR(255),
        valuation_method VARCHAR(50),
        scope_of_work TEXT,
        notes TEXT
      );
    `);
    
    // Create comparables table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comparables (
        id SERIAL PRIMARY KEY,
        appraisal_id INTEGER NOT NULL REFERENCES appraisals(id),
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        sale_price INTEGER NOT NULL,
        sale_date TIMESTAMP NOT NULL,
        square_feet INTEGER NOT NULL,
        bedrooms DECIMAL(3,1),
        bathrooms DECIMAL(3,1),
        year_built INTEGER,
        property_type VARCHAR(50) NOT NULL,
        lot_size INTEGER,
        condition VARCHAR(50),
        days_on_market INTEGER,
        source VARCHAR(100),
        adjusted_price INTEGER,
        adjustment_notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create adjustments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS adjustments (
        id SERIAL PRIMARY KEY,
        comparable_id INTEGER NOT NULL REFERENCES comparables(id),
        category VARCHAR(50) NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount INTEGER NOT NULL,
        is_percentage BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create attachments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id),
        appraisal_id INTEGER REFERENCES appraisals(id),
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL,
        file_url VARCHAR(255) NOT NULL,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        category VARCHAR(50),
        description TEXT,
        upload_date TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create market_data table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        location VARCHAR(100) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL,
        value DECIMAL(12,2) NOT NULL,
        comparison_value DECIMAL(12,2),
        percent_change DECIMAL(6,2),
        source VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    // Check if we already have users
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Sample data already exists, skipping');
      return;
    }
    
    console.log('Inserting sample data...');
    
    // Insert sample users
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@terrafusion.com',
      password: '$2b$10$JK4Wt9fE3KnuiB1DFXvxQesNQZKxr2KReLuKVb7TqDQsQvAVLBHyW', // hashed 'password123'
      role: 'admin'
    }).returning();
    
    const [appraiser1] = await db.insert(users).values({
      username: 'appraiser1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@terrafusion.com',
      password: '$2b$10$JK4Wt9fE3KnuiB1DFXvxQesNQZKxr2KReLuKVb7TqDQsQvAVLBHyW',
      role: 'appraiser'
    }).returning();
    
    const [appraiser2] = await db.insert(users).values({
      username: 'appraiser2',
      firstName: 'Emma',
      lastName: 'Johnson',
      email: 'emma.johnson@terrafusion.com',
      password: '$2b$10$JK4Wt9fE3KnuiB1DFXvxQesNQZKxr2KReLuKVb7TqDQsQvAVLBHyW',
      role: 'appraiser'
    }).returning();
    
    // Insert sample properties
    const [property1] = await db.insert(properties).values({
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      property_type: 'Single Family',
      year_built: 2005,
      square_feet: 2500,
      bedrooms: 4,
      bathrooms: 2.5,
      lot_size: 8500,
      description: 'Beautiful two-story home in central Austin',
      created_by: appraiser1.id
    }).returning();
    
    const [property2] = await db.insert(properties).values({
      address: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zip_code: '78704',
      property_type: 'Condo',
      year_built: 2015,
      square_feet: 1200,
      bedrooms: 2,
      bathrooms: 2,
      lot_size: 0,
      description: 'Modern condo in South Austin',
      created_by: appraiser1.id
    }).returning();
    
    const [property3] = await db.insert(properties).values({
      address: '789 Pine Rd',
      city: 'Round Rock',
      state: 'TX',
      zip_code: '78664',
      property_type: 'Single Family',
      year_built: 2000,
      square_feet: 2200,
      bedrooms: 3,
      bathrooms: 2,
      lot_size: 7500,
      description: 'Ranch-style home with large backyard',
      created_by: appraiser2.id
    }).returning();
    
    // Insert sample appraisals
    const [appraisal1] = await db.insert(appraisals).values({
      propertyId: property1.id,
      appraiserId: appraiser1.id,
      status: 'In Progress',
      purpose: 'Refinance',
      marketValue: 450000,
      clientName: 'Wells Fargo',
      clientEmail: 'loans@wellsfargo.com',
      clientPhone: '555-123-4567',
      lenderName: 'Wells Fargo',
      loanNumber: 'WF123456789',
      valuationMethod: 'Sales Comparison'
    }).returning();
    
    const [appraisal2] = await db.insert(appraisals).values({
      propertyId: property2.id,
      appraiserId: appraiser2.id,
      status: 'Completed',
      purpose: 'Purchase',
      marketValue: 320000,
      completedAt: new Date(),
      clientName: 'Bank of America',
      clientEmail: 'loans@bofa.com',
      clientPhone: '555-987-6543',
      lenderName: 'Bank of America',
      loanNumber: 'BOA987654321',
      valuationMethod: 'Sales Comparison'
    }).returning();
    
    // Insert sample comparables
    const [comparable1] = await db.insert(comparables).values({
      appraisalId: appraisal1.id,
      address: '125 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      salePrice: 445000,
      saleDate: new Date('2023-01-15'),
      squareFeet: 2400,
      bedrooms: 4,
      bathrooms: 2.5,
      yearBuilt: 2003,
      propertyType: 'Single Family',
      lotSize: 8000,
      condition: 'Good',
      source: 'MLS'
    }).returning();
    
    const [comparable2] = await db.insert(comparables).values({
      appraisalId: appraisal1.id,
      address: '127 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      salePrice: 460000,
      saleDate: new Date('2023-02-10'),
      squareFeet: 2600,
      bedrooms: 4,
      bathrooms: 3.0,
      yearBuilt: 2007,
      propertyType: 'Single Family',
      lotSize: 8200,
      condition: 'Excellent',
      source: 'MLS'
    }).returning();
    
    // Insert sample adjustments
    await db.insert(adjustments).values({
      comparableId: comparable1.id,
      category: 'Size',
      description: 'Square Footage Adjustment',
      amount: -5000,
      isPercentage: false,
      notes: 'Subject property is 100 sqft larger'
    });
    
    await db.insert(adjustments).values({
      comparableId: comparable1.id,
      category: 'Condition',
      description: 'Condition Adjustment',
      amount: 2000,
      isPercentage: false,
      notes: 'Subject property has newer appliances'
    });
    
    // Insert sample market data
    await db.insert(marketData).values({
      location: 'Austin, TX',
      dataType: 'Median Home Price',
      time: '2023-Q1',
      value: 450000,
      comparisonValue: 420000,
      percentChange: 7.14,
      source: 'MLS'
    });
    
    await db.insert(marketData).values({
      location: 'Austin, TX',
      dataType: 'Median Home Price',
      time: '2023-Q2',
      value: 455000,
      comparisonValue: 450000,
      percentChange: 1.11,
      source: 'MLS'
    });
    
    await db.insert(marketData).values({
      location: 'Austin, TX',
      dataType: 'Days on Market',
      time: '2023-Q1',
      value: 28,
      comparisonValue: 21,
      percentChange: 33.33,
      source: 'MLS'
    });
    
    await db.insert(marketData).values({
      location: 'Austin, TX',
      dataType: 'Days on Market',
      time: '2023-Q2',
      value: 32,
      comparisonValue: 28,
      percentChange: 14.29,
      source: 'MLS'
    });
    
    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
}