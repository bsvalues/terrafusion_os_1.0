# WO-WOE-000 - Promote Work Order Operator Pattern

## Status

Draft doctrine packet.

## Goal

Turn the DevOps-proven Work Order Operator pattern into reusable TerraFusion operating doctrine.

This work order does not create a second Brain, a competing queue, autonomous production authority, or
runtime behavior.

## Deliverables

- Skill/operator spec: `docs/brain/agents/work-order-operator.md`
- Agent role definition: Work Order Operator / Orchestrator
- Subagent patterns:
  - Discovery Agent
  - Scope/Evidence Reviewer
  - Implementation Agent
  - Validation Agent
  - Hygiene/Cleanup Agent
  - Stop-Gate Classifier
- Stop-gate rules
- Autonomous continuation rules
- Evidence output format
- Promotion criteria for permanent subagents

## Authority Boundary

Allowed:

- document the reusable operator pattern
- align the pattern with existing Brain/Cortex authority
- define same-risk autonomous continuation
- define true authority walls

Forbidden:

- no runtime code changes
- no CI/CD behavior changes
- no branch protection changes
- no service connections, Key Vault, secrets, credentials, or production resources
- no PACS, county SQL, county data, or protected data access
- no merge-authority expansion beyond explicit work-order authorization
- no second Brain, suite-local queue, or competing autonomous governance system

## Risk Class

R1 - documentation / operator-truth patch.

## Evidence Required

- `git diff --check`
- scope check showing only Work Order Engine doctrine files changed
- no runtime, package, pipeline, workflow, Docker, Helm, Kubernetes, secrets, county, PACS, or SQL changes

## Stop Conditions

Stop if the promotion requires:

- creating a new queue outside Brain/Cortex authority
- changing constitutional authority
- changing runtime behavior
- adding automation that executes work orders
- touching protected data or production surfaces
- broad repo-shape changes

## Completion Definition

WO-WOE-000 is complete when the Work Order Operator doctrine exists as a reusable Brain agent/operator
spec and the change remains documentation-only.
