/**
 * Terrafusion S3DB Database Converter
 * Converts SQLite S3DB files to JSON format for integration
 */

import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class S3DBConverter {
  constructor() {
    this.outputDir = "data/converted";
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async convertDatabase(dbPath, outputName) {
    return new Promise((resolve, reject) => {
      console.log(`Converting ${dbPath}...`);

      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error(`Error opening database ${dbPath}:`, err);
          reject(err);
          return;
        }
        console.log(`Successfully opened ${dbPath}`);
      });

      // First, get all table names
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
          reject(err);
          return;
        }

        console.log(`Found ${tables.length} tables in ${dbPath}`);
        const result = {
          database: outputName,
          convertedAt: new Date().toISOString(),
          tables: {},
        };

        let completed = 0;
        const totalTables = tables.length;

        if (totalTables === 0) {
          this.saveResult(result, outputName);
          resolve(result);
          return;
        }

        tables.forEach((table) => {
          const tableName = table.name;
          console.log(`Processing table: ${tableName}`);

          // Get table schema
          db.all(`PRAGMA table_info(${tableName})`, [], (err, schema) => {
            if (err) {
              console.error(`Error getting schema for ${tableName}:`, err);
              completed++;
              if (completed === totalTables) {
                this.saveResult(result, outputName);
                resolve(result);
              }
              return;
            }

            // Get all data from table
            db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
              if (err) {
                console.error(`Error getting data from ${tableName}:`, err);
              } else {
                result.tables[tableName] = {
                  schema: schema,
                  rowCount: rows.length,
                  data: rows,
                };
                console.log(`✓ ${tableName}: ${rows.length} rows`);
              }

              completed++;
              if (completed === totalTables) {
                db.close();
                this.saveResult(result, outputName);
                resolve(result);
              }
            });
          });
        });
      });
    });
  }

  saveResult(result, outputName) {
    const outputPath = path.join(this.outputDir, `${outputName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`✓ Saved conversion result to ${outputPath}`);
  }

  async convertAll() {
    const databases = [
      { path: "attached_assets/contacts.s3db", name: "contacts" },
      { path: "attached_assets/filemanagement.s3db", name: "filemanagement" },
      { path: "attached_assets/spectrum.s3db", name: "spectrum" },
    ];

    const results = [];

    for (const db of databases) {
      try {
        if (fs.existsSync(db.path)) {
          const result = await this.convertDatabase(db.path, db.name);
          results.push(result);
          console.log(`✓ Successfully converted ${db.name}`);
        } else {
          console.log(`⚠ Database file not found: ${db.path}`);
        }
      } catch (error) {
        console.error(`✗ Failed to convert ${db.name}:`, error);
      }
    }

    // Create summary report
    const summary = {
      conversionDate: new Date().toISOString(),
      totalDatabases: databases.length,
      successfulConversions: results.length,
      databases: results.map((r) => ({
        name: r.database,
        tableCount: Object.keys(r.tables).length,
        totalRows: Object.values(r.tables).reduce((sum, table) => sum + table.rowCount, 0),
      })),
    };

    fs.writeFileSync(
      path.join(this.outputDir, "conversion_summary.json"),
      JSON.stringify(summary, null, 2)
    );

    console.log("\n=== Conversion Summary ===");
    console.log(`Converted ${summary.successfulConversions}/${summary.totalDatabases} databases`);
    summary.databases.forEach((db) => {
      console.log(`${db.name}: ${db.tableCount} tables, ${db.totalRows} total rows`);
    });

    return summary;
  }
}

// Run conversion if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const converter = new S3DBConverter();
  converter
    .convertAll()
    .then((summary) => {
      console.log("\n✓ All conversions completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Conversion failed:", error);
      process.exit(1);
    });
}

export default S3DBConverter;
