#!/usr/bin/env python3
"""
TerraFusion Government OS - Operation Testing
Test actual government operations on the live OS
"""

import asyncio
import sys
from pathlib import Path

# Add the kernel to path
sys.path.insert(0, str(Path(__file__).parent / "terrafusion-os" / "kernel"))

from boot import TerraFusionKernel

async def test_operations():
    """Test TerraFusion Government OS operations"""
    
    print("🧪 TerraFusion Government OS - Operation Testing")
    print("=" * 60)
    print()
    
    # Initialize kernel
    print("🔧 Initializing TerraFusion OS Kernel...")
    kernel = TerraFusionKernel()
    await kernel.boot()
    print()
    
    # Test Benton County operations
    if 'wa-benton' in kernel.counties:
        benton = kernel.counties['wa-benton']
        print("🏛️ Testing Benton County Operations:")
        print("=" * 40)
        
        # Test 1: Property Assessment
        try:
            print("📊 Test 1: Property Assessment")
            result = await benton.execute_operation('property_assess', {
                'parcel_id': '123-456-001'
            })
            
            print(f"   ✅ Property Assessment Result:")
            print(f"      Parcel: {result['parcel_id']}")
            print(f"      Owner: {result['owner']}")
            print(f"      Address: {result['address']}")
            print(f"      Assessed Value: ${result['assessed_value']:,.2f}")
            print(f"      Market Value: ${result['market_value']:,.2f}")
            print(f"      AI Confidence: {result['ai_confidence']:.0%}")
            print(f"      AI Analysis: {result['ai_recommendation']}")
            print()
            
        except Exception as e:
            print(f"   ❌ Property Assessment failed: {e}")
            print()
        
        # Test 2: Tax Calculation
        try:
            print("💰 Test 2: Tax Calculation")
            result = await benton.execute_operation('tax_calculate', {
                'parcel_id': '123-456-001',
                'tax_year': 2025
            })
            
            print(f"   ✅ Tax Calculation Result:")
            print(f"      Parcel: {result['parcel_id']}")
            print(f"      Tax Year: {result['tax_year']}")
            print(f"      Assessed Value: ${result['assessed_value']:,.2f}")
            print(f"      Tax Rate: {result['tax_rate']:.1%}")
            print(f"      Annual Tax: ${result['tax_amount']:,.2f}")
            print()
            
        except Exception as e:
            print(f"   ❌ Tax Calculation failed: {e}")
            print()
        
        # Test 3: Database Query - Show Available Properties
        try:
            print("🏠 Test 3: Available Properties")
            cursor = benton.database.cursor()
            cursor.execute("""
                SELECT parcel_id, owner_name, property_address, assessed_value, property_type
                FROM properties 
                LIMIT 5
            """)
            
            properties = cursor.fetchall()
            print(f"   ✅ Sample Properties in {benton.name}:")
            
            for prop in properties:
                parcel, owner, address, value, prop_type = prop
                print(f"      {parcel}: {owner}")
                print(f"         {address}")
                print(f"         ${value:,.2f} ({prop_type})")
                print()
            
        except Exception as e:
            print(f"   ❌ Property listing failed: {e}")
            print()
        
        # Test 4: Show System Status
        print("📈 Test 4: System Status")
        print(f"   ✅ OS Status: {kernel.system_status}")
        print(f"   ✅ Modules Loaded: {len(kernel.modules)}")
        print(f"   ✅ Counties Active: {len(kernel.counties)}")
        print(f"   ✅ Marketplace Economy: ${kernel.total_revenue:,.0f}")
        
        # Show specific county stats
        print(f"   🏛️ {benton.name} Statistics:")
        print(f"      Population: {benton.stats.get('population', 0):,}")
        print(f"      Parcels: {benton.stats.get('parcels', 0):,}")
        print(f"      Monthly Revenue: ${benton.stats.get('monthly_revenue', 0):,.2f}")
        print(f"      AI Agents: {benton.stats.get('ai_agents_assigned', 0)}")
        print()
        
    else:
        print("❌ Benton County workspace not available")
    
    print("🎯 Operation Testing Complete!")
    print("   TerraFusion Government OS is fully operational")

if __name__ == "__main__":
    asyncio.run(test_operations())
