# DevOps Agent Handoff Template

Use this template when handing local-platform, onboarding, Docker-dev, or DevOps documentation work
to another agent. Fill it with facts from the current branch, not assumptions.

```text
WORK_ORDER:
REPO:
WORKTREE:
BRANCH:
HEAD:
OBJECTIVE:

ALLOWED_FILES:

FORBIDDEN_FILES:

VALIDATION_COMMANDS:

FILES_CHANGED:
RUNTIME_CODE_CHANGED:
PIPELINE_YAML_CHANGED:
GITHUB_WORKFLOWS_CHANGED:
DOCKER_CHANGED:
HELM_OR_K8S_CHANGED:
SECRETS_TOUCHED:
COUNTY_DATA_TOUCHED:
PACS_OR_SQL_TOUCHED:

PR:
CHECKS:
STOP_TYPE:
NEXT_RECOMMENDED_WO:
```

## Required Handoff Notes

- State whether the shared root checkout is clean, dirty, conflicted, or intentionally untouched.
- State the exact worktree path and branch used for the work order.
- List any local-only residue that was not committed.
- List validation commands that were run and any commands intentionally skipped.
- Record whether Docker validation used `docker/dev/compose.yaml` only.
- Record whether any future step needs human authorization.

## Non-Authorizations

A handoff does not authorize:

- merge, release, tag, or deployment
- production Docker, Helm, or Kubernetes changes
- service connections, Key Vault, or cloud resources
- secrets, PACS, county SQL, or county data
- dirty shared checkout cleanup
- package upgrades or lockfile rewrites outside an approved work order
