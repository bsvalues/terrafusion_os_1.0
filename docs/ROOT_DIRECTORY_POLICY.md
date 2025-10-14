# 🚫 ROOT DIRECTORY POLICY - CRITICAL FOR ALL AI AGENTS

## ⚠️ ATTENTION ALL AI ASSISTANTS

**This document establishes STRICT rules about what files can be placed in the
root directory of TerraFusion OS.**

When creating ANY file, you MUST check this document first. Violating these
rules creates organizational chaos.

---

## ✅ ONLY These Files Belong in Root

### Core Configuration (Required for Build/Run)

```
✓ package.json, package-lock.json
✓ tsconfig.json, tsconfig.eslint.json
✓ vitest.config.ts, playwright.config.ts, jest.integration.config.ts
✓ nodemon.json, stryker.conf.json
✓ .eslintrc.json, .eslintignore, .prettierrc, .lintstagedrc.json
✓ .editorconfig, .gitignore, .gitattributes, .gitmodules
✓ .npmrc, .nvmrc, .yamllint.yml
✓ global.json (for .NET)
✓ Makefile
```

### Docker & Deployment (Main Only)

```
✓ docker-compose.yml (MAIN ONLY - no variants)
✓ Dockerfile.frontend
✓ .dockerignore
```

### Core Documentation (3 files max)

```
✓ README.md
✓ LICENSE
✓ START_HERE.md (or similar single getting-started doc)
```

### Workspace Files

```
✓ TerraFusion_OS_1.0.code-workspace
✓ .workspace.env
```

### That's It! Total: ~25-30 files maximum

---

## ❌ NEVER Put These in Root

### Status/Completion Documents

```
❌ Any file with emojis (╔═══╗, ✅, 🎊, 🎯, 🚀)
❌ *_COMPLETE.md
❌ *_READY.md
❌ *_SUCCESS.md
❌ DAY_*.md
❌ EXECUTION_COMPLETE_*.md
❌ FINAL_*.md

→ Move to: docs/milestones/
```

### Dashboard/Status Files

```
❌ *_DASHBOARD.md
❌ *_DASHBOARD.txt
❌ *_STATUS.md
❌ *OPERATIONAL*.md
❌ *READINESS*.md

→ Move to: docs/operations/
```

### Reports & Analysis

```
❌ *_REPORT.md
❌ *_ANALYSIS.md
❌ *_AUDIT.md
❌ *_GAP_ANALYSIS.md
❌ *_CLEANUP_*.md
❌ *_INVESTIGATION*.md
❌ WORKSPACE_*.md

→ Move to: docs/reports/
```

### Phase Documents

```
❌ PHASE_*.md
❌ *_ORGANIZATION_PLAN*.md

→ Move to: docs/phases/
```

### Guides & How-Tos

```
❌ *_GUIDE.md (except START_HERE.md)
❌ LAUNCH_*.md
❌ NEXT_STEPS*.md
❌ *WORKFLOW*.md
❌ WHAT_TO_DO*.md
❌ *_JOURNEY.md
❌ *_WAY_*.md

→ Move to: docs/guides/
```

### Architecture Documents

```
❌ *ARCHITECTURE*.md
❌ *ECOSYSTEM*.md
❌ *DESIGN*.md

→ Move to: docs/architecture/
```

### Configuration Files

```
❌ ai-*.json
❌ *-config.json (except main docker-compose)
❌ claude-*.js
❌ prompt.json
❌ *-county-config.json
❌ .env.* (except .env, .env.example, .env.template)

→ Move to: config/ai/ or config/counties/ or config/docker/
```

### Docker Compose Variants

```
❌ docker-compose.*.yml (any variant)
❌ docker-compose.benton-county.yml
❌ docker-compose.production.yml
❌ etc.

→ Move to: config/docker/ or deployment/docker/
```

### Scripts

```
❌ *.ps1 (PowerShell scripts)
❌ *.sh (Shell scripts - except if in /scripts/)
❌ *.py (Python scripts)
❌ LAUNCH_*.ps1
❌ DEPLOY_*.ps1
❌ fix-*.py

→ Move to: scripts/admin/ or scripts/data/ or scripts/deployment/
```

### Design/Demo Files

```
❌ design-*.html
❌ design-*.css
❌ *-demo.html
❌ *_SHOWCASE.html
❌ ui-server.js

→ Move to: design/ or frontend/public/demos/
```

### Workflow Files

```
❌ *workflow*.yml
❌ .github/workflows content in root

→ Move to: .github/workflows/
```

### Data/Output Files

```
❌ jobs*.json
❌ jobs*.txt
❌ *run*.json
❌ *run*.txt
❌ *.log
❌ validation_output.txt
❌ msg.txt
❌ merge_message.txt

→ Move to: data/temp/ or delete if obsolete
```

### Random Text Files

```
❌ Any *.txt file (except LICENSE.txt if needed)
❌ Random notes
❌ AI conversation logs
❌ Brainstorming files

→ Move to: archive/text-files/ or delete
```

### Test Files

```
❌ test-*.ts
❌ test-*.js
❌ *-test.ts
❌ experimental-*.ts

→ Move to: tests/ or tools/prototypes/
```

---

## 🤖 AI Agent Instructions

### Before Creating ANY File:

1. **Check Location First**

   ```
   Is this a core config file? → Root
   Is this a status/completion doc? → docs/milestones/
   Is this a guide? → docs/guides/
   Is this a script? → scripts/
   Is this configuration? → config/
   Is this a report? → docs/reports/
   Is this temporary? → data/temp/ or don't create
   ```

2. **Ask These Questions**
   - Would a developer need this to build the project? (Yes → Root, No →
     elsewhere)
   - Is this documentation about what was done? (Yes → docs/)
   - Is this a tool or script? (Yes → scripts/ or tools/)
   - Is this configuration data? (Yes → config/)
   - Is this temporary/experimental? (Yes → Don't put in root!)

3. **Default Rule**

   ```
   IF IN DOUBT → DO NOT PUT IN ROOT

   Better to ask user where it should go than clutter root!
   ```

### When Creating Status/Completion Documents

**NEVER** create these in root:

```javascript
// ❌ WRONG
const filePath = '✅_TASK_COMPLETE.md';

// ✅ CORRECT
const filePath = 'docs/milestones/task-complete.md';
```

### When Creating Scripts

**NEVER** create these in root:

```powershell
# ❌ WRONG
$scriptPath = "Deploy-Something.ps1"

# ✅ CORRECT
$scriptPath = "scripts/deployment/deploy-something.ps1"
```

### When Creating Configuration

**NEVER** create these in root:

```typescript
// ❌ WRONG
const configPath = 'my-new-config.json';

// ✅ CORRECT
const configPath = 'config/my-new-config.json';
```

---

## 🛡️ Enforcement

### Automated Cleanup

A script runs regularly to move misplaced files:

```powershell
.\scripts\organize-root-files.ps1
```

### Git Ignore Rules

The `.gitignore` prevents committing many root-level patterns:

```gitignore
# Block loose files in root
/*.ts
/*.js
/*.cs
/*.html
/*.txt
/*.log

# Allow specific essential files
!package.json
!tsconfig.json
# etc.
```

---

## 📊 Root Directory Target State

**Current:** 200+ files in root (UNACCEPTABLE)  
**Target:** 25-30 files in root (PROFESSIONAL)

### Acceptable Root Structure:

```
/terrafusion_os_1.0/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── docker-compose.yml
├── README.md
├── LICENSE
├── START_HERE.md
├── Makefile
├── .gitignore
├── .editorconfig
├── (20-25 other essential config files)
│
├── backend/          ← .NET code
├── frontend/         ← React code
├── modules/          ← Gov modules
├── docs/             ← ALL DOCUMENTATION
├── config/           ← ALL CONFIGURATION
├── scripts/          ← ALL SCRIPTS
├── data/             ← Data files
├── tests/            ← Test files
├── deployment/       ← Deployment configs
├── tools/            ← Dev tools
└── archive/          ← Old stuff
```

---

## 🎯 Benefits of This Policy

### Professional Appearance

- Clean, organized root
- Easy to navigate
- Clear project structure
- Professional impression

### Developer Experience

- Find files quickly
- Understand project layout immediately
- No hunting through clutter
- Consistent across projects

### Maintainability

- Easy to onboard new developers
- Clear separation of concerns
- Reduced cognitive load
- Better IDE performance

---

## 📞 Questions?

If you're unsure where a file belongs:

1. Check this document first
2. Look at similar existing files
3. Ask the user before creating in root
4. When in doubt, use a subdirectory

**Remember: A clean root directory is a sign of a professional, well-maintained
project.**

---

## 🔄 Updates

This policy is enforced as of: **October 12, 2025**

AI agents MUST follow this policy for ALL file creation operations.

Violations will result in automatic cleanup and may cause confusion for users.

---

**Last Updated:** October 12, 2025  
**Enforced By:** All TerraFusion AI Assistants  
**Compliance:** MANDATORY
