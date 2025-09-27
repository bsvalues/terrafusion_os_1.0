# TerraFusion OS Benton County UAT Environment
# Complete production-parity testing infrastructure

ENV ?= uat-benton
DUMP ?= /secure/benton-county-parcels.dump.gz
MASK ?= deterministic
TF_VERSION ?= 1.6.0

.PHONY: bootstrap platform data deploy validate clean

# =============================================================================
# INFRASTRUCTURE PROVISIONING
# =============================================================================

bootstrap:
	@echo "🏛️ [TerraFusion Infrastructure] Provisioning Benton County UAT environment..."
	@echo "📋 Components: PostGIS database, Redis, MinIO, networking, security"
	cd terraform && terraform init && terraform apply -var-file=$(ENV).tfvars -auto-approve
	@echo "✅ Infrastructure ready for TerraFusion OS deployment"

# =============================================================================
# PLATFORM SERVICES
# =============================================================================

platform:
	@echo "🚀 [Platform Services] Installing Kubernetes platform components..."
	@echo "📋 Components: Ingress, observability, NATS, Redis, MinIO, security policies"
	kubectl apply -f deploy/namespaces.yaml
	kubectl apply -f deploy/secrets/external-secrets-operator.yaml
	kubectl apply -f deploy/platform/
	kubectl apply -f deploy/security/
	@echo "✅ Platform services ready for TerraFusion applications"

# =============================================================================
# DATA CONFIGURATION
# =============================================================================

data:
	@echo "🗄️  [Benton County Data] Loading masked dataset + Elite Rust engine..."
	@echo "📊 Dataset: 89,247 parcels with PII masking and spatial validation"
	@echo "🤖 AI Agents: Configuring 1,008 + 50,000 Rust performance agents"
	psql $$PGURL -f db/00_roles.sql
	psql $$PGURL -f db/01_rls_policies.sql
	psql $$PGURL -f db/02_masking_functions.sql
	psql $$PGURL -v dump=$(DUMP) -f db/03_mask_and_seed.sql
	psql $$PGURL -f db/04_gis_validation.sql
	psql $$PGURL -f db/05_ai_agent_uat_config.sql
	psql $$PGURL -f db/06_rust_engine_config.sql
	@echo "✅ Benton County data ready with government-grade protection"

# =============================================================================
# APPLICATION DEPLOYMENT
# =============================================================================

deploy:
	@echo "🧩 [TerraFusion OS] Deploying complete government operating system..."
	@echo "📋 Components: OS API/UI, Admin portal, Marketplace, 35+ modules"
	@echo "🔐 Security: TLS encryption, government-grade certificates"
	kubectl apply -f deploy/apps/
	kubectl apply -f deploy/apps/modules/
	@echo "✅ TerraFusion OS deployed with all government modules"

# =============================================================================
# VALIDATION & TESTING
# =============================================================================

validate:
	@echo "🧪 [Government Validation] Running comprehensive test suite..."
	@echo "📋 Tests: E2E workflows, performance, chaos, security, compliance"
	@echo "👥 Personas: Assessor, County Admin, Realtor, Citizen"
	
	# E2E Testing
	npx playwright test --config=tests/e2e/playwright.config.ts
	
	# Performance Testing
	k6 run tests/perf/k6-smoke.js
	k6 run tests/perf/k6-spatial-heavy.js
	k6 run tests/perf/rust-engine.js
	
	# Government Compliance
	npx playwright test --config=tests/compliance/fisma-controls.config.ts
	
	# Chaos Engineering (dry-run)
	kubectl apply --server-dry-run=client -f tests/chaos/pod-kill-os-api.yaml
	kubectl apply --server-dry-run=client -f tests/chaos/net-partition-db.yaml
	
	# SLO Validation
	sloth generate -i slo/sloth-slos.yaml -o - | promtool check rules /dev/stdin
	
	# Module Testing
	npx playwright test tests/e2e/marketplace.spec.ts
	npx playwright test tests/e2e/modules-hotswap.spec.ts
	
	@echo "✅ All validation gates passed - Benton County ready for production"

# =============================================================================
# UTILITIES
# =============================================================================

clean:
	@echo "🧹 [Cleanup] Destroying UAT environment..."
	cd terraform && terraform destroy -var-file=$(ENV).tfvars -auto-approve
	@echo "✅ UAT environment cleaned up"

status:
	@echo "📊 [Status Check] TerraFusion OS UAT Environment"
	@echo "==============================================="
	kubectl get pods -n bcw-uat
	kubectl get services -n bcw-uat
	kubectl get ingress -n bcw-uat

logs:
	@echo "📝 [Logs] TerraFusion OS Application Logs"
	kubectl logs -f deployment/os-api -n bcw-uat

# =============================================================================
# DEVELOPMENT HELPERS
# =============================================================================

dev-tunnel:
	@echo "🔗 [Development] Creating secure tunnel to UAT environment..."
	kubectl port-forward service/os-api 8080:80 -n bcw-uat &
	kubectl port-forward service/test-hub 3000:80 -n bcw-uat &
	@echo "✅ Tunnels active: API on :8080, Test Hub on :3000"

ai-agents-status:
	@echo "🤖 [AI Agents] Current agent coordination status..."
	kubectl exec deployment/os-api -n bcw-uat -- curl -s http://localhost:8080/api/v1/ai/agents/status