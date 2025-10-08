#!/usr/bin/env python3
"""
RS256 Integration Tests
========================
Purpose: Validate RS256 JWT signing and verification locally
Usage: python3 test-rs256-integration.py [--key-dir ops/keys/rs256]
Requires: pyjwt, cryptography
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta

try:
    import jwt
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("ERROR: Required libraries not installed")
    print("Install: pip install pyjwt cryptography")
    sys.exit(1)

# Test configuration
TEST_KID = "tfos_2025_kid1_test"
TEST_ISSUER = "https://auth.terrafusion.com"
TEST_AUDIENCE = "https://api.terrafusion.com"

def log(level, message):
    """Log with color"""
    colors = {
        'INFO': '\033[0;36m',
        'SUCCESS': '\033[0;32m',
        'ERROR': '\033[0;31m',
        'WARNING': '\033[1;33m',
        'NC': '\033[0m'
    }
    prefix = {
        'INFO': 'ℹ️ ',
        'SUCCESS': '✅',
        'ERROR': '❌',
        'WARNING': '⚠️ '
    }
    color = colors.get(level, colors['NC'])
    print(f"{color}{prefix.get(level, '')} {message}{colors['NC']}")

def generate_test_keys():
    """Generate RSA-2048 key pair for testing"""
    log('INFO', "Generating RSA-2048 test key pair...")
    
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Get public key
    public_key = private_key.public_key()
    
    # Serialize private key (PEM format)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serialize public key (PEM format)
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    log('SUCCESS', "Test key pair generated (in-memory)")
    return private_pem, public_pem

def sign_token_rs256(private_key_pem, kid, payload):
    """Sign JWT with RS256"""
    headers = {
        'kid': kid,
        'alg': 'RS256',
        'typ': 'JWT'
    }
    
    token = jwt.encode(
        payload,
        private_key_pem,
        algorithm='RS256',
        headers=headers
    )
    
    return token

def verify_token_rs256(token, public_key_pem, audience, issuer):
    """Verify JWT with RS256"""
    try:
        decoded = jwt.decode(
            token,
            public_key_pem,
            algorithms=['RS256'],
            audience=audience,
            issuer=issuer
        )
        return decoded, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError as e:
        return None, str(e)

def test_rs256_signing():
    """Test 1: RS256 Token Signing"""
    log('INFO', "Test 1: RS256 Token Signing")
    log('INFO', "=" * 50)
    
    # Generate test keys
    private_key, public_key = generate_test_keys()
    
    # Create test payload
    now = datetime.utcnow()
    payload = {
        'iss': TEST_ISSUER,
        'aud': TEST_AUDIENCE,
        'sub': 'test-user-123',
        'iat': now,
        'exp': now + timedelta(hours=1),
        'scope': 'read write',
        'client_id': 'test-client'
    }
    
    # Sign token
    log('INFO', "Signing JWT with RS256...")
    token = sign_token_rs256(private_key, TEST_KID, payload)
    
    # Decode without verification (to inspect headers)
    unverified = jwt.decode(token, options={"verify_signature": False})
    headers = jwt.get_unverified_header(token)
    
    log('SUCCESS', f"Token signed successfully ({len(token)} chars)")
    log('INFO', f"  Header: {json.dumps(headers, indent=2)}")
    log('INFO', f"  Payload claims: {list(unverified.keys())}")
    log('INFO', f"  kid: {headers.get('kid')}")
    log('INFO', f"  alg: {headers.get('alg')}")
    
    # Verify kid
    if headers.get('kid') == TEST_KID:
        log('SUCCESS', "✅ kid header correct")
    else:
        log('ERROR', f"❌ kid header incorrect: {headers.get('kid')}")
        return False
    
    # Verify alg
    if headers.get('alg') == 'RS256':
        log('SUCCESS', "✅ alg header correct")
    else:
        log('ERROR', f"❌ alg header incorrect: {headers.get('alg')}")
        return False
    
    print()
    return True, token, private_key, public_key

def test_rs256_verification(token, public_key):
    """Test 2: RS256 Token Verification"""
    log('INFO', "Test 2: RS256 Token Verification")
    log('INFO', "=" * 50)
    
    # Verify token
    log('INFO', "Verifying JWT with RS256 public key...")
    decoded, error = verify_token_rs256(token, public_key, TEST_AUDIENCE, TEST_ISSUER)
    
    if error:
        log('ERROR', f"Verification failed: {error}")
        return False
    
    log('SUCCESS', "Token verified successfully")
    log('INFO', f"  Subject: {decoded.get('sub')}")
    log('INFO', f"  Issuer: {decoded.get('iss')}")
    log('INFO', f"  Audience: {decoded.get('aud')}")
    log('INFO', f"  Expires: {datetime.fromtimestamp(decoded.get('exp')).isoformat()}")
    
    print()
    return True

def test_rs256_rejection_wrong_key():
    """Test 3: RS256 Rejection with Wrong Key"""
    log('INFO', "Test 3: RS256 Rejection with Wrong Key")
    log('INFO', "=" * 50)
    
    # Generate two separate key pairs
    private_key1, _ = generate_test_keys()
    _, public_key2 = generate_test_keys()
    
    # Sign with key1
    payload = {
        'iss': TEST_ISSUER,
        'aud': TEST_AUDIENCE,
        'sub': 'test-user-123',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    token = sign_token_rs256(private_key1, TEST_KID, payload)
    
    # Try to verify with key2 (wrong key)
    log('INFO', "Attempting to verify with wrong public key...")
    decoded, error = verify_token_rs256(token, public_key2, TEST_AUDIENCE, TEST_ISSUER)
    
    if error:
        log('SUCCESS', f"✅ Correctly rejected invalid signature: {error}")
        print()
        return True
    else:
        log('ERROR', "❌ Token incorrectly accepted with wrong key!")
        print()
        return False

def test_hs256_rejection():
    """Test 4: HS256 Token Rejection (RS256-only mode)"""
    log('INFO', "Test 4: HS256 Token Rejection (RS256-only mode)")
    log('INFO', "=" * 50)
    
    # Generate HS256 token
    hs256_secret = "test-secret-key"
    payload = {
        'iss': TEST_ISSUER,
        'aud': TEST_AUDIENCE,
        'sub': 'test-user-123',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    
    log('INFO', "Creating HS256 token...")
    hs256_token = jwt.encode(payload, hs256_secret, algorithm='HS256')
    
    # Try to verify as RS256
    _, public_key = generate_test_keys()
    log('INFO', "Attempting to verify HS256 token with RS256 verifier...")
    
    try:
        jwt.decode(hs256_token, public_key, algorithms=['RS256'], audience=TEST_AUDIENCE, issuer=TEST_ISSUER)
        log('ERROR', "❌ HS256 token incorrectly accepted!")
        print()
        return False
    except jwt.InvalidTokenError as e:
        log('SUCCESS', f"✅ Correctly rejected HS256 token: {str(e)}")
        print()
        return True

def test_dual_sign_acceptance():
    """Test 5: Dual-Sign Mode (Accept Both RS256 and HS256)"""
    log('INFO', "Test 5: Dual-Sign Mode (Accept Both RS256 and HS256)")
    log('INFO', "=" * 50)
    
    # Generate RS256 token
    private_key, public_key = generate_test_keys()
    payload = {
        'iss': TEST_ISSUER,
        'aud': TEST_AUDIENCE,
        'sub': 'test-user-rs256',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    rs256_token = sign_token_rs256(private_key, TEST_KID, payload)
    
    # Generate HS256 token
    hs256_secret = "test-secret-key"
    payload['sub'] = 'test-user-hs256'
    hs256_token = jwt.encode(payload, hs256_secret, algorithm='HS256')
    
    # Verify RS256 token
    log('INFO', "Verifying RS256 token in dual-sign mode...")
    decoded_rs256, error = verify_token_rs256(rs256_token, public_key, TEST_AUDIENCE, TEST_ISSUER)
    
    if error:
        log('ERROR', f"❌ RS256 verification failed: {error}")
        return False
    log('SUCCESS', f"✅ RS256 token accepted: sub={decoded_rs256.get('sub')}")
    
    # Verify HS256 token (dual-sign mode accepts both)
    log('INFO', "Verifying HS256 token in dual-sign mode...")
    try:
        decoded_hs256 = jwt.decode(
            hs256_token,
            hs256_secret,
            algorithms=['HS256'],
            audience=TEST_AUDIENCE,
            issuer=TEST_ISSUER
        )
        log('SUCCESS', f"✅ HS256 token accepted: sub={decoded_hs256.get('sub')}")
    except jwt.InvalidTokenError as e:
        log('ERROR', f"❌ HS256 verification failed: {e}")
        return False
    
    log('INFO', "Dual-sign mode: Both RS256 and HS256 tokens accepted ✅")
    print()
    return True

def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(description='RS256 Integration Tests')
    parser.add_argument('--key-dir', default='ops/keys/rs256', help='Directory containing RSA keys')
    args = parser.parse_args()
    
    print()
    log('INFO', "=" * 60)
    log('INFO', "RS256 Integration Tests")
    log('INFO', "=" * 60)
    print()
    
    results = []
    
    # Test 1: Signing
    test1_result, token, private_key, public_key = test_rs256_signing()
    results.append(('RS256 Signing', test1_result))
    
    if not test1_result:
        log('ERROR', "Test 1 failed, skipping remaining tests")
        sys.exit(1)
    
    # Test 2: Verification
    test2_result = test_rs256_verification(token, public_key)
    results.append(('RS256 Verification', test2_result))
    
    # Test 3: Wrong key rejection
    test3_result = test_rs256_rejection_wrong_key()
    results.append(('Wrong Key Rejection', test3_result))
    
    # Test 4: HS256 rejection
    test4_result = test_hs256_rejection()
    results.append(('HS256 Rejection (RS256-only)', test4_result))
    
    # Test 5: Dual-sign acceptance
    test5_result = test_dual_sign_acceptance()
    results.append(('Dual-Sign Mode', test5_result))
    
    # Summary
    print()
    log('INFO', "=" * 60)
    log('INFO', "Test Summary")
    log('INFO', "=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        log('SUCCESS' if result else 'ERROR', f"{test_name}: {status}")
    
    print()
    log('INFO', f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        log('SUCCESS', "🎉 All tests passed! RS256 integration working correctly.")
        return 0
    else:
        log('ERROR', f"❌ {total - passed} test(s) failed. Fix issues before deployment.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
