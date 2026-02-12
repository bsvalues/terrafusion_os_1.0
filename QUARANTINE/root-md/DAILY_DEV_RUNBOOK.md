# 🚀 TerraFusion OS - Daily Dev Runbook
*"How to use this thing" - Simple checklist you can follow without thinking*

## 🎯 Reality Check: What Actually Works

✅ **Workspace layer**: DONE (W1-W8 completed)
✅ **Backend compilation**: 0 errors achieved
✅ **VS Code tasks**: Ready for daily use
✅ **Documentation**: Adequate for daily ops

**Status**: Ready for daily development workflows

---

## 📋 Daily Dev Checklist
*Pin this - it's your new "startup ritual"*

### Step 0: Pick Your Cockpit
```bash
cd /workspaces/terrafusion_os_1.0

# Backend work (APIs, services, database)
code workspaces/backend.code-workspace

# Frontend work (React, UI components, design)
code workspaces/frontend.code-workspace

# Full-system view (when you need everything)
code workspaces/master.code-workspace
```

### Step 1: Install Dependencies (First time or after big changes)
```bash
# Backend (.NET restoration)
cd backend
dotnet restore

# Frontend (React packages)
cd frontend
npm install
```

**When to repeat**: After `git pull` with new dependencies, or when things feel broken.

### Step 2: Launch Core Services (via VS Code Tasks)

**From backend workspace**:
1. **First, build the solution**:
   - `Ctrl+Shift+P` → `Tasks: Run Task` → **"Build TerraFusion Elite Government OS"**
   - Wait for successful build (0 errors)

2. **Then launch services**:
   - `Ctrl+Shift+P` → `Tasks: Run Task` → **"Launch Core Services (Degraded)"**
   - Starts API Gateway (port 5000)
   - Starts Consciousness Engine (port 3004)
   - Uses degraded mode (skips DB health checks for faster startup)

**From frontend workspace**:
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. Choose: **"dev"** or run manually:
   ```bash
   cd frontend
   npm run dev
   ```
   - Starts React dev server (port 3000)

### Step 3: Sanity Check in Browser

Open these URLs to verify everything is running:

- **✅ API Health**: http://localhost:5000/health
- **✅ Frontend**: http://localhost:3000
- **✅ Consciousness** (optional): http://localhost:3004

**Expected results**:
- **Consciousness health**: `Healthy` (working now ✅)
- **API health**: JSON response with status (after build)
- **Frontend**: TerraFusion UI loads (after npm run dev)

### Step 4: Run Tests (Verify clean state)

**Backend tests** (from backend workspace):
- `Ctrl+Shift+P` → `Tasks: Run Task` → **"Run Unit Smoke Tests"**
- Or terminal: `cd backend && dotnet test`

**Frontend tests** (from frontend workspace):
- Terminal: `cd frontend && npm test`

**Expected**: Tests pass (or at least run without crashing)

---

## 🛑 When Things Go Wrong

### "VS Code task not found"
- Make sure you opened the right workspace file (`.code-workspace`)
- Check that `.vscode/tasks.json` exists in backend folder

### "Port already in use"
- Kill existing processes: `Ctrl+C` in terminals
- Or find/kill: `netstat -ano | findstr :5000` then `taskkill /F /PID [number]`

### "dotnet restore fails"
- Check internet connection
- Try: `dotnet nuget locals all --clear`

### "npm install fails"
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

---

## 🧽 End-of-Day Cleanup (Optional)

**Weekly maintenance**:
```bash
# Check workspace bloat
./scripts/check-workspace-size.sh --summary

# Clean up artifacts
./scripts/workspace-cleanup.sh --dry-run  # preview
./scripts/workspace-cleanup.sh           # execute
```

**When VS Code feels slow**:
```bash
# Clean frontend build cache
cd frontend && npm run clean

# Clear .NET cache
cd backend && dotnet clean
```

---

## 📊 Quick Status Commands

```bash
# Overall health check (use this first!)
./scripts/health-check.sh

# Comprehensive workspace analysis + AI context
./scripts/workspace-doctor.sh

# Backend compilation check
cd backend && dotnet build --no-restore

# Frontend type check
cd frontend && npm run type-check

# All tests (kitchen sink)
cd backend && dotnet test && cd ../frontend && npm test
```

## 🤖 AI Assistant Integration

**New AI superpowers for each workspace**:

1. **📖 AI Profiles**: See [`WORKSPACE_AI_PROFILES.md`](./WORKSPACE_AI_PROFILES.md)
   - **Backend AI**: TerraFusion Backend Architect & Bug Surgeon
   - **Frontend AI**: TerraFusion Frontend UX & State Management Copilot
   - **Master AI**: TerraFusion Systems Navigator & Integration Oracle

2. **🧭 AI Companions**: See [`WORKSPACE_COMPANIONS.md`](./WORKSPACE_COMPANIONS.md)
   - **Navigator**: "Where does X live? Which workspace for Y?"
   - **Surgeon**: "Fix this one failing test/error/issue"
   - **Scribe**: "Document this change/feature/endpoint"

**Quick Usage**: Copy AI profile → paste into Copilot Chat/Claude → ask your question---

## 🎯 Next Phase Options

Once daily dev flow feels smooth, pick ONE:

1. **Performance Optimization**: Fix backend warnings systematically
2. **County Config Validation**: Test with real county data (`config/tenant.*.yaml`)
3. **AI Consciousness Deployment**: Turn on the full 50,000 agent swarm
4. **Feature Development**: Pick one service and build something

---

## 💡 Pro Tips

- **Bookmark this file** - it's your daily reference
- **One workspace per task** - don't mix backend/frontend in same VS Code window
- **Use tasks over terminal** - they handle paths and dependencies automatically
- **Test before coding** - run tests first to verify clean state
- **Save often** - VS Code auto-save enabled in workspaces

---

**🏁 Success State**: You can sit down, run this checklist, and be developing within 5 minutes without thinking about infrastructure.

*Government. Transcended.*
