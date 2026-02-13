Run a comprehensive workspace health check for TerraFusion OS.

Check the following and report status:
1. Git status (branch, uncommitted changes)
2. Skills registry at tools/dx/skills/registry.json (count, validity)
3. Command contracts at tools/dx/command-contracts/ (count, any missing)
4. Context Pack at .terrafusion/context/latest.json (age, health status)
5. Evidence Pack at .terrafusion/evidence/ (exists, verdict)
6. Audit log at .terrafusion/audit.log (exists, entry count)
7. Posture bus status
8. Any failing spine-smoke tests

Format as a concise health dashboard with pass/warn/fail indicators.
