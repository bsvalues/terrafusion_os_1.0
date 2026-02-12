#!/bin/bash
# TerraFusion Atlas - Manual High-Priority Seeding
# Add the most critical items first with proper metadata

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🌟 Seeding TerraFusion Atlas with high-priority items..."

# ============================================================================
# SERVICES - Backend APIs and Core Services
# ============================================================================
echo ""
echo "🔧 Adding Services..."

python3 scripts/atlas_seed.py services \
  --id os.kernel.api \
  --name "OS Kernel API" \
  --description "Core operating system kernel API" \
  --owner kernel-team \
  --source_path backend \
  --tags os,kernel,api,dotnet,k8s,critical \
  --lifecycle active

python3 scripts/atlas_seed.py services \
  --id marketplace.gateway \
  --name "Marketplace Gateway" \
  --description "API gateway for marketplace services" \
  --owner marketplace-team \
  --source_path marketplace/backend \
  --tags marketplace,gateway,api,k8s \
  --lifecycle active

python3 scripts/atlas_seed.py services \
  --id consciousness.orchestrator \
  --name "Consciousness Orchestrator" \
  --description "AI consciousness orchestration service" \
  --owner ai-team \
  --source_path consciousness-service \
  --tags ai,consciousness,orchestration,k8s \
  --lifecycle experimental

# ============================================================================
# ENGINES - High-Performance Rust/WASM Engines
# ============================================================================
echo ""
echo "⚡ Adding Engines..."

python3 scripts/atlas_seed.py engines \
  --id engine.costforge.rust \
  --name "CostForge Rust Engine" \
  --description "High-performance cost calculation engine in Rust" \
  --owner kernel-team \
  --source_path rust-performance-engine \
  --tags rust,engine,ffi,wasm,valuation,critical \
  --language rust \
  --ffi_bindings dotnet,node,python \
  --lifecycle active

python3 scripts/atlas_seed.py engines \
  --id engine.valuation.core \
  --name "Valuation Engine" \
  --description "Core property valuation computation engine" \
  --owner valuation-team \
  --source_path valuation-engine \
  --tags rust,engine,valuation,performance \
  --language rust \
  --lifecycle active

# ============================================================================
# FRONTENDS - User Interfaces
# ============================================================================
echo ""
echo "🎨 Adding Frontends..."

python3 scripts/atlas_seed.py frontends \
  --id frontend.desktop.shell \
  --name "Desktop Shell" \
  --description "Main desktop application shell (Tauri)" \
  --owner frontend-team \
  --source_path src-tauri \
  --tags desktop,tauri,shell,ui,rust

python3 scripts/atlas_seed.py frontends \
  --id frontend.web.main \
  --name "Web Frontend" \
  --description "Main web application frontend" \
  --owner frontend-team \
  --source_path frontend \
  --tags web,react,ui,typescript

python3 scripts/atlas_seed.py frontends \
  --id marketplace.frontend \
  --name "Marketplace Frontend" \
  --description "Marketplace web interface" \
  --owner marketplace-team \
  --source_path marketplace/frontend \
  --tags marketplace,web,react,ui

# ============================================================================
# AGENTS - AI Agents and Swarms
# ============================================================================
echo ""
echo "🤖 Adding AI Agents..."

python3 scripts/atlas_seed.py agents \
  --id agent.swarm.commander \
  --name "AI Swarm Supreme Commander" \
  --description "Autonomous AI swarm coordination agent" \
  --owner ai-team \
  --source_path ai-swarm-supreme-commander \
  --tags ai,swarm,commander,autonomous \
  --agent_type coordinator \
  --capabilities coordination,strategy,resource-allocation \
  --lifecycle active

python3 scripts/atlas_seed.py agents \
  --id agent.valuation.specialist \
  --name "Valuation Specialist Agent" \
  --description "AI specialist for property valuation analysis" \
  --owner ai-team \
  --source_path agents/valuation-specialist \
  --tags ai,valuation,specialist,analysis \
  --agent_type specialist \
  --capabilities valuation,analysis,reporting \
  --lifecycle experimental

python3 scripts/atlas_seed.py agents \
  --id agent.consciousness.core \
  --name "Consciousness Core Agent" \
  --description "Core consciousness processing agent" \
  --owner ai-team \
  --source_path .ai \
  --tags ai,consciousness,core \
  --agent_type autonomous \
  --lifecycle experimental

# ============================================================================
# MODULES - Hot-Swappable Apps
# ============================================================================
echo ""
echo "🧩 Adding Modules..."

python3 scripts/atlas_seed.py modules \
  --id module.gis.parcel-tools \
  --name "GIS Parcel Tools" \
  --description "GIS tools for parcel management" \
  --owner gis-team \
  --source_path modules/parcel-tools \
  --tags gis,parcel,tools,plugin \
  --module_type core \
  --hot_swap \
  --marketplace \
  --lifecycle active

python3 scripts/atlas_seed.py modules \
  --id module.shock-and-awe \
  --name "Shock and Awe Module" \
  --description "Advanced demonstration and showcase module" \
  --owner plugins-team \
  --source_path shock-and-awe-2.0 \
  --tags demo,showcase,plugin \
  --module_type premium \
  --hot_swap \
  --lifecycle active

# ============================================================================
# DATASETS - Databases and Data
# ============================================================================
echo ""
echo "💾 Adding Datasets..."

python3 scripts/atlas_seed.py datasets \
  --id data.parcels.main \
  --name "Parcel Database" \
  --description "Primary parcel data database" \
  --owner data-team \
  --source_path database \
  --tags parcels,gis,postgres,primary,confidential \
  --data_type database \
  --technology PostgreSQL \
  --lifecycle active

python3 scripts/atlas_seed.py datasets \
  --id data.county.benton \
  --name "Benton County Data" \
  --description "Benton County specific datasets" \
  --owner data-team \
  --source_path county-data/benton \
  --tags county,benton,data \
  --data_type export \
  --lifecycle active

# ============================================================================
# PIPELINES - CI/CD and Workflows
# ============================================================================
echo ""
echo "🔄 Adding Pipelines..."

python3 scripts/atlas_seed.py pipelines \
  --id pipeline.ci.main \
  --name "Main CI Pipeline" \
  --description "Primary continuous integration pipeline" \
  --owner ops-team \
  --source_path .github/workflows \
  --tags ci,github-actions,automation

python3 scripts/atlas_seed.py pipelines \
  --id pipeline.deploy.prod \
  --name "Production Deployment Pipeline" \
  --description "Production deployment automation" \
  --owner ops-team \
  --source_path deployment-package \
  --tags cd,deployment,production,k8s

# ============================================================================
# BRANDS - Brand Assets
# ============================================================================
echo ""
echo "🎨 Adding Brands..."

python3 scripts/atlas_seed.py brands \
  --id brand.terrafusion \
  --name "TerraFusion Brand" \
  --description "TerraFusion OS brand identity and assets" \
  --owner marketing-team \
  --source_path Brand_Assets \
  --tags terrafusion,brand,design

python3 scripts/atlas_seed.py brands \
  --id brand.harris \
  --name "Harris Brand Integration" \
  --description "Harris County brand assets and guidelines" \
  --owner marketing-team \
  --source_path harris_brand \
  --tags harris,brand,partner

# ============================================================================
# ENVIRONMENTS - Deployment Environments
# ============================================================================
echo ""
echo "🌍 Adding Environments..."

python3 scripts/atlas_seed.py environments \
  --id env.dev \
  --name "Development Environment" \
  --description "Local and shared development environment" \
  --owner ops-team \
  --source_path .devcontainer \
  --tags dev,local,k8s

python3 scripts/atlas_seed.py environments \
  --id env.prod \
  --name "Production Environment" \
  --description "Production Kubernetes cluster" \
  --owner ops-team \
  --source_path deployment-package \
  --tags production,k8s,critical

# ============================================================================
# DEPLOYMENTS - Helm Charts and Infrastructure
# ============================================================================
echo ""
echo "🚀 Adding Deployments..."

python3 scripts/atlas_seed.py deployments \
  --id deploy.helm.main \
  --name "Main Helm Charts" \
  --description "Primary Helm chart deployments" \
  --owner ops-team \
  --source_path helm \
  --tags helm,k8s,deployment

python3 scripts/atlas_seed.py deployments \
  --id deploy.terraform.infra \
  --name "Infrastructure as Code" \
  --description "Terraform infrastructure definitions" \
  --owner ops-team \
  --source_path terraform-base \
  --tags terraform,iac,infrastructure

# ============================================================================
# PARTNERS - Partner Integrations
# ============================================================================
echo ""
echo "🤝 Adding Partners..."

python3 scripts/atlas_seed.py partners \
  --id partner.harris \
  --name "Harris County Integration" \
  --description "Harris County partnership integration" \
  --owner partnerships-team \
  --source_path harris_county_integration \
  --tags harris,county,integration

python3 scripts/atlas_seed.py partners \
  --id partner.woolpert \
  --name "Woolpert Integration" \
  --description "Woolpert vendor integration" \
  --owner partnerships-team \
  --source_path woolpert \
  --tags woolpert,vendor,gis

# ============================================================================
# COMPLIANCE - Security and Audits
# ============================================================================
echo ""
echo "📋 Adding Compliance Items..."

python3 scripts/atlas_seed.py compliance \
  --id compliance.security.audit \
  --name "Security Audit Reports" \
  --description "Comprehensive security audit documentation" \
  --owner security-team \
  --source_path compliance/security \
  --tags security,audit,compliance

python3 scripts/atlas_seed.py compliance \
  --id compliance.trust-fabric \
  --name "Trust Fabric Framework" \
  --description "Trust and security framework documentation" \
  --owner security-team \
  --source_path trust-fabric \
  --tags trust,security,framework

# ============================================================================
# COMPONENTS - Shared Libraries
# ============================================================================
echo ""
echo "🔩 Adding Components..."

python3 scripts/atlas_seed.py components \
  --id component.sdk.vendor \
  --name "Vendor SDK" \
  --description "Shared vendor integration SDK" \
  --owner platform-team \
  --source_path vendor-sdk \
  --tags sdk,integration,shared

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "✨ Atlas seeding complete!"
echo ""
echo "📊 View registries:"
echo "   python3 scripts/atlas_seed.py list"
echo ""
echo "📋 Generate summary:"
echo "   python3 scripts/atlas_summary.py"
