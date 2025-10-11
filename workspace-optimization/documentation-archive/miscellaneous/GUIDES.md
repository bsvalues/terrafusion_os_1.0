# TerraFusion User & Developer Guides

**Last Updated:** October 9, 2025  
**For Version:** 2.0 (Polyrepo Architecture)

---

## Overview

This comprehensive guide collection covers everything you need to work with TerraFusion, from initial setup to advanced development and deployment.

---

## Quick Start Guides

### 🚀 Getting Started in 5 Minutes

#### Prerequisites
- Node.js 18+ or 20+
- .NET 8.0 SDK
- Python 3.11+
- Docker Desktop
- Kubernetes (minikube or kind for local)

#### Quick Setup
\\\ash
# Clone the repository
git clone https://github.com/your-org/terrafusion-os-core
cd terrafusion-os-core

# Install dependencies
npm install
dotnet restore

# Run development environment
docker-compose up -d

# Start the application
npm run dev
\\\

---

## Installation Guides

### Development Environment Setup

#### Windows Setup
1. Install prerequisites:
   - Visual Studio 2022 or VS Code
   - .NET 8.0 SDK
   - Node.js 20 LTS
   - Python 3.11+
   - Docker Desktop

2. Configure tools:
   - Enable WSL2
   - Install PowerShell 7+
   - Configure Git

#### macOS Setup
1. Install Homebrew
2. Install prerequisites:
   \\\ash
   brew install dotnet-sdk node python@3.11 docker
   \\\

#### Linux Setup
\\\ash
# Ubuntu/Debian
sudo apt update
sudo apt install dotnet-sdk-8.0 nodejs npm python3.11 docker.io

# Enable Docker
sudo systemctl enable docker
sudo usermod -aG docker \
\\\

---

## Development Guides

### Backend Development

#### .NET Service Development
\\\csharp
// Create a new service
dotnet new webapi -n MyService
cd MyService

// Add TerraFusion shared library
dotnet add package TerraFusion.Shared

// Run the service
dotnet run
\\\

#### Python Service Development
\\\python
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload
\\\

---

### Frontend Development

#### React Application Setup
\\\ash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\\\

---

### Database Management

#### Running Migrations
\\\ash
# .NET Entity Framework
dotnet ef database update

# Or use migration scripts
psql -U postgres -d terrafusion -f migrations/001_initial_schema.sql
\\\

#### Database Backup
\\\ash
# Backup
pg_dump terrafusion > backup.sql

# Restore
psql terrafusion < backup.sql
\\\

---

## Deployment Guides

### Local Kubernetes Deployment

#### Using Minikube
\\\ash
# Start minikube
minikube start --cpus=4 --memory=8192

# Deploy with Helm
helm install terrafusion ./helm/terrafusion

# Access services
minikube service terrafusion-api
\\\

---

### Production Deployment

#### Kubernetes Production Deployment
\\\ash
# Apply infrastructure
terraform -chdir=infrastructure/terraform apply

# Deploy with ArgoCD
kubectl apply -f argocd/applications/

# Verify deployment
kubectl get pods -n terrafusion
kubectl get services -n terrafusion
\\\

---

## Operations Guides

### Monitoring & Observability

#### Access Grafana Dashboards
\\\ash
# Port forward to Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Access at http://localhost:3000
# Default credentials: admin/admin
\\\

#### View Prometheus Metrics
\\\ash
# Port forward to Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Access at http://localhost:9090
\\\

---

### Troubleshooting

#### Common Issues

**Issue: Service won't start**
\\\ash
# Check logs
kubectl logs -n terrafusion deployment/api-service

# Check events
kubectl get events -n terrafusion --sort-by='.lastTimestamp'
\\\

**Issue: Database connection failed**
\\\ash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql -h postgres-service -U postgres -d terrafusion
\\\

**Issue: High memory usage**
\\\ash
# Check resource usage
kubectl top pods -n terrafusion

# Scale down if needed
kubectl scale deployment/api-service --replicas=1 -n terrafusion
\\\

---

## Testing Guides

### Running Tests

#### Unit Tests
\\\ash
# .NET
dotnet test

# Python
pytest

# JavaScript
npm test
\\\

#### Integration Tests
\\\ash
# Run integration test suite
npm run test:integration
\\\

#### End-to-End Tests
\\\ash
# Run E2E tests
npm run test:e2e
\\\

---

## Security Guides

### Authentication Setup

#### Configure OAuth2
\\\yaml
# config/auth.yaml
oauth2:
  issuer: https://auth.terrafusion.com
  clientId: your-client-id
  clientSecret: \
\\\

#### mTLS Configuration
\\\ash
# Generate certificates
./scripts/generate-certs.sh

# Apply certificates
kubectl create secret tls terrafusion-tls \
  --cert=certs/tls.crt \
  --key=certs/tls.key \
  -n terrafusion
\\\

---

## Migration Guides

### Monorepo to Polyrepo Migration

See **POLYREPO_MIGRATION_GUIDE.md** for detailed migration steps.

#### Overview
1. Clone all 12 repositories
2. Update dependencies to point to new repos
3. Run migration scripts
4. Update CI/CD configurations
5. Test thoroughly
6. Deploy incrementally

---

## API Guides

### Using the REST API

#### Authentication
\\\ash
# Get access token
curl -X POST https://api.terrafusion.com/oauth/token \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
\\\

#### Making API Calls
\\\ash
# List properties
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.terrafusion.com/v1/properties

# Get specific property
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.terrafusion.com/v1/properties/123
\\\

---

## Performance Optimization Guides

### Caching Strategy
- Use Redis for session data
- Cache database queries for 5 minutes
- Implement CDN for static assets
- Use browser caching headers

### Database Optimization
- Add indexes on frequently queried columns
- Use connection pooling
- Implement read replicas for reporting
- Regular VACUUM and ANALYZE

---

## All Available Guides

- **Complete Guide to Experience All Elite Capabilities** - 🌟_LAUNCH_EVERYTHING.md
- **4.1 First-Time Setup (5 Minutes)** - 🌟_WORKSPACE_OF_DREAMS_MASTER_PLAN.md
- **2. Run first-time setup (ONE COMMAND)** - 🌟_WORKSPACE_OF_DREAMS_MASTER_PLAN.md
- **4.4 Deployment Workflow** - 🌟_WORKSPACE_OF_DREAMS_MASTER_PLAN.md
- **Task 2: Create Polyrepo Migration Guide ✅** - 🎉_PHASE_3D_COMPLETE.md
- **Primary Migration Guides** - 🎉_PHASE_3D_COMPLETE.md
- **🎓 Learning & Getting Started** - 🎊_PHASE_3D_VISUAL_SUMMARY.md
- **8. Deployment & Multi-Tenancy Architecture** - 🎓_MIT_PHD_SYSTEM_ARCHITECTURE_ANALYSIS.md
- ****Phase 4B: Package Publishing (GUIDE COMPLETE)**** - 🎯_ARCHITECTURE_EVOLUTION_TIMELINE_COMPLETE.md
- ****Phase 4C: Integration Testing (GUIDE COMPLETE)**** - 🎯_ARCHITECTURE_EVOLUTION_TIMELINE_COMPLETE.md
- ****PHASE 5: PRODUCTION DEPLOYMENT (Future)**** - 🎯_ARCHITECTURE_EVOLUTION_TIMELINE_COMPLETE.md
- **📦 DEPLOYMENT PHASES - THE EVOLUTION STORY** - 🎯_DEEP_DIVE_SESSION_3_INTEGRATION_TESTING.md
- **Phase 4: Multiversal Orchestrator (deployment/phase4/)** - 🎯_DEEP_DIVE_SESSION_3_INTEGRATION_TESTING.md
- **Phase 5: Cosmic Consciousness Integration (deployment/phase5/)** - 🎯_DEEP_DIVE_SESSION_3_INTEGRATION_TESTING.md
- **🚀 LAUNCH SCRIPTS - HOW TO START TERRAFUSION** - 🎯_DEEP_DIVE_SESSION_3_INTEGRATION_TESTING.md
- ****CATEGORY 11: ENHANCEMENT & DEPLOYMENT SERVICES (2 services)**** - 🎯_SERVICE_LAYER_COMPLETE_CATALOG.md
- **🚀 DEPLOYMENT STRATEGIES** - 🎯_SESSION_3_CI_CD_AUTOMATION_EVOLUTION.md
- **Deployment Patterns** - 🎯_SESSION_3_CI_CD_AUTOMATION_EVOLUTION.md
- ****Docker Deployments (14+ Configurations)**** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- **Category 1: Production Deployments** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- **Category 4: Specialized Deployments** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- ****deployment/web-demo/docker-compose.demo.yml** - Web demonstrations** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- ****deployment/installers/docker/docker-compose.yml** - Installer builds** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- ****deployment/advanced/packages/.../docker-compose.yml** - Advanced packages** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- **Key Deployment Strategies Identified:** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- **Production Deployment Evidence** - 🎯_TERRAFUSION_COMPLETE_KNOWLEDGE_BASE.md
- ****Phase 2: F1/F4 Deployment**** - 🏆_TERRAFUSION_COMPLETE_TRANSFORMATION.md
- ****Phase 4B: Package Publishing (GUIDE COMPLETE)**** - 🏆_TERRAFUSION_COMPLETE_TRANSFORMATION.md
- ****Phase 4C: Integration Testing (GUIDE COMPLETE)**** - 🏆_TERRAFUSION_COMPLETE_TRANSFORMATION.md
- ****✅ READY FOR EXECUTION (Complete Guides):**** - 🏆_TERRAFUSION_COMPLETE_TRANSFORMATION.md
- **Phase 4B package publishing guide** - 🏆_TERRAFUSION_COMPLETE_TRANSFORMATION.md
- **Phase 4C integration testing guide** - 🏆_TERRAFUSION_COMPLETE_TRANSFORMATION.md
- ****Phase 5: Production Deployment (Benton County):**** - 🏆_TERRAFUSION_COMPLETE_TRANSFORMATION.md
- **For Production Deployment** - 📊_WEEK_5_SUMMARY.md
- **Phase 6: Deployment Packages (98% Understanding)** - 📋_SESSION_4_COMPLETE_SUMMARY.md
- **📦 DEPLOYMENT PACKAGES COMPLETE ANALYSIS** - 📦_DEPLOYMENT_PACKAGES_COMPLETE.md
- **🏗️ PART 1: DEPLOYMENT DIRECTORY STRUCTURE** - 📦_DEPLOYMENT_PACKAGES_COMPLETE.md
- **Root Deployment Directories** - 📦_DEPLOYMENT_PACKAGES_COMPLETE.md
- **Deployment Philosophy** - 📦_DEPLOYMENT_PACKAGES_COMPLETE.md
- **🎯 PART 3: COUNTY DEMO DEPLOYMENT CHAINS** - 📦_DEPLOYMENT_PACKAGES_COMPLETE.md
- **Deployment Chain Structure** - 📦_DEPLOYMENT_PACKAGES_COMPLETE.md
- **Deployment Chain Features** - 📦_DEPLOYMENT_PACKAGES_COMPLETE.md
- **📦 DEPLOYMENT PACKAGES COMPLETE - PART 2** - 📦_DEPLOYMENT_PART_2_KUBERNETES_TERRAFORM_CLOUD.md
- ****4.2 API Deployment Configuration**** - 📦_DEPLOYMENT_PART_2_KUBERNETES_TERRAFORM_CLOUD.md
- ****9. CLOUD DEPLOYMENT STRATEGIES**** - 📦_DEPLOYMENT_PART_2_KUBERNETES_TERRAFORM_CLOUD.md
- ****9.2 Deployment Targets**** - 📦_DEPLOYMENT_PART_2_KUBERNETES_TERRAFORM_CLOUD.md
- ****9.3 Deployment Strategies**** - 📦_DEPLOYMENT_PART_2_KUBERNETES_TERRAFORM_CLOUD.md
- **2.2 MFA Setup Flow** - 🔒_SECURITY_ARCHITECTURE_PART_1_AUTHENTICATION.md
- **📊 REAL-WORLD DEPLOYMENT: BENTON COUNTY, WA** - 🔗_INTEGRATION_ARCHITECTURE_COMPLETE.md
- **Publish for deployment** - 🔧_BUILD_SYSTEM_COMPLETE.md
- **Optimized build for Hostinger deployment** - 🔧_BUILD_SYSTEM_COMPLETE.md
- ****CountyDeployment**** - 🗄️_DATABASE_SCHEMA_COMPLETE.md
- ****PluginInstallation**** - 🗄️_DATABASE_SCHEMA_COMPLETE.md
- **Node.js Setup** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Python Setup** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Playwright Setup** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Docker Buildx Setup** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **🏗️ STAGE 7: INFRASTRUCTURE DEPLOYMENT** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Infrastructure Deployment Job (Terraform)** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **⚓ STAGE 8: ARGOCD APPLICATION DEPLOYMENT** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **ArgoCD Deployment Job** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **ArgoCD CLI Setup & Login** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **✅ STAGE 9: POST-DEPLOYMENT VALIDATION** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Post-Deployment Testing Job** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Deployment Workflow: `deployment.yml`** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Deployment Information** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Championship Deployment** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Phase 6 Preview: Deployment Packages Deep Dive** - 🚀_CI_CD_PIPELINES_COMPLETE.md
- **Deployment Frequency** - 🚀_PHASE_4_KICKOFF.md
- **🚀 Phase 4: Production Deployment & CI/CD - KICKOFF!** - 🚀_PHASE_4_PRODUCTION_DEPLOYMENT_KICKOFF.md
- **🚀 Getting Started: Week 1 Checklist** - 🚀_PHASE_4_PRODUCTION_DEPLOYMENT_KICKOFF.md
- **Risk 3: Production Deployment Downtime** - 🚀_PHASE_4_PRODUCTION_DEPLOYMENT_KICKOFF.md
- **Simple deployment** - ACTUAL_REALITY_CHECK.md
- **How to Use This Template** - ADR_TEMPLATE.md
- **Phase 4: Data Infrastructure Setup (4-8 hours)** - AI_AGENT_HANDOFF_PROMPT.md
- ****Original Deployment Status**** - AI_ENHANCED_MIT_SOLUTION.md
- **🚀 AI TOOLS DEPLOYMENT COMPLETE** - AI_TOOLS_DEPLOYMENT_COMPLETE.md
- **🎮 **HOW TO USE**** - AI_TOOLS_DEPLOYMENT_COMPLETE.md
- ****Quick Start**** - AI_TOOLS_DEPLOYMENT_COMPLETE.md
- **📊 **DEPLOYMENT VERIFICATION**** - AI_TOOLS_DEPLOYMENT_COMPLETE.md
- **🎉 **DEPLOYMENT SUCCESS**** - AI_TOOLS_DEPLOYMENT_COMPLETE.md
- **Setup Object Storage (S3/MinIO)** - ARCHITECTURE_REFACTORING_PLAN.md
- **Setup Centralized Infrastructure Repo** - ARCHITECTURE_REFACTORING_PLAN.md
- **ArgoCD for continuous deployment** - ARCHITECTURE_REFACTORING_PLAN.md
- **🚀 How to Use (Quick Reference)** - ATLAS_IMPLEMENTATION_COMPLETE.md
- **Setup Script** - ATLAS_MAPPER_COMPLETE.md
- **🚀 How to Use the System** - ATLAS_MAPPER_COMPLETE.md
- **🎨 Brand Guidelines Followed** - BRAND_TRANSCENDENCE_COMPLETE.md
- **🚀 TERRAFUSION OS - BUILD & RUN GUIDE** - BUILD_AND_RUN_GUIDE.md
- ****✅ Build & Deployment**** - CHANGELOG.md
- ****✅ Build & Deployment**** - CHANGELOG.md
- ****📦 Installation Packages**** - CHANGELOG.md
- ****🔧 Build & Deployment**** - CHANGELOG.md
- **[0.7.0] - 2025-01-10 - INSTALLATION PACKAGES** - CHANGELOG.md
- **📦 **Professional Installation System**** - CHANGELOG.md
- **🏛️ **County-Specific Setup**** - CHANGELOG.md
- **🚀 Deployment Strategies** - CI_CD_POLYREPO_IMPLEMENTATION_PLAN.md
- **Deployment Platforms** - CI_CD_POLYREPO_IMPLEMENTATION_PLAN.md
- **Terrafusion OS 1.0 - Complete Development & Operations Guide** - CLAUDE.md
- **Quick Start Commands** - CLAUDE.md
- **County Deployment** - CLAUDE.md
- **Deployment Models** - CLAUDE.md
- **Environment Setup** - CLAUDE.md
- **First-Time Setup** - CLAUDE.md
- **Validate installation** - CLAUDE.md
- **Production Deployment** - CLAUDE.md
- **Container Deployment** - CLAUDE.md
- **Docker deployment** - CLAUDE.md
- **Kubernetes deployment** - CLAUDE.md
- ****Step 2: Move Old Deployment Attempts**** - CLEANUP_PLAN.md
- **Move old deployment packages** - CLEANUP_PLAN.md
- **🚀 **HOW TO RUN**** - COMPLETE_INTEGRATION_STATUS.md
- ****Quick Start**:** - COMPLETE_INTEGRATION_STATUS.md
- **🚀 **DEPLOYMENT & OPERATIONS**** - COMPREHENSIVE_MIT_PHD_AUDIT_REPORT.md
- ****Deployment Recommendation:**** - COMPREHENSIVE_MIT_PHD_AUDIT_REPORT.md
- **Contributing Guide** - CONTRIBUTING.md
- ****Week 4: Deployment** (Days 22-28)** - CORE_OS_IMPLEMENTATION_COMPLETE.md
- ****Priority 4: Deployment Packages** (Days 26-28)** - CORE_OS_IMPLEMENTATION_COMPLETE.md
- ****Day 20-21: Documentation & Deployment**** - CORE_OS_INTEGRATION_IMPLEMENTATION_PLAN.md
- **Core OS Services - Developer Guide** - CORE_OS_INTEGRATION_IMPLEMENTATION_PLAN.md
- ****Week 3: Testing & Deployment**** - CORE_OS_INTEGRATION_IMPLEMENTATION_PLAN.md
- **🚀 HOW TO EXECUTE (3 Options)** - CORRECTED_EXTRACTION_STRATEGY.md
- ****Test Setup**** - CRITICAL_IMPLEMENTATION_PLAN.md
- ****Integration Test Setup**** - CRITICAL_IMPLEMENTATION_PLAN.md
- **📊 **PHASE 6: MONITORING & DEPLOYMENT (Week 6)**** - CRITICAL_IMPLEMENTATION_PLAN.md
- **📊 Day 7 Chaos Test — Quick Start Guide** - DAY_7_QUICK_START.md
- **🚀 How to Use the RI Calculator (Copy-Paste Workflow)** - DAY_7_QUICK_START.md
- **2. Deployment Automation Script** - DAY_8_TASK1_COMPLETE.md
- **4. Quick Start Documentation** - DAY_8_TASK1_COMPLETE.md
- **Next Steps - Deployment Phase** - DAY_8_TASK1_COMPLETE.md
- **From infrastructure/k8s/deployments/api-deployment.yaml** - day5-security-review.md
- **🎯 DEPLOYMENT STATUS: READY FOR PRODUCTION** - DEPLOYMENT_STATUS_READY.md
- **🚀 Quick Start** - DESIGN_SYSTEM_README.md
- **🚀 How to Use It NOW** - DESIGN_SYSTEM_READY.md
- **Deployment Process** - DEVOPS_IMPLEMENTATION_SUMMARY.md
- **1. Infrastructure Deployment** - DEVOPS_IMPLEMENTATION_SUMMARY.md
- **2. Application Deployment** - DEVOPS_IMPLEMENTATION_SUMMARY.md
- **Quick Start** - DEVOPS_IMPLEMENTATION_SUMMARY.md
- **🚀 **HOW TO RUN**** - ELITE_SHOWCASE_COMPLETE.md
- ****Quick Start**:** - ELITE_SHOWCASE_COMPLETE.md
- ****Phase 4: Deployment Preparation (Week 6)**** - EXECUTIVE_SUMMARY_MIT_PHD_ASSESSMENT.md
- **🎯 **CONDITIONAL DEPLOYMENT RECOMMENDATION**** - EXECUTIVE_SUMMARY_MIT_PHD_ASSESSMENT.md
- ****Deployment Conditions:**** - EXECUTIVE_SUMMARY_MIT_PHD_ASSESSMENT.md
- **🚀 **HOW TO LAUNCH**** - FINAL_STATUS_REPORT.md
- **📋 **MAINTENANCE GUIDELINES**** - GITHUB_ACTIONS_FIX_SUMMARY.md
- **🚀 **Quick Start Every Day**** - GITHUB_CHEAT_SHEET.md
- **1. GitHub Environment Setup** - GITHUB_WORKFLOW_VALIDATION_FIXES.md
- **💬 IF THE EVP SAYS... (Response Guide)** - HARRIS_COMPLETE_PACKAGE.md
- **1. Live Demo Environment Setup ⚠️ **CRITICAL**** - HARRIS_DEMO_DEEP_DIVE_ANALYSIS.md
- **Days 1-2: Environment Setup & Testing** - HARRIS_DEMO_DEEP_DIVE_ANALYSIS.md
- **🔄 HOW TO PIVOT DURING THE MEETING** - HARRIS_MARKETPLACE_OPTIONS.md
- **🗣️ HOW TO TALK TO TERRAFUSION-AI** - HOW_TO_TALK_TO_TERRAFUSION_AI.md
- **The Complete Guide to Effective Communication** - HOW_TO_TALK_TO_TERRAFUSION_AI.md
- ****🚀 Deployment Requests**** - HOW_TO_TALK_TO_TERRAFUSION_AI.md
- ****🚀 Deployment & Operations**** - HOW_TO_TALK_TO_TERRAFUSION_AI.md
- **🚀 **QUICK START GUIDE**** - HOW_TO_TALK_TO_TERRAFUSION_AI.md
- **🔧 Troubleshooting Guide** - LAUNCH_CHECKLIST.md
- **Consult DEVELOPER_GUIDE.md, section "Registry Types"** - LAUNCH_CHECKLIST.md
- **🚀 **HOW TO LAUNCH**** - LAUNCH_INSTRUCTIONS.md
- **🤔 TerraFusion: Monorepo vs Polyrepo Decision Guide** - MONOREPO_VS_POLYREPO_DECISION.md
- **Step 3: Setup Shared Libraries** - MONOREPO_VS_POLYREPO_DECISION.md
- **Step 6: Setup CI/CD Per Repo** - MONOREPO_VS_POLYREPO_DECISION.md
- **📁 TERRAFUSION OS - ORGANIZATIONAL STRUCTURE GUIDE** - ORGANIZATIONAL_STRUCTURE_PLAN.md
- **S3/MinIO Setup** - PHASE_2_STRUCTURE_ANALYSIS.md
- **🚀 CI/CD SETUP** - PHASE_3_POLYREPO_EXTRACTION_PLAN.md
- **🎯 Phase 3B Extraction - Quick Start Summary** - PHASE_3B_QUICK_START_FIXED.md
- **🚀 HOW TO CONTINUE** - PHASE_3B_QUICK_START_FIXED.md
- **Quick Start Commands** - PHASE_3B_SUCCESS_QUICK_REFERENCE.md
- **GitHub Deployment** - PHASE_3C_EXTRACTION_COMPLETE.md
- **Deployment Complete ✅** - PHASE_3C_EXTRACTION_COMPLETE.md
- **Deployment Results** - PHASE_3C_EXTRACTION_COMPLETE.md
- **Deployment Details** - PHASE_3C_EXTRACTION_COMPLETE.md
- **Post-Deployment Actions Completed** - PHASE_3C_EXTRACTION_COMPLETE.md
- **Quick Start** - PHASE_3C_MODULE_EXTRACTION_PLAN.md
- **Task 2: Create Polyrepo Migration Guide 📘** - PHASE_3D_MONOREPO_CLEANUP_PLAN.md
- **🗄️ Phase 4: Data Infrastructure Setup** - PHASE_4_DATA_INFRASTRUCTURE_PLAN.md
- **Setup MinIO:** - PHASE_4_DATA_INFRASTRUCTURE_PLAN.md
- **Setup AWS Infrastructure:** - PHASE_4_DATA_INFRASTRUCTURE_PLAN.md
- **🐳 Container Registry Setup** - PHASE_4_DATA_INFRASTRUCTURE_PLAN.md
- **Setup Automated Backups (Cron):** - PHASE_4_DATA_INFRASTRUCTURE_PLAN.md
- **Setup Prometheus + Grafana:** - PHASE_4_DATA_INFRASTRUCTURE_PLAN.md
- **Infrastructure Setup:** - PHASE_4_DATA_INFRASTRUCTURE_PLAN.md
- **🏗️ Phase 4 Week 1-2: Pre-Production Infrastructure Setup** - PHASE_4_WEEK_1-2_INFRASTRUCTURE_SETUP.md
- **Day 1-2: Planning & Setup ✅** - PHASE_4_WEEK_1-2_INFRASTRUCTURE_SETUP.md
- **🚀 Deployment Instructions** - PHASE_4_WEEK_1-2_POAM_REMEDIATION_COMPLETE.md
- **1. OPA Policy Testing Deployment** - PHASE_4_WEEK_1-2_POAM_REMEDIATION_COMPLETE.md
- **2. Azure Sentinel SIEM Deployment** - PHASE_4_WEEK_1-2_POAM_REMEDIATION_COMPLETE.md
- **📈 Deployment Status** - PHASE_4_WEEK_1-2_TERRAFORM_COMPLETE.md
- **📈 Overall Progress: Phase 4 Production Deployment** - PHASE_4_WEEK_3-4_MILESTONE_COMPLETE.md
- **Deployment Statistics** - PHASE_4_WEEK_3-4_MILESTONE_COMPLETE.md
- **Test Case 1.2: Real Data Deployment Strategy** - PHASE_4_WEEK_3.5_DAY_2_EXECUTION.md
- **Test Case 2.1: Property Valuation ML Model Deployment** - PHASE_4_WEEK_3.5_DAY_2_EXECUTION.md
- **Setup** - PHASE_4_WEEK_3.5_DAY_2_OS_VALIDATION.md
- **Test Case 2.1: ML Model Deployment (1.5 hours)** - PHASE_4_WEEK_3.5_DAY_2_OS_VALIDATION.md
- **Setup** - PHASE_4_WEEK_3.5_DAY_2_OS_VALIDATION.md
- **Runbook 1: Multi-Tenant Deployment** - PHASE_4_WEEK_3.5_DAY_3_DOCUMENTATION.md
- **Step 3: Verify Deployment** - PHASE_4_WEEK_3.5_DAY_3_DOCUMENTATION.md
- **Watch deployment** - PHASE_4_WEEK_3.5_DAY_3_DOCUMENTATION.md
- **Wait for deployment** - PHASE_4_WEEK_3.5_DAY_5_PART_1_SECURITY_DEEP_DIVE.md
- **🔧 Phase 4A Implementation Guide: Core Repository CI/CD** - PHASE_4A_IMPLEMENTATION_GUIDE.md
- **🔐 Required GitHub Secrets Setup** - PHASE_4A_IMPLEMENTATION_GUIDE.md
- **🚀 TerraFusion Phase 6 → Phase 7 Transition Guide** - PHASE_7_ROADMAP.md
- **Run tests (after setup)** - PHASE_7_ROADMAP.md
- **Run E2E tests (after setup)** - PHASE_7_ROADMAP.md
- **🚀 **Deployment Readiness Certificate**** - PhD_OPERATIONAL_EXCELLENCE_CERTIFICATE.md
- **🚀 TerraFusion OS Polyrepo Migration Guide** - POLYREPO_MIGRATION_GUIDE.md
- **What is This Guide?** - POLYREPO_MIGRATION_GUIDE.md
- **🚀 Getting Started** - POLYREPO_MIGRATION_GUIDE.md
- **Deployment happens automatically for this domain only** - POLYREPO_MIGRATION_GUIDE.md
- **Documentation (Architecture, Guides, APIs)** - POLYREPO_QUICK_REFERENCE.md
- **Central Coordination (Deployment, Orchestration, Docs)** - POLYREPO_QUICK_REFERENCE.md
- ****Phase 1: Setup (Week 1)**** - PORTAL_MIGRATION_ARCHITECTURE.md
- **🛠️ Terrafusion OS 1.0 - Manual Prerequisites Installation Guide** - PREREQUISITES_INSTALLATION_GUIDE.md
- **🚀 Quick Installation (Automated)** - PREREQUISITES_INSTALLATION_GUIDE.md
- **🔧 Manual Installation (If automated fails)** - PREREQUISITES_INSTALLATION_GUIDE.md
- **4. Verify Installation** - PREREQUISITES_INSTALLATION_GUIDE.md
- **OR force deployment (skip some checks)** - PREREQUISITES_INSTALLATION_GUIDE.md
- **OR test deployment (dry run)** - PREREQUISITES_INSTALLATION_GUIDE.md
- **🆘 Alternative: Local Development Setup** - PREREQUISITES_INSTALLATION_GUIDE.md
- **🚀 Terrafusion OS 1.0 - Production Deployment Ready** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **🚀 Automated Deployment Scripts** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **🧪 Deployment Testing Results** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **🚀 Quick Start Deployment Commands** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **Run automated deployment** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **Monitor deployment** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **Verify deployment** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **Run deployment** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **📊 Expected Deployment Behavior** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **⚠️ Known Deployment Notes** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **🚀 Next Steps for Production Deployment** - PRODUCTION_DEPLOYMENT_READY_SUMMARY.md
- **🚀 Terrafusion OS 1.0 - Production Deployment Readiness** - PRODUCTION_DEPLOYMENT_READY.md
- **✅ **CURRENT STATUS: DEPLOYMENT READY**** - PRODUCTION_DEPLOYMENT_READY.md
- **📋 **DEPLOYMENT READINESS CHECKLIST**** - PRODUCTION_DEPLOYMENT_READY.md
- **✅ **7. Deployment Automation**** - PRODUCTION_DEPLOYMENT_READY.md
- **🏗️ **DEPLOYMENT ARCHITECTURE**** - PRODUCTION_DEPLOYMENT_READY.md
- **🚀 **DEPLOYMENT COMMANDS**** - PRODUCTION_DEPLOYMENT_READY.md
- ****Quick Start (Windows)**** - PRODUCTION_DEPLOYMENT_READY.md
- **Run production deployment** - PRODUCTION_DEPLOYMENT_READY.md
- **View deployment status** - PRODUCTION_DEPLOYMENT_READY.md
- ****Quick Start (Linux/macOS)**** - PRODUCTION_DEPLOYMENT_READY.md
- **Run production deployment** - PRODUCTION_DEPLOYMENT_READY.md
- **View deployment status** - PRODUCTION_DEPLOYMENT_READY.md
- **🎯 **READY FOR PRODUCTION DEPLOYMENT**** - PRODUCTION_DEPLOYMENT_READY.md
- ****✅ DEPLOYMENT STATUS: READY**** - PRODUCTION_DEPLOYMENT_READY.md
- **📚 Maintenance Guide** - PROJECT_COMPLETE.md
- **🎓 Quick Start Commands** - PROJECT_COMPLETE.md
- **Setup git hooks** - PROJECT_COMPLETE.md
- **Find all K8s deployments** - QUICK_REFERENCE.md
- **⚡ Quick Start Guide - Continue TerraFusion Transformation** - QUICK_START_CONTINUE.md
- **Estimated time: 2-4 hours + VM setup** - QUICK_START_CONTINUE.md
- **Setup Git** - QUICK_START_CONTINUE.md
- **Setup Git** - QUICK_START_CONTINUE.md
- **Setup Git** - QUICK_START_CONTINUE.md
- **Setup Git** - QUICK_START_CONTINUE.md
- **🤖 Terrafusion OS - AI Agent Integration Guide** - README_AI_AGENTS.md
- **📋 Quick Start** - README_AI_AGENTS.md
- **🎯 **QUICK START - EXPERIENCE IT NOW!**** - README_START_HERE.md
- ****✅ Complete System Ready for Deployment**** - README.md
- ****🚀 Immediate Deployment**** - README.md
- ****Complete User Guides**** - README.md
- ****Installation & Setup**** - README.md
- **🚀 **QUICK START**** - README.md
- **🛠️ Development Guidelines** - REPOSITORY_DEPENDENCIES.md
- **Build & Deployment Status** - RESOLUTION_COMPLETE_SUMMARY.md
- **Remaining Setup (Non-blocking)** - RESOLUTION_COMPLETE_SUMMARY.md
- **🚀 Deployment Readiness** - RESOLUTION_COMPLETE_SUMMARY.md
- **Ready for Deployment** - RESOLUTION_COMPLETE_SUMMARY.md
- **🛡️ SAFE CODE CLEANUP GUIDELINES** - SAFE_CODE_CLEANUP_GUIDELINES.md
- **📋 **HOW TO TEST SECURITY MONITORING**** - SECURITY_MONITORING_FIX_SUMMARY.md
- **🚀 **HOW TO EXPERIENCE EVERYTHING**** - SESSION_ABSOLUTE_FINAL_SUMMARY.md
- ****Implementation Guides:**** - SESSION_COMPLETE.md
- **⚡ Quick Start** - START_HERE.md
- **Setup git hooks** - START_HERE.md
- **🎯 PRODUCTION DEPLOYMENT READY** - SUPREME_COMMANDER_CLAUDE_IMPLEMENTATION_COMPLETE.md
- **✅ Kubernetes Deployment Manifests** - SUPREME_COMMANDER_CLAUDE_IMPLEMENTATION_COMPLETE.md
- **🚀 Deployment Automation** - SUPREME_COMMANDER_CLAUDE_IMPLEMENTATION_COMPLETE.md
- **🚀 DEPLOYMENT INSTRUCTIONS** - SUPREME_COMMANDER_CLAUDE_IMPLEMENTATION_COMPLETE.md
- **Quick Start (Production)** - SUPREME_COMMANDER_CLAUDE_IMPLEMENTATION_COMPLETE.md
- **Day 4-5: Production Deployment** - SYSTEMS_ENGINEERING_PLAN.md
- **🔧 TAURI MODULE EXTRACTION GUIDE** - TAURI_EXTRACTION_GUIDE.md
- **Week 1 (October 7-11, 2025) - Learning & Setup** - TEAM_ANNOUNCEMENT.md
- **Week 3 (November 2025) - CI/CD Setup (Phase 4)** - TEAM_ANNOUNCEMENT.md
- **🚀 Getting Started (Quick Steps)** - TEAM_ANNOUNCEMENT.md
- **Step 1: Read the Migration Guide (15 min)** - TEAM_ANNOUNCEMENT.md
- **📞 Developer Quick Start** - TERRA_UI_PHASE_2_COMPLETE.md
- ****Multi-County Deployment**** - TERRAFUSION_AI_ECOSYSTEM_CLARIFICATION.md
- ****Benton County Production Deployment**** - TERRAFUSION_AI_ECOSYSTEM_CLARIFICATION.md
- **🚀 **COMPLETE DEPLOYMENT WORKFLOW**** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- ****📋 Pre-Deployment Checklist**** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- ****🏗️ Phase-by-Phase Deployment**** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- ****✅ Post-Deployment Validation**** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- **🏛️ **COUNTY DEPLOYMENT WORKFLOWS**** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- ****🌍 Multi-County Deployment**** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- **Environment setup** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- **🚀 **QUICK START EVERY DAY**** - TERRAFUSION_COMPLETE_CHEAT_SHEET.md
- ****Phase 5: Migration & Deployment** (Week 5)** - TERRAFUSION_CORE_OS_INTEGRATION_ARCHITECTURE.md
- **🚀 HOW TO ACCESS** - TERRAFUSION_COS_INTEGRATION_FINAL_REPORT.md
- **🚀 HOW TO TEST** - TERRAFUSION_COS_MODULE_INTEGRATION_COMPLETE.md
- **✅ PRODUCTION DEPLOYMENT READY** - TERRAFUSION_COS_PRODUCTION_COMPLETE.md
- **🌐 DEPLOYMENT INSTRUCTIONS** - TERRAFUSION_COS_PRODUCTION_COMPLETE.md
- **Option 3: Cloud Deployment (AWS/Azure)** - TERRAFUSION_COS_PRODUCTION_COMPLETE.md
- **Pre-Deployment:** - TERRAFUSION_COS_PRODUCTION_COMPLETE.md
- **Deployment:** - TERRAFUSION_COS_PRODUCTION_COMPLETE.md
- **Post-Deployment:** - TERRAFUSION_COS_PRODUCTION_COMPLETE.md
- **Quick Start** - TERRAFUSION_DEV_KIT_README.md
- **Production Deployment** - TERRAFUSION_DEV_KIT_README.md
- **🎯 **HOW TO RUN THE DEMO**** - TERRAFUSION_DEV_KIT_v1.0_COMPLETE.md
- **🚀 **DEPLOYMENT STATUS**** - TERRAFUSION_ENHANCEMENT_COMPLETION_REPORT.md
- ****Deployment Packages Created:**** - TERRAFUSION_ENHANCEMENT_COMPLETION_REPORT.md
- ****Benton County Deployment Results**** - TERRAFUSION_IMPLEMENTATION_STATUS_SUMMARY.md
- **🚀 Deployment Readiness** - TERRAFUSION_PHASE_5_COMPLETE.md
- **Deployment Checklist** - TERRAFUSION_PHASE_5_COMPLETE.md
- **6. **Production Deployment** (1 week)** - TERRAFUSION_PHASE_5_COMPLETE.md
- **5.1 Multi-Region AWS Deployment** - TERRAFUSION_PRODUCTION_AUDIT_REPORT.md
- **6.2 ArgoCD Deployment Strategy** - TERRAFUSION_PRODUCTION_AUDIT_REPORT.md
- **GitOps deployment with sophisticated configuration** - TERRAFUSION_PRODUCTION_AUDIT_REPORT.md
- **10. Production Deployment Readiness** - TERRAFUSION_PRODUCTION_AUDIT_REPORT.md
- **14.2 Deployment Recommendation** - TERRAFUSION_PRODUCTION_AUDIT_REPORT.md
- **Deployment Ready** - TERRAFUSION_PRODUCTION_BUILD_SUCCESS.md
- **Level 4: Deployment Diagram (Azure Infrastructure)** - TERRAFUSION_SYSTEM_ARCHITECTURE_V1.md
- **🚀 TERRAFUSION OS 1.0 - ULTIMATE GUIDE** - TERRAFUSION_ULTIMATE_GUIDE.md
- ****Multi-County Deployment**** - TERRAFUSION_ULTIMATE_GUIDE.md
- **🚀 **DEPLOYMENT & OPERATIONS - VERIFIED PROCEDURES**** - TERRAFUSION_ULTIMATE_GUIDE.md
- **Benton County deployment** - TERRAFUSION_ULTIMATE_GUIDE.md
- **🏆 **ULTIMATE GUIDE COMPLETION STATUS**** - TERRAFUSION_ULTIMATE_GUIDE.md
- **📦 **DEPLOYMENT & PACKAGING TESTS**** - TEST_REGISTRY.md
- **🎯 **HOW TO EXPERIENCE IT ALL**** - ULTIMATE_SESSION_COMPLETE.md
- **Deployment Readiness** - VALIDATION_FIXES_SUMMARY_COMPLETE.md
- **3. Monitoring Setup** - VALIDATION_FIXES_SUMMARY_COMPLETE.md
- ****Room Setup:**** - WEEK_1_DAY_3_DELIVERABLES.md
- **2.1 POC Setup** - WEEK_3_AGENT_ORCHESTRATION_POC.md
- **3.1 POC Setup** - WEEK_4_DATA_ARCHITECTURE_POC.md
- **Part 1: Linkerd 2 Installation** - WEEK_5_PART_2_MTLS_POC.md
- **1.1 Infrastructure Setup** - WEEK_5_PART_2_MTLS_POC.md
- **1.2 Linkerd 2 Installation** - WEEK_5_PART_2_MTLS_POC.md
- **✅ pre-kubernetes-setup: control plane namespace does not already exist** - WEEK_5_PART_2_MTLS_POC.md
- **Restart deployments to inject proxies** - WEEK_5_PART_2_MTLS_POC.md
- **DEPLOYMENT                      RPS  SUCCESS  LATENCY_P50  LATENCY_P95  LATENCY_P99** - WEEK_5_PART_2_MTLS_POC.md
- **2.1 Polly Library Setup** - WEEK_7_PART_1_CIRCUIT_BREAKERS.md
- **1.2 Schema Registry Deployment** - WEEK_7_PART_2_EVENT_SCHEMAS_CHAOS.md
- **Verify deployment** - WEEK_7_PART_2_EVENT_SCHEMAS_CHAOS.md
- **2.1 Azure Chaos Studio Setup** - WEEK_7_PART_2_EVENT_SCHEMAS_CHAOS.md
- **Part 4: Production Deployment Roadmap** - WEEK_8_PART_3_PHASE_3.5_FINAL_REPORT.md
- **4.2 Production Deployment Timeline (Q1 2026)** - WEEK_8_PART_3_PHASE_3.5_FINAL_REPORT.md
- **🚀 **HOW TO START THE COMPANION**** - WORKSPACE_COMPANION_WORKING.md


---

## Additional Resources

### Documentation
- API Documentation: https://docs.terrafusion.com/api
- Architecture Diagrams: See ARCHITECTURE.md
- Decision Records: See DECISIONS.md

### Community
- GitHub Discussions
- Stack Overflow Tag: terrafusion
- Discord Server
- Monthly Community Calls

### Training
- Video Tutorials (coming soon)
- Certification Program (planned)
- Workshops and Webinars

---

**For feature details, see:** FEATURES.md  
**For troubleshooting, see:** This guide + GitHub Issues  
**For architecture, see:** ARCHITECTURE.md
