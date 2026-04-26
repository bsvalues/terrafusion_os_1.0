# TerraFusion Local Agent Command Registry

- Command Count: 34
- Groups: Guidance, Release, Planning, Patch Control, Validation, Handoff, Advanced
- Global Options: 1

## Global Options

### --repo-root

Run local-agent commands against a different repo root than the current working directory.

```bash
pnpm run tf:local-agent -- --repo-root C:/temp/tf-repro start
```


## Guidance

### start

Open the founder cockpit for guided local-agent flows.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- start
```

### help-me

Show beginner-safe workflows and reminders.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- help-me
```

### next

Recommend one safe next command from local state.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- next
```

### explain-commands

Explain the command map in plain English.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- explain-commands
```

### command-registry

Write the machine-readable command registry for future UI consumers.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- command-registry
```

### doctor

Write doctor-report and model-runtime-status artifacts from current local state and local model health.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- doctor --model-endpoint http://127.0.0.1:11434/v1 --model-name local-coder
```

### model-health

Check whether the configured local model gateway is reachable without granting tool authority.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- model-health --model-endpoint http://127.0.0.1:11434/v1 --model-name local-coder
```

### list-models

List models exposed by the configured local loopback gateway.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- list-models --model-endpoint http://127.0.0.1:11434/v1
```

### model-chat

Send a zero-authority advisory chat prompt to the configured local loopback model gateway.

- Beginner Safe: false
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- model-chat --model-endpoint http://127.0.0.1:11434/v1 --message "Summarize the locked card risks"
```

### control-center-state

Write the read-only control-center contract for future UI layers.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- control-center-state
```

### control-center-preview

Render the read-only terminal preview from the control-center state contract.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- control-center-preview
```

## Release

### release-notes

Write CHANGELOG.md and 0.1.0 release note artifacts.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- release-notes
```

### docs-index

Write the release reading path and required artifact index.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- docs-index
```

### product-manifest

Write the runtime shipping contract and release governance posture.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- product-manifest
```

### release-check

Validate release evidence artifacts before shipping.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- release-check
```

### release-freeze

Fingerprint the current release evidence bundle and record the rerun gates for the frozen founder launch state.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- release-freeze
```

### ship-mvp

Run the MVP release evidence spine and create a release evidence bundle; does not approve, tag, or push.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- ship-mvp release --overwrite
```

### tag-gate

Validate release-tag readiness without creating the git tag.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- tag-gate 0.1.0
```

### release-approve

Record human release owner approval after Tag Gate passes, without creating a git tag.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- release-approve 0.1.0 --name "Founder"
```

### tag-command

Print the final manual git tag command after release approval, without executing it.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- tag-command 0.1.0
```

### release-runbook

Write the final human release runbook after tag gate, approval, and tag command reports.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- release-runbook 0.1.0
```

## Planning

### plan

Create a bounded work card without mutating repository state.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- plan "Describe your task here"
```

### lock-card

Lock a bounded work card before patching.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- lock-card "Describe your task here"
```

### current-card

Show the currently locked work card.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- current-card
```

### clear-card

Clear the currently locked work card.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- clear-card
```

## Patch Control

### preview-patch

Create a patch preview under the locked-card boundary.

- Beginner Safe: false
- Mutates State: true
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- preview-patch <path> --content-file <file>
```

### show-patch

Display a previously created patch preview.

- Beginner Safe: false
- Mutates State: false
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- show-patch <patchId>
```

### apply-patch

Apply a previewed patch only with explicit approval.

- Beginner Safe: false
- Mutates State: true
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- apply-patch <patchId> --approve
```

## Validation

### proof

Run proof gates for the locked work card.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- proof
```

### explain

Render a read-only explanation from locked-card, proof, save-state, and local-agent artifact context.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- explain --include-proof --include-save-state
```

### review

Render a read-only review of risks, pending patches, proof posture, and finalize blockers.

- Beginner Safe: true
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- review --include-events --include-pending-patches
```

## Handoff

### save-state

Write founder handoff state for the current run.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- save-state "Summarize what happened" --next-step "Write the next exact action"
```

### finalize

Declare completion only after locked card, proof, and save state exist.

- Beginner Safe: true
- Mutates State: true
- Requires Locked Card: true

```bash
pnpm run tf:local-agent -- finalize
```

## Advanced

### tool

Run advanced governed tool commands under the founder policy.

- Beginner Safe: false
- Mutates State: false
- Requires Locked Card: false

```bash
pnpm run tf:local-agent -- tool read-file <path>
```

## Authority Boundary

- This registry documents commands for future UI consumers.
- It does not execute commands.
- The harness still owns enforcement and approval.
