"""
DBF Format Handler for legacy data conversion

This handler provides support for dBase/DBF files which are common
in legacy property assessment systems, particularly those built on
older technologies like FoxPro, Clipper, and ESRI Shapefile-related data.
"""

import os
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union, Generator
from legacy_converter import FormatHandler, ColumnMapping

# Configure logging
logger = logging.getLogger(__name__)

class DBFHandler(FormatHandler):
    """Handler for DBF (dBase) files"""
    
    def __init__(self):
        """Initialize DBF handler"""
        self.encoding = "cp437"  # Default DBF encoding
    
    def can_handle(self, file_path: str) -> bool:
        """
        Check if this handler can process the given file
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if this handler can process the file, False otherwise
        """
        # Check extension
        _, ext = os.path.splitext(file_path.lower())
        
        if ext in [".dbf"]:
            return True
        
        # Check file header for DBF signature
        try:
            with open(file_path, "rb") as f:
                header = f.read(4)
                # Check for DBF file signature
                # 0x03 = FoxBASE+/dBASE III PLUS
                # 0x04 = dBASE IV
                # 0x05 = dBASE V
                # 0xF5 = FoxPro
                return header[0] in [0x03, 0x04, 0x05, 0xF5]
        except:
            pass
        
        return False
    
    def read_schema(self, file_path: str) -> Dict[str, Any]:
        """
        Read the schema of the DBF file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with schema information
        """
        try:
            # Use pandas to read DBF schema
            # First try standard encoding
            try:
                df = self._read_sample_data(file_path, self.encoding)
            except UnicodeDecodeError:
                # Try with a different encoding
                for enc in ["cp1252", "latin1", "utf-8"]:
                    try:
                        df = self._read_sample_data(file_path, enc)
                        self.encoding = enc
                        break
                    except:
                        continue
            
            # Collect column information
            columns = {}
            for i, col_name in enumerate(df.columns):
                # Get dtype and convert to string representation
                dtype = df[col_name].dtype
                data_type = self._pandas_dtype_to_string(dtype)
                
                # Get sample values
                sample_values = df[col_name].head(5).tolist()
                
                # Convert numpy values to Python types for serialization
                sample_values = [self._numpy_to_python(val) for val in sample_values]
                
                columns[col_name] = {
                    "index": i,
                    "name": col_name,
                    "type": data_type,
                    "nullable": df[col_name].isna().any(),
                    "description": "",
                    "sample_values": sample_values
                }
            
            # Try to get more detailed schema info if simpledbf is available
            try:
                from simpledbf import Dbf5
                dbf = Dbf5(file_path, codec=self.encoding)
                
                # Update column info with DBF-specific details
                for i, field in enumerate(dbf.fields):
                    field_name = field[0]
                    if field_name in columns:
                        field_type = field[1]
                        field_length = field[2]
                        field_decimal = field[3]
                        
                        columns[field_name].update({
                            "dbf_type": field_type,
                            "length": field_length,
                            "decimal_places": field_decimal
                        })
            except ImportError:
                logger.warning("simpledbf package not available for detailed DBF schema info")
            except Exception as e:
                logger.warning(f"Error getting detailed DBF schema: {str(e)}")
            
            return {
                "columns": columns,
                "file_size": os.path.getsize(file_path),
                "encoding": self.encoding,
                "row_count": len(df)
            }
        except Exception as e:
            logger.error(f"Error reading DBF schema: {str(e)}")
            return {"error": str(e)}
    
    def read_data(self, file_path: str, batch_size: int = 1000) -> Generator[pd.DataFrame, None, None]:
        """
        Read data from the DBF file as a generator
        
        Args:
            file_path: Path to the file
            batch_size: Number of rows to read at a time
            
        Returns:
            Generator yielding DataFrames
        """
        try:
            # Get total number of rows
            total_rows = self._get_row_count(file_path)
            
            # Process in batches
            for start_row in range(0, total_rows, batch_size):
                end_row = min(start_row + batch_size, total_rows)
                
                # Read batch from DBF file
                df = pd.read_dbf(file_path, encoding=self.encoding, skip=start_row, nrows=batch_size)
                
                # Clean column names
                df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]
                
                yield df
        except Exception as e:
            logger.error(f"Error reading DBF data: {str(e)}")
            
            # Try alternative method if pandas.read_dbf fails
            try:
                logger.info("Trying alternative DBF reading method")
                from simpledbf import Dbf5
                
                dbf = Dbf5(file_path, codec=self.encoding)
                total_rows = dbf.numrec
                
                # Process in batches
                for start_row in range(0, total_rows, batch_size):
                    end_row = min(start_row + batch_size, total_rows)
                    
                    # Convert batch to pandas DataFrame
                    df = dbf.to_dataframe(start=start_row, stop=end_row)
                    
                    # Clean column names
                    df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]
                    
                    yield df
            except ImportError:
                logger.error("simpledbf package not available for DBF reading")
                yield pd.DataFrame()
            except Exception as e2:
                logger.error(f"Error with alternative DBF reading: {str(e2)}")
                yield pd.DataFrame()
    
    def validate_mapping(self, file_path: str, mapping: List[ColumnMapping]) -> List[Dict[str, Any]]:
        """
        Validate a column mapping against the file
        
        Args:
            file_path: Path to the file
            mapping: List of column mappings
            
        Returns:
            List of validation issues
        """
        issues = []
        
        try:
            # Read schema for column information
            schema = self.read_schema(file_path)
            if "error" in schema:
                issues.append({
                    "type": "schema_error",
                    "message": f"Error reading schema: {schema['error']}"
                })
                return issues
            
            columns = schema.get("columns", {})
            
            # Check each mapping
            for i, col_map in enumerate(mapping):
                # Verify source column exists
                if col_map.source_column not in columns:
                    issues.append({
                        "type": "missing_source_column",
                        "mapping_index": i,
                        "source_column": col_map.source_column,
                        "message": f"Source column '{col_map.source_column}' not found in file"
                    })
                    continue
                
                # Check data type compatibility
                source_type = columns[col_map.source_column]["type"]
                target_type = col_map.data_type
                
                if not self._are_types_compatible(source_type, target_type):
                    issues.append({
                        "type": "type_mismatch",
                        "mapping_index": i,
                        "source_column": col_map.source_column,
                        "target_column": col_map.target_column,
                        "source_type": source_type,
                        "target_type": target_type,
                        "message": f"Source type '{source_type}' may not be compatible with target type '{target_type}'"
                    })
                
                # Check for character field length issues
                if "dbf_type" in columns[col_map.source_column] and columns[col_map.source_column]["dbf_type"] == "C":
                    field_length = columns[col_map.source_column].get("length", 0)
                    
                    if field_length > 255 and target_type == "string":
                        issues.append({
                            "type": "field_length",
                            "mapping_index": i,
                            "source_column": col_map.source_column,
                            "target_column": col_map.target_column,
                            "field_length": field_length,
                            "message": f"DBF character field '{col_map.source_column}' has length {field_length}, which may exceed target string column capacity. Consider using 'text' type instead."
                        })
            
            return issues
        except Exception as e:
            logger.error(f"Error validating DBF mapping: {str(e)}")
            issues.append({
                "type": "validation_error",
                "message": f"Error validating mapping: {str(e)}"
            })
            return issues
    
    def _read_sample_data(self, file_path: str, encoding: str) -> pd.DataFrame:
        """
        Read a sample of data from DBF file
        
        Args:
            file_path: Path to the file
            encoding: Character encoding
            
        Returns:
            DataFrame with sample data
        """
        try:
            # Try using pandas.read_dbf
            return pd.read_dbf(file_path, encoding=encoding)
        except:
            # Fall back to simpledbf if available
            try:
                from simpledbf import Dbf5
                dbf = Dbf5(file_path, codec=encoding)
                return dbf.to_dataframe()
            except ImportError:
                logger.warning("Neither pandas.read_dbf nor simpledbf available")
                raise
    
    def _get_row_count(self, file_path: str) -> int:
        """
        Get the number of rows in a DBF file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Row count
        """
        try:
            # Try to read row count from header
            with open(file_path, "rb") as f:
                # Read header
                header = f.read(32)
                
                # Extract record count from header (bytes 4-7)
                count = int.from_bytes(header[4:8], byteorder="little")
                
                return count
        except Exception as e:
            logger.error(f"Error getting DBF row count: {str(e)}")
            
            # Fall back to pandas count
            try:
                df = self._read_sample_data(file_path, self.encoding)
                return len(df)
            except:
                return 0
    
    def _pandas_dtype_to_string(self, dtype) -> str:
        """
        Convert pandas dtype to string representation
        
        Args:
            dtype: pandas dtype object
            
        Returns:
            String representation of the data type
        """
        dtype_str = str(dtype)
        
        if "int" in dtype_str:
            return "integer"
        elif "float" in dtype_str:
            return "float"
        elif "datetime" in dtype_str:
            return "date"
        elif "bool" in dtype_str:
            return "boolean"
        else:
            return "string"
    
    def _numpy_to_python(self, val):
        """
        Convert numpy value to Python native type for serialization
        
        Args:
            val: Numpy value
            
        Returns:
            Python native value
        """
        if pd.isna(val):
            return None
        elif isinstance(val, np.integer):
            return int(val)
        elif isinstance(val, np.floating):
            return float(val)
        elif isinstance(val, np.bool_):
            return bool(val)
        else:
            return val
    
    def _are_types_compatible(self, source_type: str, target_type: str) -> bool:
        """
        Check if source and target types are compatible
        
        Args:
            source_type: Source data type
            target_type: Target data type
            
        Returns:
            True if types are compatible, False otherwise
        """
        # Define compatibility rules
        compatibility = {
            "string": ["string", "text"],
            "integer": ["integer", "float", "string", "text"],
            "float": ["float", "string", "text"],
            "date": ["date", "datetime", "string", "text"],
            "boolean": ["boolean", "integer", "string", "text"],
            "text": ["string", "text"]
        }
        
        return target_type in compatibility.get(source_type, [])