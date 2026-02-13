Build a TerraFusion Evidence Pack for the current workspace state.

1. Read the evidence pack builder at tools/dx/skills/tf-pr-evidence-pack/src/evidence-pack-builder.mjs
2. Read the evidence contract at tools/dx/command-contracts/evidence.contract.json
3. Check the current git status and branch
4. Assess the current state of tests, lint, compliance, and contract drift
5. Generate an evidence pack summary showing what artifacts are available and their status
6. Report the overall verdict (pass/fail) with details on any gaps

This is equivalent to running: tdc evidence build
