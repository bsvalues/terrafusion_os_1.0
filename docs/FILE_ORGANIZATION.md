# Terrafusion OS - File Organization Standards

## 🎯 Purpose
This document establishes clear rules for file organization to prevent the root directory from becoming cluttered with temporary files, prototypes, and experiments.

## 📁 Directory Structure

### Root Directory - KEEP CLEAN!
**Only these files belong in root:**
- Core documentation: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`
- Development guides: `START_HERE.md`, `TEST_REGISTRY.md`, `CLAUDE*.md`
- Essential config: `package.json`, `tsconfig.json`, `vitest.config.ts`, etc.
- Build files: `Makefile`, `.editorconfig`, `.gitignore`

### Organized Directories

#### `/backend/` - .NET Backend Services
```
backend/
├── Terrafusion.API/          # Main API project
├── Terrafusion.Core/         # Business logic
├── Terrafusion.Data/         # Data access
├── Terrafusion.AI/           # AI services
└── ai-models/                # County-specific models
```

#### `/frontend/` - React Frontend
```
frontend/
├── src/                      # React source code
├── electron/                 # Desktop app wrapper
├── public/                   # Static assets
└── dist/                     # Build output
```

#### `/modules/` - Government Applications
```
modules/
├── [module-name]/            # Individual modules
├── testing-suite/            # Real module tests
└── commercial-suite/         # Commercial offerings
```

#### `/docs/` - Documentation
```
docs/
├── reports/                  # Analysis and audit reports
├── analysis/                 # Deep dive analysis files
├── deployment/               # Deployment guides and checklists
└── *.md                      # Other documentation
```

#### `/tools/` - Development Tools
```
tools/
├── prototypes/               # Quick prototypes and standalone tests
├── demos/                    # Demo pages and showcase files
└── utilities/                # Helper scripts and tools
```

#### `/config/` - Configuration Files
```
config/
├── mcp/                      # MCP configuration
├── security/                 # Security configurations
└── deployment/               # Deployment configurations
```

#### `/archive/` - Archived Content
```
archive/
├── experiments/              # Failed experiments and old code
├── prompts-and-ideas/        # AI prompts and brainstorming
└── deprecated/               # Deprecated code
```

#### `/testing/` - Test Infrastructure
```
testing/
├── config/                   # Test configurations
├── scripts/                  # Test execution scripts
└── advanced/                 # Advanced testing strategies
```

#### `/scripts/` - Build and Automation
```
scripts/
├── production/               # Production deployment scripts
├── maintenance/              # Maintenance scripts
└── *.sh, *.ps1, *.mjs       # Various automation scripts
```

## 🚫 What NOT to Put in Root

### Absolutely Forbidden in Root:
- ❌ Temporary files (`*.tmp.*`, `debug-*.js`)
- ❌ Test discovery dumps (`test-discovery-*/`)
- ❌ Experimental TypeScript files (`experimental-*.ts`)
- ❌ Prototype C# files (`prototype-*.cs`)
- ❌ Mock backends (`simple-mock-backend.js`)
- ❌ Demo HTML files (`demo-*.html`)
- ❌ AI-generated experiments
- ❌ Loose TypeScript orchestrator files

### Use These Locations Instead:
- 🔧 **Prototypes** → `/tools/prototypes/`
- 🎨 **Demos** → `/tools/demos/`
- 🧪 **Experiments** → `/archive/experiments/`
- 🔧 **Utilities** → `/tools/utilities/`
- 📝 **Prompts/Ideas** → `/archive/prompts-and-ideas/`

## 📝 File Naming Conventions

### Good File Names:
- `PropertyService.cs` (clear, descriptive)
- `user-management.component.ts` (kebab-case for frontend)
- `benton-county-config.json` (specific purpose)

### Bad File Names:
- `temp-file.js` (temporary)
- `test123.ts` (non-descriptive)
- `experimental-quantum-consciousness.ts` (belongs in archive)
- `simple-mock-backend.js` (utility, not root)

## 🛡️ Enforcement

### Git Ignore Rules
The `.gitignore` file now prevents adding loose files to root:
- Blocks `/*.ts`, `/*.js`, `/*.cs` in root
- Allows specific essential files like `package.json`
- Prevents test discovery dumps
- Blocks temporary and experimental files

### Development Workflow
1. **Before creating files in root** → Ask: "Does this belong here?"
2. **For prototypes** → Use `/tools/prototypes/`
3. **For experiments** → Use `/archive/experiments/`
4. **For documentation** → Use `/docs/`
5. **For configurations** → Use `/config/`

## 🎯 Benefits of This Organization

### Clean Root Directory
- Professional appearance
- Easy navigation
- Clear project structure
- Faster file location

### Better Development Experience
- No hunting through clutter
- Clear separation of concerns
- Easier onboarding for new developers
- Maintainable codebase

### Prevented Issues
- ❌ Jest haste map collisions
- ❌ Build tool confusion
- ❌ Package resolution issues
- ❌ Merge conflicts from temp files

## 🚨 Emergency Cleanup

If root gets cluttered again:

1. **Audit files**: `find . -maxdepth 1 -type f -name "*.ts" -o -name "*.js" -o -name "*.cs"`
2. **Move to appropriate locations** using this guide
3. **Update .gitignore** if needed
4. **Document any new patterns** to prevent recurrence

## 📋 Checklist for New Files

Before adding any file to the project:

- [ ] Is this going in the correct directory?
- [ ] Does the filename follow conventions?
- [ ] Is this a temporary file that should be excluded?
- [ ] Will this file cause build issues if misplaced?
- [ ] Is this documented if it's a new pattern?

---

**Remember: A clean, organized codebase is a maintainable codebase!**