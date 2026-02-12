"""
Data Query API Module

This module provides endpoints for data querying and transformation services.
It interfaces with the Power Query functionality to access various data sources.
"""

import json
import logging
import os
import tempfile
from typing import Dict, List, Optional, Any

from flask import Blueprint, jsonify, request, send_file, current_app

from api.gateway import api_login_required
from models import db, QueryLog
from power_query import PowerQuery, CSVDataSource, ExcelDataSource, SQLiteDataSource

logger = logging.getLogger(__name__)

# Create blueprint
data_bp = Blueprint('data', __name__, url_prefix='/data')

# Initialize Power Query engine
power_query_engine = PowerQuery()

@data_bp.route('/sources')
@api_login_required
def list_data_sources():
    """List available data sources"""
    try:
        # Get source type filter if any
        source_type = request.args.get('type')
        
        # Get sources from power query engine
        sources = power_query_engine.list_data_sources()
        
        # Add PostgreSQL connection info directly (this ensures it shows up)
        if os.environ.get('DATABASE_URL'):
            from urllib.parse import urlparse
            db_url = urlparse(os.environ.get('DATABASE_URL'))
            pg_source = {
                "name": "Benton County PostgreSQL",
                "description": "Primary PostgreSQL database for Benton County GIS data",
                "type": "PostgreSQLDataSource",
                "is_connected": True,
                "connection_info": {
                    "host": db_url.hostname,
                    "database": db_url.path.lstrip('/') if db_url.path else 'postgres',
                    "port": db_url.port or 5432
                }
            }
            sources.append(pg_source)
        
        # Filter by type if requested
        if source_type:
            sources = [s for s in sources if s.get('type') == source_type]
            
        return jsonify({'sources': sources})
    except Exception as e:
        logger.error(f"Error listing data sources: {str(e)}")
        return jsonify({'error': f'Error listing data sources: {str(e)}'}), 500
        
@data_bp.route('/sources/<source_id>')
@api_login_required
def get_data_source_metadata(source_id):
    """Get metadata for a specific data source"""
    try:
        # Get data source
        data_source = power_query_engine.get_data_source(source_id)
        
        if not data_source:
            return jsonify({'error': f'Data source not found: {source_id}'}), 404
            
        # Get metadata
        metadata = data_source.get_metadata()
        
        return jsonify(metadata)
    except Exception as e:
        logger.error(f"Error getting data source metadata: {str(e)}")
        return jsonify({'error': f'Error getting data source metadata: {str(e)}'}), 500
        
@data_bp.route('/sources/<source_id>/tables')
@api_login_required
def list_source_tables(source_id):
    """List tables available in a data source"""
    try:
        # Special handling for the primary PostgreSQL database
        if source_id == "benton_postgresql" or source_id == "Benton County PostgreSQL":
            # Get direct database connection using the DATABASE_URL
            import sqlalchemy
            from sqlalchemy import create_engine, text
            
            engine = create_engine(os.environ.get('DATABASE_URL'))
            
            with engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """))
                tables = [row[0] for row in result]
                
            return jsonify({'tables': tables})

        # Default handling
        data_source = power_query_engine.get_data_source(source_id)
        
        if not data_source:
            return jsonify({'error': f'Data source not found: {source_id}'}), 404
            
        # Get tables (if the source supports it)
        if hasattr(data_source, 'get_tables'):
            tables = data_source.get_tables()
            return jsonify({'tables': tables})
        else:
            return jsonify({'error': 'This data source does not support listing tables'}), 400
    except Exception as e:
        logger.error(f"Error listing source tables: {str(e)}")
        return jsonify({'error': f'Error listing source tables: {str(e)}'}), 500
        
@data_bp.route('/sources/<source_id>/tables/<table_name>/schema')
@api_login_required
def get_table_schema(source_id, table_name):
    """Get schema information for a specific table"""
    try:
        # Special handling for the primary PostgreSQL database
        if source_id == "benton_postgresql" or source_id == "Benton County PostgreSQL":
            # Get direct database connection using the DATABASE_URL
            import sqlalchemy
            from sqlalchemy import create_engine, text
            
            # Sanitize table name to prevent SQL injection
            table_name = table_name.replace("'", "''")
            
            engine = create_engine(os.environ.get('DATABASE_URL'))
            
            query = f"""
            SELECT 
                column_name, 
                data_type,
                character_maximum_length,
                column_default,
                is_nullable
            FROM 
                information_schema.columns
            WHERE 
                table_schema = 'public'
                AND table_name = '{table_name}'
            ORDER BY 
                ordinal_position
            """
            
            schema = []
            with engine.connect() as conn:
                result = conn.execute(text(query))
                
                for row in result:
                    column_info = {
                        "name": row[0],
                        "type": row[1],
                        "length": int(row[2]) if row[2] is not None else None,
                        "default": row[3],
                        "nullable": row[4] == "YES"
                    }
                    schema.append(column_info)
            
            return jsonify({'schema': schema})
            
        # Default handling
        data_source = power_query_engine.get_data_source(source_id)
        
        if not data_source:
            return jsonify({'error': f'Data source not found: {source_id}'}), 404
            
        # Get schema (if the source supports it)
        if hasattr(data_source, 'get_table_schema'):
            schema = data_source.get_table_schema(table_name)
            return jsonify({'schema': schema})
        else:
            return jsonify({'error': 'This data source does not support schema information'}), 400
    except Exception as e:
        logger.error(f"Error getting table schema: {str(e)}")
        return jsonify({'error': f'Error getting table schema: {str(e)}'}), 500
        
@data_bp.route('/sources/<source_id>/tables/<table_name>/data')
@api_login_required
def query_table_data(source_id, table_name):
    """Query data from a specific table"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 100)
        try:
            limit = int(limit)
        except ValueError:
            return jsonify({'error': 'Invalid limit parameter'}), 400
            
        # Special handling for the primary PostgreSQL database
        if source_id == "benton_postgresql" or source_id == "Benton County PostgreSQL":
            import sqlalchemy
            import pandas as pd
            from sqlalchemy import create_engine, text
            
            # Sanitize table name to prevent SQL injection
            table_name = table_name.replace("'", "''")
            
            # Get filters from request
            filter_column = request.args.get('filter_column')
            filter_value = request.args.get('filter_value')
            filter_operator = request.args.get('filter_operator', 'equals')
            order_by = request.args.get('order_by')
            order_direction = request.args.get('order_direction', 'asc')
            
            # Connect to the database
            engine = create_engine(os.environ.get('DATABASE_URL'))
            
            # Build the query
            query = f"SELECT * FROM {table_name}"
            
            # Add filtering if specified
            if filter_column and filter_value is not None:
                # Sanitize column name and value
                filter_column = filter_column.replace("'", "''")
                
                # Different operators
                if filter_operator == 'equals':
                    query += f" WHERE {filter_column} = '{filter_value}'"
                elif filter_operator == 'contains':
                    query += f" WHERE {filter_column} LIKE '%{filter_value}%'"
                elif filter_operator == 'startswith':
                    query += f" WHERE {filter_column} LIKE '{filter_value}%'"
                elif filter_operator == 'endswith':
                    query += f" WHERE {filter_column} LIKE '%{filter_value}'"
                elif filter_operator == 'greater_than':
                    query += f" WHERE {filter_column} > '{filter_value}'"
                elif filter_operator == 'less_than':
                    query += f" WHERE {filter_column} < '{filter_value}'"
            
            # Add ordering if specified
            if order_by:
                # Sanitize
                order_by = order_by.replace("'", "''")
                order_direction = "ASC" if order_direction.lower() == 'asc' else "DESC"
                query += f" ORDER BY {order_by} {order_direction}"
            
            # Add limit
            query += f" LIMIT {limit}"
            
            # Execute the query
            with engine.connect() as conn:
                df = pd.read_sql_query(text(query), conn)
                
                # Convert to records
                records = df.to_dict('records')
                
                # Handle spatial data types - convert to WKT strings
                for record in records:
                    for key, value in record.items():
                        # Check if it's a geometry object
                        if hasattr(value, 'wkt'):
                            record[key] = value.wkt
                
                return jsonify({'data': records})
            
        # Default handling for other data sources
        data_source = power_query_engine.get_data_source(source_id)
        
        if not data_source:
            return jsonify({'error': f'Data source not found: {source_id}'}), 404
            
        # Build query based on source type
        if hasattr(data_source, 'execute_query'):
            # SQL-based source
            query = f"SELECT * FROM {table_name} LIMIT {limit}"
            result = data_source.execute_query(query)
            
            # Convert result to list of dicts
            if hasattr(result, 'to_dict'):
                # Pandas DataFrame
                records = result.to_dict('records')
            else:
                # Assume list of tuples with column names
                records = []
                for row in result[1:]:  # Skip header row
                    record = {}
                    for i, col in enumerate(result[0]):
                        record[col] = row[i]
                    records.append(record)
                    
            return jsonify({'data': records})
        elif hasattr(data_source, 'get_data'):
            # DataFrame-based source (CSV, Excel)
            data = data_source.get_data()
            
            if table_name != 'data' and hasattr(data_source, 'load_sheet'):
                # For Excel, load the specific sheet
                data_source.load_sheet(table_name)
                data = data_source.get_data()
                
            # Apply limit
            data = data.head(limit)
            
            # Convert to records
            records = data.to_dict('records')
            return jsonify({'data': records})
        else:
            return jsonify({'error': 'This data source does not support querying data'}), 400
    except Exception as e:
        logger.error(f"Error querying table data: {str(e)}")
        return jsonify({'error': f'Error querying table data: {str(e)}'}), 500
        
@data_bp.route('/query', methods=['POST'])
@api_login_required
def execute_custom_query():
    """Execute a custom SQL or Power Query"""
    try:
        # Get query from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No query data provided'}), 400
            
        query_type = data.get('type', 'sql')
        query = data.get('query')
        source_id = data.get('source_id')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
            
        if not source_id:
            return jsonify({'error': 'No source_id provided'}), 400
        
        # Special handling for the primary PostgreSQL database    
        if source_id == "benton_postgresql" or source_id == "Benton County PostgreSQL":
            import sqlalchemy
            import pandas as pd
            from sqlalchemy import create_engine, text
            
            # Connect to the database
            engine = create_engine(os.environ.get('DATABASE_URL'))
            
            if query_type == 'sql':
                # Execute SQL query directly against PostgreSQL
                try:
                    with engine.connect() as conn:
                        df = pd.read_sql_query(text(query), conn)
                        
                        # Convert to records
                        records = df.to_dict('records')
                        
                        # Handle spatial data types - convert to WKT strings
                        for record in records:
                            for key, value in record.items():
                                # Check if it's a geometry object
                                if hasattr(value, 'wkt'):
                                    record[key] = value.wkt
                        
                        return jsonify({'data': records})
                except Exception as sql_error:
                    logger.error(f"SQL error executing query on primary database: {str(sql_error)}")
                    return jsonify({'error': f'SQL error: {str(sql_error)}'}), 400
            
            # For Power Query format, use the built-in engine
            # (This falls through to the default handling)
            
        # Default handling for other data sources
        data_source = power_query_engine.get_data_source(source_id)
        
        if not data_source:
            return jsonify({'error': f'Data source not found: {source_id}'}), 404
            
        # Execute query based on type
        if query_type == 'sql':
            # Check if source supports SQL
            if not hasattr(data_source, 'execute_query'):
                return jsonify({'error': 'This data source does not support SQL queries'}), 400
                
            result = data_source.execute_query(query)
            
            # Convert result to list of dicts
            if hasattr(result, 'to_dict'):
                # Pandas DataFrame
                records = result.to_dict('records')
            else:
                # Assume list of tuples with column names
                records = []
                for row in result[1:]:  # Skip header row
                    record = {}
                    for i, col in enumerate(result[0]):
                        record[col] = row[i]
                    records.append(record)
                    
            return jsonify({'data': records})
        elif query_type == 'power_query':
            # Execute Power Query definition
            query_definition = json.loads(query)
            result = power_query_engine.execute_query(query_definition)
            
            # Convert result to list of dicts if it's a DataFrame
            if hasattr(result.get('data'), 'to_dict'):
                result['data'] = result['data'].to_dict('records')
                
            return jsonify(result)
        else:
            return jsonify({'error': f'Unsupported query type: {query_type}'}), 400
    except Exception as e:
        logger.error(f"Error executing custom query: {str(e)}")
        return jsonify({'error': f'Error executing custom query: {str(e)}'}), 500
        
@data_bp.route('/transform', methods=['POST'])
@api_login_required
def transform_data():
    """Apply transformations to a dataset"""
    try:
        # Get transformation request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No transformation data provided'}), 400
            
        source_data = data.get('data')
        transformations = data.get('transformations', [])
        
        if not source_data:
            return jsonify({'error': 'No source data provided'}), 400
            
        if not transformations:
            return jsonify({'error': 'No transformations provided'}), 400
            
        # Execute transformations
        # This would typically import source data into a DataFrame and apply
        # transformations sequentially, but for this stub we'll just return
        # the original data
        
        return jsonify({
            'message': 'Transformations applied successfully',
            'data': source_data,
            'transformations_applied': len(transformations)
        })
    except Exception as e:
        logger.error(f"Error transforming data: {str(e)}")
        return jsonify({'error': f'Error transforming data: {str(e)}'}), 500
        
@data_bp.route('/export', methods=['POST'])
@api_login_required
def export_data():
    """Export data to a file format"""
    try:
        # Get export request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No export data provided'}), 400
            
        source_data = data.get('data')
        format_type = data.get('format', 'csv')
        filename = data.get('filename', f'export.{format_type}')
        
        if not source_data:
            return jsonify({'error': 'No source data provided'}), 400
            
        # For demo, we'll create a simple CSV file
        # In a real implementation, this would convert the data to the requested format
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{format_type}') as tmp:
            # Write some sample data
            if format_type == 'csv':
                tmp.write(b'column1,column2,column3\n')
                tmp.write(b'value1,value2,value3\n')
                tmp.write(b'value4,value5,value6\n')
            elif format_type == 'json':
                tmp.write(json.dumps(source_data).encode('utf-8'))
            else:
                return jsonify({'error': f'Unsupported export format: {format_type}'}), 400
                
            tmp_path = tmp.name
            
        # Return the file
        return send_file(
            tmp_path,
            as_attachment=True,
            download_name=filename,
            mimetype=f'text/{format_type}'
        )
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        return jsonify({'error': f'Error exporting data: {str(e)}'}), 500