#!/usr/bin/env python3
"""
TerraFusion cOS Requirements Generator
Auto-generates requirements.txt based on current imports
"""

import ast
import os
from pathlib import Path

def find_imports_in_file(file_path):
    """Extract imports from a Python file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        tree = ast.parse(content)
        imports = set()
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
        
        return imports
    except:
        return set()

def generate_requirements():
    """Generate requirements.txt from project imports"""
    project_root = Path(__file__).parent
    all_imports = set()
    
    # Scan all Python files
    for file_path in project_root.rglob("*.py"):
        if "venv" not in str(file_path) and "__pycache__" not in str(file_path):
            imports = find_imports_in_file(file_path)
            all_imports.update(imports)
    
    # Map imports to package names with versions
    package_mapping = {
        'fastapi': 'fastapi>=0.104.1',
        'uvicorn': 'uvicorn[standard]>=0.24.0',
        'pydantic': 'pydantic>=2.5.0',
        'sqlalchemy': 'SQLAlchemy>=2.0.0',
        'psycopg2': 'psycopg2-binary>=2.9.0',
        'redis': 'redis>=5.0.0',
        'numpy': 'numpy>=1.24.0',
        'pandas': 'pandas>=2.0.0',
        'requests': 'requests>=2.31.0',
        'aiohttp': 'aiohttp>=3.9.0',
        'asyncio': '',  # Built-in
        'json': '',     # Built-in
        'logging': '',  # Built-in
        'time': '',     # Built-in
        'datetime': '', # Built-in
        'pathlib': '',  # Built-in
        'sys': '',      # Built-in
        'os': '',       # Built-in
        'typing': '',   # Built-in
        'collections': '', # Built-in
        'threading': '',   # Built-in
        'queue': '',       # Built-in
        'tkinter': '',     # Usually built-in
        'jwt': 'PyJWT>=2.8.0',
        'cryptography': 'cryptography>=41.0.0',
        'bcrypt': 'bcrypt>=4.1.0'
    }
    
    requirements = []
    for imp in sorted(all_imports):
        if imp in package_mapping and package_mapping[imp]:
            requirements.append(package_mapping[imp])
        elif imp not in package_mapping and not imp.startswith('services') and not imp.startswith('substrate') and not imp.startswith('kernel') and not imp.startswith('brand') and not imp.startswith('desktop'):
            # Unknown external package
            requirements.append(f"{imp}>=1.0.0")
    
    return requirements

if __name__ == "__main__":
    requirements = generate_requirements()
    
    # Write requirements.txt
    with open("requirements.txt", "w") as f:
        f.write("# TerraFusion cOS Requirements\n")
        f.write("# Auto-generated requirements file\n\n")
        f.write("# Core Framework\n")
        for req in requirements:
            f.write(f"{req}\n")
    
    print("✅ Generated requirements.txt")
    print(f"📦 Found {len(requirements)} package requirements")