#!/usr/bin/env python3
"""
TerraFusion OS - Automated Port Fix Engine
Automatically fixes hardcoded ports across the entire codebase
"""

import os
import re
import json
from pathlib import Path
import shutil
import subprocess

class PortFixEngine:
    def __init__(self):
        self.root_path = Path(__file__).parent.parent
        self.fixes_applied = 0
        self.files_modified = 0
        
        # Port replacement mapping
        self.port_replacements = {
            # Backend API ports
            'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_API_PORT:-5046}',
            ':5000': ':${TF_API_PORT:-5046}',
            'port=\${{TF_API_PORT:-5000}}': 'port = process.env.TF_API_PORT || 5046',
            'PORT=\${{TF_API_PORT:-5000}}': 'PORT = process.env.TF_API_PORT || 5046',
            'ASPNETCORE_URLS=http://localhost:\${{TF_API_PORT:-5000}}': 'ASPNETCORE_URLS=http://localhost:${TF_API_PORT:-5046}',
            
            # Frontend ports
            'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_FRONTEND_PORT:-3102}',
            ':3000': ':${TF_FRONTEND_PORT:-3102}',
            'port=\${{TF_API_PORT:-5000}}': 'port = process.env.TF_FRONTEND_PORT || 3102',
            'PORT=\${{TF_API_PORT:-5000}}': 'PORT = process.env.TF_FRONTEND_PORT || 3102',
            
            # Shell ports
            'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_SHELL_PORT:-3103}',
            ':3001': ':${TF_SHELL_PORT:-3103}',
            'port=\${{TF_API_PORT:-5000}}': 'port = process.env.TF_SHELL_PORT || 3103',
            'PORT=\${{TF_API_PORT:-5000}}': 'PORT = process.env.TF_SHELL_PORT || 3103',
            
            # Desktop shell ports
            'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_DESKTOP_PORT:-3104}',
            ':3002': ':${TF_DESKTOP_PORT:-3104}',
            'port=\${{TF_API_PORT:-5000}}': 'port = process.env.TF_DESKTOP_PORT || 3104',
            'PORT=\${{TF_API_PORT:-5000}}': 'PORT = process.env.TF_DESKTOP_PORT || 3104',
            
            # Development ports
            'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_DEV_VITE_PORT:-3102}',
            ':5173': ':${TF_DEV_VITE_PORT:-3102}',
            
            # Static file server
            'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_STATIC_PORT:-8080}',
            ':8080': ':${TF_STATIC_PORT:-8080}',
            
            # Common development patterns
            'http://localhost:\${{TF_API_PORT:-5000}}': 'http://localhost:${TF_FRONTEND_PORT:-3102}',
            'http://localhost:\${{TF_API_PORT:-5000}}': 'http://localhost:${TF_API_PORT:-5046}',
            'ws://localhost:\${{TF_API_PORT:-5000}}': 'ws://localhost:${TF_WS_PORT:-3109}',
        }
        
        # Language-specific patterns
        self.language_patterns = {
            '.js': {
                'const port=\${{TF_API_PORT:-5000}}': 'const port = process.env.TF_FRONTEND_PORT || 3102',
                'const port=\${{TF_API_PORT:-5000}}': 'const port = process.env.TF_API_PORT || 5046',
                'port: 3000': 'port: process.env.TF_FRONTEND_PORT || 3102',
                'port: 5000': 'port: process.env.TF_API_PORT || 5046',
            },
            '.json': {
                '"3000"': '${TF_FRONTEND_PORT:-3102}',
                '"5000"': '${TF_API_PORT:-5046}',
                '"localhost:\${{TF_API_PORT:-5000}}"': '"localhost:${TF_FRONTEND_PORT:-3102}"',
                '"localhost:\${{TF_API_PORT:-5000}}"': '"localhost:${TF_API_PORT:-5046}"',
            },
            '.py': {
                'port=\${{TF_API_PORT:-5000}}': 'port=int(os.environ.get("TF_FRONTEND_PORT", 3102))',
                'port=\${{TF_API_PORT:-5000}}': 'port=int(os.environ.get("TF_API_PORT", 5046))',
                'port=\${{TF_API_PORT:-5000}}': 'port = int(os.environ.get("TF_FRONTEND_PORT", 3102))',
                'port=\${{TF_API_PORT:-5000}}': 'port = int(os.environ.get("TF_API_PORT", 5046))',
            },
            '.sh': {
                'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_FRONTEND_PORT:-3102}',
                'localhost:\${{TF_API_PORT:-5000}}': 'localhost:${TF_API_PORT:-5046}',
                ':3000': ':${TF_FRONTEND_PORT:-3102}',
                ':5000': ':${TF_API_PORT:-5046}',
            }
        }
        
        # Files to skip
        self.skip_files = {
            'node_modules', '.git', '.env.ports', 'port-fix-engine.py',
            'port-validator.py', 'package-lock.json', '.pytest_cache',
            '__pycache__', 'dist', 'build', '.next'
        }

    def should_fix_file(self, file_path):
        """Determine if a file should be fixed"""
        # Skip excluded files/directories
        for skip in self.skip_files:
            if skip in str(file_path):
                return False
        
        # Check for relevant extensions
        relevant_extensions = {'.js', '.jsx', '.ts', '.tsx', '.json', '.html', 
                             '.py', '.sh', '.yml', '.yaml', '.env', '.conf', '.cs'}
        return file_path.suffix in relevant_extensions

    def backup_file(self, file_path):
        """Create a backup of the file before modification"""
        backup_path = file_path.with_suffix(file_path.suffix + '.backup')
        shutil.copy2(file_path, backup_path)
        return backup_path

    def fix_file_ports(self, file_path):
        """Fix hardcoded ports in a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            original_content = content
            fixes_in_file = 0
            
            # Apply general replacements
            for old_pattern, new_pattern in self.port_replacements.items():
                if old_pattern in content:
                    content = content.replace(old_pattern, new_pattern)
                    fixes_in_file += content.count(new_pattern) - original_content.count(new_pattern)
            
            # Apply language-specific replacements
            file_ext = file_path.suffix
            if file_ext in self.language_patterns:
                for old_pattern, new_pattern in self.language_patterns[file_ext].items():
                    if old_pattern in content:
                        content = content.replace(old_pattern, new_pattern)
                        fixes_in_file += 1
            
            # Add anti-regression comment for JS/TS files
            if file_ext in {'.js', '.jsx', '.ts', '.tsx'} and fixes_in_file > 0:
                if '// NO HARDCODED PORTS!' not in content:
                    content = '// NO HARDCODED PORTS! Use environment variables.\n' + content
            
            # Add anti-regression comment for Python files
            if file_ext == '.py' and fixes_in_file > 0:
                if '# NO HARDCODED PORTS!' not in content:
                    content = '# NO HARDCODED PORTS! Use environment variables.\n' + content
            
            # Write back if changes were made
            if content != original_content:
                # Create backup
                self.backup_file(file_path)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                self.fixes_applied += fixes_in_file
                self.files_modified += 1
                print(f"✅ Fixed {fixes_in_file} ports in {file_path.name}")
                return True
                
        except Exception as e:
            print(f"❌ Error fixing {file_path}: {e}")
            
        return False

    def fix_package_json_scripts(self):
        """Specifically fix package.json scripts"""
        package_json_path = self.root_path / 'package.json'
        
        if not package_json_path.exists():
            return
            
        try:
            with open(package_json_path, 'r') as f:
                data = json.load(f)
            
            if 'scripts' in data:
                scripts = data['scripts']
                modified = False
                
                # Fix common script patterns
                script_fixes = {
                    '--urls=http://localhost:\${{TF_API_PORT:-5000}}': '--urls=http://localhost:${TF_API_PORT:-5046}',
                    'PORT=\${{TF_API_PORT:-5000}}': 'PORT=${TF_SHELL_PORT:-3103}',
                    'REACT_APP_API_GATEWAY=http://localhost:\${{TF_API_PORT:-5000}}': 'REACT_APP_API_GATEWAY=http://localhost:${TF_API_PORT:-5046}',
                    'serve -s build -l 3100': 'serve -s build -l ${TF_SHELL_PORT:-3103}',
                }
                
                for script_name, script_content in scripts.items():
                    original_content = script_content
                    for old_pattern, new_pattern in script_fixes.items():
                        script_content = script_content.replace(old_pattern, new_pattern)
                    
                    if script_content != original_content:
                        scripts[script_name] = script_content
                        modified = True
                        print(f"✅ Fixed script: {script_name}")
                
                if modified:
                    # Backup and save
                    self.backup_file(package_json_path)
                    with open(package_json_path, 'w') as f:
                        json.dump(data, f, indent=2)
                    
                    self.files_modified += 1
                    print("✅ Updated package.json scripts")
                    
        except Exception as e:
            print(f"❌ Error fixing package.json: {e}")

    def create_port_config_files(self):
        """Ensure port configuration files exist"""
        # Create .env.ports if it doesn't exist
        env_ports_path = self.root_path / '.env.ports'
        if env_ports_path.exists():
            print("✅ .env.ports already exists")
        else:
            print("❌ .env.ports was missing - this should have been created earlier")
            
        # Create README for port management
        readme_path = self.root_path / 'PORT_MANAGEMENT.md'
        readme_content = """# TerraFusion OS - Port Management System

## 🚨 CRITICAL: NO HARDCODED PORTS ALLOWED

This system uses **dynamic port configuration** to prevent conflicts between applications.

### Port Configuration Files
- `.env.ports` - Master port configuration 
- `.env` - Environment-specific overrides

### Environment Variables
```bash
TF_API_PORT=\${{TF_API_PORT:-5000}}         # Backend API
TF_FRONTEND_PORT=\${{TF_API_PORT:-5000}}    # Frontend development server
TF_SHELL_PORT=\${{TF_API_PORT:-5000}}       # Government shell
TF_DESKTOP_PORT=\${{TF_API_PORT:-5000}}     # Desktop environment
TF_STATIC_PORT=\${{TF_API_PORT:-5000}}      # Static file server
```

### Usage Examples

#### JavaScript/TypeScript
```javascript
// ❌ WRONG - Hardcoded port
const apiUrl = 'http://localhost:\${{TF_API_PORT:-5000}}';

// ✅ CORRECT - Environment variable
const apiUrl = process.env.VITE_API_URL || 'http://localhost:\${{TF_API_PORT:-5000}}/api';
```

#### Python
```python
# ❌ WRONG - Hardcoded port
port=\${{TF_API_PORT:-5000}}

# ✅ CORRECT - Environment variable
port = int(os.environ.get('TF_API_PORT', 5046))
```

#### Shell Scripts
```bash
# ❌ WRONG - Hardcoded port
curl http://localhost:\${{TF_API_PORT:-5000}}/health

# ✅ CORRECT - Environment variable
curl http://localhost:${TF_API_PORT:-5046}/health
```

### Validation
Run the port validator to check for violations:
```bash
python3 scripts/port-validator.py
```

### AI Agent Protection
Comments like `// NO HARDCODED PORTS!` are added to prevent AI agents from reverting to hardcoded values.

### Port Ranges
- 3100-3110: Frontend services
- 5040-5050: Backend APIs
- 7000-7010: Security services
- 8080-8090: Infrastructure
"""
        
        with open(readme_path, 'w') as f:
            f.write(readme_content)
        
        print("✅ Created PORT_MANAGEMENT.md documentation")

    def run_fixes(self):
        """Run the complete port fixing process"""
        print("🚀 TerraFusion OS - Automated Port Fix Engine")
        print("=" * 60)
        
        print("\n1. Creating port configuration files...")
        self.create_port_config_files()
        
        print("\n2. Fixing package.json scripts...")
        self.fix_package_json_scripts()
        
        print("\n3. Scanning and fixing files...")
        
        for file_path in self.root_path.rglob('*'):
            if file_path.is_file() and self.should_fix_file(file_path):
                self.fix_file_ports(file_path)
        
        print("\n" + "=" * 60)
        print(f"✅ FIXES COMPLETE:")
        print(f"   📁 Files modified: {self.files_modified}")
        print(f"   🔧 Port fixes applied: {self.fixes_applied}")
        
        if self.files_modified > 0:
            print(f"\n💾 Backup files created with .backup extension")
            print(f"🔍 Run port validator to check remaining violations")
            
        return self.files_applied > 0

def main():
    engine = PortFixEngine()
    engine.run_fixes()

if __name__ == "__main__":
    main()