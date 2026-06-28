# Local Dev Evidence Template

Use this template to record local development readiness evidence. This is not release evidence and
does not authorize production deployment.

```text
DATE_TIME:
OPERATOR_OR_AGENT:
REPO:
WORKTREE:
BRANCH:
HEAD:
WORKTREE_STATUS:

READINESS_SCRIPT_COMMAND:
READINESS_SCRIPT_RESULT:
READINESS_SCRIPT_NOTES:

DOCKER_COMPOSE_CONFIG_COMMAND:
DOCKER_COMPOSE_CONFIG_RESULT:
DOCKER_COMPOSE_CONFIG_NOTES:

AZURE_CLI_STATE:
AZURE_DEVOPS_EXTENSION_STATE:

PACKAGE_GOVERNANCE_STATE:
KNOWN_WARNINGS:
KNOWN_BLOCKERS:
OPERATOR_ACTION_REQUIRED:

RUNTIME_CODE_CHANGED:
PIPELINE_YAML_CHANGED:
GITHUB_WORKFLOWS_CHANGED:
DOCKER_CHANGED:
HELM_OR_K8S_CHANGED:
SECRETS_TOUCHED:
COUNTY_DATA_TOUCHED:
PACS_OR_SQL_TOUCHED:
```

## Evidence Rules

- Do not paste secrets or connection strings.
- Do not include county data or PACS/SQL output.
- Distinguish local-dev proof from production readiness.
- Record skipped commands honestly.
- If Docker is unavailable locally, record that as local environment state rather than a repo defect.
