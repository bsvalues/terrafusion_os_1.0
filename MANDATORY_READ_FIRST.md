# ⚠️ MANDATORY READ FIRST - START HERE EVERY SESSION
## Stop Making the Same Mistakes

**This file exists because we keep making the same errors every session despite having AI infrastructure.**

---

## ✅ **WHAT ALREADY EXISTS - DON'T RECREATE!**

### **1. Elite Rust Performance Engine** ✅ COMPILED
```
Location: rust-performance-engine/target/release/
Status:   ✅ ALREADY BUILT (16+ compiled crates)

Crates:
- libagent_coordination.rlib (50,000 AI agents)
- libgeospatial_engine.rlib (GIS processing)
- libvaluation_kernel.rlib (Property assessment)  
- libsecurity_layer.rlib (FISMA/NIST security)
- libperformance_monitor.rlib (Metrics)
- libffi_bridge.dll (FFI to .NET)
- Plus 10+ more crates

DO NOT:
❌ Create new Rust services
❌ Build new FFI bridges
❌ Duplicate this functionality

DO:
✅ USE the existing compiled crates
✅ Link to libffi_bridge.dll from .NET
✅ Read rust-performance-engine/ documentation
```

### **2. Frontend** ✅ PRODUCTION READY
```
Location: frontend/
Status:   ✅ React 18 + Vite + Material-UI
Build:    npm run build (outputs to native-shell/ui/)
Dev:      npm run dev (port 3000)

DO NOT:
❌ Create new frontend implementations
❌ Ignore existing components
❌ Build parallel frontends

DO:
✅ USE frontend/ (most recent: Oct 1, 2025)
✅ Check frontend/src/components/ for existing code
✅ Build to native-shell/ui/ for native shell
```

### **3. Backend** ✅ .NET 8.0 API
```
Location: backend/TerraFusion.API/
Status:   ✅ .NET Core API Gateway
Port:     5000
DB:       PostgreSQL (5432) OR SQLite fallback

DO NOT:
❌ Add conflicting types
❌ Create duplicate controllers
❌ Change interfaces without understanding

DO:
✅ Run npm run dev (starts backend + frontend)
✅ Check if PostgreSQL is running first
✅ Use SQLite fallback if Postgres unavailable
```

---

## 🚀 **CORRECT STARTUP SEQUENCE**

### **Step 1: Check What's Running**
```powershell
# Kill any stuck processes
Get-Process | Where-Object {$_.ProcessName -like "*dotnet*" -or $_.ProcessName -like "*node*"} | Stop-Process -Force

# Check ports
Get-NetTCPConnection -LocalPort 5000,3000,5432 -ErrorAction SilentlyContinue
```

### **Step 2: Start Database** (If needed)
```powershell
# PostgreSQL via Docker (recommended)
docker-compose up -d postgres

# OR use SQLite fallback (works without Postgres)
# Backend automatically falls back to SQLite
```

### **Step 3: Start TerraFusion**
```bash
npm run dev
```

**That's it. It's documented in package.json line 11.**

---

## 🤖 **WHY THIS KEEPS HAPPENING**

**Problem**: AI agents don't check what exists BEFORE building new stuff

**Solution**: Update AI training to MANDATE these checks:

1. **BEFORE creating Rust services**: Check rust-performance-engine/
2. **BEFORE creating frontend**: Check frontend/ and native-shell/ui/
3. **BEFORE modifying backend**: Check git status and existing types
4. **BEFORE anything**: Run workspace companion diagnostics

---

## 📋 **MANDATORY CHECKLIST FOR AI AGENTS**

**Before ANY code changes**:
- [ ] Read CLAUDE.md (line 1-100)
- [ ] Read AI_AGENT_START_HERE.md
- [ ] Check rust-performance-engine/target/release/ for existing Rust
- [ ] Check frontend/ for existing React code
- [ ] Run `git status` to see what's changed
- [ ] Use workspace companion `.diagnostics`
- [ ] Search codebase for similar functionality
- [ ] Verify nothing similar exists BEFORE creating new

**If duplicating existing work**: ❌ STOP - USE what exists!

---

## 🎯 **WHAT TO DO RIGHT NOW**

```bash
# 1. Kill stuck processes
taskkill /F /IM dotnet.exe /IM node.exe 2>nul

# 2. Run TerraFusion (documented command)
npm run dev

# 3. Access
# Backend: http://localhost:5000/api/health
# Frontend: http://localhost:3000
```

**If PostgreSQL connection fails**: It falls back to SQLite automatically.

---

**This file should prevent the "why do we do this every day" problem.**

**READ THIS FIRST. EVERY SESSION. NO EXCEPTIONS.**


