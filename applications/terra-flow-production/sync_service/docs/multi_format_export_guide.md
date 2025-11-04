# Multi-Format Export Feature Guide
## CountyDataSync ETL Process Enhancement

This document provides detailed information about the new multi-format export feature implemented in the CountyDataSync ETL process.

## Overview

The enhanced export mechanism allows the ETL process to export data to multiple formats simultaneously:
- SQLite databases (existing functionality)
- CSV files (new)
- JSON files (new)
- GeoJSON files (for spatial data) (new)

This enhancement improves compatibility with different systems and provides more flexibility for data consumption.

## Architecture

The enhanced export system consists of the following components:

1. **MultiFormatExporter** - Core class that handles exporting to different formats
2. **SQLiteExporter** - Specialized class for SQLite exports (maintained for backward compatibility)
3. **IncrementalSyncManager** - Tracks sync state and manages incremental updates
4. **CountyDataSyncETL** - Main ETL class, now enhanced with multi-format support

## Key Features

### Multiple Export Formats
The system can now export data to multiple formats in a single ETL run:

```python
etl = CountyDataSyncETL(export_dir='exports')
results = etl.run_etl_workflow(
    source_connection=conn,
    stats_query="SELECT * FROM stats",
    working_query="SELECT * FROM working_data",
    export_formats=['sqlite', 'csv', 'json']
)
```

### Timestamps in Export Files
Export files include timestamps in their names for better tracking and historical reference:
- Example: `stats_20250411_143042.csv`

### Symlinks to Latest Versions
For each export type, a symlink is created pointing to the latest version:
- Example: `stats.csv` -> `stats_20250411_143042.csv`

### Data Transformation Support
The ETL process still supports transformations on data before exporting:

```python
transformations = {
    'amount': lambda x: round(x, 2),
    'status': lambda x: x.upper()
}

results = etl.run_etl_workflow(
    # ...other parameters...
    stats_transformations=transformations,
    export_formats=['sqlite', 'json']
)
```

### Incremental Updates
The system supports incremental updates for all export formats:

```python
etl.run_etl_workflow(
    # ...other parameters...
    incremental=True,
    key_columns=['id'],  # Used for merging records
    export_formats=['sqlite', 'csv', 'json']
)
```

## Implementation Details

### Format-Specific Handling

#### SQLite Export
- Files stored as `.sqlite` databases
- Tables named after the dataset (e.g., `stats_data`, `working_data`)
- Full support for incremental updates (append or merge)

#### CSV Export
- Files stored as `.csv` files
- Simple tabular format, easily importable into Excel or other tools
- Headers included for column names

#### JSON Export
- Files stored as `.json` files
- Records exported in "records" orientation (array of objects)
- Special handling for datetime objects (converted to ISO format strings)

#### GeoJSON Export
- Files stored as `.geojson` files
- Requires a `geometry` column in the data
- Automatic conversion between DataFrame and GeoDataFrame
- Spatial data preserved in standard GeoJSON format

### Export Results

The `run_etl_workflow` method returns detailed results including paths to all exported files:

```python
{
    'job_id': 'etl_20250411_143042',
    'start_time': datetime.datetime(2025, 4, 11, 14, 30, 42),
    'end_time': datetime.datetime(2025, 4, 11, 14, 30, 45),
    'success': True,
    'stats': {
        'records_processed': 1500,
        'stats_records': 500,
        'working_records': 1000,
        'duration_seconds': 3.25
    },
    'stats_db_path': '/path/to/exports/stats_20250411_143042.sqlite',
    'working_db_path': '/path/to/exports/working_20250411_143042.sqlite',
    'stats_export_paths': {
        'sqlite': '/path/to/exports/stats_20250411_143042.sqlite',
        'csv': '/path/to/exports/stats_20250411_143042.csv',
        'json': '/path/to/exports/stats_20250411_143042.json'
    },
    'working_export_paths': {
        'sqlite': '/path/to/exports/working_20250411_143042.sqlite',
        'csv': '/path/to/exports/working_20250411_143042.csv',
        'json': '/path/to/exports/working_20250411_143042.json'
    }
}
```

## Usage Examples

### Basic Export to Multiple Formats

```python
from sync_service.sync import CountyDataSyncETL

etl = CountyDataSyncETL(export_dir='exports')
results = etl.run_etl_workflow(
    source_connection=db_connection,
    stats_query="SELECT * FROM statistics",
    working_query="SELECT * FROM operational_data",
    export_formats=['sqlite', 'csv', 'json']
)

# Access the exported file paths
sqlite_path = results['stats_export_paths']['sqlite']
csv_path = results['stats_export_paths']['csv']
json_path = results['stats_export_paths']['json']
```

### Incremental Export with Key Columns

```python
etl = CountyDataSyncETL(export_dir='exports')
results = etl.run_etl_workflow(
    source_connection=db_connection,
    stats_query="SELECT * FROM statistics",
    working_query="SELECT * FROM operational_data", 
    stats_key_columns=['id'],
    working_key_columns=['record_id'],
    incremental=True,
    export_formats=['sqlite', 'json']
)
```

### Export with Data Transformations

```python
def convert_to_uppercase(value):
    return value.upper() if isinstance(value, str) else value

def format_amount(value):
    return round(float(value), 2) if value is not None else 0.0

transformations = {
    'status': convert_to_uppercase,
    'amount': format_amount
}

etl = CountyDataSyncETL(export_dir='exports')
results = etl.run_etl_workflow(
    source_connection=db_connection,
    stats_query="SELECT * FROM statistics",
    working_query="SELECT * FROM operational_data",
    stats_transformations=transformations,
    working_transformations=transformations,
    export_formats=['sqlite', 'csv', 'json']
)
```

### Export Spatial Data to GeoJSON

```python
etl = CountyDataSyncETL(export_dir='exports')
results = etl.run_etl_workflow(
    source_connection=db_connection,
    stats_query="SELECT id, name, value, ST_AsText(geometry) as geometry FROM spatial_stats",
    working_query="SELECT * FROM operational_data",
    export_formats=['sqlite', 'geojson']
)

geojson_path = results['stats_export_paths']['geojson']
```

## Best Practices

1. **Choose appropriate formats for your use case:**
   - SQLite: Best for relational data with complex queries
   - CSV: Best for simple tabular data and compatibility
   - JSON: Best for nested data and web applications
   - GeoJSON: Best for spatial data visualization and analysis

2. **Use incremental updates when possible:**
   - Improves performance for large datasets
   - Reduces processing time
   - Maintains historical data integrity

3. **Consider directory structure:**
   - Use meaningful export directory names
   - Consider organizing exports by date or data type
   - Remember that symlinks always point to the latest version

4. **Data transformations:**
   - Apply transformations prior to export for consistency
   - Keep transformations simple and focused
   - Document any complex transformations

## Troubleshooting

### Common Issues

1. **Export fails with "No such file or directory"**
   - Ensure the export directory exists and has appropriate permissions
   - Check if the path is correct and accessible

2. **GeoJSON export fails**
   - Verify the data has a valid geometry column
   - Ensure geopandas is installed (`pip install geopandas`)
   - Check geometry format (should be WKT or compatible format)

3. **Incremental update not working**
   - Verify that timestamp columns exist and are properly formatted
   - Check if the metadata file is corrupted or missing
   - Ensure key columns are correctly specified for merges

### Logging

The export process logs detailed information at various stages:

```
INFO:sync_service.sync:Starting ETL workflow (Job ID: etl_20250411_143042)
INFO:sync_service.sync:Incremental mode: True
INFO:sync_service.sync:Extracting data for stats_data
INFO:sync_service.sync:Modified query to filter by last sync time: 2025-04-10 14:30:42
INFO:sync_service.sync:Extracted 500 records
INFO:sync_service.sync:Loading 500 records to stats database
INFO:sync_service.sync:Stats data exported to sqlite format: /path/to/exports/stats_20250411_143042.sqlite
INFO:sync_service.sync:Stats data exported to csv format: /path/to/exports/stats_20250411_143042.csv
INFO:sync_service.sync:Stats data exported to json format: /path/to/exports/stats_20250411_143042.json
```

Check the logs for detailed information about the export process and any errors that occurred.