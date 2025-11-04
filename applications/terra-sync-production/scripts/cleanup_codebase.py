#!/usr/bin/env python3

import os
import shutil
import ast
import re
from pathlib import Path
from typing import Set, List, Dict

class CodebaseCleanup:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.archive_dir = self.project_root / "archive"
        self.unused_files = []
        self.unused_functions = []
        self.redundant_imports = []
        
    def analyze_imports_and_usage(self):
        python_files = list(self.project_root.glob("*.py"))
        
        all_imports = {}
        all_functions = {}
        function_calls = set()
        
        for py_file in python_files:
            if "archive" in str(py_file):
                continue
                
            try:
                with open(py_file, 'r') as f:
                    content = f.read()
                    tree = ast.parse(content)
                    
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            for alias in node.names:
                                all_imports.setdefault(str(py_file), []).append(alias.name)
                        elif isinstance(node, ast.ImportFrom):
                            if node.module:
                                for alias in node.names:
                                    all_imports.setdefault(str(py_file), []).append(f"{node.module}.{alias.name}")
                        elif isinstance(node, ast.FunctionDef):
                            all_functions[node.name] = str(py_file)
                        elif isinstance(node, ast.Call):
                            if isinstance(node.func, ast.Name):
                                function_calls.add(node.func.id)
                            elif isinstance(node.func, ast.Attribute):
                                function_calls.add(node.func.attr)
                                
            except Exception as e:
                print(f"Error analyzing {py_file}: {e}")
                
        unused_functions = {func: file for func, file in all_functions.items() 
                          if func not in function_calls and not func.startswith('_')}
        
        return unused_functions, all_imports
        
    def find_unused_files(self):
        active_files = {
            "main.py",
            "app.py", 
            "models.py",
            "config_validator.py",
            "benton_district_lookup.py",
            "gis_export.py",
            "exemption_seer_ai.py",
            "project_management.py"
        }
        
        all_python_files = {f.name for f in self.project_root.glob("*.py")}
        
        potentially_unused = all_python_files - active_files
        
        for file in potentially_unused:
            file_path = self.project_root / file
            if file_path.exists():
                with open(file_path, 'r') as f:
                    content = f.read()
                    if len(content.strip()) < 100 or "TODO" in content or "PLACEHOLDER" in content:
                        self.unused_files.append(str(file_path))
                        
        return self.unused_files
        
    def move_to_archive(self, file_path: str, category: str = "modules"):
        archive_category = self.archive_dir / category
        archive_category.mkdir(parents=True, exist_ok=True)
        
        source = Path(file_path)
        destination = archive_category / source.name
        
        if source.exists():
            shutil.move(str(source), str(destination))
            print(f"Archived {source.name} to {category}")
            
    def clean_imports(self, file_path: str):
        with open(file_path, 'r') as f:
            lines = f.readlines()
            
        cleaned_lines = []
        in_import_block = False
        
        for line in lines:
            stripped = line.strip()
            
            if stripped.startswith('import ') or stripped.startswith('from '):
                if self._is_import_used(stripped, ''.join(lines)):
                    cleaned_lines.append(line)
                else:
                    print(f"Removing unused import: {stripped}")
            else:
                cleaned_lines.append(line)
                
        with open(file_path, 'w') as f:
            f.writelines(cleaned_lines)
            
    def _is_import_used(self, import_line: str, file_content: str) -> bool:
        if 'import ' in import_line:
            if import_line.startswith('from '):
                match = re.search(r'from .+ import (.+)', import_line)
                if match:
                    imported_items = [item.strip() for item in match.group(1).split(',')]
                    for item in imported_items:
                        if item in file_content.replace(import_line, ''):
                            return True
            else:
                match = re.search(r'import (.+)', import_line)
                if match:
                    module_name = match.group(1).split('.')[0]
                    if module_name in file_content.replace(import_line, ''):
                        return True
                        
        return False
        
    def remove_dead_code(self, file_path: str):
        with open(file_path, 'r') as f:
            content = f.read()
            
        lines = content.split('\n')
        cleaned_lines = []
        
        for line in lines:
            stripped = line.strip()
            
            if (stripped.startswith('#') and 
                any(keyword in stripped.lower() for keyword in ['todo', 'fixme', 'placeholder', 'debug'])):
                print(f"Removing debug comment: {stripped}")
                continue
                
            if stripped.startswith('print(') and 'logger' not in line:
                print(f"Removing debug print: {stripped}")
                continue
                
            cleaned_lines.append(line)
            
        with open(file_path, 'w') as f:
            f.write('\n'.join(cleaned_lines))
            
    def organize_directory_structure(self):
        directories_to_create = [
            "core",
            "services", 
            "utils",
            "config",
            "static/css",
            "static/js", 
            "static/images",
            "templates",
            "tests",
            "docs"
        ]
        
        for directory in directories_to_create:
            (self.project_root / directory).mkdir(parents=True, exist_ok=True)
            
        file_organization = {
            "config_validator.py": "config",
            "logging_config.py": "config", 
            "benton_district_lookup.py": "services",
            "gis_export.py": "services",
            "exemption_seer_ai.py": "services",
            "project_management.py": "utils"
        }
        
        for file, target_dir in file_organization.items():
            source = self.project_root / file
            target_dir_path = self.project_root / target_dir
            target = target_dir_path / file
            
            if source.exists() and not target.exists():
                shutil.move(str(source), str(target))
                print(f"Moved {file} to {target_dir}/")
                
    def create_requirements_txt(self):
        requirements = [
            "flask>=2.3.0",
            "flask-sqlalchemy>=3.0.0", 
            "flask-login>=0.6.0",
            "psycopg2-binary>=2.9.0",
            "gunicorn>=21.0.0",
            "python-dotenv>=1.0.0",
            "requests>=2.31.0",
            "shapely>=2.0.0",
            "aiohttp>=3.8.0",
            "fastapi>=0.100.0",
            "uvicorn>=0.23.0",
            "pyjwt>=2.8.0",
            "werkzeug>=2.3.0",
            "sqlalchemy>=2.0.0"
        ]
        
        with open(self.project_root / "requirements.txt", 'w') as f:
            f.write('\n'.join(requirements))
            
        print("Created requirements.txt with production dependencies")
        
    def run_full_cleanup(self):
        print("Starting TerraFusion codebase cleanup...")
        
        self.archive_dir.mkdir(exist_ok=True)
        
        unused_files = self.find_unused_files()
        for file in unused_files:
            self.move_to_archive(file, "modules")
            
        unused_functions, imports = self.analyze_imports_and_usage()
        print(f"Found {len(unused_functions)} potentially unused functions")
        
        active_python_files = [
            "main.py", "app.py", "models.py", "config_validator.py",
            "benton_district_lookup.py", "gis_export.py", "exemption_seer_ai.py"
        ]
        
        for file in active_python_files:
            file_path = self.project_root / file
            if file_path.exists():
                self.clean_imports(str(file_path))
                self.remove_dead_code(str(file_path))
                
        self.organize_directory_structure()
        self.create_requirements_txt()
        
        print("Codebase cleanup completed successfully!")
        
        return {
            "archived_files": len(unused_files),
            "unused_functions": len(unused_functions),
            "status": "completed"
        }

if __name__ == "__main__":
    cleanup = CodebaseCleanup()
    result = cleanup.run_full_cleanup()
    print(f"Cleanup results: {result}")