# 🌍 TerraFusion Workspace Explorer

**AI-Powered Interactive Navigation Tool for TerraFusion OS 1.0**

> Navigate 318 packages with intelligent search, quick actions, and beautiful terminal UI  
> **Built THE TERRAFUSION WAY: Foundation Before Features!**

---

## 🎯 What Is This?

Workspace Explorer is your **interactive command center** for navigating the TerraFusion OS 1.0 workspace. Think of it as a GPS for your codebase - find anything instantly, launch common tasks with one command, and get AI-powered suggestions along the way.

### Why You'll Love It

- **🔍 AI-Powered Search**: Find packages, modules, and files instantly with fuzzy matching
- **⚡ Quick Actions**: Start, test, validate - one command for everything
- **📊 Live Statistics**: Real-time workspace health and metrics
- **🎯 Smart Browsing**: Explore by category, tier, or type
- **🤖 AI Assistant**: Get intelligent suggestions and recommendations
- **🎨 Beautiful UI**: Designed for developer happiness

---

## 🚀 Quick Start

### Installation

```bash
# From workspace root
cd workspace-explorer

# Install dependencies
npm install

# Make the tool globally available
npm link
```

### Usage

```bash
# Launch interactive menu
tf-explore

# Or use short alias
tfx

# Search directly from command line
tf-explore --search "gis"

# Skip welcome screen
tf-explore --quick

# Enable debug mode
tf-explore --debug
```

---

## 📋 Features

### 1. 🔍 AI-Powered Search

Instantly find packages, modules, and files across the entire workspace:

- **Fuzzy matching**: Type "terafx" to find "TerraFusion"
- **Smart ranking**: Most relevant results first
- **Context-aware**: Understands relationships between packages
- **Instant results**: Search 318 packages in milliseconds

**Example:**
```bash
tf-explore --search "dashboard"
# Finds: TerraFusion Dashboard, Prime View Dashboard, etc.
```

### 2. ⚡ Quick Actions

Common tasks available instantly:

| Action | Description | Command |
|--------|-------------|---------|
| 🚀 Start Everything | Launch entire workspace | Runs `start-everything.ps1` |
| ✅ Run Validation | Test all packages | Runs `validate-workspace.ps1` |
| ❤️  Health Check | Monitor system resources | Runs `health-check.ps1` |
| 🧪 Run Tests | Execute test suites | Coming soon! |
| 🔧 Install Dependencies | npm install all | Coming soon! |
| 📚 View Documentation | Open guides | Interactive menu |

### 3. 📊 Workspace Statistics

Get comprehensive stats about your workspace:

- Total packages, modules, AI systems
- Distribution by tier (core, essential, enhanced, premium)
- Distribution by type (module, library, application)
- Packages with tests, dependencies, documentation
- Beautiful tables and visualizations

### 4. 🎯 Browse by Category

Explore organized packages:

- **By Tier**: core → essential → enhanced → premium
- **By Type**: module, library, application, tool
- **By Features**: Has tests, has dependencies
- **Interactive Selection**: Click to see details

### 5. 🤖 AI Assistant (Preview)

Intelligent suggestions and recommendations:

- Smart suggestions based on workspace state
- Package recommendations for common tasks
- Context-aware help
- *Full AI integration coming soon!*

### 6. 📚 Documentation Access

All guides at your fingertips:

- Workspace Navigation Guide
- Active Systems Guide
- Path Resolution Guide
- Strategic Enhancements Status
- What to Do Next Guide

---

## 🏗️ Architecture

```
workspace-explorer/
├── src/
│   ├── index.js              # Main entry point
│   ├── ui/
│   │   ├── welcome.js        # Welcome screen
│   │   ├── menu.js           # Main interactive menu
│   │   ├── search-menu.js    # Search interface
│   │   ├── quick-actions-menu.js  # Quick actions
│   │   ├── stats-display.js  # Statistics display
│   │   ├── browse-menu.js    # Browse by category
│   │   ├── ai-assistant-menu.js   # AI assistant
│   │   └── about-menu.js     # About screen
│   ├── search/
│   │   ├── workspace-loader.js    # Load .workspace-map.json
│   │   └── search-engine.js       # Fuzzy search + filtering
│   └── commands/              # Future: Command modules
├── tests/                     # Test suites
├── package.json              # Project configuration
└── README.md                 # This file
```

### Key Technologies

- **Node.js**: Runtime environment
- **Commander.js**: CLI argument parsing
- **Inquirer.js**: Interactive prompts
- **Fuse.js**: Fuzzy search algorithm
- **Chalk**: Terminal colors
- **Boxen**: Beautiful boxes
- **Ora**: Elegant spinners
- **cli-table3**: Formatted tables

---

## 🎮 How to Use

### Interactive Mode (Recommended)

1. **Launch the tool**:
   ```bash
   tf-explore
   ```

2. **Choose an action** from the main menu:
   - 🔍 Search Workspace
   - ⚡ Quick Actions
   - 📊 Workspace Stats
   - 🎯 Browse by Category
   - 🤖 AI Assistant
   - ℹ️  About

3. **Navigate** with arrow keys, press Enter to select

4. **Exit** anytime with Ctrl+C or select "Exit"

### Command Line Mode

```bash
# Search directly
tf-explore --search "keyword"

# Skip welcome screen
tf-explore --quick

# Debug mode
tf-explore --debug

# Show version
tf-explore --version

# Show help
tf-explore --help
```

---

## 🔧 Configuration

### Environment Variables

The tool automatically detects `.workspace-map.json` from:

1. Current directory
2. Parent directory
3. `TERRAFUSION_ROOT` environment variable
4. Hardcoded fallback path

### Debug Mode

Enable debug output to troubleshoot issues:

```bash
tf-explore --debug
```

Or set environment variable:

```bash
export TF_EXPLORER_DEBUG=true  # Unix/Mac
$env:TF_EXPLORER_DEBUG = "true"  # PowerShell
```

---

## 📊 What Gets Analyzed

The tool reads `.workspace-map.json` and provides insights on:

| Data | Source | Usage |
|------|--------|-------|
| **318 Packages** | `packages[]` | Search, browse, stats |
| **18 AI Systems** | `ai_systems[]` | System overview |
| **50 MCP Servers** | `mcp_servers[]` | Server catalog |
| **Package Metadata** | `name, path, description, tier, type` | Detailed views |
| **Features** | `hasDependencies, hasTests, hasDocumentation` | Filtering |
| **Scripts** | `scripts{}` | Quick actions |

---

## 🎨 THE TERRAFUSION WAY

This tool embodies our core principles:

1. **Foundation Before Features**
   - Built on `.workspace-map.json` (Week 1)
   - Uses validation framework (Week 2)
   - Leverages path resolution (Week 3)

2. **Zero Breaking Changes**
   - Reads existing data structures
   - No modifications to workspace
   - Safe to run anytime

3. **Comprehensive Documentation**
   - This README
   - Inline code comments
   - Interactive help system

4. **AI-Powered Everything**
   - Intelligent search algorithms
   - Smart suggestions
   - Future: Full AI integration

5. **Beautiful Terminal UI**
   - Colors, boxes, tables
   - Smooth navigation
   - Clear feedback

---

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

---

## 🚀 Development

### Running Locally

```bash
# Install dependencies
npm install

# Start in dev mode (with auto-reload)
npm run dev

# Or run directly
npm start
```

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Adding Features

1. **New UI Component**: Add to `src/ui/`
2. **New Search Feature**: Update `src/search/search-engine.js`
3. **New Command**: Add to `src/commands/`
4. **New Test**: Add to `tests/`

---

## 📈 Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Project structure
- [x] Main CLI framework
- [x] Welcome screen
- [x] Interactive menu
- [x] Workspace data loader

### ✅ Phase 2: Core Features (COMPLETE)
- [x] AI-powered search
- [x] Quick actions menu
- [x] Statistics display
- [x] Browse by category
- [x] Package details view

### 🚧 Phase 3: Polish (In Progress)
- [ ] Full AI assistant integration
- [ ] Test runner integration
- [ ] Batch dependency installer
- [ ] Documentation viewer in-tool
- [ ] Export/report generation

### 🔮 Phase 4: Advanced (Future)
- [ ] Natural language commands
- [ ] Learning from user behavior
- [ ] Custom action scripts
- [ ] Plugin system
- [ ] Cloud sync

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Code Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep it THE TERRAFUSION WAY!

---

## 📝 License

MIT License - See LICENSE file for details

---

## 💬 Support

- **Documentation**: See `WORKSPACE_NAVIGATION_GUIDE.md`
- **Issues**: GitHub Issues
- **Questions**: Team chat

---

## 🎉 Credits

**Built with ❤️  by the TerraFusion OS Team**

Part of the Strategic Enhancements initiative (Week 4)

### Special Thanks

- Week 1: Documentation Layer foundation
- Week 2: Validation framework integration
- Week 3: Path resolution system
- Week 4: **YOU ARE HERE!** 🎯

---

## 🌟 Quick Reference

### Common Commands

```bash
# Launch tool
tf-explore

# Search
tf-explore --search "keyword"

# Quick mode
tfx --quick

# Debug
tfx --debug

# Help
tfx --help
```

### Keyboard Shortcuts

- **↑/↓**: Navigate menu
- **Enter**: Select option
- **Ctrl+C**: Exit anytime
- **Tab**: Autocomplete (in input)

### Tips & Tricks

1. **Use search first** - Fastest way to find anything
2. **Bookmark Quick Actions** - Save time on common tasks
3. **Check stats regularly** - Monitor workspace health
4. **Browse by tier** - Understand package hierarchy
5. **Enable debug mode** - When troubleshooting

---

**🌍 Welcome to TerraFusion Workspace Explorer!**  
**Navigate with confidence. Build with joy. THE TERRAFUSION WAY! ✨**
