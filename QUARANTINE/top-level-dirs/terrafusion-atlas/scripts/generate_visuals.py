#!/usr/bin/env python3
"""
Generate Visual Architecture Dashboards from Atlas
Creates PNG/SVG visualizations of the repository structure
"""

import json
import subprocess
from pathlib import Path

ATLAS_ROOT = Path(__file__).parent.parent
REPO_ROOT = ATLAS_ROOT.parent
REGISTRIES_DIR = ATLAS_ROOT / "registries"
GRAPH_DOT = REPO_ROOT / "repo-map-out" / "graph.dot"
OUTPUT_DIR = REPO_ROOT / "architecture-diagrams"

def check_graphviz():
    """Check if Graphviz is installed"""
    try:
        result = subprocess.run(['dot', '-V'], capture_output=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def generate_atlas_graph():
    """Generate graph showing Atlas relationships"""
    
    # Load all registries
    items_by_registry = {}
    dependencies = []
    
    for reg_file in REGISTRIES_DIR.glob("*.json"):
        with open(reg_file) as f:
            data = json.load(f)
            registry = reg_file.stem
            items = data.get('items', [])
            items_by_registry[registry] = items
            
            # Extract dependencies
            for item in items:
                item_id = item.get('id')
                deps = item.get('depends_on', [])
                for dep in deps:
                    dependencies.append((item_id, dep))
    
    # Generate DOT format
    lines = [
        'digraph TerraFusionAtlas {',
        '  rankdir=LR;',
        '  node [shape=box, style="rounded,filled", fontname="Arial"];',
        '  edge [color="#666666"];',
        '',
        '  // Subgraphs by registry',
    ]
    
    colors = {
        'services': '#3498db',
        'engines': '#e74c3c',
        'frontends': '#9b59b6',
        'agents': '#f39c12',
        'modules': '#1abc9c',
        'datasets': '#34495e',
        'pipelines': '#16a085',
        'deployments': '#2c3e50',
    }
    
    for registry, items in items_by_registry.items():
        if not items or len(items) > 50:  # Skip large registries for clarity
            continue
        
        color = colors.get(registry, '#95a5a6')
        lines.append(f'  subgraph cluster_{registry} {{')
        lines.append(f'    label="{registry.title()}";')
        lines.append(f'    color="{color}";')
        lines.append('    style=filled;')
        lines.append(f'    fillcolor="{color}20";')
        
        for item in items[:10]:  # Limit items per registry
            item_id = item.get('id', '').replace('.', '_')
            item_name = item.get('name', '')
            lines.append(f'    "{item_id}" [label="{item_name}", fillcolor="{color}"];')
        
        lines.append('  }')
        lines.append('')
    
    # Add dependencies
    lines.append('  // Dependencies')
    for src, dst in dependencies[:100]:  # Limit edges
        src_clean = src.replace('.', '_')
        dst_clean = dst.replace('.', '_')
        lines.append(f'  "{src_clean}" -> "{dst_clean}";')
    
    lines.append('}')
    
    return '\n'.join(lines)

def create_simple_overview():
    """Create simplified overview graph"""
    
    # Count items per registry
    registry_counts = {}
    for reg_file in REGISTRIES_DIR.glob("*.json"):
        with open(reg_file) as f:
            data = json.load(f)
            count = len(data.get('items', []))
            registry_counts[reg_file.stem] = count
    
    lines = [
        'digraph TerraFusionOverview {',
        '  rankdir=TB;',
        '  node [shape=box, style="rounded,filled", fontname="Arial", fontsize=14];',
        '  edge [color="#999999", penwidth=2];',
        '',
        '  // Core layers',
        '  TerraFusion [label="TerraFusion OS\\n133.60 GB\\n18,583 files", shape=ellipse, fillcolor="#2c3e50", fontcolor=white, fontsize=16];',
        '',
    ]
    
    # Group registries by layer
    layers = {
        'Core': ['services', 'engines'],
        'Applications': ['frontends', 'modules'],
        'Intelligence': ['agents'],
        'Data': ['datasets'],
        'Operations': ['pipelines', 'deployments', 'environments'],
        'Ecosystem': ['partners', 'brands', 'compliance', 'components']
    }
    
    colors_by_layer = {
        'Core': '#3498db',
        'Applications': '#9b59b6',
        'Intelligence': '#f39c12',
        'Data': '#34495e',
        'Operations': '#16a085',
        'Ecosystem': '#95a5a6'
    }
    
    for layer, registries in layers.items():
        color = colors_by_layer.get(layer, '#95a5a6')
        lines.append(f'  subgraph cluster_{layer.lower()} {{')
        lines.append(f'    label="{layer}";')
        lines.append(f'    color="{color}";')
        lines.append('    style=filled;')
        lines.append(f'    fillcolor="{color}20";')
        
        for registry in registries:
            count = registry_counts.get(registry, 0)
            if count > 0:
                lines.append(f'    {registry} [label="{registry.title()}\\n({count} items)", fillcolor="{color}"];')
        
        lines.append('  }')
        lines.append('')
    
    # Add connections
    lines.append('  // Architecture flow')
    lines.append('  TerraFusion -> services;')
    lines.append('  TerraFusion -> engines;')
    lines.append('  services -> frontends;')
    lines.append('  services -> modules;')
    lines.append('  engines -> services;')
    lines.append('  agents -> services;')
    lines.append('  datasets -> services;')
    lines.append('  pipelines -> deployments;')
    lines.append('  deployments -> environments;')
    
    lines.append('}')
    
    return '\n'.join(lines)

def main():
    print("🎨 Generating Architecture Visualizations...\n")
    
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Check for Graphviz
    if not check_graphviz():
        print("⚠️  Graphviz not installed. Installing...")
        subprocess.run(['sudo', 'apt-get', 'update'], check=False)
        subprocess.run(['sudo', 'apt-get', 'install', '-y', 'graphviz'], check=False)
    
    # Generate overview graph
    print("📊 Creating overview diagram...")
    overview_dot = OUTPUT_DIR / "overview.dot"
    with open(overview_dot, 'w') as f:
        f.write(create_simple_overview())
    
    # Render to PNG and SVG
    for format in ['png', 'svg']:
        output = OUTPUT_DIR / f"overview.{format}"
        result = subprocess.run(
            ['dot', f'-T{format}', str(overview_dot), '-o', str(output)],
            capture_output=True
        )
        if result.returncode == 0:
            print(f"  ✅ Created: {output}")
        else:
            print(f"  ❌ Failed to create {format}")
    
    # Generate Atlas relationship graph
    print("\n🗺️  Creating Atlas relationships diagram...")
    atlas_dot = OUTPUT_DIR / "atlas-relationships.dot"
    with open(atlas_dot, 'w') as f:
        f.write(generate_atlas_graph())
    
    for format in ['png', 'svg']:
        output = OUTPUT_DIR / f"atlas-relationships.{format}"
        result = subprocess.run(
            ['dot', f'-T{format}', str(atlas_dot), '-o', str(output)],
            capture_output=True
        )
        if result.returncode == 0:
            print(f"  ✅ Created: {output}")
        else:
            print(f"  ❌ Failed to create {format}")
    
    # Render original repo graph if it exists
    if GRAPH_DOT.exists():
        print("\n📈 Rendering repository graph...")
        for format in ['png', 'svg']:
            output = OUTPUT_DIR / f"repository-structure.{format}"
            # Use sfdp for large graphs (force-directed)
            result = subprocess.run(
                ['sfdp', f'-T{format}', str(GRAPH_DOT), '-o', str(output)],
                capture_output=True,
                timeout=60
            )
            if result.returncode == 0:
                print(f"  ✅ Created: {output}")
            else:
                print(f"  ⚠️  Repository graph too large, using dot layout...")
                # Fallback to dot with subset
                result = subprocess.run(
                    ['dot', f'-T{format}', str(GRAPH_DOT), '-o', str(output), '-Gsize=20,20!'],
                    capture_output=True,
                    timeout=30
                )
                if result.returncode == 0:
                    print(f"  ✅ Created: {output}")
    
    # Create index HTML
    print("\n📝 Creating visualization index...")
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Architecture Visualizations</title>
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
        .diagram {{
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .diagram h2 {{
            color: #34495e;
            margin-top: 0;
        }}
        .diagram img {{
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .stat {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .stat-value {{
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }}
        .stat-label {{
            color: #7f8c8d;
            text-transform: uppercase;
            font-size: 0.8em;
        }}
    </style>
</head>
<body>
    <h1>🗺️ TerraFusion OS Architecture Visualizations</h1>
    
    <p><strong>Generated:</strong> {Path(__file__).parent.parent.parent.name}</p>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">18,583</div>
            <div class="stat-label">Files</div>
        </div>
        <div class="stat">
            <div class="stat-value">6,049</div>
            <div class="stat-label">Directories</div>
        </div>
        <div class="stat">
            <div class="stat-value">133.60 GB</div>
            <div class="stat-label">Repository Size</div>
        </div>
        <div class="stat">
            <div class="stat-value">28+</div>
            <div class="stat-label">Atlas Items</div>
        </div>
    </div>
    
    <div class="diagram">
        <h2>📊 System Overview</h2>
        <p>High-level view of TerraFusion OS architecture showing major components and their relationships.</p>
        <img src="overview.svg" alt="System Overview">
        <p><a href="overview.png">Download PNG</a> | <a href="overview.svg">Download SVG</a></p>
    </div>
    
    <div class="diagram">
        <h2>🗺️ Atlas Relationships</h2>
        <p>Detailed view of registered items in the Atlas and their dependencies.</p>
        <img src="atlas-relationships.svg" alt="Atlas Relationships">
        <p><a href="atlas-relationships.png">Download PNG</a> | <a href="atlas-relationships.svg">Download SVG</a></p>
    </div>
    
    <div class="diagram">
        <h2>🌳 Repository Structure</h2>
        <p>Complete repository directory structure (force-directed layout).</p>
        <img src="repository-structure.svg" alt="Repository Structure">
        <p><a href="repository-structure.png">Download PNG</a> | <a href="repository-structure.svg">Download SVG</a></p>
    </div>
    
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; text-align: center;">
        <p>Generated by TerraFusion Atlas • <a href="../terrafusion-atlas/README.md">Documentation</a></p>
    </footer>
</body>
</html>
"""
    
    index_file = OUTPUT_DIR / "index.html"
    with open(index_file, 'w') as f:
        f.write(html_content)
    print(f"  ✅ Created: {index_file}")
    
    print(f"\n✨ Visualizations complete!")
    print(f"\n📂 Output directory: {OUTPUT_DIR}")
    print(f"🌐 Open in browser: file://{index_file.absolute()}")
    print(f"\nOr run: open {index_file} (macOS) or xdg-open {index_file} (Linux)")

if __name__ == '__main__':
    main()
