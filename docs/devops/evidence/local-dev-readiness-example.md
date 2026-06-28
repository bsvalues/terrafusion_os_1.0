# Local Dev Readiness Example

This example shows the expected evidence shape. It is illustrative; it is not proof that the current
machine passed all checks.

```text
DATE_TIME: 2026-06-27T00:00:00Z example
OPERATOR_OR_AGENT: example-agent
REPO: bsvalues/terrafusion_os_1.0
WORKTREE: C:\Users\<user>\.codex-worktrees\example-local-platform
BRANCH: wo/example-local-platform
HEAD: example-sha
WORKTREE_STATUS: clean

READINESS_SCRIPT_COMMAND:
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/readiness.ps1

READINESS_SCRIPT_RESULT:
example only; run the command in the active worktree for real evidence

DOCKER_COMPOSE_CONFIG_COMMAND:
docker compose -f docker/dev/compose.yaml --env-file docker/dev/.env.example config

DOCKER_COMPOSE_CONFIG_RESULT:
example only; record PASS, WARN, FAIL, or unavailable from the active machine

AZURE_CLI_STATE: example only
AZURE_DEVOPS_EXTENSION_STATE: example only
PACKAGE_GOVERNANCE_STATE: example only
KNOWN_WARNINGS: example only
KNOWN_BLOCKERS: example only
OPERATOR_ACTION_REQUIRED: example only

RUNTIME_CODE_CHANGED: no
PIPELINE_YAML_CHANGED: no
GITHUB_WORKFLOWS_CHANGED: no
DOCKER_CHANGED: no
HELM_OR_K8S_CHANGED: no
SECRETS_TOUCHED: no
COUNTY_DATA_TOUCHED: no
PACS_OR_SQL_TOUCHED: no
```
