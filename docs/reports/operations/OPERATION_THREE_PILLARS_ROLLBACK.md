# OPERATION: THREE PILLARS - ROLLBACK PROCEDURES

**Codename**: THREE PILLARS  
**Purpose**: Emergency rollback procedures for any phase  
**Last Updated**: October 15, 2025

---

## 🚨 WHEN TO ROLLBACK

### Immediate Rollback Required:

- ❌ Backend fails to start (port 5000)
- ❌ Frontend fails to start (port 5173)
- ❌ terrafusion-cos fails to start (port 8090)
- ❌ Critical import errors preventing compilation
- ❌ Database corruption or inaccessibility
- ❌ Authentication system broken
- ❌ Data loss detected
- ❌ Test suite failure >50%

### Consider Rollback:

- ⚠️ Performance degradation >20%
- ⚠️ Test suite failure 10-50%
- ⚠️ Non-critical import errors
- ⚠️ Unexpected behavior in AI systems
- ⚠️ Plugin system issues

### Do NOT Rollback (Fix in Place):

- ✅ Minor lint errors
- ✅ Documentation issues
- ✅ Single test failure
- ✅ Cosmetic issues

---

## 🔄 ROLLBACK DECISION TREE

```
Issue Detected
    ↓
Critical? (Backend/Frontend/OS fails to start)
    ↓ YES → ROLLBACK IMMEDIATELY
    ↓ NO
    ↓
Can be fixed in <30 minutes?
    ↓ YES → FIX IN PLACE
    ↓ NO
    ↓
Affects >50% of tests?
    ↓ YES → ROLLBACK
    ↓ NO → FIX IN PLACE
```

---

## 🛠️ ROLLBACK PROCEDURE

### Step 1: STOP ALL WORK

```powershell
# Stop immediately - do not make any more changes
# Document what happened
```

### Step 2: ASSESS THE SITUATION

1. What failed?
2. When did it fail?
3. What was the last successful state?
4. Is data lost or corrupted?
5. Can it be fixed quickly (<30 min)?

### Step 3: CHECK GIT STATUS

```powershell
# See current git state
git status

# See recent commits
git log --oneline -10 --grep="THREE PILLARS"

# See all THREE PILLARS tags
git tag | Select-String "three-pillars"
```

### Step 4: CHOOSE ROLLBACK POINT

#### Option A: Rollback to Previous Phase (Recommended)

```powershell
# Find the tag
git tag | Select-String "three-pillars"

# Rollback to specific phase
git reset --hard three-pillars-phase-X-complete

# Example: Rollback to Phase 1 completion
git reset --hard three-pillars-phase-1-complete
```

#### Option B: Rollback to Start of Current Phase

```powershell
# Find the "Before Phase X" commit
git log --oneline --grep="Before Phase"

# Rollback to that commit
git reset --hard <commit-hash>

# Example: If Phase 2 failed, rollback to before Phase 2
git reset --hard $(git log --oneline --grep="Before Phase 2" --format="%H" -1)
```

#### Option C: Rollback to Pre-Operation State (Nuclear Option)

```powershell
# Find Phase 0 commit
git log --oneline --grep="Phase 0: Pre-execution"

# Rollback to before any changes
git reset --hard <phase-0-commit-hash>
```

### Step 5: VERIFY ROLLBACK

```powershell
# Check workspace state
git status

# Verify OS starts
cd terrafusion-cos
python api_server.py  # Should start on port 8090

# Verify backend starts
cd ../backend
dotnet run  # Should start on port 5000

# Verify frontend starts
cd ../frontend
npm run dev  # Should start on port 5173
```

### Step 6: RESTORE FROM BACKUP (If Needed)

```powershell
# If git rollback isn't enough, restore from backup
# Location: C:\Backups\terrafusion_os_1.0_three_pillars_<date>

# Stop all services first
# Copy backup over current workspace
# Restart services
```

### Step 7: DOCUMENT THE INCIDENT

Update `OPERATION_THREE_PILLARS_STATUS.md`:

```markdown
## 🚨 ISSUES & BLOCKERS

### Current Issues:

- **[Date]**: Phase X failed - [Brief description]
  - **Cause**: [Root cause]
  - **Action**: Rolled back to phase-X-complete
  - **Status**: Investigating
```

### Step 8: ROOT CAUSE ANALYSIS

1. What was the root cause?
2. Why did it happen?
3. How can we prevent it?
4. Update the plan if needed

### Step 9: FIX AND RETRY

1. Fix the issue in a clean state
2. Update `OPERATION_THREE_PILLARS_MASTER_PLAN.md` if needed
3. Test the fix thoroughly
4. Retry the phase

---

## 📋 PHASE-SPECIFIC ROLLBACK COMMANDS

### Phase 1: Security & Trust Foundation

```powershell
# Rollback to pre-Phase 1 state
git reset --hard three-pillars-phase-0

# Verify rollback
Test-Path "os-platform"  # Should be False
Test-Path "security"     # Should be True
Test-Path "trust-fabric" # Should be True
Test-Path "auth"         # Should be True
```

### Phase 2: Consciousness & AI Intelligence

```powershell
# Rollback to Phase 1 completion
git reset --hard three-pillars-phase-1-complete

# Verify rollback
Test-Path "os-platform/security"  # Should be True
Test-Path "os-platform/ai-systems"  # Should be False
Test-Path "modules/ai-systems"  # Should be True
Test-Path "backend/TerraMind"  # Should be True
```

### Phase 3: Performance & Intelligence

```powershell
# Rollback to Phase 2 completion
git reset --hard three-pillars-phase-2-complete

# Verify rollback
Test-Path "os-platform/ai-systems"  # Should be True
Test-Path "os-platform/engines"  # Should be False
Test-Path "rust-performance-engine"  # Should be True
```

### Phase 4: Infrastructure & Specialized

```powershell
# Rollback to Phase 3 completion
git reset --hard three-pillars-phase-3-complete

# Verify rollback
Test-Path "os-platform/engines"  # Should be True
Test-Path "os-platform/infrastructure"  # Should be False
Test-Path "modules/infrastructure"  # Should be True
```

### Phase 5: Services & Marketplace

```powershell
# Rollback to Phase 4 completion
git reset --hard three-pillars-phase-4-complete

# Verify rollback
Test-Path "os-platform/infrastructure"  # Should be True
Test-Path "marketplace"  # Should be False
Test-Path "modules/government-core"  # Should be True
```

### Phase 6: Cleanup & Verification

```powershell
# Rollback to Phase 5 completion
git reset --hard three-pillars-phase-5-complete

# Verify rollback
Test-Path "marketplace"  # Should be True
Test-Path "modules/terra-sync"  # Should be True (not deleted yet)
# node_modules should still exist (not cleaned yet)
```

---

## 🔥 EMERGENCY PROCEDURES

### CRITICAL: OS Won't Boot After Move

```powershell
# 1. IMMEDIATE ROLLBACK
git reset --hard three-pillars-phase-0

# 2. Verify OS starts
cd terrafusion-cos
python api_server.py

# 3. If still fails, restore from backup
# Stop services
# Restore backup from C:\Backups\terrafusion_os_1.0_three_pillars_<date>
# Restart services

# 4. Document incident
# Update OPERATION_THREE_PILLARS_STATUS.md
```

### CRITICAL: Database Corruption

```powershell
# 1. STOP ALL SERVICES IMMEDIATELY
# Do NOT commit anything

# 2. Check database files
Get-ChildItem "os-platform/trust/*.db" -ErrorAction SilentlyContinue
Get-ChildItem "trust-fabric/*.db" -ErrorAction SilentlyContinue

# 3. If databases are corrupt or missing
git reset --hard <last-good-commit>

# 4. If still corrupt, restore from backup
# Copy database files from backup
Copy-Item "C:\Backups\terrafusion_os_1.0_<date>\trust-fabric\*.db" "trust-fabric\" -Force

# 5. Verify databases
# Start terrafusion-cos and check database connectivity
```

### CRITICAL: Import Errors Preventing Compilation

```powershell
# 1. Check error logs
# Backend: Check .NET compilation errors
# Frontend: Check TypeScript/React errors
# Python: Check import errors

# 2. If >10 import errors, ROLLBACK
git reset --hard <last-good-commit>

# 3. If <10 errors, try to fix in place
# Update import paths manually
# Test incrementally

# 4. If fix takes >30 minutes, ROLLBACK
git reset --hard <last-good-commit>
```

---

## 📊 ROLLBACK CHECKLIST

After rolling back, verify:

### System Health

- [ ] terrafusion-cos starts on port 8090
- [ ] Backend starts on port 5000
- [ ] Frontend starts on port 5173
- [ ] Native shell loads
- [ ] No critical errors in logs

### Data Integrity

- [ ] Trust fabric databases accessible
- [ ] All 22+ databases present
- [ ] No corruption detected
- [ ] County intelligence data intact

### Functionality

- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Frontend renders correctly
- [ ] No import errors
- [ ] Tests pass (baseline)

### Workspace State

- [ ] Git status clean
- [ ] No uncommitted changes
- [ ] Correct branch (main)
- [ ] All expected folders present

---

## 📚 ROLLBACK SCENARIOS

### Scenario 1: Phase 1 Failed - Security Move Broke Authentication

**Problem**: Moved security/, auth system broken  
**Solution**:

```powershell
git reset --hard three-pillars-phase-0
# Fix import paths in backend/
# Update security configuration
# Test authentication thoroughly
# Retry Phase 1
```

### Scenario 2: Phase 2 Failed - AI Systems Won't Initialize

**Problem**: Moved modules/ai-systems/, AI services fail to start  
**Solution**:

```powershell
git reset --hard three-pillars-phase-1-complete
# Check AI service dependencies
# Verify MCP server paths
# Update ai-systems configuration
# Test AI initialization
# Retry Phase 2
```

### Scenario 3: Phase 4 Failed - Plugin System Broken

**Problem**: Moved modules/infrastructure/, plugins won't load  
**Solution**:

```powershell
git reset --hard three-pillars-phase-3-complete
# Analyze plugin load errors
# Check plugin registry paths
# Update plugin configuration
# Test hot-reload functionality
# Retry Phase 4 incrementally
```

### Scenario 4: Database Corruption During Move

**Problem**: Trust fabric databases corrupted during migration  
**Solution**:

```powershell
# IMMEDIATE STOP
git reset --hard <last-good-commit>
# Restore databases from backup
Copy-Item "C:\Backups\...\trust-fabric\*.db" "trust-fabric\" -Force
# Verify database integrity
# Investigate why corruption occurred
# Fix and retry with database-safe approach
```

---

## 🎖️ ROLLBACK BEST PRACTICES

### Before Each Phase

1. ✅ Create full backup
2. ✅ Commit all changes
3. ✅ Tag the commit
4. ✅ Document starting state
5. ✅ Run baseline tests

### During Phase

1. ✅ Commit frequently (every major move)
2. ✅ Test after each move
3. ✅ Document issues immediately
4. ✅ Stop if >3 issues occur

### After Rollback

1. ✅ Document what happened
2. ✅ Analyze root cause
3. ✅ Update plan if needed
4. ✅ Test fix thoroughly before retry
5. ✅ Learn and improve process

---

## 📞 WHEN IN DOUBT

**STOP. ROLLBACK. ANALYZE. FIX. RETRY.**

Don't push forward if things are breaking. Better to rollback cleanly and fix
the issue than to compound problems.

**Reference**: `OPERATION_THREE_PILLARS_MASTER_PLAN.md`  
**Status**: `OPERATION_THREE_PILLARS_STATUS.md`

---

**🚨 ROLLBACK IS NOT FAILURE - IT'S SMART ENGINEERING**

_"A clean rollback and proper fix is worth ten hacks and workarounds."_

**END OF ROLLBACK GUIDE**
