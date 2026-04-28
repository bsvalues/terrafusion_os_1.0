# TerraFusion Founder Quickstart

A single page. Copy, paste, run.

This is the founder onramp for the **local-agent CLI** — the bounded, founder-safe
helper that runs locally on your machine. No network calls. No auto-tag. No auto-push.
Read-only by default; mutating verbs require a locked work card.

---

## 1. Prerequisites

- Node.js 20+
- pnpm 9+
- A clone of this repository

```bash
node --version
pnpm --version
```

---

## 2. One-time setup

```bash
pnpm install
pnpm run build:core-js
```

That compiles the local-agent TypeScript sources to the CommonJS files the CLI runs from.

---

## 3. First run — see the lay of the land

The CLI is exposed through the `tf:local-agent` script. Everything after `--` is
forwarded to the local agent.

```bash
pnpm run tf:local-agent -- status
```

You will see:

- the active work card (if any)
- whether proof gates have been run
- pending patches
- the last 3 audit events
- a recommended next step

If you want a longer tour:

```bash
pnpm run tf:local-agent -- help-me
```

---

## 4. Daily loop

A single bounded change always follows the same shape:

```bash
# 1. Lock a work card before you change any source.
pnpm run tf:local-agent -- init

# 2. Make your edits in the allowed files only.

# 3. Run the proof wall.
pnpm run tf:local-agent -- proof

# 4. Save state and close the card.
pnpm run tf:local-agent -- save-state
pnpm run tf:local-agent -- finalize
```

To inspect the audit log at any point:

```bash
pnpm run tf:local-agent -- events --tail 20
pnpm run tf:local-agent -- events --tail 50 --type proof_passed
```

---

## 5. Release path (read-only plan)

`release` is a survey, not an executor. It tells you the **next exact command** to run
based on which release artifacts already exist.

```bash
pnpm run tf:local-agent -- release
```

When the plan tells you to record approval, the real verb is:

```bash
pnpm run tf:local-agent -- release-approve <version> --name "<approver>"
```

The agent never tags or pushes for you. Tagging stays in your hands.

---

## 6. Doc-truth gate

Curated founder-facing docs (this file and `CHANGELOG.md`) are scanned to ensure every
`pnpm run tf:local-agent -- <verb>` reference points at a real verb in the registry.

```bash
pnpm run proof:local-agent:doc-truth
```

If this fails, the doc has drifted from the CLI. Fix the doc — never invent verbs.

---

## 7. Troubleshooting

- **`MODULE_NOT_FOUND` after editing a `.ts` file**
  Run `pnpm run build:core-js`. The CLI runs from compiled `.js`.
- **`Proof results are required before finalizing.`**
  You skipped step 3. Run `pnpm run tf:local-agent -- proof` first.
- **`A work card is already locked.`**
  An earlier session did not close. Run `pnpm run tf:local-agent -- status` to inspect,
  then `finalize` once proof has been run, or remove `.terrafusion/current-work-card.*`
  manually if the card was abandoned.

---

## 8. Where to look next

- `CHANGELOG.md` — what landed, in plain English.
- `.terrafusion/agent-events.jsonl` — append-only audit log.
- `os-platform/core/pilot/local-agent/` — CLI source (TypeScript).

That is the whole onramp. Everything else is opt-in.
