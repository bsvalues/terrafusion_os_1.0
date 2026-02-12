"""
Enhanced Data Type Handlers for TerraFusion Sync Service

This module extends the base DataTypeHandler functionality with additional methods
required by the TerraFusion architecture, including value transformation, difference
detection, and specialized type handling.
"""

import json
import logging
import re
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union, Literal

# Import base handlers
from sync_service.data_type_handlers import (
    DataTypeHandler as BaseDataTypeHandler,
    GeometricDataHandler as BaseGeometricDataHandler,
    DocumentReferenceHandler as BaseDocumentReferenceHandler,
    JSONDataHandler as BaseJSONDataHandler
)

logger = logging.getLogger(__name__)


class DataTypeHandler(BaseDataTypeHandler):
    """Extended DataTypeHandler with additional TerraFusion methods."""
    
    def transform_value(
        self, 
        value: Any, 
        source_type: str, 
        target_type: str, 
        **kwargs
    ) -> Any:
        """
        Transform a value from source type to target type.
        
        Args:
            value: The value to transform
            source_type: Source data type
            target_type: Target data type
            **kwargs: Additional transformation parameters
            
        Returns:
            Transformed value
        """
        # Default implementation - no transformation
        return value
    
    def values_differ(self, source_value: Any, target_value: Any, **kwargs) -> bool:
        """
        Check if two values differ semantically.
        
        Args:
            source_value: Value from source database
            target_value: Value from target database
            **kwargs: Additional comparison parameters
            
        Returns:
            True if values differ, False if they are equivalent
        """
        # By default, use the inverse of compare_values
        return not self.compare_values(source_value, target_value)


class GeometricDataHandler(BaseGeometricDataHandler, DataTypeHandler):
    """Enhanced handler for geometric data types (GIS)."""
    
    def transform_value(
        self, 
        value: Any, 
        source_type: str, 
        target_type: str, 
        **kwargs
    ) -> Any:
        """Transform geometric data between formats."""
        if value is None:
            return None
            
        try:
            # GeoJSON to WKT
            if 'geojson' in source_type.lower() and 'wkt' in target_type.lower():
                # Convert GeoJSON to WKT
                if isinstance(value, dict) and 'type' in value and 'coordinates' in value:
                    # In a real implementation, we would use a library like Shapely
                    # For now, just return a placeholder WKT based on the GeoJSON type
                    geo_type = value['type'].upper()
                    if geo_type == 'POINT':
                        coords = value['coordinates']
                        return f"POINT({coords[0]} {coords[1]})"
                    return f"{geo_type}(...)"
            
            # WKT to GeoJSON
            elif 'wkt' in source_type.lower() and 'geojson' in target_type.lower():
                # Convert WKT to GeoJSON
                if isinstance(value, str) and value.upper().startswith(('POINT', 'LINESTRING', 'POLYGON')):
                    # In a real implementation, we would use a library like Shapely
                    # For now, just return a placeholder GeoJSON
                    geo_type = value.split('(')[0].strip()
                    return {
                        "type": geo_type.capitalize(),
                        "coordinates": [0, 0]  # Placeholder
                    }
            
            # No specific transformation needed or possible
            return super().transform_value(value, source_type, target_type, **kwargs)
        except Exception as e:
            logger.error(f"Error transforming geometric data: {str(e)}")
            return None
    
    def values_differ(self, source_value: Any, target_value: Any, **kwargs) -> bool:
        """Check if geometric values differ, with tolerance for floating point differences."""
        precision = kwargs.get('precision', 6)  # Default precision for coordinate comparison
        
        if source_value is None and target_value is None:
            return False
        if source_value is None or target_value is None:
            return True
            
        try:
            # Convert both to GeoJSON for comparison
            source_json = self._to_geojson(source_value)
            target_json = self._to_geojson(target_value)
            
            if source_json is None or target_json is None:
                return True
                
            # Compare types
            if source_json.get('type') != target_json.get('type'):
                return True
                
            # For a real implementation, we would use a proper geometric comparison
            # that accounts for floating point precision, spatial reference systems,
            # and other factors. Here's a simplified version:
            
            # If both have coordinates, compare them with the specified precision
            if 'coordinates' in source_json and 'coordinates' in target_json:
                return self._coordinates_differ(
                    source_json['coordinates'], 
                    target_json['coordinates'],
                    precision
                )
                
            # Fall back to basic comparison
            return super().values_differ(source_value, target_value, **kwargs)
        except Exception as e:
            logger.error(f"Error comparing geometric values: {str(e)}")
            return True
    
    def _coordinates_differ(
        self, 
        source_coords: Union[List, Tuple], 
        target_coords: Union[List, Tuple],
        precision: int = 6
    ) -> bool:
        """
        Compare coordinates with a specified precision.
        
        Args:
            source_coords: Source coordinates
            target_coords: Target coordinates
            precision: Number of decimal places to consider
            
        Returns:
            True if coordinates differ, False if equivalent
        """
        # Different types or lengths
        if type(source_coords) != type(target_coords):
            return True
            
        if isinstance(source_coords, (list, tuple)) and isinstance(target_coords, (list, tuple)):
            if len(source_coords) != len(target_coords):
                return True
                
            # If coordinates are nested (e.g., LineString, Polygon)
            if source_coords and isinstance(source_coords[0], (list, tuple)):
                return any(
                    self._coordinates_differ(sc, tc, precision)
                    for sc, tc in zip(source_coords, target_coords)
                )
                
            # Simple coordinate comparison
            return any(
                round(float(sc), precision) != round(float(tc), precision)
                for sc, tc in zip(source_coords, target_coords)
            )
            
        # Not comparable
        return True


class DocumentReferenceHandler(BaseDocumentReferenceHandler, DataTypeHandler):
    """Enhanced handler for document references and attachments."""
    
    def transform_value(
        self, 
        value: Any, 
        source_type: str, 
        target_type: str, 
        **kwargs
    ) -> Any:
        """Transform document references between formats."""
        if value is None:
            return None
            
        try:
            # String path to document reference object
            if 'string' in source_type.lower() and 'json' in target_type.lower():
                if isinstance(value, str):
                    return {"path": value}
            
            # Document reference object to string path
            elif 'json' in source_type.lower() and 'string' in target_type.lower():
                if isinstance(value, dict) and 'path' in value:
                    return value['path']
            
            # No specific transformation needed
            return super().transform_value(value, source_type, target_type, **kwargs)
        except Exception as e:
            logger.error(f"Error transforming document reference: {str(e)}")
            return None
    
    def values_differ(self, source_value: Any, target_value: Any, **kwargs) -> bool:
        """Check if document references differ."""
        check_metadata = kwargs.get('check_metadata', False)  # By default, ignore metadata
        
        if source_value is None and target_value is None:
            return False
        if source_value is None or target_value is None:
            return True
            
        try:
            # Normalize both values to dictionaries
            source_dict = self._normalize_doc_value(source_value)
            target_dict = self._normalize_doc_value(target_value)
            
            if source_dict is None or target_dict is None:
                return True
                
            # If we only care about the path, compare only that
            if not check_metadata:
                if 'path' in source_dict and 'path' in target_dict:
                    return source_dict['path'] != target_dict['path']
            
            # Compare the full dictionaries
            return source_dict != target_dict
        except Exception as e:
            logger.error(f"Error comparing document references: {str(e)}")
            return True


class JSONDataHandler(BaseJSONDataHandler, DataTypeHandler):
    """Enhanced handler for JSON and JSONB data types."""
    
    def transform_value(
        self, 
        value: Any, 
        source_type: str, 
        target_type: str, 
        **kwargs
    ) -> Any:
        """Transform JSON data between formats."""
        if value is None:
            return None
            
        try:
            # String to JSON object
            if 'string' in source_type.lower() and 'json' in target_type.lower():
                if isinstance(value, str):
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        # Not valid JSON, return as is
                        return value
            
            # JSON object to string
            elif 'json' in source_type.lower() and 'string' in target_type.lower():
                if isinstance(value, (dict, list)):
                    return json.dumps(value)
            
            # No specific transformation needed
            return super().transform_value(value, source_type, target_type, **kwargs)
        except Exception as e:
            logger.error(f"Error transforming JSON data: {str(e)}")
            return None
    
    def values_differ(self, source_value: Any, target_value: Any, **kwargs) -> bool:
        """Check if JSON values differ."""
        ignore_order = kwargs.get('ignore_order', True)  # Ignore array order by default
        
        if source_value is None and target_value is None:
            return False
        if source_value is None or target_value is None:
            return True
            
        try:
            # Normalize both values
            source_norm = self._normalize_json_value(source_value)
            target_norm = self._normalize_json_value(target_value)
            
            if source_norm is None or target_norm is None:
                return True
                
            # Special handling for arrays if ignore_order is True
            if ignore_order and isinstance(source_norm, list) and isinstance(target_norm, list):
                if len(source_norm) != len(target_norm):
                    return True
                    
                # For simple lists of primitive values, we can sort
                if all(isinstance(x, (str, int, float, bool)) for x in source_norm + target_norm):
                    return sorted(source_norm) != sorted(target_norm)
                    
                # For complex lists, we need a more sophisticated comparison
                # For now, just use regular comparison
                pass
            
            # Regular comparison
            return source_norm != target_norm
        except Exception as e:
            logger.error(f"Error comparing JSON values: {str(e)}")
            return True


class DateTimeHandler(DataTypeHandler):
    """Handler for date and time data types."""
    
    def can_handle(self, column_type: str) -> bool:
        """Check if this handler can handle the given column type."""
        column_type = column_type.lower()
        return any(t in column_type for t in [
            'date', 'time', 'timestamp', 'datetime', 'interval'
        ])
    
    def extract_value(self, column_name: str, value: Any) -> Any:
        """Extract a date/time value from the database."""
        if value is None:
            return None
            
        try:
            # Convert datetime objects to ISO format strings
            if isinstance(value, datetime):
                return value.isoformat()
                
            # Already a string
            if isinstance(value, str):
                return value
                
            # Other types
            return str(value)
        except Exception as e:
            logger.error(f"Error extracting date/time from {column_name}: {str(e)}")
            return None
    
    def prepare_value(self, column_name: str, value: Any) -> Any:
        """Prepare a date/time value for insertion into the database."""
        if value is None:
            return None
            
        try:
            # If it's already a datetime object, return as is
            if isinstance(value, datetime):
                return value
                
            # If it's a string, try to parse it as a datetime
            if isinstance(value, str):
                # Try ISO format first
                try:
                    return datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    pass
                    
                # Try other common formats
                formats = [
                    '%Y-%m-%d %H:%M:%S',
                    '%Y-%m-%d',
                    '%d/%m/%Y',
                    '%m/%d/%Y',
                ]
                
                for fmt in formats:
                    try:
                        return datetime.strptime(value, fmt)
                    except ValueError:
                        continue
                        
                # Return as is if parsing fails
                return value
                
            # Other types
            return value
        except Exception as e:
            logger.error(f"Error preparing date/time for {column_name}: {str(e)}")
            return None
    
    def compare_values(self, source_value: Any, target_value: Any) -> bool:
        """Compare two date/time values."""
        if source_value is None and target_value is None:
            return True
        if source_value is None or target_value is None:
            return False
            
        try:
            # Convert both to datetime objects for comparison
            source_dt = self._to_datetime(source_value)
            target_dt = self._to_datetime(target_value)
            
            if source_dt is None or target_dt is None:
                return False
                
            # Compare the datetime objects
            return source_dt == target_dt
        except Exception as e:
            logger.error(f"Error comparing date/time values: {str(e)}")
            return False
    
    def transform_value(
        self, 
        value: Any, 
        source_type: str, 
        target_type: str, 
        **kwargs
    ) -> Any:
        """Transform date/time data between formats."""
        if value is None:
            return None
            
        try:
            # String to datetime
            if 'string' in source_type.lower() and 'datetime' in target_type.lower():
                return self._to_datetime(value)
            
            # Datetime to string
            elif 'datetime' in source_type.lower() and 'string' in target_type.lower():
                format_str = kwargs.get('format', '%Y-%m-%d %H:%M:%S')
                dt = self._to_datetime(value)
                if dt:
                    return dt.strftime(format_str)
                return value
            
            # Date only
            elif 'date' in target_type.lower() and not 'time' in target_type.lower():
                dt = self._to_datetime(value)
                if dt:
                    if 'string' in target_type.lower():
                        return dt.strftime('%Y-%m-%d')
                    return dt.date()
                return value
            
            # Time only
            elif 'time' in target_type.lower() and not 'date' in target_type.lower():
                dt = self._to_datetime(value)
                if dt:
                    if 'string' in target_type.lower():
                        return dt.strftime('%H:%M:%S')
                    return dt.time()
                return value
            
            # No specific transformation needed
            return value
        except Exception as e:
            logger.error(f"Error transforming date/time data: {str(e)}")
            return None
    
    def values_differ(self, source_value: Any, target_value: Any, **kwargs) -> bool:
        """Check if date/time values differ."""
        precision = kwargs.get('precision', 'second')  # Default precision for comparison
        
        if source_value is None and target_value is None:
            return False
        if source_value is None or target_value is None:
            return True
            
        try:
            # Convert both to datetime objects
            source_dt = self._to_datetime(source_value)
            target_dt = self._to_datetime(target_value)
            
            if source_dt is None or target_dt is None:
                return True
                
            # Apply precision
            if precision == 'day':
                return source_dt.date() != target_dt.date()
            elif precision == 'hour':
                return (
                    source_dt.date() != target_dt.date() or
                    source_dt.hour != target_dt.hour
                )
            elif precision == 'minute':
                return (
                    source_dt.date() != target_dt.date() or
                    source_dt.hour != target_dt.hour or
                    source_dt.minute != target_dt.minute
                )
            elif precision == 'second':
                return (
                    source_dt.date() != target_dt.date() or
                    source_dt.hour != target_dt.hour or
                    source_dt.minute != target_dt.minute or
                    source_dt.second != target_dt.second
                )
            elif precision == 'microsecond':
                return source_dt != target_dt
            
            # Default
            return source_dt != target_dt
        except Exception as e:
            logger.error(f"Error comparing date/time values: {str(e)}")
            return True
    
    def _to_datetime(self, value: Any) -> Optional[datetime]:
        """Convert a value to a datetime object."""
        try:
            # If it's already a datetime object, return as is
            if isinstance(value, datetime):
                return value
                
            # If it's a string, try to parse it
            if isinstance(value, str):
                # Try ISO format first
                try:
                    return datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    pass
                    
                # Try other common formats
                formats = [
                    '%Y-%m-%d %H:%M:%S',
                    '%Y-%m-%d',
                    '%d/%m/%Y',
                    '%m/%d/%Y',
                ]
                
                for fmt in formats:
                    try:
                        return datetime.strptime(value, fmt)
                    except ValueError:
                        continue
                        
                # Return None if parsing fails
                return None
                
            # Other types
            return None
        except Exception as e:
            logger.error(f"Error converting to datetime: {str(e)}")
            return None


class ArrayHandler(DataTypeHandler):
    """Handler for array data types."""
    
    def __init__(self, element_handler: Optional[DataTypeHandler] = None):
        """
        Initialize with an optional element handler.
        
        Args:
            element_handler: Handler for array elements
        """
        self.element_handler = element_handler
    
    def can_handle(self, column_type: str) -> bool:
        """Check if this handler can handle the given column type."""
        column_type = column_type.lower()
        return 'array' in column_type or '[]' in column_type
    
    def extract_value(self, column_name: str, value: Any) -> Any:
        """Extract an array value from the database."""
        if value is None:
            return None
            
        try:
            # If it's already a list, process elements if needed
            if isinstance(value, list):
                if self.element_handler:
                    return [
                        self.element_handler.extract_value(column_name, item)
                        for item in value
                    ]
                return value
                
            # If it's a string representation of a list, parse it
            if isinstance(value, str) and value.startswith('[') and value.endswith(']'):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        if self.element_handler:
                            return [
                                self.element_handler.extract_value(column_name, item)
                                for item in parsed
                            ]
                        return parsed
                except json.JSONDecodeError:
                    pass
                    
            # Convert to string and return
            return str(value)
        except Exception as e:
            logger.error(f"Error extracting array from {column_name}: {str(e)}")
            return None
    
    def prepare_value(self, column_name: str, value: Any) -> Any:
        """Prepare an array value for insertion into the database."""
        if value is None:
            return None
            
        try:
            # If it's already a list, process elements if needed
            if isinstance(value, list):
                if self.element_handler:
                    return [
                        self.element_handler.prepare_value(column_name, item)
                        for item in value
                    ]
                return value
                
            # If it's a string representation of a list, parse it
            if isinstance(value, str) and value.startswith('[') and value.endswith(']'):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        if self.element_handler:
                            return [
                                self.element_handler.prepare_value(column_name, item)
                                for item in parsed
                            ]
                        return parsed
                except json.JSONDecodeError:
                    pass
                    
            # Convert to list with single item
            return [value]
        except Exception as e:
            logger.error(f"Error preparing array for {column_name}: {str(e)}")
            return None
    
    def compare_values(self, source_value: Any, target_value: Any) -> bool:
        """Compare two array values."""
        if source_value is None and target_value is None:
            return True
        if source_value is None or target_value is None:
            return False
            
        try:
            # Normalize both to lists
            source_list = self._normalize_array(source_value)
            target_list = self._normalize_array(target_value)
            
            if source_list is None or target_list is None:
                return False
                
            # Different lengths
            if len(source_list) != len(target_list):
                return False
                
            # Compare elements
            if self.element_handler:
                return all(
                    self.element_handler.compare_values(s_item, t_item)
                    for s_item, t_item in zip(source_list, target_list)
                )
            
            # Simple comparison
            return source_list == target_list
        except Exception as e:
            logger.error(f"Error comparing arrays: {str(e)}")
            return False
    
    def transform_value(
        self, 
        value: Any, 
        source_type: str, 
        target_type: str, 
        **kwargs
    ) -> Any:
        """Transform array data between formats."""
        if value is None:
            return None
            
        try:
            # Normalize to list
            array = self._normalize_array(value)
            if array is None:
                return None
                
            # String to array
            if 'string' in source_type.lower() and 'array' in target_type.lower():
                # Already normalized
                pass
            
            # Array to string
            elif 'array' in source_type.lower() and 'string' in target_type.lower():
                return json.dumps(array)
            
            # Transform elements if handler is available
            if self.element_handler:
                element_source_type = source_type.replace('array', '').replace('[]', '')
                element_target_type = target_type.replace('array', '').replace('[]', '')
                
                return [
                    self.element_handler.transform_value(
                        item, element_source_type, element_target_type, **kwargs
                    )
                    for item in array
                ]
            
            # No transformation needed or possible
            return array
        except Exception as e:
            logger.error(f"Error transforming array: {str(e)}")
            return None
    
    def values_differ(self, source_value: Any, target_value: Any, **kwargs) -> bool:
        """Check if array values differ."""
        ignore_order = kwargs.get('ignore_order', False)
        
        if source_value is None and target_value is None:
            return False
        if source_value is None or target_value is None:
            return True
            
        try:
            # Normalize both to lists
            source_list = self._normalize_array(source_value)
            target_list = self._normalize_array(target_value)
            
            if source_list is None or target_list is None:
                return True
                
            # Different lengths
            if len(source_list) != len(target_list):
                return True
                
            # If order doesn't matter, sort the lists if possible
            if ignore_order:
                # For simple types, we can sort
                if all(isinstance(x, (str, int, float, bool)) for x in source_list + target_list):
                    return sorted(source_list) != sorted(target_list)
                    
                # For complex types, we need element-wise comparison
                if self.element_handler:
                    # This is a simplified approach and may not work for all cases
                    # A more robust solution would involve matching elements
                    source_match = {i: False for i in range(len(source_list))}
                    target_match = {i: False for i in range(len(target_list))}
                    
                    for i, s_item in enumerate(source_list):
                        for j, t_item in enumerate(target_list):
                            if not target_match[j] and not self.element_handler.values_differ(s_item, t_item, **kwargs):
                                source_match[i] = True
                                target_match[j] = True
                                break
                                
                    return not all(source_match.values()) or not all(target_match.values())
            
            # Compare elements with order
            if self.element_handler:
                return any(
                    self.element_handler.values_differ(s_item, t_item, **kwargs)
                    for s_item, t_item in zip(source_list, target_list)
                )
            
            # Simple comparison
            return source_list != target_list
        except Exception as e:
            logger.error(f"Error comparing arrays: {str(e)}")
            return True
    
    def _normalize_array(self, value: Any) -> Optional[List]:
        """Normalize a value to a list."""
        try:
            # If it's already a list, return as is
            if isinstance(value, list):
                return value
                
            # If it's a string representation of a list, parse it
            if isinstance(value, str) and value.startswith('[') and value.endswith(']'):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return parsed
                except json.JSONDecodeError:
                    pass
                    
            # Convert to list with single item
            return [value]
        except Exception as e:
            logger.error(f"Error normalizing array: {str(e)}")
            return None


class TypeConverter:
    """Utility class for converting between different data types."""
    
    @staticmethod
    def convert(
        value: Any, 
        source_type: str, 
        target_type: str,
        handlers: Optional[List[DataTypeHandler]] = None
    ) -> Any:
        """
        Convert a value from one type to another.
        
        Args:
            value: The value to convert
            source_type: Source data type
            target_type: Target data type
            handlers: List of data type handlers
            
        Returns:
            Converted value
        """
        if value is None:
            return None
            
        # Standard type conversions
        conversions = {
            ('str', 'int'): lambda v: int(v) if v.strip() else 0,
            ('str', 'float'): lambda v: float(v) if v.strip() else 0.0,
            ('str', 'bool'): lambda v: v.lower() in ('true', 't', 'yes', 'y', '1'),
            ('str', 'datetime'): lambda v: datetime.fromisoformat(v.replace('Z', '+00:00')),
            ('int', 'str'): lambda v: str(v),
            ('float', 'str'): lambda v: str(v),
            ('bool', 'str'): lambda v: str(v).lower(),
            ('datetime', 'str'): lambda v: v.isoformat(),
        }
        
        # Try standard conversions first
        key = (source_type, target_type)
        if key in conversions:
            try:
                return conversions[key](value)
            except Exception as e:
                logger.error(f"Error converting {value} from {source_type} to {target_type}: {str(e)}")
                return None
        
        # Try handlers
        if handlers:
            for handler in handlers:
                if handler.can_handle(source_type) or handler.can_handle(target_type):
                    try:
                        return handler.transform_value(value, source_type, target_type)
                    except Exception as e:
                        logger.error(f"Error using handler to convert {value}: {str(e)}")
                        continue
        
        # No conversion found, return value as is
        return value


# Create and register default handlers
default_handlers = [
    GeometricDataHandler(),
    DocumentReferenceHandler(),
    JSONDataHandler(),
    DateTimeHandler(),
    ArrayHandler()
]


def get_handler_for_column(column_type: str) -> Optional[DataTypeHandler]:
    """
    Get the appropriate handler for a column type.
    
    Args:
        column_type: The SQL column type name
        
    Returns:
        DataTypeHandler instance or None if no handler is found
    """
    for handler in default_handlers:
        if handler.can_handle(column_type):
            return handler
            
    return None