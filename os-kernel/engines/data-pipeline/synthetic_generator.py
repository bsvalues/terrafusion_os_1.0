#!/usr/bin/env python3
"""
TerraFusion OS - Synthetic Property Data Generator
Generates realistic Benton County property data for stress testing
"""

import random
from datetime import datetime

import requests

# Configuration
PIPELINE_URL = "http://localhost:5002/api/ingest"
NUM_RECORDS = 1000  # Adjust as needed
BATCH_SIZE = 100

# Benton County realistic data
CITIES = ["Richland", "Kennewick", "West Richland", "Prosser", "Benton City", "Finley"]
STREETS = [
    "Columbia Dr",
    "Oak St",
    "Main Ave",
    "River Rd",
    "Vineyard Way",
    "Canyon Rd",
    "Desert View Dr",
    "Sunset Blvd",
    "Washington St",
    "Hanford Hwy",
]
PROPERTY_TYPES = ["Residential", "Commercial", "Agricultural", "Industrial", "Vacant"]
ZONING = ["R-1", "R-2", "C-1", "C-2", "AG", "M-1", "PUD"]


def generate_parcel_id():
    """Generate realistic Benton County parcel ID."""
    # Format: X-XXXX-XXX-XXXX-XXX
    return f"{random.randint(1, 9)}-{random.randint(1000, 9999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}-{random.randint(0, 999):03d}"


def generate_property():
    """Generate a single realistic property record."""
    city = random.choice(CITIES)
    prop_type = random.choice(PROPERTY_TYPES)

    # Value ranges by type
    value_ranges = {
        "Residential": (150000, 800000),
        "Commercial": (500000, 5000000),
        "Agricultural": (200000, 2000000),
        "Industrial": (1000000, 10000000),
        "Vacant": (25000, 200000),
    }
    min_val, max_val = value_ranges[prop_type]

    return {
        "parcel_id": generate_parcel_id(),
        "owner": f"{random.choice(['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'])}, {random.choice(['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Elizabeth'])}",
        "address": f"{random.randint(100, 9999)} {random.choice(STREETS)}, {city}, WA {random.randint(99300, 99360)}",
        "value": round(random.uniform(min_val, max_val), 2),
        "property_type": prop_type,
        "zoning": random.choice(ZONING),
        "acreage": round(
            random.uniform(0.1, 100.0)
            if prop_type in ["Agricultural", "Industrial"]
            else random.uniform(0.1, 2.0),
            2,
        ),
        "year_built": random.randint(1950, 2024) if prop_type != "Vacant" else None,
        "bedrooms": random.randint(1, 6) if prop_type == "Residential" else None,
        "bathrooms": random.randint(1, 4) if prop_type == "Residential" else None,
        "sqft": random.randint(800, 5000) if prop_type == "Residential" else None,
    }


def run_stress_test():
    """Generate and ingest synthetic data."""
    print(f"🚀 Starting synthetic data generation: {NUM_RECORDS} records")
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Target: {PIPELINE_URL}")

    total_ingested = 0
    start_time = datetime.now()

    for batch_num in range(0, NUM_RECORDS, BATCH_SIZE):
        batch_size = min(BATCH_SIZE, NUM_RECORDS - batch_num)
        records = [generate_property() for _ in range(batch_size)]

        payload = {"source": "synthetic-stress-test", "records": records}

        try:
            response = requests.post(PIPELINE_URL, json=payload, timeout=30)
            if response.status_code == 202:
                total_ingested += batch_size
                elapsed = (datetime.now() - start_time).total_seconds()
                rate = total_ingested / elapsed if elapsed > 0 else 0
                print(
                    f"   ✅ Batch {batch_num // BATCH_SIZE + 1}: {total_ingested}/{NUM_RECORDS} ({rate:.1f} records/sec)"
                )
            else:
                print(f"   ❌ Batch failed: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {e}")

    elapsed = (datetime.now() - start_time).total_seconds()
    print("\n🎉 Stress test complete!")
    print(f"   Total records: {total_ingested}")
    print(f"   Time elapsed: {elapsed:.2f}s")
    print(f"   Throughput: {total_ingested / elapsed:.1f} records/sec")


if __name__ == "__main__":
    run_stress_test()
