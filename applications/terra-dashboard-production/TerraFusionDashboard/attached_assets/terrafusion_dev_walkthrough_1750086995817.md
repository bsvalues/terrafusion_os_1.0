# Terrafusion Development Environment Setup
## Complete Walkthrough: From Cursor AI to Production

### 🎯 System Architecture Overview

```
Terrafusion Ecosystem
├── TerraFusionPlayground     → Main IDE/Agent Builder
├── TerraBuild               → County Valuation Application  
├── TerraFlow                → Agent Orchestration Layer
├── TFPlatformDev           → Shared Platform Services
└── TerraAgent              → Individual Agent Implementations
```

### 📁 Project Structure Analysis

Based on the extracted archives, here's what we're working with:

| Component | Purpose | Tech Stack | Status |
|-----------|---------|-----------|---------|
| **TerraFusionPlayground** | AI Agent IDE & Builder | React/TypeScript/Monaco | Primary Development Tool |
| **TerraBuild** | Property Valuation App | Node.js/Express/PostgreSQL | Production-Ready Application |
| **TerraFlow** | Agent Orchestration | MCP Protocol/Event Bus | Core Infrastructure |
| **TFPlatformDev** | Platform Services | React/FastAPI/Shared UI | Supporting Framework |
| **TerraAgent** | Agent Implementations | Python/TypeScript/AI Models | Modular Components |

---

## 🚀 Step 1: Open Cursor AI & Project Setup

### Launch Cursor AI
1. Open **Cursor AI** (or VS Code with Cursor extension)
2. Navigate to **File → Open Folder**
3. Select your preferred starting point:

**Recommended Order:**
1. **TerraFusionPlayground** (for IDE development)
2. **TerraBuild** (for application development)
3. **TerraFlow** (for agent orchestration)

---

## 🔧 Step 2: Environment Configuration

### Prerequisites Check
```bash
# Verify required tools
node --version    # Should be 18+ 
npm --version     # Should be 8+
python --version  # Should be 3.9+
git --version     # Should be 2.25+
docker --version  # Should be 20+ (optional)
```

### Install Global Dependencies
```bash
# Install package managers
npm install -g pnpm turbo
pip install uv poetry

# Install development tools
npm install -g typescript tsx nodemon
pip install uvicorn fastapi python-dotenv
```

---

## 📦 Step 3: Project-Specific Setup

### A. TerraFusionPlayground (Main IDE)

```bash
cd TerraFusionPlayground/
npm install
# or if using pnpm workspace
pnpm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
# Expected: http://localhost:3000
```

**Key Features:**
- Monaco Editor integration
- Agent visual builder
- PromptOps console
- Live agent testing
- MCP protocol integration

### B. TerraBuild (Valuation Application)

```bash
cd TerraBuild/
npm install

# Database setup
npm run db:setup
npm run db:migrate

# Start backend
npm run server:dev
# Expected: http://localhost:5000

# Start frontend (separate terminal)
npm run client:dev
# Expected: http://localhost:3000
```

**Key Features:**
- Property valuation engine
- Cost matrix editor
- AI agent coordination
- PDF/CSV export
- County-specific branding

### C. TerraFlow (Agent Orchestration)

```bash
cd TerraFlow/
pip install -r requirements.txt
# or
uv pip install -r requirements.txt

# Start MCP server
uvicorn main:app --reload --port 8000
# Expected: http://localhost:8000
```

**Key Features:**
- MCP protocol implementation
- Agent message routing
- Event bus coordination
- Tool registration

### D. TFPlatformDev (Platform Services)

```bash
cd TFPlatformDev/
npm install

# Start platform services
npm run dev
# Expected: http://localhost:4000
```

**Key Features:**
- Shared UI components
- Authentication services
- Configuration management
- Deployment tools

---

## 🧠 Step 4: Understanding the Development Workflow

### Development Flow

1. **IDE Development** (TerraFusionPlayground)
   - Design agent workflows
   - Create prompt templates
   - Test agent interactions
   - Export configurations

2. **Application Development** (TerraBuild)
   - Implement business logic
   - Design user interfaces
   - Integrate agent systems
   - Test valuations

3. **Agent Development** (TerraAgent)
   - Build specialized agents
   - Implement MCP protocols
   - Add capability definitions
   - Test agent performance

4. **Infrastructure** (TerraFlow + TFPlatformDev)
   - Manage agent orchestration
   - Handle authentication
   - Deploy services
   - Monitor performance

---

## 🎨 Step 5: IDE-Specific Features (TerraFusionPlayground)

### PromptOps Studio
- **Location:** `/apps/promptops/`
- **Features:**
  - Template editor with syntax highlighting
  - Variable substitution system
  - Prompt testing with live models
  - Export to agent configurations

### Agent Visual Builder
- **Location:** `/apps/agent-builder/`
- **Features:**
  - Drag-and-drop workflow design
  - Agent capability mapping
  - Connection testing
  - Configuration export

### Live Development Environment
- **Location:** `/apps/playground/`
- **Features:**
  - Real-time agent interaction
  - Debug console
  - Performance metrics
  - Session recording

---

## 🔄 Step 6: Integration Points

### MCP Protocol Integration
```typescript
// Example agent registration
const agent = new TerraBuildAgent({
  id: 'cost-estimator',
  capabilities: ['cost-analysis', 'rcn-calculation'],
  mcp: {
    server: 'http://localhost:8000',
    protocol: 'mcp-1.0'
  }
});
```

### Database Connections
```typescript
// Shared database configuration
const db = new DrizzleDatabase({
  connection: process.env.DATABASE_URL,
  schema: './shared/schema.ts'
});
```

### Agent Communication
```typescript
// Event bus integration
eventBus.subscribe('agent:cost:request', async (data) => {
  const result = await costAgent.analyze(data);
  eventBus.publish('agent:cost:response', result);
});
```

---

## 🛠️ Step 7: Development Commands

### Workspace Commands (if using monorepo)
```bash
# Install all dependencies
pnpm install

# Build all packages
turbo build

# Run all dev servers
turbo dev

# Run tests
turbo test

# Lint and format
turbo lint
turbo format
```

### Individual Project Commands
```bash
# TerraFusionPlayground
npm run dev          # Start IDE
npm run build        # Build for production
npm run test         # Run tests
npm run storybook    # Component library

# TerraBuild
npm run server:dev   # Start backend
npm run client:dev   # Start frontend
npm run db:migrate   # Run database migrations
npm run agents:start # Start agent services

# TerraFlow
uvicorn main:app --reload    # Start MCP server
python -m pytest           # Run tests
python scripts/deploy.py   # Deploy agents
```

---

## 🔧 Step 8: Configuration Files

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/terrafusion
REDIS_URL=redis://localhost:6379

# AI Services
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=your-key-here

# MCP Configuration
MCP_SERVER_URL=http://localhost:8000
AGENT_REGISTRY_URL=http://localhost:8001

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm:server:dev\" \"npm:client:dev\"",
    "server:dev": "nodemon server/index.ts",
    "client:dev": "vite",
    "build": "turbo build",
    "test": "jest",
    "agents:start": "node scripts/start-agents.js"
  }
}
```

---

## 🚀 Step 9: Getting Started Checklist

### Initial Setup
- [ ] Clone/extract all repositories
- [ ] Install Node.js 18+ and Python 3.9+
- [ ] Install global dependencies (pnpm, turbo, uvicorn)
- [ ] Copy `.env.example` to `.env` in each project
- [ ] Install project dependencies

### Development Environment
- [ ] Start TerraFusionPlayground IDE (`npm run dev`)
- [ ] Start TerraBuild application (`npm run dev`)
- [ ] Start TerraFlow MCP server (`uvicorn main:app --reload`)
- [ ] Verify all services are running

### First Development Task
- [ ] Open TerraFusionPlayground IDE
- [ ] Create a simple agent in the visual builder
- [ ] Test the agent with sample data
- [ ] Export configuration to TerraBuild
- [ ] Verify integration works end-to-end

---

## 🎯 Step 10: Next Actions

### Immediate Tasks
1. **Explore TerraFusionPlayground** - Familiarize yourself with the IDE interface
2. **Review TerraBuild** - Understand the valuation application structure
3. **Test Agent Communication** - Verify MCP protocol integration
4. **Create Sample Agent** - Build your first custom agent

### Development Goals
1. **Master the IDE** - Become proficient with PromptOps and Agent Builder
2. **Extend TerraBuild** - Add new valuation features
3. **Build Custom Agents** - Create specialized agents for your use cases
4. **Deploy to Production** - Use the provided deployment scripts

---

## 📞 Support & Resources

### Documentation
- **API Reference:** `/docs/API_REFERENCE.md`
- **Deployment Guide:** `/docs/DEVOPS_KIT.md`
- **Architecture Overview:** `/docs/PRODUCT_REQUIREMENTS_DOCUMENT.md`

### Development Tools
- **Health Dashboard:** `http://localhost:5000/health`
- **Agent Monitor:** `http://localhost:5000/agents`
- **API Documentation:** `http://localhost:5000/api/docs`

### Troubleshooting
- Check port conflicts (3000, 4000, 5000, 8000)
- Verify environment variables are set
- Ensure all services are running
- Check logs for specific error messages

---

**🎉 You're now ready to contribute to the Terrafusion ecosystem!**

Start with TerraFusionPlayground to understand the agent development workflow, then move to TerraBuild for application-specific features.