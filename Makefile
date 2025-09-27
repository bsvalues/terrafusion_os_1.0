
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
