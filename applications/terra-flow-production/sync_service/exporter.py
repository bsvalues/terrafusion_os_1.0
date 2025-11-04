"""
Multi-Format Exporter Module for Benton County GeoAssessmentPro

This module provides functionality to export data in various formats
for the Assessment Data Integration Hub.
"""

import os
import json
import logging
import datetime
import sqlite3
import pandas as pd
from typing import Dict, Any, Optional, List, Union
from contextlib import contextmanager

# Configure logging
logger = logging.getLogger(__name__)

class MultiFormatExporter:
    """
    MultiFormatExporter handles exporting data to various formats.
    """
    
    def __init__(self, export_dir: str = "exports"):
        """Initialize the exporter"""
        self.export_dir = export_dir
        
        # Ensure the export directory exists
        if not os.path.exists(self.export_dir):
            os.makedirs(self.export_dir, exist_ok=True)
        
        # Initialize supported formats
        self.supported_formats = {
            "csv": self._export_csv,
            "excel": self._export_excel,
            "json": self._export_json,
            "geojson": self._export_geojson,
            "sqlite": self._export_sqlite,
        }
        
        logger.info("MultiFormatExporter initialized with %d supported formats", len(self.supported_formats))
    
    def export_dataframe(self, df: pd.DataFrame, data_type: str, export_format: str,
                        metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Export a pandas DataFrame to the specified format.
        
        Args:
            df: The DataFrame to export
            data_type: The type of data (property, sales, valuation, etc.)
            export_format: The format to export to (csv, excel, json, geojson, sqlite)
            metadata: Optional metadata to include in the export
            
        Returns:
            Dictionary with export result information
        """
        if df.empty:
            return {
                "status": "warning",
                "message": "No data to export",
                "records": 0,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        
        # Create data type subdirectory if it doesn't exist
        data_type_dir = os.path.join(self.export_dir, data_type)
        if not os.path.exists(data_type_dir):
            os.makedirs(data_type_dir, exist_ok=True)
        
        # Validate export format
        if export_format not in self.supported_formats:
            return {
                "status": "error",
                "message": f"Unsupported export format: {export_format}",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        
        # Generate filename with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"{data_type}_{timestamp}"
        
        # Add metadata if provided
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "export_date": datetime.datetime.now().isoformat(),
            "record_count": len(df),
            "data_type": data_type,
            "export_format": export_format,
            "columns": list(df.columns)
        })
        
        try:
            # Call the appropriate export function
            export_func = self.supported_formats[export_format]
            file_path = export_func(df, data_type_dir, base_filename, metadata)
            
            # Get relative file path for return value
            rel_path = os.path.join(data_type, os.path.basename(file_path))
            
            # Create the result
            result = {
                "status": "success",
                "message": f"Data exported successfully to {export_format} format",
                "data_type": data_type,
                "format": export_format,
                "records": len(df),
                "file_path": rel_path,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            logger.info("Exported %d records to %s", len(df), file_path)
            return result
            
        except Exception as e:
            logger.error("Error exporting data: %s", str(e))
            return {
                "status": "error",
                "message": f"Error exporting data: {str(e)}",
                "data_type": data_type,
                "format": export_format,
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    def _export_csv(self, df: pd.DataFrame, output_dir: str, base_filename: str,
                  metadata: Dict[str, Any]) -> str:
        """Export to CSV format"""
        # Create file path
        file_path = os.path.join(output_dir, f"{base_filename}.csv")
        
        # Export to CSV
        df.to_csv(file_path, index=False)
        
        # Write metadata to a sidecar file
        metadata_path = os.path.join(output_dir, f"{base_filename}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return file_path
    
    def _export_excel(self, df: pd.DataFrame, output_dir: str, base_filename: str,
                    metadata: Dict[str, Any]) -> str:
        """Export to Excel format"""
        # Create file path
        file_path = os.path.join(output_dir, f"{base_filename}.xlsx")
        
        # Create a writer
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            # Write data to a sheet
            df.to_excel(writer, sheet_name='Data', index=False)
            
            # Create a metadata sheet
            metadata_df = pd.DataFrame([
                {"Key": key, "Value": str(value)} 
                for key, value in metadata.items()
            ])
            metadata_df.to_excel(writer, sheet_name='Metadata', index=False)
        
        return file_path
    
    def _export_json(self, df: pd.DataFrame, output_dir: str, base_filename: str,
                   metadata: Dict[str, Any]) -> str:
        """Export to JSON format"""
        # Create file path
        file_path = os.path.join(output_dir, f"{base_filename}.json")
        
        # Convert DataFrame to records
        records = df.to_dict(orient='records')
        
        # Create JSON with metadata
        output = {
            "metadata": metadata,
            "data": records
        }
        
        # Write to file
        with open(file_path, 'w') as f:
            json.dump(output, f, indent=2)
        
        return file_path
    
    def _export_geojson(self, df: pd.DataFrame, output_dir: str, base_filename: str,
                      metadata: Dict[str, Any]) -> str:
        """Export to GeoJSON format"""
        # Create file path
        file_path = os.path.join(output_dir, f"{base_filename}.geojson")
        
        # Check if we have latitude and longitude
        if 'latitude' not in df.columns or 'longitude' not in df.columns:
            # Try to find lat/lon columns with different names
            lat_cols = [col for col in df.columns if 'lat' in col.lower()]
            lon_cols = [col for col in df.columns if 'lon' in col.lower()]
            
            if lat_cols and lon_cols:
                # Use the first matching columns
                df['latitude'] = df[lat_cols[0]]
                df['longitude'] = df[lon_cols[0]]
            else:
                # Add dummy coordinates to satisfy GeoJSON format
                df['latitude'] = 46.2112  # Benton County, WA
                df['longitude'] = -119.1372
        
        # Create features
        features = []
        
        for _, row in df.iterrows():
            # Convert row to dict
            properties = row.drop(['latitude', 'longitude']).to_dict()
            
            # Convert datetime objects to strings
            for key, value in properties.items():
                if isinstance(value, (datetime.datetime, datetime.date)):
                    properties[key] = value.isoformat()
            
            # Create feature
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(row['longitude']), float(row['latitude'])]
                },
                "properties": properties
            }
            
            features.append(feature)
        
        # Create GeoJSON object
        geojson = {
            "type": "FeatureCollection",
            "metadata": metadata,
            "features": features
        }
        
        # Write to file
        with open(file_path, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        return file_path
    
    def _export_sqlite(self, df: pd.DataFrame, output_dir: str, base_filename: str,
                     metadata: Dict[str, Any]) -> str:
        """Export to SQLite format"""
        # Create file path
        file_path = os.path.join(output_dir, f"{base_filename}.db")
        
        # Connect to SQLite database
        with sqlite3.connect(file_path) as conn:
            # Create cursor
            cursor = conn.cursor()
            
            # Create a table for the data
            df.to_sql('data', conn, if_exists='replace', index=False)
            
            # Create a table for metadata
            cursor.execute('''
                CREATE TABLE metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
            ''')
            
            # Insert metadata
            for key, value in metadata.items():
                if isinstance(value, (list, dict)):
                    value_str = json.dumps(value)
                else:
                    value_str = str(value)
                
                cursor.execute(
                    'INSERT INTO metadata (key, value) VALUES (?, ?)',
                    (key, value_str)
                )
            
            # Commit changes
            conn.commit()
        
        return file_path

# Create a singleton instance
multi_format_exporter = MultiFormatExporter()