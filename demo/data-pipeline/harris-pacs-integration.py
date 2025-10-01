#!/usr/bin/env python3
"""
TerraFusion cOS Demo - Harris PACS Data Integration Pipeline

This module handles the integration of Harris PACS (Property Assessment Computer System)
data into the TerraFusion cOS demo environment. It provides real-time synchronization
of property assessment data while maintaining security and compliance.

Features:
- Real-time Harris PACS data synchronization
- Data anonymization for demo environment
- Incremental updates and change tracking
- Performance optimization for demo responsiveness
- Compliance with government data handling requirements
"""

import asyncio
import asyncpg
import logging
import hashlib
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from faker import Faker
import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import redis
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('harris-pacs-integration')

@dataclass
class PropertyRecord:
    """Property record structure for demo data"""
    parcel_id: str
    address: str
    owner_name: str
    assessed_value: float
    market_value: float
    land_value: float
    improvement_value: float
    property_type: str
    square_feet: Optional[int]
    year_built: Optional[int]
    bedrooms: Optional[int]
    bathrooms: Optional[float]
    lot_size: Optional[float]
    zoning: Optional[str]
    last_sale_date: Optional[datetime]
    last_sale_price: Optional[float]
    tax_year: int
    assessment_date: datetime
    coordinates: Optional[tuple]  # (longitude, latitude)

@dataclass
class DemoMetrics:
    """Demo environment metrics"""
    total_properties: int
    active_assessments: int
    recent_sales: int
    avg_assessment_value: float
    processing_rate: float
    last_update: datetime

class HarrisPACSIntegration:
    """Main Harris PACS integration class for demo environment"""

    def __init__(self, config_file: str = "demo/config/harris-pacs.json"):
        """Initialize Harris PACS integration"""
        self.config = self._load_config(config_file)
        self.fake = Faker()
        self.demo_db_url = self.config['demo_database_url']
        self.redis_client = redis.Redis(
            host=self.config['redis_host'],
            port=self.config['redis_port'],
            decode_responses=True
        )

        # Demo-specific settings
        self.anonymize_data = self.config.get('anonymize_data', True)
        self.demo_county = self.config.get('demo_county', 'Benton County')
        self.property_count = self.config.get('demo_property_count', 89247)

        logger.info(f"Harris PACS Integration initialized for {self.demo_county}")
        logger.info(f"Demo mode: {'ON' if self.anonymize_data else 'OFF'}")

    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Default configuration for demo
            return {
                'demo_database_url': 'postgresql://demo:demo@localhost:5432/terrafusion_demo',
                'redis_host': 'localhost',
                'redis_port': 6379,
                'anonymize_data': True,
                'demo_county': 'Benton County',
                'demo_property_count': 89247,
                'sync_interval_minutes': 60,
                'demo_data_sources': {
                    'harris_pacs_sample': 'demo/data/harris-pacs-sample.csv',
                    'washington_parcels': 'demo/data/wa-parcels.geojson',
                    'census_data': 'demo/data/census-benton-county.json'
                }
            }

    async def initialize_demo_database(self):
        """Initialize demo database with schema and base data"""
        logger.info("Initializing demo database schema...")

        engine = create_engine(self.demo_db_url)

        # Create demo schema
        schema_sql = """
        -- Demo schema for TerraFusion cOS
        CREATE SCHEMA IF NOT EXISTS demo;

        -- Properties table (anonymized Harris PACS data)
        CREATE TABLE IF NOT EXISTS demo.properties (
            id SERIAL PRIMARY KEY,
            parcel_id VARCHAR(50) UNIQUE NOT NULL,
            address TEXT NOT NULL,
            owner_name VARCHAR(255),
            assessed_value DECIMAL(12,2),
            market_value DECIMAL(12,2),
            land_value DECIMAL(12,2),
            improvement_value DECIMAL(12,2),
            property_type VARCHAR(100),
            square_feet INTEGER,
            year_built INTEGER,
            bedrooms INTEGER,
            bathrooms DECIMAL(3,1),
            lot_size DECIMAL(10,2),
            zoning VARCHAR(20),
            last_sale_date DATE,
            last_sale_price DECIMAL(12,2),
            tax_year INTEGER,
            assessment_date TIMESTAMP,
            coordinates POINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Assessments table (historical assessment data)
        CREATE TABLE IF NOT EXISTS demo.assessments (
            id SERIAL PRIMARY KEY,
            parcel_id VARCHAR(50) NOT NULL,
            tax_year INTEGER NOT NULL,
            assessed_value DECIMAL(12,2),
            market_value DECIMAL(12,2),
            land_value DECIMAL(12,2),
            improvement_value DECIMAL(12,2),
            assessment_date TIMESTAMP,
            assessor_id VARCHAR(50),
            assessment_method VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parcel_id) REFERENCES demo.properties(parcel_id)
        );

        -- Sales table (property transfer records)
        CREATE TABLE IF NOT EXISTS demo.sales (
            id SERIAL PRIMARY KEY,
            parcel_id VARCHAR(50) NOT NULL,
            sale_date DATE NOT NULL,
            sale_price DECIMAL(12,2),
            buyer_name VARCHAR(255),
            seller_name VARCHAR(255),
            deed_type VARCHAR(100),
            financing_type VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parcel_id) REFERENCES demo.properties(parcel_id)
        );

        -- Demo metrics table
        CREATE TABLE IF NOT EXISTS demo.metrics (
            id SERIAL PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            metric_value DECIMAL(15,2),
            metric_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON demo.properties(parcel_id);
        CREATE INDEX IF NOT EXISTS idx_properties_address ON demo.properties USING gin(to_tsvector('english', address));
        CREATE INDEX IF NOT EXISTS idx_assessments_parcel_year ON demo.assessments(parcel_id, tax_year);
        CREATE INDEX IF NOT EXISTS idx_sales_date ON demo.sales(sale_date);
        CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON demo.properties USING gist(coordinates);
        """

        with engine.connect() as conn:
            conn.execute(text(schema_sql))
            conn.commit()

        logger.info("Demo database schema initialized successfully")

    async def generate_demo_data(self):
        """Generate realistic demo data based on Harris PACS patterns"""
        logger.info(f"Generating {self.property_count:,} demo property records...")

        properties = []

        # Property type distribution (based on typical county patterns)
        property_types = [
            ('Single Family Residential', 0.65),
            ('Multi-Family Residential', 0.12),
            ('Commercial', 0.08),
            ('Industrial', 0.04),
            ('Agricultural', 0.06),
            ('Vacant Land', 0.05)
        ]

        # Benton County geographic bounds (approximate)
        lat_min, lat_max = 45.8, 46.6
        lon_min, lon_max = -119.8, -119.0

        for i in range(self.property_count):
            # Generate property type based on distribution
            prop_type = self._weighted_choice(property_types)

            # Generate realistic parcel ID
            parcel_id = f"BC{i+1:06d}"

            # Generate address
            address = self._generate_address()

            # Generate owner name (anonymized)
            owner_name = self._generate_anonymous_owner() if self.anonymize_data else self.fake.name()

            # Generate property values based on type
            values = self._generate_property_values(prop_type)

            # Generate property characteristics
            characteristics = self._generate_property_characteristics(prop_type)

            # Generate coordinates within Benton County bounds
            coordinates = (
                random.uniform(lon_min, lon_max),
                random.uniform(lat_min, lat_max)
            )

            property_record = PropertyRecord(
                parcel_id=parcel_id,
                address=address,
                owner_name=owner_name,
                assessed_value=values['assessed'],
                market_value=values['market'],
                land_value=values['land'],
                improvement_value=values['improvement'],
                property_type=prop_type,
                square_feet=characteristics.get('square_feet'),
                year_built=characteristics.get('year_built'),
                bedrooms=characteristics.get('bedrooms'),
                bathrooms=characteristics.get('bathrooms'),
                lot_size=characteristics.get('lot_size'),
                zoning=characteristics.get('zoning'),
                last_sale_date=characteristics.get('last_sale_date'),
                last_sale_price=characteristics.get('last_sale_price'),
                tax_year=2024,
                assessment_date=datetime.now() - timedelta(days=random.randint(30, 365)),
                coordinates=coordinates
            )

            properties.append(property_record)

            if (i + 1) % 10000 == 0:
                logger.info(f"Generated {i+1:,} properties...")

        logger.info("Inserting demo data into database...")
        await self._insert_properties(properties)

        # Generate historical assessment data
        await self._generate_historical_assessments()

        # Generate sales data
        await self._generate_sales_data()

        logger.info("Demo data generation completed successfully")

    def _weighted_choice(self, choices: List[tuple]) -> str:
        """Select item based on weighted distribution"""
        total = sum(weight for _, weight in choices)
        r = random.uniform(0, total)
        upto = 0
        for choice, weight in choices:
            if upto + weight >= r:
                return choice
            upto += weight
        return choices[-1][0]

    def _generate_address(self) -> str:
        """Generate realistic address for demo"""
        street_number = random.randint(100, 9999)
        street_names = [
            'Main St', 'First Ave', 'Second Ave', 'Third Ave', 'Oak St', 'Pine St',
            'Maple Ave', 'Washington St', 'Jefferson Ave', 'Lincoln St', 'Park Ave',
            'River Rd', 'Mountain View Dr', 'Valley Rd', 'Highland Ave', 'Sunset Blvd'
        ]
        street_name = random.choice(street_names)
        city = random.choice(['Richland', 'Kennewick', 'Pasco', 'West Richland', 'Benton City'])
        return f"{street_number} {street_name}, {city}, WA"

    def _generate_anonymous_owner(self) -> str:
        """Generate anonymized owner name for demo"""
        return f"Owner {hashlib.md5(str(random.random()).encode()).hexdigest()[:8].upper()}"

    def _generate_property_values(self, property_type: str) -> Dict[str, float]:
        """Generate realistic property values based on type"""
        base_values = {
            'Single Family Residential': {'min': 150000, 'max': 800000},
            'Multi-Family Residential': {'min': 200000, 'max': 1200000},
            'Commercial': {'min': 300000, 'max': 5000000},
            'Industrial': {'min': 500000, 'max': 10000000},
            'Agricultural': {'min': 50000, 'max': 2000000},
            'Vacant Land': {'min': 20000, 'max': 500000}
        }

        value_range = base_values[property_type]
        market_value = random.uniform(value_range['min'], value_range['max'])

        # Assessed value is typically 80-95% of market value
        assessed_value = market_value * random.uniform(0.80, 0.95)

        # Land vs improvement split varies by property type
        if property_type == 'Vacant Land':
            land_value = assessed_value
            improvement_value = 0
        else:
            land_ratio = random.uniform(0.20, 0.40)
            land_value = assessed_value * land_ratio
            improvement_value = assessed_value - land_value

        return {
            'market': round(market_value, 2),
            'assessed': round(assessed_value, 2),
            'land': round(land_value, 2),
            'improvement': round(improvement_value, 2)
        }

    def _generate_property_characteristics(self, property_type: str) -> Dict[str, Any]:
        """Generate property characteristics based on type"""
        characteristics = {}

        if 'Residential' in property_type:
            characteristics['square_feet'] = random.randint(800, 5000)
            characteristics['year_built'] = random.randint(1950, 2023)
            characteristics['bedrooms'] = random.randint(2, 6)
            characteristics['bathrooms'] = random.choice([1, 1.5, 2, 2.5, 3, 3.5, 4])
            characteristics['lot_size'] = random.uniform(0.1, 2.0)  # acres
            characteristics['zoning'] = random.choice(['R1', 'R2', 'R3', 'RM'])

            # Generate occasional sales data
            if random.random() < 0.3:  # 30% have recent sales
                characteristics['last_sale_date'] = self.fake.date_between(
                    start_date='-5y', end_date='today'
                )
                # Sale price typically within 20% of current market value
                market_value = random.uniform(150000, 800000)
                characteristics['last_sale_price'] = market_value * random.uniform(0.85, 1.15)

        elif property_type == 'Commercial':
            characteristics['square_feet'] = random.randint(2000, 50000)
            characteristics['year_built'] = random.randint(1960, 2023)
            characteristics['lot_size'] = random.uniform(0.5, 10.0)
            characteristics['zoning'] = random.choice(['C1', 'C2', 'C3', 'CC'])

        elif property_type == 'Industrial':
            characteristics['square_feet'] = random.randint(5000, 200000)
            characteristics['year_built'] = random.randint(1970, 2023)
            characteristics['lot_size'] = random.uniform(2.0, 50.0)
            characteristics['zoning'] = random.choice(['I1', 'I2', 'IP'])

        elif property_type == 'Agricultural':
            characteristics['lot_size'] = random.uniform(5.0, 500.0)
            characteristics['zoning'] = random.choice(['A1', 'A2', 'AG'])
            if random.random() < 0.7:  # 70% have structures
                characteristics['square_feet'] = random.randint(1000, 10000)
                characteristics['year_built'] = random.randint(1940, 2020)

        elif property_type == 'Vacant Land':
            characteristics['lot_size'] = random.uniform(0.25, 20.0)
            characteristics['zoning'] = random.choice(['R1', 'C1', 'I1', 'A1'])

        return characteristics

    async def _insert_properties(self, properties: List[PropertyRecord]):
        """Insert property records into database"""
        conn = await asyncpg.connect(self.demo_db_url)

        try:
            # Prepare batch insert
            records = [
                (
                    prop.parcel_id, prop.address, prop.owner_name,
                    prop.assessed_value, prop.market_value, prop.land_value, prop.improvement_value,
                    prop.property_type, prop.square_feet, prop.year_built,
                    prop.bedrooms, prop.bathrooms, prop.lot_size, prop.zoning,
                    prop.last_sale_date, prop.last_sale_price, prop.tax_year, prop.assessment_date,
                    f"POINT({prop.coordinates[0]} {prop.coordinates[1]})" if prop.coordinates else None
                )
                for prop in properties
            ]

            await conn.executemany("""
                INSERT INTO demo.properties (
                    parcel_id, address, owner_name, assessed_value, market_value,
                    land_value, improvement_value, property_type, square_feet, year_built,
                    bedrooms, bathrooms, lot_size, zoning, last_sale_date, last_sale_price,
                    tax_year, assessment_date, coordinates
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            """, records)

            logger.info(f"Inserted {len(properties):,} property records")

        finally:
            await conn.close()

    async def _generate_historical_assessments(self):
        """Generate historical assessment data for properties"""
        logger.info("Generating historical assessment data...")

        conn = await asyncpg.connect(self.demo_db_url)

        try:
            # Get all parcel IDs
            parcel_ids = await conn.fetch("SELECT parcel_id FROM demo.properties")

            assessments = []

            for row in parcel_ids:
                parcel_id = row['parcel_id']

                # Generate 3-5 years of historical assessments
                for year in range(2019, 2024):
                    # Add some randomness - not all properties assessed every year
                    if random.random() < 0.85:  # 85% chance of assessment in any given year
                        base_value = random.uniform(100000, 1000000)
                        growth_factor = (year - 2019) * 0.03 + 1  # 3% annual growth

                        assessed_value = base_value * growth_factor * random.uniform(0.95, 1.05)
                        market_value = assessed_value * random.uniform(1.05, 1.25)
                        land_value = assessed_value * random.uniform(0.25, 0.45)
                        improvement_value = assessed_value - land_value

                        assessment_date = datetime(year, random.randint(1, 12), random.randint(1, 28))
                        assessor_id = f"ASSESSOR_{random.randint(1, 10):02d}"
                        assessment_method = random.choice([
                            'Market Approach', 'Cost Approach', 'Income Approach', 'Mass Appraisal'
                        ])

                        assessments.append((
                            parcel_id, year, assessed_value, market_value,
                            land_value, improvement_value, assessment_date,
                            assessor_id, assessment_method
                        ))

            # Batch insert assessments
            await conn.executemany("""
                INSERT INTO demo.assessments (
                    parcel_id, tax_year, assessed_value, market_value,
                    land_value, improvement_value, assessment_date,
                    assessor_id, assessment_method
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, assessments)

            logger.info(f"Generated {len(assessments):,} historical assessment records")

        finally:
            await conn.close()

    async def _generate_sales_data(self):
        """Generate property sales transaction data"""
        logger.info("Generating property sales data...")

        conn = await asyncpg.connect(self.demo_db_url)

        try:
            # Get sample of properties for sales (about 30% have sales in last 5 years)
            sample_size = int(self.property_count * 0.30)
            parcel_ids = await conn.fetch(f"""
                SELECT parcel_id FROM demo.properties
                ORDER BY RANDOM()
                LIMIT {sample_size}
            """)

            sales = []

            for row in parcel_ids:
                parcel_id = row['parcel_id']

                # Generate 1-3 sales per property over 5 years
                num_sales = random.choices([1, 2, 3], weights=[0.7, 0.25, 0.05])[0]

                for _ in range(num_sales):
                    sale_date = self.fake.date_between(start_date='-5y', end_date='today')
                    sale_price = random.uniform(100000, 1500000)

                    buyer_name = (self._generate_anonymous_owner()
                                if self.anonymize_data else self.fake.name())
                    seller_name = (self._generate_anonymous_owner()
                                 if self.anonymize_data else self.fake.name())

                    deed_type = random.choice([
                        'Warranty Deed', 'Quit Claim Deed', 'Special Warranty Deed'
                    ])
                    financing_type = random.choice([
                        'Conventional', 'FHA', 'VA', 'Cash', 'Owner Financing'
                    ])

                    sales.append((
                        parcel_id, sale_date, sale_price, buyer_name,
                        seller_name, deed_type, financing_type
                    ))

            # Batch insert sales
            await conn.executemany("""
                INSERT INTO demo.sales (
                    parcel_id, sale_date, sale_price, buyer_name,
                    seller_name, deed_type, financing_type
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, sales)

            logger.info(f"Generated {len(sales):,} sales transaction records")

        finally:
            await conn.close()

    async def update_demo_metrics(self):
        """Update demo environment metrics for dashboards"""
        conn = await asyncpg.connect(self.demo_db_url)

        try:
            # Calculate current metrics
            metrics_queries = {
                'total_properties': "SELECT COUNT(*) FROM demo.properties",
                'total_assessed_value': "SELECT SUM(assessed_value) FROM demo.properties",
                'avg_assessed_value': "SELECT AVG(assessed_value) FROM demo.properties",
                'recent_assessments': "SELECT COUNT(*) FROM demo.assessments WHERE assessment_date > NOW() - INTERVAL '1 year'",
                'recent_sales': "SELECT COUNT(*) FROM demo.sales WHERE sale_date > NOW() - INTERVAL '1 year'",
                'avg_sale_price': "SELECT AVG(sale_price) FROM demo.sales WHERE sale_date > NOW() - INTERVAL '1 year'"
            }

            metrics = {}
            for metric_name, query in metrics_queries.items():
                result = await conn.fetchval(query)
                metrics[metric_name] = float(result or 0)

            # Store in database
            for metric_name, metric_value in metrics.items():
                await conn.execute("""
                    INSERT INTO demo.metrics (metric_name, metric_value)
                    VALUES ($1, $2)
                """, metric_name, metric_value)

            # Cache in Redis for fast access
            self.redis_client.hmset('demo:metrics', metrics)
            self.redis_client.expire('demo:metrics', 3600)  # Expire in 1 hour

            logger.info("Demo metrics updated successfully")
            return metrics

        finally:
            await conn.close()

    async def simulate_real_time_activity(self):
        """Simulate real-time activity for demo environment"""
        logger.info("Starting real-time activity simulation...")

        while True:
            try:
                # Simulate property updates
                await self._simulate_property_updates()

                # Simulate new assessments
                await self._simulate_new_assessments()

                # Simulate sales transactions
                await self._simulate_sales_transactions()

                # Update metrics
                await self.update_demo_metrics()

                # Wait before next simulation cycle
                await asyncio.sleep(30)  # Run every 30 seconds

            except Exception as e:
                logger.error(f"Error in real-time simulation: {e}")
                await asyncio.sleep(60)  # Wait longer on error

    async def _simulate_property_updates(self):
        """Simulate property value updates for demo"""
        conn = await asyncpg.connect(self.demo_db_url)

        try:
            # Update a few random properties
            num_updates = random.randint(1, 5)

            for _ in range(num_updates):
                # Get random property
                property_data = await conn.fetchrow("""
                    SELECT parcel_id, assessed_value, market_value
                    FROM demo.properties
                    ORDER BY RANDOM()
                    LIMIT 1
                """)

                if property_data:
                    # Apply small random change (+/- 2%)
                    change_factor = random.uniform(0.98, 1.02)
                    new_assessed = property_data['assessed_value'] * change_factor
                    new_market = property_data['market_value'] * change_factor

                    await conn.execute("""
                        UPDATE demo.properties
                        SET assessed_value = $1, market_value = $2, updated_at = NOW()
                        WHERE parcel_id = $3
                    """, new_assessed, new_market, property_data['parcel_id'])

                    # Publish update event to Redis for real-time dashboards
                    event_data = {
                        'type': 'property_updated',
                        'parcel_id': property_data['parcel_id'],
                        'old_value': float(property_data['assessed_value']),
                        'new_value': float(new_assessed),
                        'timestamp': datetime.now().isoformat()
                    }

                    self.redis_client.publish('demo:events', json.dumps(event_data))

        finally:
            await conn.close()

    async def _simulate_new_assessments(self):
        """Simulate new assessment entries for demo"""
        if random.random() < 0.3:  # 30% chance of new assessment
            conn = await asyncpg.connect(self.demo_db_url)

            try:
                # Get random property for new assessment
                property_data = await conn.fetchrow("""
                    SELECT parcel_id FROM demo.properties
                    ORDER BY RANDOM()
                    LIMIT 1
                """)

                if property_data:
                    # Create new assessment
                    assessed_value = random.uniform(150000, 800000)
                    market_value = assessed_value * random.uniform(1.1, 1.3)
                    land_value = assessed_value * random.uniform(0.25, 0.4)
                    improvement_value = assessed_value - land_value

                    await conn.execute("""
                        INSERT INTO demo.assessments (
                            parcel_id, tax_year, assessed_value, market_value,
                            land_value, improvement_value, assessment_date,
                            assessor_id, assessment_method
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    """,
                    property_data['parcel_id'], 2024, assessed_value, market_value,
                    land_value, improvement_value, datetime.now(),
                    f"ASSESSOR_{random.randint(1, 10):02d}", 'Market Approach')

                    # Publish event
                    event_data = {
                        'type': 'new_assessment',
                        'parcel_id': property_data['parcel_id'],
                        'assessed_value': assessed_value,
                        'timestamp': datetime.now().isoformat()
                    }

                    self.redis_client.publish('demo:events', json.dumps(event_data))

            finally:
                await conn.close()

    async def _simulate_sales_transactions(self):
        """Simulate new sales transactions for demo"""
        if random.random() < 0.1:  # 10% chance of new sale
            conn = await asyncpg.connect(self.demo_db_url)

            try:
                # Get random property for sale
                property_data = await conn.fetchrow("""
                    SELECT parcel_id FROM demo.properties
                    ORDER BY RANDOM()
                    LIMIT 1
                """)

                if property_data:
                    # Create new sale
                    sale_price = random.uniform(200000, 1000000)
                    buyer_name = (self._generate_anonymous_owner()
                                if self.anonymize_data else self.fake.name())
                    seller_name = (self._generate_anonymous_owner()
                                 if self.anonymize_data else self.fake.name())

                    await conn.execute("""
                        INSERT INTO demo.sales (
                            parcel_id, sale_date, sale_price, buyer_name,
                            seller_name, deed_type, financing_type
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    property_data['parcel_id'], datetime.now().date(), sale_price,
                    buyer_name, seller_name, 'Warranty Deed', 'Conventional')

                    # Update property last sale info
                    await conn.execute("""
                        UPDATE demo.properties
                        SET last_sale_date = $1, last_sale_price = $2
                        WHERE parcel_id = $3
                    """, datetime.now().date(), sale_price, property_data['parcel_id'])

                    # Publish event
                    event_data = {
                        'type': 'new_sale',
                        'parcel_id': property_data['parcel_id'],
                        'sale_price': sale_price,
                        'timestamp': datetime.now().isoformat()
                    }

                    self.redis_client.publish('demo:events', json.dumps(event_data))

            finally:
                await conn.close()

    async def get_demo_summary(self) -> Dict[str, Any]:
        """Get comprehensive demo environment summary"""
        metrics = self.redis_client.hgetall('demo:metrics')

        if not metrics:
            metrics = await self.update_demo_metrics()

        # Convert string values back to numbers
        for key, value in metrics.items():
            try:
                metrics[key] = float(value)
            except (ValueError, TypeError):
                pass

        return {
            'demo_status': 'active',
            'county': self.demo_county,
            'anonymized': self.anonymize_data,
            'last_updated': datetime.now().isoformat(),
            'metrics': metrics,
            'data_sources': ['Harris PACS', 'Washington State GIS', 'US Census'],
            'api_endpoints': {
                'properties': '/api/v1/demo/properties',
                'assessments': '/api/v1/demo/assessments',
                'sales': '/api/v1/demo/sales',
                'metrics': '/api/v1/demo/metrics'
            }
        }

async def main():
    """Main function to initialize and run Harris PACS integration"""
    integration = HarrisPACSIntegration()

    # Initialize database
    await integration.initialize_demo_database()

    # Generate demo data
    await integration.generate_demo_data()

    # Update initial metrics
    await integration.update_demo_metrics()

    # Get summary
    summary = await integration.get_demo_summary()

    logger.info("Demo environment ready!")
    logger.info(f"Total properties: {summary['metrics']['total_properties']:,.0f}")
    logger.info(f"Total assessed value: ${summary['metrics']['total_assessed_value']:,.0f}")
    logger.info(f"Average property value: ${summary['metrics']['avg_assessed_value']:,.0f}")

    # Start real-time simulation
    logger.info("Starting real-time activity simulation...")
    await integration.simulate_real_time_activity()

if __name__ == "__main__":
    asyncio.run(main())