---
name: packet-update
description: Update the ops release packet and/or write a dated evidence note from a bounded change. Outputs what changed, why, proof counts, files touched, release-posture impact, and unchanged risks. Turns "I'll document it later" into a lie the computer cannot tell.
allowed-tools: Read, Write, Glob, Grep, Bash(git diff *), Bash(git log *), Bash(git status *), Bash(ls *)
---

Write ops packet update for: $ARGUMENTS

Steps:

1. Gather context (run in parallel):
   - `git log --oneline -5`
   - `git diff HEAD~1 --name-only`
   - `git diff HEAD~1 --stat`
   - List `os-platform/core/pilot/ops/` to find the active release packet

2. Read the active release packet (largest/most recent `.md` in that dir).

3. Write a dated evidence note at:
   `os-platform/core/pilot/ops/<topic>-<YYYY-MM-DD>.md`

   Use this exact structure:
   ```
   # <Topic> — <YYYY-MM-DD>

   **Classification**: Quality Lane — <lane name>
   **Sealed at**: <commit hash> (`<short hash>`)

   ---

   ## What Changed
   <2–4 bullets: exactly what was modified, added, or removed>

   ## Why It Changed
   <1–3 sentences: the specific honesty/architectural/harness reason>

   ## Proof
   - <N> passed | <N> failed | <N> skipped
   - Files touched: <list>

   ## Release Posture Impact
   <none / quality-lane only / blocker resolved / posture tightened>

   ## Unchanged Risks
   <risks from the active release packet that this change does NOT resolve>
   ```

4. Append a reference entry to the active release packet's "Primary sources" section:
   ```
   - `os-platform/core/pilot/ops/<note-filename>`
   ```

5. If the change resolves a known blocker named in the packet, update that section.

6. Print both the note content and the packet diff to the conversation.

Rules:
- Use the actual git commit hash, not a placeholder.
- Proof counts come from the test run output, not memory.
- "Quality Lane" means the change does not touch traffic-opening blockers.
- If a blocker IS resolved, say so explicitly and name which one.
- Do not invent proof. If test counts are unknown, say "proof counts pending."
