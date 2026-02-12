# 🦕 TerraDossier (Sovereign Edition) - Start Here

**Congratulations!** You are now running the first **Generation 2** application on TerraFusion OS.
This application uses **Deno** instead of Node.js to eliminate `node_modules` complexity and ensure security.

## 🚀 Quick Launch (Recommended)

Simply run the included launcher script:

```powershell
.\launch.ps1
```

## 👣 Manual Launch

```powershell
# 1. Ensure Deno is in Path (if new session)
$env:Path += ";$HOME\.deno\bin"

# 2. Go to App Directory
cd applications/terra-dossier

# 3. Launch Sovereign Mode
$env:DENO_NO_PACKAGE_JSON=1
deno task dev
```

> **Note:** The `$env:DENO_NO_PACKAGE_JSON=1` flag ensures Deno ignores any legacy `package.json` files in the root that might conflict with the sovereign `deno.json`.

## 🛠️ The Ironclad Stack

- **Runtime**: Deno 2.x
- **Build**: Vite 5.4+ (ESM Native)
- **UI**: React 18 + Tailwind
- **Port**: 3007

## 📦 Managing Dependencies

**Do not run `npm install`.**
Dependencies are managed in `deno.json` under `imports`.

To add a library:
1. Open `deno.json`
2. Add to `imports` map: `"my-lib": "npm:my-lib@1.0.0"`
3. Use in code: `import { func } from "my-lib"`

## 🛑 Troubeshooting

**"Port 3007 in use"**
If the server crashes but the port stays open, kill the zombie process:
```powershell
netstat -ano | findstr :3007
taskkill /F /PID <PID_FROM_ABOVE>
```

**"ReferenceError: require is not defined"**
This happens if a dependency is CommonJS only.
Ensure `deno.json` task includes `--unstable-detect-cjs`.
