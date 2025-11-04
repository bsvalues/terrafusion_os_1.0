# TerraFusionProPlus AI Coding Instructions

## Architecture Overview

TerraFusion is a real estate appraisal platform with microservices architecture:
- **Monolithic Core**: `server/` (Express.js) + `client/` (React/Vite) + `shared/` (Drizzle schema)
- **Microservices**: `analytics-service/` (Rust), `compliance-service/`, `document-service/`
- **AI Integration**: `copilot-ui/` (React), `mcp-server/` (Model Context Protocol)

## Development Patterns

### Database Schema (`shared/schema.ts`)
- Uses Drizzle ORM with PostgreSQL
- All tables include `createdAt`/`updatedAt` timestamps
- Relations defined separately (e.g., `usersRelations`, `propertiesRelations`)
- Zod validation schemas auto-generated with `createInsertSchema`
- Type exports follow pattern: `Type` (select) and `InsertType` (insert)

### API Endpoints (`server/index.js`)
- RESTful structure: `/api/properties`, `/api/appraisals`, `/api/comparables`
- Mock data used for development (replace with database queries)
- CORS enabled, Express.json middleware
- WebSocket support via `ws` package

### Frontend (`client/src/`)
- React Router v6 with TypeScript
- Custom `NavLink` component for active navigation states
- Pages: Dashboard, Properties, Appraisals, Comparables, MarketData
- Tailwind CSS for styling, Lucide React for icons

## Essential Commands

```bash
# Development
npm run dev              # Starts server on port 5000
cd client && npm run dev # Starts Vite dev server

# Database
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migrations

# Build
cd client && npm run build
```

## Key Conventions

### File Organization
- **Active code**: `server/`, `client/`, `shared/`
- **Archive**: `archive/` contains legacy/unused code (preserve but don't modify)
- **Services**: Individual microservices in root-level directories
- **Infrastructure**: `kubernetes/`, `terraform/`, `helm/`

### TypeScript Patterns
- Shared types in `shared/schema.ts`
- Client uses Vite + TypeScript
- Server has both `.js` (production) and `.ts` (development) versions

### AI Integration
- Copilot UI in separate React app (`copilot-ui/`)
- MCP server for AI agent communication
- User AI assistance levels: Minimal, Smart, Full Copilot
- All AI suggestions require user approval (Accept/Edit/Reject)

## Deployment

### Environments
- `develop` branch → development environment
- `main` branch → staging environment  
- Production requires manual workflow dispatch

### Container Strategy
- Kubernetes deployments in `kubernetes/` (production, staging)
- Helm charts in `helm/`
- Terraform for infrastructure in `terraform/`

## Service Communication
- Microservices use HTTP APIs
- Analytics service written in Rust (`analytics-service/src/main.rs`)
- Prometheus metrics enabled (port 5000, `/metrics` endpoint)
- WebSocket for real-time features

When modifying this codebase:
1. Always update both schema and types when changing database structure
2. Use the archive pattern - move unused code to `archive/` rather than deleting
3. Follow the existing REST API patterns in `server/index.js`
4. Maintain TypeScript strict mode compliance
5. Test database changes with `npm run db:push` before committing