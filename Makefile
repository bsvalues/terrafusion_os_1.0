SHELL := /bin/bash
.DEFAULT_GOAL := demo-benton

# TerraFusion OS 1.0 - Benton County Production Demo
# Individual county deployment with Harris PACS integration

.PHONY: help demo-benton stop logs clean status validate

help: ## Show this help message
	@echo "TerraFusion OS 1.0 - Benton County Production Demo"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "🏛️  BENTON COUNTY FLAGSHIP DEPLOYMENT:"
	@echo "  • 205k residents, 85k properties"
	@echo "  • Harris PACS integration"
	@echo "  • Production-ready demo system"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🚀 QUICK START:"
	@echo "  make demo-benton     # Deploy Benton County (default)"
	@echo "  make stop            # Stop all services"
	@echo "  make status          # Check deployment status"
	@echo ""

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