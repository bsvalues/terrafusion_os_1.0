# Benton County PACS - Living Documentation & Verification
# Usage: make <target>
# Prerequisites: Node.js, sqlcmd, jq, PowerShell

MERMAID_CLI ?= npx -y @mermaid-js/mermaid-cli@10
OUT := ./_artifacts
DOCS := ./docs/diagrams

# SQL Server connection defaults (override with environment variables)
PACS_SERVER ?= localhost,1433
PACS_DB ?= pacs_oltp
PACS_USER ?= sa
PACS_PW ?= P@ssw0rd123!

# Training database for twin verification
TWIN_DB ?= pacs_training
TWIN_SQL ?= $(PACS_SERVER)
TWIN_SA ?= $(PACS_USER)
TWIN_SA_PW ?= $(PACS_PW)

.PHONY: help
help: ## Show this help message
	@echo "Benton County PACS - Documentation Automation"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'

.PHONY: viz
viz: ## Render Mermaid diagrams to SVG/PNG
	@echo "🎨 Rendering Mermaid diagrams..."
	@if ! command -v npx > /dev/null; then \
		echo "❌ Error: Node.js/npx not found. Install from https://nodejs.org/"; \
		exit 1; \
	fi
	@mkdir -p $(OUT)
	$(MERMAID_CLI) -i $(DOCS)/erd.mmd -o $(OUT)/erd.svg
	$(MERMAID_CLI) -i $(DOCS)/crossdb.mmd -o $(OUT)/crossdb.svg
	$(MERMAID_CLI) -i $(DOCS)/wcf.mmd -o $(OUT)/wcf.svg
	$(MERMAID_CLI) -i $(DOCS)/recalc_flow.mmd -o $(OUT)/recalc_flow.svg
	$(MERMAID_CLI) -i $(DOCS)/trigger_cascade.mmd -o $(OUT)/trigger_cascade.svg
	@echo "✅ Diagrams updated in $(OUT)/"
	@echo "   - erd.svg (Core Database ERD)"
	@echo "   - crossdb.svg (Cross-Database Integration)"
	@echo "   - wcf.svg (WCF Service Architecture)"
	@echo "   - recalc_flow.svg (Property Recalculation Flow)"
	@echo "   - trigger_cascade.svg (Trigger Cascade Analysis)"

.PHONY: viz-png
viz-png: ## Render Mermaid diagrams to PNG (high-res)
	@echo "🎨 Rendering Mermaid diagrams to PNG..."
	@mkdir -p $(OUT)
	$(MERMAID_CLI) -i $(DOCS)/erd.mmd -o $(OUT)/erd.png -w 2400 -H 1800
	$(MERMAID_CLI) -i $(DOCS)/crossdb.mmd -o $(OUT)/crossdb.png -w 2400 -H 1800
	$(MERMAID_CLI) -i $(DOCS)/wcf.mmd -o $(OUT)/wcf.png -w 2400 -H 1800
	$(MERMAID_CLI) -i $(DOCS)/recalc_flow.mmd -o $(OUT)/recalc_flow.png -w 2400 -H 1800
	$(MERMAID_CLI) -i $(DOCS)/trigger_cascade.mmd -o $(OUT)/trigger_cascade.png -w 2400 -H 1800
	@echo "✅ PNG diagrams created in $(OUT)/"

.PHONY: pacs-inventory
pacs-inventory: ## Generate live object counts from SQL Server
	@echo "📊 Querying pacs_oltp database inventory..."
	@if ! command -v sqlcmd > /dev/null; then \
		echo "❌ Error: sqlcmd not found. Install SQL Server Command Line Tools."; \
		exit 1; \
	fi
	@pwsh ./scripts/sql/pacs_inventory.ps1 -Server "$(PACS_SERVER)" -Database "$(PACS_DB)" -Username "$(PACS_USER)" -Password "$(PACS_PW)" -OutputPath "$(OUT)/pacs_inventory.json"
	@if command -v jq > /dev/null; then \
		echo ""; \
		echo "Summary:"; \
		jq '.summary' $(OUT)/pacs_inventory.json; \
	else \
		echo "💡 Install jq for formatted JSON output: https://stedolan.github.io/jq/"; \
		cat $(OUT)/pacs_inventory.json; \
	fi

.PHONY: twin-verify-surface
twin-verify-surface: ## Verify key database objects exist (surface verification)
	@echo "🔍 Verifying database surface integrity..."
	@sqlcmd -S "$(TWIN_SQL)" -U "$(TWIN_SA)" -P "$(TWIN_SA_PW)" -d "$(TWIN_DB)" -i ./scripts/sql/verify_surface.sql
	@echo "✅ Surface verification passed"

.PHONY: twin-trigger-profile
twin-trigger-profile: ## Capture trigger inventory from pacs_oltp
	@echo "🔍 Profiling triggers on pacs_oltp..."
	@sqlcmd -S "$(PACS_SERVER)" -U "$(PACS_USER)" -P "$(PACS_PW)" -d "$(PACS_DB)" -W -h-1 -s"|" -Q "SET NOCOUNT ON; SELECT DB_NAME() AS dbname, t.name AS trigger_name, OBJECT_NAME(t.parent_id) AS table_name FROM sys.triggers t WHERE t.parent_id <> 0 ORDER BY table_name, trigger_name;" > $(OUT)/trigger_profile.txt
	@echo "✅ Trigger profile saved to $(OUT)/trigger_profile.txt"
	@echo ""
	@head -n 20 $(OUT)/trigger_profile.txt

.PHONY: all-checks
all-checks: pacs-inventory twin-verify-surface twin-trigger-profile ## Run all verification checks
	@echo ""
	@echo "✅ All checks complete. Artifacts in $(OUT)/"

.PHONY: clean
clean: ## Remove generated artifacts
	@echo "🧹 Cleaning generated artifacts..."
	@rm -rf $(OUT)
	@echo "✅ Clean complete"

.PHONY: validate-mermaid
validate-mermaid: ## Validate Mermaid syntax (dry-run)
	@echo "🔍 Validating Mermaid diagram syntax..."
	@$(MERMAID_CLI) -i $(DOCS)/erd.mmd -o /dev/null 2>&1 && echo "✅ erd.mmd OK" || echo "❌ erd.mmd FAILED"
	@$(MERMAID_CLI) -i $(DOCS)/crossdb.mmd -o /dev/null 2>&1 && echo "✅ crossdb.mmd OK" || echo "❌ crossdb.mmd FAILED"
	@$(MERMAID_CLI) -i $(DOCS)/wcf.mmd -o /dev/null 2>&1 && echo "✅ wcf.mmd OK" || echo "❌ wcf.mmd FAILED"
	@$(MERMAID_CLI) -i $(DOCS)/recalc_flow.mmd -o /dev/null 2>&1 && echo "✅ recalc_flow.mmd OK" || echo "❌ recalc_flow.mmd FAILED"
	@$(MERMAID_CLI) -i $(DOCS)/trigger_cascade.mmd -o /dev/null 2>&1 && echo "✅ trigger_cascade.mmd OK" || echo "❌ trigger_cascade.mmd FAILED"

.DEFAULT_GOAL := help
