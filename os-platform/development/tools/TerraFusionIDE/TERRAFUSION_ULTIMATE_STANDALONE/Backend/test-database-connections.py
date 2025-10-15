#!/usr/bin/env python3
"""
TerraFusion OS Database Connection Test
Tests connectivity to real Benton County databases
"""

import sqlite3
import os
import sys
from datetime import datetime
from pathlib import Path

def test_database_connection(db_path, db_name):
    """Test connection to a SQLite database and return basic stats"""
    print(f"\n📊 Testing {db_name}...")
    print(f"   Path: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"   ❌ Database file not found")
        return False
    
    try:
        # Get file size
        file_size = os.path.getsize(db_path)
        print(f"   📁 Size: {file_size:,} bytes ({file_size / 1024 / 1024:.1f} MB)")
        
        # Connect and test
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cursor = conn.cursor()
        
        # Get table count
        cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
        table_count = cursor.fetchone()[0]
        print(f"   📋 Tables: {table_count}")
        
        # Get table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"   📝 Table names: {', '.join(tables[:5])}" + ("..." if len(tables) > 5 else ""))
        
        # Try to get record count from main tables
        record_counts = {}
        for table in ['properties', 'permits', 'assessments', 'parcels']:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                record_counts[table] = count
                print(f"   🏠 {table}: {count:,} records")
            except sqlite3.OperationalError:
                # Table doesn't exist
                pass
        
        conn.close()
        print(f"   ✅ Connection successful")
        return True
        
    except Exception as e:
        print(f"   ❌ Connection failed: {str(e)}")
        return False

def main():
    print("🚀 TerraFusion OS Database Connection Test")
    print("=" * 50)
    
    # Database paths
    data_dir = Path("/mnt/e/TerraFusion_OS_1.0/data/databases")
    databases = [
        (data_dir / "real_pacs.db", "Harris PACS Integration Database"),
        (data_dir / "terrafusionsync_real.db", "TerraFusion Sync Database"),
        (data_dir / "properties.db", "Properties Database"),
        (data_dir / "terrafusion_production.db", "Production Database"),
    ]
    
    results = []
    
    for db_path, db_name in databases:
        success = test_database_connection(str(db_path), db_name)
        results.append((db_name, success))
    
    # Summary
    print("\n" + "=" * 50)
    print("📈 DATABASE CONNECTION SUMMARY")
    print("=" * 50)
    
    success_count = sum(1 for _, success in results if success)
    total_count = len(results)
    
    for db_name, success in results:
        status = "✅ CONNECTED" if success else "❌ FAILED"
        print(f"   {status:<12} {db_name}")
    
    print(f"\n🎯 Overall Status: {success_count}/{total_count} databases connected")
    
    if success_count == total_count:
        print("🎉 All databases are accessible and ready for TerraFusion OS!")
        return 0
    else:
        print("⚠️  Some databases have connection issues. Check paths and permissions.")
        return 1

if __name__ == "__main__":
    sys.exit(main())