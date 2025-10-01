#!/usr/bin/env python3
"""
Trust Fabric Certificate Authority Validator
"""

import sys
import logging
from pathlib import Path


def test_ca_infrastructure():
    """Test CA infrastructure"""
    try:
        print("Testing CA infrastructure...")
        
        ca_path = Path("ca")
        
        # Check CA files
        required_files = [
            "root_ca.crt",
            "intermediate_ca.crt", 
            "ca_private.key",
            "crl.pem"
        ]
        
        missing_files = []
        for file_name in required_files:
            file_path = ca_path / file_name
            if not file_path.exists():
                missing_files.append(file_name)
        
        if missing_files:
            print(f"ERROR: Missing CA files: {', '.join(missing_files)}")
            return 1
        
        # Validate CA certificate structure (basic check)
        root_ca_path = ca_path / "root_ca.crt"
        with open(root_ca_path, 'r') as f:
            content = f.read()
            if "BEGIN CERTIFICATE" not in content:
                print("ERROR: Invalid root CA certificate format")
                return 1
        
        print("CA infrastructure test passed")
        return 0
        
    except Exception as e:
        print(f"ERROR: CA test failed: {e}")
        return 1


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--test-ca':
        sys.exit(test_ca_infrastructure())
    else:
        print("Trust Fabric CA Validator")
        print("Use --test-ca to run CA test")
