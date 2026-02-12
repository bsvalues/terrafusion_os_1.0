"""
Multi-Format Exporter for the CountyDataSync ETL Process.

This module provides functionality for exporting data from DataFrames to multiple formats:
- SQLite
- CSV
- JSON
- GeoJSON (for spatial data)
"""
import os
import json
import logging
import pandas as pd
import sqlite3
import datetime
from typing import Dict, Any, Optional, Union, List, Literal, cast

from sync_service.sqlite_export import SQLiteExporter

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Define export format type
ExportFormat = Literal['sqlite', 'csv', 'json', 'geojson']

class MultiFormatExporter:
    """Class for handling exports to multiple file formats."""
    
    def __init__(self, export_dir: str = 'exports'):
        """Initialize the multi-format exporter.
        
        Args:
            export_dir: Directory where export files will be stored.
        """
        self.export_dir = export_dir
        self.sqlite_exporter = SQLiteExporter(export_dir)
        self._ensure_export_dir()
        
    def _ensure_export_dir(self):
        """Ensure the export directory exists."""
        if not os.path.exists(self.export_dir):
            os.makedirs(self.export_dir)
            logger.info(f"Created export directory: {self.export_dir}")
    
    def export_data(self, 
                   df: pd.DataFrame, 
                   name: str, 
                   format: ExportFormat,
                   timestamp: Optional[datetime.datetime] = None) -> Optional[str]:
        """Export data to the specified format.
        
        Args:
            df: DataFrame containing data to export.
            name: Base name for the export file.
            format: Export format ('sqlite', 'csv', 'json', 'geojson').
            timestamp: Optional timestamp to include in the filename.
            
        Returns:
            Path to the created export file.
        """
        if df.empty:
            logger.info(f"No data to export for {name}")
            return None
            
        if timestamp is None:
            timestamp = datetime.datetime.now()
        
        timestamp_str = timestamp.strftime("%Y%m%d_%H%M%S")
        
        if format == 'sqlite':
            if name == 'stats':
                return self.sqlite_exporter.create_and_load_stats_db(df)
            elif name == 'working':
                return self.sqlite_exporter.create_and_load_working_db(df)
            else:
                # Generic SQLite export
                db_path = os.path.join(self.export_dir, f"{name}_{timestamp_str}.sqlite")
                with sqlite3.connect(db_path) as conn:
                    df.to_sql(name, conn, index=False)
                
                # Create a symlink to the latest version
                latest_link = os.path.join(self.export_dir, f"{name}.sqlite")
                if os.path.exists(latest_link):
                    os.remove(latest_link)
                os.symlink(db_path, latest_link)
                
                logger.info(f"Exported {len(df)} records to SQLite database: {db_path}")
                return db_path
                
        elif format == 'csv':
            # Export to CSV
            file_path = os.path.join(self.export_dir, f"{name}_{timestamp_str}.csv")
            df.to_csv(file_path, index=False)
            
            # Create a symlink to the latest version
            latest_link = os.path.join(self.export_dir, f"{name}.csv")
            if os.path.exists(latest_link):
                os.remove(latest_link)
            os.symlink(file_path, latest_link)
            
            logger.info(f"Exported {len(df)} records to CSV file: {file_path}")
            return file_path
            
        elif format == 'json':
            # Export to JSON
            file_path = os.path.join(self.export_dir, f"{name}_{timestamp_str}.json")
            
            # Convert any datetime objects to ISO format strings for JSON serialization
            df_copy = df.copy()
            for col in df_copy.columns:
                if df_copy[col].dtype == 'datetime64[ns]':
                    df_copy[col] = df_copy[col].apply(lambda x: x.isoformat() if pd.notnull(x) else None)
            
            # Write to JSON file
            df_copy.to_json(file_path, orient='records', date_format='iso')
            
            # Create a symlink to the latest version
            latest_link = os.path.join(self.export_dir, f"{name}.json")
            if os.path.exists(latest_link):
                os.remove(latest_link)
            os.symlink(file_path, latest_link)
            
            logger.info(f"Exported {len(df)} records to JSON file: {file_path}")
            return file_path
            
        elif format == 'geojson':
            # Export to GeoJSON (if the DataFrame has geometry column)
            if 'geometry' not in df.columns:
                logger.warning(f"Cannot export to GeoJSON: no geometry column found in DataFrame")
                return None
                
            file_path = os.path.join(self.export_dir, f"{name}_{timestamp_str}.geojson")
            
            # Try to convert to GeoDataFrame if it's not one already
            try:
                import geopandas as gpd
                
                if not isinstance(df, gpd.GeoDataFrame):
                    gdf = gpd.GeoDataFrame(df, geometry='geometry')
                else:
                    gdf = df
                    
                # Export to GeoJSON
                gdf.to_file(file_path, driver='GeoJSON')
                
                # Create a symlink to the latest version
                latest_link = os.path.join(self.export_dir, f"{name}.geojson")
                if os.path.exists(latest_link):
                    os.remove(latest_link)
                os.symlink(file_path, latest_link)
                
                logger.info(f"Exported {len(df)} records to GeoJSON file: {file_path}")
                return file_path
                
            except ImportError:
                logger.error("Cannot export to GeoJSON: geopandas module not available")
                return None
            except Exception as e:
                logger.error(f"Error exporting to GeoJSON: {str(e)}")
                return None
        else:
            logger.error(f"Unsupported export format: {format}")
            return None
    
    def export_data_multi_format(self, 
                                df: pd.DataFrame, 
                                name: str,
                                formats: List[ExportFormat],
                                timestamp: Optional[datetime.datetime] = None) -> Dict[str, str]:
        """Export data to multiple formats.
        
        Args:
            df: DataFrame containing data to export.
            name: Base name for the export files.
            formats: List of export formats to use.
            timestamp: Optional timestamp to include in the filenames.
            
        Returns:
            Dictionary mapping format names to file paths.
        """
        if timestamp is None:
            timestamp = datetime.datetime.now()
            
        results = {}
        
        for format in formats:
            file_path = self.export_data(df, name, format, timestamp)
            if file_path:
                results[format] = file_path
                
        return results
    
    def merge_data(self, 
                  df: pd.DataFrame, 
                  name: str, 
                  format: ExportFormat,
                  key_columns: List[str]) -> Optional[str]:
        """Merge (upsert) data with an existing file based on key columns.
        
        Args:
            df: DataFrame containing data to merge.
            name: Base name of the existing file.
            format: Format of the file ('sqlite', 'csv', 'json', 'geojson').
            key_columns: List of column names that form the unique key.
            
        Returns:
            Path to the updated file.
        """
        if df.empty:
            logger.info(f"No data to merge for {name}")
            return None
            
        if format == 'sqlite':
            # Use SQLite exporter's merge functionality
            if name == 'stats':
                return self.sqlite_exporter.merge_with_stats_db(df, key_columns)
            elif name == 'working':
                return self.sqlite_exporter.merge_with_working_db(df, key_columns)
            else:
                # Generic SQLite merge
                db_path = os.path.join(self.export_dir, f"{name}.sqlite")
                
                if not os.path.exists(db_path):
                    # If the database doesn't exist, create a new one
                    return self.export_data(df, name, 'sqlite')
                
                logger.info(f"Merging {len(df)} records with SQLite database: {db_path}")
                
                with sqlite3.connect(db_path) as conn:
                    # Read existing data
                    existing_df = pd.read_sql(f"SELECT * FROM {name}", conn)
                    
                    # Merge dataframes
                    cursor = conn.cursor()
                    
                    for _, row in df.iterrows():
                        # Convert any datetime objects to strings for SQLite compatibility
                        row_dict = {}
                        for col in df.columns:
                            if isinstance(row[col], (pd.Timestamp, datetime.datetime)):
                                row_dict[col] = row[col].strftime('%Y-%m-%d %H:%M:%S')
                            else:
                                row_dict[col] = row[col]
                        
                        # Build WHERE clause for key columns
                        where_conditions = " AND ".join([f"{col} = ?" for col in key_columns])
                        params = [row_dict[col] for col in key_columns]
                        
                        # Check if record exists
                        cursor.execute(f"SELECT 1 FROM {name} WHERE {where_conditions}", params)
                        exists = cursor.fetchone() is not None
                        
                        if exists:
                            # Update existing record
                            set_clause = ", ".join([f"{col} = ?" for col in df.columns if col not in key_columns])
                            update_params = [row_dict[col] for col in df.columns if col not in key_columns]
                            cursor.execute(f"UPDATE {name} SET {set_clause} WHERE {where_conditions}", update_params + params)
                        else:
                            # Insert new record
                            cols = ", ".join(df.columns)
                            placeholders = ", ".join(["?" for _ in df.columns])
                            insert_params = [row_dict[col] for col in df.columns]
                            cursor.execute(f"INSERT INTO {name} ({cols}) VALUES ({placeholders})", insert_params)
                    
                    conn.commit()
                    logger.info(f"Successfully merged {len(df)} records with SQLite database")
                
                return db_path
            
        elif format == 'csv':
            # Read the existing CSV file
            csv_path = os.path.join(self.export_dir, f"{name}.csv")
            
            if not os.path.exists(csv_path):
                # If the file doesn't exist, create a new one
                return self.export_data(df, name, 'csv')
            
            logger.info(f"Merging {len(df)} records with CSV file: {csv_path}")
            
            # Read existing data
            existing_df = pd.read_csv(csv_path)
            
            # Create a composite key column for both DataFrames
            key_cols = [col for col in key_columns if col in existing_df.columns and col in df.columns]
            
            if not key_cols:
                logger.error(f"Cannot merge: no common key columns found")
                return None
                
            # Create a unique identifier for each row based on key columns
            existing_df['_merge_key'] = existing_df[key_cols].astype(str).agg('-'.join, axis=1)
            df['_merge_key'] = df[key_cols].astype(str).agg('-'.join, axis=1)
            
            # Split new data into rows to update and rows to insert
            existing_keys = set(existing_df['_merge_key'])
            update_mask = df['_merge_key'].isin(existing_keys)
            
            rows_to_update = df[update_mask]
            rows_to_insert = df[~update_mask]
            
            # Update existing rows
            updated_df = existing_df.copy()
            for merge_key in rows_to_update['_merge_key'].unique():
                update_row = rows_to_update[rows_to_update['_merge_key'] == merge_key].iloc[0]
                mask = updated_df['_merge_key'] == merge_key
                
                for col in df.columns:
                    if col != '_merge_key' and col not in key_cols:
                        updated_df.loc[mask, col] = update_row[col]
            
            # Remove temporary column
            rows_to_insert = rows_to_insert.drop(columns=['_merge_key'])
            updated_df = updated_df.drop(columns=['_merge_key'])
            
            # Append new rows
            final_df = pd.concat([updated_df, rows_to_insert], ignore_index=True)
            
            # Save to a new CSV file
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            new_csv_path = os.path.join(self.export_dir, f"{name}_{timestamp}.csv")
            final_df.to_csv(new_csv_path, index=False)
            
            # Update the symlink
            if os.path.exists(csv_path):
                os.remove(csv_path)
            os.symlink(new_csv_path, csv_path)
            
            logger.info(f"Successfully merged {len(df)} records with CSV file")
            return new_csv_path
            
        elif format == 'json':
            # Read the existing JSON file
            json_path = os.path.join(self.export_dir, f"{name}.json")
            
            if not os.path.exists(json_path):
                # If the file doesn't exist, create a new one
                return self.export_data(df, name, 'json')
            
            logger.info(f"Merging {len(df)} records with JSON file: {json_path}")
            
            # Read existing data
            existing_df = pd.read_json(json_path, orient='records')
            
            # Create a composite key column for both DataFrames
            key_cols = [col for col in key_columns if col in existing_df.columns and col in df.columns]
            
            if not key_cols:
                logger.error(f"Cannot merge: no common key columns found")
                return None
                
            # Create a unique identifier for each row based on key columns
            existing_df['_merge_key'] = existing_df[key_cols].astype(str).agg('-'.join, axis=1)
            df['_merge_key'] = df[key_cols].astype(str).agg('-'.join, axis=1)
            
            # Split new data into rows to update and rows to insert
            existing_keys = set(existing_df['_merge_key'])
            update_mask = df['_merge_key'].isin(existing_keys)
            
            rows_to_update = df[update_mask]
            rows_to_insert = df[~update_mask]
            
            # Update existing rows
            updated_df = existing_df.copy()
            for merge_key in rows_to_update['_merge_key'].unique():
                update_row = rows_to_update[rows_to_update['_merge_key'] == merge_key].iloc[0]
                mask = updated_df['_merge_key'] == merge_key
                
                for col in df.columns:
                    if col != '_merge_key' and col not in key_cols:
                        updated_df.loc[mask, col] = update_row[col]
            
            # Remove temporary column
            rows_to_insert = rows_to_insert.drop(columns=['_merge_key'])
            updated_df = updated_df.drop(columns=['_merge_key'])
            
            # Append new rows
            final_df = pd.concat([updated_df, rows_to_insert], ignore_index=True)
            
            # Convert any datetime objects to ISO format strings for JSON serialization
            for col in final_df.columns:
                if final_df[col].dtype == 'datetime64[ns]':
                    final_df[col] = final_df[col].apply(lambda x: x.isoformat() if pd.notnull(x) else None)
            
            # Save to a new JSON file
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            new_json_path = os.path.join(self.export_dir, f"{name}_{timestamp}.json")
            final_df.to_json(new_json_path, orient='records', date_format='iso')
            
            # Update the symlink
            if os.path.exists(json_path):
                os.remove(json_path)
            os.symlink(new_json_path, json_path)
            
            logger.info(f"Successfully merged {len(df)} records with JSON file")
            return new_json_path
            
        elif format == 'geojson':
            # GeoJSON merge is more complex, requires geopandas
            try:
                import geopandas as gpd
                
                # Check if DataFrame has geometry column
                if 'geometry' not in df.columns:
                    logger.warning(f"Cannot merge with GeoJSON: no geometry column found in DataFrame")
                    return None
                
                # Convert to GeoDataFrame if needed
                if not isinstance(df, gpd.GeoDataFrame):
                    gdf = gpd.GeoDataFrame(df, geometry='geometry')
                else:
                    gdf = df
                
                # Path to the existing GeoJSON file
                geojson_path = os.path.join(self.export_dir, f"{name}.geojson")
                
                if not os.path.exists(geojson_path):
                    # If the file doesn't exist, create a new one
                    return self.export_data(gdf, name, 'geojson')
                
                logger.info(f"Merging {len(gdf)} records with GeoJSON file: {geojson_path}")
                
                # Read existing data
                existing_gdf = gpd.read_file(geojson_path)
                
                # Create a composite key column for both GeoDataFrames
                key_cols = [col for col in key_columns if col in existing_gdf.columns and col in gdf.columns]
                
                if not key_cols:
                    logger.error(f"Cannot merge: no common key columns found")
                    return None
                    
                # Create a unique identifier for each row based on key columns
                existing_gdf['_merge_key'] = existing_gdf[key_cols].astype(str).agg('-'.join, axis=1)
                gdf['_merge_key'] = gdf[key_cols].astype(str).agg('-'.join, axis=1)
                
                # Split new data into rows to update and rows to insert
                existing_keys = set(existing_gdf['_merge_key'])
                update_mask = gdf['_merge_key'].isin(existing_keys)
                
                rows_to_update = gdf[update_mask]
                rows_to_insert = gdf[~update_mask]
                
                # Update existing rows (excluding geometry)
                updated_gdf = existing_gdf.copy()
                for merge_key in rows_to_update['_merge_key'].unique():
                    update_row = rows_to_update[rows_to_update['_merge_key'] == merge_key].iloc[0]
                    mask = updated_gdf['_merge_key'] == merge_key
                    
                    for col in gdf.columns:
                        if col != '_merge_key' and col != 'geometry' and col not in key_cols:
                            updated_gdf.loc[mask, col] = update_row[col]
                    
                    # Update geometry separately
                    updated_gdf.loc[mask, 'geometry'] = update_row['geometry']
                
                # Remove temporary column
                rows_to_insert = rows_to_insert.drop(columns=['_merge_key'])
                updated_gdf = updated_gdf.drop(columns=['_merge_key'])
                
                # Append new rows
                final_gdf = gpd.GeoDataFrame(pd.concat([updated_gdf, rows_to_insert], ignore_index=True), geometry='geometry')
                
                # Save to a new GeoJSON file
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                new_geojson_path = os.path.join(self.export_dir, f"{name}_{timestamp}.geojson")
                final_gdf.to_file(new_geojson_path, driver='GeoJSON')
                
                # Update the symlink
                if os.path.exists(geojson_path):
                    os.remove(geojson_path)
                os.symlink(new_geojson_path, geojson_path)
                
                logger.info(f"Successfully merged {len(gdf)} records with GeoJSON file")
                return new_geojson_path
                
            except ImportError:
                logger.error("Cannot merge with GeoJSON: geopandas module not available")
                return None
            except Exception as e:
                logger.error(f"Error merging with GeoJSON: {str(e)}")
                return None
        else:
            logger.error(f"Unsupported merge format: {format}")
            return None