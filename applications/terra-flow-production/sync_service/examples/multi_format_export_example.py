#!/usr/bin/env python
"""
Example script demonstrating the enhanced multi-format export functionality
of the CountyDataSync ETL process.

This script connects to a sample database and exports data to multiple formats.
"""

import os
import sqlite3
import pandas as pd
from datetime import datetime

from sync_service.sync import CountyDataSyncETL

def create_sample_database():
    """Create a sample SQLite database with test data."""
    # Create a sample database
    conn = sqlite3.connect('sample_data.sqlite')
    
    # Create sample stats data
    stats_data = pd.DataFrame({
        'id': range(1, 11),
        'stat_name': [f'Stat {i}' for i in range(1, 11)],
        'stat_value': [i * 10 for i in range(1, 11)],
        'updated_at': [datetime.now() for _ in range(10)]
    })
    
    # Create sample working data
    working_data = pd.DataFrame({
        'id': range(101, 111),
        'name': [f'Item {i}' for i in range(1, 11)],
        'value': [i * 5.5 for i in range(1, 11)],
        'status': ['Active' if i % 2 == 0 else 'Inactive' for i in range(1, 11)],
        'updated_at': [datetime.now() for _ in range(10)]
    })
    
    # Create sample spatial data (if geopandas is available)
    try:
        import geopandas as gpd
        from shapely.geometry import Point
        
        spatial_data = pd.DataFrame({
            'id': range(201, 211),
            'name': [f'Location {i}' for i in range(1, 11)],
            'value': [i * 7.5 for i in range(1, 11)],
            'latitude': [40.0 + i/100 for i in range(1, 11)],
            'longitude': [-74.0 - i/100 for i in range(1, 11)],
            'updated_at': [datetime.now() for _ in range(10)]
        })
        
        # Add geometry column
        geometry = [Point(xy) for xy in zip(spatial_data['longitude'], spatial_data['latitude'])]
        gdf = gpd.GeoDataFrame(spatial_data, geometry=geometry)
        
        # Convert to WKT for storage in SQLite
        spatial_data['geometry'] = gdf.geometry.apply(lambda x: x.wkt)
        
        # Save to database
        spatial_data.to_sql('spatial_data', conn, if_exists='replace', index=False)
        has_spatial = True
    except (ImportError, Exception):
        # If geopandas is not available, skip spatial data
        has_spatial = False
    
    # Save data to database
    stats_data.to_sql('stats_data', conn, if_exists='replace', index=False)
    working_data.to_sql('working_data', conn, if_exists='replace', index=False)
    
    conn.close()
    return has_spatial

def main():
    """Main function to demonstrate multi-format exports."""
    print("CountyDataSync Multi-Format Export Example")
    print("=========================================")
    
    # Create exports directory if it doesn't exist
    export_dir = 'example_exports'
    if not os.path.exists(export_dir):
        os.makedirs(export_dir)
    
    # Create sample database
    print("\nCreating sample database...")
    has_spatial = create_sample_database()
    
    # Connect to the sample database
    print("Connecting to sample database...")
    conn = sqlite3.connect('sample_data.sqlite')
    
    # Create ETL instance
    print("Initializing ETL process...")
    etl = CountyDataSyncETL(export_dir=export_dir)
    
    # Sample transformations
    transformations = {
        'status': lambda x: x.upper() if isinstance(x, str) else x,
        'value': lambda x: round(x, 1) if isinstance(x, (int, float)) else x
    }
    
    # Define export formats
    formats = ['sqlite', 'csv', 'json']
    if has_spatial:
        formats.append('geojson')
    
    # Run ETL workflow with multi-format exports
    print(f"\nRunning ETL workflow with formats: {formats}")
    results = etl.run_etl_workflow(
        source_connection=conn,
        stats_query="SELECT * FROM stats_data",
        working_query="SELECT * FROM working_data",
        stats_timestamp_column='updated_at',
        working_timestamp_column='updated_at',
        stats_table_name='stats_data',
        working_table_name='working_data',
        stats_key_columns=['id'],
        working_key_columns=['id'],
        stats_transformations=transformations,
        working_transformations=transformations,
        incremental=False,
        export_formats=formats
    )
    
    # If spatial data is available, also export it
    if has_spatial:
        print("\nRunning ETL workflow for spatial data...")
        spatial_results = etl.run_etl_workflow(
            source_connection=conn,
            stats_query="SELECT * FROM spatial_data",
            working_query="SELECT 1 as dummy",  # Dummy query
            stats_timestamp_column='updated_at',
            working_timestamp_column='updated_at',
            stats_table_name='spatial_data',
            working_table_name='dummy_data',
            stats_key_columns=['id'],
            incremental=False,
            export_formats=['sqlite', 'geojson']
        )
        
        print("\nSpatial data export results:")
        for fmt, path in spatial_results['stats_export_paths'].items():
            if path:
                print(f"  - {fmt}: {os.path.basename(path)}")
    
    # Print results
    print("\nETL workflow completed successfully!")
    print(f"  - Processed {results['stats']['records_processed']} records")
    print(f"  - Stats records: {results['stats']['stats_records']}")
    print(f"  - Working records: {results['stats']['working_records']}")
    print(f"  - Duration: {results['stats']['duration_seconds']:.2f} seconds")
    
    print("\nExport paths:")
    print("Stats data:")
    for fmt, path in results['stats_export_paths'].items():
        if path:
            print(f"  - {fmt}: {os.path.basename(path)}")
    
    print("Working data:")
    for fmt, path in results['working_export_paths'].items():
        if path:
            print(f"  - {fmt}: {os.path.basename(path)}")
    
    # Demonstrate incremental update
    print("\nDemonstrating incremental update...")
    
    # Add new records to the database
    print("Adding new records to the database...")
    new_stats = pd.DataFrame({
        'id': range(11, 16),
        'stat_name': [f'New Stat {i}' for i in range(11, 16)],
        'stat_value': [i * 10 for i in range(11, 16)],
        'updated_at': [datetime.now() for _ in range(5)]
    })
    
    new_working = pd.DataFrame({
        'id': range(111, 116),
        'name': [f'New Item {i}' for i in range(11, 16)],
        'value': [i * 5.5 for i in range(11, 16)],
        'status': ['Active' if i % 2 == 0 else 'Inactive' for i in range(11, 16)],
        'updated_at': [datetime.now() for _ in range(5)]
    })
    
    # Add new data to the database
    new_stats.to_sql('stats_data', conn, if_exists='append', index=False)
    new_working.to_sql('working_data', conn, if_exists='append', index=False)
    
    # Run incremental ETL workflow
    print("Running incremental ETL workflow...")
    incremental_results = etl.run_etl_workflow(
        source_connection=conn,
        stats_query="SELECT * FROM stats_data",
        working_query="SELECT * FROM working_data",
        stats_timestamp_column='updated_at',
        working_timestamp_column='updated_at',
        stats_table_name='stats_data',
        working_table_name='working_data',
        stats_key_columns=['id'],
        working_key_columns=['id'],
        stats_transformations=transformations,
        working_transformations=transformations,
        incremental=True,
        export_formats=['sqlite', 'json']
    )
    
    # Print incremental update results
    print("\nIncremental ETL workflow completed!")
    print(f"  - Processed {incremental_results['stats']['records_processed']} records")
    print(f"  - Duration: {incremental_results['stats']['duration_seconds']:.2f} seconds")
    
    # Clean up
    conn.close()
    print("\nExample completed. Exported files are in the '%s' directory." % export_dir)

if __name__ == "__main__":
    main()