# VS Code AI Orchestration (TerraFusion)

> **Rule:** One driver AI at a time. Claude Code is the operator, not the
> driver.

---

## The Problem

Running multiple AI assistants simultaneously causes:

- **RAM contention:** Each maintains its own index/embeddings
- **CPU spikes:** Background analysis competes with builds
- **Context confusion:** Multiple AIs offering conflicting suggestions
- **Extension conflicts:** Keybindings and inline suggestions collide

Your baseline shows **196 extensions** including multiple AI tools. This is a
resource multiplier.

---

## AI Role Definitions

### Driver AI (ONE active at a time)

The inline suggestion engine. Provides completions as you type.

| Driver             | Use Case     | Enable When               |
| ------------------ | ------------ | ------------------------- |
| **GitHub Copilot** | Daily coding | Default for routine work  |
| **Codex/GPT**      | Deep codegen | Heavy generation sessions |

### Operator AI (Invoked explicitly)

Multi-file refactoring, architecture changes, command execution.

| Operator        | Use Case         | Enable When                    |
| --------------- | ---------------- | ------------------------------ |
| **Claude Code** | Large refactors  | Explicitly invoked via command |
| **Cursor**      | Multi-file edits | Alternative to Claude Code     |

---

## Profiles

### Profile 1: TerraFusion Core (Daily Driver)

**Goal:** Maximum stability, low background CPU, fast response

**Enabled:**

- ✅ Remote - WSL
- ✅ ESLint / Prettier
- ✅ Rust Analyzer
- ✅ Docker
- ✅ GitLens (background refresh OFF)
- ✅ **Copilot (inline ON)**

**Disabled:**

- ❌ Codex/GPT inline
- ❌ Import Cost
- ❌ Bracket Pair Colorizer 2 (use native)
- ❌ Rainbow Brackets (use native)
- ❌ Blockman
- ❌ Extra todo extensions (keep ONE)

**Settings:**

```json
{
  "editor.inlineSuggest.enabled": true,
  "github.copilot.enable": { "*": true }
}
```

---

### Profile 2: TerraFusion Refactor (Claude Code)

**Goal:** Multi-file operations, architecture changes

**When to use:**

- Renaming across codebase
- Moving modules between packages
- Large-scale API changes
- Test generation for multiple files

**Enabled:**

- ✅ Claude Code extension
- ✅ Copilot (inline OFF, chat ON)
- ✅ Git tools for diff review

**Disabled:**

- ❌ Heavy background indexers
- ❌ Other inline AI suggestions

**Operating pattern:**

1. Switch to Refactor profile
2. Invoke Claude Code explicitly
3. Review changes
4. Switch back to Core profile

---

### Profile 3: TerraFusion AI Lab (Local Inference)

**Goal:** Run local models without destabilizing dev

**When to use:**

- Testing local LLMs (Ollama, llama.cpp)
- Running inference benchmarks
- Evaluating model outputs

**Resource isolation:**

- Uses `ops/ai/compose.ai.yml`
- Hard memory limit: 8GB
- Optional GPU passthrough

**Enabled:**

- ✅ AI inference tools
- ✅ Notebook extensions
- ✅ Codex (for comparison)

**Disabled:**

- ❌ Copilot (to avoid conflicts)
- ❌ Background indexers

---

## Extension Audit Results

### Must Disable (Redundant/Deprecated)

| Extension                            | Reason     | Alternative                                     |
| ------------------------------------ | ---------- | ----------------------------------------------- |
| `coenraads.bracket-pair-colorizer-2` | Deprecated | Native `editor.bracketPairColorization.enabled` |
| `2gua.rainbow-brackets`              | Redundant  | Native bracket colorization                     |

### Consider Disabling (Heavy on Monorepos)

| Extension                 | Impact                  | Alternative                  |
| ------------------------- | ----------------------- | ---------------------------- |
| `wix.vscode-import-cost`  | Analyzes every import   | Disable during builds        |
| `leodevbro.blockman`      | Heavy visual processing | Disable if UI lags           |
| Duplicate todo extensions | Pick ONE                | Keep `gruntfuggly.todo-tree` |

### AI Extensions Audit

| Extension               | Role     | Recommendation               |
| ----------------------- | -------- | ---------------------------- |
| `github.copilot`        | Driver   | ✅ Keep (primary)            |
| `anthropic.claude-code` | Operator | ✅ Keep (explicit invoke)    |
| `openai.chatgpt`        | Driver   | ⚠️ Disable inline, keep chat |

---

## Extension Count Target

| Category        | Current | Target                |
| --------------- | ------- | --------------------- |
| Total Installed | 196     | 196 (keep installed)  |
| **Enabled**     | ~196    | **≤ 80**              |
| AI (active)     | ~3      | 1 driver + 1 operator |
| Visual/Heavy    | ~10     | ≤ 3                   |

---

## Profile Switching

### Via Command Palette

1. `Ctrl+Shift+P` → "Profiles: Switch Profile"
2. Select: Core / Refactor / AI Lab

### Via Settings Sync

Create workspace settings that override:

```json
// .vscode/profiles/core.json
// .vscode/profiles/refactor.json
// .vscode/profiles/ailab.json
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│  AI Orchestration Quick Reference                           │
├─────────────────────────────────────────────────────────────┤
│  CORE PROFILE (daily)                                       │
│    Driver: Copilot                                          │
│    Operator: Claude Code (explicit)                         │
│    Goal: Fast, stable, low CPU                              │
├─────────────────────────────────────────────────────────────┤
│  REFACTOR PROFILE (sessions)                                │
│    Driver: None (inline OFF)                                │
│    Operator: Claude Code (active)                           │
│    Goal: Multi-file changes                                 │
├─────────────────────────────────────────────────────────────┤
│  AI LAB PROFILE (inference)                                 │
│    Driver: Codex                                            │
│    Operator: Local models                                   │
│    Goal: Isolated compute                                   │
└─────────────────────────────────────────────────────────────┘
```
