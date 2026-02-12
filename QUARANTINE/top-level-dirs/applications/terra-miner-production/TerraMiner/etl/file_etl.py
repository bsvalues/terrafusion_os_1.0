"""
File-based ETL plugins for ingesting data from various file formats.

These plugins provide generic ETL capabilities for:
- CSV files
- Excel files
- JSON files
- XML files
- Geospatial files (GeoJSON, Shapefile, etc.)
"""
import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
import tempfile
import shutil
import urllib.request
from pathlib import Path

from app import db
from etl.base import BaseETL
from etl.file_parser import FileParser

# Configure logger
logger = logging.getLogger(__name__)

class FileETL(BaseETL):
    """Base class for file-based ETL plugins."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the file-based ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - file_path: Path to the input file (local or URL)
                - table_name: Name of the database table to load data into
                - schema: Database schema definitions
                - file_format: Format of the input file (default: auto-detect)
                - delimiter: Field delimiter for CSV files (default: ',')
                - sheet_name: Sheet name for Excel files (default: 0)
                - has_header: Whether the file has headers (default: True)
                - encoding: File encoding (default: 'utf-8')
                - primary_key: Column(s) to use as primary key
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('file_path', None)
        self.config.setdefault('table_name', None)
        self.config.setdefault('schema', {})
        self.config.setdefault('file_format', None)  # Auto-detect by default
        self.config.setdefault('delimiter', ',')
        self.config.setdefault('sheet_name', 0)
        self.config.setdefault('has_header', True)
        self.config.setdefault('encoding', 'utf-8')
        self.config.setdefault('primary_key', None)
        
        # Validate required config
        if not self.config['file_path']:
            raise ValueError("file_path is required for file-based ETL")
        
        if not self.config['table_name']:
            raise ValueError("table_name is required for file-based ETL")
            
        # Initialize file parser
        self.parser = FileParser()
        
        # Initialize local state
        self.local_file_path = None
        self.is_temp_file = False
    
    def _get_file_format(self) -> str:
        """
        Determine the file format from the file path.
        
        Returns:
            str: Detected file format ('csv', 'excel', 'json', 'xml', 'geospatial')
        """
        if self.config['file_format']:
            return self.config['file_format'].lower()
            
        # Auto-detect from file extension
        file_path = self.config['file_path']
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in ['.csv', '.tsv', '.txt']:
            return 'csv'
        elif ext in ['.xlsx', '.xls']:
            return 'excel'
        elif ext in ['.json']:
            return 'json'
        elif ext in ['.xml']:
            return 'xml'
        elif ext in ['.geojson', '.shp', '.kml', '.gpkg']:
            return 'geospatial'
        else:
            logger.warning(f"Unknown file extension: {ext}, defaulting to CSV")
            return 'csv'
    
    def _prepare_file(self):
        """
        Prepare the input file for processing.
        
        If the file is a URL, download it to a temporary file.
        """
        file_path = self.config['file_path']
        
        # Check if file is a URL
        if file_path.startswith(('http://', 'https://', 'ftp://')):
            # Create a temp file with the appropriate extension
            ext = os.path.splitext(file_path)[1]
            fd, temp_path = tempfile.mkstemp(suffix=ext)
            os.close(fd)
            
            try:
                # Download the file
                logger.info(f"Downloading file from URL: {file_path}")
                urllib.request.urlretrieve(file_path, temp_path)
                self.local_file_path = temp_path
                self.is_temp_file = True
                logger.info(f"File downloaded to: {temp_path}")
                
            except Exception as e:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                logger.exception(f"Error downloading file from URL: {file_path}")
                raise
                
        else:
            # Local file path
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Input file not found: {file_path}")
                
            self.local_file_path = file_path
            self.is_temp_file = False
    
    def _cleanup(self):
        """Clean up any temporary files."""
        if self.is_temp_file and self.local_file_path and os.path.exists(self.local_file_path):
            try:
                os.unlink(self.local_file_path)
                logger.debug(f"Removed temporary file: {self.local_file_path}")
            except Exception as e:
                logger.warning(f"Failed to remove temporary file {self.local_file_path}: {str(e)}")


class CSVFileETL(FileETL):
    """ETL plugin for CSV files."""
    
    def extract(self) -> Any:
        """
        Extract data from a CSV file.
        
        Returns:
            Any: The raw data from the CSV file
        """
        try:
            self._prepare_file()
            
            # Read the CSV file
            logger.info(f"Reading CSV file: {self.local_file_path}")
            data = FileParser.read_csv(
                self.local_file_path,
                delimiter=self.config['delimiter'],
                has_header=self.config['has_header'],
                encoding=self.config['encoding']
            )
            
            logger.info(f"Successfully read CSV file with {len(data)} records")
            return data
            
        except Exception as e:
            logger.exception(f"Error extracting data from CSV file: {str(e)}")
            raise
            
        finally:
            self._cleanup()
    
    def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """
        Transform CSV data.
        
        Args:
            raw_data (Any): The raw data from the extract step
            
        Returns:
            List[Dict[str, Any]]: The processed data records
        """
        try:
            # Convert to list of dictionaries if it's a DataFrame
            if hasattr(raw_data, 'to_dict'):
                records = raw_data.to_dict('records')
            else:
                records = raw_data
            
            # Apply data type conversions based on schema
            schema = self.config.get('schema', {})
            if schema:
                for record in records:
                    for field, field_type in schema.items():
                        if field in record and record[field] is not None:
                            try:
                                if field_type == 'int':
                                    record[field] = int(record[field])
                                elif field_type == 'float':
                                    record[field] = float(record[field])
                                elif field_type == 'bool':
                                    if isinstance(record[field], str):
                                        value = record[field].lower()
                                        record[field] = value in ('true', 'yes', 'y', '1')
                                    else:
                                        record[field] = bool(record[field])
                                elif field_type == 'date':
                                    if isinstance(record[field], str):
                                        record[field] = datetime.fromisoformat(record[field]).date()
                                elif field_type == 'datetime':
                                    if isinstance(record[field], str):
                                        record[field] = datetime.fromisoformat(record[field])
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Failed to convert field '{field}' to type '{field_type}': {str(e)}")
            
            logger.info(f"Transformed {len(records)} records")
            return records
            
        except Exception as e:
            logger.exception(f"Error transforming CSV data: {str(e)}")
            raise
    
    def load(self, processed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Load processed data into the database.
        
        Args:
            processed_data (List[Dict[str, Any]]): The processed data records
            
        Returns:
            Dict[str, Any]: Load result information
        """
        try:
            table_name = self.config['table_name']
            record_count = len(processed_data)
            
            # Check if any records to load
            if not record_count:
                logger.warning(f"No records to load into table: {table_name}")
                return {
                    "records_processed": 0,
                    "table_name": table_name,
                    "success": True,
                    "message": "No records to load"
                }
            
            # Create database engine and connection
            from sqlalchemy import create_engine, Table, Column, MetaData, insert, select
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            from sqlalchemy import String, Integer, Float, Boolean, Date, DateTime, Text
            
            # Get database URL from environment or config
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                raise ValueError("DATABASE_URL environment variable is not set")
            
            # Create engine and metadata
            engine = create_engine(database_url)
            metadata = MetaData()
            
            # Create table schema based on data and config
            columns = []
            
            # Get sample record to detect types
            sample = processed_data[0]
            schema = self.config.get('schema', {})
            primary_key = self.config.get('primary_key')
            
            for field, value in sample.items():
                # Determine SQL type
                if field in schema:
                    field_type = schema[field]
                    if field_type == 'int':
                        col_type = Integer()
                    elif field_type == 'float':
                        col_type = Float()
                    elif field_type == 'bool':
                        col_type = Boolean()
                    elif field_type == 'date':
                        col_type = Date()
                    elif field_type == 'datetime':
                        col_type = DateTime()
                    else:
                        col_type = String(255)
                else:
                    # Auto-detect type
                    if isinstance(value, int):
                        col_type = Integer()
                    elif isinstance(value, float):
                        col_type = Float()
                    elif isinstance(value, bool):
                        col_type = Boolean()
                    elif isinstance(value, datetime):
                        col_type = DateTime()
                    elif isinstance(value, datetime.date):
                        col_type = Date()
                    elif value and len(str(value)) > 255:
                        col_type = Text()
                    else:
                        col_type = String(255)
                
                # Check if field is primary key
                is_primary_key = primary_key and field == primary_key
                if is_primary_key:
                    columns.append(Column(field, col_type, primary_key=True))
                else:
                    columns.append(Column(field, col_type))
            
            # Create table if it doesn't exist
            table = Table(table_name, metadata, *columns)
            metadata.create_all(engine)
            
            # Insert or update data
            with engine.connect() as conn:
                if primary_key:
                    # Use PostgreSQL-specific insert with ON CONFLICT clause
                    for record in processed_data:
                        stmt = pg_insert(table).values(**record)
                        stmt = stmt.on_conflict_do_update(
                            index_elements=[primary_key],
                            set_={k: stmt.excluded[k] for k in record.keys() if k != primary_key}
                        )
                        conn.execute(stmt)
                else:
                    # Simple insert
                    conn.execute(insert(table), processed_data)
                
                conn.commit()
            
            logger.info(f"Successfully loaded {record_count} records into table: {table_name}")
            
            return {
                "records_processed": record_count,
                "table_name": table_name,
                "success": True,
                "message": f"Loaded {record_count} records"
            }
            
        except Exception as e:
            logger.exception(f"Error loading data into database: {str(e)}")
            raise


class ExcelFileETL(FileETL):
    """ETL plugin for Excel files."""
    
    def extract(self) -> Any:
        """
        Extract data from an Excel file.
        
        Returns:
            Any: The raw data from the Excel file
        """
        try:
            self._prepare_file()
            
            # Read the Excel file
            logger.info(f"Reading Excel file: {self.local_file_path}")
            data = FileParser.read_excel(
                self.local_file_path,
                sheet_name=self.config['sheet_name'],
                has_header=self.config['has_header']
            )
            
            logger.info(f"Successfully read Excel file with {len(data)} records")
            return data
            
        except Exception as e:
            logger.exception(f"Error extracting data from Excel file: {str(e)}")
            raise
            
        finally:
            self._cleanup()
    
    def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """
        Transform Excel data.
        
        Args:
            raw_data (Any): The raw data from the extract step
            
        Returns:
            List[Dict[str, Any]]: The processed data records
        """
        # We can reuse the same transformation logic as CSVFileETL
        return CSVFileETL.transform(self, raw_data)
    
    def load(self, processed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Load processed data into the database.
        
        Args:
            processed_data (List[Dict[str, Any]]): The processed data records
            
        Returns:
            Dict[str, Any]: Load result information
        """
        # We can reuse the same loading logic as CSVFileETL
        return CSVFileETL.load(self, processed_data)


class JSONFileETL(FileETL):
    """ETL plugin for JSON files."""
    
    def extract(self) -> Any:
        """
        Extract data from a JSON file.
        
        Returns:
            Any: The raw data from the JSON file
        """
        try:
            self._prepare_file()
            
            # Read the JSON file
            logger.info(f"Reading JSON file: {self.local_file_path}")
            data = FileParser.read_json(self.local_file_path)
            
            logger.info(f"Successfully read JSON file")
            return data
            
        except Exception as e:
            logger.exception(f"Error extracting data from JSON file: {str(e)}")
            raise
            
        finally:
            self._cleanup()
    
    def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """
        Transform JSON data.
        
        Args:
            raw_data (Any): The raw data from the extract step
            
        Returns:
            List[Dict[str, Any]]: The processed data records
        """
        try:
            # Handle different JSON structures
            records = []
            
            if isinstance(raw_data, list):
                # List of objects
                if all(isinstance(item, dict) for item in raw_data):
                    records = raw_data
                else:
                    # List of non-dictionary values, convert to dictionaries
                    for i, item in enumerate(raw_data):
                        records.append({"index": i, "value": item})
            elif isinstance(raw_data, dict):
                # Single object or keyed objects
                root_path = self.config.get('json_path', '')
                
                if root_path:
                    # Extract data from a specific path
                    parts = root_path.split('.')
                    current = raw_data
                    for part in parts:
                        if part and part in current:
                            current = current[part]
                        else:
                            raise ValueError(f"JSON path '{root_path}' not found in data")
                    
                    if isinstance(current, list):
                        records = current if all(isinstance(item, dict) for item in current) else [{"value": item} for item in current]
                    elif isinstance(current, dict):
                        records = [current]
                    else:
                        records = [{"value": current}]
                else:
                    # No specific path, assume the whole object is a record
                    records = [raw_data]
            else:
                # Scalar value
                records = [{"value": raw_data}]
            
            # Apply data type conversions
            schema = self.config.get('schema', {})
            if schema:
                for record in records:
                    for field, field_type in schema.items():
                        if field in record and record[field] is not None:
                            try:
                                if field_type == 'int':
                                    record[field] = int(record[field])
                                elif field_type == 'float':
                                    record[field] = float(record[field])
                                elif field_type == 'bool':
                                    if isinstance(record[field], str):
                                        value = record[field].lower()
                                        record[field] = value in ('true', 'yes', 'y', '1')
                                    else:
                                        record[field] = bool(record[field])
                                elif field_type == 'date':
                                    if isinstance(record[field], str):
                                        record[field] = datetime.fromisoformat(record[field]).date()
                                elif field_type == 'datetime':
                                    if isinstance(record[field], str):
                                        record[field] = datetime.fromisoformat(record[field])
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Failed to convert field '{field}' to type '{field_type}': {str(e)}")
            
            logger.info(f"Transformed {len(records)} records")
            return records
            
        except Exception as e:
            logger.exception(f"Error transforming JSON data: {str(e)}")
            raise
    
    def load(self, processed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Load processed data into the database.
        
        Args:
            processed_data (List[Dict[str, Any]]): The processed data records
            
        Returns:
            Dict[str, Any]: Load result information
        """
        # We can reuse the same loading logic as CSVFileETL
        return CSVFileETL.load(self, processed_data)


class XMLFileETL(FileETL):
    """ETL plugin for XML files."""
    
    def extract(self) -> Any:
        """
        Extract data from an XML file.
        
        Returns:
            Any: The raw data from the XML file
        """
        try:
            self._prepare_file()
            
            # Read the XML file
            logger.info(f"Reading XML file: {self.local_file_path}")
            
            # Use XPath expression if provided
            xpath = self.config.get('xpath')
            if xpath:
                logger.info(f"Using XPath: {xpath}")
                
            data = FileParser.read_xml(self.local_file_path, xpath=xpath)
            
            logger.info(f"Successfully read XML file")
            return data
            
        except Exception as e:
            logger.exception(f"Error extracting data from XML file: {str(e)}")
            raise
            
        finally:
            self._cleanup()
    
    def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """
        Transform XML data.
        
        Args:
            raw_data (Any): The raw data from the extract step
            
        Returns:
            List[Dict[str, Any]]: The processed data records
        """
        try:
            import xml.etree.ElementTree as ET
            
            records = []
            
            # Get XML elements for processing
            elements = []
            if isinstance(raw_data, ET.ElementTree):
                root = raw_data.getroot()
                record_path = self.config.get('record_path')
                if record_path:
                    elements = root.findall(record_path)
                else:
                    # Default to root's children
                    elements = list(root)
            elif isinstance(raw_data, list) and all(isinstance(item, ET.Element) for item in raw_data):
                elements = raw_data
            elif isinstance(raw_data, ET.Element):
                elements = [raw_data]
            
            # Process each element
            field_map = self.config.get('field_map', {})
            for element in elements:
                record = {}
                
                # Extract attributes
                for attr_name, attr_value in element.attrib.items():
                    field_name = field_map.get(attr_name, attr_name)
                    record[field_name] = attr_value
                
                # Extract child elements
                for child in element:
                    field_name = field_map.get(child.tag, child.tag)
                    # Check for nested elements
                    if len(list(child)) > 0:
                        # Complex element, skip for now
                        continue
                    else:
                        # Simple element with text
                        record[field_name] = child.text
                
                # Add the record if it has data
                if record:
                    records.append(record)
            
            # Apply schema and conversions (reuse JSON logic)
            return JSONFileETL.transform(self, records)
            
        except Exception as e:
            logger.exception(f"Error transforming XML data: {str(e)}")
            raise
    
    def load(self, processed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Load processed data into the database.
        
        Args:
            processed_data (List[Dict[str, Any]]): The processed data records
            
        Returns:
            Dict[str, Any]: Load result information
        """
        # We can reuse the same loading logic as CSVFileETL
        return CSVFileETL.load(self, processed_data)


class GeospatialFileETL(FileETL):
    """ETL plugin for geospatial files."""
    
    def extract(self) -> Any:
        """
        Extract data from a geospatial file.
        
        Returns:
            Any: The raw data from the geospatial file
        """
        try:
            self._prepare_file()
            
            # Read the geospatial file
            logger.info(f"Reading geospatial file: {self.local_file_path}")
            data = FileParser.read_geospatial(self.local_file_path)
            
            logger.info(f"Successfully read geospatial file with {len(data)} features")
            return data
            
        except Exception as e:
            logger.exception(f"Error extracting data from geospatial file: {str(e)}")
            raise
            
        finally:
            self._cleanup()
    
    def transform(self, raw_data: Any) -> Any:
        """
        Transform geospatial data.
        
        Args:
            raw_data (Any): The raw data from the extract step
            
        Returns:
            Any: The processed data
        """
        try:
            import geopandas as gpd
            
            # Check if it's a GeoDataFrame
            if not isinstance(raw_data, gpd.GeoDataFrame):
                raise ValueError("Expected a GeoDataFrame from the extract step")
            
            # Make a copy to avoid modifying the original
            gdf = raw_data.copy()
            
            # Apply coordinate system transformation if needed
            target_crs = self.config.get('target_crs')
            if target_crs:
                logger.info(f"Transforming coordinate system to {target_crs}")
                gdf = gdf.to_crs(target_crs)
            
            # Apply attribute filtering
            filter_expr = self.config.get('filter_expr')
            if filter_expr:
                logger.info(f"Applying filter: {filter_expr}")
                gdf = gdf.query(filter_expr)
            
            # Select specific columns if needed
            columns = self.config.get('columns')
            if columns:
                logger.info(f"Selecting columns: {columns}")
                gdf = gdf[columns]
            
            # Apply schema conversions and rename fields
            field_map = self.config.get('field_map', {})
            if field_map:
                logger.info(f"Applying field mapping: {field_map}")
                gdf = gdf.rename(columns=field_map)
            
            logger.info(f"Transformed geospatial data: {len(gdf)} features")
            return gdf
            
        except Exception as e:
            logger.exception(f"Error transforming geospatial data: {str(e)}")
            raise
    
    def load(self, processed_data: Any) -> Dict[str, Any]:
        """
        Load processed geospatial data into PostGIS.
        
        Args:
            processed_data (Any): The processed geospatial data
            
        Returns:
            Dict[str, Any]: Load result information
        """
        try:
            import geopandas as gpd
            from sqlalchemy import create_engine
            
            # Check if it's a GeoDataFrame
            if not isinstance(processed_data, gpd.GeoDataFrame):
                raise ValueError("Expected a GeoDataFrame from the transform step")
            
            # Get database URL from environment or config
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                raise ValueError("DATABASE_URL environment variable is not set")
            
            table_name = self.config['table_name']
            if_exists = self.config.get('if_exists', 'replace')
            
            # Create engine
            engine = create_engine(database_url)
            
            # Write to PostGIS
            logger.info(f"Writing {len(processed_data)} features to PostGIS table '{table_name}'")
            processed_data.to_postgis(
                table_name,
                engine,
                if_exists=if_exists,
                index=False
            )
            
            logger.info(f"Successfully loaded {len(processed_data)} features into PostGIS table")
            
            return {
                "records_processed": len(processed_data),
                "table_name": table_name,
                "success": True,
                "message": f"Loaded {len(processed_data)} features into PostGIS table"
            }
            
        except Exception as e:
            logger.exception(f"Error loading geospatial data into PostGIS: {str(e)}")
            raise