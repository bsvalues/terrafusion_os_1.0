---
name: save-state
description: End-of-session state preservation. Gather git state and open todos, synthesize what is true now, where we stopped, active variables, next smallest step, and unhandled risks — then write to project memory.
allowed-tools: Read, Write, Glob, Grep, Bash(git log *), Bash(git status *), Bash(git diff *), Bash(git tag *), TodoWrite
---

Preserve session state for: $ARGUMENTS

Steps:

1. Gather context (run in parallel):
   - `git log --oneline -8`
   - `git status --short`
   - `git tag --sort=-creatordate | head -5`
   - Read `C:\Users\bsval\.claude\projects\C--Users-bsval-terrafusion-os-1-0\memory\MEMORY.md`

2. Synthesize into a session-end record covering exactly these fields:

   **Stopped at**: one sentence — last thing completed
   **What is true now**: 2–4 bullet points of confirmed facts (test counts, sealed commits, clean/dirty state)
   **Active variables**: anything in flight, unresolved, or partially done
   **Next smallest step**: the single most valuable action at the next session start
   **Risks not yet handled**: known gaps that could surprise the next session

3. Write the record to memory:
   - File: `C:\Users\bsval\.claude\projects\C--Users-bsval-terrafusion-os-1-0\memory\project_current_state.md`
   - Use the standard memory frontmatter format (type: project)
   - Overwrite the existing file — this is always the current-state snapshot

4. Update `MEMORY.md` index if the file description changed.

5. Print the written record to the conversation so the user can confirm it.

Rules:
- Do not invent facts. Only write what the git log and context confirm.
- Keep the "next smallest step" to one concrete action, not a list.
- If the tree is dirty, name the uncommitted files explicitly.
- Do not alter any other memory files unless asked.
