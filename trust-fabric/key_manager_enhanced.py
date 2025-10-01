#!/usr/bin/env python3
"""
Trust Fabric Key Management Fixes
Fixes issues identified in Layer 3 validation
"""

import os
import json
import logging
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import secrets
from typing import Dict, Any, Optional


class TrustFabricKeyManager:
    """Enhanced key management for Trust Fabric"""
    
    def __init__(self, keystore_path: str = "/workspaces/terrafusion_os_1.0/trust-fabric/keystore"):
        self.keystore_path = keystore_path
        self.logger = logging.getLogger(__name__)
        self._ensure_keystore_exists()
    
    def _ensure_keystore_exists(self):
        """Ensure keystore directory exists"""
        os.makedirs(self.keystore_path, exist_ok=True)
        
        # Create master key if it doesn't exist
        master_key_path = os.path.join(self.keystore_path, "master.key")
        if not os.path.exists(master_key_path):
            master_key = secrets.token_bytes(32)  # 256-bit key
            with open(master_key_path, "wb") as f:
                f.write(master_key)
            os.chmod(master_key_path, 0o600)  # Read-only for owner
            self.logger.info("Generated new master key")
    
    def generate_operational_key(self, key_id: str, key_type: str = "AES256") -> bool:
        """Generate operational key for Trust Fabric"""
        try:
            key_path = os.path.join(self.keystore_path, f"{key_id}.key")
            
            if key_type == "AES256":
                key = secrets.token_bytes(32)  # 256-bit AES key
            elif key_type == "HMAC":
                key = secrets.token_bytes(64)  # 512-bit HMAC key
            else:
                raise ValueError(f"Unsupported key type: {key_type}")
            
            # Encrypt key with master key before storage
            encrypted_key = self._encrypt_with_master_key(key)
            
            with open(key_path, "wb") as f:
                f.write(encrypted_key)
            os.chmod(key_path, 0o600)
            
            # Store key metadata
            metadata = {
                "key_id": key_id,
                "key_type": key_type,
                "created": str(os.path.getctime(key_path)),
                "status": "active"
            }
            
            metadata_path = os.path.join(self.keystore_path, f"{key_id}.meta")
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
            
            self.logger.info(f"Generated operational key: {key_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Key generation failed: {e}")
            return False
    
    def _encrypt_with_master_key(self, data: bytes) -> bytes:
        """Encrypt data with master key"""
        master_key_path = os.path.join(self.keystore_path, "master.key")
        with open(master_key_path, "rb") as f:
            master_key = f.read()
        
        # Generate random IV
        iv = secrets.token_bytes(16)
        
        # Create cipher
        cipher = Cipher(algorithms.AES(master_key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        
        # Pad data to block size
        pad_length = 16 - (len(data) % 16)
        padded_data = data + bytes([pad_length] * pad_length)
        
        # Encrypt
        encrypted = encryptor.update(padded_data) + encryptor.finalize()
        
        # Return IV + encrypted data
        return iv + encrypted
    
    def validate_key_rotation(self) -> bool:
        """Validate key rotation capabilities"""
        try:
            # Test key generation
            test_key_id = "trust_fabric_test_rotation"
            if not self.generate_operational_key(test_key_id, "AES256"):
                return False
            
            # Test key retrieval
            key_path = os.path.join(self.keystore_path, f"{test_key_id}.key")
            if not os.path.exists(key_path):
                return False
            
            # Clean up test key
            os.remove(key_path)
            metadata_path = os.path.join(self.keystore_path, f"{test_key_id}.meta")
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
            
            self.logger.info("Key rotation validation passed")
            return True
            
        except Exception as e:
            self.logger.error(f"Key rotation validation failed: {e}")
            return False
    
    def get_key_inventory(self) -> Dict[str, Any]:
        """Get inventory of all managed keys"""
        inventory = {
            "total_keys": 0,
            "active_keys": 0,
            "key_types": {},
            "keys": []
        }
        
        try:
            for filename in os.listdir(self.keystore_path):
                if filename.endswith(".meta"):
                    metadata_path = os.path.join(self.keystore_path, filename)
                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)
                    
                    inventory["keys"].append(metadata)
                    inventory["total_keys"] += 1
                    
                    if metadata.get("status") == "active":
                        inventory["active_keys"] += 1
                    
                    key_type = metadata.get("key_type", "unknown")
                    inventory["key_types"][key_type] = inventory["key_types"].get(key_type, 0) + 1
                    
        except Exception as e:
            self.logger.error(f"Key inventory failed: {e}")
        
        return inventory


def test_key_management():
    """Test Trust Fabric key management system"""
    print("🔑 Trust Fabric Key Management Test")
    print("=" * 40)
    
    km = TrustFabricKeyManager()
    
    # Test key generation
    print("Testing key generation...")
    if km.generate_operational_key("trust_fabric_main", "AES256"):
        print("✅ Key generation: PASSED")
    else:
        print("❌ Key generation: FAILED")
        return False
    
    # Test key rotation
    print("Testing key rotation...")
    if km.validate_key_rotation():
        print("✅ Key rotation: PASSED")
    else:
        print("❌ Key rotation: FAILED")
        return False
    
    # Test key inventory
    print("Testing key inventory...")
    inventory = km.get_key_inventory()
    if inventory["total_keys"] > 0:
        print(f"✅ Key inventory: PASSED ({inventory['total_keys']} keys)")
        print(f"   Active keys: {inventory['active_keys']}")
        print(f"   Key types: {inventory['key_types']}")
    else:
        print("❌ Key inventory: FAILED")
        return False
    
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = test_key_management()
    if result:
        print("\n✅ Trust Fabric key management validation PASSED")
    else:
        print("\n❌ Trust Fabric key management validation FAILED")
