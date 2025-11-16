# TerraFusion OS - VS Code Extension

Government-grade AI Operating System workspace integration for Visual Studio Code.

## Features

### 🏛️ Workspace Management
- **Activity Bar Integration**: Custom TerraFusion sidebar with workspace explorer
- **50+ Workspace Files**: Quick access to specialized development contexts
- **One-Click Switching**: Open backend, frontend, SDK, or government workspaces instantly

### 🔄 Real-Time Transparency Engine
- **WebSocket Connection**: Live connection to Transparency Engine (ws://localhost:8788)
- **4-Layer Progressive Disclosure**:
  - 🔵 **Surface** (10 actions) - Essential operations
  - 🟢 **Hint** (50 actions) - Grouped workflows
  - 🟡 **Depth** (200+ actions) - Deep metrics
  - 🔴 **Expert** (Unlimited) - Full system logs
- **Status Bar Integration**: Current layer displayed with connection status
- **Cycle Command**: `Ctrl+Shift+P` → "Cycle Transparency Layer"

### 🚀 Service Management
- **Health Monitoring**: Real-time status for all TerraFusion services
  - TerraFusion API (port 5000)
  - Consciousness Engine (port 3004)
  - API Gateway (port 3002)
  - Portal UI (port 5174)
  - Transparency Engine (port 8788)
- **Auto-Refresh**: Service status updates every 10 seconds
- **Visual Indicators**: Green (running) / Gray (stopped)

### 🤖 AI Agent Activity
- **Real-Time Agent Feed**: Live stream of 50,000+ AI agent activities
- **Agent Swarm Visualization**: See agent coordination in real-time
- **Recent Activity Log**: Last 50 agent actions with timestamps
- **Time-Relative Display**: "2s ago", "5m ago", "1h ago" timestamps

### 📊 Embedded Portal UI
- **WebView Integration**: Full Portal dashboard embedded in VS Code
- **Side Panel View**: Portal available in TerraFusion sidebar
- **Full Panel Command**: Open Portal in dedicated panel (Ctrl+Shift+P → "Open Portal UI")
- **Seamless Communication**: Portal ↔ Extension message passing

### ⌨️ TDC Command Integration
- **Terminal Commands**: All TDC commands accessible via Command Palette
  - `Launch Backend Services` → `tdc launch:backend`
  - `Launch Portal` → `tdc portal launch`
  - `Show System Status` → `tdc status`
  - `Trace AI Activity` → `tdc ai trace --follow`

## Installation

### From Source
```bash
cd tools/vscode-extension
npm install
npm run compile
```

### Development Mode
1. Open `tools/vscode-extension` in VS Code
2. Press `F5` to launch Extension Development Host
3. TerraFusion sidebar appears in activity bar

## Configuration

### Settings
- `terrafusion.portalUrl` - Portal UI URL (default: http://localhost:5174)
- `terrafusion.transparencyEngineUrl` - WebSocket URL (default: ws://localhost:8788)
- `terrafusion.defaultTransparencyLayer` - Default layer: surface | hint | depth | expert
- `terrafusion.autoConnectTransparency` - Auto-connect on startup (default: true)
- `terrafusion.showStatusBar` - Show status bar item (default: true)

### Example Configuration
```json
{
  "terrafusion.portalUrl": "http://localhost:5174",
  "terrafusion.transparencyEngineUrl": "ws://localhost:8788",
  "terrafusion.defaultTransparencyLayer": "hint",
  "terrafusion.autoConnectTransparency": true,
  "terrafusion.showStatusBar": true
}
```

## Usage

### Quick Start
1. **Install Extension**: Press `F5` in Extension Development Host
2. **Open TerraFusion Sidebar**: Click TerraFusion icon in activity bar
3. **View Workspaces**: Browse 50+ available workspace files
4. **Check Services**: Monitor service health in Services view
5. **Watch Agents**: See real-time AI agent activity
6. **Open Portal**: Click "Open Portal UI" in toolbar

### Transparency Layer Cycling
- **Status Bar**: Click TerraFusion status item to cycle layers
- **Command Palette**: `Ctrl+Shift+P` → "Cycle Transparency Layer"
- **Visual Feedback**: 🔵 Surface → 🟢 Hint → 🟡 Depth → 🔴 Expert

### Launching Services
- **Backend**: Command Palette → "Launch Backend Services"
- **Portal**: Command Palette → "Launch Portal"
- **AI Trace**: Command Palette → "Trace AI Agent Activity"

## Architecture

### Components
```
extension.ts                    # Main activation logic
├── providers/
│   ├── WorkspaceExplorerProvider.ts   # Workspace tree view
│   ├── ServicesProvider.ts             # Service health monitoring
│   ├── AgentActivityProvider.ts        # AI agent feed
│   └── PortalWebViewProvider.ts        # Embedded Portal UI
├── resources/
│   ├── terrafusion-icon.svg            # Activity bar icon
│   ├── services-icon.svg               # Services view icon
│   └── agents-icon.svg                 # Agents view icon
└── media/                              # WebView resources
```

### WebSocket Protocol
```typescript
// Client → Server
{
  "type": "setLayer",
  "layer": "hint" | "surface" | "depth" | "expert"
}

// Server → Client
{
  "type": "agentAction",
  "action": {
    "actionType": "string",
    "timestamp": number,
    "agent": "string",
    "metadata": any
  }
}
```

## Development

### Build
```bash
npm run compile    # Compile TypeScript
npm run watch      # Watch mode
npm run lint       # ESLint
```

### Debug
1. Open `tools/vscode-extension` in VS Code
2. Press `F5` to launch Extension Development Host
3. Set breakpoints in TypeScript files
4. Extension auto-reloads on code changes

### Package
```bash
npm run package    # Creates .vsix file
```

## Requirements
- **VS Code**: 1.85.0 or higher
- **Node.js**: 20.x or higher
- **TerraFusion Backend**: Backend services running (ports 5000, 3004, 3002)
- **Portal UI**: Portal frontend running (port 5174)
- **Transparency Engine**: WebSocket server running (port 8788)

## Known Issues
- WebSocket reconnection may take up to 5 seconds after connection loss
- Service status check requires `lsof` command (Linux/macOS)
- Portal embedding requires allow-scripts in sandbox

## Roadmap
- [ ] Custom task provider for TerraFusion tasks
- [ ] Debug adapter for AI agent debugging
- [ ] Workspace-specific settings sync
- [ ] Portal authentication integration
- [ ] Multi-workspace transparency aggregation

## License
Proprietary - TerraFusion OS Government Edition

## Government. Transcended.
Championship-level workspace orchestration with quantum AI integration.
