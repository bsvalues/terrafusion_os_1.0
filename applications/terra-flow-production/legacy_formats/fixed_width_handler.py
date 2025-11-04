"""
Fixed-Width Format Handler for legacy data conversion

This handler provides support for fixed-width text files which are 
common in legacy government systems, including property assessment data.
These files typically have no delimiters, with data fields positioned
at specific character positions within each line.
"""

import os
import re
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union, Generator, TextIO
from legacy_converter import FormatHandler, ColumnMapping

# Configure logging
logger = logging.getLogger(__name__)

class FixedWidthHandler(FormatHandler):
    """Handler for fixed-width text files"""
    
    def __init__(self):
        """Initialize fixed-width handler"""
        self.encoding = "utf-8"
        self.column_specs = []  # List of (name, start, end) tuples
        self.has_inferred_specs = False
    
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
        
        if ext in [".txt", ".dat", ".asc"]:
            # Read a sample of the file to check if it looks like fixed-width
            try:
                with open(file_path, "r", errors="ignore") as f:
                    lines = [f.readline().rstrip() for _ in range(10) if f.readline()]
                
                if not lines:
                    return False
                
                # Check if all lines have the same length
                line_lengths = [len(line) for line in lines]
                if len(set(line_lengths)) <= 1:
                    return True
                
                # Check for absence of common delimiters
                if all("," not in line and "\t" not in line and "|" not in line for line in lines):
                    # Check for patterns that suggest fixed column positions
                    # For example, consistent spacing or alignment
                    if self._detect_fixed_width_patterns(lines):
                        return True
            except:
                pass
        
        return False
    
    def read_schema(self, file_path: str) -> Dict[str, Any]:
        """
        Read the schema of the fixed-width file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with schema information
        """
        try:
            # If we haven't inferred column specifications yet, do it now
            if not self.has_inferred_specs:
                self._infer_column_specs(file_path)
            
            # Read a sample of the data using the inferred specs
            df = self._read_sample_data(file_path)
            
            # Collect column information
            columns = {}
            for i, col_spec in enumerate(self.column_specs):
                col_name, start, end = col_spec
                
                # Get dtype and convert to string representation
                dtype = df[col_name].dtype if col_name in df.columns else "object"
                data_type = self._pandas_dtype_to_string(dtype)
                
                # Get sample values
                sample_values = df[col_name].head(5).tolist() if col_name in df.columns else []
                
                # Convert numpy values to Python types for serialization
                sample_values = [self._numpy_to_python(val) for val in sample_values]
                
                columns[col_name] = {
                    "index": i,
                    "name": col_name,
                    "type": data_type,
                    "nullable": True,  # Fixed-width files don't have nulls, but fields can be empty
                    "description": "",
                    "position": {
                        "start": start,
                        "end": end,
                        "width": end - start + 1
                    },
                    "sample_values": sample_values
                }
            
            return {
                "columns": columns,
                "file_size": os.path.getsize(file_path),
                "encoding": self.encoding,
                "row_count_estimate": self._estimate_row_count(file_path)
            }
        except Exception as e:
            logger.error(f"Error reading fixed-width schema: {str(e)}")
            return {"error": str(e)}
    
    def read_data(self, file_path: str, batch_size: int = 1000) -> Generator[pd.DataFrame, None, None]:
        """
        Read data from the fixed-width file as a generator
        
        Args:
            file_path: Path to the file
            batch_size: Number of rows to read at a time
            
        Returns:
            Generator yielding DataFrames
        """
        try:
            # If we haven't inferred column specifications yet, do it now
            if not self.has_inferred_specs:
                self._infer_column_specs(file_path)
            
            # Convert column specs to format expected by pandas
            column_positions = [(name, (start, end + 1)) for name, start, end in self.column_specs]
            
            # Open file
            with open(file_path, "r", encoding=self.encoding, errors="replace") as f:
                while True:
                    # Read batch of lines
                    lines = []
                    for _ in range(batch_size):
                        line = f.readline()
                        if not line:
                            break
                        lines.append(line)
                    
                    # If no lines were read, we're done
                    if not lines:
                        break
                    
                    # Convert batch to DataFrame
                    df = pd.read_fwf(
                        pd.io.common.StringIO("\n".join(lines)),
                        colspecs=[pos for _, pos in column_positions],
                        names=[name for name, _ in column_positions],
                        dtype=str  # Read everything as string initially
                    )
                    
                    # Clean column names
                    df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]
                    
                    # Try to convert to appropriate types
                    self._convert_dtypes(df)
                    
                    yield df
        except Exception as e:
            logger.error(f"Error reading fixed-width data: {str(e)}")
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
                
                # Check if field width might be an issue
                field_width = columns[col_map.source_column]["position"]["width"]
                if field_width > 255 and target_type == "string":
                    issues.append({
                        "type": "field_width",
                        "mapping_index": i,
                        "source_column": col_map.source_column,
                        "target_column": col_map.target_column,
                        "field_width": field_width,
                        "message": f"Fixed-width field '{col_map.source_column}' has width {field_width}, which may exceed target string column capacity. Consider using 'text' type instead."
                    })
            
            return issues
        except Exception as e:
            logger.error(f"Error validating fixed-width mapping: {str(e)}")
            issues.append({
                "type": "validation_error",
                "message": f"Error validating mapping: {str(e)}"
            })
            return issues
    
    def _infer_column_specs(self, file_path: str) -> None:
        """
        Infer column specifications for a fixed-width file
        
        Args:
            file_path: Path to the file
        """
        try:
            # Try different encodings if needed
            encodings = ["utf-8", "latin1", "cp1252"]
            
            # Read sample lines
            for encoding in encodings:
                try:
                    with open(file_path, "r", encoding=encoding, errors="replace") as f:
                        sample_lines = [f.readline().rstrip() for _ in range(30)]
                    self.encoding = encoding
                    break
                except:
                    continue
            
            # Remove empty lines
            sample_lines = [line for line in sample_lines if line.strip()]
            
            if not sample_lines:
                raise ValueError("No data found in file")
            
            # Check if all lines have the same length
            if len(set(len(line) for line in sample_lines)) > 1:
                # Pad shorter lines to match the longest line
                max_length = max(len(line) for line in sample_lines)
                sample_lines = [line.ljust(max_length) for line in sample_lines]
            
            # Try to detect column positions based on patterns in the data
            # Method 1: Look for changes in character types (e.g., letter to digit)
            # Method 2: Look for vertical alignment of specific characters
            # Method 3: Look for repeating patterns of spaces
            
            # First, check if there's a header row that might have field names
            has_header = self._detect_header(sample_lines)
            
            if has_header:
                # Try to use header to detect columns
                header_line = sample_lines[0]
                self.column_specs = self._parse_header(header_line)
                
                # If header detection failed, try other methods
                if not self.column_specs:
                    self.column_specs = self._detect_columns_by_content(sample_lines)
            else:
                # No header, detect columns based on content patterns
                self.column_specs = self._detect_columns_by_content(sample_lines)
            
            # If all else fails, try using pandas.read_fwf's built-in column detection
            if not self.column_specs:
                logger.info("Using pandas to infer fixed-width column positions")
                df = pd.read_fwf(file_path, encoding=self.encoding, nrows=100)
                
                self.column_specs = []
                for i, col in enumerate(df.columns):
                    # Try to find the column position from the original file
                    if hasattr(df, "_engine") and hasattr(df._engine, "column_ranges"):
                        # For newer pandas versions
                        start, end = df._engine.column_ranges[i]
                    else:
                        # Rough estimate for older pandas versions
                        rows = df.head(10).astype(str).values
                        col_data = [str(row[i]) for row in rows if i < len(row)]
                        
                        max_width = max(len(s) for s in col_data if s) if col_data else 10
                        start = sum(max(len(str(df.iloc[0, j])), 10) for j in range(i)) if i > 0 else 0
                        end = start + max_width - 1
                    
                    self.column_specs.append((f"Column_{i+1}" if not col or pd.isna(col) else str(col), start, end))
            
            self.has_inferred_specs = True
            logger.info(f"Inferred {len(self.column_specs)} columns from fixed-width file")
        except Exception as e:
            logger.error(f"Error inferring fixed-width column specs: {str(e)}")
            # Set a basic fallback if inference failed
            if not self.column_specs:
                logger.warning("Using fallback column specification")
                self.column_specs = [("Line", 0, 1000)]  # Catch-all column
                self.has_inferred_specs = True
    
    def _detect_header(self, sample_lines: List[str]) -> bool:
        """
        Detect if the file has a header row
        
        Args:
            sample_lines: Sample lines from the file
            
        Returns:
            True if a header row is detected, False otherwise
        """
        # Skip empty files
        if not sample_lines:
            return False
        
        header_line = sample_lines[0]
        data_lines = sample_lines[1:]
        
        if not data_lines:
            return False
        
        # Check if the header line has more non-alphanumeric characters than data lines
        header_spaces = header_line.count(' ')
        avg_spaces = sum(line.count(' ') for line in data_lines) / len(data_lines)
        
        header_special = sum(1 for c in header_line if not c.isalnum() and not c.isspace())
        avg_special = sum(sum(1 for c in line if not c.isalnum() and not c.isspace()) for line in data_lines) / len(data_lines)
        
        # Check if header line is different from data lines
        if header_spaces > avg_spaces * 1.5 or header_special > avg_special * 1.5:
            return True
        
        # Check if header contains alphabetic characters and data lines contain more numeric characters
        header_alpha = sum(1 for c in header_line if c.isalpha())
        avg_alpha = sum(sum(1 for c in line if c.isalpha()) for line in data_lines) / len(data_lines)
        
        header_digit = sum(1 for c in header_line if c.isdigit())
        avg_digit = sum(sum(1 for c in line if c.isdigit()) for line in data_lines) / len(data_lines)
        
        return (header_alpha > avg_alpha * 1.5) and (header_digit < avg_digit * 0.5)
    
    def _parse_header(self, header_line: str) -> List[Tuple[str, int, int]]:
        """
        Parse a header line to extract column names and positions
        
        Args:
            header_line: Header line from the file
            
        Returns:
            List of (name, start, end) tuples
        """
        column_specs = []
        
        # Remove trailing/leading whitespace
        header_line = header_line.strip()
        
        # Try to split by multiple spaces
        header_parts = re.split(r'\s{2,}', header_line)
        
        if len(header_parts) > 1:
            # Use the position of multiple spaces as column separators
            pos = 0
            for part in header_parts:
                if part.strip():  # Skip empty parts
                    # Find the exact position in the original line
                    while header_line[pos:pos+len(part)] != part:
                        pos += 1
                    
                    column_specs.append((part.strip(), pos, pos + len(part) - 1))
                    pos += len(part)
        
        return column_specs
    
    def _detect_columns_by_content(self, sample_lines: List[str]) -> List[Tuple[str, int, int]]:
        """
        Detect column positions based on content patterns
        
        Args:
            sample_lines: Sample lines from the file
            
        Returns:
            List of (name, start, end) tuples
        """
        if not sample_lines:
            return []
        
        # Find boundaries where character type changes frequently
        boundaries = self._find_type_boundaries(sample_lines)
        
        # No clear boundaries found, try looking for vertical alignment of spaces
        if not boundaries or len(boundaries) < 2:
            boundaries = self._find_space_alignments(sample_lines)
        
        # Convert boundaries to column specifications
        column_specs = []
        for i in range(len(boundaries) - 1):
            start = boundaries[i]
            end = boundaries[i+1] - 1
            
            # Skip zero-width columns
            if end < start:
                continue
            
            # Create a column name
            column_specs.append((f"Column_{i+1}", start, end))
        
        return column_specs
    
    def _find_type_boundaries(self, sample_lines: List[str]) -> List[int]:
        """
        Find column boundaries by detecting changes in character types
        
        Args:
            sample_lines: Sample lines from the file
            
        Returns:
            List of boundary positions
        """
        if not sample_lines or not sample_lines[0]:
            return []
        
        max_length = max(len(line) for line in sample_lines)
        changes = [0] * max_length
        
        for line in sample_lines:
            if not line:
                continue
            
            line = line.ljust(max_length)
            prev_type = None
            
            for i, char in enumerate(line):
                curr_type = None
                if char.isalpha():
                    curr_type = "alpha"
                elif char.isdigit():
                    curr_type = "digit"
                elif char.isspace():
                    curr_type = "space"
                else:
                    curr_type = "special"
                
                if prev_type is not None and prev_type != curr_type:
                    changes[i] += 1
                
                prev_type = curr_type
        
        # Find peaks in the changes array
        boundaries = [0]  # Start position is always a boundary
        threshold = max(changes) * 0.3 if changes else 0
        
        for i in range(1, len(changes) - 1):
            if changes[i] > threshold and changes[i] > changes[i-1] and changes[i] >= changes[i+1]:
                boundaries.append(i)
        
        # Add end position
        boundaries.append(max_length)
        
        # If too many boundaries (more than 30 columns), keep only the strongest ones
        if len(boundaries) > 30:
            # Sort by change count, strongest first
            boundary_values = [(pos, changes[pos] if pos < len(changes) else 0) for pos in boundaries]
            boundary_values.sort(key=lambda x: -x[1])
            
            # Keep start, end, and top boundaries
            keep = [0, max_length]
            for pos, _ in boundary_values:
                if pos not in keep and len(keep) < 30:
                    keep.append(pos)
            
            # Sort by position
            boundaries = sorted(keep)
        
        return boundaries
    
    def _find_space_alignments(self, sample_lines: List[str]) -> List[int]:
        """
        Find column boundaries by detecting vertical alignment of spaces
        
        Args:
            sample_lines: Sample lines from the file
            
        Returns:
            List of boundary positions
        """
        if not sample_lines or not sample_lines[0]:
            return []
        
        max_length = max(len(line) for line in sample_lines)
        space_counts = [0] * max_length
        
        for line in sample_lines:
            if not line:
                continue
            
            line = line.ljust(max_length)
            for i, char in enumerate(line):
                if char.isspace():
                    space_counts[i] += 1
        
        # Normalize space counts to percentage of lines
        num_lines = len(sample_lines)
        space_percentages = [count / num_lines for count in space_counts]
        
        # Find positions where spaces are aligned (high percentage)
        boundaries = [0]  # Start position is always a boundary
        in_spaces = False
        
        for i, pct in enumerate(space_percentages):
            if pct > 0.7 and not in_spaces:  # Start of a space section
                in_spaces = True
            elif pct < 0.3 and in_spaces:  # End of a space section
                boundaries.append(i)
                in_spaces = False
        
        # Add end position
        boundaries.append(max_length)
        
        return boundaries
    
    def _read_sample_data(self, file_path: str) -> pd.DataFrame:
        """
        Read a sample of data from the fixed-width file
        
        Args:
            file_path: Path to the file
            
        Returns:
            DataFrame with sample data
        """
        try:
            # Convert column specs to format expected by pandas
            column_positions = [(name, (start, end + 1)) for name, start, end in self.column_specs]
            
            # Read sample data
            df = pd.read_fwf(
                file_path,
                colspecs=[pos for _, pos in column_positions],
                names=[name for name, _ in column_positions],
                encoding=self.encoding,
                nrows=100
            )
            
            # Clean column names
            df.columns = [col.strip() if isinstance(col, str) else col for col in df.columns]
            
            # Try to convert to appropriate types
            self._convert_dtypes(df)
            
            return df
        except Exception as e:
            logger.error(f"Error reading fixed-width sample data: {str(e)}")
            return pd.DataFrame()
    
    def _convert_dtypes(self, df: pd.DataFrame) -> None:
        """
        Convert DataFrame columns to appropriate types
        
        Args:
            df: DataFrame to convert
        """
        for col in df.columns:
            try:
                # Try to infer better types
                if df[col].dtype == 'object':
                    # First check if column is all numeric
                    try:
                        df[col] = pd.to_numeric(df[col], errors='raise')
                        continue
                    except:
                        pass
                    
                    # Then check if column is datetime
                    try:
                        df[col] = pd.to_datetime(df[col], errors='raise')
                        continue
                    except:
                        pass
                    
                    # Then check if column is boolean
                    if df[col].dropna().isin(['True', 'False', 'true', 'false', 'T', 'F', 'Y', 'N', 'Yes', 'No', 'yes', 'no', '1', '0']).all():
                        df[col] = df[col].map({
                            'True': True, 'true': True, 'T': True, 'Y': True, 'Yes': True, 'yes': True, '1': True,
                            'False': False, 'false': False, 'F': False, 'N': False, 'No': False, 'no': False, '0': False
                        })
            except:
                pass
    
    def _estimate_row_count(self, file_path: str) -> int:
        """
        Estimate the number of rows in a fixed-width file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Estimated row count
        """
        try:
            # Count lines in file
            with open(file_path, "r", encoding=self.encoding, errors="ignore") as f:
                # Read first chunk to count lines
                chunk = f.read(1024 * 1024)  # 1MB chunk
                lines_in_chunk = chunk.count("\n")
                
                # If file is smaller than chunk, we have exact count
                if len(chunk) < 1024 * 1024:
                    return lines_in_chunk
                
                # Otherwise estimate based on file size and lines per chunk ratio
                bytes_per_line = len(chunk) / max(lines_in_chunk, 1)
                file_size = os.path.getsize(file_path)
                
                return int(file_size / bytes_per_line)
        except Exception as e:
            logger.error(f"Error estimating row count: {str(e)}")
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
        elif isinstance(val, pd.Timestamp):
            return val.isoformat()
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