#!/usr/bin/env python3
"""
🏛️ TerraAgent Elite Data Initialization
Championship-Level Sample Data Creation for Database Migration
MISSION: Initialize TerraAgent with Government-Grade Property Data
"""

import sqlite3
import json
from datetime import datetime, timedelta
import random


def create_terraagent_database():
    """Create TerraAgent database with championship-level sample data"""

    print("🏛️ TerraAgent Elite Data Initialization")
    print("=" * 50)

    # Connect to database
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()

    # Create Properties Table (matching app_enterprise.py structure)
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_id VARCHAR(50) UNIQUE NOT NULL,
            address VARCHAR(255) NOT NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(2) NOT NULL DEFAULT 'WA',
            zip_code VARCHAR(10) NOT NULL,
            neighborhood_code VARCHAR(20),
            assessed_value REAL,
            market_value REAL,
            land_value REAL,
            improvement_value REAL,
            year_built INTEGER,
            bedrooms INTEGER,
            bathrooms REAL,
            total_area REAL,
            property_class VARCHAR(50),
            owner_name VARCHAR(200),
            zoning VARCHAR(20),
            last_sale_date TIMESTAMP,
            last_sale_price REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    # Create Sync Jobs Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sync_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_name VARCHAR(100) NOT NULL,
            source_system VARCHAR(50) NOT NULL,
            target_system VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            records_processed INTEGER DEFAULT 0,
            last_run TIMESTAMP,
            next_run TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    # Create Query Logs Table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS query_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_text TEXT NOT NULL,
            query_type VARCHAR(50),
            response_text TEXT,
            response_time REAL,
            status VARCHAR(50),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    print("✅ Database tables created successfully")

    # Championship-Level Sample Properties (Benton County, WA)
    benton_properties = [
        {
            "parcel_id": "BC-2024-001",
            "address": "2505 Duportail Street",
            "city": "Richland",
            "zip_code": "99354",
            "neighborhood_code": "RIC-01",
            "assessed_value": 485000,
            "market_value": 520000,
            "land_value": 125000,
            "improvement_value": 360000,
            "year_built": 2018,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "total_area": 2450.0,
            "property_class": "RESIDENTIAL",
            "owner_name": "Anderson, Michael J.",
            "zoning": "R-2",
            "last_sale_price": 475000,
        },
        {
            "parcel_id": "BC-2024-002",
            "address": "1234 Hanford Street",
            "city": "Richland",
            "zip_code": "99354",
            "neighborhood_code": "RIC-02",
            "assessed_value": 620000,
            "market_value": 665000,
            "land_value": 150000,
            "improvement_value": 470000,
            "year_built": 2020,
            "bedrooms": 5,
            "bathrooms": 3.0,
            "total_area": 3100.0,
            "property_class": "RESIDENTIAL",
            "owner_name": "Chen, Sarah L.",
            "zoning": "R-2",
            "last_sale_price": 615000,
        },
        {
            "parcel_id": "BC-2024-003",
            "address": "789 Columbia River Drive",
            "city": "Richland",
            "zip_code": "99354",
            "neighborhood_code": "RIC-03",
            "assessed_value": 850000,
            "market_value": 920000,
            "land_value": 280000,
            "improvement_value": 570000,
            "year_built": 2019,
            "bedrooms": 6,
            "bathrooms": 4.0,
            "total_area": 4200.0,
            "property_class": "RESIDENTIAL",
            "owner_name": "Thompson, Robert & Jane",
            "zoning": "R-2",
            "last_sale_price": 825000,
        },
        {
            "parcel_id": "BC-2024-004",
            "address": "456 Prosser Industrial Way",
            "city": "Prosser",
            "zip_code": "99350",
            "neighborhood_code": "PRO-01",
            "assessed_value": 1250000,
            "market_value": 1350000,
            "land_value": 350000,
            "improvement_value": 900000,
            "year_built": 2017,
            "bedrooms": None,
            "bathrooms": None,
            "total_area": 15000.0,
            "property_class": "COMMERCIAL",
            "owner_name": "Benton Industrial LLC",
            "zoning": "I-1",
            "last_sale_price": 1200000,
        },
        {
            "parcel_id": "BC-2024-005",
            "address": "321 Kennewick Avenue",
            "city": "Kennewick",
            "zip_code": "99336",
            "neighborhood_code": "KEN-01",
            "assessed_value": 325000,
            "market_value": 350000,
            "land_value": 85000,
            "improvement_value": 240000,
            "year_built": 2015,
            "bedrooms": 3,
            "bathrooms": 2.0,
            "total_area": 1850.0,
            "property_class": "RESIDENTIAL",
            "owner_name": "Garcia, Maria E.",
            "zoning": "R-1",
            "last_sale_price": 315000,
        },
        {
            "parcel_id": "BC-2024-006",
            "address": "888 Wine Country Road",
            "city": "Prosser",
            "zip_code": "99350",
            "neighborhood_code": "PRO-02",
            "assessed_value": 1750000,
            "market_value": 1850000,
            "land_value": 950000,
            "improvement_value": 800000,
            "year_built": 2016,
            "bedrooms": 8,
            "bathrooms": 6.0,
            "total_area": 6500.0,
            "property_class": "RESIDENTIAL",
            "owner_name": "Washington Wine Estates",
            "zoning": "AG-2",
            "last_sale_price": 1695000,
        },
    ]

    print(f"🏗️ Inserting {len(benton_properties)} championship properties...")

    # Insert sample properties
    for prop in benton_properties:
        last_sale_date = datetime.now() - timedelta(days=random.randint(30, 365))

        cursor.execute(
            """
            INSERT INTO properties (
                parcel_id, address, city, state, zip_code, neighborhood_code,
                assessed_value, market_value, land_value, improvement_value,
                year_built, bedrooms, bathrooms, total_area, property_class,
                owner_name, zoning, last_sale_date, last_sale_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                prop["parcel_id"],
                prop["address"],
                prop["city"],
                "WA",
                prop["zip_code"],
                prop["neighborhood_code"],
                prop["assessed_value"],
                prop["market_value"],
                prop["land_value"],
                prop["improvement_value"],
                prop["year_built"],
                prop["bedrooms"],
                prop["bathrooms"],
                prop["total_area"],
                prop["property_class"],
                prop["owner_name"],
                prop["zoning"],
                last_sale_date,
                prop["last_sale_price"],
            ),
        )

    # Insert sample sync jobs
    sync_jobs = [
        {
            "job_name": "Benton County CAMA Sync",
            "source_system": "Harris PACS v12.4.7",
            "target_system": "TerraAgent",
            "status": "active",
            "records_processed": 1247,
        },
        {
            "job_name": "Property Assessment Updates",
            "source_system": "County Assessor",
            "target_system": "TerraAgent",
            "status": "active",
            "records_processed": 856,
        },
        {
            "job_name": "Market Data Integration",
            "source_system": "MLS Feed",
            "target_system": "TerraAgent",
            "status": "active",
            "records_processed": 423,
        },
    ]

    print(f"🔄 Inserting {len(sync_jobs)} sync jobs...")

    for job in sync_jobs:
        last_run = datetime.now() - timedelta(hours=random.randint(1, 24))
        next_run = datetime.now() + timedelta(hours=random.randint(1, 12))

        cursor.execute(
            """
            INSERT INTO sync_jobs (
                job_name, source_system, target_system, status,
                records_processed, last_run, next_run
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (
                job["job_name"],
                job["source_system"],
                job["target_system"],
                job["status"],
                job["records_processed"],
                last_run,
                next_run,
            ),
        )

    # Insert sample query logs
    query_logs = [
        {
            "query_text": 'SELECT * FROM properties WHERE city = "Richland"',
            "query_type": "SELECT",
            "response_text": "3 properties found in Richland",
            "response_time": 0.045,
            "status": "SUCCESS",
        },
        {
            "query_text": "Property assessment for BC-2024-001",
            "query_type": "ASSESSMENT",
            "response_text": "Assessed value: $485,000",
            "response_time": 0.023,
            "status": "SUCCESS",
        },
    ]

    print(f"📝 Inserting {len(query_logs)} query logs...")

    for log in query_logs:
        cursor.execute(
            """
            INSERT INTO query_logs (
                query_text, query_type, response_text, response_time, status
            ) VALUES (?, ?, ?, ?, ?)
        """,
            (
                log["query_text"],
                log["query_type"],
                log["response_text"],
                log["response_time"],
                log["status"],
            ),
        )

    # Commit changes
    conn.commit()

    # Verify data creation
    cursor.execute("SELECT COUNT(*) FROM properties")
    property_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM sync_jobs")
    sync_job_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM query_logs")
    query_log_count = cursor.fetchone()[0]

    conn.close()

    # Create summary report
    report = {
        "database": "app.db",
        "initialization_time": datetime.now().isoformat(),
        "tables_created": 3,
        "records_inserted": {
            "properties": property_count,
            "sync_jobs": sync_job_count,
            "query_logs": query_log_count,
        },
        "total_records": property_count + sync_job_count + query_log_count,
        "sample_property_data": [
            {
                "parcel_id": "BC-2024-001",
                "address": "2505 Duportail Street, Richland, WA",
                "assessed_value": 485000,
                "property_class": "RESIDENTIAL",
            },
            {
                "parcel_id": "BC-2024-004",
                "address": "456 Prosser Industrial Way, Prosser, WA",
                "assessed_value": 1250000,
                "property_class": "COMMERCIAL",
            },
        ],
        "status": "ELITE_INITIALIZATION_COMPLETE",
    }

    with open("terraagent_initialization_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("=" * 50)
    print("✅ TerraAgent Elite Database Initialization Complete")
    print(f"📊 Properties: {property_count}")
    print(f"🔄 Sync Jobs: {sync_job_count}")
    print(f"📝 Query Logs: {query_log_count}")
    print(f"📄 Report: terraagent_initialization_report.json")
    print("")
    print("🏛️ Government. Transcended.")
    print("🎯 Ready for Phase 2 Database Migration")


if __name__ == "__main__":
    create_terraagent_database()
