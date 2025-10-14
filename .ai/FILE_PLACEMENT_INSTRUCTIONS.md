# AI Instructions: Root Directory Policy

## CRITICAL: File Placement Rules

When creating ANY file in the TerraFusion OS workspace, you MUST follow these rules:

### Quick Decision Tree:

```
┌─ Is it needed to BUILD the project? (package.json, tsconfig.json, etc.)
│  └─ YES → Root is OK ✅
│
├─ Is it the MAIN docker-compose.yml?
│  └─ YES → Root is OK ✅
│
├─ Is it README.md, LICENSE, or START_HERE.md?
│  └─ YES → Root is OK ✅
│
└─ EVERYTHING ELSE → Use subdirectories! ❌ NOT in root
```

### File Placement Table:

| If creating... | Place in... |
|---------------|-------------|
| Status/completion doc | `docs/milestones/` |
| Dashboard/status report | `docs/operations/` |
| Analysis/audit report | `docs/reports/` |
| Phase document | `docs/phases/` |
| Guide/how-to | `docs/guides/` |
| Architecture doc | `docs/architecture/` |
| AI configuration | `config/ai/` |
| County configuration | `config/counties/` |
| Docker compose variant | `config/docker/` |
| PowerShell script | `scripts/admin/` |
| Python script | `scripts/` |
| Design/demo file | `design/` |
| Workflow file | `.github/workflows/` |
| Temporary data | `data/temp/` |

### NEVER Create These in Root:

- ❌ Files with emojis (✅, 🎊, 🚀, 🎯, etc.)
- ❌ *_COMPLETE.md, *_SUCCESS.md, *_READY.md
- ❌ *_DASHBOARD.md, *_STATUS.md
- ❌ *_REPORT.md, *_AUDIT.md, *_ANALYSIS.md
- ❌ PHASE_*.md
- ❌ *_GUIDE.md (except START_HERE.md)
- ❌ docker-compose.*.yml (variants)
- ❌ *.ps1, *.sh, *.py (scripts)
- ❌ ai-*.json, *-config.json
- ❌ design-*.html, *.css

### When Creating Files:

1. **ALWAYS** check the placement table first
2. **NEVER** assume root is appropriate
3. **ASK** the user if unsure
4. **DEFAULT** to using a subdirectory when in doubt

### Reference Documents:

- Full policy: `docs/ROOT_DIRECTORY_POLICY.md`
- Quick reference: `.ai/ROOT_PLACEMENT_RULES.md`
- Organization summary: `docs/ROOT_ORGANIZATION_SUMMARY.md`

### Example - WRONG:

```typescript
// ❌ WRONG - Creates file in root
await createFile({
  filePath: "✅_TASK_COMPLETE.md",
  content: "..."
});
```

### Example - CORRECT:

```typescript
// ✅ CORRECT - Uses proper subdirectory
await createFile({
  filePath: "docs/milestones/task-complete.md",
  content: "..."
});
```

## Summary for AI Agents:

**Root should have ~25-30 files ONLY - essential configs, main docker-compose, and core docs.**

**Everything else belongs in organized subdirectories. When in doubt, ASK!**
