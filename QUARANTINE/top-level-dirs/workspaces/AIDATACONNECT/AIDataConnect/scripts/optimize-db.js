#!/usr/bin/env node

/**
 * RAG Drive FTP Hub Database Optimization Tool
 * This script analyzes the database schema and queries for optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config();

// Configuration
const LOG_FILE = './logs/db-optimization.log';
const REPORT_FILE = './database-optimization-report.md';

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// Logger setup
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
};

// Initialize database connection
let pool;
try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  log('Successfully connected to database');
} catch (error) {
  log(`Error connecting to database: ${error.message}`);
  process.exit(1);
}

// Function to analyze table sizes
async function analyzeTableSizes() {
  log('Analyzing table sizes...');
  
  try {
    const query = `
      SELECT
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS total_size,
        pg_size_pretty(pg_relation_size(quote_ident(table_name))) AS table_size,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name)) - pg_relation_size(quote_ident(table_name))) AS index_size,
        pg_total_relation_size(quote_ident(table_name)) AS size_in_bytes
      FROM
        information_schema.tables
      WHERE
        table_schema = 'public'
      ORDER BY
        pg_total_relation_size(quote_ident(table_name)) DESC;
    `;
    
    const result = await pool.query(query);
    log(`Found ${result.rows.length} tables`);
    return result.rows;
  } catch (error) {
    log(`Error analyzing table sizes: ${error.message}`);
    return [];
  }
}

// Function to check for missing indexes
async function checkMissingIndexes() {
  log('Checking for missing indexes...');
  
  try {
    const query = `
      SELECT
        schemaname,
        relname AS table_name,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        CASE 
          WHEN seq_scan > 0 THEN (seq_scan::float / (seq_scan + idx_scan + 0.0001)) * 100
          ELSE 0
        END AS seq_scan_pct,
        n_live_tup AS estimated_rows
      FROM
        pg_stat_user_tables
      WHERE
        seq_scan > 10
        AND (seq_scan::float / (seq_scan + idx_scan + 0.0001)) > 0.5
        AND n_live_tup > 1000
      ORDER BY
        seq_scan_pct DESC,
        seq_scan DESC;
    `;
    
    const result = await pool.query(query);
    log(`Found ${result.rows.length} tables that might need indexing`);
    return result.rows;
  } catch (error) {
    log(`Error checking for missing indexes: ${error.message}`);
    return [];
  }
}

// Function to check unused indexes
async function checkUnusedIndexes() {
  log('Checking for unused indexes...');
  
  try {
    const query = `
      SELECT
        schemaname,
        relname AS table_name,
        indexrelname AS index_name,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
        pg_relation_size(indexrelid) AS index_size_bytes
      FROM
        pg_stat_user_indexes
      JOIN
        pg_index USING (indexrelid)
      WHERE
        idx_scan < 50
        AND indisunique IS FALSE
        AND pg_relation_size(indexrelid) > 1024 * 1024 -- larger than 1MB
      ORDER BY
        pg_relation_size(indexrelid) DESC;
    `;
    
    const result = await pool.query(query);
    log(`Found ${result.rows.length} potentially unused indexes`);
    return result.rows;
  } catch (error) {
    log(`Error checking for unused indexes: ${error.message}`);
    return [];
  }
}

// Function to analyze slow queries
async function analyzeSlowQueries() {
  log('Analyzing slow queries...');
  
  try {
    const query = `
      SELECT
        substring(query, 1, 100) AS short_query,
        round(total_time::numeric, 2) AS total_time,
        calls,
        round(mean_time::numeric, 2) AS mean_time,
        round(stddev_time::numeric, 2) AS stddev_time,
        round((100 * total_time / sum(total_time) OVER ())::numeric, 2) AS percentage_cpu
      FROM
        pg_stat_statements
      ORDER BY
        total_time DESC
      LIMIT 20;
    `;
    
    try {
      const result = await pool.query(query);
      log(`Found ${result.rows.length} slow queries`);
      return result.rows;
    } catch (e) {
      // If pg_stat_statements extension is not enabled
      log('pg_stat_statements extension not enabled, skipping slow query analysis');
      return [];
    }
  } catch (error) {
    log(`Error analyzing slow queries: ${error.message}`);
    return [];
  }
}

// Function to check column statistics
async function analyzeColumnStatistics() {
  log('Analyzing column statistics...');
  
  try {
    const query = `
      SELECT
        table_name,
        column_name,
        data_type
      FROM
        information_schema.columns
      WHERE
        table_schema = 'public'
      ORDER BY
        table_name,
        ordinal_position;
    `;
    
    const result = await pool.query(query);
    
    // Get column null percentage and distinct values for each column
    const columnStats = [];
    
    for (const column of result.rows) {
      try {
        const statsQuery = `
          SELECT
            '${column.table_name}' AS table_name,
            '${column.column_name}' AS column_name,
            '${column.data_type}' AS data_type,
            COUNT(*) AS total_rows,
            COUNT(${column.column_name}) AS non_null_values,
            (COUNT(*) - COUNT(${column.column_name})) AS null_values,
            ROUND(((COUNT(*) - COUNT(${column.column_name})) * 100.0 / GREATEST(COUNT(*), 1)), 2) AS null_percentage,
            COUNT(DISTINCT ${column.column_name}) AS distinct_values,
            ROUND((COUNT(DISTINCT ${column.column_name}) * 100.0 / GREATEST(COUNT(*), 1)), 2) AS distinct_percentage
          FROM
            ${column.table_name}
        `;
        
        const statsResult = await pool.query(statsQuery);
        if (statsResult.rows.length > 0) {
          columnStats.push(statsResult.rows[0]);
        }
      } catch (e) {
        // Skip errors for this column
        log(`Skipping statistics for ${column.table_name}.${column.column_name}: ${e.message}`);
      }
    }
    
    log(`Analyzed statistics for ${columnStats.length} columns`);
    return columnStats;
  } catch (error) {
    log(`Error analyzing column statistics: ${error.message}`);
    return [];
  }
}

// Function to check foreign keys and constraints
async function checkConstraints() {
  log('Checking constraints...');
  
  try {
    const query = `
      SELECT
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        CASE
          WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            ccu.table_name
          ELSE
            NULL
        END AS referenced_table,
        array_agg(kcu.column_name::text) AS column_names
      FROM
        information_schema.table_constraints tc
      JOIN
        information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN
        information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE
        tc.table_schema = 'public'
      GROUP BY
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        referenced_table
      ORDER BY
        tc.table_name,
        tc.constraint_name;
    `;
    
    const result = await pool.query(query);
    log(`Found ${result.rows.length} constraints`);
    return result.rows;
  } catch (error) {
    log(`Error checking constraints: ${error.message}`);
    return [];
  }
}

// Function to recommend database optimizations
function generateOptimizationRecommendations(data) {
  log('Generating optimization recommendations...');
  
  const recommendations = [];
  
  // Analyze table sizes
  if (data.tableSizes.length > 0) {
    // Find largest tables
    const largestTables = data.tableSizes
      .sort((a, b) => b.size_in_bytes - a.size_in_bytes)
      .slice(0, 3);
    
    if (largestTables.length > 0) {
      recommendations.push({
        category: 'Table Size',
        title: 'Large Tables Identified',
        description: `The following tables are the largest in your database and may benefit from optimization:`,
        items: largestTables.map(table => `${table.table_name} (${table.total_size})`),
        recommendations: [
          'Consider table partitioning for very large tables',
          'Implement data archiving strategy for historical data',
          'Review column data types to ensure they are optimal'
        ]
      });
    }
  }
  
  // Missing indexes
  if (data.missingIndexes.length > 0) {
    recommendations.push({
      category: 'Indexing',
      title: 'Missing Indexes Detected',
      description: 'The following tables have high sequential scan percentages and might benefit from additional indexes:',
      items: data.missingIndexes.map(table => 
        `${table.table_name} (${table.seq_scan_pct.toFixed(2)}% sequential scans, ${table.seq_scan} scans)`
      ),
      recommendations: [
        'Add indexes on frequently queried columns',
        'Consider composite indexes for multi-column queries',
        'Analyze query patterns to identify optimal index candidates'
      ]
    });
  }
  
  // Unused indexes
  if (data.unusedIndexes.length > 0) {
    recommendations.push({
      category: 'Indexing',
      title: 'Potentially Unused Indexes Detected',
      description: 'The following indexes have very low usage and are consuming space:',
      items: data.unusedIndexes.map(index => 
        `${index.index_name} on ${index.table_name} (${index.index_size}, ${index.idx_scan} scans)`
      ),
      recommendations: [
        'Consider removing unused indexes to improve INSERT/UPDATE performance',
        'Monitor index usage before removal',
        'Keep indexes required for constraints even if rarely used'
      ]
    });
  }
  
  // Slow queries
  if (data.slowQueries.length > 0) {
    recommendations.push({
      category: 'Query Performance',
      title: 'Slow Queries Identified',
      description: 'The following queries are consuming the most database resources:',
      items: data.slowQueries.slice(0, 5).map(query => 
        `"${query.short_query}" (${query.mean_time}ms avg, ${query.calls} calls, ${query.percentage_cpu}% CPU)`
      ),
      recommendations: [
        'Optimize slow queries using EXPLAIN ANALYZE',
        'Consider adding indexes to support these queries',
        'Review application code that generates these queries',
        'Implement query caching where appropriate'
      ]
    });
  }
  
  // Column statistics
  if (data.columnStats.length > 0) {
    // High null percentage columns
    const highNullColumns = data.columnStats
      .filter(col => col.null_percentage > 70)
      .slice(0, 5);
    
    if (highNullColumns.length > 0) {
      recommendations.push({
        category: 'Schema Design',
        title: 'Columns with High NULL Percentages',
        description: 'The following columns have high NULL percentages and might be candidates for schema optimization:',
        items: highNullColumns.map(col => 
          `${col.table_name}.${col.column_name} (${col.null_percentage}% NULL)`
        ),
        recommendations: [
          'Consider moving rarely-used columns to a separate table',
          'Evaluate if these columns are still needed',
          'Check application logic that populates these columns'
        ]
      });
    }
    
    // High cardinality columns without indexes
    const highCardinalityColumns = data.columnStats
      .filter(col => col.distinct_percentage > 90 && col.total_rows > 1000)
      .slice(0, 5);
    
    if (highCardinalityColumns.length > 0) {
      recommendations.push({
        category: 'Indexing',
        title: 'High Cardinality Columns',
        description: 'The following columns have high cardinality and might benefit from indexes:',
        items: highCardinalityColumns.map(col => 
          `${col.table_name}.${col.column_name} (${col.distinct_percentage}% distinct values)`
        ),
        recommendations: [
          'Consider adding indexes for these columns if they are used in WHERE clauses',
          'Verify these columns are used in queries before indexing',
          'For unique values, consider adding a UNIQUE constraint'
        ]
      });
    }
  }
  
  // Constraints
  if (data.constraints.length > 0) {
    // Check for missing foreign keys
    const tables = [...new Set(data.constraints.map(c => c.table_name))];
    const tablesWithForeignKeys = [...new Set(data.constraints
      .filter(c => c.constraint_type === 'FOREIGN KEY')
      .map(c => c.table_name))];
    
    const tablesWithoutForeignKeys = tables
      .filter(table => !tablesWithForeignKeys.includes(table))
      .filter(table => !table.endsWith('_pkey')); // Exclude tables that are likely junction tables
    
    if (tablesWithoutForeignKeys.length > 0) {
      recommendations.push({
        category: 'Referential Integrity',
        title: 'Tables Without Foreign Keys',
        description: 'The following tables do not have any foreign keys, which might indicate missing relationships:',
        items: tablesWithoutForeignKeys,
        recommendations: [
          'Review these tables for potential missing relationships',
          'Add foreign key constraints to enforce referential integrity',
          'Ensure all relationships are properly modeled in the schema'
        ]
      });
    }
  }
  
  // General recommendations
  recommendations.push({
    category: 'General Optimization',
    title: 'General Database Optimization Recommendations',
    description: 'Consider these general optimization strategies for your database:',
    items: [],
    recommendations: [
      'Regularly run VACUUM and ANALYZE to maintain database health',
      'Consider enabling pg_stat_statements for query performance monitoring',
      'Implement connection pooling to manage database connections efficiently',
      'Configure autovacuum settings based on database workload',
      'Set appropriate work_mem and shared_buffers based on available system memory',
      'Implement a regular database maintenance schedule'
    ]
  });
  
  log(`Generated ${recommendations.length} optimization recommendations`);
  return recommendations;
}

// Function to generate the final report
function generateReport(data, recommendations) {
  log('Generating database optimization report...');
  
  const reportContent = `# RAG Drive FTP Hub Database Optimization Report

Generated on: ${new Date().toLocaleString()}

## Executive Summary

This report provides an analysis of the current database schema and usage patterns, along with recommendations for optimization. The goal is to improve performance, reduce resource usage, and ensure the database structure supports application requirements efficiently.

## Database Overview

${data.tableSizes.length > 0 ? `
### Table Sizes

| Table Name | Total Size | Table Size | Index Size |
|------------|------------|------------|-----------|
${data.tableSizes.map(table => `| ${table.table_name} | ${table.total_size} | ${table.table_size} | ${table.index_size} |`).join('\n')}
` : ''}

${data.constraints.length > 0 ? `
### Constraint Summary

Total constraints: ${data.constraints.length}

| Constraint Type | Count |
|-----------------|-------|
${Object.entries(data.constraints.reduce((acc, curr) => {
  acc[curr.constraint_type] = (acc[curr.constraint_type] || 0) + 1;
  return acc;
}, {})).map(([type, count]) => `| ${type} | ${count} |`).join('\n')}
` : ''}

## Optimization Recommendations

${recommendations.map(rec => `
### ${rec.category}: ${rec.title}

${rec.description}

${rec.items.length > 0 ? `#### Affected Objects:\n${rec.items.map(item => `- ${item}`).join('\n')}` : ''}

#### Recommendations:
${rec.recommendations.map(r => `- ${r}`).join('\n')}
`).join('\n')}

## Implementation Steps

1. **Before making any changes:**
   - Back up your database using \`./scripts/db-backup.sh\`
   - Test changes in a staging environment first
   - Monitor performance metrics before and after changes

2. **For each recommended change:**
   - Document the current state
   - Implement the change during a low-traffic period
   - Verify application functionality after the change
   - Monitor performance impact

3. **Indexing guidelines:**
   - Add indexes one at a time and measure impact
   - Drop unused indexes during low-traffic periods
   - Remember that indexes speed up reads but slow down writes

4. **Schema changes:**
   - Plan schema changes carefully to minimize downtime
   - Use database migrations to track schema changes
   - Test schema changes thoroughly before applying to production

## Conclusion

By implementing these recommendations, you can expect improved query performance, reduced resource usage, and a more maintainable database schema. Regular database optimization should be part of your ongoing maintenance process.

---

*This report was generated automatically by the RAG Drive FTP Hub Database Optimization Tool. For assistance with implementing these recommendations, please contact the development team.*
`;
  
  fs.writeFileSync(REPORT_FILE, reportContent);
  log(`Report generated and saved to ${REPORT_FILE}`);
}

// Main function
async function main() {
  log('Starting database optimization analysis...');
  
  try {
    // Analyze database
    const tableSizes = await analyzeTableSizes();
    const missingIndexes = await checkMissingIndexes();
    const unusedIndexes = await checkUnusedIndexes();
    const slowQueries = await analyzeSlowQueries();
    const columnStats = await analyzeColumnStatistics();
    const constraints = await checkConstraints();
    
    // Compile data
    const data = {
      tableSizes,
      missingIndexes,
      unusedIndexes,
      slowQueries,
      columnStats,
      constraints
    };
    
    // Generate recommendations
    const recommendations = generateOptimizationRecommendations(data);
    
    // Generate report
    generateReport(data, recommendations);
    
    log('Database optimization analysis completed successfully');
  } catch (error) {
    log(`Error during database optimization analysis: ${error.message}`);
  } finally {
    // Close database connection
    await pool.end();
    log('Database connection closed');
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});