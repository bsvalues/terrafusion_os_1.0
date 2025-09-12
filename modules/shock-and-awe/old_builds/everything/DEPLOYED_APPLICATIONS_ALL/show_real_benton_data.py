#!/usr/bin/env python3
import sqlite3

# Show real Benton County property data
try:
    conn = sqlite3.connect('terrafusionsync_real.db')
    cursor = conn.cursor()
    
    print("="*80)
    print("🏠 REAL BENTON COUNTY PROPERTY DATA SAMPLE")
    print("="*80)
    
    # Get total count and average value
    cursor.execute('SELECT COUNT(*) FROM properties')
    total_properties = cursor.fetchone()[0]
    
    cursor.execute('SELECT AVG(assessed_value) FROM properties WHERE assessed_value > 0')
    avg_value = cursor.fetchone()[0]
    
    print(f"Total Properties: {total_properties:,}")
    print(f"Average Assessed Value: ${avg_value:,.2f}")
    print("\nSAMPLE PROPERTIES:")
    print("-" * 80)
    
    # Show sample properties
    cursor.execute('''
        SELECT prop_id, market_value, assessed_value, appraised_value 
        FROM properties 
        WHERE assessed_value > 0 
        ORDER BY assessed_value DESC 
        LIMIT 10
    ''')
    
    properties = cursor.fetchall()
    for prop in properties:
        prop_id, market_val, assessed_val, appraised_val = prop
        print(f"Property {prop_id}: Market=${market_val:,} | Assessed=${assessed_val:,} | Appraised=${appraised_val:,}")
    
    print("\nREAL ADDRESSES SAMPLE:")
    print("-" * 80)
    
    # Show sample addresses
    cursor.execute('''
        SELECT p.prop_id, pa.situs_num, pa.situs_street, pa.situs_city, p.assessed_value
        FROM properties p
        JOIN property_addresses pa ON p.prop_id = pa.prop_id
        WHERE p.assessed_value > 100000
        ORDER BY p.assessed_value DESC
        LIMIT 5
    ''')
    
    addresses = cursor.fetchall()
    for addr in addresses:
        prop_id, num, street, city, value = addr
        print(f"{num} {street}, {city} - ${value:,}")
    
    print(f"\n✅ THIS IS REAL BENTON COUNTY DATA WITH {total_properties:,} PROPERTIES!")
    print("❌ Your applications should show THIS data, not zeros and errors!")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}") 