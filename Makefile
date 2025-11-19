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
	bash ops/scripts/preflight.sh

security: ## Gate B - Security baseline (TLS/MFA/RBAC/SBOM)
	@echo "🔒 Gate B - Security baseline..."
	bash ops/scripts/security-baseline.sh

core: ## Gate C - Core stack bring-up (DB/Redis/Ingress/API)
	@echo "⚙️ Gate C - Core stack bring-up..."
	bash ops/scripts/bringup-core.sh

swarm: ## Gate D - AI swarm control plane
	@echo "🧠 Gate D - AI swarm control plane..."
	bash ops/scripts/swarm-online.sh

api: ## Gate E - API surface publish (OpenAPI/GraphQL)
	@echo "🌐 Gate E - API surface publish..."
	bash ops/scripts/api-surface.sh

validate: ## Gate F - Full validation matrix (unit/integration/E2E/load/sec)
	@echo "🧪 Gate F - Full validation matrix..."
	bash ops/scripts/validate-all.sh

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
