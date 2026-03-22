---
name: ui-honesty-pass
description: Inspect changed UI component files for aspirational claims, fluff verbs, direct-action language where the code only drafts/requests/summarizes, and missing result disclosures. Report every violation with file:line and a suggested honest rewrite.
allowed-tools: Read, Grep, Glob, Bash(git diff *), Bash(git status *), Bash(bash .claude/skills/ui-honesty-pass/check.sh *)
---

Run UI honesty pass on: $ARGUMENTS

Steps:

1. Resolve the target:
   - If $ARGUMENTS is a file or directory → scan it directly
   - If blank → run `git diff --name-only HEAD` and scan changed `*.tsx` files in `src/pages/` and `src/components/`

2. Run the scanner:
   `bash .claude/skills/ui-honesty-pass/check.sh "$ARGUMENTS"`

3. For each flagged line, output:
   ```
   FILE:LINE
   VIOLATION TYPE: <category>
   CURRENT TEXT:   "<exact string>"
   HONEST REWRITE: "<corrected version>"
   REASON:         <one sentence explaining the mismatch>
   ```

4. After all violations, write a summary:
   - N files scanned
   - N violations found (by category)
   - Recommended next action: fix in place / escalate to ops note / no action needed

Violation categories (in priority order):

**DIRECT_ACTION** — UI claims the system does something autonomously when the code
  only submits a request and waits for a backend response.
  Examples: "Generate X", "Create X", "Send X", "Approve X"
  → Rewrite as: "Submit X Request", "Request X Draft", "Initiate X"

**FLUFF_VERB** — Aspirational or marketing-grade verbs that overstate capability.
  Pattern: manages, orchestrates, intelligently, automatically, analyzes, processes,
  optimizes, revolutionizes, enables, empowers, seamlessly, quantum
  → Rewrite with the literal action the code performs.

**ASPIRATIONAL_CLAIM** — Present-tense claims presented as current fact but not
  backed by the mounted component's handlers or returned payload.
  Examples: "View all appeals", "Complete audit trail", "Real-time monitoring"
  when the component shows a stub, loading placeholder, or mock data.

**MISSING_DISCLOSURE** — A card or panel returns data from a tool invocation but
  has no disclosure stating what data is shown and where it came from.
  Required disclosure pattern: "Showing [field list] returned from [tool] for [parcel]."

**BUTTON_LABEL_MISMATCH** — Button label implies finality ("Submit", "Save", "Approve")
  but the handler only drafts, previews, or requests — never commits.

Rules:
- Flag every instance. Do not skip "close enough."
- Suggest the minimal honest rewrite, not a redesign.
- If a component is correctly honest, say so explicitly — do not leave it ambiguous.
- Do not edit files. Report only.
