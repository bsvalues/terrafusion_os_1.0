"""
Seed the data_source_status table with initial data.
This script uses raw SQL to avoid import issues.
"""
import os
import sys
import psycopg2
from datetime import datetime

# Get database URL from environment variable
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print("DATABASE_URL environment variable not set")
    sys.exit(1)

def seed_data_sources():
    """Seed the data_source_status table with initial data."""
    try:
        # Connect to the database
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Check if there are already entries
        cur.execute("SELECT COUNT(*) FROM data_source_status")
        count = cur.fetchone()[0]
        
        if count > 0:
            print(f"Data sources already seeded. Found {count} sources.")
            conn.close()
            return
        
        # Current timestamp
        now = datetime.utcnow().isoformat()
        
        # Insert data sources
        sources = [
            ('zillow', 'healthy', True, 'primary', 93.0, 0.8, 87, 1254, now, True, True, now, now),
            ('realtor', 'degraded', True, 'secondary', 85.0, 1.2, 148, 987, now, True, True, now, now),
            ('pacmls', 'limited', True, 'tertiary', 78.0, 0.5, 119, 542, now, True, True, now, now),
            ('county', 'critical', False, 'fallback', 65.0, 1.7, 112, 321, now, False, True, now, now),
        ]
        
        # SQL for inserting a data source
        sql = """
        INSERT INTO data_source_status 
        (source_name, status, is_active, priority, success_rate, avg_response_time, 
         error_count, request_count, last_check, credentials_configured, settings_configured,
         created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # Execute inserts
        for source in sources:
            cur.execute(sql, source)
        
        # Commit the changes
        conn.commit()
        print(f"Successfully seeded {len(sources)} data sources.")
        
    except Exception as e:
        print(f"Error seeding data sources: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    seed_data_sources()