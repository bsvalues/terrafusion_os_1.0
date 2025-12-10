SHELL := /bin/bash
.DEFAULT_GOAL := oneclick

# TerraFusion OS 1.0 - Elite Government Operating System
# One-Click Production Deployment with Factor 12 Sacred Mathematics

.PHONY: help demo-benton stop logs clean status validate oneclick preflight security core swarm api package db-migrate ontology-validate actions-validate flows bundle

help: ## Show this help message
	@echo "TerraFusion OS 1.0 - Elite Government Operating System"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "🚀 ONE-CLICK DEPLOYMENT (NEW):"
	@echo "  make oneclick        # Complete deployment pipeline (all gates)"
	@echo "  make oneclick-ps     # PowerShell version (Windows native)"
	@echo "  make preflight       # Gate A - Hardware/OS/Ports/DNS/Deps"
	@echo "  make preflight-ps    # PowerShell preflight validation"
	@echo "  make security        # Gate B - Security baseline & SBOM"
	@echo "  make core            # Gate C - Core stack bring-up"
	@echo "  make swarm           # Gate D - AI swarm control plane"
	@echo "  make swarm-ps        # PowerShell AI-swarm readiness"
	@echo "  make api             # Gate E - API surface publish"
	@echo "  make validate        # Gate F - Full validation matrix"
	@echo "  make package         # Package artifacts"
	@echo "  make fix-wsl         # Fix WSL path translation issues"
	@echo ""
	@echo "🏛️  BENTON COUNTY DEMO (LEGACY):"
	@echo "  • 205k residents, 85k properties"
	@echo "  • Harris PACS integration"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🚀 QUICK START:"
	@echo "  make oneclick        # One-click deployment (RECOMMENDED)"
	@echo "  make demo-benton     # Deploy Benton County (legacy)"
	@echo "  make stop            # Stop all services"
	@echo "  make status          # Check deployment status"
	@echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# ONE-CLICK DEPLOYMENT PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

preflight: ## Gate A - Preflight checks (hardware/ports/DNS/deps)
	@echo "🔍 Gate A - Preflight checks..."
	bash ops/scripts/gate-a-preflight.sh

security: ## Gate B - Security baseline (TLS/MFA/RBAC/SBOM)
	@echo "🔒 Gate B - Security baseline..."
	bash ops/scripts/gate-b-security-baseline.sh

core: ## Gate C - Core stack bring-up (DB/Redis/Ingress/API)
	@echo "⚙️ Gate C - Core stack bring-up..."
	bash ops/scripts/gate-c-core-bringup.sh

swarm: ## Gate D - AI swarm control plane
	@echo "🧠 Gate D - AI swarm control plane..."
	bash ops/scripts/gate-d-swarm-online.sh

api: ## Gate E - API surface publish (OpenAPI/GraphQL)
	@echo "🌐 Gate E - API surface publish..."
	bash ops/scripts/gate-e-api-surface.sh

validate: ## Gate F - Full validation matrix (unit/integration/E2E/load/sec)
	@echo "🧪 Gate F - Full validation matrix..."
	bash ops/scripts/gate-f-validate-all.sh

package: ## Package artifacts
	@echo "📦 Packaging artifacts..."
	bash ops/scripts/package-artifacts.sh

oneclick: preflight security core swarm api validate package ## Complete one-click deployment pipeline
	@echo "✅ One‑click pipeline completed. See ./artifacts"

# PowerShell versions for Windows native execution
oneclick-ps: ## Complete one-click deployment using PowerShell
	@echo "🚀 PowerShell One-Click Deployment..."
	powershell -ExecutionPolicy Bypass -File ops/scripts/tf-oneclick.ps1

preflight-ps: ## PowerShell preflight validation
	@echo "🔍 PowerShell Preflight checks..."
	powershell -ExecutionPolicy Bypass -File ops/scripts/preflight.ps1

swarm-ps: ## PowerShell AI-swarm readiness validation
	@echo "🧠 PowerShell AI-swarm readiness..."
	powershell -ExecutionPolicy Bypass -File ops/scripts/ai-swarm-readiness.ps1

fix-wsl: ## Fix WSL path translation issues
	@echo "🔧 Fixing WSL path issues..."
	powershell -ExecutionPolicy Bypass -File ops/scripts/fix-wsl-path.ps1 -Fix

# ═══════════════════════════════════════════════════════════════════════════════
# ADDITIONAL TARGETS
# ═══════════════════════════════════════════════════════════════════════════════

db-migrate: ## Database migrations
	psql "$$DB_OLTP_DSN" -f db/migrations/001_init_ontology.sql
	psql "$$DB_OLTP_DSN" -f db/migrations/002_add_indices.sql
	-psql "$$DB_OLTP_DSN" -f db/migrations/003_seed_minimal.sql || true

ontology-validate: ## Validate ontology schemas
	@echo "🧾 Validating ontology..."
	# Placeholder: JSON/YAML schema validation (hook up ajv/yamale here)

actions-validate: ## Validate action catalog
	@echo "⚙️ Validating actions..."
	# Actions validated & signed (placeholder)

flows: ## Compile flows (CRD→Argo)
	@echo "🔄 Compiling flows..."
	bash ops/scripts/flow-compile.sh

bundle: ## Build edge/disconnected bundle
	@echo "📦 Building bundle..."
	cd tools/tf-bundle && go build -o ../../artifacts/tf-bundle && ../../artifacts/tf-bundle

# ═══════════════════════════════════════════════════════════════════════════════
# CI/CD TARGETS FOR GITHUB ACTIONS
# ═══════════════════════════════════════════════════════════════════════════════

ci-build: ## CI build target for GitHub Actions
	@echo "🔨 CI Build - TerraFusion OS..."
	@echo "📦 Building .NET Backend..."
	cd backend && dotnet restore TerraFusion.sln
	cd backend && dotnet build TerraFusion.sln --configuration Release --no-restore
	@echo "📦 Building Frontend (if exists)..."
	@if [ -d "frontend" ]; then cd frontend && npm ci && npm run build; fi
	@echo "✅ CI Build complete"

ci-test: ## CI test target for GitHub Actions
	@echo "🧪 CI Tests - TerraFusion OS..."
	@echo "🧪 Running Backend Tests..."
	cd backend && dotnet test TerraFusion.sln --configuration Release --no-build --verbosity minimal --logger "console;verbosity=normal"
	@echo "🧪 Running Frontend Tests (if exists)..."
	@if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then cd frontend && npm run test; fi
	@echo "✅ CI Tests complete"

# ═══════════════════════════════════════════════════════════════════════════════
# 🌈 ARC CONSTELLATION - GPT/RAG TARGETS (Phase 12)
# ═══════════════════════════════════════════════════════════════════════════════

API_URL ?= http://localhost:5000

gpt-ingest: ## 🌈 Arc: Index Benton CAMA RAG dataset
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║  🌈 ARC CONSTELLATION - RAG Ingestion                       ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo "Indexing dataset: benton_cama_basics..."
	@curl -s -X POST $(API_URL)/api/gpt/rag/index/benton_cama_basics && echo "" || \
		echo "⚠️  API not running. Start with 'make dev-backend' first."
	@echo "✅ RAG Ingestion request sent"

gpt-health: ## 📢 Herald: Check GPT/RAG health status
	@echo "📢 Herald: Checking GPT/RAG health..."
	@curl -s $(API_URL)/api/gpt/rag/health || \
		echo "⚠️  API not running. Start with 'make dev-backend' first."

gpt-system: ## 🤖 List available GPT configurations
	@echo "🤖 Listing system GPTs..."
	@curl -s $(API_URL)/api/gpt/system || \
		echo "⚠️  API not running. Start with 'make dev-backend' first."

test-gpt: ## 🧪 Run GPT/RAG specific tests (excluding Legacy)
	@echo "🌈 Arc: Running GPT/RAG tests..."
	cd backend && dotnet test src/TerraFusion.AI/TerraFusion.AI.csproj --nologo --filter "(FullyQualifiedName~GPT|FullyQualifiedName~RAG|FullyQualifiedName~Embedding|FullyQualifiedName~Audit|FullyQualifiedName~Explain)&Category!=Legacy"
	@echo "✅ GPT/RAG tests complete"

test-ai-fast: ## ⚡ Fast AI test slice (GPT/RAG/Explain, no Legacy)
	@echo "⚡ Fast AI test slice..."
	cd backend && dotnet test src/TerraFusion.AI/TerraFusion.AI.csproj --nologo --filter "(FullyQualifiedName~GPT|FullyQualifiedName~RAG|FullyQualifiedName~Explain)&Category!=Legacy"
	@echo "✅ Fast AI tests complete"

test-ai-unit: ## ✅ AI unit tests only (safe anytime, no server needed)
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║  ✅ AI Unit Tests - No server required                       ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	cd backend && dotnet test src/TerraFusion.AI/TerraFusion.AI.csproj --nologo --filter "Category!=Legacy"
	@echo "✅ AI unit tests complete (safe anytime)"

test-ai-all: ## 🧪 All AI tests including Legacy/Integration (requires running server)
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║  🧪 All AI Tests - Requires full stack running              ║"
	@echo "║  ⚠️  Make sure to run 'make dev-backend' first!              ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	cd backend && dotnet test src/TerraFusion.AI/TerraFusion.AI.csproj --nologo
	@echo "✅ All AI tests complete"

# ═══════════════════════════════════════════════════════════════════════════════
# ✨ RADIANT CONSTELLATION - DEVELOPER EXPERIENCE (Phase 12)
# ═══════════════════════════════════════════════════════════════════════════════

dev: ## ✨ Radiant: Show development startup instructions
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║  ✨ RADIANT CONSTELLATION - Development Mode                ║"
	@echo "║  TerraFusion OS 1.0 – Genesis Era                           ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Run these in separate terminals:"
	@echo "  Terminal 1: make dev-backend"
	@echo "  Terminal 2: make dev-frontend"
	@echo ""
	@echo "Or use VS Code tasks: 'TerraFusion: Launch Full Dev Mode'"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make dev-backend    # Start API on port 5000"
	@echo "  2. make gpt-ingest     # Index RAG dataset"
	@echo "  3. make dev-frontend   # Start OS Shell on port 5173"
	@echo ""

dev-backend: ## 🔨 Forge: Start backend API server
	@echo "🔨 Forge: Starting backend on port 5000..."
	cd backend && dotnet run --project src/TerraFusion.API

dev-frontend: ## ✨ Radiant: Start frontend OS Shell
	@echo "✨ Radiant: Starting frontend on port 5173..."
	cd frontend/apps/os-shell && pnpm dev

doctor: ## 📢 Herald: Run system diagnostics
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║  📢 HERALD CONSTELLATION - System Diagnostics               ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Checking prerequisites:"
	@command -v dotnet >/dev/null 2>&1 && echo "  ✓ dotnet" || echo "  ✗ dotnet (required)"
	@command -v node >/dev/null 2>&1 && echo "  ✓ node" || echo "  ✗ node (required)"
	@command -v pnpm >/dev/null 2>&1 && echo "  ✓ pnpm" || echo "  ✗ pnpm (required)"
	@command -v curl >/dev/null 2>&1 && echo "  ✓ curl" || echo "  ○ curl (optional)"
	@echo ""
	@echo "Environment:"
	@if [ -n "$$OPENAI_API_KEY" ]; then echo "  OPENAI_API_KEY: ✓ Set (OpenAI embeddings)"; else echo "  OPENAI_API_KEY: ○ Not set (SimulatedEmbeddings)"; fi
	@echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY BENTON COUNTY DEMO
# ═══════════════════════════════════════════════════════════════════════════════

demo-benton: ## Deploy Benton County flagship demonstration
	@echo "🚀 Deploying Benton County FLAGSHIP..."
	bash ops/benton-demo.sh

stop: ## Stop Benton County deployment
	@echo "🛑 Stopping Benton County deployment..."
	docker compose -f compose/docker-compose.demo.yml down -v || true

logs: ## Show logs for Benton County services
	@echo "📋 Showing Benton County logs..."
	docker compose -f compose/docker-compose.demo.yml logs -f --tail=200

status: ## Show Benton County deployment status
	@echo "📊 Benton County Status Report"
	@echo "════════════════════════════════════════════════════════════════"
	@if docker compose -f compose/docker-compose.demo.yml ps | grep -q "Up"; then \
		echo "  Status: ✅ RUNNING"; \
		echo "  UI:        http://localhost:3000"; \
		echo "  API:       http://localhost:8080"; \
		echo "  Grafana:   http://localhost:3001"; \
		echo "  Prometheus:http://localhost:9090"; \
	else \
		echo "  Status: ⏸️  STOPPED"; \
	fi
	@echo ""

clean: ## Clean artifacts and stop services
	@echo "🧹 Cleaning Benton County artifacts..."
	$(MAKE) stop
	rm -rf artifacts/benton/* 2>/dev/null || true
	docker system prune -f --volumes 2>/dev/null || true

validate: ## Validate Benton County configuration
	@echo "🔍 Validating Benton County configuration..."
	@test -f ".env.benton.example" && echo "  ✅ Environment template exists" || echo "  ❌ Environment template missing"
	@test -f "ops/benton-demo.sh" && echo "  ✅ Demo script exists" || echo "  ❌ Demo script missing"
	@test -f "compose/docker-compose.demo.yml" && echo "  ✅ Docker compose exists" || echo "  ❌ Docker compose missing"
	@test -f "scripts/run_quality_gates.sh" && echo "  ✅ Quality gates exist" || echo "  ❌ Quality gates missing"

health-check: ## Run health checks on Benton County deployment
	@echo "🏥 Running Benton County health checks..."
	@echo -n "API Health: "
	@curl -fsS "http://localhost:8080/health" >/dev/null 2>&1 && echo "✅ HEALTHY" || echo "❌ DOWN"
	@echo -n "UI Health: "
	@curl -fsS "http://localhost:3000" >/dev/null 2>&1 && echo "✅ HEALTHY" || echo "❌ DOWN"
	@echo -n "Database: "
	@docker exec terrafusion_benton-db-1 pg_isready -U terrafusion >/dev/null 2>&1 && echo "✅ HEALTHY" || echo "❌ DOWN"
