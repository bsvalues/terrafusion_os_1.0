#!/usr/bin/env python3
import sqlite3
import os

# Check if we're connected to real Benton County data
try:
    conn = sqlite3.connect('terrafusionsync_real.db')
    cursor = conn.cursor()
    
    # Get property count
    cursor.execute('SELECT COUNT(*) FROM Property')
    count = cursor.fetchone()[0]
    
    # Get average assessed value
    cursor.execute('SELECT AVG(assessed_value) FROM Property WHERE assessed_value > 0')
    avg_value = cursor.fetchone()[0] if cursor.fetchone() else 0
    
    print("="*60)
    print("REAL BENTON COUNTY DATABASE STATUS")
    print("="*60)
    print(f"Total Properties: {count:,}")
    print(f"Average Property Value: ${avg_value:,.2f}")
    print(f"Database Size: {os.path.getsize('terrafusionsync_real.db'):,} bytes")
    
    if count == 94149:
        print("✅ VERIFIED: Connected to REAL Benton County data!")
    else:
        print("❌ WARNING: Not connected to real data")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Database connection error: {e}") 