#!/usr/bin/env python3
import os
import sys
import json
from pathlib import Path

def validate_environment():
    required_vars = [
        'DATABASE_URL', 'SESSION_SECRET', 'JWT_SECRET'
    ]
    
    missing = []
    for var in required_vars:
        if not os.environ.get(var):
            missing.append(var)
    
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        return False
    
    print("✅ All required environment variables are set")
    return True

def check_file_permissions():
    sensitive_files = ['.env', 'config/database.json']
    issues = []
    
    for file_path in sensitive_files:
        if os.path.exists(file_path):
            stat = os.stat(file_path)
            if stat.st_mode & 0o077:
                issues.append(f"{file_path} has overly permissive permissions")
    
    if issues:
        print(f"⚠️  Permission issues: {'; '.join(issues)}")
        return False
    
    print("✅ File permissions are secure")
    return True

def validate_ssl_config():
    cert_path = os.environ.get('SSL_CERT_PATH', 'security/certificates/cert.pem')
    key_path = os.environ.get('SSL_KEY_PATH', 'security/certificates/key.pem')
    
    if not (os.path.exists(cert_path) and os.path.exists(key_path)):
        print("⚠️  SSL certificates not found - HTTPS disabled")
        return False
    
    print("✅ SSL certificates configured")
    return True

def main():
    print("🔒 TerraFusion Security Validation")
    print("=" * 40)
    
    checks = [
        validate_environment,
        check_file_permissions,
        validate_ssl_config
    ]
    
    passed = 0
    for check in checks:
        if check():
            passed += 1
    
    print(f"\n📊 Security Check Results: {passed}/{len(checks)} passed")
    
    if passed == len(checks):
        print("✅ Security validation successful")
        sys.exit(0)
    else:
        print("❌ Security validation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
