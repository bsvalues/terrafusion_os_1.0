#!/usr/bin/env python3
"""
TerraFusion Atlas Seed Script
Add items to Atlas registries with validation
"""

import os
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List

ATLAS_ROOT = Path(__file__).parent.parent
REGISTRIES_DIR = ATLAS_ROOT / "registries"
SCHEMAS_DIR = ATLAS_ROOT / "schemas"

VALID_REGISTRIES = [
    "services", "engines", "frontends", "agents", "modules", 
    "datasets", "pipelines", "brands", "environments", "deployments",
    "compliance", "partners", "releases", "components"
]

LIFECYCLE_STATES = ["active", "deprecated", "experimental", "archived"]


class AtlasSeed:
    def __init__(self, registry_name: str):
        if registry_name not in VALID_REGISTRIES:
            raise ValueError(f"Invalid registry: {registry_name}. Must be one of: {', '.join(VALID_REGISTRIES)}")
        
        self.registry_name = registry_name
        self.registry_file = REGISTRIES_DIR / f"{registry_name}.json"
        self.schema_file = SCHEMAS_DIR / f"{registry_name.rstrip('s')}.schema.json"
        
        # Load existing registry
        if self.registry_file.exists():
            with open(self.registry_file) as f:
                self.registry = json.load(f)
        else:
            self.registry = {"registry": registry_name, "version": "1.0.0", "items": []}

    def add_item(self, item: Dict) -> bool:
        """Add an item to the registry"""
        # Check if ID already exists
        item_id = item.get('id')
        if any(existing['id'] == item_id for existing in self.registry['items']):
            print(f"⚠️  Item with ID '{item_id}' already exists. Updating...")
            self.registry['items'] = [existing if existing['id'] != item_id else item 
                                      for existing in self.registry['items']]
        else:
            self.registry['items'].append(item)
        
        # Update metadata
        self.registry['updated_at'] = datetime.now().isoformat()
        self.registry['count'] = len(self.registry['items'])
        
        return True

    def save(self):
        """Save registry to disk"""
        with open(self.registry_file, 'w') as f:
            json.dump(self.registry, f, indent=2)
        print(f"✅ Saved {self.registry_name} registry: {len(self.registry['items'])} items")

    def list_items(self):
        """List all items in registry"""
        print(f"\n📋 {self.registry_name.upper()} Registry ({len(self.registry['items'])} items)\n")
        for item in sorted(self.registry['items'], key=lambda x: x.get('id', '')):
            lifecycle = item.get('lifecycle', 'active')
            status_emoji = {'active': '✅', 'deprecated': '⚠️', 'experimental': '🧪', 'archived': '📦'}
            print(f"{status_emoji.get(lifecycle, '❓')} {item.get('id')}")
            print(f"   Name: {item.get('name')}")
            print(f"   Owner: {item.get('owner')}")
            print(f"   Path: {item.get('source_path', 'N/A')}")
            if item.get('tags'):
                print(f"   Tags: {', '.join(item.get('tags', []))}")
            print()

    def export_summary(self) -> Dict:
        """Export summary statistics"""
        return {
            'registry': self.registry_name,
            'total': len(self.registry['items']),
            'by_lifecycle': self._count_by_field('lifecycle'),
            'by_owner': self._count_by_field('owner'),
        }

    def _count_by_field(self, field: str) -> Dict[str, int]:
        counts = {}
        for item in self.registry['items']:
            value = item.get(field, 'unknown')
            counts[value] = counts.get(value, 0) + 1
        return counts


def build_service_item(args) -> Dict:
    return {
        'id': args.id,
        'name': args.name,
        'description': args.description or f"{args.name} service",
        'owner': args.owner,
        'lifecycle': args.lifecycle,
        'source_path': args.source_path,
        'tags': args.tags.split(',') if args.tags else [],
        'depends_on': args.depends_on.split(',') if args.depends_on else [],
    }


def build_engine_item(args) -> Dict:
    return {
        'id': args.id,
        'name': args.name,
        'description': args.description or f"{args.name} engine",
        'owner': args.owner,
        'lifecycle': args.lifecycle,
        'source_path': args.source_path,
        'language': args.language or 'rust',
        'tags': args.tags.split(',') if args.tags else [],
        'ffi_bindings': args.ffi_bindings.split(',') if args.ffi_bindings else [],
    }


def build_module_item(args) -> Dict:
    return {
        'id': args.id,
        'name': args.name,
        'description': args.description or f"{args.name} module",
        'owner': args.owner,
        'lifecycle': args.lifecycle,
        'source_path': args.source_path,
        'module_type': args.module_type or 'core',
        'tags': args.tags.split(',') if args.tags else [],
        'hot_swap_compatible': args.hot_swap,
        'marketplace_listing': args.marketplace,
    }


def build_agent_item(args) -> Dict:
    return {
        'id': args.id,
        'name': args.name,
        'description': args.description or f"{args.name} AI agent",
        'owner': args.owner,
        'lifecycle': args.lifecycle,
        'source_path': args.source_path,
        'agent_type': args.agent_type or 'autonomous',
        'tags': args.tags.split(',') if args.tags else [],
        'capabilities': args.capabilities.split(',') if args.capabilities else [],
    }


def build_dataset_item(args) -> Dict:
    return {
        'id': args.id,
        'name': args.name,
        'description': args.description or f"{args.name} dataset",
        'owner': args.owner,
        'lifecycle': args.lifecycle,
        'source_path': args.source_path,
        'data_type': args.data_type or 'database',
        'tags': args.tags.split(',') if args.tags else [],
        'technology': args.technology or 'PostgreSQL',
    }


def build_generic_item(args) -> Dict:
    """Generic builder for simpler registry types"""
    item = {
        'id': args.id,
        'name': args.name,
        'owner': args.owner,
        'source_path': args.source_path,
        'tags': args.tags.split(',') if args.tags else [],
    }
    if args.description:
        item['description'] = args.description
    if hasattr(args, 'lifecycle') and args.lifecycle:
        item['lifecycle'] = args.lifecycle
    return item


ITEM_BUILDERS = {
    'services': build_service_item,
    'engines': build_engine_item,
    'modules': build_module_item,
    'agents': build_agent_item,
    'datasets': build_dataset_item,
    'frontends': build_generic_item,
    'pipelines': build_generic_item,
    'brands': build_generic_item,
    'environments': build_generic_item,
    'deployments': build_generic_item,
    'compliance': build_generic_item,
    'partners': build_generic_item,
    'releases': build_generic_item,
    'components': build_generic_item,
}


def main():
    parser = argparse.ArgumentParser(description="TerraFusion Atlas Seed Tool")
    
    # Subparsers for each registry type
    subparsers = parser.add_subparsers(dest='registry', help='Registry type')
    
    for registry in VALID_REGISTRIES:
        subparser = subparsers.add_parser(registry, help=f'Add to {registry} registry')
        
        # Common args
        subparser.add_argument('--id', required=True, help='Unique identifier')
        subparser.add_argument('--name', required=True, help='Human-readable name')
        subparser.add_argument('--description', help='Description')
        subparser.add_argument('--owner', required=True, help='Owner team or person')
        subparser.add_argument('--source_path', required=True, help='Relative path to source')
        subparser.add_argument('--tags', help='Comma-separated tags')
        
        if registry in ['services', 'engines', 'frontends', 'agents', 'modules', 'datasets', 'pipelines']:
            subparser.add_argument('--lifecycle', default='active', 
                                   choices=LIFECYCLE_STATES, help='Lifecycle state')
        
        # Registry-specific args
        if registry == 'services':
            subparser.add_argument('--depends_on', help='Comma-separated dependency IDs')
        elif registry == 'engines':
            subparser.add_argument('--language', help='Programming language')
            subparser.add_argument('--ffi_bindings', help='Comma-separated FFI bindings')
        elif registry == 'modules':
            subparser.add_argument('--module_type', choices=['core', 'premium', 'partner', 'experimental'])
            subparser.add_argument('--hot_swap', action='store_true', help='Hot-swap compatible')
            subparser.add_argument('--marketplace', action='store_true', help='Listed in marketplace')
        elif registry == 'agents':
            subparser.add_argument('--agent_type', choices=['autonomous', 'supervised', 'swarm-member', 'coordinator', 'specialist'])
            subparser.add_argument('--capabilities', help='Comma-separated capabilities')
        elif registry == 'datasets':
            subparser.add_argument('--data_type', choices=['database', 'lake', 'export', 'backup', 'cache'])
            subparser.add_argument('--technology', help='Technology (e.g., PostgreSQL, MongoDB)')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List all registries')
    list_parser.add_argument('registry_name', nargs='?', help='Specific registry to list')
    
    args = parser.parse_args()
    
    if not args.registry:
        parser.print_help()
        return
    
    # Handle list command
    if args.registry == 'list':
        if args.registry_name:
            seeder = AtlasSeed(args.registry_name)
            seeder.list_items()
        else:
            print("\n📚 TerraFusion Atlas - All Registries\n")
            for registry in VALID_REGISTRIES:
                seeder = AtlasSeed(registry)
                summary = seeder.export_summary()
                print(f"  {registry.ljust(15)} : {summary['total']} items")
            print()
        return
    
    # Add item
    seeder = AtlasSeed(args.registry)
    
    # Build item using appropriate builder
    builder = ITEM_BUILDERS.get(args.registry, build_generic_item)
    item = builder(args)
    
    # Add and save
    seeder.add_item(item)
    seeder.save()
    
    print(f"\n✨ Added to {args.registry} registry:")
    print(f"   ID: {item['id']}")
    print(f"   Name: {item['name']}")
    print(f"   Owner: {item['owner']}")
    print(f"   Path: {item['source_path']}")


if __name__ == '__main__':
    main()
