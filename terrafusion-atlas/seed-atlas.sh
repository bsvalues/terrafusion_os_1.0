#!/bin/bash
# Auto-generated Atlas seed commands
# Generated from: ../repo-map-out/inventory.json

set -e

ATLAS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ATLAS_ROOT"

# AGENTS (549 items)
python3 scripts/atlas_seed.py agents \
  --id "agent." \
  --name ".ai" \
  --owner "ai-team" \
  --source_path ".ai" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.claude-flow" \
  --name "claude-flow" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.config" \
  --name "config" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/config" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.core" \
  --name "core" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/core" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.devops" \
  --name "devops" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/devops" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.scripts" \
  --name "scripts" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/scripts" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.src" \
  --name "src" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/src" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.core" \
  --name "core" \
  --owner "ai-team" \
  --source_path ".ai/core" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent.mcp" \
  --name "mcp" \
  --owner "ai-team" \
  --source_path ".ai/mcp" \
  --tags "ai"

python3 scripts/atlas_seed.py agents \
  --id "agent." \
  --name ".claude" \
  --owner "platform-team" \
  --source_path ".claude"


# BRANDS (151 items)
python3 scripts/atlas_seed.py brands \
  --id "brands." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py brands \
  --id "brands." \
  --name ".playwright-mcp" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.playwright-mcp"

python3 scripts/atlas_seed.py brands \
  --id "brands.brand-assets" \
  --name "Brand_Assets" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets"

python3 scripts/atlas_seed.py brands \
  --id "brands.complete-assets" \
  --name "Complete_Assets" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/Complete_Assets"

python3 scripts/atlas_seed.py brands \
  --id "brands.brand" \
  --name "brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/brand"

python3 scripts/atlas_seed.py brands \
  --id "brands.more-brand" \
  --name "more brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/more brand"

python3 scripts/atlas_seed.py brands \
  --id "brands.full-backup-20250915-062012" \
  --name "FULL_BACKUP_20250915_062012" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012"

python3 scripts/atlas_seed.py brands \
  --id "brands.audit-20250913-185959" \
  --name "AUDIT_20250913_185959" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/ai-workspace-companion/AUDIT_20250913_185959" \
  --tags "ai"

python3 scripts/atlas_seed.py brands \
  --id "brands.apps" \
  --name "apps" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/apps"

python3 scripts/atlas_seed.py brands \
  --id "brands.css" \
  --name "css" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/apps/css"


# COMPLIANCE (295 items)
python3 scripts/atlas_seed.py compliance \
  --id "compliance." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py compliance \
  --id "compliance." \
  --name ".github" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.issue-template" \
  --name "ISSUE_TEMPLATE" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github/ISSUE_TEMPLATE"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.workflows" \
  --name "workflows" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github/workflows"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.brand-assets" \
  --name "Brand_Assets" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.full-backup-20250915-062012" \
  --name "FULL_BACKUP_20250915_062012" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.ai-workspace-companion" \
  --name "ai-workspace-companion" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/ai-workspace-companion" \
  --tags "ai"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.audit-20250913-185959" \
  --name "AUDIT_20250913_185959" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/ai-workspace-companion/AUDIT_20250913_185959" \
  --tags "ai"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.trust-fabric" \
  --name "trust-fabric" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/architecture/trust-fabric"

python3 scripts/atlas_seed.py compliance \
  --id "compliance.authorization" \
  --name "authorization" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/authorization"


# COMPONENTS (115 items)
python3 scripts/atlas_seed.py components \
  --id "components." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py components \
  --id "components.sdk" \
  --name "SDK" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/SDK"

python3 scripts/atlas_seed.py components \
  --id "components.scripts" \
  --name "scripts" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/SDK/scripts"

python3 scripts/atlas_seed.py components \
  --id "components.terrafusion-golden-everything-plus-20250917-181254" \
  --name "TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254"

python3 scripts/atlas_seed.py components \
  --id "components.sdks" \
  --name "sdks" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254/sdks"

python3 scripts/atlas_seed.py components \
  --id "components.ai-swarm-venv" \
  --name "ai-swarm-venv" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/ai-swarm-venv" \
  --tags "ai"

python3 scripts/atlas_seed.py components \
  --id "components.backend" \
  --name "backend" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/backend"

python3 scripts/atlas_seed.py components \
  --id "components.ai-swarm" \
  --name "ai-swarm" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/backend/ai-swarm" \
  --tags "ai"

python3 scripts/atlas_seed.py components \
  --id "components.utils" \
  --name "utils" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/backend/utils"

python3 scripts/atlas_seed.py components \
  --id "components.config" \
  --name "config" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/config"


# DATASETS (369 items)
python3 scripts/atlas_seed.py datasets \
  --id "data." \
  --name ".data" \
  --owner "data-team" \
  --source_path ".data"

python3 scripts/atlas_seed.py datasets \
  --id "data.nats" \
  --name "nats" \
  --owner "data-team" \
  --source_path ".data/nats"

python3 scripts/atlas_seed.py datasets \
  --id "data.postgres" \
  --name "postgres" \
  --owner "data-team" \
  --source_path ".data/postgres" \
  --tags "os"

python3 scripts/atlas_seed.py datasets \
  --id "data.redis" \
  --name "redis" \
  --owner "data-team" \
  --source_path ".data/redis"

python3 scripts/atlas_seed.py datasets \
  --id "data." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py datasets \
  --id "data." \
  --name ".schemas" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.schemas"

python3 scripts/atlas_seed.py datasets \
  --id "data.full-backup-20250915-062012" \
  --name "FULL_BACKUP_20250915_062012" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012"

python3 scripts/atlas_seed.py datasets \
  --id "data.platform-empire-planning" \
  --name "PLATFORM_EMPIRE_PLANNING" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/PLATFORM_EMPIRE_PLANNING"

python3 scripts/atlas_seed.py datasets \
  --id "data.modules-backup-20250912-093232" \
  --name "modules_backup_20250912_093232" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/modules_backup_20250912_093232"

python3 scripts/atlas_seed.py datasets \
  --id "data.registry" \
  --name "registry" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/registry" \
  --tags "gis"


# DEPLOYMENTS (233 items)
python3 scripts/atlas_seed.py deployments \
  --id "deployments." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.terrafusion-golden-everything-plus-20250917-181254" \
  --name "TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.ci" \
  --name "ci" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254/ci"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.helm" \
  --name "helm" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254/helm"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.terrafusion-golden-helmfile-redis-grafana-20250917-181613" \
  --name "TerraFusion_Golden_Helmfile_Redis_Grafana_20250917_181613" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Helmfile_Redis_Grafana_20250917_181613"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.grafana-dashboards" \
  --name "grafana_dashboards" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Helmfile_Redis_Grafana_20250917_181613/grafana_dashboards"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.helmfile" \
  --name "helmfile" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Helmfile_Redis_Grafana_20250917_181613/helmfile"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.service-redis-quota" \
  --name "service_redis_quota" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Helmfile_Redis_Grafana_20250917_181613/service_redis_quota"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.deployment-authorization" \
  --name "deployment-authorization" \
  --owner "ops-team" \
  --source_path ".git-temp-clone/authorization/deployment-authorization"

python3 scripts/atlas_seed.py deployments \
  --id "deployments.bcw-uat" \
  --name "bcw-uat" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/bcw-uat"


# ENGINES (128 items)
python3 scripts/atlas_seed.py engines \
  --id "engine.grfe-rust-workspace" \
  --name "grfe_rust_workspace" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Full_Stack_20250917_180937/grfe_rust_workspace"

python3 scripts/atlas_seed.py engines \
  --id "engine.trust-fabric" \
  --name "trust-fabric" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/architecture/trust-fabric"

python3 scripts/atlas_seed.py engines \
  --id "engine.performance" \
  --name "performance" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/backend/performance"

python3 scripts/atlas_seed.py engines \
  --id "engine.quantum-performance" \
  --name "quantum-performance" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/backend/quantum-performance"

python3 scripts/atlas_seed.py engines \
  --id "engine.performance" \
  --name "performance" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/docs/performance"

python3 scripts/atlas_seed.py engines \
  --id "engine.grfe-rust-workspace-production-plus" \
  --name "grfe_rust_workspace_production_plus" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/grfe_rust_workspace_production_plus"

python3 scripts/atlas_seed.py engines \
  --id "engine." \
  --name ".github" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/grfe_rust_workspace_production_plus/.github"

python3 scripts/atlas_seed.py engines \
  --id "engine.crates" \
  --name "crates" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/grfe_rust_workspace_production_plus/crates"

python3 scripts/atlas_seed.py engines \
  --id "engine.deploy" \
  --name "deploy" \
  --owner "ops-team" \
  --source_path ".git-temp-clone/grfe_rust_workspace_production_plus/deploy"

python3 scripts/atlas_seed.py engines \
  --id "engine.examples" \
  --name "examples" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/grfe_rust_workspace_production_plus/examples"


# ENVIRONMENTS (132 items)
python3 scripts/atlas_seed.py environments \
  --id "environments." \
  --name ".ci_artifacts_local" \
  --owner "platform-team" \
  --source_path ".ci_artifacts_local"

python3 scripts/atlas_seed.py environments \
  --id "environments." \
  --name ".devcontainer" \
  --owner "ai-team" \
  --source_path ".devcontainer" \
  --tags "ai"

python3 scripts/atlas_seed.py environments \
  --id "environments." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py environments \
  --id "environments." \
  --name ".devcontainer" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/.devcontainer" \
  --tags "ai"

python3 scripts/atlas_seed.py environments \
  --id "environments." \
  --name ".github" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github"

python3 scripts/atlas_seed.py environments \
  --id "environments.environments" \
  --name "environments" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github/environments"

python3 scripts/atlas_seed.py environments \
  --id "environments.ai-agent-development-environment" \
  --name "AI_AGENT_DEVELOPMENT_ENVIRONMENT" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/AI_AGENT_DEVELOPMENT_ENVIRONMENT" \
  --tags "ai"

python3 scripts/atlas_seed.py environments \
  --id "environments.terrafusion-ultimate-standalone-package" \
  --name "TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE"

python3 scripts/atlas_seed.py environments \
  --id "environments.docker" \
  --name "Docker" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE/Docker"

python3 scripts/atlas_seed.py environments \
  --id "environments.grfe-rust-workspace" \
  --name "grfe_rust_workspace" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Full_Stack_20250917_180937/grfe_rust_workspace"


# FRONTENDS (480 items)
python3 scripts/atlas_seed.py frontends \
  --id "frontends.claude-flow" \
  --name "claude-flow" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow" \
  --tags "ai"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.claude-flow" \
  --name "claude-flow" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/.ai/claude-flow" \
  --tags "ai"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.complete-test-suite" \
  --name "COMPLETE_TEST_SUITE" \
  --owner "frontend-team" \
  --source_path ".git-temp-clone/COMPLETE_TEST_SUITE"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.modules-backup-20250912-093232" \
  --name "modules_backup_20250912_093232" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/modules_backup_20250912_093232"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.02-marketplace-strategy" \
  --name "02_MARKETPLACE_STRATEGY" \
  --owner "marketplace-team" \
  --source_path ".git-temp-clone/PLATFORM_EMPIRE_PLANNING/02_MARKETPLACE_STRATEGY" \
  --tags "marketplace"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.pluginmarketplacelauncher" \
  --name "PluginMarketplaceLauncher" \
  --owner "marketplace-team" \
  --source_path ".git-temp-clone/TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE/PluginMarketplaceLauncher" \
  --tags "marketplace"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.ai-workspace-companion" \
  --name "ai-workspace-companion" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/ai-workspace-companion" \
  --tags "ai"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.audit-20250913-185959" \
  --name "AUDIT_20250913_185959" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/ai-workspace-companion/AUDIT_20250913_185959" \
  --tags "ai"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.desktop-electron" \
  --name "desktop-electron" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/apps/desktop-electron"

python3 scripts/atlas_seed.py frontends \
  --id "frontends.gui" \
  --name "gui" \
  --owner "frontend-team" \
  --source_path ".git-temp-clone/apps/gui"


# MODULES (445 items)
python3 scripts/atlas_seed.py modules \
  --id "module." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py modules \
  --id "module.brand-assets" \
  --name "Brand_Assets" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets"

python3 scripts/atlas_seed.py modules \
  --id "module.brand" \
  --name "brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/brand"

python3 scripts/atlas_seed.py modules \
  --id "module.more-brand" \
  --name "more brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/more brand"

python3 scripts/atlas_seed.py modules \
  --id "module.modules-backup-20250912-093232" \
  --name "modules_backup_20250912_093232" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/modules_backup_20250912_093232"

python3 scripts/atlas_seed.py modules \
  --id "module.pluginmarketplacelauncher" \
  --name "PluginMarketplaceLauncher" \
  --owner "marketplace-team" \
  --source_path ".git-temp-clone/TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE/PluginMarketplaceLauncher" \
  --tags "marketplace"

python3 scripts/atlas_seed.py modules \
  --id "module.grfe-rust-workspace" \
  --name "grfe_rust_workspace" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Full_Stack_20250917_180937/grfe_rust_workspace"

python3 scripts/atlas_seed.py modules \
  --id "module.apps" \
  --name "apps" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/apps"

python3 scripts/atlas_seed.py modules \
  --id "module.css" \
  --name "css" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/apps/css"

python3 scripts/atlas_seed.py modules \
  --id "module.desktop-electron" \
  --name "desktop-electron" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/apps/desktop-electron"


# PARTNERS (254 items)
python3 scripts/atlas_seed.py partners \
  --id "partners.core" \
  --name "core" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/core" \
  --tags "ai"

python3 scripts/atlas_seed.py partners \
  --id "partners.scripts" \
  --name "scripts" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/scripts" \
  --tags "ai"

python3 scripts/atlas_seed.py partners \
  --id "partners.core" \
  --name "core" \
  --owner "ai-team" \
  --source_path ".ai/core" \
  --tags "ai"

python3 scripts/atlas_seed.py partners \
  --id "partners." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py partners \
  --id "partners.core" \
  --name "core" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/.ai/core" \
  --tags "ai"

python3 scripts/atlas_seed.py partners \
  --id "partners.workflows" \
  --name "workflows" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github/workflows"

python3 scripts/atlas_seed.py partners \
  --id "partners.brand-assets" \
  --name "Brand_Assets" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets"

python3 scripts/atlas_seed.py partners \
  --id "partners.brand" \
  --name "brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/brand"

python3 scripts/atlas_seed.py partners \
  --id "partners.more-brand" \
  --name "more brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/more brand"

python3 scripts/atlas_seed.py partners \
  --id "partners.04-competitive-strategy" \
  --name "04_COMPETITIVE_STRATEGY" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/PLATFORM_EMPIRE_PLANNING/04_COMPETITIVE_STRATEGY"


# PIPELINES (384 items)
python3 scripts/atlas_seed.py pipelines \
  --id "pipelines.scripts" \
  --name "scripts" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow/scripts" \
  --tags "ai"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines." \
  --name ".ci_artifacts_local" \
  --owner "platform-team" \
  --source_path ".ci_artifacts_local"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines." \
  --name ".ci_test_results" \
  --owner "platform-team" \
  --source_path ".ci_test_results"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines." \
  --name ".ci" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.ci"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines.workflows" \
  --name "workflows" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github/workflows"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines.scripts" \
  --name "scripts" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/SDK/scripts"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines.terrafusion-clean-migration-script---consolidate-everything" \
  --name "TerraFusion Clean Migration Script - Consolidate Everything" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion Clean Migration Script - Consolidate Everything"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines.ci" \
  --name "ci" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254/ci"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines.deployment-authorization" \
  --name "deployment-authorization" \
  --owner "ops-team" \
  --source_path ".git-temp-clone/authorization/deployment-authorization"

python3 scripts/atlas_seed.py pipelines \
  --id "pipelines.consciousness" \
  --name "consciousness" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/backend/consciousness"


# RELEASES (569 items)
python3 scripts/atlas_seed.py releases \
  --id "releases.claude-flow" \
  --name "claude-flow" \
  --owner "ai-team" \
  --source_path ".ai/claude-flow" \
  --tags "ai"

python3 scripts/atlas_seed.py releases \
  --id "releases." \
  --name ".git-temp-clone" \
  --owner "platform-team" \
  --source_path ".git-temp-clone"

python3 scripts/atlas_seed.py releases \
  --id "releases.claude-flow" \
  --name "claude-flow" \
  --owner "ai-team" \
  --source_path ".git-temp-clone/.ai/claude-flow" \
  --tags "ai"

python3 scripts/atlas_seed.py releases \
  --id "releases.workflows" \
  --name "workflows" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/.github/workflows"

python3 scripts/atlas_seed.py releases \
  --id "releases.full-backup-20250915-062012" \
  --name "FULL_BACKUP_20250915_062012" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012"

python3 scripts/atlas_seed.py releases \
  --id "releases.platform-empire-planning" \
  --name "PLATFORM_EMPIRE_PLANNING" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/PLATFORM_EMPIRE_PLANNING"

python3 scripts/atlas_seed.py releases \
  --id "releases.modules-backup-20250912-093232" \
  --name "modules_backup_20250912_093232" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/modules_backup_20250912_093232"

python3 scripts/atlas_seed.py releases \
  --id "releases.registry" \
  --name "registry" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/registry" \
  --tags "gis"

python3 scripts/atlas_seed.py releases \
  --id "releases.terrafusion-ops" \
  --name "terrafusion-ops" \
  --owner "ops-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/terrafusion-ops"

python3 scripts/atlas_seed.py releases \
  --id "releases.terrafusion-swarm" \
  --name "terrafusion-swarm" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/FULL_BACKUP_20250915_062012/terrafusion-swarm"


# SERVICES (374 items)
python3 scripts/atlas_seed.py services \
  --id "services.brand-assets" \
  --name "Brand_Assets" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets"

python3 scripts/atlas_seed.py services \
  --id "services.brand" \
  --name "brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/brand"

python3 scripts/atlas_seed.py services \
  --id "services.more-brand" \
  --name "more brand" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/Brand_Assets/more brand"

python3 scripts/atlas_seed.py services \
  --id "services.service-overlays" \
  --name "service_overlays" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_EVERYTHING_PLUS_20250917_181254/service_overlays"

python3 scripts/atlas_seed.py services \
  --id "services.service-redis-quota" \
  --name "service_redis_quota" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/TerraFusion_Golden_Helmfile_Redis_Grafana_20250917_181613/service_redis_quota"

python3 scripts/atlas_seed.py services \
  --id "services.backend" \
  --name "backend" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/architecture/backend"

python3 scripts/atlas_seed.py services \
  --id "services.authorization" \
  --name "authorization" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/authorization"

python3 scripts/atlas_seed.py services \
  --id "services.deployment-authorization" \
  --name "deployment-authorization" \
  --owner "ops-team" \
  --source_path ".git-temp-clone/authorization/deployment-authorization"

python3 scripts/atlas_seed.py services \
  --id "services.government-approvals" \
  --name "government-approvals" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/authorization/government-approvals"

python3 scripts/atlas_seed.py services \
  --id "services.security-clearances" \
  --name "security-clearances" \
  --owner "platform-team" \
  --source_path ".git-temp-clone/authorization/security-clearances"

