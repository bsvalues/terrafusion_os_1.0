# TerraMiner ETL Plugins Documentation

## Overview

TerraMiner's ETL (Extract, Transform, Load) system is designed with a modular plugin architecture that allows for easy extension and customization. This document provides details on the available ETL plugins and how to use them.

## Plugin Types

TerraMiner includes the following types of ETL plugins:

1. **Data Source Plugins** - Connect to external data sources like Zillow and NARRPR
2. **File Processing Plugins** - Handle various file formats (CSV, Excel, JSON, XML, Geospatial)
3. **AI Analysis Plugins** - Perform AI-powered analysis on data

## Common Usage Pattern

All ETL plugins follow the same usage pattern:

```python
from etl.__main__ import create_plugin_instance

# Create a plugin instance with configuration
plugin = create_plugin_instance('PluginName', {
    'config_key1': 'value1',
    'config_key2': 'value2'
})

# Run the full ETL pipeline
result = plugin.run()

# Or run steps individually
raw_data = plugin.extract()
processed_data = plugin.transform(raw_data)
load_result = plugin.load(processed_data)
```

## Available Plugins

### Data Source Plugins

#### ZillowMarketDataETL

Extracts market data from Zillow.

**Configuration:**
```python
config = {
    'locations': ['San Francisco, CA', 'Los Angeles, CA'],  # List of locations to analyze
    'data_types': ['price', 'inventory'],  # Types of market data
    'start_date': '2023-01-01',  # Start date for data (optional)
    'end_date': '2023-12-31',  # End date for data (optional)
    'output_table': 'zillow_market_data'  # Database table to store results
}
```

#### ZillowPropertyETL

Extracts property data from Zillow.

**Configuration:**
```python
config = {
    'property_ids': ['12345', '67890'],  # List of Zillow property IDs
    'property_types': ['Single Family', 'Condo'],  # Property types to filter
    'location': 'San Francisco, CA',  # Location to search
    'output_table': 'zillow_properties'  # Database table to store results
}
```

#### NarrprPropertyETL

Extracts property data from NARRPR.

**Configuration:**
```python
config = {
    'property_ids': ['12345', '67890'],  # NARRPR property IDs
    'locations': ['San Francisco, CA'],  # Locations to search
    'credentials': {  # NARRPR credentials
        'username': 'your_username',
        'password': 'your_password'
    },
    'output_table': 'narrpr_properties'  # Database table to store results
}
```

### File Processing Plugins

#### CSVFileETL

Processes CSV files.

**Configuration:**
```python
config = {
    'file_path': '/path/to/data.csv',  # Path to CSV file or URL
    'table_name': 'imported_data',  # Database table name
    'delimiter': ',',  # Field delimiter (default: ',')
    'has_header': True,  # Whether file has headers (default: True)
    'encoding': 'utf-8',  # File encoding (default: 'utf-8')
    'schema': {  # Optional schema for data type conversion
        'id': 'int',
        'price': 'float',
        'date_listed': 'date'
    },
    'primary_key': 'id'  # Column to use as primary key
}
```

#### ExcelFileETL

Processes Excel files.

**Configuration:**
```python
config = {
    'file_path': '/path/to/data.xlsx',  # Path to Excel file or URL
    'table_name': 'imported_data',  # Database table name
    'sheet_name': 'Sheet1',  # Sheet name or index (default: 0)
    'has_header': True,  # Whether sheet has headers (default: True)
    'schema': {  # Optional schema for data type conversion
        'id': 'int',
        'price': 'float',
        'date_listed': 'date'
    }
}
```

#### JSONFileETL

Processes JSON files.

**Configuration:**
```python
config = {
    'file_path': '/path/to/data.json',  # Path to JSON file or URL
    'table_name': 'imported_data',  # Database table name
    'json_path': 'data.items',  # Path to access array in JSON (optional)
    'schema': {  # Optional schema for data type conversion
        'id': 'int',
        'price': 'float'
    }
}
```

#### XMLFileETL

Processes XML files.

**Configuration:**
```python
config = {
    'file_path': '/path/to/data.xml',  # Path to XML file or URL
    'table_name': 'imported_data',  # Database table name
    'xpath': '//record',  # XPath to extract elements (optional)
    'record_path': 'records/record',  # Path to record elements (optional)
    'field_map': {  # Map XML element/attribute names to field names
        'ID': 'id',
        'PRICE': 'price'
    }
}
```

#### GeospatialFileETL

Processes geospatial files (GeoJSON, Shapefile, etc.).

**Configuration:**
```python
config = {
    'file_path': '/path/to/data.geojson',  # Path to geospatial file or URL
    'table_name': 'spatial_data',  # PostGIS table name
    'target_crs': 'EPSG:4326',  # Target coordinate reference system (optional)
    'columns': ['id', 'name', 'geometry'],  # Columns to select (optional)
    'filter_expr': 'area > 1000',  # Filter expression (optional)
    'if_exists': 'replace'  # 'replace', 'append', or 'fail' (default: 'replace')
}
```

### AI Analysis Plugins

#### AIDataAnalyzerETL

Analyzes data using AI models.

**Configuration:**
```python
config = {
    'data_source': 'property_descriptions',  # Table name or data structure
    'analysis_type': 'summarize',  # 'summarize', 'classify', 'sentiment', 'extract_entities'
    'analysis_params': {  # Parameters for the analysis
        'text_field': 'description',  # Field containing text to analyze
        'max_length': 200,  # For summarization
        'categories': ['luxury', 'affordable', 'investment'],  # For classification
        'entity_types': ['amenity', 'location', 'feature'],  # For entity extraction
        'limit': 10,  # Maximum records to process
        'include_original': False  # Include original fields in results
    },
    'output_table': 'ai_analysis_results'  # Table to store results
}
```

## API Integration

All ETL plugins can be scheduled or triggered via API endpoints:

### Schedule a job:
```
POST /api/etl/schedule
{
    "plugin_name": "CSVFileETL",
    "config": {
        "file_path": "https://example.com/data.csv",
        "table_name": "daily_import"
    },
    "frequency": "daily",
    "start_time": "08:00:00",
    "enabled": true
}
```

### Run a job:
```
POST /api/etl/jobs
{
    "plugin_name": "AIDataAnalyzerETL",
    "config": {
        "data_source": "property_descriptions",
        "analysis_type": "summarize",
        "output_table": "description_summaries"
    }
}
```

### Get job results:
```
GET /api/etl/jobs/{job_id}
```

## Error Handling

All ETL plugins include comprehensive error handling. When an error occurs:

1. The error is logged with detailed information
2. The job status is marked as 'failed'
3. The error message is included in the job result
4. Metrics are recorded for monitoring

## Extending the System

To create a new ETL plugin:

1. Create a new class that inherits from `BaseETL`
2. Implement the required methods: `extract()`, `transform()`, and `load()`
3. Add your plugin to the appropriate module
4. It will be automatically discovered by the ETL system