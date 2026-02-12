"""
crypto_utils.py

Provides AES encryption and decryption utilities for securing sensitive fields in the database.
"""
import base64
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

# Environment variable for the encryption key
CRYPTO_KEY = os.environ.get("TERRAMINER_CRYPTO_KEY")
if CRYPTO_KEY is None or len(CRYPTO_KEY) < 32:
    raise ValueError("TERRAMINER_CRYPTO_KEY must be at least 32 bytes long (256 bits)")
CRYPTO_KEY = CRYPTO_KEY[:32].encode()

backend = default_backend()


def encrypt_value(plaintext: str) -> str:
    if not plaintext:
        return ''
    iv = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plaintext.encode()) + padder.finalize()
    cipher = Cipher(algorithms.AES(CRYPTO_KEY), modes.CBC(iv), backend=backend)
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    return base64.b64encode(iv + ciphertext).decode()


def decrypt_value(ciphertext_b64: str) -> str:
    if not ciphertext_b64:
        return ''
    data = base64.b64decode(ciphertext_b64)
    iv = data[:16]
    ciphertext = data[16:]
    cipher = Cipher(algorithms.AES(CRYPTO_KEY), modes.CBC(iv), backend=backend)
    decryptor = cipher.decryptor()
    padded_plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded_plaintext) + unpadder.finalize()
    return plaintext.decode()
