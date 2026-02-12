"""
XML Format Handler for legacy data conversion

This handler provides support for XML files which are common for 
data exchange in government systems, particularly for property 
assessment and tax data.
"""

import os
import re
import logging
import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional, Union, Generator
from legacy_converter import FormatHandler, ColumnMapping

# Configure logging
logger = logging.getLogger(__name__)

class XMLHandler(FormatHandler):
    """Handler for XML format files"""
    
    def __init__(self):
        """Initialize XML handler"""
        self.encoding = "utf-8"
        self.row_xpath = None
        self.column_paths = []
        self.column_names = []
        self.detected_structure = {}
    
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
        
        if ext in [".xml"]:
            # Try to parse as XML
            try:
                with open(file_path, "rb") as f:
                    header = f.read(100)
                    # Check for XML declaration
                    if b"<?xml" in header:
                        return True
                    
                    # Try to parse as XML
                    with open(file_path, "r", encoding=self.encoding, errors="ignore") as f:
                        content = f.read(1000)  # Read a sample
                        if "<" in content and ">" in content:
                            return True
            except:
                pass
        
        return False
    
    def read_schema(self, file_path: str) -> Dict[str, Any]:
        """
        Read the schema of the XML file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with schema information
        """
        try:
            # Analyze XML structure
            self._analyze_xml_structure(file_path)
            
            # Read a sample of the data
            df = self._read_sample_data(file_path)
            
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
                
                # Get the xpath for this column
                xpath = self.column_paths[i] if i < len(self.column_paths) else ""
                
                columns[col_name] = {
                    "index": i,
                    "name": col_name,
                    "type": data_type,
                    "nullable": df[col_name].isna().any(),
                    "description": "",
                    "xpath": xpath,
                    "sample_values": sample_values
                }
            
            # Get row count estimate
            row_count = self._estimate_row_count(file_path)
            
            return {
                "columns": columns,
                "file_size": os.path.getsize(file_path),
                "encoding": self.encoding,
                "row_xpath": self.row_xpath,
                "row_count_estimate": row_count,
                "structure": self.detected_structure
            }
        except Exception as e:
            logger.error(f"Error reading XML schema: {str(e)}")
            return {"error": str(e)}
    
    def read_data(self, file_path: str, batch_size: int = 1000) -> Generator[pd.DataFrame, None, None]:
        """
        Read data from the XML file as a generator
        
        Args:
            file_path: Path to the file
            batch_size: Number of rows to read at a time
            
        Returns:
            Generator yielding DataFrames
        """
        try:
            # Ensure we have analyzed the XML structure
            if not self.row_xpath:
                self._analyze_xml_structure(file_path)
            
            # Use iterparse to avoid loading the entire file into memory
            context = ET.iterparse(file_path, events=("end",))
            
            # Extract the root element path from row_xpath
            row_tag = self.row_xpath.split("/")[-1]
            
            # Initialize batch data
            batch_data = {col: [] for col in self.column_names}
            row_count = 0
            
            # Process the XML file incrementally
            for event, elem in context:
                if elem.tag == row_tag:
                    # Extract data from this element
                    row_data = self._extract_element_data(elem, self.column_paths, self.column_names)
                    
                    # Add to batch
                    for col, value in row_data.items():
                        batch_data[col].append(value)
                    
                    row_count += 1
                    
                    # Clear element to save memory
                    elem.clear()
                    
                    # If batch is full, yield it
                    if row_count >= batch_size:
                        df = pd.DataFrame(batch_data)
                        self._convert_dtypes(df)
                        yield df
                        
                        # Reset batch
                        batch_data = {col: [] for col in self.column_names}
                        row_count = 0
            
            # Yield the last batch if not empty
            if row_count > 0:
                df = pd.DataFrame(batch_data)
                self._convert_dtypes(df)
                yield df
        except Exception as e:
            logger.error(f"Error reading XML data: {str(e)}")
            
            # Fallback to simpler method if iterparse fails
            try:
                logger.info("Trying alternative XML reading method")
                import xml.etree.ElementTree as ET
                
                tree = ET.parse(file_path)
                root = tree.getroot()
                
                # Extract all rows
                rows = []
                for elem in root.findall(self.row_xpath):
                    row_data = self._extract_element_data(elem, self.column_paths, self.column_names)
                    rows.append(row_data)
                
                # Split into batches
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i+batch_size]
                    df = pd.DataFrame(batch)
                    self._convert_dtypes(df)
                    yield df
            except Exception as e2:
                logger.error(f"Error with alternative XML reading: {str(e2)}")
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
            logger.error(f"Error validating XML mapping: {str(e)}")
            issues.append({
                "type": "validation_error",
                "message": f"Error validating mapping: {str(e)}"
            })
            return issues
    
    def _analyze_xml_structure(self, file_path: str) -> None:
        """
        Analyze the structure of an XML file to determine row and column paths
        
        Args:
            file_path: Path to the file
        """
        try:
            # Parse the XML file
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Start by identifying the structure
            structure = self._analyze_element(root)
            self.detected_structure = structure
            
            # Find potential row elements (elements with many identical siblings)
            candidates = self._find_row_candidates(root)
            
            if not candidates:
                # Fallback: assume direct children of root are rows
                self.row_xpath = f"./{root.tag}"
                row_element = root
            else:
                # Use the most likely candidate
                best_candidate = max(candidates, key=lambda x: x[1])
                self.row_xpath = best_candidate[0]
                
                # Get a sample row element
                row_element = root.find(self.row_xpath.lstrip("."))
            
            # Now map out the columns within the row
            if row_element is not None:
                self.column_paths, self.column_names = self._map_columns(row_element)
            else:
                # Fallback to simple flattening if no clear row structure
                logger.warning("No clear row structure found, using flat approach")
                self.row_xpath = "."
                self._map_flat_structure(root)
            
            logger.info(f"Detected {len(self.column_names)} columns in XML structure")
        except Exception as e:
            logger.error(f"Error analyzing XML structure: {str(e)}")
            # Set default values
            self.row_xpath = "."
            self.column_paths = []
            self.column_names = ["xml_content"]
    
    def _analyze_element(self, element, path="", max_depth=5, current_depth=0) -> Dict:
        """
        Recursively analyze XML element structure
        
        Args:
            element: XML element to analyze
            path: Current XPath
            max_depth: Maximum recursion depth
            current_depth: Current recursion depth
            
        Returns:
            Dict with element structure information
        """
        if current_depth > max_depth:
            return {"type": "truncated"}
        
        result = {
            "tag": element.tag,
            "attributes": {k: v for k, v in element.attrib.items()},
            "children": {},
            "text": element.text.strip() if element.text else ""
        }
        
        # Group children by tag
        children_by_tag = {}
        for child in element:
            if child.tag not in children_by_tag:
                children_by_tag[child.tag] = []
            children_by_tag[child.tag].append(child)
        
        # Process each child group
        for tag, children in children_by_tag.items():
            # If multiple children with same tag, analyze just one as example
            if len(children) > 1:
                child_path = f"{path}/{tag}"
                result["children"][tag] = {
                    "count": len(children),
                    "sample": self._analyze_element(children[0], child_path, max_depth, current_depth + 1)
                }
            else:
                child_path = f"{path}/{tag}"
                result["children"][tag] = self._analyze_element(children[0], child_path, max_depth, current_depth + 1)
        
        return result
    
    def _find_row_candidates(self, root, min_repeats=5):
        """
        Find elements that appear to be rows of data
        
        Args:
            root: Root XML element
            min_repeats: Minimum number of repeats to consider as rows
            
        Returns:
            List of (xpath, count) tuples for candidate row elements
        """
        candidates = []
        
        # Check all paths in the document
        for path in self._get_all_paths(root):
            elements = root.findall(path)
            if len(elements) >= min_repeats:
                # Check if all elements have similar structure
                if self._elements_have_similar_structure(elements[:min(10, len(elements))]):
                    candidates.append((f".{path}", len(elements)))
        
        # Sort by path length (shorter paths are closer to root)
        candidates.sort(key=lambda x: len(x[0]))
        
        return candidates
    
    def _get_all_paths(self, element, current_path="", paths=None):
        """
        Get all possible XPaths in the document
        
        Args:
            element: Current XML element
            current_path: Current path
            paths: List of paths found so far
            
        Returns:
            List of XPaths
        """
        if paths is None:
            paths = []
        
        for child in element:
            child_path = f"{current_path}/{child.tag}"
            if child_path not in paths:
                paths.append(child_path)
                self._get_all_paths(child, child_path, paths)
        
        return paths
    
    def _elements_have_similar_structure(self, elements):
        """
        Check if a list of elements have similar structure
        
        Args:
            elements: List of XML elements
            
        Returns:
            True if elements have similar structure, False otherwise
        """
        if not elements:
            return False
        
        # Get the tags of children for the first element
        first_element_children = {child.tag for child in elements[0]}
        
        # Check if all other elements have similar children
        for element in elements[1:]:
            element_children = {child.tag for child in element}
            # If the symmetric difference is more than half the tags, structures are too different
            if len(first_element_children.symmetric_difference(element_children)) > len(first_element_children) / 2:
                return False
        
        return True
    
    def _map_columns(self, row_element, prefix=""):
        """
        Map column paths and names from a row element
        
        Args:
            row_element: XML element representing a row
            prefix: XPath prefix
            
        Returns:
            Tuple of (column_paths, column_names)
        """
        column_paths = []
        column_names = []
        
        # First, check for direct child text nodes
        for child in row_element:
            if child.text and child.text.strip():
                # This is a potential column
                xpath = f"{prefix}/{child.tag}"
                column_paths.append(xpath)
                column_names.append(child.tag)
            
            # Also check for attributes
            for attr_name in child.attrib:
                xpath = f"{prefix}/{child.tag}/@{attr_name}"
                column_paths.append(xpath)
                column_names.append(f"{child.tag}_{attr_name}")
            
            # Recursively check deeper elements, but limit depth
            if len(list(child)) > 0 and len(column_paths) < 100:  # Limit to avoid too many columns
                child_paths, child_names = self._map_columns(child, f"{prefix}/{child.tag}")
                column_paths.extend(child_paths)
                column_names.extend(child_names)
        
        # Also include attributes of the row element itself
        for attr_name in row_element.attrib:
            xpath = f"{prefix}/@{attr_name}"
            column_paths.append(xpath)
            column_names.append(attr_name)
        
        # If no columns found, use the element text as a single column
        if not column_paths and row_element.text and row_element.text.strip():
            column_paths.append(prefix)
            column_names.append(row_element.tag)
        
        return column_paths, column_names
    
    def _map_flat_structure(self, root):
        """
        Map a flat structure by extracting all unique paths
        
        Args:
            root: Root XML element
        """
        # This is a fallback for XML files without a clear row structure
        all_paths = []
        all_names = []
        
        # Function to recursively extract all paths
        def extract_paths(element, current_path=""):
            # Add this element's text if it has any
            if element.text and element.text.strip():
                path = f"{current_path}/{element.tag}"
                if path not in all_paths:
                    all_paths.append(path)
                    all_names.append(element.tag)
            
            # Add attributes
            for attr_name, attr_value in element.attrib.items():
                path = f"{current_path}/{element.tag}/@{attr_name}"
                if path not in all_paths:
                    all_paths.append(path)
                    all_names.append(f"{element.tag}_{attr_name}")
            
            # Process children
            for child in element:
                extract_paths(child, f"{current_path}/{element.tag}")
        
        extract_paths(root)
        
        # Limit to a reasonable number of columns
        max_columns = 100
        if len(all_paths) > max_columns:
            all_paths = all_paths[:max_columns]
            all_names = all_names[:max_columns]
        
        self.column_paths = all_paths
        self.column_names = all_names
    
    def _extract_element_data(self, element, paths, names):
        """
        Extract data from an XML element based on XPaths
        
        Args:
            element: XML element
            paths: List of XPaths
            names: List of column names
            
        Returns:
            Dict with column values
        """
        result = {name: None for name in names}
        
        # Process each path
        for i, path in enumerate(paths):
            if i >= len(names):
                break
            
            name = names[i]
            
            # Handle attribute paths
            if "/@" in path:
                elem_path, attr_name = path.rsplit("/@", 1)
                # Remove leading dot if present
                if elem_path.startswith("./"):
                    elem_path = elem_path[1:]
                elif elem_path.startswith("/"):
                    elem_path = elem_path[1:]
                
                # Find the element
                if not elem_path:
                    # Attribute of the current element
                    if attr_name in element.attrib:
                        result[name] = element.attrib[attr_name]
                else:
                    # Attribute of a child element
                    try:
                        child = element.find(elem_path)
                        if child is not None and attr_name in child.attrib:
                            result[name] = child.attrib[attr_name]
                    except:
                        pass
            else:
                # Handle element text
                clean_path = path
                if clean_path.startswith("./"):
                    clean_path = clean_path[2:]
                elif clean_path.startswith("/"):
                    clean_path = clean_path[1:]
                
                if not clean_path or clean_path == element.tag:
                    # This element's text
                    result[name] = element.text.strip() if element.text else None
                else:
                    # Child element's text
                    try:
                        child = element.find(clean_path)
                        if child is not None:
                            result[name] = child.text.strip() if child.text else None
                    except:
                        pass
        
        return result
    
    def _read_sample_data(self, file_path: str, num_rows=100) -> pd.DataFrame:
        """
        Read a sample of data from the XML file
        
        Args:
            file_path: Path to the file
            num_rows: Number of rows to read
            
        Returns:
            DataFrame with sample data
        """
        try:
            # Ensure we have analyzed the XML structure
            if not self.row_xpath:
                self._analyze_xml_structure(file_path)
            
            # Parse the XML file
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract data from rows
            rows = []
            for i, elem in enumerate(root.findall(self.row_xpath.lstrip("."))):
                if i >= num_rows:
                    break
                
                row_data = self._extract_element_data(elem, self.column_paths, self.column_names)
                rows.append(row_data)
            
            # Create DataFrame
            df = pd.DataFrame(rows)
            
            # Try to convert to appropriate types
            self._convert_dtypes(df)
            
            return df
        except Exception as e:
            logger.error(f"Error reading XML sample data: {str(e)}")
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
                    # First check if column is numeric
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
        Estimate the number of rows in an XML file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Estimated row count
        """
        try:
            # For small files, just count directly
            file_size = os.path.getsize(file_path)
            if file_size < 10 * 1024 * 1024:  # 10MB
                tree = ET.parse(file_path)
                root = tree.getroot()
                return len(root.findall(self.row_xpath.lstrip(".")))
            
            # For larger files, estimate based on sample
            sample_size = 1024 * 1024  # 1MB
            with open(file_path, "r", encoding=self.encoding, errors="ignore") as f:
                sample = f.read(sample_size)
            
            # Count row elements in sample
            sample_count = sample.count(f"<{self.row_xpath.split('/')[-1]}")
            if sample_count == 0:
                return 0
            
            # Estimate total based on file size ratio
            estimated_count = int(sample_count * (file_size / sample_size))
            return estimated_count
        except Exception as e:
            logger.error(f"Error estimating XML row count: {str(e)}")
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