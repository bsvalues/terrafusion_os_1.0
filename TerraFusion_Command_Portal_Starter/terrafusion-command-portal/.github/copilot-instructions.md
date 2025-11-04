# TerraFusion Command Portal - AI Coding Agent Instructions

## Project Overview
TerraFusion Command Portal is an enterprise-grade government platform combining Rust backend services with Next.js frontend, featuring a sophisticated AI agent swarm (1,008 agents) and federation capabilities across 7 Washington State counties. This is NOT a typical web app - it's a distributed government infrastructure platform.

## Architecture Fundamentals

### Multi-Service Backend (Rust + Axum)
- **Entry Point**: `backend/src/main.rs` - monolithic server with modular services
- **AI Integration**: `agent_relay.rs` implements Agent Relay Protocol v1.0 for 1,008-agent swarm
- **Federation**: `federation_relay.rs` manages cross-county mesh communication with real-time monitoring
- **Core Services**: Each `.rs` file in `src/` is a domain service (workspace, terminal, AI, telemetry)
- **WebSocket Heavy**: Extensive WebSocket usage for real-time AI agent communication

### Frontend Architecture (Next.js 15 + React 19)
- **Monorepo Structure**: Uses npm workspaces with `apps/terrafusion-web/` as primary app
- **State Management**: Zustand for predictable state, React Query for server state
- **Real-time**: WebSocket integration with backend for live agent updates
- **3D Visualizations**: Three.js integration for workspace and data visualization

### Key Integration Points
- **Agent Relay Protocol**: WebSocket-based communication at `/ws/agents` endpoint
- **Federation Mesh**: Inter-county communication via `federation_relay.rs`
- **MCP Integration**: 87 Model Context Protocol tools accessible via `/api/mcp/tools`

## Critical Development Workflows

### Local Development
```bash
# Backend development
cd backend && cargo run  # Starts on port 8787

# Frontend development  
cd apps/terrafusion-web && npm run dev  # Starts on port 5177

# Full stack development
npm run dev  # Starts both services via concurrently
```

### Build Commands
```bash
# Production build
npm run build  # Builds both frontend and backend

# Individual builds
npm run build:frontend  # Next.js build
npm run build:backend   # Cargo build --release
```

### Docker Development
```bash
make up     # Docker Compose full stack
make api    # Backend only
make web    # Frontend only
```

## Project-Specific Patterns

### Service Module Structure
Each Rust service follows this pattern:
```rust
// Service state with Arc<> for shared access
pub struct ServiceName {
    state: Arc<RwLock<ServiceData>>,
}

// Router integration in main.rs
app.route("/api/service", get(service_handler))
```

### AI Agent Communication
- All agent messages use `AgentMessage` struct with protocol versioning
- Messages routed via `agent_relay.rs` to appropriate agent pools
- WebSocket subscriptions managed per conversation ID

### Federation Protocol
- County nodes communicate via encrypted mesh topology
- Real-time health monitoring with `HealthChecker`
- Message routing strategies: nearest, broadcast, targeted

### State Management Patterns
- Backend: `Arc<RwLock<>>` for concurrent access to shared state
- Frontend: Zustand stores with TypeScript interfaces
- WebSocket state synchronized between frontend/backend

## Security & Compliance Requirements

### Government Standards
- FedRAMP controls implementation required
- JWT authentication with role-based access control
- All communication encrypted (mTLS for inter-service)
- Comprehensive audit logging for all operations

### Development Security
- No hardcoded secrets - use environment variables
- Docker security: non-root users, read-only filesystems
- Rust security: `cargo audit` in CI/CD pipeline

## Testing Strategy

### Backend Testing
```bash
cd backend && cargo test  # Unit tests
cargo clippy              # Linting
```

### Frontend Testing
```bash
cd apps/terrafusion-web
npm run test              # Vitest unit tests
npm run type-check        # TypeScript validation
```

## Key Dependencies & Integration

### Backend Dependencies
- **axum**: Web framework with WebSocket support
- **tokio**: Async runtime for all services
- **serde**: JSON serialization for API communication
- **tower-http**: CORS and middleware
- **jsonwebtoken**: JWT authentication

### Frontend Dependencies
- **Next.js 15**: App Router with TypeScript
- **React 19**: Latest React features
- **Zustand**: Client state management
- **React Query**: Server state and caching
- **Three.js**: 3D visualizations

## Common Gotchas

### Port Configuration
- Backend runs on port 8787 (not 8080)
- Frontend dev server on port 5177 (not 3000)
- Docker Compose binds to localhost only for security

### AI Agent Integration
- Agent responses are async - always handle WebSocket connections properly
- Message routing requires conversation_id for proper agent assignment
- Agent pools have different capabilities - check agent_type before routing

### Federation Communication
- County nodes require trust verification before message exchange
- Health checking is continuous - expect connection state changes
- FIPS codes used for geographic routing decisions

### Build System
- Workspace-based npm commands may fail if run from wrong directory
- Cargo build requires specific environment variables for production
- Docker builds use multi-stage builds - modify Dockerfile carefully

## File Organization
- `/backend/src/`: Individual service modules, avoid monolithic files
- `/apps/terrafusion-web/app/`: Next.js App Router structure
- `/k8s/`: Production Kubernetes manifests
- `/scripts/`: Deployment and utility scripts
- `/.github/workflows/`: Government-grade CI/CD pipelines