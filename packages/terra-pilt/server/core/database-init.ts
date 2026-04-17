import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'terrafusion_pilt.db');
const SCHEMA_PATH = path.join(__dirname, 'schema-sqlite.sql');

export class DatabaseInitializer {
    private db: Database.Database;

    constructor() {
        this.db = new Database(DB_PATH);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
    }

    async initialize(): Promise<void> {
        try {
            logger.info('Initializing SQLite database...');
            logger.info(`Schema path: ${SCHEMA_PATH}`);

            if (!fs.existsSync(SCHEMA_PATH)) {
                throw new Error(`Schema file not found: ${SCHEMA_PATH}`);
            }

            const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
            logger.info(`Schema file size: ${schema.length} characters`);

            const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

            for (const statement of statements) {
                const trimmedStmt = statement.trim();
                if (trimmedStmt.length > 0) {
                    try {
                        this.db.exec(trimmedStmt);
                        if (trimmedStmt.toUpperCase().includes('CREATE TABLE')) {
                            const tableName = trimmedStmt.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1];
                            logger.info(`✅ Created table: ${tableName}`);
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        if (!errorMessage.includes('already exists')) {
                            logger.warn(`Schema statement warning: ${errorMessage}`);
                            logger.error(`Statement: ${trimmedStmt.substring(0, 100)}...`);
                        }
                    }
                }
            }

            await this.insertSampleData();

            logger.info('✅ SQLite database initialized successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to initialize database:', { error: errorMessage });
            throw error;
        }
    }

    private async insertSampleData(): Promise<void> {
        try {
            const existingDistricts = this.db.prepare('SELECT COUNT(*) as count FROM districts').get() as { count: number };

            if (existingDistricts.count > 0) {
                logger.info('Sample data already exists, skipping insertion');
                return;
            }

            const insertDistrict = this.db.prepare(`
        INSERT INTO districts (id, name, code, county, state, created_at) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);

            const districts = [
                ['richland_sd', 'Richland School District', '400', 'Benton County', 'Washington'],
                ['kennewick_sd', 'Kennewick School District', '017', 'Benton County', 'Washington'],
                ['pasco_sd', 'Pasco School District', '001', 'Benton County', 'Washington'],
                ['finley_sd', 'Finley School District', '053', 'Benton County', 'Washington'],
                ['kiona_benton_sd', 'Kiona-Benton City School District', '052', 'Benton County', 'Washington']
            ];

            for (const district of districts) {
                insertDistrict.run(...district);
            }

            const insertAssessedValue = this.db.prepare(`
        INSERT INTO assessed_values (district_id, year, total_value, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `);

            const assessedValues = [
                ['richland_sd', 2024, 3200000000],
                ['kennewick_sd', 2024, 2800000000],
                ['pasco_sd', 2024, 1200000000],
                ['finley_sd', 2024, 180000000],
                ['kiona_benton_sd', 2024, 120000000]
            ];

            for (const value of assessedValues) {
                insertAssessedValue.run(...value);
            }

            const insertLevyRate = this.db.prepare(`
        INSERT INTO levy_rates (district_id, year, rate, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `);

            const levyRates = [
                ['richland_sd', 2024, 0.0025],
                ['kennewick_sd', 2024, 0.0024],
                ['pasco_sd', 2024, 0.0027],
                ['finley_sd', 2024, 0.0032],
                ['kiona_benton_sd', 2024, 0.0035]
            ];

            for (const rate of levyRates) {
                insertLevyRate.run(...rate);
            }

            logger.info('✅ Sample data inserted successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Failed to insert sample data:', { error: errorMessage });
            throw error;
        }
    }

    getDatabase(): Database.Database {
        return this.db;
    }

    close(): void {
        this.db.close();
    }

    async testConnection(): Promise<boolean> {
        try {
            const result = this.db.prepare('SELECT COUNT(*) as count FROM districts').get() as { count: number };
            logger.info(`Database test: ${result.count} districts found`);
            return result.count > 0;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Database connection test failed:', { error: errorMessage });
            return false;
        }
    }
}

export const dbInitializer = new DatabaseInitializer(); 