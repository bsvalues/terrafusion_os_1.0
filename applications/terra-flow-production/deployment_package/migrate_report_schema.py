"""
Script to migrate the data_quality_report table schema to add new columns.
This script should be run once to update the database schema.
"""

import sys
import logging
from app import app, db

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate_report_table():
    """
    Add new columns to the data_quality_report table.
    """
    try:
        with app.app_context():
            # Check if columns already exist
            conn = db.engine.connect()
            
            # Get existing columns
            columns_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'data_quality_report'
            """
            result = conn.execute(db.text(columns_query))
            existing_columns = [row[0] for row in result]
            
            logger.info(f"Existing columns: {existing_columns}")
            
            # Add new columns if they don't exist
            new_columns = {
                'report_type': 'VARCHAR(32) DEFAULT \'default\'',
                'report_file_path': 'VARCHAR(255)',
                'report_format': 'VARCHAR(32) DEFAULT \'pdf\'',
                'start_date': 'TIMESTAMP',
                'end_date': 'TIMESTAMP'
            }
            
            # Start a transaction
            trans = conn.begin()
            
            try:
                for column_name, column_type in new_columns.items():
                    if column_name not in existing_columns:
                        logger.info(f"Adding column {column_name} to data_quality_report")
                        alter_query = f"ALTER TABLE data_quality_report ADD COLUMN {column_name} {column_type}"
                        conn.execute(db.text(alter_query))
                    else:
                        logger.info(f"Column {column_name} already exists")
                
                # Commit transaction
                trans.commit()
                logger.info("Migration completed successfully")
                
            except Exception as e:
                # Rollback the transaction on error
                trans.rollback()
                logger.error(f"Error during migration: {str(e)}")
                raise
                
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return False
        
    return True

if __name__ == '__main__':
    logger.info("Starting data_quality_report table migration")
    success = migrate_report_table()
    
    if success:
        logger.info("Migration completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration failed")
        sys.exit(1)