"""
Field Mapping Loader

This module provides a mapping loader for ETL operations that handles
loading, creating, updating, and deleting field mappings.
"""

import os
import json
import logging
import datetime
from typing import Dict, List, Any, Optional, Union

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mapping loader instance
_mapping_loader = None

class MappingLoader:
    """
    Field mapping loader class
    
    This class provides functionality for loading, creating, updating, and
    deleting field mappings used in ETL operations.
    """
    
    def __init__(self, mappings_dir: Optional[str] = None):
        """
        Initialize the mapping loader
        
        Args:
            mappings_dir: Directory where mapping files are stored (optional)
        """
        if mappings_dir is None:
            mappings_dir = os.path.join(os.getcwd(), 'sync_service', 'mappings')
            
        self.mappings_dir = mappings_dir
        os.makedirs(self.mappings_dir, exist_ok=True)
        
        # Cache for loaded mappings
        self._mappings_cache = {}
        self._mapping_list_cache = {}
        
        logger.info(f"Mapping loader initialized with directory: {self.mappings_dir}")
    
    def list_mappings(self, data_type: Optional[str] = None) -> Dict[str, List[str]]:
        """
        List available mappings by data type
        
        Args:
            data_type: Optional data type to filter mappings (property, sales, valuation, tax)
            
        Returns:
            Dictionary with data types as keys and lists of mapping names as values
        """
        # Clear cache to get fresh list
        self._mapping_list_cache = {}
        
        # Get list of mapping files
        result = {}
        try:
            for filename in os.listdir(self.mappings_dir):
                if filename.endswith('.json'):
                    try:
                        with open(os.path.join(self.mappings_dir, filename), 'r') as f:
                            mapping_data = json.load(f)
                            
                            if 'data_type' in mapping_data and 'name' in mapping_data:
                                mapping_type = mapping_data['data_type']
                                mapping_name = mapping_data['name']
                                
                                if mapping_type not in result:
                                    result[mapping_type] = []
                                    
                                result[mapping_type].append(mapping_name)
                    except Exception as e:
                        logger.error(f"Error loading mapping file {filename}: {str(e)}")
        except Exception as e:
            logger.error(f"Error listing mappings in directory {self.mappings_dir}: {str(e)}")
        
        # Update cache
        self._mapping_list_cache = result
        
        # Filter by data type if provided
        if data_type:
            return {data_type: result.get(data_type, [])}
        
        return result
    
    def get_mapping(self, data_type: str, mapping_name: str) -> Optional[Dict[str, str]]:
        """
        Get a specific mapping
        
        Args:
            data_type: Data type (property, sales, valuation, tax)
            mapping_name: Name of the mapping
            
        Returns:
            Dictionary with field mappings or None if not found
        """
        # Check cache first
        cache_key = f"{data_type}_{mapping_name}"
        if cache_key in self._mappings_cache:
            return self._mappings_cache[cache_key]
        
        # Find mapping file
        filename = f"{data_type}_{mapping_name}.json"
        filepath = os.path.join(self.mappings_dir, filename)
        
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r') as f:
                    mapping_data = json.load(f)
                    
                    if 'mapping' in mapping_data:
                        # Update cache
                        self._mappings_cache[cache_key] = mapping_data['mapping']
                        return mapping_data['mapping']
            except Exception as e:
                logger.error(f"Error loading mapping file {filename}: {str(e)}")
        
        # Try alternative filename format
        for filename in os.listdir(self.mappings_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(self.mappings_dir, filename), 'r') as f:
                        mapping_data = json.load(f)
                        
                        if mapping_data.get('data_type') == data_type and mapping_data.get('name') == mapping_name:
                            if 'mapping' in mapping_data:
                                # Update cache
                                self._mappings_cache[cache_key] = mapping_data['mapping']
                                return mapping_data['mapping']
                except Exception:
                    pass
        
        return None
    
    def create_mapping(self, data_type: str, mapping_name: str, mapping: Dict[str, str]) -> bool:
        """
        Create a new mapping
        
        Args:
            data_type: Data type (property, sales, valuation, tax)
            mapping_name: Name of the mapping
            mapping: Dictionary with field mappings
            
        Returns:
            True if successful, False otherwise
        """
        # Validate inputs
        if not data_type or not mapping_name or not mapping:
            logger.error("Invalid mapping parameters: data_type, mapping_name, and mapping are required")
            return False
        
        # Create mapping file
        filename = f"{data_type}_{mapping_name}.json"
        filepath = os.path.join(self.mappings_dir, filename)
        
        # Check if file already exists
        if os.path.exists(filepath):
            logger.error(f"Mapping file already exists: {filename}")
            return False
        
        # Create mapping data
        mapping_data = {
            'data_type': data_type,
            'name': mapping_name,
            'mapping': mapping,
            'created': datetime.datetime.now().isoformat()
        }
        
        # Write to file
        try:
            with open(filepath, 'w') as f:
                json.dump(mapping_data, f, indent=2)
            
            # Update cache
            cache_key = f"{data_type}_{mapping_name}"
            self._mappings_cache[cache_key] = mapping
            
            # Clear list cache to force refresh
            self._mapping_list_cache = {}
            
            logger.info(f"Created new mapping: {data_type}/{mapping_name}")
            return True
        except Exception as e:
            logger.error(f"Error creating mapping file {filename}: {str(e)}")
            return False
    
    def update_mapping(self, data_type: str, mapping_name: str, mapping: Dict[str, str]) -> bool:
        """
        Update an existing mapping
        
        Args:
            data_type: Data type (property, sales, valuation, tax)
            mapping_name: Name of the mapping
            mapping: Dictionary with field mappings
            
        Returns:
            True if successful, False otherwise
        """
        # Validate inputs
        if not data_type or not mapping_name or not mapping:
            logger.error("Invalid mapping parameters: data_type, mapping_name, and mapping are required")
            return False
        
        # Find mapping file
        filename = f"{data_type}_{mapping_name}.json"
        filepath = os.path.join(self.mappings_dir, filename)
        
        # Check if standard file exists
        if os.path.exists(filepath):
            try:
                # Load existing data to preserve metadata
                with open(filepath, 'r') as f:
                    mapping_data = json.load(f)
                
                # Update mapping
                mapping_data['mapping'] = mapping
                mapping_data['updated'] = datetime.datetime.now().isoformat()
                
                # Write back to file
                with open(filepath, 'w') as f:
                    json.dump(mapping_data, f, indent=2)
                
                # Update cache
                cache_key = f"{data_type}_{mapping_name}"
                self._mappings_cache[cache_key] = mapping
                
                logger.info(f"Updated mapping: {data_type}/{mapping_name}")
                return True
            except Exception as e:
                logger.error(f"Error updating mapping file {filename}: {str(e)}")
                return False
        
        # Try to find alternative filename format
        for filename in os.listdir(self.mappings_dir):
            if filename.endswith('.json'):
                try:
                    filepath = os.path.join(self.mappings_dir, filename)
                    with open(filepath, 'r') as f:
                        mapping_data = json.load(f)
                        
                        if mapping_data.get('data_type') == data_type and mapping_data.get('name') == mapping_name:
                            # Update mapping
                            mapping_data['mapping'] = mapping
                            mapping_data['updated'] = datetime.datetime.now().isoformat()
                            
                            # Write back to file
                            with open(filepath, 'w') as f:
                                json.dump(mapping_data, f, indent=2)
                            
                            # Update cache
                            cache_key = f"{data_type}_{mapping_name}"
                            self._mappings_cache[cache_key] = mapping
                            
                            logger.info(f"Updated mapping: {data_type}/{mapping_name}")
                            return True
                except Exception:
                    pass
        
        logger.error(f"Mapping not found: {data_type}/{mapping_name}")
        return False
    
    def delete_mapping(self, data_type: str, mapping_name: str) -> bool:
        """
        Delete a mapping
        
        Args:
            data_type: Data type (property, sales, valuation, tax)
            mapping_name: Name of the mapping
            
        Returns:
            True if successful, False otherwise
        """
        # Validate inputs
        if not data_type or not mapping_name:
            logger.error("Invalid mapping parameters: data_type and mapping_name are required")
            return False
        
        # Find mapping file
        filename = f"{data_type}_{mapping_name}.json"
        filepath = os.path.join(self.mappings_dir, filename)
        
        # Check if standard file exists
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                
                # Clear caches
                cache_key = f"{data_type}_{mapping_name}"
                if cache_key in self._mappings_cache:
                    del self._mappings_cache[cache_key]
                
                self._mapping_list_cache = {}
                
                logger.info(f"Deleted mapping: {data_type}/{mapping_name}")
                return True
            except Exception as e:
                logger.error(f"Error deleting mapping file {filename}: {str(e)}")
                return False
        
        # Try to find alternative filename format
        for filename in os.listdir(self.mappings_dir):
            if filename.endswith('.json'):
                try:
                    filepath = os.path.join(self.mappings_dir, filename)
                    with open(filepath, 'r') as f:
                        mapping_data = json.load(f)
                        
                        if mapping_data.get('data_type') == data_type and mapping_data.get('name') == mapping_name:
                            os.remove(filepath)
                            
                            # Clear caches
                            cache_key = f"{data_type}_{mapping_name}"
                            if cache_key in self._mappings_cache:
                                del self._mappings_cache[cache_key]
                            
                            self._mapping_list_cache = {}
                            
                            logger.info(f"Deleted mapping: {data_type}/{mapping_name}")
                            return True
                except Exception:
                    pass
        
        logger.error(f"Mapping not found: {data_type}/{mapping_name}")
        return False
    
    def clear_cache(self):
        """Clear the mapping cache"""
        self._mappings_cache = {}
        self._mapping_list_cache = {}
        logger.info("Mapping cache cleared")

def get_mapping_loader(mappings_dir: Optional[str] = None) -> MappingLoader:
    """
    Get a mapping loader instance
    
    Args:
        mappings_dir: Directory where mapping files are stored (optional)
        
    Returns:
        MappingLoader instance
    """
    global _mapping_loader
    
    if _mapping_loader is None:
        _mapping_loader = MappingLoader(mappings_dir)
    
    return _mapping_loader