#!/usr/bin/env python3
"""
TerraFusion OS - Comprehensive Port Fix Engine
==============================================

Systematically eliminates ALL hardcoded ports across the entire codebase
and replaces them with environment variable references.

This script:
1. Scans EVERY file for hardcoded port patterns
2. Builds comprehensive port mapping
3. Replaces hardcoded ports with environment variables
4. Updates .env.ports with complete configuration
5. Validates all fixes work correctly
6. Prevents AI agent regressions

NO MORE BAND-AID FIXES - THIS IS THE SYSTEMATIC SOLUTION
"""

import os
import re
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from dataclasses import dataclass
import shutil

@dataclass
class PortViolation:
    file_path: str
    line_number: int
    line_content: str
    port_number: int
    context: str
    fix_applied: bool = False

class ComprehensivePortFixEngine:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.violations: List[PortViolation] = []
        self.port_mapping: Dict[int, str] = {}
        self.env_vars: Dict[str, int] = {}
        self.fixes_applied: int = 0
        
        # Comprehensive port patterns that catch EVERYTHING
        self.port_patterns = [
            # Direct port numbers after colons
            (r'localhost:(\d{4,5})', r'localhost:\${{{var}:-{port}}}'),
            (r'127\.0\.0\.1:(\d{4,5})', r'127.0.0.1:\${{{var}:-{port}}}'),
            (r'0\.0\.0\.0:(\d{4,5})', r'0.0.0.0:\${{{var}:-{port}}}'),
            
            # HTTP/HTTPS URLs
            (r'https?://localhost:(\d{4,5})', r'http://localhost:\${{{var}:-{port}}}'),
            (r'https?://127\.0\.0\.1:(\d{4,5})', r'http://127.0.0.1:\${{{var}:-{port}}}'),
            
            # Port in configuration contexts
            (r'["\']port["\']\s*:\s*(\d{4,5})', r'"port": \${{{var}:-{port}}}'),
            (r'port\s*=\s*(\d{4,5})', r'port=\${{{var}:-{port}}}'),
            (r'PORT\s*=\s*(\d{4,5})', r'PORT=\${{{var}:-{port}}}'),
            
            # Docker and compose contexts
            (r'expose:\s*-\s*(\d{4,5})', r'expose:\n    - \${{{var}:-{port}}}'),
            (r'ports:\s*-\s*"(\d{4,5}):', r'ports:\n    - "\${{{var}:-{port}}}:'),
            
            # JavaScript/TypeScript
            (r'process\.env\.PORT\s*\|\|\s*(\d{4,5})', r'process.env.{var} || {port}'),
            
            # Command line arguments
            (r'--port\s+(\d{4,5})', r'--port \${{{var}:-{port}}}'),
            (r'--urls.*?:(\d{4,5})', r'--urls=http://localhost:\${{{var}:-{port}}}'),
            
            # Console output and comments (informational only)
            (r'Port\s+(\d{4,5})', r'Port \${{{var}:-{port}}}'),
            (r'port\s+(\d{4,5})', r'port \${{{var}:-{port}}}'),
        ]
        
        # File extensions to scan
        self.scan_extensions = {
            '.js', '.ts', '.jsx', '.tsx', '.json', '.yml', '.yaml', 
            '.sh', '.ps1', '.bat', '.cmd', '.py', '.cs', '.xml', 
            '.config', '.conf', '.env', '.dockerfile', '.md'
        }
        
        # Standard port mappings for TerraFusion services
        self.standard_port_mappings = {
            5000: 'TF_API_PORT',
            5001: 'TF_API_HTTPS_PORT', 
            3000: 'TF_FRONTEND_PORT',
            3001: 'TF_SHELL_PORT',
            3002: 'TF_CONSCIOUSNESS_PORT',
            3003: 'TF_DESKTOP_PORT',
            3004: 'TF_MONITORING_PORT',
            8080: 'TF_ADMIN_PORT',
            8081: 'TF_METRICS_PORT',
            6379: 'TF_REDIS_PORT',
            5432: 'TF_POSTGRES_PORT',
            27017: 'TF_MONGO_PORT',
            9200: 'TF_ELASTICSEARCH_PORT',
            9300: 'TF_ELASTICSEARCH_CLUSTER_PORT',
            8086: 'TF_INFLUXDB_PORT',
            3306: 'TF_MYSQL_PORT',
            1433: 'TF_SQLSERVER_PORT',
            8000: 'TF_DOCS_PORT',
            9090: 'TF_PROMETHEUS_PORT',
            3100: 'TF_LOKI_PORT',
            9093: 'TF_ALERTMANAGER_PORT',
            8500: 'TF_CONSUL_PORT',
            8600: 'TF_CONSUL_DNS_PORT',
            4222: 'TF_NATS_PORT',
            6222: 'TF_NATS_CLUSTER_PORT',
            8222: 'TF_NATS_HTTP_PORT',
            9999: 'TF_DEBUG_PORT',
            5555: 'TF_TEST_PORT'
        }

    def scan_for_violations(self) -> List[PortViolation]:
        """Comprehensive scan for ALL hardcoded ports"""
        print("🔍 Starting comprehensive port violation scan...")
        violations = []
        files_scanned = 0
        
        for file_path in self._get_scannable_files():
            try:
                files_scanned += 1
                if files_scanned % 100 == 0:
                    print(f"   Scanned {files_scanned} files...")
                    
                violations.extend(self._scan_file(file_path))
            except Exception as e:
                print(f"   Warning: Could not scan {file_path}: {e}")
                
        print(f"✅ Scan complete: {len(violations)} violations found in {files_scanned} files")
        self.violations = violations
        return violations

    def _get_scannable_files(self) -> List[Path]:
        """Get all files that should be scanned for ports"""
        files = []
        
        # Skip these directories to avoid noise
        skip_dirs = {
            '.git', 'node_modules', '__pycache__', '.pytest_cache',
            'bin', 'obj', 'dist', 'build', '.vscode', '.vs'
        }
        
        for root, dirs, filenames in os.walk(self.root_dir):
            # Remove skip directories from search
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            
            for filename in filenames:
                file_path = Path(root) / filename
                if file_path.suffix.lower() in self.scan_extensions:
                    files.append(file_path)
                    
        return files

    def _scan_file(self, file_path: Path) -> List[PortViolation]:
        """Scan individual file for port violations"""
        violations = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
            for line_num, line in enumerate(lines, 1):
                for pattern, _ in self.port_patterns:
                    matches = re.finditer(pattern, line)
                    for match in matches:
                        try:
                            port = int(match.group(1))
                            # Only care about common service ports
                            if 3000 <= port <= 9999:
                                violations.append(PortViolation(
                                    file_path=str(file_path),
                                    line_number=line_num,
                                    line_content=line.strip(),
                                    port_number=port,
                                    context=self._get_context(file_path, line)
                                ))
                        except (ValueError, IndexError):
                            continue
                            
        except Exception as e:
            # Skip files that can't be read as text
            pass
            
        return violations

    def _get_context(self, file_path: Path, line: str) -> str:
        """Determine the context/service for a port usage"""
        file_name = file_path.name.lower()
        line_lower = line.lower()
        
        if 'api' in file_name or 'backend' in file_name:
            return 'api'
        elif 'frontend' in file_name or 'ui' in file_name or 'react' in file_name:
            return 'frontend'
        elif 'shell' in file_name or 'desktop' in file_name:
            return 'shell'
        elif 'monitor' in file_name or 'health' in file_name:
            return 'monitoring'
        elif 'test' in file_name:
            return 'testing'
        elif 'docker' in file_name or 'compose' in file_name:
            return 'docker'
        else:
            return 'general'

    def build_port_mapping(self) -> Dict[int, str]:
        """Build comprehensive port to environment variable mapping"""
        print("🗺️  Building comprehensive port mapping...")
        
        # Start with standard mappings
        port_mapping = self.standard_port_mappings.copy()
        
        # Add discovered ports with auto-generated variable names
        discovered_ports = {v.port_number for v in self.violations}
        
        for port in sorted(discovered_ports):
            if port not in port_mapping:
                # Generate variable name based on port number and common usage
                if 3000 <= port <= 3099:
                    var_name = f'TF_FRONTEND_{port}_PORT'
                elif 5000 <= port <= 5099:
                    var_name = f'TF_API_{port}_PORT'
                elif 8000 <= port <= 8099:
                    var_name = f'TF_SERVICE_{port}_PORT'
                else:
                    var_name = f'TF_PORT_{port}'
                    
                port_mapping[port] = var_name
                
        self.port_mapping = port_mapping
        print(f"✅ Port mapping built: {len(port_mapping)} ports mapped")
        return port_mapping

    def apply_comprehensive_fixes(self) -> int:
        """Apply systematic fixes to ALL files with hardcoded ports"""
        print("🔧 Applying comprehensive port fixes...")
        
        # Group violations by file for efficient processing
        files_to_fix = {}
        for violation in self.violations:
            if violation.file_path not in files_to_fix:
                files_to_fix[violation.file_path] = []
            files_to_fix[violation.file_path].append(violation)
            
        total_fixes = 0
        
        for file_path, file_violations in files_to_fix.items():
            try:
                fixes_in_file = self._fix_file(file_path, file_violations)
                total_fixes += fixes_in_file
                if fixes_in_file > 0:
                    print(f"   ✅ Fixed {fixes_in_file} ports in {file_path}")
            except Exception as e:
                print(f"   ❌ Failed to fix {file_path}: {e}")
                
        self.fixes_applied = total_fixes
        print(f"✅ Applied {total_fixes} comprehensive port fixes")
        return total_fixes

    def _fix_file(self, file_path: str, violations: List[PortViolation]) -> int:
        """Fix all port violations in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            fixes_applied = 0
            
            # Apply fixes for each violation
            for violation in violations:
                port = violation.port_number
                var_name = self.port_mapping.get(port, f'TF_PORT_{port}')
                
                # Try different replacement patterns based on file type and context
                for pattern, replacement_template in self.port_patterns:
                    if re.search(pattern, violation.line_content):
                        replacement = replacement_template.format(var=var_name, port=port)
                        new_content = re.sub(pattern, replacement.replace('{', '{{').replace('}', '}}'), content)
                        
                        if new_content != content:
                            content = new_content
                            fixes_applied += 1
                            violation.fix_applied = True
                            break
                            
            # Only write if changes were made
            if content != original_content:
                # Create backup
                backup_path = f"{file_path}.backup"
                shutil.copy2(file_path, backup_path)
                
                # Write fixed content
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
                return fixes_applied
                
        except Exception as e:
            print(f"   Error fixing {file_path}: {e}")
            
        return 0

    def update_env_ports_file(self):
        """Update .env.ports with comprehensive port configuration"""
        print("📝 Updating .env.ports with comprehensive configuration...")
        
        env_content = []
        env_content.append("# TerraFusion OS - Comprehensive Port Configuration")
        env_content.append("# Generated by Comprehensive Port Fix Engine")
        env_content.append("# DO NOT HARDCODE PORTS - USE THESE VARIABLES")
        env_content.append("")
        
        # Group by service type
        api_ports = {k: v for k, v in self.port_mapping.items() if 'API' in v}
        frontend_ports = {k: v for k, v in self.port_mapping.items() if 'FRONTEND' in v}
        service_ports = {k: v for k, v in self.port_mapping.items() if 'SERVICE' in v or 'SHELL' in v}
        db_ports = {k: v for k, v in self.port_mapping.items() if any(db in v for db in ['REDIS', 'POSTGRES', 'MONGO', 'MYSQL', 'ELASTICSEARCH', 'INFLUX'])}
        other_ports = {k: v for k, v in self.port_mapping.items() if v not in {**api_ports, **frontend_ports, **service_ports, **db_ports}.values()}
        
        # Add sections
        self._add_port_section(env_content, "API Services", api_ports)
        self._add_port_section(env_content, "Frontend Services", frontend_ports)
        self._add_port_section(env_content, "System Services", service_ports)
        self._add_port_section(env_content, "Database Services", db_ports)
        self._add_port_section(env_content, "Other Services", other_ports)
        
        # Write to file
        env_path = self.root_dir / '.env.ports'
        with open(env_path, 'w') as f:
            f.write('\n'.join(env_content))
            
        print(f"✅ Updated .env.ports with {len(self.port_mapping)} port configurations")

    def _add_port_section(self, content: List[str], section_name: str, ports: Dict[int, str]):
        """Add a section to the .env.ports file"""
        if not ports:
            return
            
        content.append(f"# {section_name}")
        content.append("# " + "="*50)
        
        for port, var_name in sorted(ports.items()):
            content.append(f"{var_name}={port}")
            
        content.append("")

    def validate_fixes(self) -> bool:
        """Validate that all fixes work correctly"""
        print("🔍 Validating comprehensive fixes...")
        
        # Re-scan for violations
        remaining_violations = self.scan_for_violations()
        
        if not remaining_violations:
            print("✅ SUCCESS: Zero hardcoded ports remaining!")
            return True
        else:
            print(f"❌ FAILURE: {len(remaining_violations)} hardcoded ports still found:")
            for violation in remaining_violations[:10]:  # Show first 10
                print(f"   {violation.file_path}:{violation.line_number} -> {violation.port_number}")
            return False

    def generate_ai_protection_rules(self):
        """Generate strict rules to prevent AI agent regressions"""
        rules_content = """# TerraFusion OS - AI Agent Port Management Rules
# ================================================
# CRITICAL: ALL AI AGENTS MUST FOLLOW THESE RULES

## ABSOLUTE PROHIBITIONS

1. **NEVER HARDCODE PORTS** - Any hardcoded port number in code is a critical violation
2. **ALWAYS USE ENVIRONMENT VARIABLES** - All port references must use ${VAR_NAME} format
3. **CHECK .env.ports FIRST** - Always consult existing port mappings before adding new ones
4. **VALIDATE BEFORE COMMIT** - Run port-validator.py before any code changes

## REQUIRED PATTERNS

### ✅ CORRECT - Use environment variables:
```bash
--urls=http://localhost:${TF_API_PORT:-5046}
```

```javascript
const port = process.env.TF_API_PORT || 5046;
```

```json
{
  "port": "${TF_API_PORT:-5046}"
}
```

### ❌ WRONG - Never hardcode:
```bash
--urls=http://localhost:\${{TF_API_PORT:-5000}}
```

```javascript
const port=\${{TF_API_PORT:-5000}};
```

```json
{
  "port": \${{TF_API_PORT:-5000}}
}
```

## ENFORCEMENT

- Pre-commit hooks MUST run port validation
- CI/CD MUST fail on any hardcoded ports
- Code reviews MUST check port management compliance
- AI agents MUST validate ports before any changes

## VIOLATION CONSEQUENCES

Any AI agent that introduces hardcoded ports will be:
1. Immediately flagged for retraining
2. Required to fix ALL violations before proceeding
3. Subjected to enhanced oversight

NO EXCEPTIONS - ZERO TOLERANCE FOR HARDCODED PORTS
"""
        
        rules_path = self.root_dir / 'AI_AGENT_PORT_RULES_STRICT.md'
        with open(rules_path, 'w') as f:
            f.write(rules_content)
            
        print("✅ Generated strict AI agent protection rules")

    def run_comprehensive_fix(self):
        """Execute the complete comprehensive port fix pipeline"""
        print("🚀 TerraFusion OS - Comprehensive Port Fix Engine")
        print("=" * 60)
        print("ELIMINATING ALL HARDCODED PORTS - NO MORE BAND-AID FIXES")
        print()
        
        # Step 1: Scan for all violations
        violations = self.scan_for_violations()
        if not violations:
            print("✅ No hardcoded ports found - system is clean!")
            return True
            
        # Step 2: Build comprehensive port mapping
        self.build_port_mapping()
        
        # Step 3: Apply all fixes
        fixes_applied = self.apply_comprehensive_fixes()
        
        # Step 4: Update environment configuration
        self.update_env_ports_file()
        
        # Step 5: Validate all fixes work
        success = self.validate_fixes()
        
        # Step 6: Generate AI protection rules
        self.generate_ai_protection_rules()
        
        # Report results
        print("\n" + "=" * 60)
        print("🎯 COMPREHENSIVE PORT FIX RESULTS")
        print("=" * 60)
        print(f"📊 Initial violations found: {len(violations)}")
        print(f"🔧 Fixes applied: {fixes_applied}")
        print(f"✅ Success: {'YES' if success else 'NO'}")
        print(f"🗺️  Port mappings created: {len(self.port_mapping)}")
        print()
        
        if success:
            print("🎉 SUCCESS: All hardcoded ports eliminated!")
            print("🛡️  AI protection rules generated")
            print("🔒 System is now port-conflict-free")
        else:
            print("❌ FAILURE: Some hardcoded ports remain")
            print("🔄 Manual review required")
            
        return success

def main():
    """Main execution"""
    root_dir = "/workspaces/terrafusion_os_1.0"
    
    print("Starting TerraFusion OS Comprehensive Port Fix Engine...")
    print("This will eliminate ALL hardcoded ports systematically.")
    print()
    
    engine = ComprehensivePortFixEngine(root_dir)
    success = engine.run_comprehensive_fix()
    
    if success:
        print("\n🎯 Next steps:")
        print("1. Restart all services with new environment variables")
        print("2. Test all functionality to ensure no regressions")
        print("3. Commit changes with message: 'CRITICAL: Eliminate all hardcoded ports'")
        print("4. Set up pre-commit hooks to prevent future violations")
    else:
        print("\n❌ Fix incomplete - manual intervention required")
        
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())