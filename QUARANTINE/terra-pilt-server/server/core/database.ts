import Database from 'better-sqlite3';
import { logger } from '../utils/logger';
import { dbInitializer } from './database-init';

const isDevelopment = process.env.NODE_ENV === 'development';

let sqliteDb: Database.Database | null = null;

export const initializeDatabase = async (): Promise<void> => {
    try {
        await dbInitializer.initialize();
        sqliteDb = dbInitializer.getDatabase();
        logger.info(`✅ SQLite database initialized for ${isDevelopment ? 'development' : 'production'}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to initialize SQLite database:', { error: errorMessage });
        throw error;
    }
};

export const db = {
    execute: async (query: string, params: any[] = []): Promise<{ rows: any[] }> => {
        if (!sqliteDb) {
            throw new Error('Database not initialized. Call initializeDatabase() first.');
        }

        try {
            if (query.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = sqliteDb.prepare(query);
                const rows = stmt.all(...params);
                return { rows };
            } else {
                const stmt = sqliteDb.prepare(query);
                const result = stmt.run(...params);
                return {
                    rows: [{
                        id: result.lastInsertRowid,
                        changes: result.changes
                    }]
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Database query error:', {
                query: query.substring(0, 100) + '...',
                error: errorMessage
            });
            throw error;
        }
    }
};

export const getPoolStats = () => ({
    totalCount: sqliteDb ? 1 : 0,
    idleCount: sqliteDb ? 1 : 0,
    waitingCount: 0
});

export const closePool = async () => {
    if (sqliteDb) {
        sqliteDb.close();
        sqliteDb = null;
        logger.info('SQLite database connection closed');
    }
};

export const testDatabaseConnection = async (): Promise<boolean> => {
    if (sqliteDb) {
        return await dbInitializer.testConnection();
    }
    return false;
};
