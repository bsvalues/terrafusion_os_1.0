# Local Agent Release Proof

- Generated At: 2026-04-28T07:37:16.359Z
- Overall: PASS
- Temp Repo Cleaned Up: true
- Temp Repo Root: C:\Users\bsval\AppData\Local\Temp\tf-local-agent-release-proof-Kj0UDq

## Commands

### PASS command-registry

- Step: command-registry
- OK: true
- Result:
```json
{
  "type": "Object"
}
```

### PASS control-center-state

- Step: control-center-state
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0",
  "identity": {
    "productName": "TerraFusion Local Agent Runtime",
    "internalCodename": "Prometheus",
    "productSentence": "Prometheus is the county-safe local agent runtime harness that gives TerraFusion a Claude Code / Codex-class copilot posture without changing the external product name.",
    "operatingFaces": [
      "Founder Builder",
      "County Operations Assistant",
      "TerraPilot Dev Mode"
    ],
    "notes": [
      "Prometheus is an internal codename.",
      "Prometheus is not a model.",
      "Prometheus is not OpenMythos.",
      "Prometheus is not a GUI."
    ]
  },
  "policy": {
    "available": true,
    "profile": "founder",
    "source": "founder-default",
    "purpose": "Default local-agent founder policy is active until an exported policy is present.",
    "cloudAllowed": false,
    "privateLanAllowed": false,
    "modelEndpoint": null,
    "warning": "No exported active policy found; summarizing the founder-default local-agent posture."
  },
  "doctor": {
    "available": false,
    "overallStatus": null,
    "criticalFailures": 0,
    "warnings": 0,
    "path": null
  },
  "model": {
    "available": false,
    "healthy": null,
    "endpoint": null,
    "model": null,
    "startupMode": null,
    "warnings": [],
    "path": null
  },
  "artifacts": {
    "activePolicy": false,
    "commandRegistry": true,
    "controlCenterState": false,
    "currentWorkCard": false,
    "patchPreview": false,
    "proofResults": false,
    "saveState": false,
    "finalReport": false,
    "doctorReport": false,
    "modelRuntimeStatus": false,
    "releaseNotes": false,
    "docsIndex": false,
    "productManifest": false,
    "releaseCheck": false,
    "releaseFreeze": false,
    "shipReport": false,
    "tagGate": false,
    "releaseApproval": false,
    "tagCommand": false,
    "releaseRunbook": false
  },
  "nextCommand": "pnpm run tf:local-agent -- start",
  "nextReason": "No locked work card exists. The founder cockpit is the safest way to pick up or start a bounded slice.",
  "commandCount": 40,
  "commandGroups": [
    "Guidance",
    "Advanced",
    "Release",
    "Planning",
    "Patch Control",
    "Validation",
    "Handoff"
  ],
  "commandRegistryPath": ".terrafusion/command-registry.json",
  "actions": [
    {
      "id": "start",
      "label": "Open Founder Cockpit",
      "command": "pnpm run tf:local-agent -- start",
      "group": "Guidance",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": false
    },
    {
      "id": "help-me",
      "label": "Help Me",
      "command": "pnpm run tf:local-agent -- help-me",
      "group": "Guidance",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": false
    },
    {
      "id": "next",
      "label": "Recommend Next Step",
      "command": "pnpm run tf:local-agent -- next",
      "group": "Guidance",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": false
    },
    {
      "id": "command-registry",
      "label": "Write Command Registry",
      "command": "pnpm run tf:local-agent -- command-registry",
      "group": "Guidance",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "doctor",
      "label": "Run Doctor",
      "command": "pnpm run tf:local-agent -- doctor --model-endpoint http://127.0.0.1:11434/v1 --model-name local-coder",
      "group": "Guidance",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "control-center-state",
      "label": "Write Control Center State",
      "command": "pnpm run tf:local-agent -- control-center-state",
      "group": "Guidance",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "control-center-preview",
      "label": "Preview Control Center",
      "command": "pnpm run tf:local-agent -- control-center-preview",
      "group": "Guidance",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": false
    },
    {
      "id": "release-notes",
      "label": "Write Release Notes",
      "command": "pnpm run tf:local-agent -- release-notes",
      "group": "Release",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "docs-index",
      "label": "Write Docs Index",
      "command": "pnpm run tf:local-agent -- docs-index",
      "group": "Release",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "product-manifest",
      "label": "Write Product Manifest",
      "command": "pnpm run tf:local-agent -- product-manifest",
      "group": "Release",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "release-check",
      "label": "Run Release Check",
      "command": "pnpm run tf:local-agent -- release-check",
      "group": "Release",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "release-freeze",
      "label": "Write Release Freeze Card",
      "command": "pnpm run tf:local-agent -- release-freeze",
      "group": "Release",
      "enabled": false,
      "reason": "Release freeze requires release notes, docs index, product manifest, and a passing release check artifact.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "ship-mvp",
      "label": "Ship MVP Evidence",
      "command": "pnpm run tf:local-agent -- ship-mvp release --overwrite",
      "group": "Release",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "tag-gate",
      "label": "Run Tag Gate",
      "command": "pnpm run tf:local-agent -- tag-gate 0.1.0",
      "group": "Release",
      "enabled": false,
      "reason": "Tag Gate requires release notes, docs index, product manifest, release check, and ship report.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "release-approve",
      "label": "Record Release Approval",
      "command": "pnpm run tf:local-agent -- release-approve 0.1.0 --name \"Founder\"",
      "group": "Release",
      "enabled": false,
      "reason": "Release approval requires a passing Tag Gate report.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "tag-command",
      "label": "Write Tag Command Report",
      "command": "pnpm run tf:local-agent -- tag-command 0.1.0",
      "group": "Release",
      "enabled": false,
      "reason": "Tag command requires release approval.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "release-runbook",
      "label": "Write Release Runbook",
      "command": "pnpm run tf:local-agent -- release-runbook 0.1.0",
      "group": "Release",
      "enabled": false,
      "reason": "Release runbook requires tag gate, release approval, and tag command artifacts.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "plan",
      "label": "Plan Task",
      "command": "pnpm run tf:local-agent -- plan \"Describe your task here\"",
      "group": "Planning",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": false
    },
    {
      "id": "lock-card",
      "label": "Lock Work Card",
      "command": "pnpm run tf:local-agent -- lock-card \"Describe your task here\"",
      "group": "Planning",
      "enabled": true,
      "reason": "Available under current local state.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "current-card",
      "label": "Show Current Card",
      "command": "pnpm run tf:local-agent -- current-card",
      "group": "Planning",
      "enabled": false,
      "reason": "Locked work card required.",
      "beginnerSafe": true,
      "mutatesState": false
    },
    {
      "id": "clear-card",
      "label": "Clear Current Card",
      "command": "pnpm run tf:local-agent -- clear-card",
      "group": "Planning",
      "enabled": false,
      "reason": "Locked work card required.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "proof",
      "label": "Run Proof Gates",
      "command": "pnpm run tf:local-agent -- proof",
      "group": "Validation",
      "enabled": false,
      "reason": "Locked work card required.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "save-state",
      "label": "Save State",
      "command": "pnpm run tf:local-agent -- save-state \"Summarize what happened\" --next-step \"Write the next exact action\"",
      "group": "Handoff",
      "enabled": false,
      "reason": "Locked work card required.",
      "beginnerSafe": true,
      "mutatesState": true
    },
    {
      "id": "finalize",
      "label": "Finalize",
      "command": "pnpm run tf:local-agent -- finalize",
      "group": "Handoff",
      "enabled": false,
      "reason": "Locked work card required.",
      "beginnerSafe": true,
      "mutatesState": true
    }
  ],
  "notes": [
    "Control Center state is read-only UI input.",
    "Future buttons must still route through the local-agent CLI.",
    "The harness keeps authority even when a desktop shell renders this contract."
  ]
}
```

### PASS release-notes

- Step: release-notes
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0",
  "productName": "TerraFusion Local Agent Runtime",
  "internalCodename": "Prometheus",
  "productSentence": "Prometheus is the county-safe local agent runtime that gives TerraFusion a Claude Code / Codex-class engineering and operations copilot without requiring external AI access.",
  "status": "Governed local-agent release candidate for founder-safe and county-safe runtime flows.",
  "operatingFaces": [
    "Founder Builder: helps build TerraFusion from minute one.",
    "County Operations Assistant: helps county IT diagnose, report, install, verify, and operate locally.",
    "TerraPilot Dev Mode: future OS-native surface inside TerraFusion."
  ],
  "highlights": [
    "Defines Prometheus as the internal codename while keeping TerraFusion Local Agent Runtime as the public product name.",
    "Adds founder-safe doctor, model gateway diagnostics, and read-only explain/review reporting to the governed runtime surface.",
    "Adds release governance flow: tag gate, release owner approval, tag command report, and final release runbook.",
    "Adds a release-freeze card that fingerprints the founder launch evidence bundle and names the rerun gates before unfreezing.",
    "Preserves local-first execution with no automatic cloud fallback.",
    "Keeps command registry, control-center state, and terminal preview as read-only evidence surfaces.",
    "Makes release readiness auditable through JSON, Markdown, and event artifacts."
  ],
  "capabilities": [
    "Prometheus is the local-first harness, policy layer, evidence system, and runtime contract for the TerraFusion Local Agent Runtime.",
    "Locked work cards, patch preview, proof gates, save state, and finalize stay as the governed delivery spine.",
    "Doctor writes local runtime and model status artifacts for future UI and county-safe operational review.",
    "Model Health, List Models, and Model Chat keep local model access loopback-only and advisory-only.",
    "Explain and Review provide read-only reporting over locked cards, proof state, pending patches, and finalize blockers.",
    "Command registry and control-center state remain machine-readable UI contracts.",
    "Tag Gate validates release readiness without creating a Git tag.",
    "Release Approval records human owner approval after Tag Gate passes.",
    "Tag Command prints exact manual tag and verification commands without executing Git.",
    "Release Runbook generates final human release instructions, rollback notes, and evidence links.",
    "Release Freeze records the canonical closeout, guarded artifact hashes, and the proof wall that must rerun before another freeze."
  ],
  "countySafePosture": [
    "This runtime is OS/platform infrastructure, not a Forge, Atlas, Dais, or Dossier write lane.",
    "All authority stays inside the governed harness.",
    "Model participation remains advisory-only and is not required for release evidence.",
    "Prometheus is model-agnostic; OpenMythos is only one optional local model backend.",
    "Release evidence is local, auditable, and does not touch county production data.",
    "Git tags are suggested, never created automatically by the runtime.",
    "Git pushes are never executed by the runtime."
  ],
  "installCommands": [
    {
      "title": "Build generated JS",
      "command": "pnpm run build:core-js",
      "purpose": "Refresh generated JS companions for local-agent TS modules."
    },
    {
      "title": "Focused local-agent tests",
      "command": "pnpm run test:local-agent",
      "purpose": "Run the local-agent proof wall."
    },
    {
      "title": "Governance spine check",
      "command": "node --test os-platform/core/tests/phase83-tools.test.mjs",
      "purpose": "Verify core pilot tooling contracts remain intact."
    }
  ],
  "dailyCommands": [
    {
      "title": "Write release notes",
      "command": "pnpm run tf:local-agent -- release-notes",
      "purpose": "Write CHANGELOG.md and release note artifacts."
    },
    {
      "title": "Write docs index",
      "command": "pnpm run tf:local-agent -- docs-index",
      "purpose": "Write the release reading path and required artifact index."
    },
    {
      "title": "Write product manifest",
      "command": "pnpm run tf:local-agent -- product-manifest",
      "purpose": "Write the runtime shipping contract and release governance posture."
    },
    {
      "title": "Run release check",
      "command": "pnpm run tf:local-agent -- release-check",
      "purpose": "Validate release evidence artifacts before shipping."
    },
    {
      "title": "Write release freeze card",
      "command": "pnpm run tf:local-agent -- release-freeze",
      "purpose": "Fingerprint the founder launch evidence bundle and record rerun gates before unfreezing."
    },
    {
      "title": "Ship MVP bundle",
      "command": "pnpm run tf:local-agent -- ship-mvp release --overwrite",
      "purpose": "Write the release evidence bundle without approving, tagging, or pushing."
    },
    {
      "title": "Tag gate",
      "command": "pnpm run tf:local-agent -- tag-gate 0.1.0",
      "purpose": "Validate release-tag readiness without creating a tag."
    },
    {
      "title": "Release approval",
      "command": "pnpm run tf:local-agent -- release-approve 0.1.0 --name \"Founder\"",
      "purpose": "Record human release owner approval."
    },
    {
      "title": "Tag command report",
      "command": "pnpm run tf:local-agent -- tag-command 0.1.0",
      "purpose": "Print final manual tag and verification commands."
    },
    {
      "title": "Final release runbook",
      "command": "pnpm run tf:local-agent -- release-runbook 0.1.0",
      "purpose": "Write the final human release runbook."
    }
  ],
  "releaseArtifacts": [
    {
      "title": "Command Registry",
      "path": ".terrafusion/command-registry.md",
      "required": true,
      "exists": true,
      "purpose": "Machine-readable command map for release review."
    },
    {
      "title": "Control Center State",
      "path": ".terrafusion/control-center-state.md",
      "required": true,
      "exists": true,
      "purpose": "Read-only UI state contract for release review."
    },
    {
      "title": "Doctor Report",
      "path": ".terrafusion/doctor-report.json",
      "required": false,
      "exists": false,
      "purpose": "Founder-safe runtime diagnostics and local evidence posture."
    },
    {
      "title": "Model Runtime Status",
      "path": ".terrafusion/model-runtime-status.json",
      "required": false,
      "exists": false,
      "purpose": "Loopback-only model gateway status for local operational review."
    },
    {
      "title": "Product Manifest",
      "path": ".terrafusion/product-manifest.md",
      "required": true,
      "exists": false,
      "purpose": "Runtime shipping contract and county-safe posture."
    },
    {
      "title": "Release Check",
      "path": ".terrafusion/release-check-report.md",
      "required": true,
      "exists": false,
      "purpose": "Release evidence validation report."
    },
    {
      "title": "Docs Index",
      "path": ".terrafusion/docs-index.md",
      "required": true,
      "exists": false,
      "purpose": "Human reading path for release artifacts."
    },
    {
      "title": "Release Freeze Card",
      "path": ".terrafusion/release-freeze-card.md",
      "required": false,
      "exists": false,
      "purpose": "Founder launch freeze snapshot and rerun gate list."
    },
    {
      "title": "Ship Report",
      "path": ".terrafusion/ship-report.md",
      "required": false,
      "exists": false,
      "purpose": "MVP ship evidence report."
    },
    {
      "title": "Tag Gate",
      "path": ".terrafusion/tag-gate-report.md",
      "required": false,
      "exists": false,
      "purpose": "Release-tag readiness report."
    },
    {
      "title": "Release Approval",
      "path": ".terrafusion/release-approval.md",
      "required": false,
      "exists": false,
      "purpose": "Human release approval record."
    },
    {
      "title": "Tag Command",
      "path": ".terrafusion/tag-command-report.md",
      "required": false,
      "exists": false,
      "purpose": "Final manual tag instruction report."
    },
    {
      "title": "Release Runbook",
      "path": ".terrafusion/release-runbook-0.1.0.md",
      "required": false,
      "exists": false,
      "purpose": "Final human release checklist."
    }
  ],
  "knownLimitations": [
    "The runtime intentionally does not create or push Git tags; humans execute release Git commands manually.",
    "There is no graphical release dashboard in 0.1.0; release surfaces are JSON, Markdown, and terminal outputs.",
    "Prometheus is not yet a TerraPilot Dev Mode GUI; the codename currently maps to the CLI and evidence runtime.",
    "Release evidence covers local-agent runtime infrastructure only, not broader product suites.",
    "The runtime does not weaken policy for county contexts during release operations."
  ],
  "shimDeprecationPolicy": [
    "The local-agent CLI contract is stable through the 0.1.x line.",
    "New release commands extend the contract without replacing existing planning, patch, proof, or finalize commands.",
    "Future compatibility work must preserve the governed harness boundary."
  ],
  "upgradeNotes": [
    "Use TerraFusion Local Agent Runtime as the public product name and Prometheus as the internal codename.",
    "Run release evidence commands locally and review their Markdown outputs before any human tagging step.",
    "Capture the release freeze card after release-check if you need to preserve a known-good founder launch state.",
    "Use the release-review docs path to audit evidence in order.",
    "Do not treat release artifacts as authority; human approval remains the release gate."
  ],
  "architectureSummary": [
    "Layer 1: CLI + future Control Center - help-me, next, start, control-center-state, control-center-preview.",
    "Layer 2: Governance Harness - active policy, permission engine, locked work cards, audit log, proof gates.",
    "Layer 3: Agent Workflow - plan, preview-patch, apply-patch, proof, explain, review, save-state, finalize.",
    "Layer 4: Local Diagnostics - doctor, model-health, list-models, model-chat.",
    "Layer 5: Release Evidence - product-manifest, release-check, release-freeze, docs-index, ship-mvp, release-notes, tag-gate, release-approve, tag-command, release-runbook.",
    "Layer 6: Model Backend - local/private model endpoints such as OpenMythos, Qwen Coder, DeepSeek Coder, Llama, LM Studio, Ollama, vLLM, or other county-approved local models."
  ]
}
```

### PASS product-manifest

- Step: product-manifest
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0-mvp",
  "productId": "terrafusion-local-agent",
  "productName": "TerraFusion Local Agent Runtime",
  "internalCodename": "Prometheus",
  "productSentence": "Prometheus is the county-safe local agent runtime that gives TerraFusion a Claude Code / Codex-class engineering and operations copilot without requiring external AI access.",
  "operatingFaces": [
    "Founder Builder",
    "County Operations Assistant",
    "TerraPilot Dev Mode"
  ],
  "countySafePosture": [
    "This runtime is governed OS/platform infrastructure rather than a suite write lane.",
    "Prometheus is the internal codename; TerraFusion Local Agent Runtime remains the external product name.",
    "Prometheus is not a model, not a chatbot, not a GUI, and not OpenMythos-specific.",
    "Doctor, Explain, Review, and model gateway diagnostics are local evidence surfaces; they do not grant tool or patch authority.",
    "Release flow is evidence-gated: release notes, release check, tag gate, release approval, tag-command report, and release runbook are separate artifacts.",
    "Git tags are never created automatically by the runtime.",
    "Git pushes are never executed by the runtime.",
    "Human release owner approval is recorded before final tag instructions are emitted.",
    "County safety and policy posture are not weakened during release operations.",
    "OpenMythos is only one optional local model backend; the harness remains the governing substrate."
  ],
  "knownLimitations": [
    "Local model health, model listing, and model chat remain loopback-only and advisory-only by default.",
    "Release approval, tag command, and release runbook commands generate evidence and instructions only; they do not create or push Git tags.",
    "The runtime does not approve releases automatically.",
    "The runtime does not execute cloud fallback behavior for release flows.",
    "Prometheus currently ships as CLI, evidence, and control-center contract surfaces rather than a dedicated OS-native GUI."
  ],
  "releaseGovernance": {
    "requiresTagGate": true,
    "requiresReleaseApproval": true,
    "printsTagCommandOnly": true,
    "createsGitTag": false,
    "pushesGitTag": false,
    "runbookArtifact": ".terrafusion/release-runbook-0.1.0.md"
  }
}
```

### PASS release-check

- Step: release-check
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "ok": true,
  "releaseStatus": "release-ready-mvp",
  "criticalFailures": 0,
  "warnings": 2,
  "items": [
    {
      "name": "Command Registry",
      "ok": true,
      "severity": "info",
      "message": "Artifact exists.",
      "path": ".terrafusion/command-registry.md"
    },
    {
      "name": "Control Center State",
      "ok": true,
      "severity": "info",
      "message": "Artifact exists.",
      "path": ".terrafusion/control-center-state.md"
    },
    {
      "name": "Product Manifest",
      "ok": true,
      "severity": "info",
      "message": "Artifact JSON is readable.",
      "path": ".terrafusion/product-manifest.json"
    },
    {
      "name": "Release Notes",
      "ok": true,
      "severity": "info",
      "message": "Artifact JSON is readable.",
      "path": ".terrafusion/release-notes-0.1.0.json"
    },
    {
      "name": "Doctor Report",
      "ok": false,
      "severity": "warning",
      "message": "Doctor diagnostics are not required for release, but improve review context.",
      "path": ".terrafusion/doctor-report.json"
    },
    {
      "name": "Model Runtime Status",
      "ok": false,
      "severity": "warning",
      "message": "Model runtime diagnostics are optional release evidence.",
      "path": ".terrafusion/model-runtime-status.json"
    }
  ]
}
```

### PASS docs-index

- Step: docs-index
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0",
  "entries": [
    {
      "id": "command-registry",
      "title": "Command Registry",
      "path": ".terrafusion/command-registry.md",
      "category": "Operations",
      "audience": [
        "founder",
        "county-it"
      ],
      "required": true,
      "summary": "Machine-readable command registry for future UI consumers.",
      "exists": true
    },
    {
      "id": "control-center-state",
      "title": "Control Center State",
      "path": ".terrafusion/control-center-state.md",
      "category": "Operations",
      "audience": [
        "founder",
        "county-it"
      ],
      "required": true,
      "summary": "Read-only state contract for terminal and future desktop control centers.",
      "exists": true
    },
    {
      "id": "doctor-report",
      "title": "Doctor Report",
      "path": ".terrafusion/doctor-report.json",
      "category": "Operations",
      "audience": [
        "founder",
        "county-it"
      ],
      "required": false,
      "summary": "Founder-safe runtime diagnostics summarizing local readiness, patch count, and evidence posture.",
      "exists": false
    },
    {
      "id": "model-runtime-status",
      "title": "Model Runtime Status",
      "path": ".terrafusion/model-runtime-status.json",
      "category": "Operations",
      "audience": [
        "founder",
        "county-it"
      ],
      "required": false,
      "summary": "Loopback-only model gateway health and model inventory status for local operational review.",
      "exists": false
    },
    {
      "id": "product-manifest",
      "title": "Product Manifest",
      "path": ".terrafusion/product-manifest.md",
      "category": "Release",
      "audience": [
        "founder",
        "county-it"
      ],
      "required": true,
      "summary": "Runtime shipping contract, county-safe posture, and Prometheus naming decision.",
      "exists": true
    },
    {
      "id": "release-check",
      "title": "Release Check Report",
      "path": ".terrafusion/release-check-report.md",
      "category": "Release",
      "audience": [
        "founder"
      ],
      "required": true,
      "summary": "Release evidence gate before ship and tag steps.",
      "exists": true
    },
    {
      "id": "release-notes",
      "title": "0.1.0 Release Notes",
      "path": ".terrafusion/release-notes-0.1.0.md",
      "category": "Release",
      "audience": [
        "founder",
        "county-it"
      ],
      "required": true,
      "summary": "Release notes documenting the Prometheus codename, capabilities, county-safe posture, known limitations, and manual tag posture.",
      "exists": true
    },
    {
      "id": "release-freeze",
      "title": "Release Freeze Card",
      "path": ".terrafusion/release-freeze-card.md",
      "category": "Release",
      "audience": [
        "founder"
      ],
      "required": false,
      "summary": "Founder launch freeze snapshot with guarded artifact fingerprints, canonical closeout, and rerun gates.",
      "exists": false
    },
    {
      "id": "tag-gate",
      "title": "Tag Gate Report",
      "path": ".terrafusion/tag-gate-report.md",
      "category": "Release",
      "audience": [
        "founder"
      ],
      "required": false,
      "summary": "Validates release-tag readiness without creating the git tag.",
      "exists": false
    },
    {
      "id": "release-approval",
      "title": "Release Approval",
      "path": ".terrafusion/release-approval.md",
      "category": "Release",
      "audience": [
        "founder"
      ],
      "required": false,
      "summary": "Records human release owner approval after Tag Gate passes.",
      "exists": false
    },
    {
      "id": "tag-command",
      "title": "Tag Command Report",
      "path": ".terrafusion/tag-command-report.md",
      "category": "Release",
      "audience": [
        "founder"
      ],
      "required": false,
      "summary": "Prints the final manual git tag command and verification commands without executing them.",
      "exists": false
    },
    {
      "id": "release-runbook",
      "title": "Final Release Runbook",
      "path": ".terrafusion/release-runbook-0.1.0.md",
      "category": "Release",
      "audience": [
        "founder",
        "county-it"
      ],
      "required": false,
      "summary": "Human-readable final release runbook with manual tag, verification, and rollback instructions.",
      "exists": false
    },
    {
      "id": "ship-report",
      "title": "Ship Report",
      "path": ".terrafusion/ship-report.md",
      "category": "Release",
      "audience": [
        "founder"
      ],
      "required": false,
      "summary": "Release evidence bundle report without tag execution.",
      "exists": false
    }
  ],
  "readingPaths": [
    {
      "id": "release-review",
      "title": "MVP Release Review Path",
      "audience": "Founder / technical reviewer",
      "entries": [
        "product-manifest",
        "command-registry",
        "control-center-state",
        "doctor-report",
        "model-runtime-status",
        "release-check",
        "release-notes",
        "release-freeze",
        "tag-gate",
        "release-approval",
        "tag-command",
        "release-runbook"
      ],
      "nextCommand": "pnpm run tf:local-agent -- release-freeze"
    }
  ],
  "missingRequired": []
}
```

### PASS release-freeze

- Step: release-freeze
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0",
  "productName": "TerraFusion Local Agent Runtime",
  "internalCodename": "Prometheus",
  "freezeStatus": "launch-ready-root-dependency-remediation-pending",
  "releaseStatus": "release-ready-mvp",
  "launchVerdict": "launch-ready",
  "canonicalCloseout": "Local Agent: release-truth complete, source-code security clean, root dependency remediation pending.",
  "guardedArtifacts": [
    {
      "name": "Command Registry",
      "path": ".terrafusion/command-registry.json",
      "required": true,
      "exists": true,
      "ok": true,
      "sha256": "779290dabdbdc7631d0a56589cf21b06a3c45e498ce1108d4a3d728b5679c205",
      "summary": "Artifact is readable and fingerprinted."
    },
    {
      "name": "Control Center State",
      "path": ".terrafusion/control-center-state.json",
      "required": true,
      "exists": true,
      "ok": true,
      "sha256": "963d256164416e5f956bb4bde932d83d89ca426db8b029ae5ffb283e3167f343",
      "summary": "Artifact is readable and fingerprinted."
    },
    {
      "name": "Release Notes",
      "path": ".terrafusion/release-notes-0.1.0.json",
      "required": true,
      "exists": true,
      "ok": true,
      "sha256": "05179cf8e500b9741a8a4a76088ece8d243903e30619ba13da2356a5d1177e2e",
      "summary": "Artifact is readable and fingerprinted."
    },
    {
      "name": "Docs Index",
      "path": ".terrafusion/docs-index.json",
      "required": true,
      "exists": true,
      "ok": true,
      "sha256": "bf434cc273be90ad10381fb6f41eaebcca6f25aaa3a6f541b6aa5cac3eef43ee",
      "summary": "Docs index has no missing required artifacts."
    },
    {
      "name": "Product Manifest",
      "path": ".terrafusion/product-manifest.json",
      "required": true,
      "exists": true,
      "ok": true,
      "sha256": "643b563e857e8c88fe82ce54fc8fbf6745165d96c37980ac086be39e74b555f9",
      "summary": "Artifact is readable and fingerprinted."
    },
    {
      "name": "Release Check Report",
      "path": ".terrafusion/release-check-report.json",
      "required": true,
      "exists": true,
      "ok": true,
      "sha256": "49f2c658665d0d37b580c7ad7deb652af1912e950f65f385e257d66bf7b7acdf",
      "summary": "Release check passed and was fingerprinted."
    },
    {
      "name": "Doctor Report",
      "path": ".terrafusion/doctor-report.json",
      "required": false,
      "exists": false,
      "ok": false,
      "sha256": null,
      "summary": "Artifact missing."
    },
    {
      "name": "Model Runtime Status",
      "path": ".terrafusion/model-runtime-status.json",
      "required": false,
      "exists": false,
      "ok": false,
      "sha256": null,
      "summary": "Artifact missing."
    }
  ],
  "proofGates": [
    {
      "command": "node --test os-platform/core/tests/local-agent-launch-smoke.test.mjs",
      "purpose": "Re-run founder launch and runtime smoke before changing the frozen slice."
    },
    {
      "command": "pnpm run test:local-agent",
      "purpose": "Re-run the local-agent proof wall after any local-agent source change."
    },
    {
      "command": "pnpm run check:generated",
      "purpose": "Verify generated JS companions still match their TypeScript sources."
    },
    {
      "command": "node --test os-platform/core/tests/phase83-tools.test.mjs",
      "purpose": "Keep the core pilot tooling contract intact."
    },
    {
      "command": "pnpm run type-check",
      "purpose": "Re-check the governed TypeScript boundary before unfreezing."
    }
  ],
  "disclosures": [
    "Founder launch readiness was proven separately by launch smoke and the local-agent proof wall; this card snapshots the release evidence bundle and rerun gates.",
    "Local-agent source-code security is recorded as clean for this slice; root dependency remediation remains pending outside the local-agent source path.",
    "The freeze card is evidence only. It does not approve, tag, or push a release."
  ],
  "notes": [
    "Freeze capture is release-memory, not release authority.",
    "Prometheus remains the internal codename; TerraFusion Local Agent Runtime remains the public product name.",
    "Any future change to the guarded artifacts should trigger the listed proof gates before another freeze capture."
  ]
}
```

### PASS ship-mvp

- Step: ship-mvp
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "ok": true,
  "outputDir": "release",
  "steps": [
    {
      "name": "Command Registry",
      "ok": true,
      "message": "Command registry written.",
      "artifacts": [
        ".terrafusion/command-registry.json",
        ".terrafusion/command-registry.md"
      ]
    },
    {
      "name": "Control Center State",
      "ok": true,
      "message": "Control center state written.",
      "artifacts": [
        ".terrafusion/control-center-state.json",
        ".terrafusion/control-center-state.md"
      ]
    },
    {
      "name": "Product Manifest",
      "ok": true,
      "message": "Product manifest written for 0.1.0-mvp.",
      "artifacts": [
        ".terrafusion/product-manifest.json",
        ".terrafusion/product-manifest.md"
      ]
    },
    {
      "name": "Release Notes",
      "ok": true,
      "message": "Release notes written for version 0.1.0.",
      "artifacts": [
        "CHANGELOG.md",
        ".terrafusion/release-notes-0.1.0.json",
        ".terrafusion/release-notes-0.1.0.md"
      ]
    },
    {
      "name": "Release Check",
      "ok": true,
      "message": "Release check passed.",
      "artifacts": [
        ".terrafusion/release-check-report.json",
        ".terrafusion/release-check-report.md"
      ]
    },
    {
      "name": "Docs Index",
      "ok": true,
      "message": "Docs index written.",
      "artifacts": [
        ".terrafusion/docs-index.json",
        ".terrafusion/docs-index.md"
      ]
    },
    {
      "name": "Release Bundle",
      "ok": true,
      "message": "Release evidence bundle written.",
      "artifacts": [
        "release/release-manifest.json",
        "release/checksums.sha256"
      ]
    }
  ],
  "includeReleaseNotes": true,
  "includeDocsIndex": true,
  "notes": [
    "Ship MVP writes evidence only.",
    "Ship MVP does not approve, tag, or push releases.",
    "Humans remain release authority."
  ]
}
```

### PASS tag-gate

- Step: tag-gate
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0",
  "productName": "TerraFusion Local Agent Runtime",
  "internalCodename": "Prometheus",
  "ok": true,
  "tagCommand": "git tag -a v0.1.0 -m \"TerraFusion Local Agent Runtime v0.1.0\"",
  "criticalFailures": 0,
  "warnings": 0,
  "items": [
    {
      "name": "Release Notes",
      "ok": true,
      "severity": "info",
      "message": "Release notes and changelog are present.",
      "evidence": {
        "markdown": ".terrafusion/release-notes-0.1.0.md",
        "json": ".terrafusion/release-notes-0.1.0.json",
        "changelog": "CHANGELOG.md"
      }
    },
    {
      "name": "Release Check",
      "ok": true,
      "severity": "info",
      "message": "Release check passed.",
      "evidence": {
        "releaseStatus": "release-ready-mvp",
        "criticalFailures": 0,
        "warnings": 2
      }
    },
    {
      "name": "Ship Report",
      "ok": true,
      "severity": "info",
      "message": "Ship report passed.",
      "evidence": {
        "outputDir": "release",
        "steps": 7
      }
    },
    {
      "name": "Product Manifest",
      "ok": true,
      "severity": "info",
      "message": "Product manifest is present and version-aligned.",
      "evidence": {
        "productId": "terrafusion-local-agent",
        "version": "0.1.0-mvp",
        "limitations": 5
      }
    },
    {
      "name": "Docs Index",
      "ok": true,
      "severity": "info",
      "message": "Docs index is present and has no missing required artifacts.",
      "evidence": {
        "entries": 13,
        "readingPaths": 1
      }
    },
    {
      "name": "Required Markdown Artifacts",
      "ok": true,
      "severity": "info",
      "message": "Required Markdown artifacts are present.",
      "evidence": {
        "checked": [
          ".terrafusion/command-registry.md",
          ".terrafusion/control-center-state.md",
          ".terrafusion/product-manifest.md",
          ".terrafusion/release-check-report.md",
          ".terrafusion/ship-report.md",
          ".terrafusion/docs-index.md",
          ".terrafusion/release-notes-0.1.0.md"
        ]
      }
    },
    {
      "name": "Git Working Tree",
      "ok": true,
      "severity": "info",
      "message": "Git working tree is clean or unavailable.",
      "evidence": {
        "branch": "unknown",
        "statusShort": ""
      }
    }
  ],
  "nextSteps": [
    "Review .terrafusion/tag-gate-report.md.",
    "After human approval, run: git tag -a v0.1.0 -m \"TerraFusion Local Agent Runtime v0.1.0\"",
    "Push the tag only after verification passes."
  ]
}
```

### PASS release-approve

- Step: release-approve
- OK: true
- Result:
```json
{
  "approvedAt": 1777361836,
  "version": "0.1.0",
  "productName": "TerraFusion Local Agent Runtime",
  "internalCodename": "Prometheus",
  "approverName": "Founder",
  "tagCommand": "git tag -a v0.1.0 -m \"TerraFusion Local Agent Runtime v0.1.0\"",
  "tagGateReport": ".terrafusion/tag-gate-report.json",
  "notes": [
    "Release owner approval recorded locally.",
    "Public product name remains TerraFusion Local Agent Runtime while Prometheus stays internal.",
    "Git tag was not created automatically.",
    "Human review is still required before running the suggested tag command."
  ]
}
```

### PASS tag-command

- Step: tag-command
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0",
  "productName": "TerraFusion Local Agent Runtime",
  "internalCodename": "Prometheus",
  "approverName": "Founder",
  "tagCommand": "git tag -a v0.1.0 -m \"TerraFusion Local Agent Runtime v0.1.0\"",
  "verificationCommands": [
    "git tag --list v0.1.0",
    "git show --stat v0.1.0",
    "git status --short",
    "pnpm run tf:local-agent -- tag-gate 0.1.0",
    "pnpm run tf:local-agent -- release-check",
    "pnpm run tf:local-agent -- product-manifest"
  ],
  "releaseApprovalPath": ".terrafusion/release-approval.json",
  "currentBranch": "unknown",
  "currentHead": "unknown",
  "notes": [
    "Release approval was present and matched the requested version.",
    "Public product name remains TerraFusion Local Agent Runtime while Prometheus stays internal.",
    "Git tag command was not executed.",
    "Git push command was not generated or executed.",
    "Run verification commands after manually creating the tag."
  ]
}
```

### PASS release-runbook

- Step: release-runbook
- OK: true
- Result:
```json
{
  "createdAt": 1777361836,
  "version": "0.1.0",
  "productName": "TerraFusion Local Agent Runtime",
  "internalCodename": "Prometheus",
  "releaseStatus": "ready-for-human-tag",
  "tagCommand": "git tag -a v0.1.0 -m \"TerraFusion Local Agent Runtime v0.1.0\"",
  "verificationCommands": [
    "git tag --list v0.1.0",
    "git show --stat v0.1.0",
    "git status --short",
    "pnpm run tf:local-agent -- tag-gate 0.1.0",
    "pnpm run tf:local-agent -- release-check",
    "pnpm run tf:local-agent -- product-manifest"
  ],
  "rollbackCommands": [
    "git tag -d v0.1.0",
    "git push --delete origin v0.1.0",
    "pnpm run tf:local-agent -- tag-gate 0.1.0",
    "pnpm run tf:local-agent -- release-check"
  ],
  "artifacts": [
    {
      "name": "Changelog",
      "path": "CHANGELOG.md",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "Artifact exists."
    },
    {
      "name": "Release Notes Markdown",
      "path": ".terrafusion/release-notes-0.1.0.md",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "Artifact exists."
    },
    {
      "name": "Release Notes JSON",
      "path": ".terrafusion/release-notes-0.1.0.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "Release notes version matches."
    },
    {
      "name": "Tag Gate Report",
      "path": ".terrafusion/tag-gate-report.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "Tag gate passed."
    },
    {
      "name": "Release Approval",
      "path": ".terrafusion/release-approval.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "Release approval matches version."
    },
    {
      "name": "Tag Command Report",
      "path": ".terrafusion/tag-command-report.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "Tag command report matches version."
    },
    {
      "name": "Product Manifest",
      "path": ".terrafusion/product-manifest.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "JSON artifact is readable."
    },
    {
      "name": "Release Check Report",
      "path": ".terrafusion/release-check-report.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "JSON artifact is readable."
    },
    {
      "name": "Release Freeze Card",
      "path": ".terrafusion/release-freeze-card.json",
      "required": false,
      "exists": true,
      "ok": true,
      "summary": "JSON artifact is readable."
    },
    {
      "name": "Ship Report",
      "path": ".terrafusion/ship-report.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "JSON artifact is readable."
    },
    {
      "name": "Docs Index",
      "path": ".terrafusion/docs-index.json",
      "required": true,
      "exists": true,
      "ok": true,
      "summary": "Docs index has no missing required artifacts."
    },
    {
      "name": "Doctor Report",
      "path": ".terrafusion/doctor-report.json",
      "required": false,
      "exists": false,
      "ok": false,
      "summary": "Artifact missing."
    },
    {
      "name": "Model Runtime Status",
      "path": ".terrafusion/model-runtime-status.json",
      "required": false,
      "exists": false,
      "ok": false,
      "summary": "Artifact missing."
    },
    {
      "name": "Release Bundle Manifest",
      "path": "release/release-manifest.json",
      "required": false,
      "exists": true,
      "ok": true,
      "summary": "JSON artifact is readable."
    },
    {
      "name": "Release Bundle Checksums",
      "path": "release/checksums.sha256",
      "required": false,
      "exists": true,
      "ok": true,
      "summary": "Artifact exists."
    }
  ],
  "finalManualSteps": [
    "Review CHANGELOG.md.",
    "Review .terrafusion/release-notes-0.1.0.md.",
    "Review .terrafusion/release-freeze-card.md if a founder launch freeze was captured.",
    "Review .terrafusion/tag-gate-report.md.",
    "Review .terrafusion/release-approval.md.",
    "Review .terrafusion/tag-command-report.md.",
    "Run the final manual tag command only after release owner approval.",
    "Run the verification commands.",
    "Push the tag only after verification passes."
  ],
  "notes": [
    "Runbook generated locally.",
    "Public product name remains TerraFusion Local Agent Runtime while Prometheus stays internal.",
    "No git tag was created by this command.",
    "No git push was executed by this command.",
    "Release owner remains the final authority."
  ]
}
```

## Artifact Summary

```json
{
  "releaseCheck": {
    "ok": true,
    "releaseStatus": "release-ready-mvp",
    "criticalFailures": 0,
    "warnings": 2
  },
  "releaseFreeze": {
    "freezeStatus": "launch-ready-root-dependency-remediation-pending",
    "launchVerdict": "launch-ready"
  },
  "shipReport": {
    "ok": true,
    "outputDir": "release",
    "steps": 7
  },
  "tagGate": {
    "ok": true,
    "criticalFailures": 0,
    "warnings": 0,
    "version": "0.1.0"
  },
  "releaseApproval": {
    "version": "0.1.0",
    "approverName": "Founder"
  },
  "releaseRunbook": {
    "releaseStatus": "ready-for-human-tag",
    "version": "0.1.0",
    "finalManualSteps": 9
  }
}
```

## Artifacts

- .terrafusion/agent-events.jsonl (3553 bytes)
- .terrafusion/command-registry.json (13437 bytes)
- .terrafusion/command-registry.md (9866 bytes)
- .terrafusion/control-center-state.json (9985 bytes)
- .terrafusion/control-center-state.md (7970 bytes)
- .terrafusion/docs-index.json (5421 bytes)
- .terrafusion/docs-index.md (4019 bytes)
- .terrafusion/product-manifest.json (2302 bytes)
- .terrafusion/product-manifest.md (2333 bytes)
- .terrafusion/release-approval.json (599 bytes)
- .terrafusion/release-approval.md (794 bytes)
- .terrafusion/release-check-report.json (1350 bytes)
- .terrafusion/release-check-report.md (1129 bytes)
- .terrafusion/release-freeze-card.json (4290 bytes)
- .terrafusion/release-freeze-card.md (3650 bytes)
- .terrafusion/release-notes-0.1.0.json (10697 bytes)
- .terrafusion/release-notes-0.1.0.md (9698 bytes)
- .terrafusion/release-runbook-0.1.0.json (4648 bytes)
- .terrafusion/release-runbook-0.1.0.md (3994 bytes)
- .terrafusion/ship-report.json (1941 bytes)
- .terrafusion/ship-report.md (1510 bytes)
- .terrafusion/tag-command-report.json (987 bytes)
- .terrafusion/tag-command-report.md (1177 bytes)
- .terrafusion/tag-gate-report.json (2619 bytes)
- .terrafusion/tag-gate-report.md (2231 bytes)
- CHANGELOG.md (9760 bytes)
- release/checksums.sha256 (1495 bytes)
- release/release-manifest.json (660 bytes)

