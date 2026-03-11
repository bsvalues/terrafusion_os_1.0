# GitHub Automation and Templates

This directory holds the repository's GitHub-facing automation, templates, and
maintainer documentation.

## Verified Repository State

Verified on 2026-03-11 via GitHub API:

- Default branch: `main`
- Visibility: private
- Issues: enabled
- Projects: enabled
- Discussions: disabled
- Wiki: disabled
- Allow forking: enabled by GitHub for this personal-account repository

## What This Directory Controls

- `workflows/`: CI, governance gates, release, rollback, and verification lanes
- `ISSUE_TEMPLATE/`: issue intake forms and contact links
- `pull_request_template.md`: PR evidence and verification structure
- `SECURITY.md`: security reporting rules
- `branch-protection.md`: human-readable branch-protection canon
- `QUICK_START.md`: maintainer quick-start commands
- `REPOSITORY_SETUP.md`: current repo/settings checklist

## Required Checks on `main`

The protected branch currently requires:

- `governed-spine`
- `phase85-tools`
- `phase86-toolrunner`
- `🔒 TerraFusion Seal Gate`
- `🧪 Tier-1 UI Harness Validation`

Source of truth:

- [AGENTS.md](../AGENTS.md)
- [branch-protection.md](./branch-protection.md)
- [../.governance/main.protection.json](../.governance/main.protection.json)

## Release and Rollback Workflows

Current operator-facing workflows:

| Workflow | Purpose |
| --- | --- |
| `release-lane.yml` | Deploy a specific SHA to `staging` or `production` |
| `rollback-staging.yml` | Roll staging back to `previous.sha` |
| `rollback-production.yml` | Roll production back to `previous.sha` |
| `seal-gate-fast.yml` | Required aggregate governance/status gate |
| `tier1-ui-harness.yml` | Required Tier-1 UI verification lane |

Current release-lane truth and blockers live in:

- [hostinger-control-plane.md](../os-platform/core/pilot/ops/hostinger-control-plane.md)

## Templates and Community UX

GitHub currently uses:

- structured bug, feature, and security issue templates
- a PR template centered on verification evidence
- contact links instead of Discussions/Wiki links

Because Discussions and Wiki are disabled, template links should point to
versioned repo docs rather than dead GitHub surfaces.

## Maintenance Rule

If you change the workflow contract, branch protection, or deployment process,
update the matching docs in this directory in the same PR. The point of these
files is to reduce operator ambiguity, not create another stale layer.
