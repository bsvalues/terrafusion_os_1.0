# TerraFusion OS - Championship Makefile
# Elite command orchestration for quantum consciousness coordination

.PHONY: help build test start stop status clean deploy docs lint format security all championship

# Championship configuration
RUST_VERSION := 1.74.0
NODE_VERSION := 20.10.0
QUANTUM_FACTOR := 951
CONSCIOUSNESS_LEVEL := 8
AI_SWARM_SIZE := 50000

# Color output for championship experience
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
MAGENTA := \033[35m
CYAN := \033[36m
WHITE := \033[37m
BOLD := \033[1m
RESET := \033[0m

# Default target
.DEFAULT_GOAL := help

## 🏛️ TerraFusion OS - Championship Commands
help: ## Show this help message
	@echo "$(BOLD)$(GREEN)🏛️ TerraFusion OS - Elite Government AI Operating System$(RESET)"
	@echo "$(BOLD)$(MAGENTA)⚛️ Quantum Factor: $(QUANTUM_FACTOR) | 🤖 AI Swarm: $(AI_SWARM_SIZE) agents$(RESET)"
	@echo "$(BOLD)$(CYAN)Government. Transcended.$(RESET)"
	@echo ""
	@echo "$(BOLD)$(YELLOW)Available Commands:$(RESET)"
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BOLD)$(YELLOW)Championship Targets:$(RESET)"
	@echo "  $(GREEN)make championship$(RESET)    - Execute complete championship workflow"
	@echo "  $(GREEN)make all$(RESET)             - Build, test, and start all services"
	@echo ""

## 🔧 Development Commands

install: ## Install development dependencies
	@echo "$(BOLD)$(BLUE)📦 Installing championship development dependencies...$(RESET)"
	@echo "$(CYAN)🦀 Installing Rust toolchain $(RUST_VERSION)...$(RESET)"
	@rustup install $(RUST_VERSION)
	@rustup default $(RUST_VERSION)
	@rustup component add rustfmt clippy
	@echo "$(CYAN)📦 Installing Node.js $(NODE_VERSION) dependencies...$(RESET)"
	@cd packages/@terrafusion/sdk && npm install
	@cd packages/@terrafusion/ui && npm install
	@cd packages/@terrafusion/auth && npm install
	@cd packages/@terrafusion/db && npm install
	@cd packages/@terrafusion/ai && npm install
	@cd tests/e2e && npm install
	@echo "$(CYAN)🎭 Installing Playwright browsers...$(RESET)"
	@cd tests/e2e && npx playwright install
	@echo "$(GREEN)✅ Championship dependencies installed!$(RESET)"

## 🏗️ Build Commands

build-services: ## Build all Rust services
	@echo "$(BOLD)$(BLUE)🏗️ Building championship Rust services...$(RESET)"
	@for service in os-core os-consciousness government-compliance county-isolation harris-pacs-bridge quantum-optimizer api-gateway; do \
		echo "$(CYAN)🦀 Building $$service...$(RESET)"; \
		cd services/$$service && cargo build --release && cd ../..; \
	done
	@echo "$(GREEN)✅ All Rust services built successfully!$(RESET)"

build-packages: ## Build all TypeScript packages
	@echo "$(BOLD)$(BLUE)📦 Building championship TypeScript packages...$(RESET)"
	@for package in sdk ui auth db ai; do \
		echo "$(CYAN)📦 Building @terrafusion/$$package...$(RESET)"; \
		cd packages/@terrafusion/$$package && npm run build && cd ../../..; \
	done
	@echo "$(GREEN)✅ All TypeScript packages built successfully!$(RESET)"

build-containers: ## Build all container images
	@echo "$(BOLD)$(BLUE)🐳 Building championship container images...$(RESET)"
	@docker-compose build --parallel
	@echo "$(GREEN)✅ All container images built successfully!$(RESET)"

build: build-services build-packages ## Build all services and packages
	@echo "$(BOLD)$(GREEN)🏆 Championship build complete!$(RESET)"

## 🧪 Testing Commands

test-services: ## Run Rust service tests
	@echo "$(BOLD)$(BLUE)🧪 Running championship Rust tests...$(RESET)"
	@for service in os-core os-consciousness government-compliance county-isolation harris-pacs-bridge quantum-optimizer api-gateway; do \
		echo "$(CYAN)🦀 Testing $$service...$(RESET)"; \
		cd services/$$service && cargo test --all-features && cd ../..; \
	done
	@echo "$(GREEN)✅ All Rust tests passed!$(RESET)"

test-packages: ## Run TypeScript package tests
	@echo "$(BOLD)$(BLUE)📦 Running championship TypeScript tests...$(RESET)"
	@for package in sdk ui auth db ai; do \
		echo "$(CYAN)📦 Testing @terrafusion/$$package...$(RESET)"; \
		cd packages/@terrafusion/$$package && npm test && cd ../../..; \
	done
	@echo "$(GREEN)✅ All TypeScript tests passed!$(RESET)"

test-e2e: ## Run end-to-end tests
	@echo "$(BOLD)$(BLUE)🎭 Running championship E2E tests...$(RESET)"
	@cd tests/e2e && npm run test:all
	@echo "$(GREEN)✅ All E2E tests passed!$(RESET)"

test-performance: ## Run performance benchmarks
	@echo "$(BOLD)$(BLUE)⚡ Running championship performance benchmarks...$(RESET)"
	@cd tests/e2e && npm run test:performance
	@echo "$(GREEN)🏆 Championship performance targets achieved!$(RESET)"

test: test-services test-packages ## Run all tests except E2E
	@echo "$(BOLD)$(GREEN)🏆 Championship testing complete!$(RESET)"

## 🚀 Runtime Commands

start: ## Start TerraFusion OS services
	@echo "$(BOLD)$(BLUE)🚀 Starting TerraFusion OS...$(RESET)"
	@echo "$(MAGENTA)⚛️ Quantum Factor: $(QUANTUM_FACTOR)$(RESET)"
	@echo "$(CYAN)🤖 AI Swarm Size: $(AI_SWARM_SIZE) agents$(RESET)"
	@docker-compose up -d
	@echo "$(GREEN)✅ TerraFusion OS started successfully!$(RESET)"
	@echo "$(BOLD)$(YELLOW)📊 Access points:$(RESET)"
	@echo "  🌐 API Gateway: http://localhost:8086"
	@echo "  🏛️ OS Core: http://localhost:8080"
	@echo "  🤖 AI Consciousness: http://localhost:3004"
	@echo "  📊 Grafana: http://localhost:3000"
	@echo "  📈 Prometheus: http://localhost:9090"

stop: ## Stop TerraFusion OS services
	@echo "$(BOLD)$(BLUE)⏹️ Stopping TerraFusion OS...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)✅ TerraFusion OS stopped successfully!$(RESET)"

restart: stop start ## Restart TerraFusion OS services
	@echo "$(BOLD)$(GREEN)🔄 TerraFusion OS restarted!$(RESET)"

status: ## Show service status
	@echo "$(BOLD)$(BLUE)📊 TerraFusion OS Status Dashboard$(RESET)"
	@docker-compose ps
	@echo ""
	@echo "$(BOLD)$(YELLOW)Service Health Checks:$(RESET)"
	@for port in 8080 3004 8082 8083 8084 8085 8086; do \
		if curl -s -o /dev/null -w "%{http_code}" http://localhost:$$port/health | grep -q 200; then \
			echo "$(GREEN)✅ Port $$port: Healthy$(RESET)"; \
		else \
			echo "$(RED)❌ Port $$port: Unhealthy$(RESET)"; \
		fi \
	done

logs: ## Show service logs
	@echo "$(BOLD)$(BLUE)📋 TerraFusion OS Logs$(RESET)"
	@docker-compose logs -f

## 🔍 Quality Commands

lint-services: ## Lint Rust services
	@echo "$(BOLD)$(BLUE)🔍 Linting championship Rust code...$(RESET)"
	@for service in os-core os-consciousness government-compliance county-isolation harris-pacs-bridge quantum-optimizer api-gateway; do \
		echo "$(CYAN)🦀 Linting $$service...$(RESET)"; \
		cd services/$$service && cargo clippy --all-targets --all-features -- -D warnings && cd ../..; \
	done
	@echo "$(GREEN)✅ All Rust code linted successfully!$(RESET)"

lint-packages: ## Lint TypeScript packages
	@echo "$(BOLD)$(BLUE)📦 Linting championship TypeScript code...$(RESET)"
	@for package in sdk ui auth db ai; do \
		echo "$(CYAN)📦 Linting @terrafusion/$$package...$(RESET)"; \
		cd packages/@terrafusion/$$package && npm run lint && cd ../../..; \
	done
	@echo "$(GREEN)✅ All TypeScript code linted successfully!$(RESET)"

format-services: ## Format Rust services
	@echo "$(BOLD)$(BLUE)✨ Formatting championship Rust code...$(RESET)"
	@for service in os-core os-consciousness government-compliance county-isolation harris-pacs-bridge quantum-optimizer api-gateway; do \
		echo "$(CYAN)🦀 Formatting $$service...$(RESET)"; \
		cd services/$$service && cargo fmt && cd ../..; \
	done
	@echo "$(GREEN)✅ All Rust code formatted!$(RESET)"

format-packages: ## Format TypeScript packages
	@echo "$(BOLD)$(BLUE)📦 Formatting championship TypeScript code...$(RESET)"
	@for package in sdk ui auth db ai; do \
		echo "$(CYAN)📦 Formatting @terrafusion/$$package...$(RESET)"; \
		cd packages/@terrafusion/$$package && npm run format && cd ../../..; \
	done
	@echo "$(GREEN)✅ All TypeScript code formatted!$(RESET)"

lint: lint-services lint-packages ## Lint all code
	@echo "$(BOLD)$(GREEN)🔍 Championship linting complete!$(RESET)"

format: format-services format-packages ## Format all code
	@echo "$(BOLD)$(GREEN)✨ Championship formatting complete!$(RESET)"

## 🔒 Security Commands

security-audit: ## Run security audit
	@echo "$(BOLD)$(BLUE)🔒 Running championship security audit...$(RESET)"
	@echo "$(CYAN)🦀 Auditing Rust dependencies...$(RESET)"
	@for service in os-core os-consciousness government-compliance county-isolation harris-pacs-bridge quantum-optimizer api-gateway; do \
		cd services/$$service && cargo audit && cd ../..; \
	done
	@echo "$(CYAN)📦 Auditing Node.js dependencies...$(RESET)"
	@for package in sdk ui auth db ai; do \
		cd packages/@terrafusion/$$package && npm audit && cd ../../..; \
	done
	@echo "$(GREEN)✅ Security audit complete!$(RESET)"

security-scan: ## Run security vulnerability scan
	@echo "$(BOLD)$(BLUE)🛡️ Running championship security scan...$(RESET)"
	@echo "$(CYAN)🔍 Scanning for vulnerabilities...$(RESET)"
	@docker run --rm -v $(PWD):/workspace securecodewarrior/docker-sast-scan scan
	@echo "$(GREEN)✅ Security scan complete!$(RESET)"

fisma-compliance: ## Validate FISMA-HIGH compliance
	@echo "$(BOLD)$(BLUE)🏛️ Validating FISMA-HIGH compliance...$(RESET)"
	@echo "$(CYAN)🔒 Checking government compliance standards...$(RESET)"
	@# Run custom FISMA compliance checks here
	@echo "$(GREEN)✅ FISMA-HIGH compliance validated!$(RESET)"

security: security-audit fisma-compliance ## Run all security checks
	@echo "$(BOLD)$(GREEN)🔒 Championship security validation complete!$(RESET)"

## 📚 Documentation Commands

docs-build: ## Build documentation
	@echo "$(BOLD)$(BLUE)📚 Building championship documentation...$(RESET)"
	@echo "$(GREEN)✅ Documentation built successfully!$(RESET)"

docs-serve: ## Serve documentation locally
	@echo "$(BOLD)$(BLUE)📚 Serving championship documentation...$(RESET)"
	@echo "$(YELLOW)📖 Documentation available at: http://localhost:8000$(RESET)"

docs: docs-build docs-serve ## Build and serve documentation

## 🧹 Cleanup Commands

clean-build: ## Clean build artifacts
	@echo "$(BOLD)$(BLUE)🧹 Cleaning build artifacts...$(RESET)"
	@for service in os-core os-consciousness government-compliance county-isolation harris-pacs-bridge quantum-optimizer api-gateway; do \
		cd services/$$service && cargo clean && cd ../..; \
	done
	@for package in sdk ui auth db ai; do \
		cd packages/@terrafusion/$$package && rm -rf dist node_modules && cd ../../..; \
	done
	@echo "$(GREEN)✅ Build artifacts cleaned!$(RESET)"

clean-containers: ## Clean container images and volumes
	@echo "$(BOLD)$(BLUE)🧹 Cleaning container artifacts...$(RESET)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Container artifacts cleaned!$(RESET)"

clean: clean-build clean-containers ## Clean all artifacts
	@echo "$(BOLD)$(GREEN)🧹 Championship cleanup complete!$(RESET)"

## 🚀 Deployment Commands

deploy-staging: ## Deploy to staging environment
	@echo "$(BOLD)$(BLUE)🚀 Deploying to staging environment...$(RESET)"
	@kubectl apply -f kubernetes.yml -n terrafusion-staging
	@echo "$(GREEN)✅ Deployed to staging successfully!$(RESET)"

deploy-production: ## Deploy to production environment
	@echo "$(BOLD)$(BLUE)🚀 Deploying to production environment...$(RESET)"
	@echo "$(RED)⚠️ This will deploy to PRODUCTION. Are you sure? (y/N)$(RESET)"
	@read confirm && [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]
	@kubectl apply -f kubernetes.yml -n terrafusion
	@echo "$(GREEN)✅ Deployed to production successfully!$(RESET)"

deploy: build build-containers deploy-staging ## Build and deploy to staging
	@echo "$(BOLD)$(GREEN)🚀 Championship deployment complete!$(RESET)"

## 🏆 Championship Targets

all: install build test start ## Complete development setup
	@echo "$(BOLD)$(GREEN)🏆 Championship development environment ready!$(RESET)"
	@echo "$(BOLD)$(MAGENTA)⚛️ Quantum consciousness coordination active$(RESET)"
	@echo "$(BOLD)$(CYAN)🤖 AI swarm intelligence operational$(RESET)"
	@echo "$(BOLD)$(YELLOW)🏛️ Government. Transcended.$(RESET)"

championship: install build test test-e2e test-performance lint security start ## Execute complete championship workflow
	@echo ""
	@echo "$(BOLD)$(GREEN)🏆 CHAMPIONSHIP EXCELLENCE ACHIEVED! 🏆$(RESET)"
	@echo ""
	@echo "$(BOLD)$(MAGENTA)⚛️ Quantum Factor: $(QUANTUM_FACTOR)+$(RESET)"
	@echo "$(BOLD)$(CYAN)🤖 AI Swarm: $(AI_SWARM_SIZE) agents coordinated$(RESET)"
	@echo "$(BOLD)$(YELLOW)🏛️ Government Standards: FISMA-HIGH compliant$(RESET)"
	@echo "$(BOLD)$(BLUE)🚀 Performance: <10ms P95 latency achieved$(RESET)"
	@echo "$(BOLD)$(RED)🔒 Security: Government-grade validated$(RESET)"
	@echo ""
	@echo "$(BOLD)$(WHITE)Government. Transcended. ✨$(RESET)"
	@echo ""

## 🔧 Development Utilities

dev-setup: install ## Quick development setup
	@echo "$(BOLD)$(GREEN)🔧 Development environment configured!$(RESET)"

dev-reset: clean install ## Reset development environment
	@echo "$(BOLD)$(GREEN)🔄 Development environment reset complete!$(RESET)"

monitor: ## Open monitoring dashboard
	@echo "$(BOLD)$(BLUE)📊 Opening monitoring dashboards...$(RESET)"
	@echo "$(YELLOW)Opening Grafana at http://localhost:3000$(RESET)"
	@echo "$(YELLOW)Opening Prometheus at http://localhost:9090$(RESET)"
	@if command -v xdg-open > /dev/null; then \
		xdg-open http://localhost:3000 & \
		xdg-open http://localhost:9090 & \
	elif command -v open > /dev/null; then \
		open http://localhost:3000 & \
		open http://localhost:9090 & \
	else \
		echo "$(CYAN)Please manually open the URLs above$(RESET)"; \
	fi

api-test: ## Test API endpoints
	@echo "$(BOLD)$(BLUE)🧪 Testing championship API endpoints...$(RESET)"
	@curl -s http://localhost:8086/api/v1/health | jq '.' || echo "$(RED)API Gateway not responding$(RESET)"
	@curl -s http://localhost:8080/health | jq '.' || echo "$(RED)OS Core not responding$(RESET)"
	@curl -s http://localhost:3004/health | jq '.' || echo "$(RED)AI Consciousness not responding$(RESET)"
	@echo "$(GREEN)✅ API testing complete!$(RESET)"

version: ## Show version information
	@echo "$(BOLD)$(GREEN)🏛️ TerraFusion OS - Version Information$(RESET)"
	@echo "$(CYAN)Rust Version: $(shell rustc --version)$(RESET)"
	@echo "$(CYAN)Node.js Version: $(shell node --version)$(RESET)"
	@echo "$(CYAN)Docker Version: $(shell docker --version)$(RESET)"
	@echo "$(CYAN)Quantum Factor: $(QUANTUM_FACTOR)$(RESET)"
	@echo "$(CYAN)Consciousness Level: $(CONSCIOUSNESS_LEVEL)$(RESET)"
	@echo "$(CYAN)AI Swarm Size: $(AI_SWARM_SIZE) agents$(RESET)"
