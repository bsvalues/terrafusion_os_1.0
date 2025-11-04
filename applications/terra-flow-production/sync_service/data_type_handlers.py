"""
Data Type Handlers for DatabaseProjectSyncService

This module provides specialized handlers for project-specific data types
such as geometric data (GIS), document references, and other custom types
that require special handling during synchronization.
"""

import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple, Union

import sqlalchemy as sa
from sqlalchemy.sql import text

logger = logging.getLogger(__name__)


class DataTypeHandler(ABC):
    """Abstract base class for data type handlers."""
    
    @abstractmethod
    def can_handle(self, column_type: str) -> bool:
        """
        Check if this handler can handle the given column type.
        
        Args:
            column_type: The SQL column type name
            
        Returns:
            True if this handler can handle the column type, False otherwise
        """
        pass
    
    @abstractmethod
    def extract_value(self, column_name: str, value: Any) -> Any:
        """
        Extract a value from the database for synchronization.
        
        Args:
            column_name: Name of the column
            value: Raw value from the database
            
        Returns:
            Processed value that can be stored in JSON
        """
        pass
    
    @abstractmethod
    def prepare_value(self, column_name: str, value: Any) -> Any:
        """
        Prepare a value for insertion into the database.
        
        Args:
            column_name: Name of the column
            value: Value from the sync process
            
        Returns:
            Value formatted for database insertion
        """
        pass
    
    @abstractmethod
    def compare_values(self, source_value: Any, target_value: Any) -> bool:
        """
        Compare two values to determine if they are equivalent.
        
        Args:
            source_value: Value from source database
            target_value: Value from target database
            
        Returns:
            True if values are equivalent, False otherwise
        """
        pass


class GeometricDataHandler(DataTypeHandler):
    """Handler for geometric data types (GIS)."""
    
    # List of PostGIS geometry types
    GEOMETRY_TYPES = [
        'geometry', 'geography', 'point', 'linestring', 'polygon',
        'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection'
    ]
    
    def can_handle(self, column_type: str) -> bool:
        """Check if this handler can handle the given column type."""
        column_type = column_type.lower()
        
        # Check for PostGIS types
        if any(geo_type in column_type for geo_type in self.GEOMETRY_TYPES):
            return True
            
        # Check for specific type patterns
        if re.search(r'geom(etry)?', column_type):
            return True
            
        return False
    
    def extract_value(self, column_name: str, value: Any) -> Any:
        """Extract a geometric value from the database."""
        if value is None:
            return None
            
        try:
            # For PostGIS, convert to WKT (Well-Known Text) format for storage
            if hasattr(value, '__geo_interface__'):
                # If the object has a __geo_interface__, use that
                return json.dumps(value.__geo_interface__)
            elif isinstance(value, str) and (value.startswith('POINT') or 
                                            value.startswith('LINESTRING') or 
                                            value.startswith('POLYGON') or
                                            value.startswith('MULTI')):
                # Already in WKT format
                return value
            else:
                # Try to convert to string
                return str(value)
        except Exception as e:
            logger.error(f"Error extracting geometric data from {column_name}: {str(e)}")
            return None
    
    def prepare_value(self, column_name: str, value: Any) -> Any:
        """Prepare a geometric value for insertion into the database."""
        if value is None:
            return None
            
        try:
            if isinstance(value, dict):
                # It's a GeoJSON object
                # In a real implementation, we would convert from GeoJSON to PostGIS format
                # This would require using ST_GeomFromGeoJSON function
                return f"ST_GeomFromGeoJSON('{json.dumps(value)}')"
            elif isinstance(value, str):
                if value.startswith('{') and value.endswith('}'):
                    # Might be a GeoJSON string
                    try:
                        geo_json = json.loads(value)
                        return f"ST_GeomFromGeoJSON('{json.dumps(geo_json)}')"
                    except json.JSONDecodeError:
                        pass
                        
                # Assume it's WKT format
                return f"ST_GeomFromText('{value}')"
            else:
                logger.warning(f"Unknown geometry format for {column_name}: {type(value)}")
                return None
        except Exception as e:
            logger.error(f"Error preparing geometric data for {column_name}: {str(e)}")
            return None
    
    def compare_values(self, source_value: Any, target_value: Any) -> bool:
        """Compare two geometric values."""
        if source_value is None and target_value is None:
            return True
        if source_value is None or target_value is None:
            return False
            
        try:
            # Convert both to GeoJSON for comparison if needed
            source_json = self._to_geojson(source_value)
            target_json = self._to_geojson(target_value)
            
            if source_json is None or target_json is None:
                return False
                
            # Compare the GeoJSON objects
            # For a more precise comparison, we might want to use a proper
            # geometric comparison that accounts for floating point precision
            return source_json == target_json
        except Exception as e:
            logger.error(f"Error comparing geometric values: {str(e)}")
            return False
    
    def _to_geojson(self, value: Any) -> Optional[Dict]:
        """Convert a value to GeoJSON format."""
        try:
            if isinstance(value, dict):
                # Check if it's already a GeoJSON object
                if 'type' in value and ('coordinates' in value or 'geometries' in value):
                    return value
                    
            if isinstance(value, str):
                # Try to parse as JSON
                if value.startswith('{') and value.endswith('}'):
                    try:
                        json_obj = json.loads(value)
                        if 'type' in json_obj and ('coordinates' in json_obj or 'geometries' in json_obj):
                            return json_obj
                    except json.JSONDecodeError:
                        pass
                        
                # WKT parsing would go here in a full implementation
                # This would require a library like Shapely
                # For now, we'll just return the string
                return {"wkt": value}
                
            return None
        except Exception as e:
            logger.error(f"Error converting to GeoJSON: {str(e)}")
            return None


class DocumentReferenceHandler(DataTypeHandler):
    """Handler for document references and attachments."""
    
    def can_handle(self, column_type: str) -> bool:
        """Check if this handler can handle the given column type."""
        column_type = column_type.lower()
        
        # Look for document/attachment columns by name pattern
        if ('document' in column_type or 'attachment' in column_type or 
                'file' in column_type or 'blob' in column_type):
            return True
            
        return False
    
    def extract_value(self, column_name: str, value: Any) -> Any:
        """Extract a document reference value from the database."""
        if value is None:
            return None
            
        try:
            # If it's already a JSON string, parse it
            if isinstance(value, str) and value.startswith('{') and value.endswith('}'):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    pass
            
            # If it's a binary blob, we need to handle it specially
            if hasattr(value, 'read'):
                # It's a file-like object, just store a reference
                return {"document_reference": str(value)}
            
            # For JSON objects, return as is
            if isinstance(value, dict):
                return value
                
            # For simple strings, assume it's a reference
            if isinstance(value, str):
                return {"path": value}
                
            # Convert other types to string
            return {"data": str(value)}
        except Exception as e:
            logger.error(f"Error extracting document reference from {column_name}: {str(e)}")
            return None
    
    def prepare_value(self, column_name: str, value: Any) -> Any:
        """Prepare a document reference for insertion into the database."""
        if value is None:
            return None
            
        try:
            # If it's a dictionary, convert to JSON string
            if isinstance(value, dict):
                return json.dumps(value)
                
            # If it's already a JSON string, return as is
            if isinstance(value, str) and value.startswith('{') and value.endswith('}'):
                try:
                    # Validate it's valid JSON
                    json.loads(value)
                    return value
                except json.JSONDecodeError:
                    # Not valid JSON, treat as a regular string
                    return json.dumps({"path": value})
            
            # For simple strings, assume it's a reference path
            if isinstance(value, str):
                return json.dumps({"path": value})
                
            # For other types, convert to string
            return json.dumps({"data": str(value)})
        except Exception as e:
            logger.error(f"Error preparing document reference for {column_name}: {str(e)}")
            return None
    
    def compare_values(self, source_value: Any, target_value: Any) -> bool:
        """Compare two document reference values."""
        if source_value is None and target_value is None:
            return True
        if source_value is None or target_value is None:
            return False
            
        try:
            # Normalize both values to dictionaries
            source_dict = self._normalize_doc_value(source_value)
            target_dict = self._normalize_doc_value(target_value)
            
            if source_dict is None or target_dict is None:
                return False
                
            # Compare the document references
            # For documents, we might want to check specific keys only
            # like path or URL, ignoring metadata
            if 'path' in source_dict and 'path' in target_dict:
                return source_dict['path'] == target_dict['path']
            
            # If no special handling applies, compare the full dictionaries
            return source_dict == target_dict
        except Exception as e:
            logger.error(f"Error comparing document references: {str(e)}")
            return False
    
    def _normalize_doc_value(self, value: Any) -> Optional[Dict]:
        """Normalize a document reference value to a dictionary."""
        try:
            if isinstance(value, dict):
                return value
                
            if isinstance(value, str):
                # Try to parse as JSON
                if value.startswith('{') and value.endswith('}'):
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        pass
                        
                # Treat as a path
                return {"path": value}
                
            return {"data": str(value)}
        except Exception as e:
            logger.error(f"Error normalizing document reference: {str(e)}")
            return None


class JSONDataHandler(DataTypeHandler):
    """Handler for JSON and JSONB data types."""
    
    def can_handle(self, column_type: str) -> bool:
        """Check if this handler can handle the given column type."""
        column_type = column_type.lower()
        return 'json' in column_type
    
    def extract_value(self, column_name: str, value: Any) -> Any:
        """Extract a JSON value from the database."""
        if value is None:
            return None
            
        try:
            # If it's already a dictionary, return as is
            if isinstance(value, (dict, list)):
                return value
                
            # If it's a JSON string, parse it
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    # Not valid JSON, return as is
                    return value
                    
            # Convert other types to string
            return str(value)
        except Exception as e:
            logger.error(f"Error extracting JSON data from {column_name}: {str(e)}")
            return None
    
    def prepare_value(self, column_name: str, value: Any) -> Any:
        """Prepare a JSON value for insertion into the database."""
        if value is None:
            return None
            
        try:
            # If it's a dictionary or list, convert to JSON string
            if isinstance(value, (dict, list)):
                return json.dumps(value)
                
            # If it's already a JSON string, validate it
            if isinstance(value, str) and value.startswith('{') and value.endswith('}'):
                try:
                    # Validate it's valid JSON
                    json.loads(value)
                    return value
                except json.JSONDecodeError:
                    # Not valid JSON, treat as a regular string
                    return json.dumps(value)
            
            # For simple strings, assume it's just a string
            if isinstance(value, str):
                return json.dumps(value)
                
            # For other types, convert to string
            return json.dumps(str(value))
        except Exception as e:
            logger.error(f"Error preparing JSON data for {column_name}: {str(e)}")
            return None
    
    def compare_values(self, source_value: Any, target_value: Any) -> bool:
        """Compare two JSON values."""
        if source_value is None and target_value is None:
            return True
        if source_value is None or target_value is None:
            return False
            
        try:
            # Normalize both values
            source_norm = self._normalize_json_value(source_value)
            target_norm = self._normalize_json_value(target_value)
            
            # Compare the normalized values
            return source_norm == target_norm
        except Exception as e:
            logger.error(f"Error comparing JSON values: {str(e)}")
            return False
    
    def _normalize_json_value(self, value: Any) -> Any:
        """Normalize a JSON value for comparison."""
        try:
            # If it's already a dictionary or list, return as is
            if isinstance(value, (dict, list)):
                return value
                
            # If it's a string, try to parse it as JSON
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    # Not valid JSON, return as is
                    return value
                    
            # Convert other types to string
            return str(value)
        except Exception as e:
            logger.error(f"Error normalizing JSON value: {str(e)}")
            return value


class ArrayDataHandler(DataTypeHandler):
    """Handler for array data types."""
    
    def can_handle(self, column_type: str) -> bool:
        """Check if this handler can handle the given column type."""
        return 'array' in column_type.lower() or column_type.endswith('[]')
    
    def extract_value(self, column_name: str, value: Any) -> Any:
        """Extract an array value from the database."""
        if value is None:
            return None
            
        try:
            # If it's already a list, return as is
            if isinstance(value, list):
                return value
                
            # If it's a string representation of an array, parse it
            if isinstance(value, str):
                # PostgreSQL array format like '{1,2,3}'
                if value.startswith('{') and value.endswith('}'):
                    # Simple parsing, would need more robust handling in real implementation
                    items = value[1:-1].split(',')
                    return [item.strip() for item in items]
                    
                # JSON array format
                if value.startswith('[') and value.endswith(']'):
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        pass
            
            # Convert other types to list with single item
            return [value]
        except Exception as e:
            logger.error(f"Error extracting array data from {column_name}: {str(e)}")
            return None
    
    def prepare_value(self, column_name: str, value: Any) -> Any:
        """Prepare an array value for insertion into the database."""
        if value is None:
            return None
            
        try:
            # If it's a list, convert to PostgreSQL array syntax
            if isinstance(value, list):
                # For PostgreSQL, we use the ARRAY constructor
                items = []
                for item in value:
                    if item is None:
                        items.append('NULL')
                    elif isinstance(item, (int, float, bool)):
                        items.append(str(item))
                    else:
                        # Quote strings
                        items.append(f"'{str(item)}'")
                
                return f"ARRAY[{', '.join(items)}]"
                
            # If it's a string, check if it's already in PostgreSQL array format
            if isinstance(value, str):
                if value.startswith('{') and value.endswith('}'):
                    # Already in PostgreSQL format
                    return value
                    
                if value.startswith('[') and value.endswith(']'):
                    # JSON array format, convert to PostgreSQL array
                    try:
                        items = json.loads(value)
                        if isinstance(items, list):
                            return self.prepare_value(column_name, items)
                    except json.JSONDecodeError:
                        pass
            
            # For other types, create a single-item array
            return f"ARRAY['{str(value)}']"
        except Exception as e:
            logger.error(f"Error preparing array data for {column_name}: {str(e)}")
            return None
    
    def compare_values(self, source_value: Any, target_value: Any) -> bool:
        """Compare two array values."""
        if source_value is None and target_value is None:
            return True
        if source_value is None or target_value is None:
            return False
            
        try:
            # Normalize both values to lists
            source_list = self._normalize_array_value(source_value)
            target_list = self._normalize_array_value(target_value)
            
            if source_list is None or target_list is None:
                return False
                
            # Compare the lists
            # For arrays, order might matter so we don't sort
            if len(source_list) != len(target_list):
                return False
                
            return source_list == target_list
        except Exception as e:
            logger.error(f"Error comparing array values: {str(e)}")
            return False
    
    def _normalize_array_value(self, value: Any) -> Optional[List]:
        """Normalize an array value to a list."""
        try:
            # If it's already a list, return as is
            if isinstance(value, list):
                return value
                
            # If it's a string, try to parse it
            if isinstance(value, str):
                # PostgreSQL array format
                if value.startswith('{') and value.endswith('}'):
                    # Simple parsing, would need more robust handling in real implementation
                    items = value[1:-1].split(',')
                    return [item.strip() for item in items]
                    
                # JSON array format
                if value.startswith('[') and value.endswith(']'):
                    try:
                        items = json.loads(value)
                        if isinstance(items, list):
                            return items
                    except json.JSONDecodeError:
                        pass
            
            # Convert other types to list with single item
            return [value]
        except Exception as e:
            logger.error(f"Error normalizing array value: {str(e)}")
            return None


# Registry for data type handlers
data_type_handlers = [
    GeometricDataHandler(),
    DocumentReferenceHandler(),
    JSONDataHandler(),
    ArrayDataHandler()
]


def get_handler_for_column(column_type: str) -> Optional[DataTypeHandler]:
    """
    Get an appropriate handler for the given column type.
    
    Args:
        column_type: SQL column type
        
    Returns:
        DataTypeHandler instance or None if no handler is found
    """
    for handler in data_type_handlers:
        if handler.can_handle(column_type):
            return handler
    return None


def register_handler(handler: DataTypeHandler) -> None:
    """
    Register a new data type handler.
    
    Args:
        handler: DataTypeHandler instance to register
    """
    data_type_handlers.append(handler)