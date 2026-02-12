"""
Simple test for mapping loader functionality
"""

import os
import sys
from sync_service.mapping_loader import get_mapping_loader

def main():
    """Test mapping loader functionality"""
    print("Testing mapping loader...")
    
    # Get mapping loader
    mapping_loader = get_mapping_loader()
    
    # Create field mapping
    field_mapping = {
        "property_id": "PropertyID",
        "parcel_number": "ParcelNumber",
        "property_type": "PropertyType",
        "address": "StreetAddress"
    }
    
    # Create mapping
    success = mapping_loader.create_mapping("property", "simple_test", field_mapping)
    
    if success:
        print("Created mapping: property/simple_test")
    else:
        print("Failed to create mapping")
        return
    
    # List mappings
    mappings = mapping_loader.list_mappings()
    print("\nAvailable mappings:")
    for data_type, mapping_names in mappings.items():
        print(f"Data type: {data_type}")
        for name in mapping_names:
            print(f"  - {name}")
    
    # Get mapping
    retrieved_mapping = mapping_loader.get_mapping("property", "simple_test")
    
    if retrieved_mapping:
        print("\nRetrieved mapping: property/simple_test")
        print("Fields:")
        for target, source in retrieved_mapping.items():
            print(f"  {target} -> {source}")
    else:
        print("Failed to retrieve mapping")

if __name__ == "__main__":
    main()