# Benton County IT — Questions for LocalOps Deployment

Practical questions for county IT before TerraFusion's LocalOps mode is finalized for the locked-down server. Each answer changes a config value or a runbook step, not the architecture — LocalOps assumes the most restrictive answer by default.

## Network / egress
1. Is ALL outbound internet blocked from the server, or is there an allow-list process? (Default assumption: all blocked → `AI_PROFILE=localops`.)
2. Are loopback/intra-VLAN HTTP calls between services on the same host permitted? (LocalOps needs only localhost: API ↔ local model host ↔ shell.)
3. Is there an internal NTP source? (Trace event timestamps need sane clocks.)

## Local AI model hosting
4. May we run a local model server (e.g., Ollama / llama.cpp serving an open-weights model) as a Windows service on the TerraFusion host? If not on the same host, is there an approved internal host we can reach over the VLAN?
5. Any policy on model weights as files (size, provenance scanning, where they may live on disk)?
6. Who approves the specific model + version? What documentation do they need from us?
7. Is GPU available on the server, or do we size for CPU-only inference?

## Software installation
8. What is the approved process for installing/updating TerraFusion itself (offline installer, USB transfer, internal artifact server)?
9. Are Node.js and .NET 8 runtimes already approved? Pinned versions?
10. Package feeds (npm/NuGet) are unreachable by assumption — confirmed? (We ship vendored dependencies; no runtime package installs.)

## Audit / security expectations
11. Where should TerraTrace/audit events ultimately land for county review (local Postgres, file export, SIEM forward)? Retention period?
12. Does IT want a periodic export of `localops.*` AI-interaction events? Format preference?
13. Any constraints on what the local AI may read on disk? (LocalOps v1 reads only TerraFusion's own docs/config with secret redaction; confirm that's acceptable and whether county documents are explicitly OUT of scope — our default: yes, out of scope without a separate approval.)
14. Account model on the server: service account for TerraFusion? Who holds admin?

## Operations
15. Who restarts services after a server reboot — IT or assessor's office? (Runbook assigns steps accordingly.)
16. Maintenance windows / patching cadence we should design around?
17. Is there a test/staging server, or does everything prove out on production hardware?
18. Escalation path when TerraFusion diagnostics report a failure IT must act on (ticket system, phone, email-less environment?).

## Answers log
| # | Answer | Date | Source |
|---|--------|------|--------|
| – | (record answers here as they arrive) | | |
