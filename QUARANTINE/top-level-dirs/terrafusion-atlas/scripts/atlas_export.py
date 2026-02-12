#!/usr/bin/env python3
"""
Atlas Export Tool
Export Atlas data to various formats (CSV, Excel, JSON, Markdown)
"""

import json
import csv
from pathlib import Path
from datetime import datetime

ATLAS_ROOT = Path(__file__).parent.parent
REGISTRIES_DIR = ATLAS_ROOT / "registries"
EXPORT_DIR = ATLAS_ROOT.parent / "atlas-exports"

def load_all_items():
    """Load all items from all registries"""
    all_items = []
    
    for reg_file in REGISTRIES_DIR.glob("*.json"):
        try:
            with open(reg_file) as f:
                data = json.load(f)
                registry = reg_file.stem
                
                for item in data.get('items', []):
                    item['registry'] = registry
                    all_items.append(item)
        except Exception as e:
            print(f"⚠️  Error loading {reg_file.name}: {e}")
    
    return all_items

def export_csv(items, output_file):
    """Export to CSV format"""
    if not items:
        print("⚠️  No items to export")
        return
    
    # Define columns
    columns = [
        'registry', 'id', 'name', 'description', 'owner', 
        'lifecycle', 'source_path', 'tags', 'depends_on'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction='ignore')
        writer.writeheader()
        
        for item in items:
            # Convert lists to strings
            row = item.copy()
            row['tags'] = ', '.join(item.get('tags', []))
            row['depends_on'] = ', '.join(item.get('depends_on', []))
            writer.writerow(row)
    
    print(f"✅ CSV exported: {output_file}")

def export_markdown(items, output_file):
    """Export to Markdown format"""
    
    # Group by registry
    by_registry = {}
    for item in items:
        registry = item.get('registry', 'unknown')
        if registry not in by_registry:
            by_registry[registry] = []
        by_registry[registry].append(item)
    
    lines = [
        "# TerraFusion Atlas Export",
        "",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"**Total Items:** {len(items)}",
        f"**Registries:** {len(by_registry)}",
        "",
        "---",
        ""
    ]
    
    for registry, reg_items in sorted(by_registry.items()):
        lines.append(f"## {registry.title()} ({len(reg_items)} items)")
        lines.append("")
        
        for item in sorted(reg_items, key=lambda x: x.get('name', '')):
            lines.append(f"### {item.get('name', 'Unnamed')}")
            lines.append("")
            lines.append(f"- **ID:** `{item.get('id', '')}`")
            lines.append(f"- **Description:** {item.get('description', 'N/A')}")
            lines.append(f"- **Owner:** {item.get('owner', 'N/A')}")
            lines.append(f"- **Lifecycle:** {item.get('lifecycle', 'unknown')}")
            lines.append(f"- **Path:** `{item.get('source_path', '')}`")
            
            if item.get('tags'):
                lines.append(f"- **Tags:** {', '.join(f'`{tag}`' for tag in item['tags'])}")
            
            if item.get('depends_on'):
                lines.append(f"- **Dependencies:** {', '.join(f'`{dep}`' for dep in item['depends_on'])}")
            
            if item.get('apis'):
                lines.append("- **APIs:**")
                for api in item['apis']:
                    lines.append(f"  - {api.get('method', 'GET')} `{api.get('endpoint', '')}`")
            
            lines.append("")
        
        lines.append("---")
        lines.append("")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"✅ Markdown exported: {output_file}")

def export_json(items, output_file):
    """Export to JSON format"""
    
    export_data = {
        'generated': datetime.now().isoformat(),
        'total_items': len(items),
        'items': items
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2)
    
    print(f"✅ JSON exported: {output_file}")

def export_html(items, output_file):
    """Export to HTML format with styling"""
    
    # Group by registry
    by_registry = {}
    for item in items:
        registry = item.get('registry', 'unknown')
        if registry not in by_registry:
            by_registry[registry] = []
        by_registry[registry].append(item)
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Atlas Export</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        .summary {{
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .registry {{
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .registry h2 {{
            color: #34495e;
            margin-top: 0;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
        }}
        .item {{
            margin: 15px 0;
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            border-radius: 4px;
        }}
        .item h3 {{
            margin: 0 0 10px 0;
            color: #2c3e50;
        }}
        .item-meta {{
            font-size: 0.9em;
            color: #7f8c8d;
            line-height: 1.6;
        }}
        .tag {{
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            margin: 2px;
        }}
        code {{
            background: #ecf0f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        .filter {{
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .filter input {{
            width: 100%;
            padding: 10px;
            font-size: 1em;
            border: 2px solid #ddd;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <h1>🗺️ TerraFusion Atlas Export</h1>
    
    <div class="summary">
        <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p><strong>Total Items:</strong> {len(items)}</p>
        <p><strong>Registries:</strong> {len(by_registry)}</p>
    </div>
    
    <div class="filter">
        <input type="text" id="searchBox" placeholder="🔍 Search items by name, description, tags..." onkeyup="filterItems()">
    </div>
"""
    
    for registry, reg_items in sorted(by_registry.items()):
        html += f"""
    <div class="registry">
        <h2>{registry.title()} ({len(reg_items)} items)</h2>
"""
        
        for item in sorted(reg_items, key=lambda x: x.get('name', '')):
            tags_html = ' '.join(f'<span class="tag">{tag}</span>' for tag in item.get('tags', []))
            
            html += f"""
        <div class="item" data-searchable="{item.get('name', '')} {item.get('description', '')} {' '.join(item.get('tags', []))}">
            <h3>{item.get('name', 'Unnamed')}</h3>
            <div class="item-meta">
                <p><strong>ID:</strong> <code>{item.get('id', '')}</code></p>
                <p><strong>Description:</strong> {item.get('description', 'N/A')}</p>
                <p><strong>Owner:</strong> {item.get('owner', 'N/A')}</p>
                <p><strong>Lifecycle:</strong> {item.get('lifecycle', 'unknown')}</p>
                <p><strong>Path:</strong> <code>{item.get('source_path', '')}</code></p>
"""
            
            if item.get('tags'):
                html += f"                <p><strong>Tags:</strong> {tags_html}</p>\n"
            
            if item.get('depends_on'):
                deps_html = ', '.join(f'<code>{dep}</code>' for dep in item['depends_on'])
                html += f"                <p><strong>Dependencies:</strong> {deps_html}</p>\n"
            
            html += "            </div>\n        </div>\n"
        
        html += "    </div>\n"
    
    html += """
    <script>
        function filterItems() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase();
            const items = document.querySelectorAll('.item');
            
            items.forEach(item => {
                const searchable = item.getAttribute('data-searchable').toLowerCase();
                if (searchable.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>
"""
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ HTML exported: {output_file}")

def main():
    print("📦 TerraFusion Atlas Export Tool\n")
    
    # Create export directory
    EXPORT_DIR.mkdir(exist_ok=True)
    
    # Load all items
    print("Loading Atlas items...")
    items = load_all_items()
    print(f"✅ Loaded {len(items)} items\n")
    
    # Generate timestamp for filenames
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Export to all formats
    print("Exporting to multiple formats...\n")
    
    export_csv(items, EXPORT_DIR / f"atlas_export_{timestamp}.csv")
    export_json(items, EXPORT_DIR / f"atlas_export_{timestamp}.json")
    export_markdown(items, EXPORT_DIR / f"atlas_export_{timestamp}.md")
    export_html(items, EXPORT_DIR / f"atlas_export_{timestamp}.html")
    
    print(f"\n✨ All exports complete!")
    print(f"📂 Output directory: {EXPORT_DIR}")
    print(f"\n📄 Files created:")
    print(f"   • atlas_export_{timestamp}.csv (Excel-compatible)")
    print(f"   • atlas_export_{timestamp}.json (Machine-readable)")
    print(f"   • atlas_export_{timestamp}.md (Documentation)")
    print(f"   • atlas_export_{timestamp}.html (Interactive viewer)")
    print(f"\n💡 Open HTML file in browser for best viewing experience:")
    print(f"   open {EXPORT_DIR / f'atlas_export_{timestamp}.html'}")

if __name__ == '__main__':
    main()
