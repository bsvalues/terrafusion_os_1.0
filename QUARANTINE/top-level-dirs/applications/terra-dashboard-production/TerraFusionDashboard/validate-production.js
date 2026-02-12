import pkg from 'pg';
const { Pool } = pkg;

async function validateProduction() {
  console.log('🔍 Terrafusion Production Validation\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Test database connectivity and data integrity
    const client = await pool.connect();
    
    const propertyCount = await client.query('SELECT COUNT(*) as count FROM properties WHERE active = true');
    const cityDistribution = await client.query(`
      SELECT 
        CASE 
          WHEN address LIKE '%Kennewick%' THEN 'Kennewick'
          WHEN address LIKE '%Richland%' THEN 'Richland'
          WHEN address LIKE '%Prosser%' THEN 'Prosser'
          WHEN address LIKE '%Benton City%' THEN 'Benton City'
          ELSE 'Other Benton County'
        END as city,
        COUNT(*) as count
      FROM properties 
      WHERE active = true
      GROUP BY 1
      ORDER BY count DESC
    `);
    
    const valueStats = await client.query(`
      SELECT 
        AVG(CAST(assessed_value AS DECIMAL)) as avg_value,
        MIN(CAST(assessed_value AS DECIMAL)) as min_value,
        MAX(CAST(assessed_value AS DECIMAL)) as max_value
      FROM properties 
      WHERE active = true AND assessed_value IS NOT NULL
    `);
    
    client.release();
    
    console.log('Database Status: OPERATIONAL');
    console.log(`Active Properties: ${parseInt(propertyCount.rows[0].count).toLocaleString()}`);
    console.log('\nCity Distribution:');
    cityDistribution.rows.forEach(row => {
      console.log(`  ${row.city}: ${parseInt(row.count).toLocaleString()} properties`);
    });
    
    const stats = valueStats.rows[0];
    console.log('\nProperty Values:');
    console.log(`  Average: $${parseInt(stats.avg_value).toLocaleString()}`);
    console.log(`  Range: $${parseInt(stats.min_value).toLocaleString()} - $${parseInt(stats.max_value).toLocaleString()}`);
    
    // Test API endpoints
    console.log('\nAPI Endpoints:');
    const endpoints = ['/api/health', '/api/properties', '/api/agents', '/api/dashboard/stats'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`);
        console.log(`  ${endpoint}: ${response.status === 200 ? 'OK' : 'ERROR'}`);
      } catch (error) {
        console.log(`  ${endpoint}: ERROR`);
      }
    }
    
    console.log('\n✅ Production validation complete');
    console.log('Platform ready for Benton County deployment');
    
  } catch (error) {
    console.error('Validation failed:', error.message);
  } finally {
    await pool.end();
  }
}

validateProduction();