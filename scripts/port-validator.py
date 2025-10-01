#!/usr/bin/env python3
"""
TerraFusion OS - Port Management Validator
Prevents hardcoded ports and enforces dynamic port configuration
"""

import os
import re
import json
from pathlib import Path

class PortValidator:
    def __init__(self):
        self.root_path = Path(__file__).parent
        self.hardcoded_ports_found = []
        self.violations = []
        
        # Patterns to detect hardcoded ports
        self.port_patterns = [
            r'localhost:[3-9][0-9]{3}',  # localhost:\${{TF_FRONTEND_PORT:-3000}}-9999
            r'127\.0\.0\.1:[3-9][0-9]{3}',  # 127.0.0.1:\${{TF_FRONTEND_PORT:-3000}}-9999
            r':\s*[3-9][0-9]{3}(?!\w)',  # :3000-9999 (not in words)
            r'port\s*=\s*[3-9][0-9]{3}',  # port=\${{TF_FRONTEND_PORT:-3000}}-9999
            r'PORT\s*=\s*[3-9][0-9]{3}',  # PORT=\${{TF_FRONTEND_PORT:-3000}}-9999
            r'\.port\s*=\s*[3-9][0-9]{3}',  # .port=\${{TF_FRONTEND_PORT:-3000}}-9999
        ]
        
        # Files to exclude from validation
        self.excluded_files = {
            '.env.ports',  # Our port configuration file
            'port-validator.py',  # This script
            'package-lock.json',  # Auto-generated
            'node_modules',  # Dependencies
            '.git',  # Git files
            'README.md',  # Documentation
            'CLAUDE.md',  # Documentation
        }
        
        # File extensions to check
        self.check_extensions = {
            '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.py', 
            '.sh', '.yml', '.yaml', '.env', '.conf', '.config', '.cs'
        }

    def should_check_file(self, file_path):
        """Determine if a file should be checked for hardcoded ports"""
        # Skip excluded files/directories
        for excluded in self.excluded_files:
            if excluded in str(file_path):
                return False
        
        # Only check files with relevant extensions
        return file_path.suffix in self.check_extensions

    def find_hardcoded_ports(self, file_path):
        """Find hardcoded ports in a file"""
        violations = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            for line_num, line in enumerate(content.split('\n'), 1):
                for pattern in self.port_patterns:
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    for match in matches:
                        # Skip if it's a comment explaining the fix
                        if 'NO HARDCODED PORTS' in line or 'Dynamic port' in line:
                            continue
                            
                        violations.append({
                            'file': str(file_path.relative_to(self.root_path)),
                            'line': line_num,
                            'content': line.strip(),
                            'violation': match,
                            'pattern': pattern
                        })
        except Exception as e:
            print(f"⚠️  Error reading {file_path}: {e}")
            
        return violations

    def scan_directory(self, directory=None):
        """Scan directory for hardcoded ports"""
        if directory is None:
            directory = self.root_path
            
        print(f"🔍 Scanning {directory} for hardcoded ports...")
        
        all_violations = []
        
        for file_path in directory.rglob('*'):
            if file_path.is_file() and self.should_check_file(file_path):
                violations = self.find_hardcoded_ports(file_path)
                all_violations.extend(violations)
        
        return all_violations

    def generate_report(self, violations):
        """Generate a detailed report of port violations"""
        if not violations:
            print("✅ No hardcoded ports found! Port management system is compliant.")
            return True
            
        print(f"🚨 CRITICAL: Found {len(violations)} hardcoded port violations!")
        print("=" * 80)
        
        # Group by file
        files_with_violations = {}
        for violation in violations:
            file_name = violation['file']
            if file_name not in files_with_violations:
                files_with_violations[file_name] = []
            files_with_violations[file_name].append(violation)
        
        for file_name, file_violations in files_with_violations.items():
            print(f"\n📁 {file_name}")
            print("-" * 60)
            
            for violation in file_violations:
                print(f"  Line {violation['line']:4d}: {violation['violation']}")
                print(f"            {violation['content']}")
        
        print("\n" + "=" * 80)
        print("🔧 REQUIRED ACTIONS:")
        print("1. Replace hardcoded ports with environment variables")
        print("2. Use TF_*_PORT variables from .env.ports")
        print("3. Add comments: '// NO HARDCODED PORTS!' to prevent AI regression")
        print("4. Test with different port configurations")
        
        return False

    def suggest_fixes(self, violations):
        """Suggest fixes for common hardcoded port patterns"""
        suggestions = {
            'localhost:\${{TF_FRONTEND_PORT:-3000}}': 'localhost:${TF_FRONTEND_PORT:-3102}',
            'localhost:\${{TF_FRONTEND_PORT:-3000}}': 'localhost:${TF_API_PORT:-5046}',
            'localhost:\${{TF_FRONTEND_PORT:-3000}}': 'localhost:${TF_SHELL_PORT:-3103}',
            'port=\${{TF_FRONTEND_PORT:-3000}}': 'port = process.env.TF_FRONTEND_PORT || 3102',
            'PORT=\${{TF_FRONTEND_PORT:-3000}}': 'PORT = process.env.TF_API_PORT || 5046',
        }
        
        print("\n💡 SUGGESTED FIXES:")
        print("-" * 40)
        
        for violation in violations:
            original = violation['violation']
            for pattern, replacement in suggestions.items():
                if pattern in original.lower():
                    print(f"  {original} → {replacement}")
                    break

    def validate_env_configuration(self):
        """Validate that .env.ports exists and is properly configured"""
        env_ports_file = self.root_path / '.env.ports'
        
        if not env_ports_file.exists():
            print("❌ .env.ports file not found!")
            return False
            
        try:
            with open(env_ports_file, 'r') as f:
                content = f.read()
                
            # Check for required port variables
            required_vars = [
                'TF_API_PORT', 'TF_FRONTEND_PORT', 'TF_SHELL_PORT', 
                'TF_DESKTOP_PORT', 'TF_STATIC_PORT'
            ]
            
            missing_vars = []
            for var in required_vars:
                if var not in content:
                    missing_vars.append(var)
            
            if missing_vars:
                print(f"❌ Missing required port variables: {', '.join(missing_vars)}")
                return False
                
            print("✅ .env.ports configuration is valid")
            return True
            
        except Exception as e:
            print(f"❌ Error reading .env.ports: {e}")
            return False

def main():
    print("🚀 TerraFusion OS - Port Management Validator")
    print("=" * 50)
    
    validator = PortValidator()
    
    # Validate environment configuration
    print("\n1. Validating environment configuration...")
    env_valid = validator.validate_env_configuration()
    
    # Scan for hardcoded ports
    print("\n2. Scanning for hardcoded ports...")
    violations = validator.scan_directory()
    
    # Generate report
    print("\n3. Generating compliance report...")
    is_compliant = validator.generate_report(violations)
    
    # Suggest fixes if violations found
    if violations:
        validator.suggest_fixes(violations)
    
    # Final status
    print("\n" + "=" * 50)
    if is_compliant and env_valid:
        print("✅ PORT MANAGEMENT SYSTEM: COMPLIANT")
        print("🎯 All ports are properly configured using environment variables")
        exit(0)
    else:
        print("❌ PORT MANAGEMENT SYSTEM: VIOLATIONS DETECTED")
        print("🚨 Fix hardcoded ports to prevent conflicts between applications")
        exit(1)

if __name__ == "__main__":
    main()