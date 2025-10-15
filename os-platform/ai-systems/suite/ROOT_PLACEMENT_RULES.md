# 🚨 AI Agent: Root Placement Quick Reference

## Before Creating ANY File - Check This First!

### ✅ CAN Go in Root (ONLY These):

- `package.json`, `tsconfig.json`, `vitest.config.ts`, etc. (build configs)
- `docker-compose.yml` (main only - no variants)
- `README.md`, `LICENSE`, `START_HERE.md` (max 3 docs)
- `.gitignore`, `.editorconfig`, `Makefile` (dev tools)

**Total in root should be ~25-30 files MAX**

---

## ❌ NEVER Put in Root:

| If It's A...          | Put It In...         | Examples                      |
| --------------------- | -------------------- | ----------------------------- |
| Status/completion doc | `docs/milestones/`   | ✅_COMPLETE.md, 🎊_SUCCESS.md |
| Dashboard/status      | `docs/operations/`   | _\_DASHBOARD.md, _\_STATUS.md |
| Report/analysis       | `docs/reports/`      | _\_REPORT.md, _\_AUDIT.md     |
| Phase document        | `docs/phases/`       | PHASE\_\*.md                  |
| Guide                 | `docs/guides/`       | \*\_GUIDE.md, NEXT_STEPS.md   |
| Architecture doc      | `docs/architecture/` | _ARCHITECTURE_.md             |
| AI config             | `config/ai/`         | ai-_.json, claude-_.js        |
| County config         | `config/counties/`   | \*-county-config.json         |
| Docker variant        | `config/docker/`     | docker-compose.\*.yml         |
| Script                | `scripts/`           | _.ps1, _.sh, \*.py            |
| Design file           | `design/`            | design-_.html, _.css          |
| Workflow              | `.github/workflows/` | _workflow_.yml                |
| Data/output           | `data/temp/`         | _.json, _.log, _run_.txt      |

---

## 🤖 AI Quick Check:

```
Is it needed to BUILD the project? → Root ✅
Is it DOCUMENTATION? → docs/ 📚
Is it a SCRIPT? → scripts/ 🔧
Is it CONFIG? → config/ ⚙️
Is it TEMPORARY? → Don't create or use data/temp/ 🗑️
```

**Default: When in doubt → ASK USER, don't use root!**

---

## Common Mistakes to Avoid:

```plaintext
❌ Creating completion docs in root
❌ Creating PowerShell scripts in root
❌ Creating docker-compose variants in root
❌ Creating any file with emojis in root
❌ Creating *_GUIDE.md files in root
❌ Creating status dashboards in root
```

---

**Remember:** A messy root = unprofessional project. Keep it clean!
