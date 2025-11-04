#!/usr/bin/env python3
"""
TerraFusionSync Real Data Importer
Import actual Benton County PACS data from CSV files into TerraFusionSync
"""

import os
import sys
import csv
import sqlite3
import pandas as pd
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BentonRealDataImporter:
    def __init__(self):
        self.data_dir = Path("../data/benton_ftp")
        self.db_path = "terrafusionsync_real.db"
        self.conn = None
        self.stats = {
            'properties_imported': 0,
            'permits_imported': 0,
            'sales_imported': 0,
            'addresses_imported': 0,
            'improvements_imported': 0
        }
    
    def setup_database(self):
        """Create TerraFusionSync database with real data schema"""
        logger.info("🗃️ Setting up TerraFusionSync database for real data...")
        
        self.conn = sqlite3.connect(self.db_path)
        cursor = self.conn.cursor()
        
        # Create main tables for real PACS data
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS properties (
                prop_id INTEGER PRIMARY KEY,
                geo_id TEXT,
                market_value REAL,
                appraised_value REAL,
                assessed_value REAL,
                property_use_code TEXT,
                property_use_desc TEXT,
                hood_code TEXT,
                legal_acreage REAL,
                prop_type_cd TEXT,
                image_path TEXT,
                is_active INTEGER,
                import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS property_addresses (
                prop_id INTEGER,
                situs_num TEXT,
                situs_street TEXT,
                situs_city TEXT,
                situs_state TEXT,
                situs_zip TEXT,
                situs_display TEXT,
                FOREIGN KEY (prop_id) REFERENCES properties (prop_id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS building_permits (
                prop_id INTEGER,
                permit_id INTEGER,
                permit_num TEXT,
                permit_type_cd TEXT,
                permit_desc TEXT,
                issue_date TEXT,
                permit_value REAL,
                permit_status TEXT,
                permit_active TEXT,
                file_as_name TEXT,
                permit_comment TEXT,
                FOREIGN KEY (prop_id) REFERENCES properties (prop_id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sales_data (
                prop_id INTEGER,
                sale_date TEXT,
                sale_price REAL,
                deed_date TEXT,
                deed_book_id TEXT,
                deed_page TEXT,
                FOREIGN KEY (prop_id) REFERENCES properties (prop_id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS improvements (
                prop_id INTEGER,
                imprv_id INTEGER,
                imprv_type_cd TEXT,
                year_built INTEGER,
                living_area REAL,
                total_area REAL,
                quality_cd TEXT,
                condition_cd TEXT,
                FOREIGN KEY (prop_id) REFERENCES properties (prop_id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS import_log (
                table_name TEXT,
                records_imported INTEGER,
                import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                file_size_mb REAL,
                status TEXT
            )
        """)
        
        self.conn.commit()
        logger.info("✅ Database schema created successfully")
    
    def import_properties(self):
        """Import property valuations from property_val.csv"""
        logger.info("🏠 Importing property valuations...")
        
        property_file = self.data_dir / "property_val.csv"
        if not property_file.exists():
            logger.error(f"Property file not found: {property_file}")
            return
        
        cursor = self.conn.cursor()
        imported_count = 0
        
        with open(property_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    cursor.execute("""
                        INSERT OR REPLACE INTO properties 
                        (prop_id, geo_id, market_value, appraised_value, assessed_value,
                         property_use_code, property_use_desc, hood_code, legal_acreage,
                         prop_type_cd, image_path, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        int(row.get('prop_id', 0)) if row.get('prop_id') else None,
                        row.get('geo_id', ''),
                        float(row.get('market', 0)) if row.get('market') else 0,
                        float(row.get('appraised_val', 0)) if row.get('appraised_val') else 0,
                        float(row.get('assessed_val', 0)) if row.get('assessed_val') else 0,
                        row.get('property_use_cd', ''),
                        row.get('property_use_desc', ''),
                        row.get('hood_cd', ''),
                        float(row.get('legal_acreage', 0)) if row.get('legal_acreage') else 0,
                        row.get('prop_type_cd', ''),
                        row.get('image_path', ''),
                        int(row.get('isactive', 1)) if row.get('isactive') else 1
                    ))
                    imported_count += 1
                    
                    if imported_count % 1000 == 0:
                        logger.info(f"  📊 Imported {imported_count:,} properties...")
                        
                except Exception as e:
                    logger.warning(f"Error importing property row: {e}")
                    continue
        
        self.conn.commit()
        self.stats['properties_imported'] = imported_count
        
        # Log import statistics
        file_size_mb = property_file.stat().st_size / (1024 * 1024)
        cursor.execute("""
            INSERT INTO import_log (table_name, records_imported, file_size_mb, status)
            VALUES (?, ?, ?, ?)
        """, ('properties', imported_count, file_size_mb, 'completed'))
        self.conn.commit()
        
        logger.info(f"✅ Imported {imported_count:,} properties ({file_size_mb:.1f} MB)")
    
    def import_addresses(self):
        """Import property addresses from situs.csv"""
        logger.info("📍 Importing property addresses...")
        
        situs_file = self.data_dir / "situs.csv"
        if not situs_file.exists():
            logger.error(f"Situs file not found: {situs_file}")
            return
        
        cursor = self.conn.cursor()
        imported_count = 0
        
        with open(situs_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    cursor.execute("""
                        INSERT OR REPLACE INTO property_addresses 
                        (prop_id, situs_num, situs_street, situs_city, situs_state, 
                         situs_zip, situs_display)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        int(row.get('prop_id', 0)) if row.get('prop_id') else None,
                        row.get('situs_num', ''),
                        row.get('situs_street', ''),
                        row.get('situs_city', ''),
                        row.get('situs_state', ''),
                        row.get('situs_zip', ''),
                        row.get('situs_display', '')
                    ))
                    imported_count += 1
                    
                except Exception as e:
                    logger.warning(f"Error importing address row: {e}")
                    continue
        
        self.conn.commit()
        self.stats['addresses_imported'] = imported_count
        logger.info(f"✅ Imported {imported_count:,} property addresses")
    
    def import_permits(self):
        """Import building permits from permits.csv"""
        logger.info("🏗️ Importing building permits...")
        
        permits_file = self.data_dir / "permits.csv"
        if not permits_file.exists():
            logger.error(f"Permits file not found: {permits_file}")
            return
        
        cursor = self.conn.cursor()
        imported_count = 0
        
        with open(permits_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    cursor.execute("""
                        INSERT OR REPLACE INTO building_permits 
                        (prop_id, permit_id, permit_num, permit_type_cd, permit_desc,
                         issue_date, permit_value, permit_status, permit_active,
                         file_as_name, permit_comment)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        int(row.get('prop_id', 0)) if row.get('prop_id') else None,
                        int(row.get('bldg_permit_id', 0)) if row.get('bldg_permit_id') else None,
                        row.get('bldg_permit_num', ''),
                        row.get('bldg_permit_type_cd', ''),
                        row.get('bld_permit_desc', ''),
                        row.get('bldg_permit_issue_dt', ''),
                        float(row.get('bldg_permit_val', 0)) if row.get('bldg_permit_val') else 0,
                        row.get('bldg_permit_status', ''),
                        row.get('bldg_permit_active', ''),
                        row.get('file_as_name', ''),
                        row.get('bldg_permit_cmnt', '')
                    ))
                    imported_count += 1
                    
                except Exception as e:
                    logger.warning(f"Error importing permit row: {e}")
                    continue
        
        self.conn.commit()
        self.stats['permits_imported'] = imported_count
        logger.info(f"✅ Imported {imported_count:,} building permits")
    
    def import_improvements(self):
        """Import improvement details from imprv_detail.csv"""
        logger.info("🏘️ Importing improvement details...")
        
        imprv_file = self.data_dir / "imprv_detail.csv"
        if not imprv_file.exists():
            logger.error(f"Improvements file not found: {imprv_file}")
            return
        
        cursor = self.conn.cursor()
        imported_count = 0
        
        # Read with pandas to handle large file efficiently
        try:
            df = pd.read_csv(imprv_file, encoding='utf-8', low_memory=False, nrows=10000)  # Limit to first 10k for demo
            
            for _, row in df.iterrows():
                try:
                    cursor.execute("""
                        INSERT OR REPLACE INTO improvements 
                        (prop_id, imprv_id, imprv_type_cd, year_built, living_area,
                         total_area, quality_cd, condition_cd)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        int(row.get('prop_id', 0)) if pd.notna(row.get('prop_id')) else None,
                        int(row.get('imprv_id', 0)) if pd.notna(row.get('imprv_id')) else None,
                        str(row.get('imprv_type_cd', '')),
                        int(row.get('yr_blt', 0)) if pd.notna(row.get('yr_blt')) else None,
                        float(row.get('living_area', 0)) if pd.notna(row.get('living_area')) else 0,
                        float(row.get('total_area', 0)) if pd.notna(row.get('total_area')) else 0,
                        str(row.get('quality_cd', '')),
                        str(row.get('condition_cd', ''))
                    ))
                    imported_count += 1
                    
                except Exception as e:
                    logger.warning(f"Error importing improvement row: {e}")
                    continue
            
            self.conn.commit()
            self.stats['improvements_imported'] = imported_count
            logger.info(f"✅ Imported {imported_count:,} improvement records")
            
        except Exception as e:
            logger.error(f"Error reading improvements file: {e}")
    
    def generate_sync_summary(self):
        """Generate summary of imported real data"""
        cursor = self.conn.cursor()
        
        # Get property statistics
        cursor.execute("SELECT COUNT(*) FROM properties WHERE is_active = 1")
        active_properties = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(market_value) FROM properties WHERE is_active = 1")
        total_market_value = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(DISTINCT hood_code) FROM properties WHERE hood_code != ''")
        neighborhoods = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM building_permits WHERE permit_active = 'T'")
        active_permits = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM building_permits 
            WHERE issue_date LIKE '2025%' AND permit_active = 'T'
        """)
        recent_permits = cursor.fetchone()[0]
        
        return {
            'active_properties': active_properties,
            'total_market_value': total_market_value,
            'neighborhoods': neighborhoods,
            'active_permits': active_permits,
            'recent_permits_2025': recent_permits,
            'import_stats': self.stats
        }
    
    def run_import(self):
        """Execute complete real data import process"""
        logger.info("🚀 Starting Benton County Real Data Import for TerraFusionSync")
        logger.info("=" * 60)
        
        start_time = datetime.now()
        
        try:
            # Setup database
            self.setup_database()
            
            # Import all data tables
            self.import_properties()
            self.import_addresses()
            self.import_permits()
            self.import_improvements()
            
            # Generate summary
            summary = self.generate_sync_summary()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info("=" * 60)
            logger.info("🎉 REAL DATA IMPORT COMPLETED!")
            logger.info(f"📊 Import Summary:")
            logger.info(f"   • Active Properties: {summary['active_properties']:,}")
            logger.info(f"   • Total Market Value: ${summary['total_market_value']:,.0f}")
            logger.info(f"   • Neighborhoods: {summary['neighborhoods']}")
            logger.info(f"   • Active Permits: {summary['active_permits']}")
            logger.info(f"   • 2025 Permits: {summary['recent_permits_2025']}")
            logger.info(f"⏱️ Import Duration: {duration}")
            logger.info(f"💾 Database: {self.db_path}")
            
            return summary
            
        except Exception as e:
            logger.error(f"❌ Import failed: {e}")
            raise
        
        finally:
            if self.conn:
                self.conn.close()

def main():
    """Main execution function"""
    importer = BentonRealDataImporter()
    summary = importer.run_import()
    
    print("\n🌟 TerraFusionSync is now ready with REAL Benton County data!")
    print(f"📈 {summary['active_properties']:,} real properties imported")
    print(f"💰 ${summary['total_market_value']:,.0f} in total market value")
    print(f"📅 {summary['recent_permits_2025']} permits from 2025")
    
    return summary

if __name__ == "__main__":
    main() 