"""
Encryption Framework

This module implements a comprehensive encryption framework for Benton County 
Washington Assessor's Office, providing encryption for data at rest, data in transit,
and field-level encryption for sensitive fields.
"""

import os
import base64
import logging
import json
from typing import Dict, List, Any, Optional, Union, Tuple

# For encryption operations
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding, hashes, hmac
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding as asymmetric_padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
from cryptography.hazmat.backends import default_backend
import secrets

logger = logging.getLogger(__name__)

class EncryptionManager:
    """
    Manages encryption operations for the system, including key management,
    data encryption/decryption, and secure key rotation procedures.
    """
    
    def __init__(self):
        """Initialize the encryption manager"""
        # Encryption algorithm configurations
        self.encryption_algorithms = {
            'AES-256-GCM': {
                'key_size': 32,  # 256 bits
                'iv_size': 12,   # 96 bits (recommended for GCM)
                'tag_size': 16   # 128 bits
            },
            'AES-256-CBC': {
                'key_size': 32,  # 256 bits
                'iv_size': 16    # 128 bits
            },
            'RSA-2048': {
                'key_size': 2048  # 2048 bits
            },
            'RSA-4096': {
                'key_size': 4096  # 4096 bits
            }
        }
        
        # Default algorithm settings
        self.default_symmetric_algorithm = 'AES-256-GCM'
        self.default_asymmetric_algorithm = 'RSA-2048'
        
        # Load encryption keys from environment or generate temporary ones for development
        self.master_key = os.environ.get('MASTER_ENCRYPTION_KEY')
        if not self.master_key:
            if os.environ.get('ENV') == 'production':
                logger.error("MASTER_ENCRYPTION_KEY not found in production environment")
                raise ValueError("MASTER_ENCRYPTION_KEY must be set in production environment")
            else:
                # Generate a temporary key for development (not secure for production)
                self.master_key = base64.b64encode(os.urandom(32)).decode('utf-8')
                logger.warning("Generated temporary master key for development - NOT SECURE FOR PRODUCTION")
        
        # Key rotation schedule (in days)
        self.key_rotation_schedule = {
            'master_key': 365,    # Annual rotation
            'data_keys': 180,     # Bi-annual rotation
            'field_keys': 90      # Quarterly rotation
        }
        
        # Initialization state flag
        self._is_initialized = True
        
        logger.info("Encryption Manager initialized")
    
    def is_initialized(self) -> bool:
        """
        Check if the encryption manager is properly initialized.
        
        Returns:
            True if initialized, False otherwise
        """
        return self._is_initialized
    
    def generate_symmetric_key(self, algorithm: str = None) -> bytes:
        """
        Generate a new symmetric encryption key.
        
        Args:
            algorithm: Encryption algorithm to generate key for
            
        Returns:
            Bytes containing the encryption key
        """
        algorithm = algorithm or self.default_symmetric_algorithm
        key_size = self.encryption_algorithms[algorithm]['key_size']
        return os.urandom(key_size)
    
    def generate_key_pair(self, algorithm: str = None) -> Tuple[bytes, bytes]:
        """
        Generate a new asymmetric key pair.
        
        Args:
            algorithm: Encryption algorithm to generate key pair for
            
        Returns:
            Tuple of (private_key, public_key) in PEM format
        """
        algorithm = algorithm or self.default_asymmetric_algorithm
        key_size = self.encryption_algorithms[algorithm]['key_size']
        
        # Generate RSA key pair
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )
        
        # Extract public key
        public_key = private_key.public_key()
        
        # Serialize keys to PEM format
        from cryptography.hazmat.primitives import serialization
        
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        return private_pem, public_pem
    
    def encrypt_data(self, plaintext: Union[str, bytes], 
                     algorithm: str = None) -> Dict[str, str]:
        """
        Encrypt data using symmetric encryption.
        
        Args:
            plaintext: Data to encrypt (string or bytes)
            algorithm: Encryption algorithm to use
            
        Returns:
            Dictionary with encrypted data and metadata
        """
        algorithm = algorithm or self.default_symmetric_algorithm
        
        # Convert string to bytes if needed
        if isinstance(plaintext, str):
            plaintext = plaintext.encode('utf-8')
        
        # Generate random key and IV
        key = self.generate_symmetric_key(algorithm)
        iv_size = self.encryption_algorithms[algorithm]['iv_size']
        iv = os.urandom(iv_size)
        
        if algorithm == 'AES-256-GCM':
            # GCM mode provides authentication
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(plaintext) + encryptor.finalize()
            
            # Return encrypted data with metadata
            return {
                'algorithm': algorithm,
                'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
                'iv': base64.b64encode(iv).decode('utf-8'),
                'key': base64.b64encode(key).decode('utf-8'),
                'tag': base64.b64encode(encryptor.tag).decode('utf-8')
            }
        else:
            # AES-CBC mode
            padder = padding.PKCS7(algorithms.AES.block_size).padder()
            padded_data = padder.update(plaintext) + padder.finalize()
            
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(padded_data) + encryptor.finalize()
            
            # Return encrypted data with metadata
            return {
                'algorithm': algorithm,
                'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
                'iv': base64.b64encode(iv).decode('utf-8'),
                'key': base64.b64encode(key).decode('utf-8')
            }
    
    def decrypt_data(self, encrypted_data: Dict[str, str]) -> bytes:
        """
        Decrypt data using symmetric encryption.
        
        Args:
            encrypted_data: Dictionary with encrypted data and metadata
            
        Returns:
            Decrypted data as bytes
        """
        algorithm = encrypted_data.get('algorithm', self.default_symmetric_algorithm)
        ciphertext = base64.b64decode(encrypted_data['ciphertext'])
        iv = base64.b64decode(encrypted_data['iv'])
        key = base64.b64decode(encrypted_data['key'])
        
        if algorithm == 'AES-256-GCM':
            # GCM mode
            tag = base64.b64decode(encrypted_data['tag'])
            
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv, tag),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            return decryptor.update(ciphertext) + decryptor.finalize()
        else:
            # AES-CBC mode
            cipher = Cipher(
                algorithms.AES(key),
                modes.CBC(iv),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            # Remove padding
            unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
            return unpadder.update(padded_plaintext) + unpadder.finalize()
    
    def encrypt_field(self, field_value: Union[str, int, float], 
                      field_name: str, table_name: str) -> str:
        """
        Apply field-level encryption for sensitive fields.
        
        Args:
            field_value: Value to encrypt
            field_name: Name of the field
            table_name: Name of the database table
            
        Returns:
            JSON string containing encrypted data
        """
        # Convert value to string if not already
        if not isinstance(field_value, str):
            field_value = str(field_value)
        
        # Derive a field-specific key from the master key
        field_key = self._derive_field_key(field_name, table_name)
        
        # Encrypt the field value
        encrypted_data = self.encrypt_data(field_value, self.default_symmetric_algorithm)
        
        # Replace the key with an encrypted version using the master key
        encrypted_key = self._encrypt_with_master_key(base64.b64decode(encrypted_data['key']))
        encrypted_data['encrypted_key'] = encrypted_key
        del encrypted_data['key']  # Remove the unencrypted key
        
        # Add metadata
        encrypted_data['field_name'] = field_name
        encrypted_data['table_name'] = table_name
        encrypted_data['version'] = '1.0'
        
        # Return as JSON string
        return json.dumps(encrypted_data)
    
    def decrypt_field(self, encrypted_json: str) -> str:
        """
        Decrypt a field-level encrypted value.
        
        Args:
            encrypted_json: JSON string containing encrypted data
            
        Returns:
            Decrypted field value as string
        """
        # Parse JSON
        encrypted_data = json.loads(encrypted_json)
        
        # Decrypt the field key using the master key
        encrypted_key = encrypted_data['encrypted_key']
        key = self._decrypt_with_master_key(encrypted_key)
        
        # Reconstruct the data dictionary for decryption
        decryption_data = encrypted_data.copy()
        decryption_data['key'] = base64.b64encode(key).decode('utf-8')
        del decryption_data['encrypted_key']
        del decryption_data['field_name']
        del decryption_data['table_name']
        del decryption_data['version']
        
        # Decrypt the data
        decrypted_bytes = self.decrypt_data(decryption_data)
        
        # Return as string
        return decrypted_bytes.decode('utf-8')
    
    def _derive_field_key(self, field_name: str, table_name: str) -> bytes:
        """
        Derive a field-specific key using the master key.
        
        Args:
            field_name: Name of the field
            table_name: Name of the database table
            
        Returns:
            Derived key as bytes
        """
        # Create a salt from table and field name
        salt = (table_name + field_name).encode('utf-8')
        
        # Use PBKDF2 to derive a key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        
        # Derive key using the master key as the password
        return kdf.derive(base64.b64decode(self.master_key))
    
    def _encrypt_with_master_key(self, data: bytes) -> str:
        """
        Encrypt data using the master key.
        
        Args:
            data: Data to encrypt
            
        Returns:
            Base64-encoded encrypted data
        """
        # Generate a random IV
        iv = os.urandom(16)
        
        # Create cipher with master key
        cipher = Cipher(
            algorithms.AES(base64.b64decode(self.master_key)),
            modes.CBC(iv),
            backend=default_backend()
        )
        
        # Pad the data
        padder = padding.PKCS7(algorithms.AES.block_size).padder()
        padded_data = padder.update(data) + padder.finalize()
        
        # Encrypt
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        # Combine IV and ciphertext and return as base64
        encrypted = iv + ciphertext
        return base64.b64encode(encrypted).decode('utf-8')
    
    def _decrypt_with_master_key(self, encrypted_data: str) -> bytes:
        """
        Decrypt data using the master key.
        
        Args:
            encrypted_data: Base64-encoded encrypted data
            
        Returns:
            Decrypted data as bytes
        """
        # Decode base64
        encrypted_bytes = base64.b64decode(encrypted_data)
        
        # Extract IV (first 16 bytes) and ciphertext
        iv = encrypted_bytes[:16]
        ciphertext = encrypted_bytes[16:]
        
        # Create cipher with master key
        cipher = Cipher(
            algorithms.AES(base64.b64decode(self.master_key)),
            modes.CBC(iv),
            backend=default_backend()
        )
        
        # Decrypt
        decryptor = cipher.decryptor()
        padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Remove padding
        unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
        return unpadder.update(padded_plaintext) + unpadder.finalize()
    
    def rotate_master_key(self, new_master_key: str = None) -> str:
        """
        Rotate the master encryption key.
        
        Args:
            new_master_key: New master key to use (if None, generates one)
            
        Returns:
            The new master key
        """
        # Generate a new master key if not provided
        if not new_master_key:
            new_key_bytes = os.urandom(32)
            new_master_key = base64.b64encode(new_key_bytes).decode('utf-8')
        
        # TODO: In a production system, this would re-encrypt all existing data keys
        # with the new master key. For demonstration purposes, we just update the key.
        
        # Update the master key
        old_master_key = self.master_key
        self.master_key = new_master_key
        
        logger.info("Master encryption key rotated successfully")
        return new_master_key

# Create a singleton instance
encryption_manager = EncryptionManager()