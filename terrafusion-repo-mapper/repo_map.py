#!/usr/bin/env python3
"""
TerraFusion Repository Mapper
Generates comprehensive inventory, catalog, and dependency graph of repository structure
"""

import os
import json
import argparse
from pathlib import Path
from typing import Dict, List, Set
from datetime import datetime
import hashlib

# Directories to skip
SKIP_DIRS = {
    'node_modules', '.git', 'bin', 'obj', '__pycache__', '.next', 'dist', 
    'build', 'target', '.terraform', '.venv', 'venv', '.pytest_cache',
    '.DS_Store', 'coverage', '.nyc_output'
}

# File extensions by language
LANG_EXTENSIONS = {
    'Rust': ['.rs', '.toml'],
    'C#/.NET': ['.cs', '.csproj', '.sln'],
    'TypeScript': ['.ts', '.tsx'],
    'JavaScript': ['.js', '.jsx'],
    'Python': ['.py'],
    'Go': ['.go'],
    'Docker': ['Dockerfile', '.dockerignore'],
    'Config': ['.json', '.yaml', '.yml', '.env', '.config'],
    'Markdown': ['.md'],
    'Shell': ['.sh', '.bash', '.ps1'],
    'Helm': ['Chart.yaml', 'values.yaml'],
}

# Pattern-based categorization
CATEGORY_PATTERNS = {
    'services': ['service', 'api', 'backend', 'server', 'daemon'],
    'engines': ['engine', 'rust', 'wasm', 'performance'],
    'frontends': ['frontend', 'ui', 'web', 'desktop', 'tauri', 'marketplace'],
    'agents': ['ai', 'agent', 'swarm', 'claude', 'consciousness'],
    'modules': ['module', 'plugin', 'app', 'addon'],
    'datasets': ['data', 'database', 'db', 'county'],
    'pipelines': ['workflow', 'ci', 'cd', 'pipeline', 'deploy', 'script'],
    'brands': ['brand', 'logo', 'design', 'marketing', 'asset'],
    'environments': ['env', 'devcontainer', 'compose', 'iac'],
    'deployments': ['helm', 'k8s', 'kubernetes', 'terraform', 'deployment'],
    'partners': ['harris', 'woolpert', 'federal', 'partner'],
    'compliance': ['compliance', 'security', 'audit', 'trust', 'legal'],
    'releases': ['release', 'backup', 'archive', 'package'],
    'components': ['sdk', 'lib', 'shared', 'util', 'vendor'],
}


class RepoMapper:
    def __init__(self, root_path: str, max_depth: int = 5):
        self.root_path = Path(root_path).resolve()
        self.max_depth = max_depth
        self.inventory = {
            'generated_at': datetime.now().isoformat(),
            'root_path': str(self.root_path),
            'items': [],
            'stats': {
                'total_files': 0,
                'total_dirs': 0,
                'by_language': {},
                'by_category': {},
                'total_size_bytes': 0
            }
        }
        self.graph_edges = []

    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file (for smaller files)"""
        try:
            if file_path.stat().st_size > 10 * 1024 * 1024:  # Skip files > 10MB
                return "too_large"
            with open(file_path, 'rb') as f:
                return hashlib.sha256(f.read()).hexdigest()[:16]
        except:
            return "error"

    def detect_language(self, path: Path) -> List[str]:
        """Detect programming languages in path"""
        languages = set()
        if path.is_file():
            for lang, exts in LANG_EXTENSIONS.items():
                if any(str(path).endswith(ext) or path.name == ext for ext in exts):
                    languages.add(lang)
        return list(languages)

    def categorize_path(self, path: Path) -> List[str]:
        """Suggest Atlas categories based on path patterns"""
        path_lower = str(path).lower()
        categories = []
        for category, patterns in CATEGORY_PATTERNS.items():
            if any(pattern in path_lower for pattern in patterns):
                categories.append(category)
        return categories if categories else ['components']

    def scan_directory(self, path: Path, depth: int = 0) -> Dict:
        """Recursively scan directory and build inventory"""
        if depth > self.max_depth or path.name in SKIP_DIRS:
            return None

        item = {
            'path': str(path.relative_to(self.root_path)),
            'name': path.name,
            'type': 'directory' if path.is_dir() else 'file',
            'depth': depth,
            'languages': [],
            'suggested_categories': [],
            'children': []
        }

        if path.is_file():
            try:
                stats = path.stat()
                item['size_bytes'] = stats.st_size
                item['modified'] = datetime.fromtimestamp(stats.st_mtime).isoformat()
                item['languages'] = self.detect_language(path)
                item['suggested_categories'] = self.categorize_path(path)
                
                self.inventory['stats']['total_files'] += 1
                self.inventory['stats']['total_size_bytes'] += stats.st_size
                
                for lang in item['languages']:
                    self.inventory['stats']['by_language'][lang] = \
                        self.inventory['stats']['by_language'].get(lang, 0) + 1
                
            except Exception as e:
                item['error'] = str(e)

        elif path.is_dir():
            self.inventory['stats']['total_dirs'] += 1
            item['suggested_categories'] = self.categorize_path(path)
            
            try:
                children = sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name))
                for child in children:
                    if child.name not in SKIP_DIRS:
                        child_item = self.scan_directory(child, depth + 1)
                        if child_item:
                            item['children'].append(child_item)
                            # Track relationships for graph
                            if child.is_dir():
                                self.graph_edges.append((path.name, child.name))
            except PermissionError:
                item['error'] = 'Permission denied'

        return item

    def generate_catalog_md(self, inventory: Dict) -> str:
        """Generate markdown catalog"""
        md = ["# TerraFusion OS Repository Catalog\n"]
        md.append(f"**Generated:** {inventory['generated_at']}\n")
        md.append(f"**Root:** `{inventory['root_path']}`\n\n")
        
        md.append("## 📊 Statistics\n")
        stats = inventory['stats']
        md.append(f"- **Total Files:** {stats['total_files']:,}\n")
        md.append(f"- **Total Directories:** {stats['total_dirs']:,}\n")
        md.append(f"- **Total Size:** {stats['total_size_bytes'] / (1024**3):.2f} GB\n\n")
        
        md.append("## 🗂 Languages Detected\n")
        for lang, count in sorted(stats['by_language'].items(), key=lambda x: -x[1]):
            md.append(f"- **{lang}**: {count:,} files\n")
        md.append("\n")
        
        md.append("## 📁 Top-Level Structure\n\n")
        
        def render_tree(item: Dict, prefix: str = "", is_last: bool = True):
            lines = []
            connector = "└── " if is_last else "├── "
            
            name = item['name']
            if item['type'] == 'directory':
                name = f"📁 **{name}**"
                if item.get('suggested_categories'):
                    name += f" `[{', '.join(item['suggested_categories'])}]`"
            else:
                name = f"📄 {name}"
                if item.get('languages'):
                    name += f" `{', '.join(item['languages'])}`"
            
            lines.append(f"{prefix}{connector}{name}\n")
            
            children = item.get('children', [])
            if children and item['depth'] < 3:  # Limit depth in catalog
                new_prefix = prefix + ("    " if is_last else "│   ")
                for i, child in enumerate(children[:20]):  # Limit children shown
                    is_last_child = i == len(children) - 1
                    lines.extend(render_tree(child, new_prefix, is_last_child))
                if len(children) > 20:
                    lines.append(f"{new_prefix}    ... ({len(children) - 20} more items)\n")
            
            return lines
        
        for item in inventory['items']:
            md.extend(render_tree(item))
        
        md.append("\n## 🎯 Suggested Atlas Organization\n\n")
        
        category_items = {}
        def collect_categories(item: Dict):
            for cat in item.get('suggested_categories', []):
                if cat not in category_items:
                    category_items[cat] = []
                category_items[cat].append(item['path'])
            for child in item.get('children', []):
                collect_categories(child)
        
        for item in inventory['items']:
            collect_categories(item)
        
        for category in sorted(category_items.keys()):
            md.append(f"### {category.title()}\n")
            for path in sorted(category_items[category])[:10]:
                md.append(f"- `{path}`\n")
            if len(category_items[category]) > 10:
                md.append(f"- ... ({len(category_items[category]) - 10} more)\n")
            md.append("\n")
        
        return "".join(md)

    def generate_graph_dot(self) -> str:
        """Generate Graphviz DOT file for visualization"""
        lines = [
            "digraph TerraFusionRepo {",
            "  rankdir=TB;",
            "  node [shape=box, style=rounded];",
            ""
        ]
        
        # Add nodes with categories
        seen_nodes = set()
        for src, dst in self.graph_edges:
            if src not in seen_nodes:
                lines.append(f'  "{src}" [label="{src}"];')
                seen_nodes.add(src)
            if dst not in seen_nodes:
                lines.append(f'  "{dst}" [label="{dst}"];')
                seen_nodes.add(dst)
        
        lines.append("")
        
        # Add edges
        for src, dst in self.graph_edges[:500]:  # Limit edges
            lines.append(f'  "{src}" -> "{dst}";')
        
        lines.append("}")
        return "\n".join(lines)

    def run(self, output_dir: str):
        """Execute the mapping process"""
        print(f"🗺️  Mapping repository: {self.root_path}")
        print(f"📊 Max depth: {self.max_depth}")
        
        # Scan root directory
        try:
            root_items = []
            for item in sorted(self.root_path.iterdir(), key=lambda p: (not p.is_dir(), p.name)):
                if item.name not in SKIP_DIRS:
                    scanned = self.scan_directory(item, depth=0)
                    if scanned:
                        root_items.append(scanned)
            
            self.inventory['items'] = root_items
            
        except Exception as e:
            print(f"❌ Error scanning: {e}")
            return
        
        # Create output directory
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        
        # Write inventory JSON
        inventory_file = out_path / "inventory.json"
        with open(inventory_file, 'w') as f:
            json.dump(self.inventory, f, indent=2)
        print(f"✅ Wrote inventory: {inventory_file}")
        
        # Write catalog markdown
        catalog_file = out_path / "CATALOG.md"
        catalog_md = self.generate_catalog_md(self.inventory)
        with open(catalog_file, 'w') as f:
            f.write(catalog_md)
        print(f"✅ Wrote catalog: {catalog_file}")
        
        # Write graph DOT
        graph_file = out_path / "graph.dot"
        graph_dot = self.generate_graph_dot()
        with open(graph_file, 'w') as f:
            f.write(graph_dot)
        print(f"✅ Wrote graph: {graph_file}")
        
        print(f"\n📈 Summary:")
        print(f"   Files: {self.inventory['stats']['total_files']:,}")
        print(f"   Directories: {self.inventory['stats']['total_dirs']:,}")
        print(f"   Size: {self.inventory['stats']['total_size_bytes'] / (1024**3):.2f} GB")
        print(f"\n✨ Open the catalog: {catalog_file}")


def main():
    parser = argparse.ArgumentParser(description="TerraFusion Repository Mapper")
    parser.add_argument('root', help='Root directory to map')
    parser.add_argument('--out', default='./repo-map-out', help='Output directory')
    parser.add_argument('--max-depth', type=int, default=5, help='Maximum depth to scan')
    
    args = parser.parse_args()
    
    mapper = RepoMapper(args.root, max_depth=args.max_depth)
    mapper.run(args.out)


if __name__ == '__main__':
    main()
