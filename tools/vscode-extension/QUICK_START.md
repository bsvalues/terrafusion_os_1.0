# 🚀 TerraFusion VS Code Extension - Quick Start Guide

## Prerequisites

Before testing the extension, ensure these services are running:

### 1. Start Transparency Engine WebSocket Server
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc
node packages/transparency-engine/src/serve.js
```
**Expected**: Server listening on `ws://localhost:8788`

### 2. Start Portal UI
```bash
cd /workspaces/terrafusion_os_1.0/TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend
npm run dev
```
**Expected**: Portal running on `http://localhost:5174`

### 3. (Optional) Start Backend Services
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc
tdc launch:backend
```
**Expected**: Backend services on ports 5000, 3004, 3002

---

## Testing the Extension

### Method 1: Press F5 (Recommended)

1. **Open Extension Folder** in VS Code:
   ```bash
   code /workspaces/terrafusion_os_1.0/tools/vscode-extension
   ```

2. **Press F5** to launch Extension Development Host
   - VS Code will compile the extension automatically
   - A new window opens with the extension loaded

3. **Verify TerraFusion Icon** appears in the activity bar (left sidebar)

### Method 2: Manual Testing

1. **Compile the Extension**:
   ```bash
   cd /workspaces/terrafusion_os_1.0/tools/vscode-extension
   npm run compile
   ```

2. **Open Extension Development Host**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type: "Developer: Start Extension Host"
   - Select and run

---

## Feature Testing Checklist

### ✅ Activity Bar Integration
- [ ] TerraFusion icon visible in activity bar (terra-cyan quantum logo)
- [ ] Clicking icon opens TerraFusion sidebar
- [ ] Sidebar shows 3 views: Workspaces, Services, AI Agents

### ✅ Workspace Explorer
- [ ] Shows list of workspace files from `/workspaces/` directory
- [ ] Icons display correctly:
  - `home` icon for master.code-workspace
  - `server` icon for backend.code-workspace
  - `browser` icon for frontend.code-workspace
  - `package` icon for sdk.code-workspace
  - `organization` icon for government.code-workspace
- [ ] Clicking workspace opens it in VS Code

### ✅ Services Monitoring
- [ ] Shows 5 services:
  - TerraFusion API (:5000)
  - Consciousness Engine (:3004)
  - API Gateway (:3002)
  - Portal UI (:5174)
  - Transparency Engine (:8788)
- [ ] Green icon = running, Gray icon = stopped
- [ ] Auto-refreshes every 10 seconds
- [ ] Tooltips show service name, port, status

### ✅ AI Agent Activity
- [ ] Shows recent agent actions (if Transparency Engine is connected)
- [ ] Displays agent name + action type
- [ ] Time-relative timestamps (e.g., "2s ago", "5m ago")
- [ ] Updates in real-time when agents publish actions
- [ ] Shows "No recent activity" when empty

### ✅ Status Bar
- [ ] Status bar item shows: `$(pulse) TerraFusion 🟢 HINT`
- [ ] Green icon if connected to Transparency Engine
- [ ] Gray icon if disconnected
- [ ] Clicking cycles through layers: 🔵 Surface → 🟢 Hint → 🟡 Depth → 🔴 Expert
- [ ] Notification appears when layer changes

### ✅ Commands (via Command Palette)
Press `Ctrl+Shift+P` and test these commands:

- [ ] **TerraFusion: Open Portal UI**
  - Opens Portal in full WebView panel
  - Portal loads correctly (http://localhost:5174)

- [ ] **TerraFusion: Cycle Transparency Layer**
  - Cycles through 4 layers
  - Status bar updates
  - Notification shows current layer

- [ ] **TerraFusion: Refresh Workspaces**
  - Refreshes workspace list

- [ ] **TerraFusion: Launch Backend Services**
  - Opens terminal with `tdc launch:backend`

- [ ] **TerraFusion: Launch Portal**
  - Opens terminal with `tdc portal launch`

- [ ] **TerraFusion: Show System Status**
  - Opens terminal with `tdc status`

- [ ] **TerraFusion: Trace AI Agent Activity**
  - Opens terminal with `tdc ai trace --follow`

### ✅ WebSocket Connection
- [ ] Extension connects to ws://localhost:8788 on startup
- [ ] Status bar shows connected status (green pulse icon)
- [ ] Agent activity updates in real-time
- [ ] Auto-reconnects after 5 seconds if connection lost

### ✅ Portal WebView Embedding
- [ ] Portal loads in side panel view
- [ ] Connection status badge shows in top-right
- [ ] Badge shows "Portal Connected" when loaded
- [ ] Portal UI is interactive (can click, navigate)

---

## Troubleshooting

### Extension Doesn't Activate
**Solution**: Check the Debug Console for errors
- In Extension Development Host, press `Ctrl+Shift+I`
- Look for errors in Console tab

### WebSocket Connection Failed
**Solution**: Ensure Transparency Engine is running
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc
node packages/transparency-engine/src/serve.js
```

### Services Show as "Stopped"
**Solution**: Start the services
```bash
# Start all backend services
tdc launch:backend

# Or start individually
dotnet run --project /workspaces/terrafusion_os_1.0/backend/TerraFusion.API --urls http://localhost:5000
```

### Portal Doesn't Load
**Solution**: Ensure Portal UI is running
```bash
cd /workspaces/terrafusion_os_1.0/TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend
npm run dev
```

### Workspaces Not Showing
**Solution**: Check workspace path
- Extension looks for: `/workspaces/terrafusion_os_1.0/workspaces/*.code-workspace`
- Ensure workspace files exist in that directory

---

## Development Workflow

### Watch Mode (Auto-Recompile)
```bash
cd /workspaces/terrafusion_os_1.0/tools/vscode-extension
npm run watch
```
- TypeScript auto-compiles on save
- Press `Ctrl+R` in Extension Development Host to reload

### Manual Compile
```bash
npm run compile
```

### Lint Code
```bash
npm run lint
```

### Package Extension
```bash
npm run package
```
Creates `.vsix` file for distribution

---

## Expected Behavior

### On Extension Activation
```
Console Output:
🏛️ TerraFusion OS Extension Activating...
✅ Connected to Transparency Engine
✅ TerraFusion OS Extension Activated
```

### Status Bar States
- **Connected**: `$(pulse) TerraFusion 🟢 HINT` (or current layer)
- **Disconnected**: `$(circle-slash) TerraFusion 🟢 HINT`

### Transparency Layer Cycle
1. Click status bar item
2. Layer cycles: Surface → Hint → Depth → Expert → Surface
3. Notification: "Transparency Layer: DEPTH"
4. Status bar updates emoji: 🔵 🟢 🟡 🔴

---

## Next Steps

### After Testing
1. ✅ Verify all features work
2. ✅ Test with all services running
3. ✅ Test with services stopped
4. ✅ Test transparency layer cycling
5. ✅ Test workspace opening
6. ✅ Test command execution

### Production Readiness
- [ ] Add extension tests
- [ ] Add custom task provider
- [ ] Add debug adapter
- [ ] Package as .vsix
- [ ] Publish to VS Code Marketplace (optional)

---

## Configuration

Edit these settings in VS Code:

```json
{
  "terrafusion.portalUrl": "http://localhost:5174",
  "terrafusion.transparencyEngineUrl": "ws://localhost:8788",
  "terrafusion.defaultTransparencyLayer": "hint",
  "terrafusion.autoConnectTransparency": true,
  "terrafusion.showStatusBar": true
}
```

---

## Support

- **Documentation**: See `README.md` for full feature list
- **Completion Report**: See `PHASE_5_COMPLETE.md` for implementation details
- **Issues**: Check Debug Console in Extension Development Host

---

**Government. Transcended.** 🏛️
