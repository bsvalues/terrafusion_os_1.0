# 🚀 TERRAFUSION OS - BUILD & RUN GUIDE
## Complete Integration: Native Shell + Rust Services + React Frontend

**Updated**: October 4, 2025  
**Architecture**: Native Shell + Rust Core Services + .NET API + React UI  
**Status**: ✅ **READY TO BUILD**

---

## 📋 **BUILD ORDER** (Execute in this order!)

### **Step 1: Build Core Rust Services** (5-10 mins)
```powershell
# Build core-os workspace (includes FFI bridge)
cd core-os
cargo build --release

# Output files:
# target/release/terrafusion_core_os.dll  (FFI bridge for .NET)
# target/release/*.rlib  (Static libraries)

# Verify build
ls target/release/terrafusion_core_os.dll
```

**Expected**: ✅ DLL created (~5-10 MB)

---

### **Step 2: Copy Rust DLL to .NET Project**
```powershell
# Copy FFI DLL to .NET API bin directory
cp core-os/target/release/terrafusion_core_os.dll backend/TerraFusion.API/bin/Debug/net8.0/

# Also copy to native shell
cp core-os/target/release/terrafusion_core_os.dll native-shell/bin/Debug/net8.0-windows/
```

**Expected**: ✅ DLL in both .NET projects

---

### **Step 3: Build .NET API Gateway**
```powershell
cd backend/TerraFusion.API
dotnet build

# Should compile with new:
# - Services/RustFFI.cs
# - Controllers/CoreServicesController.cs
```

**Expected**: ✅ Build succeeds, no errors

---

### **Step 4: Build React Frontend to Native Shell**
```bash
cd frontend

# Build (configured to output to ../native-shell/ui/)
npm run build

# Verify output
ls ../native-shell/ui/index.html
ls ../native-shell/ui/assets/
```

**Expected**: ✅ UI files in native-shell/ui/

---

### **Step 5: Build Native Shell**
```powershell
cd native-shell
dotnet build

# Creates: bin/Debug/net8.0-windows/Terrafusion.Shell.exe
```

**Expected**: ✅ EXE updated with latest UI

---

## 🚀 **RUN THE COMPLETE SYSTEM**

### **Option A: One-Command Launch** (Recommended)
```powershell
# Launch script that starts everything
./START_TERRAFUSION_NATIVE.ps1
```

### **Option B: Manual Launch** (For debugging)

**Terminal 1 - .NET API Gateway**:
```powershell
cd backend/TerraFusion.API
dotnet run

# Should see:
# ✅ TerraFusion API starting on http://localhost:5000
# ✅ Rust FFI bridge loaded
# ✅ Core services initialized
```

**Terminal 2 - Native Shell**:
```powershell
cd native-shell
dotnet run

# Should see:
# ✅ Native shell launching
# ✅ WebView2 initializing
# ✅ Loading UI from ui/index.html
# ✅ TerraFusion OS operational
```

---

## ✅ **VERIFICATION CHECKLIST**

### **After Build**:
- [ ] core-os/target/release/terrafusion_core_os.dll exists
- [ ] DLL copied to backend/TerraFusion.API/bin/
- [ ] DLL copied to native-shell/bin/
- [ ] backend compiles successfully
- [ ] frontend builds to native-shell/ui/
- [ ] native-shell compiles successfully

### **After Launch**:
- [ ] .NET API responds at http://localhost:5000/api/health
- [ ] Core services health check works: http://localhost:5000/api/core/health
- [ ] Native shell opens (Windows desktop window)
- [ ] UI loads in WebView2
- [ ] React app displays correctly
- [ ] Can call Rust services from UI

---

## 🧪 **TESTING THE INTEGRATION**

### **Test 1: Core OS Health**
```powershell
# Call .NET API
curl http://localhost:5000/api/core/health

# Should return:
# {
#   "overall_status": "OPERATIONAL",
#   "terra_sync": { "status": "Running", ... },
#   "terra_flow": { "status": "Running", ... },
#   "costforge_ai": { "status": "Running", ... }
# }
```

### **Test 2: TerraSync**
```powershell
# Start sync for Benton County
curl -X POST http://localhost:5000/api/core/terra-sync/start `
  -H "Content-Type: application/json" `
  -d '{"county":"benton"}'

# Should return:
# {
#   "county": "benton",
#   "records_synced": 89247,
#   "sync_duration_ms": 45.2,
#   ...
# }
```

### **Test 3: CostForge AI**
```powershell
# Property valuation
curl -X POST http://localhost:5000/api/core/costforge/property-valuation `
  -H "Content-Type: application/json" `
  -d '{
    "property_id": "TEST-001",
    "square_feet": 2500,
    "year_built": 2010,
    "location": "Benton County, WA",
    "bedrooms": 4,
    "bathrooms": 2.5,
    "lot_size": 8000,
    "comparables": []
  }'

# Should return valuation in <150ms!
```

---

## 🐛 **TROUBLESHOOTING**

### **Issue**: DLL not found
```
Error: Unable to load DLL 'terrafusion_core_os.dll'
```

**Solution**:
```powershell
# Ensure DLL is in same directory as exe
cp core-os/target/release/terrafusion_core_os.dll backend/TerraFusion.API/bin/Debug/net8.0/

# Or add to PATH
$env:PATH += ";C:\Users\bsval\terrafusion_os_1.0\core-os\target\release"
```

### **Issue**: Frontend build fails
```
Error: Cannot find module '@/services/coreServices'
```

**Solution**:
```bash
cd frontend
npm install  # Ensure all dependencies installed
npm run build
```

### **Issue**: Native shell won't start
```
Error: UI files not found
```

**Solution**:
```bash
# Build frontend first
cd frontend && npm run build

# Then run shell
cd ../native-shell && dotnet run
```

---

## 📊 **PERFORMANCE TARGETS**

### **Build Times**:
- Rust (release): ~5-10 minutes (first build)
- Rust (incremental): ~30 seconds
- .NET: ~10-20 seconds
- React: ~1-2 minutes

### **Runtime Performance**:
- Native shell startup: <1 second
- .NET API startup: <2 seconds
- Rust services init: <1 second
- **Total startup: <4 seconds** ✅

### **Service Performance**:
- TerraSync: <50ms latency ✅
- TerraFlow: <100ms execution ✅
- CostForge: <150ms inference ✅
- API overhead: <10ms ✅

---

## 🎯 **COMPLETE STACK DIAGRAM**

```
USER
  ↓ Clicks UI
╔══════════════════════════════════════════╗
║ REACT UI (in native-shell/ui/)          ║
║ • TypeScript components                  ║
║ • Calls coreServices.ts                  ║
╚══════════════════════════════════════════╝
  ↓ HTTP POST to http://localhost:5000/api/core/...
╔══════════════════════════════════════════╗
║ .NET API GATEWAY (Port 5000)             ║
║ • CoreServicesController.cs              ║
║ • Calls RustFFI.cs                       ║
╚══════════════════════════════════════════╝
  ↓ P/Invoke DllImport("terrafusion_core_os.dll")
╔══════════════════════════════════════════╗
║ RUST FFI BRIDGE (core-os/ffi/)          ║
║ • Exposes C ABI functions                ║
║ • Marshals data to/from .NET             ║
╚══════════════════════════════════════════╝
  ↓ Calls terrafusion_core_os::*
╔══════════════════════════════════════════╗
║ CORE RUST SERVICES (core-os/services/)  ║
║ • TerraFusion Sync Service               ║
║ • TerraFlow Service                      ║
║ • CostForge AI Engine                    ║
╚══════════════════════════════════════════╝
  ↓ Uses
╔══════════════════════════════════════════╗
║ ELITE RUST PERFORMANCE ENGINE            ║
║ • Agent Coordination (50,000 agents)     ║
║ • Geospatial Engine                      ║
║ • Valuation Kernel                       ║
║ • Security Layer                         ║
╚══════════════════════════════════════════╝
  ↓ Returns Result
RESULT FLOWS BACK UP THE STACK TO USER
```

---

## 🏆 **SUCCESS CRITERIA**

✅ All builds complete successfully  
✅ No compilation errors  
✅ Native shell launches  
✅ UI loads in WebView2  
✅ API responds at port 5000  
✅ Rust services accessible via FFI  
✅ End-to-end call works (UI → .NET → Rust)  
✅ Performance targets met (<150ms)  

---

**🦀 RUST-POWERED TERRAFUSION OS - READY TO BUILD!** 🔥

