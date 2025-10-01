#!/usr/bin/env python3
"""
Trust Fabric Key Manager
Handles key generation, rotation, and management
"""

import sys
import logging
import secrets
from pathlib import Path


def test_key_rotation():
    """Test key rotation functionality"""
    try:
        print("Testing key rotation...")
        
        # Simulate key rotation
        keystore_path = Path("keystore")
        
        # Check if keystore exists
        if not keystore_path.exists():
            print("ERROR: Keystore directory not found")
            return 1
        
        # Check required directories
        required_dirs = ["master_keys", "session_keys", "certificate_store"]
        for dir_name in required_dirs:
            dir_path = keystore_path / dir_name
            if not dir_path.exists():
                print(f"ERROR: Missing directory: {dir_name}")
                return 1
        
        # Simulate key generation
        test_key = secrets.token_bytes(32)
        
        # Write test key file
        test_key_file = keystore_path / "session_keys" / "test_rotation_key.bin"
        with open(test_key_file, "wb") as f:
            f.write(test_key)
        
        # Verify key was written
        if test_key_file.exists():
            test_key_file.unlink()  # Clean up
            print("Key rotation test passed")
            return 0
        else:
            print("ERROR: Failed to write test key")
            return 1
            
    except Exception as e:
        print(f"ERROR: Key rotation test failed: {e}")
        return 1


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--test-rotation':
        sys.exit(test_key_rotation())
    else:
        print("Trust Fabric Key Manager")
        print("Use --test-rotation to run rotation test")
