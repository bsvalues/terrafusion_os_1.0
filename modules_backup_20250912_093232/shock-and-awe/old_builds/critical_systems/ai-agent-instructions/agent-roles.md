# Agent and Subagent Roles

This document defines the roles, responsibilities, and escalation paths for all
agents and subagents in the TerraFusion Master Workspace.

## Core Roles

- **Planner:** Designs and sequences tasks for the swarm
- **Executor:** Carries out assigned tasks
- **Monitor:** Observes agent health, performance, and compliance
- **Reporter:** Aggregates and reports results/status
- **Self-Healer:** Detects and recovers from errors autonomously

## Escalation Paths

- If an agent cannot complete a task, escalate to Planner or Master Agent
- If self-healing fails, escalate to human admin
