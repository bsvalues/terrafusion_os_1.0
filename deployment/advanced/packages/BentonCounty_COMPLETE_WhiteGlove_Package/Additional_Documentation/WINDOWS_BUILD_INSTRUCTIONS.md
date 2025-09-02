# 🚀 Terrafusion Windows Build Instructions

## Prerequisites (Install if not already installed)

1. **Rust** - https://rustup.rs/
   - Download and run rustup-init.exe
   - Choose default installation

2. **Node.js** - https://nodejs.org/
   - Download LTS version
   - Install with default settings

3. **WebView2** - Usually pre-installed on Windows 10/11
   - If needed: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Build Steps

### Option 1: PowerShell (Recommended)
```powershell
# Open PowerShell as Administrator
cd E:\TerraFusion_Tauri_Master_Workspace\championship
.\BUILD_WINDOWS.ps1
```

### Option 2: Command Prompt
```cmd
# Open Command Prompt as Administrator
E:
cd \TerraFusion_Tauri_Master_Workspace\championship
BUILD_WINDOWS.bat
```

### Option 3: Manual Build
```powershell
# In PowerShell or Command Prompt
cd E:\TerraFusion_Tauri_Master_Workspace\championship

# Install dependencies
npm install

# Build frontend
npm run build

# Build Tauri app
cd src-tauri
cargo build --release
```

## 🎯 Output

Your executable will be at:
```
E:\TerraFusion_Tauri_Master_Workspace\championship\src-tauri\target\release\terrafusion-county-os.exe
```

## Running the App

Double-click the exe or run from terminal:
```powershell
.\src-tauri\target\release\terrafusion-county-os.exe
```

## Troubleshooting

### "cargo not found"
- Make sure Rust is installed: https://rustup.rs/
- Restart your terminal after installation

### "npm not found"
- Make sure Node.js is installed: https://nodejs.org/
- Restart your terminal after installation

### Build errors
- Make sure you're in the championship directory
- Try `cargo clean` then rebuild
- Check that all files were copied from WSL correctly

## 🎉 No OpenSSL Issues!

Windows doesn't require OpenSSL for Tauri builds. No webkit issues either. It just works!

## Quick Test After Build

1. Run the executable
2. You should see the Terrafusion County OS window
3. Test CostForge AI valuation 
4. Check that all 14 modules load

---

**Time to build: ~5-10 minutes on first run, ~2 minutes on subsequent builds**