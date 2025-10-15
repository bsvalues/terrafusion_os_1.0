#!/usr/bin/env python3
import sqlite3
import os

# Check the actual database structure
try:
    conn = sqlite3.connect('terrafusionsync_real.db')
    cursor = conn.cursor()
    
    print("="*60)
    print("REAL DATABASE STRUCTURE ANALYSIS")
    print("="*60)
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print(f"Database Size: {os.path.getsize('terrafusionsync_real.db'):,} bytes")
    print(f"Number of Tables: {len(tables)}")
    print("\nTABLES:")
    
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"  {table_name}: {count:,} records")
        
        # Show first few column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        if columns:
            print(f"    Columns: {', '.join([col[1] for col in columns[:5]])}...")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Database error: {e}") 