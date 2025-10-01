#!/usr/bin/env python3
"""
Generate realistic Benton County, WA dataset with 89,447 parcels
Based on real county demographics and property distributions
"""

import sqlite3
import random
import json
from datetime import datetime, timedelta
from pathlib import Path
import asyncio

class BentonCountyDataGenerator:
    """Generate realistic Benton County property database"""
    
    def __init__(self):
        self.total_parcels = 89447  # Real Benton County parcel count
        self.db_path = Path("data/benton-county/legacy/benton_legacy.db")
        
        # Real Benton County cities with population percentages
        self.cities = {
            "Kennewick": 0.45,    # 78,000 people - largest city
            "Richland": 0.32,     # 55,000 people  
            "Pasco": 0.18,        # 31,000 people
            "West Richland": 0.08, # 14,000 people
            "Benton City": 0.02,  # 3,500 people
            "Prosser": 0.03,      # 5,500 people
            "Unincorporated": 0.12 # Rural/unincorporated areas
        }
        
        # Property type distributions (realistic for Benton County)
        self.property_types = {
            "110": {"desc": "Single Family Residential", "pct": 0.72, "avg_value": 425000},
            "120": {"desc": "Condominium", "pct": 0.05, "avg_value": 285000},
            "130": {"desc": "Townhouse", "pct": 0.03, "avg_value": 325000},
            "140": {"desc": "Multi-Family 2-4 Units", "pct": 0.02, "avg_value": 680000},
            "150": {"desc": "Apartment Complex", "pct": 0.01, "avg_value": 2100000},
            "210": {"desc": "Mobile Home", "pct": 0.04, "avg_value": 125000},
            "310": {"desc": "Vacant Residential", "pct": 0.08, "avg_value": 165000},
            "400": {"desc": "Agricultural", "pct": 0.03, "avg_value": 850000},
            "500": {"desc": "Commercial Retail", "pct": 0.015, "avg_value": 1250000},
            "600": {"desc": "Industrial", "pct": 0.005, "avg_value": 1850000}
        }
        
        # ZIP codes for each city
        self.zip_codes = {
            "Kennewick": ["99336", "99337", "99338"],
            "Richland": ["99352", "99354"],
            "Pasco": ["99301"],
            "West Richland": ["99353"],
            "Benton City": ["99320"],
            "Prosser": ["99350"],
            "Unincorporated": ["99320", "99337", "99350"]
        }
        
        # Street name prefixes and suffixes for realistic addresses
        self.street_prefixes = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"]
        self.street_names = [
            "Washington", "Columbia", "Kennewick", "Canal", "10th", "4th", "Clearwater",
            "Duportail", "Gage", "Edison", "Union", "Yakima", "Lewis", "Jadwin",
            "George Washington Way", "Columbia Center", "Court", "Road 68", "Bombing Range",
            "Stevens", "Van Giesen", "27th", "Quinault", "Dallas", "Metaline", "Entiat",
            "Okanogan", "Underwood", "Badger", "Finley", "Hover", "Chapel Hill", "Keene"
        ]
        self.street_suffixes = ["Ave", "St", "Blvd", "Way", "Dr", "Ct", "Pl", "Rd", "Ln"]
    
    async def generate_full_dataset(self):
        """Generate complete Benton County dataset"""
        print("╔══════════════════════════════════════════════════════════╗")
        print("║     Generating Benton County, WA Complete Dataset       ║") 
        print("║              89,447 Realistic Parcels                   ║")
        print("╚══════════════════════════════════════════════════════════╝")
        print()
        
        # Ensure directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create database and schema
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        print("📊 Creating database schema...")
        await self.create_schema(cursor)
        
        print(f"🏠 Generating {self.total_parcels:,} property records...")
        await self.generate_parcels(cursor)
        
        print("📋 Generating assessments and tax bills...")
        await self.generate_assessments_and_taxes(cursor)
        
        print("🏗️ Generating building permits...")
        await self.generate_permits(cursor)
        
        conn.commit()
        conn.close()
        
        # Show statistics
        await self.show_statistics()
        
        print("✅ Benton County complete dataset generated!")
    
    async def create_schema(self, cursor):
        """Create Harris PACS compatible schema"""
        
        # PARCELS table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS PARCELS (
                PARCEL_ID TEXT PRIMARY KEY,
                PARCEL_NUMBER TEXT NOT NULL,
                SITUS_ADDRESS TEXT,
                SITUS_CITY TEXT,
                SITUS_STATE TEXT DEFAULT 'WA',
                SITUS_ZIP TEXT,
                LEGAL_DESCRIPTION TEXT,
                OWNER1_NAME TEXT,
                OWNER2_NAME TEXT,
                OWNER_ADDRESS TEXT,
                OWNER_CITY TEXT,
                OWNER_STATE TEXT,
                OWNER_ZIP TEXT,
                LAND_AREA REAL,
                LAND_UNITS TEXT DEFAULT 'SQFT',
                ZONING TEXT,
                USE_CODE TEXT,
                USE_DESCRIPTION TEXT,
                YEAR_BUILT INTEGER,
                BUILDING_SQFT REAL,
                TOTAL_MARKET_VALUE REAL,
                LAND_VALUE REAL,
                IMPROVEMENT_VALUE REAL,
                ASSESSED_VALUE REAL,
                TAX_YEAR INTEGER DEFAULT 2025,
                CREATED_DATE TEXT,
                MODIFIED_DATE TEXT
            )
        ''')
        
        # ASSESSMENTS table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ASSESSMENTS (
                ASSESSMENT_ID TEXT PRIMARY KEY,
                PARCEL_ID TEXT,
                TAX_YEAR INTEGER,
                ASSESSMENT_DATE TEXT,
                ASSESSOR_NAME TEXT DEFAULT 'BENTON COUNTY ASSESSOR',
                LAND_VALUE REAL,
                IMPROVEMENT_VALUE REAL,
                TOTAL_VALUE REAL,
                ASSESSED_VALUE REAL,
                EXEMPTIONS REAL DEFAULT 0,
                STATUS TEXT DEFAULT 'ACTIVE',
                NOTES TEXT,
                FOREIGN KEY (PARCEL_ID) REFERENCES PARCELS(PARCEL_ID)
            )
        ''')
        
        # TAX_BILLS table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS TAX_BILLS (
                BILL_ID TEXT PRIMARY KEY,
                PARCEL_ID TEXT,
                TAX_YEAR INTEGER,
                BILL_DATE TEXT,
                DUE_DATE TEXT,
                TOTAL_TAX REAL,
                COUNTY_TAX REAL,
                CITY_TAX REAL,
                SCHOOL_TAX REAL,
                FIRE_DISTRICT_TAX REAL,
                SPECIAL_ASSESSMENTS REAL DEFAULT 0,
                PAID_AMOUNT REAL DEFAULT 0,
                PAYMENT_DATE TEXT,
                STATUS TEXT DEFAULT 'UNPAID',
                PENALTY REAL DEFAULT 0,
                INTEREST REAL DEFAULT 0,
                FOREIGN KEY (PARCEL_ID) REFERENCES PARCELS(PARCEL_ID)
            )
        ''')
        
        # PERMITS table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS PERMITS (
                PERMIT_ID TEXT PRIMARY KEY,
                PARCEL_ID TEXT,
                PERMIT_NUMBER TEXT,
                PERMIT_TYPE TEXT,
                PERMIT_DESCRIPTION TEXT,
                APPLICANT_NAME TEXT,
                CONTRACTOR_NAME TEXT,
                CONTRACTOR_LICENSE TEXT,
                APPLICATION_DATE TEXT,
                ISSUED_DATE TEXT,
                FINAL_DATE TEXT,
                STATUS TEXT,
                VALUATION REAL,
                PERMIT_FEE REAL,
                SQUARE_FOOTAGE REAL,
                NOTES TEXT,
                FOREIGN KEY (PARCEL_ID) REFERENCES PARCELS(PARCEL_ID)
            )
        ''')
        
        # OWNERSHIP table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS OWNERSHIP (
                OWNERSHIP_ID TEXT PRIMARY KEY,
                PARCEL_ID TEXT,
                OWNER_TYPE TEXT,
                OWNER_NAME TEXT,
                OWNER_PERCENTAGE REAL DEFAULT 100.0,
                ACQUISITION_DATE TEXT,
                DEED_TYPE TEXT,
                DEED_BOOK TEXT,
                DEED_PAGE TEXT,
                DOCUMENT_NUMBER TEXT,
                FOREIGN KEY (PARCEL_ID) REFERENCES PARCELS(PARCEL_ID)
            )
        ''')
    
    async def generate_parcels(self, cursor):
        """Generate all 89,447 parcels with realistic data"""
        
        parcels_generated = 0
        batch_size = 1000
        
        # Calculate parcel distribution by city
        city_parcels = {}
        for city, percentage in self.cities.items():
            city_parcels[city] = int(self.total_parcels * percentage)
        
        # Adjust for rounding
        total_allocated = sum(city_parcels.values())
        if total_allocated != self.total_parcels:
            city_parcels["Kennewick"] += (self.total_parcels - total_allocated)
        
        # Generate parcels for each city
        for city, parcel_count in city_parcels.items():
            print(f"   🏛️ {city}: {parcel_count:,} parcels")
            
            batch_data = []
            
            for i in range(parcel_count):
                parcel = await self.generate_single_parcel(city, parcels_generated + i + 1)
                batch_data.append(parcel)
                
                # Insert in batches for performance
                if len(batch_data) >= batch_size:
                    await self.insert_parcel_batch(cursor, batch_data)
                    batch_data = []
                    
                    # Progress indicator
                    if (parcels_generated + len(batch_data)) % 10000 == 0:
                        print(f"      Progress: {parcels_generated + len(batch_data):,}/{self.total_parcels:,}")
            
            # Insert remaining batch
            if batch_data:
                await self.insert_parcel_batch(cursor, batch_data)
            
            parcels_generated += parcel_count
        
        print(f"   ✅ Generated {parcels_generated:,} total parcels")
    
    async def generate_single_parcel(self, city, parcel_num):
        """Generate a single realistic parcel"""
        
        # Generate parcel ID (township-range-section format used in WA)
        township = random.randint(8, 12)  # T8N to T12N
        range_num = random.randint(27, 31)  # R27E to R31E  
        section = random.randint(1, 36)
        parcel_id = f"{township:02d}{range_num:02d}{section:02d}{parcel_num:03d}"
        
        # Select property type
        use_code = self.weighted_choice(self.property_types)
        property_info = self.property_types[use_code]
        
        # Generate address
        street_num = random.randint(100, 9999)
        street_prefix = random.choice(self.street_prefixes) if random.random() < 0.3 else ""
        street_name = random.choice(self.street_names)
        street_suffix = random.choice(self.street_suffixes)
        
        if street_prefix:
            address = f"{street_num} {street_prefix} {street_name} {street_suffix}"
        else:
            address = f"{street_num} {street_name} {street_suffix}"
        
        # Select ZIP code for city
        zip_code = random.choice(self.zip_codes[city])
        
        # Generate property values with realistic variation
        base_value = property_info["avg_value"]
        market_value = base_value * random.uniform(0.6, 1.8)  # ±40% variation
        
        # Calculate land vs improvement split
        if use_code in ["310", "400"]:  # Vacant or Agricultural
            land_value = market_value * 0.95
            improvement_value = market_value * 0.05
        else:
            land_value = market_value * random.uniform(0.25, 0.45)
            improvement_value = market_value - land_value
        
        # Generate other characteristics
        year_built = None
        building_sqft = None
        if use_code not in ["310", "400"]:  # Not vacant or ag
            if use_code == "110":  # Single family
                year_built = random.randint(1950, 2024)
                building_sqft = random.randint(800, 4500)
            elif use_code in ["120", "130"]:  # Condo/townhouse
                year_built = random.randint(1970, 2024)
                building_sqft = random.randint(600, 2200)
            elif use_code in ["140", "150"]:  # Multi-family
                year_built = random.randint(1960, 2020)
                building_sqft = random.randint(2000, 15000)
            elif use_code == "210":  # Mobile home
                year_built = random.randint(1980, 2020)
                building_sqft = random.randint(600, 1400)
            else:  # Commercial/Industrial
                year_built = random.randint(1970, 2020)
                building_sqft = random.randint(1000, 50000)
        
        # Land area
        if use_code == "400":  # Agricultural
            land_area = random.randint(217800, 2178000)  # 5-50 acres
        elif use_code in ["500", "600"]:  # Commercial/Industrial
            land_area = random.randint(21780, 217800)  # 0.5-5 acres
        else:  # Residential
            land_area = random.randint(4000, 15000)  # Typical residential lots
        
        # Generate owner name
        owner_name = self.generate_owner_name(use_code)
        
        # Generate zoning
        zoning = self.get_zoning_for_use_code(use_code)
        
        # Legal description
        legal_desc = f"LOT {random.randint(1, 20)} BLK {random.randint(1, 15)} {city.upper()} SUBDIVISION {random.randint(1, 50)}"
        
        return {
            'parcel_id': parcel_id,
            'parcel_number': parcel_id,
            'situs_address': address,
            'situs_city': city,
            'situs_state': 'WA',
            'situs_zip': zip_code,
            'legal_description': legal_desc,
            'owner1_name': owner_name,
            'owner_address': address if random.random() < 0.7 else self.generate_different_address(),
            'owner_city': city if random.random() < 0.8 else random.choice(list(self.cities.keys())),
            'owner_state': 'WA' if random.random() < 0.9 else random.choice(['OR', 'ID', 'CA', 'TX']),
            'owner_zip': zip_code,
            'land_area': land_area,
            'zoning': zoning,
            'use_code': use_code,
            'use_description': property_info['desc'],
            'year_built': year_built,
            'building_sqft': building_sqft,
            'total_market_value': round(market_value, 0),
            'land_value': round(land_value, 0),
            'improvement_value': round(improvement_value, 0),
            'assessed_value': round(market_value, 0),  # WA uses 100% assessment ratio
            'created_date': '2025-01-01',
            'modified_date': datetime.now().strftime('%Y-%m-%d')
        }
    
    def weighted_choice(self, choices):
        """Select item based on weighted percentages"""
        total = sum(item['pct'] for item in choices.values())
        r = random.uniform(0, total)
        upto = 0
        for choice, data in choices.items():
            if upto + data['pct'] >= r:
                return choice
            upto += data['pct']
        return list(choices.keys())[0]  # fallback
    
    def generate_owner_name(self, use_code):
        """Generate realistic owner names based on property type"""
        
        first_names = ["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Mary", 
                      "James", "Jennifer", "William", "Patricia", "Richard", "Linda", "Thomas", "Susan"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                     "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas"]
        
        if use_code in ["500", "600", "150"]:  # Commercial/Industrial/Large multifamily
            company_types = ["LLC", "INC", "CORP", "LP", "PROPERTIES", "DEVELOPMENT", "INVESTMENTS"]
            company_names = ["TRI-CITIES", "COLUMBIA", "HANFORD", "RIVER", "VALLEY", "NORTHWEST", "PACIFIC"]
            return f"{random.choice(company_names)} {random.choice(company_types)}"
        else:
            if random.random() < 0.6:  # Joint ownership
                return f"{random.choice(last_names)}, {random.choice(first_names)} & {random.choice(first_names)}"
            else:
                return f"{random.choice(last_names)}, {random.choice(first_names)}"
    
    def generate_different_address(self):
        """Generate different owner address (for non-owner occupied)"""
        street_num = random.randint(100, 9999)
        street_name = random.choice(self.street_names)
        street_suffix = random.choice(self.street_suffixes)
        return f"{street_num} {street_name} {street_suffix}"
    
    def get_zoning_for_use_code(self, use_code):
        """Get appropriate zoning for use code"""
        zoning_map = {
            "110": "R-1",    # Single family
            "120": "R-2",    # Condo  
            "130": "R-2",    # Townhouse
            "140": "R-3",    # Small multifamily
            "150": "R-4",    # Large multifamily
            "210": "MH",     # Mobile home
            "310": "R-1",    # Vacant residential
            "400": "AG",     # Agricultural
            "500": "C-1",    # Commercial
            "600": "I-1"     # Industrial
        }
        return zoning_map.get(use_code, "R-1")
    
    async def insert_parcel_batch(self, cursor, batch_data):
        """Insert batch of parcels efficiently"""
        
        cursor.executemany('''
            INSERT INTO PARCELS (
                PARCEL_ID, PARCEL_NUMBER, SITUS_ADDRESS, SITUS_CITY, SITUS_STATE, SITUS_ZIP,
                LEGAL_DESCRIPTION, OWNER1_NAME, OWNER_ADDRESS, OWNER_CITY, OWNER_STATE, OWNER_ZIP,
                LAND_AREA, LAND_UNITS, ZONING, USE_CODE, USE_DESCRIPTION, YEAR_BUILT, BUILDING_SQFT,
                TOTAL_MARKET_VALUE, LAND_VALUE, IMPROVEMENT_VALUE, ASSESSED_VALUE, TAX_YEAR,
                CREATED_DATE, MODIFIED_DATE
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', [
            (
                p['parcel_id'], p['parcel_number'], p['situs_address'], p['situs_city'], 
                p['situs_state'], p['situs_zip'], p['legal_description'], p['owner1_name'],
                p['owner_address'], p['owner_city'], p['owner_state'], p['owner_zip'],
                p['land_area'], 'SQFT', p['zoning'], p['use_code'], p['use_description'],
                p['year_built'], p['building_sqft'], p['total_market_value'], p['land_value'],
                p['improvement_value'], p['assessed_value'], 2025, p['created_date'], p['modified_date']
            ) for p in batch_data
        ])
    
    async def generate_assessments_and_taxes(self, cursor):
        """Generate assessments and tax bills for all parcels"""
        
        # Get all parcel IDs
        cursor.execute("SELECT PARCEL_ID, ASSESSED_VALUE FROM PARCELS")
        parcels = cursor.fetchall()
        
        print(f"   📋 Generating assessments for {len(parcels):,} parcels...")
        
        assessment_data = []
        tax_data = []
        
        # Tax rates for different jurisdictions (realistic for Benton County)
        base_tax_rate = 0.0124  # 1.24% effective rate
        
        for parcel_id, assessed_value in parcels:
            # Assessment record
            assessment_data.append((
                f"ASMT-{parcel_id}-2025",
                parcel_id,
                2025,
                "2025-01-01",
                "BENTON COUNTY ASSESSOR",
                assessed_value * 0.35,  # Land portion
                assessed_value * 0.65,  # Improvement portion
                assessed_value,
                assessed_value,
                0,  # Exemptions
                "ACTIVE",
                None
            ))
            
            # Tax bill
            total_tax = assessed_value * base_tax_rate
            county_tax = total_tax * 0.35
            city_tax = total_tax * 0.25
            school_tax = total_tax * 0.32
            fire_tax = total_tax * 0.08
            
            tax_data.append((
                f"TAX-{parcel_id}-2025",
                parcel_id,
                2025,
                "2025-02-01",
                "2025-04-30",
                round(total_tax, 2),
                round(county_tax, 2),
                round(city_tax, 2),
                round(school_tax, 2), 
                round(fire_tax, 2),
                0,  # Special assessments
                0,  # Paid amount
                None,  # Payment date
                "UNPAID",
                0,  # Penalty
                0   # Interest
            ))
        
        # Insert assessments
        cursor.executemany('''
            INSERT INTO ASSESSMENTS (
                ASSESSMENT_ID, PARCEL_ID, TAX_YEAR, ASSESSMENT_DATE, ASSESSOR_NAME,
                LAND_VALUE, IMPROVEMENT_VALUE, TOTAL_VALUE, ASSESSED_VALUE, EXEMPTIONS,
                STATUS, NOTES
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', assessment_data)
        
        # Insert tax bills
        cursor.executemany('''
            INSERT INTO TAX_BILLS (
                BILL_ID, PARCEL_ID, TAX_YEAR, BILL_DATE, DUE_DATE, TOTAL_TAX,
                COUNTY_TAX, CITY_TAX, SCHOOL_TAX, FIRE_DISTRICT_TAX, SPECIAL_ASSESSMENTS,
                PAID_AMOUNT, PAYMENT_DATE, STATUS, PENALTY, INTEREST
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', tax_data)
        
        print(f"   ✅ Generated {len(assessment_data):,} assessments and tax bills")
    
    async def generate_permits(self, cursor):
        """Generate building permits for subset of parcels"""
        
        # Get residential parcels that might have permits
        cursor.execute('''
            SELECT PARCEL_ID FROM PARCELS 
            WHERE USE_CODE IN ('110', '120', '130', '140', '500', '600')
            ORDER BY RANDOM()
            LIMIT 15000
        ''')
        
        permit_parcels = [row[0] for row in cursor.fetchall()]
        
        print(f"   🏗️ Generating permits for {len(permit_parcels):,} parcels...")
        
        permit_types = [
            "Single Family Dwelling", "Addition", "Remodel", "Deck", "Garage", 
            "Commercial Building", "Tenant Improvement", "Sign", "Demolition"
        ]
        
        permit_data = []
        
        for i, parcel_id in enumerate(permit_parcels):
            if random.random() < 0.3:  # 30% of parcels have permits
                permit_type = random.choice(permit_types)
                valuation = random.randint(5000, 250000)
                fee = valuation * 0.008  # 0.8% permit fee
                
                permit_data.append((
                    f"PRM-{parcel_id}-{i}",
                    parcel_id,
                    f"2024-{random.randint(1,12):02d}-{random.randint(1000,9999)}",
                    permit_type,
                    f"{permit_type} construction",
                    "PROPERTY OWNER",
                    "LICENSED CONTRACTOR",
                    f"LIC-{random.randint(10000,99999)}",
                    f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                    f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                    None,  # Final date
                    random.choice(["ISSUED", "FINALED", "PENDING"]),
                    valuation,
                    round(fee, 2),
                    random.randint(100, 5000) if permit_type != "Sign" else None,
                    None
                ))
        
        cursor.executemany('''
            INSERT INTO PERMITS (
                PERMIT_ID, PARCEL_ID, PERMIT_NUMBER, PERMIT_TYPE, PERMIT_DESCRIPTION,
                APPLICANT_NAME, CONTRACTOR_NAME, CONTRACTOR_LICENSE, APPLICATION_DATE,
                ISSUED_DATE, FINAL_DATE, STATUS, VALUATION, PERMIT_FEE, SQUARE_FOOTAGE, NOTES
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', permit_data)
        
        print(f"   ✅ Generated {len(permit_data):,} building permits")
    
    async def show_statistics(self):
        """Show dataset statistics"""
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        print("\n📊 Dataset Statistics:")
        print("=" * 50)
        
        # Parcel counts
        cursor.execute("SELECT COUNT(*) FROM PARCELS")
        total_parcels = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM ASSESSMENTS") 
        total_assessments = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM TAX_BILLS")
        total_tax_bills = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM PERMITS")
        total_permits = cursor.fetchone()[0]
        
        # Value statistics
        cursor.execute("SELECT SUM(ASSESSED_VALUE) FROM PARCELS")
        total_assessed_value = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(ASSESSED_VALUE) FROM PARCELS")
        avg_assessed_value = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(TOTAL_TAX) FROM TAX_BILLS")
        total_taxes = cursor.fetchone()[0]
        
        # Property type breakdown
        cursor.execute('''
            SELECT USE_DESCRIPTION, COUNT(*), AVG(ASSESSED_VALUE)
            FROM PARCELS 
            GROUP BY USE_DESCRIPTION
            ORDER BY COUNT(*) DESC
        ''')
        
        property_breakdown = cursor.fetchall()
        
        print(f"📋 Total Records:")
        print(f"   • Parcels: {total_parcels:,}")
        print(f"   • Assessments: {total_assessments:,}")
        print(f"   • Tax Bills: {total_tax_bills:,}")
        print(f"   • Permits: {total_permits:,}")
        print()
        
        print(f"💰 Financial Summary:")
        print(f"   • Total Assessed Value: ${total_assessed_value:,.0f}")
        print(f"   • Average Property Value: ${avg_assessed_value:,.0f}")
        print(f"   • Annual Tax Revenue: ${total_taxes:,.0f}")
        print()
        
        print(f"🏠 Property Type Breakdown:")
        for prop_type, count, avg_value in property_breakdown[:8]:
            pct = (count / total_parcels) * 100
            print(f"   • {prop_type}: {count:,} ({pct:.1f}%) - Avg: ${avg_value:,.0f}")
        
        # Database size
        db_size_mb = self.db_path.stat().st_size / (1024 * 1024)
        print(f"\n💾 Database Size: {db_size_mb:.1f} MB")
        
        conn.close()

async def main():
    """Generate the complete Benton County dataset"""
    generator = BentonCountyDataGenerator()
    await generator.generate_full_dataset()
    
    print("\n🎯 Benton County Complete Dataset Ready!")
    print("   Ready for TerraFusionSync integration")

if __name__ == "__main__":
    asyncio.run(main())
