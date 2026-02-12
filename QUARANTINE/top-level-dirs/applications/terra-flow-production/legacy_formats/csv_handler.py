"""
CSV Format Handler for legacy data conversion
"""

import os
import io
import csv
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union, Generator, TextIO
from legacy_converter import FormatHandler, ColumnMapping

# Configure logging
logger = logging.getLogger(__name__)

class CSVHandler(FormatHandler):
    """Handler for CSV and similar delimited formats"""
    
    def __init__(self):
        """Initialize CSV handler"""
        self.delimiter = ","  # Default delimiter
    
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
        
        if ext in [".csv"]:
            return True
        
        # Check content for common CSV patterns
        try:
            with open(file_path, "r", errors="ignore") as f:
                sample = f.read(10000)
            
            # Update delimiter based on content
            if "|" in sample:
                self.delimiter = "|"
                return True
            elif "\t" in sample:
                self.delimiter = "\t"
                return True
            elif "," in sample:
                self.delimiter = ","
                return True
        except:
            pass
        
        return False
    
    def read_schema(self, file_path: str) -> Dict[str, Any]:
        """
        Read the schema of the CSV file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with schema information
        """
        try:
            # Read the first few rows to infer schema
            with open(file_path, "r", errors="ignore") as f:
                # Detect delimiter if not already set
                if self.delimiter == ",":
                    dialect = csv.Sniffer().sniff(f.read(10000))
                    f.seek(0)
                    self.delimiter = dialect.delimiter
                
                # Read the first few rows
                reader = csv.reader(f, delimiter=self.delimiter)
                headers = next(reader)
                sample_rows = []
                for i, row in enumerate(reader):
                    if i >= 10:  # Read up to 10 sample rows
                        break
                    sample_rows.append(row)
            
            # Infer column types from sample data
            columns = {}
            for i, header in enumerate(headers):
                # Clean header if needed
                header = header.strip()
                if not header:
                    header = f"Column_{i+1}"
                
                # Collect sample values
                sample_values = []
                for row in sample_rows:
                    if i < len(row):
                        sample_values.append(row[i])
                
                # Infer type from sample values
                data_type = self._infer_type(sample_values)
                
                columns[header] = {
                    "index": i,
                    "name": header,
                    "type": data_type,
                    "nullable": True,
                    "description": "",
                    "sample_values": sample_values[:5]  # Include a few sample values
                }
            
            return {
                "columns": columns,
                "delimiter": self.delimiter,
                "file_size": os.path.getsize(file_path),
                "row_count_estimate": self._estimate_row_count(file_path)
            }
        except Exception as e:
            logger.error(f"Error reading CSV schema: {str(e)}")
            return {"error": str(e)}
    
    def read_data(self, file_path: str, batch_size: int = 1000) -> Generator[pd.DataFrame, None, None]:
        """
        Read data from the CSV file as a generator
        
        Args:
            file_path: Path to the file
            batch_size: Number of rows to read at a time
            
        Returns:
            Generator yielding DataFrames
        """
        try:
            # Use pandas to read CSV in chunks
            chunks = pd.read_csv(
                file_path,
                delimiter=self.delimiter,
                chunksize=batch_size,
                low_memory=False,
                encoding_errors='replace',
                na_values=["", "NA", "N/A", "#N/A", "NULL", "None"],
                keep_default_na=True
            )
            
            for chunk in chunks:
                # Clean column names
                chunk.columns = [col.strip() if isinstance(col, str) else col for col in chunk.columns]
                
                yield chunk
        except Exception as e:
            logger.error(f"Error reading CSV data: {str(e)}")
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
            
            return issues
        except Exception as e:
            logger.error(f"Error validating CSV mapping: {str(e)}")
            issues.append({
                "type": "validation_error",
                "message": f"Error validating mapping: {str(e)}"
            })
            return issues
    
    def _infer_type(self, values: List[str]) -> str:
        """
        Infer data type from a list of values
        
        Args:
            values: List of sample values
            
        Returns:
            Inferred data type
        """
        # Remove empty values for type inference
        non_empty = [v for v in values if v and v.strip()]
        if not non_empty:
            return "string"
        
        # Check if all values are numeric
        try:
            # Try converting to int
            all_int = all(self._is_integer(v) for v in non_empty)
            if all_int:
                return "integer"
            
            # Try converting to float
            all_float = all(self._is_float(v) for v in non_empty)
            if all_float:
                return "float"
        except:
            pass
        
        # Check if all values are dates
        try:
            all_dates = all(self._is_date(v) for v in non_empty)
            if all_dates:
                return "date"
        except:
            pass
        
        # Check if all values are booleans
        bool_values = ["true", "false", "yes", "no", "y", "n", "t", "f", "1", "0"]
        if all(v.lower() in bool_values for v in non_empty):
            return "boolean"
        
        # Default to string
        return "string"
    
    def _is_integer(self, value: str) -> bool:
        """Check if value is an integer"""
        try:
            int(value.strip())
            return True
        except:
            return False
    
    def _is_float(self, value: str) -> bool:
        """Check if value is a float"""
        try:
            float(value.strip())
            return True
        except:
            return False
    
    def _is_date(self, value: str) -> bool:
        """Check if value is a date"""
        try:
            pd.to_datetime(value.strip())
            return True
        except:
            return False
    
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
    
    def _estimate_row_count(self, file_path: str) -> int:
        """
        Estimate the number of rows in a CSV file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Estimated row count
        """
        try:
            # Count lines in file
            with open(file_path, "r", errors="ignore") as f:
                # Read first chunk to count lines
                chunk = f.read(1024 * 1024)  # 1MB chunk
                lines_in_chunk = chunk.count("\n")
                
                # If file is smaller than chunk, we have exact count
                if len(chunk) < 1024 * 1024:
                    return lines_in_chunk
                
                # Otherwise estimate based on file size and lines per chunk ratio
                bytes_per_line = len(chunk) / max(lines_in_chunk, 1)
                file_size = os.path.getsize(file_path)
                
                estimated_lines = int(file_size / bytes_per_line)
                
                # Subtract 1 for header if file has at least one line
                if estimated_lines > 0:
                    estimated_lines -= 1
                
                return max(0, estimated_lines)
        except Exception as e:
            logger.error(f"Error estimating row count: {str(e)}")
            return 0