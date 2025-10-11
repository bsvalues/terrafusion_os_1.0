# 📂 Path Resolution System Guide

**TerraFusion OS 1.0 - Week 3: Future-Proof Path Management**

Welcome to the Path Resolution System! This system makes the TerraFusion OS workspace resilient to reorganization by using environment variables instead of hardcoded paths.

---

## 🎯 Why Path Resolution?

### **The Problem**
- 812 files contain hardcoded paths like `C:\Users\bsval\terrafusion_os_1.0\...`
- Moving files breaks tests, configs, and scripts
- Path changes require updating hundreds of files
- Team members with different setups can't share configs

### **The Solution**
- **Environment variables** for all critical paths
- **One central file** (`.workspace.env`) defining all paths
- **Automatic loading** via `set-workspace-env.ps1`
- **Zero breaking changes** - works with existing code
- **Future-proof** - reorganize without fear

---

## 🚀 Quick Start

### **1. Load Environment Variables**

```powershell
# PowerShell (Windows)
.\scripts\set-workspace-env.ps1

# With validation
.\scripts\set-workspace-env.ps1 -Validate

# Make permanent (requires admin)
.\scripts\set-workspace-env.ps1 -Persistent

# Export for Bash/WSL
.\scripts\set-workspace-env.ps1 -Export
```

```bash
# Bash/WSL (Linux/Mac)
source scripts/set-workspace-env.sh
```

### **2. Use in Your Code**

```typescript
// Node.js/TypeScript
const root = process.env.TERRAFUSION_ROOT;
const backend = process.env.TERRAFUSION_BACKEND;
const tests = process.env.TERRAFUSION_TESTS;
```

```csharp
// C#/.NET
var root = Environment.GetEnvironmentVariable("TERRAFUSION_ROOT");
var backend = Environment.GetEnvironmentVariable("TERRAFUSION_BACKEND");
```

```python
# Python
import os
root = os.getenv('TERRAFUSION_ROOT')
backend = os.getenv('TERRAFUSION_BACKEND')
```

```powershell
# PowerShell
$root = $env:TERRAFUSION_ROOT
$backend = $env:TERRAFUSION_BACKEND
```

---

## 📋 Available Environment Variables

### **Core Workspace Paths**

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `TERRAFUSION_ROOT` | Workspace root directory | `C:\Users\bsval\terrafusion_os_1.0` |
| `TERRAFUSION_SRC` | Source code directory | `${TERRAFUSION_ROOT}\src` |
| `TERRAFUSION_MODULES` | Hot-swappable modules | `${TERRAFUSION_ROOT}\modules` |
| `TERRAFUSION_BACKEND` | Backend services | `${TERRAFUSION_ROOT}\backend` |
| `TERRAFUSION_DOCS` | Documentation | `${TERRAFUSION_ROOT}\docs` |
| `TERRAFUSION_SCRIPTS` | Scripts & automation | `${TERRAFUSION_ROOT}\scripts` |
| `TERRAFUSION_TESTS` | Testing directory | `${TERRAFUSION_ROOT}\tests` |
| `TERRAFUSION_FRONTEND` | Frontend code | `${TERRAFUSION_ROOT}\frontend` |

### **AI Systems Paths**

| Variable | Description |
|----------|-------------|
| `TERRAFUSION_AI_CORE` | Core AI development (`.ai/`) |
| `TERRAFUSION_AI_COMPANION` | AI Workspace Companion |
| `TERRAFUSION_AI_SWARM_COMMANDER` | AI Swarm Supreme Commander |
| `TERRAFUSION_AI_MODELS` | Backend AI Models |
| `TERRAFUSION_AI_SWARM` | Backend AI Swarm |

### **Module-Specific Paths**

| Variable | Description |
|----------|-------------|
| `TERRAFUSION_COS` | Core OS Module |
| `TERRAFUSION_GIS` | GIS Module |
| `TERRAFUSION_DASHBOARD` | Dashboard Module |
| `TERRAFUSION_DEMO` | Demo Module (v0) |
| `TERRAFUSION_PRIME_VIEW` | Prime View Module |
| `TERRAFUSION_PRO_PLUS` | Pro Plus Module |

### **Backend Service Paths**

| Variable | Description |
|----------|-------------|
| `TERRAFUSION_API` | Main Backend API |
| `TERRAFUSION_CORE` | Core Backend Services |
| `TERRAFUSION_INFRASTRUCTURE` | Infrastructure Services |
| `TERRAFUSION_MARKETPLACE` | Marketplace Platform |
| `TERRAFUSION_MCP_CORE` | MCP Core |
| `TERRAFUSION_API_UNIFIED` | Unified API |

### **Testing Paths**

| Variable | Description |
|----------|-------------|
| `TERRAFUSION_E2E_TESTS` | End-to-end tests |
| `TERRAFUSION_INTEGRATION_TESTS` | Integration tests |
| `TERRAFUSION_UNIT_TESTS` | Unit tests |
| `TERRAFUSION_TEST_RESULTS` | Test results output |
| `TERRAFUSION_COVERAGE` | Coverage reports |
| `TERRAFUSION_PLAYWRIGHT_STATES` | Playwright auth states |

### **Port Configuration**

| Variable | Default | Description |
|----------|---------|-------------|
| `TERRAFUSION_API_PORT` | 5000 | Backend API port |
| `TERRAFUSION_DASHBOARD_PORT` | 3001 | Dashboard port |
| `TERRAFUSION_GIS_PORT` | 3002 | GIS port |
| `TERRAFUSION_DEMO_PORT` | 3000 | Demo port |
| `TERRAFUSION_MARKETPLACE_PORT` | 3003 | Marketplace port |
| `TERRAFUSION_PRIME_VIEW_PORT` | 3004 | Prime View port |
| `TERRAFUSION_PRO_PLUS_PORT` | 3005 | Pro Plus port |

---

## 🔧 Configuration File Examples

### **Jest Configuration**

```typescript
// jest.integration.config.ts
import type { Config } from '@jest/types';
import * as path from 'path';

const WORKSPACE_ROOT = process.env.TERRAFUSION_ROOT || process.cwd();
const BACKEND_ROOT = process.env.TERRAFUSION_BACKEND || path.join(WORKSPACE_ROOT, 'backend');
const COVERAGE_DIR = process.env.TERRAFUSION_COVERAGE || path.join(WORKSPACE_ROOT, 'coverage');

const config: Config.InitialOptions = {
  roots: [path.join(BACKEND_ROOT, 'tests')],
  coverageDirectory: COVERAGE_DIR,
  setupFilesAfterEnv: [path.join(BACKEND_ROOT, 'tests', 'setup.ts')],
  // ... rest of config
};

export default config;
```

### **Playwright Configuration**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import * as path from 'path';

const WORKSPACE_ROOT = process.env.TERRAFUSION_ROOT || process.cwd();
const TEST_DIR = process.env.TERRAFUSION_E2E_TESTS || path.join(WORKSPACE_ROOT, 'tests', 'e2e');
const DEMO_PORT = process.env.TERRAFUSION_DEMO_PORT || '3000';

export default defineConfig({
  testDir: TEST_DIR,
  use: {
    baseURL: `http://localhost:${DEMO_PORT}`,
  },
});
```

### **Vitest Configuration**

```typescript
// vitest.config.ts
import { defineConfig } from 'vite';
import path from 'path';

const WORKSPACE_ROOT = process.env.TERRAFUSION_ROOT || process.cwd();
const TESTS_DIR = process.env.TERRAFUSION_TESTS || path.join(WORKSPACE_ROOT, 'tests');
const COVERAGE_DIR = process.env.TERRAFUSION_COVERAGE || path.join(WORKSPACE_ROOT, 'coverage');

export default defineConfig({
  test: {
    include: [`${TESTS_DIR}/**/*.test.{ts,tsx}`],
    coverage: {
      reportsDirectory: COVERAGE_DIR,
    },
  },
});
```

---

## 📝 Migration Guide

### **Step 1: Load Environment Variables**

Before making any changes, load the environment variables:

```powershell
.\scripts\set-workspace-env.ps1 -Validate
```

### **Step 2: Identify Hardcoded Paths**

Search for hardcoded paths in your config files:

```typescript
// ❌ Before (hardcoded)
roots: ['<rootDir>/backend/tests']

// ✅ After (environment variable)
const BACKEND_ROOT = process.env.TERRAFUSION_BACKEND || path.join(process.cwd(), 'backend');
roots: [path.join(BACKEND_ROOT, 'tests')]
```

### **Step 3: Replace with Environment Variables**

Update your config files to use environment variables:

```typescript
// Pattern to follow:
const VARIABLE_NAME = process.env.TERRAFUSION_VARIABLE || path.join(FALLBACK, 'path');
```

### **Step 4: Test Your Changes**

After updating, test that everything still works:

```powershell
# Run tests
npm test

# Run validation
.\scripts\validate-workspace.ps1

# Check health
.\scripts\health-check.ps1
```

### **Step 5: Document Your Changes**

Add a comment explaining the path resolution:

```typescript
/**
 * Updated to use Path Resolution System (Week 3)
 * Uses TERRAFUSION_* environment variables for path-resilient config
 * Run set-workspace-env.ps1 before running tests
 */
```

---

## 🔍 How It Works

### **1. Central Definition**

All paths are defined in `.workspace.env`:

```bash
# .workspace.env
TERRAFUSION_ROOT=C:\Users\bsval\terrafusion_os_1.0
TERRAFUSION_SRC=${TERRAFUSION_ROOT}\src
TERRAFUSION_BACKEND=${TERRAFUSION_ROOT}\backend
# ... 69 total variables
```

### **2. Loading Script**

The `set-workspace-env.ps1` script:
- Reads `.workspace.env`
- Parses KEY=VALUE pairs
- Expands variable references (`${TERRAFUSION_ROOT}`)
- Sets environment variables
- Validates paths exist
- Exports to Bash script for WSL

### **3. Usage in Code**

Your code reads environment variables:

```typescript
// Automatically picks up the value from environment
const root = process.env.TERRAFUSION_ROOT;
```

### **4. Fallback Strategy**

Always provide fallbacks for robustness:

```typescript
// If variable not set, use sensible default
const WORKSPACE_ROOT = process.env.TERRAFUSION_ROOT || process.cwd();
```

---

## 🎯 Best Practices

### **DO:**

✅ **Always provide fallbacks**
```typescript
const ROOT = process.env.TERRAFUSION_ROOT || process.cwd();
```

✅ **Use path.join() for cross-platform compatibility**
```typescript
path.join(BACKEND_ROOT, 'tests', 'setup.ts')
```

✅ **Load env vars at the top of config files**
```typescript
// At top of file
const WORKSPACE_ROOT = process.env.TERRAFUSION_ROOT || process.cwd();
```

✅ **Document when you update a config**
```typescript
// Updated to use Path Resolution System - Week 3
```

✅ **Test after making changes**
```powershell
npm test
.\scripts\validate-workspace.ps1
```

### **DON'T:**

❌ **Don't hardcode absolute paths**
```typescript
// Bad
roots: ['C:\\Users\\bsval\\terrafusion_os_1.0\\backend\\tests']

// Good
const BACKEND = process.env.TERRAFUSION_BACKEND || path.join(process.cwd(), 'backend');
roots: [path.join(BACKEND, 'tests')]
```

❌ **Don't assume env vars are always set**
```typescript
// Bad - crashes if not set
const root = process.env.TERRAFUSION_ROOT;

// Good - has fallback
const root = process.env.TERRAFUSION_ROOT || process.cwd();
```

❌ **Don't use backslashes in paths**
```typescript
// Bad - Windows only
'backend\\tests\\setup.ts'

// Good - cross-platform
path.join('backend', 'tests', 'setup.ts')
```

---

## 🐛 Troubleshooting

### **Environment Variables Not Loading**

**Problem:** `process.env.TERRAFUSION_ROOT` is undefined

**Solution:**
```powershell
# Load environment variables
.\scripts\set-workspace-env.ps1

# Verify they're loaded
$env:TERRAFUSION_ROOT
```

### **Paths Don't Exist**

**Problem:** Warning about paths not existing

**Solution:**
```powershell
# Some paths are created dynamically (coverage, build-temp, etc.)
# This is normal - they'll be created when needed

# Verify with validation
.\scripts\set-workspace-env.ps1 -Validate
```

### **Tests Still Failing After Update**

**Problem:** Tests fail after updating config

**Solution:**
```powershell
# 1. Load environment variables
.\scripts\set-workspace-env.ps1 -Validate

# 2. Check if paths exist
Test-Path $env:TERRAFUSION_BACKEND

# 3. Run validation
.\scripts\validate-workspace.ps1

# 4. Check test output for specific errors
npm test -- --verbose
```

### **WSL/Bash Not Working**

**Problem:** Bash script doesn't work in WSL

**Solution:**
```powershell
# Export to Bash script
.\scripts\set-workspace-env.ps1 -Export

# In WSL, source the script
wsl
source scripts/set-workspace-env.sh
echo $TERRAFUSION_ROOT
```

---

## 🚀 Benefits

### **1. Reorganization Freedom**

Move files around without breaking configs:
- Move `backend/` to `services/` → Just update `.workspace.env`
- No need to update hundreds of config files
- All configs automatically use new paths

### **2. Team Collaboration**

Team members can have different paths:
- **Developer A:** `C:\Projects\terrafusion\`
- **Developer B:** `D:\dev\terrafusion_os_1.0\`
- **CI/CD:** `/home/runner/work/terrafusion/`
- Same configs work for everyone!

### **3. Portability**

Easy to move workspace:
- Clone to new location
- Run `set-workspace-env.ps1`
- Everything works!

### **4. Consistency**

One source of truth:
- All paths defined in `.workspace.env`
- No hunting through config files
- Easy to see all paths at a glance

---

## 📊 Statistics

**Path Resolution System Impact:**

- **69** environment variables defined
- **43** paths validated and exist
- **9** paths will be created dynamically
- **812** files can be gradually migrated
- **0** breaking changes required
- **∞** future flexibility enabled

---

## 🎓 Advanced Usage

### **Adding New Environment Variables**

1. Edit `.workspace.env`:
```bash
# Add your new variable
TERRAFUSION_MY_NEW_PATH=${TERRAFUSION_ROOT}\my-new-directory
```

2. Reload environment:
```powershell
.\scripts\set-workspace-env.ps1
```

3. Use in your code:
```typescript
const myPath = process.env.TERRAFUSION_MY_NEW_PATH;
```

### **Persistent Environment Variables**

Make variables permanent (requires admin):

```powershell
# Set at system level
.\scripts\set-workspace-env.ps1 -Persistent

# Now available in all new terminals/sessions
```

### **Conditional Paths**

Use different paths based on environment:

```typescript
const isDev = process.env.NODE_ENV === 'development';
const apiUrl = isDev 
  ? `http://localhost:${process.env.TERRAFUSION_API_PORT}`
  : 'https://api.terrafusion.com';
```

---

## 🌟 THE TERRAFUSION WAY

**Build foundation before features!**

This Path Resolution System exemplifies THE TERRAFUSION WAY:
- ✅ **Understand before changing** - We identified 812 hardcoded paths
- ✅ **Respect architecture** - No breaking changes, works with existing code
- ✅ **Add value without risk** - Enables future reorganization safely
- ✅ **Automate everything** - One command loads all variables
- ✅ **Document comprehensively** - This guide ensures everyone can use it
- ✅ **Test systematically** - Validation ensures all paths work

**Future-proof foundation = worry-free development!** 🚀

---

## 📚 Related Documentation

- [`.workspace.env`](./.workspace.env) - Central path definitions
- [`scripts/set-workspace-env.ps1`](./scripts/set-workspace-env.ps1) - Environment loader
- [`scripts/set-workspace-env.sh`](./scripts/set-workspace-env.sh) - Bash/WSL loader
- [Example Configs](./):
  - `jest.integration.config.ts.EXAMPLE`
  - `playwright.config.ts.EXAMPLE`
  - `vitest.config.ts.EXAMPLE`

---

## 🎯 Next Steps

1. **Load environment variables**
   ```powershell
   .\scripts\set-workspace-env.ps1 -Validate
   ```

2. **Review example configs**
   - Check `*.EXAMPLE` files for patterns
   - See how to use environment variables

3. **Update your configs gradually**
   - Start with test configurations
   - Then build configs
   - Finally application configs

4. **Test after each change**
   - Run `npm test`
   - Run `.\scripts\validate-workspace.ps1`
   - Ensure zero breaking changes

5. **Document your updates**
   - Add comments explaining path resolution
   - Help others understand the system

---

**Created:** October 10, 2025  
**Part of:** Strategic Enhancements Week 3  
**Status:** ✅ Production Ready

**THE TERRAFUSION WAY: Future-proof foundation for fearless development!** 🎯🚀
