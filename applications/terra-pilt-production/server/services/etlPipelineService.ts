import fs from 'fs/promises';
import path from 'path';
import { db } from '../core/database';
import { logger } from '../utils/logger';

export class ETLPipelineService {
    
    async initializeETLPipeline(): Promise<void> {
        try {
            logger.info('🚀 Initializing ETL Pipeline...');
            
            // Create ETL staging tables
            await this.createETLTables();
            
            // Initialize value rates
            await this.initializeValueRates();
            
            logger.info('✅ ETL Pipeline initialized successfully');
            
        } catch (error) {
            logger.error('❌ ETL Pipeline initialization failed:', error);
            throw error;
        }
    }
    
    private async createETLTables(): Promise<void> {
        try {
            const schemaPath = path.join(__dirname, '../core/schema-etl.sql');
            const schema = await fs.readFile(schemaPath, 'utf-8');
            
            // Execute schema in chunks (SQLite doesn't support multiple statements)
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await db.execute(statement.trim());
                }
            }
            
            logger.info('✅ ETL staging tables created');
            
        } catch (error) {
            logger.error('❌ Failed to create ETL tables:', error);
            throw error;
        }
    }
    
    private async createSQLViews(): Promise<void> {
        try {
            const viewsPath = path.join(__dirname, '../core/views-pilt.sql');
            const views = await fs.readFile(viewsPath, 'utf-8');
            
            // Execute views in chunks
            const statements = views.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await db.execute(statement.trim());
                }
            }
            
            logger.info('✅ SQL views created');
            
        } catch (error) {
            logger.error('❌ Failed to create SQL views:', error);
            throw error;
        }
    }
    
    private async initializeValueRates(): Promise<void> {
        try {
            // Check if value rates already exist
            const checkQuery = `SELECT COUNT(*) as count FROM dim_pilt_value_rates`;
            const result = await db.execute(checkQuery);
            
            if (result.rows[0].count === 0) {
                logger.info('📊 Initializing PILT value rates...');
                
                const valueRates = [
                    { category: 'Dryland', unit: 'acre', value_rate: 223.57, effective_date: '2024-01-01', source: 'Benton County Assessor 2024' },
                    { category: 'Irrigable', unit: 'acre', value_rate: 2635.91, effective_date: '2024-01-01', source: 'Benton County Assessor 2024' },
                    { category: 'Lesser Riverfront', unit: 'linear_foot', value_rate: 50.00, effective_date: '2024-01-01', source: 'Benton County Assessor 2024' },
                    { category: 'Prime Riverfront', unit: 'linear_foot', value_rate: 1965.00, effective_date: '2024-01-01', source: 'Benton County Assessor 2024' },
                    { category: 'Rural Residential', unit: 'acre', value_rate: 37069.81, effective_date: '2024-01-01', source: 'Benton County Assessor 2024' },
                    { category: 'Town Plats', unit: 'acre', value_rate: 122469.84, effective_date: '2024-01-01', source: 'Benton County Assessor 2024' }
                ];
                
                for (const rate of valueRates) {
                    const insertQuery = `
                        INSERT OR IGNORE INTO dim_pilt_value_rates 
                        (category, unit, value_rate, effective_date, source) 
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    await db.execute(insertQuery, [rate.category, rate.unit, rate.value_rate, rate.effective_date, rate.source]);
                }
                
                logger.info('✅ PILT value rates initialized');
            } else {
                logger.info('✅ PILT value rates already exist');
            }
            
        } catch (error) {
            logger.error('❌ Failed to initialize value rates:', error);
            throw error;
        }
    }
    
    async importAcresData(filePath: string, category: string, batchId: string): Promise<number> {
        try {
            logger.info(`📊 Importing acres data: ${category} from ${filePath}`);
            
            // This would typically parse CSV/Excel files
            // For now, we'll create sample data to demonstrate the pipeline
            const sampleData = this.generateSampleAcresData(category, batchId);
            
            let imported = 0;
            for (const row of sampleData) {
                const insertQuery = `
                    INSERT INTO stg_pilt_acres 
                    (district_name, category, unit, quantity, source_file, import_batch_id) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                await db.execute(insertQuery, [
                    row.district_name, 
                    row.category, 
                    row.unit, 
                    row.quantity, 
                    filePath, 
                    batchId
                ]);
                imported++;
            }
            
            logger.info(`✅ Imported ${imported} acres records for ${category}`);
            return imported;
            
        } catch (error) {
            logger.error(`❌ Failed to import acres data for ${category}:`, error);
            throw error;
        }
    }
    
    async validateImportedData(batchId: string): Promise<{ valid: number; errors: number }> {
        try {
            logger.info(`🔍 Validating imported data for batch ${batchId}`);
            
            // Validate acres data
            const validationQuery = `
                UPDATE stg_pilt_acres 
                SET validation_status = CASE
                    WHEN quantity > 0 AND district_name IS NOT NULL THEN 'validated'
                    ELSE 'error'
                END
                WHERE import_batch_id = ?
            `;
            await db.execute(validationQuery, [batchId]);
            
            // Count validation results
            const countQuery = `
                SELECT 
                    SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) as valid,
                    SUM(CASE WHEN validation_status = 'error' THEN 1 ELSE 0 END) as errors
                FROM stg_pilt_acres 
                WHERE import_batch_id = ?
            `;
            const result = await db.execute(countQuery, [batchId]);
            
            const stats = result.rows[0];
            logger.info(`✅ Validation complete: ${stats.valid} valid, ${stats.errors} errors`);
            
            return { valid: stats.valid, errors: stats.errors };
            
        } catch (error) {
            logger.error('❌ Data validation failed:', error);
            throw error;
        }
    }
    
    async generatePILTCalculations(year: number): Promise<any> {
        try {
            logger.info(`🧮 Generating PILT calculations for ${year}`);
            
            // Ensure SQL views exist
            await this.createSQLViews();
            
            // Get calculation results from views
            const query = `
                SELECT * FROM vw_real_time_pilt 
                WHERE year = ?
                ORDER BY pilt_amount DESC
            `;
            
            const result = await db.execute(query, [year]);
            
            const totalPilt = result.rows.reduce((sum: number, row: any) => sum + (row.pilt_amount || 0), 0);
            
            const calculations = {
                year: year,
                totalPiltAmount: totalPilt,
                distributions: result.rows,
                calculationMethod: 'ETL Pipeline + SQL Views',
                generatedAt: new Date().toISOString()
            };
            
            logger.info(`✅ PILT calculations generated: $${totalPilt.toLocaleString()}`);
            
            return calculations;
            
        } catch (error) {
            logger.error('❌ PILT calculation generation failed:', error);
            throw error;
        }
    }
    
    private generateSampleAcresData(category: string, batchId: string): any[] {
        // Generate sample data for demonstration
        const districts = [
            'Richland SD #400',
            'Kennewick SD #17', 
            'Prosser SD #116',
            'Finley SD #53',
            'Kiona-Benton SD #52'
        ];
        
        const baseQuantities: { [key: string]: number } = {
            'Dryland': 50000,
            'Irrigable': 25000,
            'Lesser Riverfront': 5000,
            'Prime Riverfront': 1000,
            'Rural Residential': 500,
            'Town Plats': 100
        };
        
        const unit = ['Dryland', 'Irrigable', 'Rural Residential', 'Town Plats'].includes(category) ? 'acre' : 'linear_foot';
        const baseQuantity = baseQuantities[category] || 1000;
        
        return districts.map((district /* , index */) => ({
            district_name: district,
            category: category,
            unit: unit,
            quantity: baseQuantity * (0.5 + index * 0.3) // Vary quantities by district
        }));
    }
    
    async getETLStatus(): Promise<any> {
        try {
            const statusQuery = `
                SELECT 
                    'Acres Data' as data_type,
                    COUNT(*) as total_records,
                    SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) as validated,
                    SUM(CASE WHEN validation_status = 'error' THEN 1 ELSE 0 END) as errors,
                    MAX(import_date) as last_import
                FROM stg_pilt_acres
                UNION ALL
                SELECT 
                    'Value Rates' as data_type,
                    COUNT(*) as total_records,
                    COUNT(*) as validated,
                    0 as errors,
                    MAX(created_at) as last_import
                FROM dim_pilt_value_rates
            `;
            
            const result = await db.execute(statusQuery);
            
            return {
                status: 'active',
                pipeline: 'ETL Enhanced',
                data_sources: result.rows,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            logger.error('❌ Failed to get ETL status:', error);
            return {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
} 