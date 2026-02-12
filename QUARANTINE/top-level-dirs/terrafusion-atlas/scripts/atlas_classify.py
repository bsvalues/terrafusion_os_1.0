#!/usr/bin/env python3
"""
TerraFusion Atlas Auto-Classifier
Reads repo_map.py inventory.json and auto-assigns Atlas categories
"""

import json
import argparse
from pathlib import Path
from typing import Dict, List, Set
from collections import defaultdict

# Pattern matching for auto-classification
CLASSIFICATION_RULES = {
    'services': {
        'patterns': ['api', 'service', 'backend', 'server', 'daemon', 'gateway', 'auth', 'sync'],
        'extensions': ['.cs', '.csproj'],
        'indicators': ['Controllers', 'Program.cs', 'Startup.cs', 'appsettings.json']
    },
    'engines': {
        'patterns': ['engine', 'rust', 'wasm', 'performance', 'costforge', 'valuation-engine'],
        'extensions': ['.rs', 'Cargo.toml'],
        'indicators': ['src/lib.rs', 'src/main.rs', 'Cargo.lock']
    },
    'frontends': {
        'patterns': ['frontend', 'ui', 'web', 'desktop', 'shell', 'marketplace', 'tauri'],
        'extensions': ['.tsx', '.jsx', '.vue', '.svelte'],
        'indicators': ['package.json', 'tsconfig.json', 'vite.config', 'next.config', 'src-tauri']
    },
    'agents': {
        'patterns': ['ai', 'agent', 'swarm', 'claude', 'consciousness', 'autonomous'],
        'extensions': ['.py'],
        'indicators': ['agent', 'swarm', 'ai_', 'AI_', 'consciousness']
    },
    'modules': {
        'patterns': ['module', 'plugin', 'app', 'addon', 'parcel-tools', 'shock-and-awe'],
        'extensions': ['.ts', '.js', '.tsx'],
        'indicators': ['module.json', 'plugin.json', 'manifest.json']
    },
    'datasets': {
        'patterns': ['data', 'database', 'db', 'county', 'export', 'backup'],
        'extensions': ['.sql', '.db', '.sqlite', '.parquet', '.csv'],
        'indicators': ['migrations', 'seeds', 'schema', 'county-data']
    },
    'pipelines': {
        'patterns': ['workflow', 'ci', 'cd', 'pipeline', 'deploy', 'script', 'etl', 'batch'],
        'extensions': ['.yml', '.yaml', '.sh', '.ps1'],
        'indicators': ['.github/workflows', 'Jenkinsfile', 'azure-pipelines', '.gitlab-ci']
    },
    'brands': {
        'patterns': ['brand', 'logo', 'design', 'marketing', 'asset', 'branding'],
        'extensions': ['.svg', '.png', '.jpg', '.ai', '.sketch', '.figma'],
        'indicators': ['logos', 'assets', 'brand', 'design-system']
    },
    'environments': {
        'patterns': ['env', 'environment', 'devcontainer', 'compose', 'iac'],
        'extensions': ['.env', 'docker-compose.yml', '.devcontainer'],
        'indicators': ['.env', 'docker-compose', '.devcontainer', 'environment']
    },
    'deployments': {
        'patterns': ['helm', 'k8s', 'kubernetes', 'terraform', 'deploy', 'chart'],
        'extensions': ['Chart.yaml', 'values.yaml', '.tf', '.tfvars'],
        'indicators': ['helm', 'kubernetes', 'k8s', 'terraform', 'charts']
    },
    'compliance': {
        'patterns': ['compliance', 'security', 'audit', 'trust', 'legal', 'privacy'],
        'extensions': ['.md', '.pdf'],
        'indicators': ['audit', 'compliance', 'security', 'legal', 'SECURITY', 'COMPLIANCE']
    },
    'partners': {
        'patterns': ['harris', 'woolpert', 'federal', 'partner', 'vendor', 'integration'],
        'extensions': [],
        'indicators': ['harris', 'woolpert', 'partner', 'vendor', 'integration']
    },
    'releases': {
        'patterns': ['release', 'backup', 'archive', 'package', 'dist', 'build'],
        'extensions': ['.zip', '.tar.gz', '.tgz', '.tar', '.deb', '.rpm'],
        'indicators': ['FULL_BACKUP', 'RELEASE', 'archive', 'package']
    },
    'components': {
        'patterns': ['sdk', 'lib', 'shared', 'util', 'common', 'vendor'],
        'extensions': ['.dll', '.so', '.a'],
        'indicators': ['shared', 'common', 'utils', 'lib', 'sdk']
    }
}


class AtlasClassifier:
    def __init__(self, inventory_path: str):
        self.inventory_path = Path(inventory_path)
        with open(self.inventory_path) as f:
            self.inventory = json.load(f)
        
        self.classifications = defaultdict(list)
        self.stats = {
            'total_items': 0,
            'classified': 0,
            'unclassified': 0,
            'multi_category': 0
        }

    def classify_item(self, item: Dict, parent_path: str = "") -> List[str]:
        """Classify a single item into one or more Atlas categories"""
        categories = set()
        
        item_path = item.get('path', '')
        item_name = item.get('name', '')
        full_path = f"{parent_path}/{item_path}".lower()
        
        # Check against each registry's rules
        for category, rules in CLASSIFICATION_RULES.items():
            score = 0
            
            # Check patterns in path/name
            for pattern in rules['patterns']:
                if pattern in full_path or pattern in item_name.lower():
                    score += 2
            
            # Check file extensions
            if item.get('type') == 'file':
                for ext in rules['extensions']:
                    if item_name.endswith(ext) or item_name == ext:
                        score += 3
            
            # Check indicators in children (for directories)
            if item.get('type') == 'directory':
                children_names = [child.get('name', '').lower() for child in item.get('children', [])]
                for indicator in rules['indicators']:
                    if any(indicator.lower() in child_name for child_name in children_names):
                        score += 2
            
            # If score is high enough, add category
            if score >= 2:
                categories.add(category)
        
        return list(categories)

    def generate_atlas_id(self, item: Dict, category: str) -> str:
        """Generate a suggested Atlas ID"""
        name = item.get('name', '').lower()
        name = name.replace(' ', '-').replace('_', '-')
        
        # Remove file extensions
        if '.' in name:
            name = name.rsplit('.', 1)[0]
        
        # Category-specific prefixes
        if category == 'engines' and not name.startswith('engine.'):
            return f"engine.{name}"
        elif category == 'agents' and not name.startswith('agent.'):
            return f"agent.{name}"
        elif category == 'modules' and not name.startswith('module.'):
            return f"module.{name}"
        elif category == 'datasets' and not name.startswith('data.'):
            return f"data.{name}"
        else:
            return f"{category}.{name}"

    def infer_owner(self, item: Dict) -> str:
        """Infer likely owner based on path patterns"""
        path_lower = item.get('path', '').lower()
        
        if 'kernel' in path_lower or 'core-os' in path_lower:
            return 'kernel-team'
        elif 'marketplace' in path_lower:
            return 'marketplace-team'
        elif 'frontend' in path_lower or 'ui' in path_lower:
            return 'frontend-team'
        elif 'ai' in path_lower or 'agent' in path_lower:
            return 'ai-team'
        elif 'data' in path_lower or 'database' in path_lower:
            return 'data-team'
        elif 'ops' in path_lower or 'deploy' in path_lower or 'infra' in path_lower:
            return 'ops-team'
        else:
            return 'platform-team'

    def process_inventory(self, items: List[Dict] = None, parent_path: str = ""):
        """Recursively process inventory items"""
        if items is None:
            items = self.inventory.get('items', [])
        
        for item in items:
            # Only classify directories (top-level meaningful items)
            if item.get('type') == 'directory' and item.get('depth', 0) <= 2:
                self.stats['total_items'] += 1
                
                categories = self.classify_item(item, parent_path)
                
                if categories:
                    self.stats['classified'] += 1
                    if len(categories) > 1:
                        self.stats['multi_category'] += 1
                    
                    # Create classification entry
                    for category in categories:
                        classification = {
                            'suggested_id': self.generate_atlas_id(item, category),
                            'name': item.get('name'),
                            'source_path': item.get('path'),
                            'suggested_owner': self.infer_owner(item),
                            'confidence': 'high' if len(categories) == 1 else 'medium',
                            'categories': categories,
                            'tags': self._suggest_tags(item),
                        }
                        self.classifications[category].append(classification)
                else:
                    self.stats['unclassified'] += 1
            
            # Recurse into children
            if item.get('children'):
                self.process_inventory(item['children'], item.get('path', ''))

    def _suggest_tags(self, item: Dict) -> List[str]:
        """Suggest tags based on detected languages and path"""
        tags = []
        
        # Add language tags
        for lang in item.get('languages', []):
            tags.append(lang.lower().replace('/', '-').replace('.', ''))
        
        # Add domain tags
        path_lower = item.get('path', '').lower()
        if 'marketplace' in path_lower:
            tags.append('marketplace')
        if 'os' in path_lower or 'kernel' in path_lower:
            tags.append('os')
        if 'ai' in path_lower or 'agent' in path_lower:
            tags.append('ai')
        if 'gis' in path_lower or 'parcel' in path_lower:
            tags.append('gis')
        
        return list(set(tags))

    def export_draft(self, output_path: str):
        """Export classification results"""
        draft = {
            'generated_at': self.inventory.get('generated_at'),
            'source': str(self.inventory_path),
            'stats': self.stats,
            'classifications': dict(self.classifications)
        }
        
        output_file = Path(output_path)
        with open(output_file, 'w') as f:
            json.dump(draft, f, indent=2)
        
        print(f"✅ Exported classification draft: {output_file}")
        print(f"\n📊 Classification Statistics:")
        print(f"   Total Items: {self.stats['total_items']}")
        print(f"   Classified: {self.stats['classified']}")
        print(f"   Unclassified: {self.stats['unclassified']}")
        print(f"   Multi-Category: {self.stats['multi_category']}")
        print(f"\n📋 By Registry:")
        for category in sorted(self.classifications.keys()):
            print(f"   {category.ljust(15)}: {len(self.classifications[category])} items")

    def generate_seed_commands(self, output_path: str):
        """Generate shell script with atlas_seed.py commands"""
        lines = [
            "#!/bin/bash",
            "# Auto-generated Atlas seed commands",
            "# Generated from: " + str(self.inventory_path),
            "",
            "set -e",
            "",
            "ATLAS_ROOT=\"$(cd \"$(dirname \"${BASH_SOURCE[0]}\")\" && pwd)\"",
            "cd \"$ATLAS_ROOT\"",
            "",
        ]
        
        for category, items in sorted(self.classifications.items()):
            lines.append(f"# {category.upper()} ({len(items)} items)")
            for item in items[:10]:  # Limit to first 10 per category for sanity
                tags = ','.join(item['tags']) if item['tags'] else ''
                cmd = (
                    f"python3 scripts/atlas_seed.py {category} \\\n"
                    f"  --id \"{item['suggested_id']}\" \\\n"
                    f"  --name \"{item['name']}\" \\\n"
                    f"  --owner \"{item['suggested_owner']}\" \\\n"
                    f"  --source_path \"{item['source_path']}\""
                )
                if tags:
                    cmd += f" \\\n  --tags \"{tags}\""
                lines.append(cmd)
                lines.append("")
            lines.append("")
        
        output_file = Path(output_path)
        with open(output_file, 'w') as f:
            f.write('\n'.join(lines))
        
        # Make executable
        output_file.chmod(0o755)
        print(f"✅ Generated seed script: {output_file}")
        print(f"   Run with: ./{output_file.name}")


def main():
    parser = argparse.ArgumentParser(description="TerraFusion Atlas Auto-Classifier")
    parser.add_argument('inventory', help='Path to inventory.json from repo_map.py')
    parser.add_argument('--out', default='./atlas-auto-draft.json', help='Output JSON file')
    parser.add_argument('--seed-script', default='./seed-atlas.sh', help='Output seed script')
    
    args = parser.parse_args()
    
    print("🔍 Analyzing repository inventory...")
    classifier = AtlasClassifier(args.inventory)
    
    print("🏷️  Classifying items...")
    classifier.process_inventory()
    
    print("\n📦 Generating outputs...")
    classifier.export_draft(args.out)
    classifier.generate_seed_commands(args.seed_script)
    
    print(f"\n✨ Done! Review {args.out} and run {args.seed_script} to populate Atlas.")


if __name__ == '__main__':
    main()
