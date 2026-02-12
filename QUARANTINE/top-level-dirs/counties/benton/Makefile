SHELL := /bin/bash
COUNTY := benton
COMPOSE := docker-compose.county.yml
ENV := ./.env

.DEFAULT_GOAL := help

help:
	@echo "Benton County:"
	@echo "  make up / down / logs / ps"
	@echo "  make migrate / seed / test"
	@echo "  make backup / restore / clean"
	@echo "  make viz / pacs-inventory (docs tooling)"

check:
	@test -f $(ENV) || (echo "Missing $(ENV). Copy .env.example → .env"; exit 1)

up: check
	docker compose -f $(COMPOSE) up -d
	@echo "API: http://localhost:5000/health"

down:
	docker compose -f $(COMPOSE) down

logs:
	docker compose -f $(COMPOSE) logs -f

ps:
	docker compose -f $(COMPOSE) ps

# ---- migrations (EF Core) ----
migrate:
	@echo "[migrate] Running EF Core migrations..."
	docker compose -f $(COMPOSE) exec -T api dotnet ef database update --project TerraFusion.Data --no-build || echo "Migration failed - check if API is running"

seed:
	@echo "[seed] Seeding database..."
	docker compose -f $(COMPOSE) exec -T api dotnet run --project TerraFusion.Data --no-build -- seed || echo "Seed failed - implement seed command in TerraFusion.Data"

test:
	@echo "[test] Running smoke tests..."
	docker compose -f $(COMPOSE) exec -T api bash -c "curl -fsS http://localhost:5000/health && echo ' [✓] Health check passed' || (echo ' [✗] Health check failed' && exit 1)"
	@echo "[test] All smoke tests passed"

# ---- db ops ----
BACKUP_DIR := ./backups
TIMESTAMP  := $(shell date +%Y%m%d_%H%M%S)

backup:
	mkdir -p $(BACKUP_DIR)
	docker compose -f $(COMPOSE) exec -T postgres pg_dump -U $$(grep ^DB_USER $(ENV)|cut -d= -f2) $$(grep ^DB_NAME $(ENV)|cut -d= -f2) > $(BACKUP_DIR)/benton_$(TIMESTAMP).sql
	@echo "Backup → $(BACKUP_DIR)/benton_$(TIMESTAMP).sql"

restore:
	@LATEST=$$(ls -t ./backups/*.sql | head -1); \
	echo "Restoring $$LATEST..."; \
	cat $$LATEST | docker compose -f $(COMPOSE) exec -T postgres psql -U $$(grep ^DB_USER $(ENV)|cut -d= -f2) $$(grep ^DB_NAME $(ENV)|cut -d= -f2)

clean:
	docker compose -f $(COMPOSE) down -v --remove-orphans
	rm -rf ./backups/* || true

# ---- twin ops (fill real commands for your hypervisor/DBA flow) ----
TWIN_HOST ?= TF-BENTON-PACS-CLONE
TWIN_SQL  ?= $(TWIN_HOST)
TWIN_SA   ?= sa
TWIN_SA_PW ?= "ChangeMe!"
TWIN_DB   ?= PACS

twin-ping:
	@ping -c 1 $(TWIN_HOST) >/dev/null 2>&1 && echo "OK: $(TWIN_HOST)" || (echo "No ping"; exit 1)

twin-sql-ready:
	@/bin/true # replace with sqlcmd/Invoke-Sqlcmd check in your env

twin-verify-surface:
	@echo "Run scripts/sql/verify_surface.sql against twin (wire driver in CI/ops tool)"

# ---- docs rendering ----
MERMAID_CLI ?= npx -y @mermaid-js/mermaid-cli@10
OUT := ./_artifacts

viz:
	mkdir -p $(OUT)
	$(MERMAID_CLI) -i docs/diagrams/erd.mmd -o $(OUT)/erd.svg || true
	$(MERMAID_CLI) -i docs/diagrams/crossdb.mmd -o $(OUT)/crossdb.svg || true
	$(MERMAID_CLI) -i docs/diagrams/wcf.mmd -o $(OUT)/wcf.svg || true
	$(MERMAID_CLI) -i docs/diagrams/recalc_flow.mmd -o $(OUT)/recalc_flow.svg || true
	$(MERMAID_CLI) -i docs/diagrams/trigger_cascade.mmd -o $(OUT)/trigger_cascade.svg || true
	@echo "Diagrams → $(OUT)"

pacs-inventory:
	@echo "Provide scripts/sql/pacs_inventory.sh if you want live counts"

# ---- production release ----
release-compose:
	@echo "Generating compose.prod.yml with image tags..."
	@GIT_TAG=$$(git rev-parse --short HEAD 2>/dev/null || echo "local"); \
	cat docker-compose.county.yml | sed 's|build:|# build:|g' | sed "s|context: ../../backend|image: ghcr.io/bsvalues/terrafusion_os_1.0/tf-api:benton-$$GIT_TAG|g" | sed "s|context: ../../frontend|image: ghcr.io/bsvalues/terrafusion_os_1.0/tf-frontend:benton-$$GIT_TAG|g" > compose.prod.yml; \
	echo "Created compose.prod.yml with tag: $$GIT_TAG"
