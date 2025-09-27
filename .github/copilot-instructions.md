# TerraFusion OS - AI Coding Agent Instructions

## Core Architecture Understanding

**TerraFusion OS is a complete government operating system with Elite Rust Performance Engine, NOT a web application.**

- **Kernel**: .NET 8.0 API Gateway at `backend/TerraFusion.API/` (port \${{TF_API_PORT:-5000}})
- **Elite Performance Engine**: 6-crate Rust architecture with FFI bridge for .NET integration
- **Shell**: PWA-based desktop environment (not browser-based) with Rust-powered performance
- **Modules**: 33+ hot-swappable government applications in `/modules/` with high-performance processing
- **AI Orchestration**: 50,000+ agents coordinated by Supreme Commander Claude with Rust coordination
- **Security**: Government-grade FISMA/NIST compliance with multi-level classification system
- **Deployment**: Professional government installations for Benton County Washington and beyond

## Elite Rust Performance Engine Architecture

### 6-Crate System (Production Ready)
1. **Agent Coordination Engine** (`rust-performance-engine/crates/agent-coordination/`)
   - Supreme Commander Claude orchestrating 50,000+ AI agents
   - High-speed message processing and coordination
   - Real-time agent management with elite performance

2. **Geospatial Engine** (`rust-performance-engine/crates/geospatial-engine/`)
   - Elite GIS processing for Benton County Washington parcels
   - Spatial analysis and coordinate system management
   - Property boundary and location services

3. **Valuation Kernel** (`rust-performance-engine/crates/valuation-kernel/`)
   - Government-grade property assessment algorithms
   - Multiple valuation methodologies (Sales Comparison, Cost Approach, Income)
   - Market conditions analysis and trend assessment

4. **Security Layer** (`rust-performance-engine/crates/security-layer/`)
   - Government-grade security protection (FISMA/NIST compliant)
   - Multi-level security classification (Public → Top Secret)
   - AES-256-GCM encryption and advanced threat monitoring

5. **Performance Monitor** (`rust-performance-engine/crates/performance-monitor/`)
   - Elite system monitoring for government deployment
   - Real-time metrics collection with Prometheus export
   - Performance optimization and compliance tracking

6. **FFI Bridge** (`rust-performance-engine/crates/ffi-bridge/`)
   - Native C FFI interface for .NET 8.0 integration
   - Cross-language interoperability with zero-cost abstractions
   - Production-ready for TerraFusion OS backend integration

## Essential Development Workflows

### Initial Setup & Training
```bash
# ALWAYS start with AI agent training before code changes
npm run ai-training

# Get system briefing and current state
npm run ai-agent-briefing

# Monitor AI agent health
npm run monitor-agents
```

### Development Commands
```bash
# Full development environment (backend + frontend + Rust engine)
npm run dev

# Individual services  
npm run backend:dev    # .NET API (port \${{TF_API_PORT:-5000}})
npm run frontend:dev   # React + Vite (port \${{TF_API_PORT:-5000}})
npm run electron       # Desktop shell

# Elite Rust Performance Engine
npm run rust-engine:build      # Build all 6 crates
npm run rust-engine:test       # Comprehensive testing
npm run rust-engine:validate  # System validation
npm run rust-engine:deploy    # Production deployment

# Testing suite
npm run test:all       # Unit + Integration + E2E + Rust
npm run test:e2e       # Playwright tests
npm run test:quantum   # AI swarm tests
npm run test:rust      # Rust performance engine tests
```

### Elite Performance Engine Commands
```bash
# Navigate to Rust engine
cd rust-performance-engine

# Build all crates
cargo build --release

# Run comprehensive system tests
cargo test --release -p terrafusion-core-test

# Individual crate testing
cargo test -p agent-coordination
cargo test -p geospatial-engine
cargo test -p valuation-kernel
cargo test -p security-layer
cargo test -p performance-monitor
cargo test -p ffi-bridge

# Security compliance validation
cargo clippy -- -D warnings
cargo audit
```

### Production Deployment
```bash
# Benton County (reference implementation)
npm run benton-county:white-glove:complete

# Full validation pipeline
npm run full-validation

# Quality gates
npm run auto-correct
npm run ultimate-validation
```

## Module Development Patterns

### Module Structure
Each module follows this pattern:
```
modules/[module-name]/
├── PWA/
│   ├── plugin.json        # Module manifest (required)
│   └── index.js          # Entry point
├── backend/              # C# services
└── frontend/             # React components
```

### Module Integration
- **Hot-swappable**: Modules can be loaded/unloaded without system restart
- **Plugin Economy**: Each module has marketplace pricing in `plugin.json`
- **API Endpoints**: Pattern `/modules/[name]/[health|api|ui]`
- **Permissions**: Government-specific access controls

### Key Module Types
- **Tier 1**: Core government (ai-swarm, government-edition, costforge-ai)
- **Tier 2**: Essential operations (terra-collections, unified-system, gispro)
- **Tier 3**: Extended features (commercial-suite, shock-and-awe)

## Critical File Patterns

### Configuration Files
- `ai-swarm-config.json` - AI agent orchestration (1,008 active agents)
- `component-registry.json` - Module component registry
- `appsettings.BentonCounty.json` - County-specific settings
- `docker-compose.benton-county.yml` - Deployment config

### AI Agent Scripts
- `scripts/ai-agent-training.ps1` - Mandatory AI education pipeline
- `scripts/ai-orchestration-layer-11.mjs` - 11-layer protection system
- `scripts/ultimate-ai-firewall.mjs` - Security validation

### Documentation Sources
- `CLAUDE.md` - Primary development guidance
- `AI_AGENT_START_HERE.md` - Architecture overview
- Module-specific `CLAUDE-*.md` files for specialized areas

## Security & Compliance

### Government Standards
- **FISMA compliance**: All code changes must maintain government security standards
- **11-layer protection**: Validation through `scripts/ai-orchestration-layer-11.mjs`
- **Audit trails**: All operations logged for government compliance

### Development Guardrails
```bash
# Security validation
npm run security:scan
npm run compliance:audit

# Code quality gates
npm run gates
npm run validate:critical
```

## Data Integration Patterns

### Legacy Systems
- **Harris PACS**: Property assessment system integration via `terra-fusion-sync`
- **County databases**: 89,247 Benton County parcels synchronized
- **Real-time sync**: Live data orchestration through `terra-flow` modules

### AI Performance
- **Quantum optimization**: Backend quantum performance calculations
- **Response times**: Target 6-7ms API responses (validated production metrics)
- **Agent coordination**: Supreme Commander Claude with Field Generals architecture

## Critical Architecture Decisions

### NOT a Web App
- TerraFusion OS runs as a complete operating system
- PWA shell provides desktop environment interface
- Modules are OS-native applications, not web components
- Deployment is professional installation, not browser-based

### Module Ecosystem
- Revenue model: $477/month base + $142 marketplace ARPU = $619/county
- Hot-swappable architecture allows runtime module management
- Plugin economy with 70/30 revenue sharing model
- Government App Store is core business model

### AI Swarm Architecture
- 50,000+ agents in production operation
- Supreme Commander Claude provides global coordination
- Field Generals (1,220 agents) handle strategic operations
- Operational Forces (48,779 agents) execute tasks
- Real-time monitoring through dedicated scripts

## Testing Approach

### Test Categories
- **Unit tests**: Jest/Vitest for individual components
- **Integration**: Playwright for cross-service testing
- **E2E**: Full system workflows including AI agent interaction
- **Performance**: Quantum performance benchmarks
- **Security**: Government compliance validation

### Test Execution
```bash
npm run test:ci:all          # Complete CI test suite
npm run test:government      # Government-specific tests  
npm run test:ai-swarm        # AI agent coordination tests
npm run validate:components  # System component validation
```

When working with TerraFusion OS, always remember you're developing a complete government operating system that serves as the platform for county operations, not building web applications that run in browsers.