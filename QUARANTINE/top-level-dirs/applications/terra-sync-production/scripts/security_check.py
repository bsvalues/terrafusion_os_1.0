#!/usr/bin/env python3
import os
import sys
import json
import hashlib
from pathlib import Path

class SecurityValidator:
    def __init__(self):
        self.issues = []
        self.warnings = []
        
    def check_environment_variables(self):
        required_vars = [
            'DATABASE_URL', 'SESSION_SECRET', 'JWT_SECRET_KEY'
        ]
        
        for var in required_vars:
            if not os.environ.get(var):
                self.issues.append(f"Missing required environment variable: {var}")
            elif len(os.environ.get(var, '')) < 32:
                self.warnings.append(f"Environment variable {var} should be longer for security")
                
    def check_ssl_configuration(self):
        cert_path = Path("security/certificates/cert.pem")
        key_path = Path("security/certificates/key.pem")
        
        if not cert_path.exists():
            self.issues.append("SSL certificate not found")
        if not key_path.exists():
            self.issues.append("SSL private key not found")
            
    def check_file_permissions(self):
        sensitive_files = [
            ".env", "config/security.json", "security/certificates/"
        ]
        
        for file_path in sensitive_files:
            path = Path(file_path)
            if path.exists():
                stat = path.stat()
                if stat.st_mode & 0o077:
                    self.warnings.append(f"File {file_path} has overly permissive permissions")
                    
    def run_security_check(self):
        print("Running security validation...")
        
        self.check_environment_variables()
        self.check_ssl_configuration()
        self.check_file_permissions()
        
        if self.issues:
            print("\nSECURITY ISSUES FOUND:")
            for issue in self.issues:
                print(f"  ❌ {issue}")
            return False
            
        if self.warnings:
            print("\nSECURITY WARNINGS:")
            for warning in self.warnings:
                print(f"  ⚠️  {warning}")
                
        print("\n✅ Security validation completed")
        return True

if __name__ == "__main__":
    validator = SecurityValidator()
    success = validator.run_security_check()
    sys.exit(0 if success else 1)
