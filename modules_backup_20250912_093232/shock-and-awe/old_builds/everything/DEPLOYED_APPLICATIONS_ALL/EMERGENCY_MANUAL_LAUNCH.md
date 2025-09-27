# 🚨 EMERGENCY MANUAL LAUNCH INSTRUCTIONS

## IF AUTOMATED SCRIPTS FAIL, FOLLOW THESE EXACT STEPS:

### STEP 1: KILL FAKE APPLICATIONS

```powershell
# Open PowerShell as Administrator and run:
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force
netstat -ano | findstr :5000 | findstr LISTENING
netstat -ano | findstr :5001 | findstr LISTENING
netstat -ano | findstr :5002 | findstr LISTENING
# For each PID found, run: taskkill /PID [PID_NUMBER] /F
```

### STEP 2: NAVIGATE TO CORRECT DIRECTORIES

```powershell
# Open PowerShell and navigate to:
cd "C:\Users\bs\Desktop\TerraFusion_Final_Build_20250615_051930\DEPLOYED_APPLICATIONS"
```

### STEP 3: LAUNCH RUST BACKEND

```powershell
# Navigate to the Rust backend:
cd "TerraFusionBuild_ACTUAL\backend"

# Check if this directory exists and contains Cargo.toml:
ls Cargo.toml

# If found, build and run:
cargo build --release
cargo run --release
```

**⚠️ IF RUST COMPILATION FAILS WITH tracing_subscriber ERROR:**

```powershell
# Edit Cargo.toml and change this line:
# FROM: tracing-subscriber = "0.3"
# TO:   tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Then try again:
cargo build --release
cargo run --release
```

### STEP 4: LAUNCH FRONTEND (IF NODE.JS AVAILABLE)

```powershell
# Open a NEW PowerShell window and navigate to:
cd "C:\Users\bs\Desktop\TerraFusion_Final_Build_20250615_051930\DEPLOYED_APPLICATIONS\TerraFusionBuild_ACTUAL\frontend"

# Install dependencies and start:
npm install
npm run dev
```

### STEP 5: LAUNCH PLAYGROUND HUB

```powershell
# Open a THIRD PowerShell window and navigate to:
cd "C:\Users\bs\Desktop\TerraFusion_Final_Build_20250615_051930\DEPLOYED_APPLICATIONS\TerraFusionPlayground_PRODUCTION"

# Install Python dependencies and start:
pip install flask flask-cors
python start_playground.py
```

### STEP 6: TEST APPLICATIONS

Open browser windows to:

- **Rust Backend**: http://localhost:\${{TF_ADMIN_PORT:-8080}}
- **Frontend**: http://localhost:\${{TF_ADMIN_PORT:-8080}}
- **Playground**: http://localhost:\${{TF_ADMIN_PORT:-8080}} (if frontend not running)

---

## EXPECTED RESULTS:

### ✅ RUST BACKEND (Port \${{TF_ADMIN_PORT:-8080}}):

- Should show JSON health check response
- Should display API endpoint list
- Should NOT show "0 properties" or fake data

### ✅ NEXT.JS FRONTEND (Port \${{TF_ADMIN_PORT:-8080}}):

- Should show modern React application
- Should connect to Rust backend
- Should display real property data

### ✅ PLAYGROUND HUB (Port \${{TF_ADMIN_PORT:-8080}}):

- Should show TerraFusion application launcher
- Should have working navigation
- Should manage other applications

---

## 🔍 TROUBLESHOOTING:

### IF RUST WON'T COMPILE:

1. Check you're in the correct directory: `TerraFusionBuild_ACTUAL\backend`
2. Verify Cargo.toml exists in that directory
3. Check the tracing-subscriber line in Cargo.toml
4. Try `cargo clean` then `cargo build --release`

### IF NODE.JS NOT FOUND:

1. Install Node.js from https://nodejs.org/
2. Restart PowerShell after installation
3. Or skip frontend and use Playground hub only

### IF PYTHON NOT FOUND:

1. Install Python from https://python.org/
2. Make sure to check "Add to PATH" during installation
3. Restart PowerShell after installation

### IF PORTS ARE BUSY:

1. Check what's using the port: `netstat -ano | findstr :8080`
2. Kill the process: `taskkill /PID [PID] /F`
3. Try launching again

---

## 🎯 SUCCESS CRITERIA:

- ❌ NO applications showing "Enhanced" in the title
- ❌ NO applications showing "0 properties" or "$0 values"
- ❌ NO status dashboards with health percentages
- ✅ Real Rust backend with API endpoints
- ✅ Real React frontend with actual UI
- ✅ Real Python launcher with working navigation

**WHEN YOU SEE REAL APPLICATIONS WITH REAL DATA, YOU'VE SUCCEEDED!**
