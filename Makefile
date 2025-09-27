
.PHONY: build run test fmt docker preflight security core swarm api validate package

# Original TerraFusion commands
build:
	cargo build --workspace --release

run:
	cargo run -p golden-service

test:
	cargo test --workspace

fmt:
	cargo fmt --all

docker:
	docker build -t terrafusion/grfe:latest .

# TerraFusion One-Click Pipeline Gates
preflight:
	bash ops/scripts/preflight.sh

security:
	bash ops/scripts/security-baseline.sh

core:
	bash ops/scripts/bringup-core.sh

swarm:
	bash ops/scripts/swarm-online.sh

api:
	bash ops/scripts/api-surface.sh

validate:
	bash ops/scripts/validate-all.sh

package:
	bash ops/scripts/package-artifacts.sh

oneclick: preflight security core swarm api validate package
	@echo "✅ One‑click pipeline completed. See ./artifacts"

# ---- tfctl convenience targets (QoL) ---------------------------------
.PHONY: start start-fg status fix logs kill env doctor diag profile test-tfctl

start:
	python3 tfctl.py launch --open

start-fg:
	python3 tfctl.py launch --open --fg

status:
	python3 tfctl.py status

fix:
	python3 tfctl.py fix

logs:
	python3 tfctl.py logs

kill:
	python3 tfctl.py kill

env:
	python3 tfctl.py env

doctor:
	python3 tfctl.py doctor

diag:
	python3 tfctl.py diag --pretty

profile:
	python3 tfctl.py profile

test-tfctl:
	pytest -q

# ---- Repo-root dev helpers (convenience targets for multi-language dev) -------------------
.PHONY: init build build-api build-rust build-images migrate seed up down logs perf-smoke clean

SHELL := /bin/bash
DOCKER ?= docker
COMPOSE ?= docker compose
DOTNET ?= dotnet
CARGO ?= cargo

init: ## First-time setup (git hooks, local dirs)
	mkdir -p .data/postgres .data/redis .data/nats .data/grafana .data/prom
	cp -n .env.example .env || true
	@echo "Initialized. Edit .env before running."

build: build-api build-rust build-images ## Build all backends and images

build-api: ## Build .NET API (no-op if not present)
	if [ -d backend/api ]; then \
		$(DOTNET) restore backend/api || true; \
		$(DOTNET) build -c Debug backend/api || true; \
		$(DOTNET) publish -c Debug -o backend/api/publish backend/api || true; \
	else \
		echo "No backend/api directory found; skipping build-api"; \
	fi

build-rust: ## Build Rust workers/services (if any)
	if [ -f backend/services/valuations/Cargo.toml ]; then \
		$(CARGO) build --release --manifest-path backend/services/valuations/Cargo.toml || true; \
	fi
	if [ -f backend/services/gis_worker/Cargo.toml ]; then \
		$(CARGO) build --release --manifest-path backend/services/gis_worker/Cargo.toml || true; \
	fi

build-images: ## Build Docker images (API, workers, web-shell) - best-effort
	if [ -d backend/api ]; then $(DOCKER) build -t terrafusion/api:dev backend/api || true; fi
	if [ -d backend/services/valuations ]; then $(DOCKER) build -t terrafusion/valuation-worker:dev backend/services/valuations || true; fi
	if [ -d backend/services/gis_worker ]; then $(DOCKER) build -t terrafusion/gis-worker:dev backend/services/gis_worker || true; fi
	if [ -d apps/web-shell ]; then $(DOCKER) build -t terrafusion/web-shell:dev apps/web-shell || true; fi

migrate: ## Run DB migrations inside compose
	$(COMPOSE) -f docker-compose.dev.yml run --rm api dotnet ./publish/TerraFusion.API.dll --migrate || true

seed: ## Seed baseline data (RBAC, tenants, sample parcels)
	$(COMPOSE) -f docker-compose.dev.yml run --rm api dotnet ./publish/TerraFusion.API.dll --seed || true

up: ## Start full dev stack
	$(COMPOSE) -f docker-compose.dev.yml up -d

down: ## Stop dev stack
	$(COMPOSE) -f docker-compose.dev.yml down -v

logs: ## Tail logs
	$(COMPOSE) -f docker-compose.dev.yml logs -f --tail=200

test: ## Run unit/integration tests (dotnet + cargo)
	if command -v $(DOTNET) >/dev/null 2>&1; then $(DOTNET) test backend --logger "trx;LogFileName=TestResults.trx" || true; fi
	if command -v $(CARGO) >/dev/null 2>&1; then $(CARGO) test --all --release || true; fi

perf-smoke: ## k6 smoke test against API
	k6 run ops/k6/smoke.js || true

clean: ## Remove local build artifacts
	rm -rf backend/api/publish target .data || true
