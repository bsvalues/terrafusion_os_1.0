#!/usr/bin/env python3
"""
Build Partner-Ready Deliverables
Creates white-label documentation packages for partners
"""

import json
import shutil
from pathlib import Path
from datetime import datetime

ATLAS_ROOT = Path(__file__).parent.parent
REPO_ROOT = ATLAS_ROOT.parent
REGISTRIES_DIR = ATLAS_ROOT / "registries"
OUTPUT_DIR = REPO_ROOT / "partner-deliverables"
CATALOG_MD = REPO_ROOT / "repo-map-out" / "CATALOG.md"
DIAGRAMS_DIR = REPO_ROOT / "architecture-diagrams"

PARTNERS = {
    'harris-county': {
        'name': 'Harris County, Texas',
        'tags': ['harris', 'county', 'government', 'texas'],
        'focus': ['gis', 'valuation', 'appraisal', 'government-approvals'],
        'logo': '🏛️',
        'color': '#003087'
    },
    'woolpert': {
        'name': 'Woolpert Inc.',
        'tags': ['woolpert', 'gis', 'geospatial', 'architecture'],
        'focus': ['gis', 'mapping', 'spatial-data', 'surveying'],
        'logo': '🌍',
        'color': '#00A3E0'
    },
    'benton-county': {
        'name': 'Benton County',
        'tags': ['benton', 'county', 'government'],
        'focus': ['gis', 'valuation', 'appraisal'],
        'logo': '🏛️',
        'color': '#006B3F'
    }
}

def filter_atlas_items(partner_key):
    """Filter Atlas items relevant to partner"""
    partner = PARTNERS[partner_key]
    filtered = {}
    
    for reg_file in REGISTRIES_DIR.glob("*.json"):
        with open(reg_file) as f:
            data = json.load(f)
            registry = reg_file.stem
            items = data.get('items', [])
            
            # Filter by tags or focus areas
            relevant_items = []
            for item in items:
                item_tags = item.get('tags', [])
                item_name = item.get('name', '').lower()
                
                # Check if item matches partner criteria
                if any(tag in partner['tags'] for tag in item_tags):
                    relevant_items.append(item)
                elif any(focus in item_name or focus in ' '.join(item_tags) 
                        for focus in partner['focus']):
                    relevant_items.append(item)
            
            if relevant_items:
                filtered[registry] = relevant_items
    
    return filtered

def generate_partner_readme(partner_key, items_by_registry):
    """Generate partner-specific README"""
    partner = PARTNERS[partner_key]
    total_items = sum(len(items) for items in items_by_registry.values())
    
    return f"""# {partner['logo']} TerraFusion OS Integration Guide
## {partner['name']}

**Generated:** {datetime.now().strftime('%Y-%m-%d')}  
**TerraFusion OS Version:** 1.0  
**Partner Package Version:** 1.0

---

## 📋 Executive Summary

This package contains comprehensive technical documentation for integrating {partner['name']} with the TerraFusion OS platform. It includes:

- **{total_items} registered components** relevant to your integration
- Architecture diagrams and system dependencies
- API specifications and integration guides
- Compliance and security documentation
- Sample implementations and code examples

---

## 🗺️ System Architecture

TerraFusion OS is a sophisticated platform combining:

- **Core Services:** Authentication, authorization, data processing
- **Geospatial Engines:** GIS processing, mapping, spatial analysis
- **AI Agents:** Autonomous assistants for property valuation, analysis
- **Data Pipelines:** ETL workflows, data transformation, validation
- **Marketplace Platform:** Application ecosystem and integrations

### Your Integration Points

Based on your focus areas ({', '.join(partner['focus'])}), you'll primarily interact with:

"""

def generate_atlas_summary_md(items_by_registry):
    """Generate markdown summary of Atlas items"""
    lines = ["## 📊 Registered Components\n"]
    
    for registry, items in sorted(items_by_registry.items()):
        if not items:
            continue
            
        lines.append(f"\n### {registry.title()} ({len(items)} items)\n")
        
        for item in sorted(items, key=lambda x: x.get('name', '')):
            name = item.get('name', 'Unknown')
            desc = item.get('description', 'No description')
            owner = item.get('owner', 'unknown')
            status = item.get('lifecycle', 'unknown')
            
            lines.append(f"#### {name}\n")
            lines.append(f"- **Description:** {desc}\n")
            lines.append(f"- **Owner:** {owner}\n")
            lines.append(f"- **Status:** {status}\n")
            lines.append(f"- **ID:** `{item.get('id', '')}`\n")
            
            if item.get('tags'):
                lines.append(f"- **Tags:** {', '.join(f'`{tag}`' for tag in item['tags'])}\n")
            
            if item.get('apis'):
                lines.append(f"- **APIs:**\n")
                for api in item['apis']:
                    lines.append(f"  - {api.get('method', 'GET')} `{api.get('endpoint', '')}`\n")
            
            lines.append("\n")
    
    return ''.join(lines)

def generate_integration_guide(partner_key, items_by_registry):
    """Generate step-by-step integration guide"""
    partner = PARTNERS[partner_key]
    
    return f"""## 🚀 Integration Guide

### Prerequisites

Before beginning integration with TerraFusion OS:

1. **Development Environment**
   - Docker and Kubernetes access
   - Node.js 18+ or Python 3.9+
   - Git and CI/CD pipeline access

2. **Access Credentials**
   - API keys from TerraFusion platform team
   - OAuth 2.0 client credentials
   - SSL certificates for secure communication

3. **Network Requirements**
   - Whitelist TerraFusion API endpoints
   - Configure firewall rules for webhook callbacks
   - Enable CORS for web integrations

### Step 1: Authentication Setup

All API requests require OAuth 2.0 Bearer tokens:

```bash
# Request access token
curl -X POST https://api.terrafusion.local/oauth/token \\
  -H "Content-Type: application/json" \\
  -d '{{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "grant_type": "client_credentials"
  }}'
```

### Step 2: Data Integration

#### For GIS/Geospatial Data

If you're integrating geospatial data:

```python
import requests

# Upload GIS dataset
response = requests.post(
    'https://api.terrafusion.local/datasets',
    headers={{'Authorization': 'Bearer YOUR_TOKEN'}},
    files={{'file': open('parcels.geojson', 'rb')}},
    data={{
        'name': '{partner["name"]} Parcels',
        'type': 'geojson',
        'crs': 'EPSG:4326'
    }}
)

dataset_id = response.json()['id']
print(f"Dataset created: {{dataset_id}}")
```

#### For Property Valuation

If you're using AI valuation services:

```javascript
// Request property valuation
const response = await fetch('https://api.terrafusion.local/valuations', {{
  method: 'POST',
  headers: {{
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }},
  body: JSON.stringify({{
    property_id: 'PARCEL-12345',
    valuation_date: '2025-01-15',
    methods: ['comparative', 'cost', 'income']
  }})
}});

const valuation = await response.json();
console.log('Estimated value:', valuation.estimated_value);
```

### Step 3: Webhook Configuration

Subscribe to events relevant to your integration:

```bash
# Register webhook
curl -X POST https://api.terrafusion.local/webhooks \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{{
    "url": "https://your-domain.com/webhooks/terrafusion",
    "events": ["dataset.created", "valuation.completed", "approval.status_changed"],
    "secret": "YOUR_WEBHOOK_SECRET"
  }}'
```

### Step 4: Testing

Use our sandbox environment for integration testing:

- **Sandbox API:** `https://sandbox-api.terrafusion.local`
- **Test Credentials:** Provided separately
- **Sample Data:** Available in `/samples` directory

### Step 5: Production Deployment

Once testing is complete:

1. Request production credentials from TerraFusion team
2. Update API endpoints to production URLs
3. Configure monitoring and alerting
4. Implement error handling and retry logic
5. Schedule regular sync operations

---

## 📞 Support & Resources

- **Technical Support:** support@terrafusion.local
- **API Documentation:** https://docs.terrafusion.local
- **Status Page:** https://status.terrafusion.local
- **Developer Portal:** https://developers.terrafusion.local

---

## 🔒 Security & Compliance

### Data Security

- All API traffic uses TLS 1.3 encryption
- API keys must be rotated every 90 days
- Rate limiting: 1000 requests/hour (adjustable)

### Compliance

TerraFusion OS maintains compliance with:

- SOC 2 Type II
- GDPR (data privacy)
- HIPAA (if handling sensitive data)
- State/local government data regulations

### Data Retention

- Transaction logs: 7 years
- API logs: 90 days
- Cached data: 24 hours

---

*This integration guide is confidential and intended solely for {partner["name"]}.*
"""

def create_partner_package(partner_key):
    """Create complete partner deliverable package"""
    partner = PARTNERS[partner_key]
    package_dir = OUTPUT_DIR / partner_key
    
    print(f"\n{partner['logo']} Creating package for {partner['name']}...")
    
    # Create directory structure
    package_dir.mkdir(parents=True, exist_ok=True)
    (package_dir / "architecture").mkdir(exist_ok=True)
    (package_dir / "compliance").mkdir(exist_ok=True)
    (package_dir / "samples").mkdir(exist_ok=True)
    
    # Filter relevant Atlas items
    print("  📋 Filtering Atlas items...")
    items_by_registry = filter_atlas_items(partner_key)
    total_items = sum(len(items) for items in items_by_registry.values())
    print(f"     Found {total_items} relevant items")
    
    # Generate main README
    print("  📝 Generating README...")
    readme_content = generate_partner_readme(partner_key, items_by_registry)
    readme_content += generate_atlas_summary_md(items_by_registry)
    readme_content += generate_integration_guide(partner_key, items_by_registry)
    
    with open(package_dir / "README.md", 'w') as f:
        f.write(readme_content)
    
    # Export filtered Atlas data
    print("  💾 Exporting Atlas data...")
    atlas_export = {
        'partner': partner['name'],
        'generated': datetime.now().isoformat(),
        'total_items': total_items,
        'registries': {}
    }
    
    for registry, items in items_by_registry.items():
        atlas_export['registries'][registry] = [
            {
                'id': item.get('id'),
                'name': item.get('name'),
                'description': item.get('description'),
                'owner': item.get('owner'),
                'tags': item.get('tags', []),
                'lifecycle': item.get('lifecycle'),
                'apis': item.get('apis', [])
            }
            for item in items
        ]
    
    with open(package_dir / "atlas-export.json", 'w') as f:
        json.dump(atlas_export, f, indent=2)
    
    # Copy architecture diagrams
    print("  🎨 Copying architecture diagrams...")
    if DIAGRAMS_DIR.exists():
        for img in ['overview.svg', 'overview.png', 'atlas-relationships.svg']:
            src = DIAGRAMS_DIR / img
            if src.exists():
                shutil.copy(src, package_dir / "architecture" / img)
    
    # Create compliance document
    print("  🔒 Generating compliance documentation...")
    compliance_doc = f"""# Compliance & Security Documentation
## {partner['name']} Integration

### Security Certifications

- **SOC 2 Type II:** Audited by [Third Party Auditor]
- **ISO 27001:** Information Security Management
- **NIST 800-53:** Federal security controls (if applicable)

### Data Classification

| Classification | Description | Handling |
|---------------|-------------|----------|
| Public | Non-sensitive information | No restrictions |
| Internal | Business information | Access controls required |
| Confidential | Sensitive business data | Encryption + strict access |
| Restricted | Highly sensitive/regulated | Full encryption + audit trail |

### Integration Security Checklist

- [ ] API keys stored in secure vault (not in code)
- [ ] TLS 1.3 enabled for all connections
- [ ] Webhook signatures validated
- [ ] Rate limiting configured
- [ ] Error messages sanitized (no sensitive data)
- [ ] Logging configured for audit trail
- [ ] Incident response plan documented
- [ ] Regular security reviews scheduled

### Contact

For security concerns or incidents:
- **Email:** security@terrafusion.local
- **Phone:** [Emergency hotline]
- **PGP Key:** Available on request
"""
    
    with open(package_dir / "compliance" / "SECURITY.md", 'w') as f:
        f.write(compliance_doc)
    
    # Create sample code
    print("  💻 Creating sample code...")
    sample_code = """# Sample Integration Code

## Python Example

```python
from terrafusion_sdk import TerraFusionClient

# Initialize client
client = TerraFusionClient(
    client_id='YOUR_CLIENT_ID',
    client_secret='YOUR_CLIENT_SECRET',
    environment='sandbox'  # or 'production'
)

# Authenticate
client.authenticate()

# Query datasets
datasets = client.datasets.list(tags=['gis', 'parcels'])
for ds in datasets:
    print(f"Dataset: {ds.name} ({ds.id})")

# Request valuation
valuation = client.valuations.create(
    property_id='PARCEL-12345',
    methods=['comparative', 'cost']
)
print(f"Estimated value: ${valuation.estimated_value:,.2f}")
```

## JavaScript Example

```javascript
const TerraFusion = require('@terrafusion/sdk');

const client = new TerraFusion.Client({
  clientId: process.env.TERRAFUSION_CLIENT_ID,
  clientSecret: process.env.TERRAFUSION_CLIENT_SECRET,
  environment: 'sandbox'
});

async function main() {
  // Authenticate
  await client.authenticate();
  
  // List services
  const services = await client.services.list({ tags: ['ai'] });
  services.forEach(svc => {
    console.log(`Service: ${svc.name}`);
  });
  
  // Create dataset
  const dataset = await client.datasets.create({
    name: 'Property Parcels 2025',
    type: 'geojson',
    file: './parcels.geojson'
  });
  console.log(`Created dataset: ${dataset.id}`);
}

main().catch(console.error);
```
"""
    
    with open(package_dir / "samples" / "EXAMPLES.md", 'w') as f:
        f.write(sample_code)
    
    # Create index/manifest
    manifest = {
        'partner': partner['name'],
        'package_version': '1.0',
        'generated': datetime.now().isoformat(),
        'contents': {
            'README.md': 'Main integration guide and component reference',
            'atlas-export.json': 'Machine-readable Atlas data export',
            'architecture/': 'System architecture diagrams (PNG/SVG)',
            'compliance/SECURITY.md': 'Security and compliance documentation',
            'samples/EXAMPLES.md': 'Sample integration code'
        },
        'total_items': total_items,
        'focus_areas': partner['focus']
    }
    
    with open(package_dir / "MANIFEST.json", 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"  ✅ Package created: {package_dir}")
    print(f"     Total size: {sum(f.stat().st_size for f in package_dir.rglob('*') if f.is_file()) / 1024:.1f} KB")
    
    return package_dir

def create_archive(package_dir):
    """Create ZIP archive of partner package"""
    archive_name = f"{package_dir.name}-{datetime.now().strftime('%Y%m%d')}"
    archive_path = OUTPUT_DIR / archive_name
    
    print(f"  📦 Creating archive: {archive_name}.zip")
    shutil.make_archive(str(archive_path), 'zip', package_dir)
    print(f"     ✅ Archive created: {archive_path}.zip")
    
    return f"{archive_path}.zip"

def main():
    print("🎁 Building Partner Deliverable Packages\n")
    print("=" * 60)
    
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    archives = []
    
    for partner_key in PARTNERS:
        package_dir = create_partner_package(partner_key)
        archive = create_archive(package_dir)
        archives.append(archive)
    
    print("\n" + "=" * 60)
    print("\n✨ All partner packages created!\n")
    print("📂 Output directory:", OUTPUT_DIR)
    print("\n📦 Archives:")
    for archive in archives:
        print(f"   • {Path(archive).name}")
    
    print("\n🚀 Next steps:")
    print("   1. Review packages for accuracy")
    print("   2. Add partner-specific API credentials")
    print("   3. Update contact information")
    print("   4. Deliver via secure channel")

if __name__ == '__main__':
    main()
