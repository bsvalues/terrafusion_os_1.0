#!/usr/bin/env python3
import sqlite3
import os

# Check if database exists
db_path = "terrafusionsync_real.db"
if os.path.exists(db_path):
    print(f"✅ Database found: {db_path}")
    print(f"📊 Size: {os.path.getsize(db_path):,} bytes")
    
    # Connect and check contents
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"📋 Tables: {[t[0] for t in tables]}")
    
    # Check properties table
    try:
        cursor.execute("SELECT COUNT(*) FROM properties")
        count = cursor.fetchone()[0]
        print(f"🏠 Properties: {count:,}")
        
        # Get a sample
        cursor.execute("SELECT * FROM properties LIMIT 3")
        sample = cursor.fetchall()
        print(f"📄 Sample records: {len(sample)}")
        
    except Exception as e:
        print(f"❌ Error checking properties: {e}")
    
    conn.close()
else:
    print(f"❌ Database not found: {db_path}") 