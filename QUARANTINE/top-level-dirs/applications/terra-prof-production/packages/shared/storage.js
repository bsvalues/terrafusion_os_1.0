/**
 * TerraFusionPro Shared Storage Module
 * 
 * This module provides database connection and query utilities.
 * It uses direct SQL queries instead of ORM due to compatibility issues.
 */

import pg from 'pg';

// Get database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('Database connection string not found in environment variables');
}

// Create a connection pool
const pool = new pg.Pool({ connectionString });

/**
 * Run migrations on the database
 */
export const runMigrations = async () => {
  try {
    console.log('Running migrations...');
    // Import initialize-db.js dynamically
    const initDb = await import('./scripts/initialize-db.js');
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

/**
 * Initialize the database connection and run health check
 */
export const initializeDatabase = async () => {
  try {
    // Test the database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
};

/**
 * Close the database connection pool
 */
export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

/**
 * Create a record in the specified table
 * @param {string} table - The table name 
 * @param {Object} data - The data to insert
 * @returns {Promise<Object>} - The created record
 */
export const create = async (table, data) => {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const query = `
      INSERT INTO ${table} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error(`Error creating record in ${table}:`, error);
    throw error;
  }
};

/**
 * Find records in the specified table
 * @param {string} table - The table name
 * @param {Object} where - The where clause (field-value pairs)
 * @param {Object} options - Additional options (limit, offset, orderBy)
 * @returns {Promise<Array>} - The matching records
 */
export const find = async (table, where = {}, options = {}) => {
  try {
    const { limit, offset, orderBy } = options;
    const keys = Object.keys(where);
    const values = Object.values(where);
    
    let query = `SELECT * FROM ${table}`;
    
    if (keys.length > 0) {
      const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      query += ` WHERE ${conditions}`;
    }
    
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    if (offset) {
      query += ` OFFSET ${offset}`;
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error(`Error finding records in ${table}:`, error);
    throw error;
  }
};

/**
 * Find a single record by its ID
 * @param {string} table - The table name
 * @param {number|string} id - The ID of the record to find
 * @returns {Promise<Object|null>} - The matching record or null if not found
 */
export const findById = async (table, id) => {
  try {
    const query = `
      SELECT * FROM ${table}
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error finding record by ID in ${table}:`, error);
    throw error;
  }
};

/**
 * Update a record in the specified table
 * @param {string} table - The table name
 * @param {number|string} id - The ID of the record to update
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated record
 */
export const update = async (table, id, data) => {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, [...values, id]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating record in ${table}:`, error);
    throw error;
  }
};

/**
 * Delete a record from the specified table
 * @param {string} table - The table name
 * @param {number|string} id - The ID of the record to delete
 * @returns {Promise<boolean>} - True if the record was deleted
 */
export const remove = async (table, id) => {
  try {
    const query = `
      DELETE FROM ${table}
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting record from ${table}:`, error);
    throw error;
  }
};

/**
 * Execute a raw SQL query
 * @param {string} sql - The SQL query to execute
 * @param {Array} params - The query parameters
 * @returns {Promise<Object>} - The query result
 */
export const query = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// Table names for convenience
export const tables = {
  USERS: 'users',
  PROPERTIES: 'properties',
  PROPERTY_IMAGES: 'property_images',
  APPRAISAL_REPORTS: 'appraisal_reports',
  COMPARABLES: 'comparables',
  FORMS: 'forms',
  FORM_SUBMISSIONS: 'form_submissions',
  MARKET_DATA: 'market_data'
};

export default {
  create,
  find,
  findById,
  update,
  remove,
  query,
  initializeDatabase,
  closeDatabase,
  runMigrations,
  tables
};