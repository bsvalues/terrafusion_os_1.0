# TerraFusion TerraBuild Documentation Index

## Claude Code Development Guides

This repository contains comprehensive documentation for Claude Code (claude.ai/code) and AI-assisted development. All guides follow the **TerraFusion Way** - Execute with Excellence.

### 📚 Documentation Suite (105KB total)

#### **[CLAUDE.md](./CLAUDE.md)** (16KB)
**Start here!** Main development guide covering:
- Quick start commands and project structure
- Architecture overview (single-port, database, MCP agents, authentication)
- Development patterns for routes, database, agents, and components
- Critical development rules and common issues
- Infrastructure & DevOps overview

**When to read**: First time working with the codebase, or need general orientation

---

#### **[CLAUDE-BACKEND.md](./CLAUDE-BACKEND.md)** (21KB)
Backend development deep dive covering:
- Complete server architecture and file organization
- Application initialization sequence (critical order!)
- Database layer with Drizzle ORM patterns
- Route development patterns and authentication
- Cost calculation engine architecture
- MCP agent development and orchestration
- Service layer patterns and error handling
- Testing and performance optimization

**When to read**: Working on server-side code, API routes, database, or MCP agents

---

#### **[CLAUDE-FRONTEND.md](./CLAUDE-FRONTEND.md)** (24KB)
Frontend development deep dive covering:
- Complete client architecture and component organization
- Component development patterns (basic, forms, complex)
- Data fetching with TanStack Query
- State management (React Context, local state)
- Routing with Wouter
- Styling with Tailwind CSS
- Visualization components (Recharts, Three.js)
- File uploads, error boundaries, and accessibility
- Performance optimization and testing

**When to read**: Working on React components, UI, state management, or client-side features

---

#### **[CLAUDE-MCP-AGENTS.md](./CLAUDE-MCP-AGENTS.md)** (24KB)
MCP (Model Content Protocol) agent development guide covering:
- MCP framework architecture and concepts
- Complete agent creation walkthrough with code examples
- BaseAgent class and agent lifecycle
- Inter-agent communication (event bus, direct calls)
- Agent orchestrator and coordinator
- Real-world example: Benton County Conversion Agent
- Agent monitoring and best practices

**When to read**: Creating or modifying AI agents, working on agent coordination, or debugging agent issues

---

#### **[CLAUDE-DATABASE.md](./CLAUDE-DATABASE.md)** (20KB)
Database schema and Drizzle ORM guide covering:
- Complete schema structure and table organization
- Deep dive on key tables (properties, improvements, costMatrix, users)
- Table relationships and foreign keys
- Common query patterns (insert, select, update, delete, joins, transactions)
- Type safety with TypeScript and Zod validation
- Schema changes and migration strategy
- Performance tips and best practices

**When to read**: Working with database, creating tables, writing queries, or making schema changes

---

### 🗺️ Quick Navigation by Task

#### "I need to..."

**Get started with development**
→ [CLAUDE.md](./CLAUDE.md) - Quick Start section

**Add a new API endpoint**
→ [CLAUDE-BACKEND.md](./CLAUDE-BACKEND.md) - Route Development Patterns

**Create a new React component**
→ [CLAUDE-FRONTEND.md](./CLAUDE-FRONTEND.md) - Component Development Patterns

**Work with the database**
→ [CLAUDE-DATABASE.md](./CLAUDE-DATABASE.md) - Common Query Patterns

**Add a new table to the schema**
→ [CLAUDE-DATABASE.md](./CLAUDE-DATABASE.md) - Schema Changes section

**Create a new MCP agent**
→ [CLAUDE-MCP-AGENTS.md](./CLAUDE-MCP-AGENTS.md) - Creating a New MCP Agent

**Understand the cost calculation engine**
→ [CLAUDE-BACKEND.md](./CLAUDE-BACKEND.md) - Cost Calculation Engine section

**Build a data visualization**
→ [CLAUDE-FRONTEND.md](./CLAUDE-FRONTEND.md) - Visualization Components

**Debug authentication issues**
→ [CLAUDE.md](./CLAUDE.md) - Authentication section
→ [CLAUDE-BACKEND.md](./CLAUDE-BACKEND.md) - Authentication Middleware

**Optimize database queries**
→ [CLAUDE-DATABASE.md](./CLAUDE-DATABASE.md) - Performance Tips

**Deploy to production**
→ [CLAUDE.md](./CLAUDE.md) - Infrastructure & DevOps

---

### 📖 Related Documentation

Beyond the CLAUDE guides, see also:

- **[README.md](./README.md)** - Project overview and getting started
- **[API-ENDPOINTS.md](./API-ENDPOINTS.md)** - Complete API endpoint reference
- **[DEVOPS_README.md](./DEVOPS_README.md)** - Infrastructure and deployment guide
- **[test-documentation.md](./test-documentation.md)** - Testing infrastructure
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - GitHub Copilot development patterns
- **[PROPERTY_DATA_IMPORT.md](./PROPERTY_DATA_IMPORT.md)** - Property data import procedures

---

### 🎯 Documentation Philosophy

These guides follow these principles:

1. **Big Picture First** - Focus on architecture that requires reading multiple files to understand
2. **Code Examples** - Practical, copy-pasteable patterns
3. **No Obvious Advice** - Skip generic best practices everyone knows
4. **Navigate by Intent** - Organized by what you're trying to do
5. **The TerraFusion Way** - Production government infrastructure, excellence is non-negotiable

---

### 📊 Documentation Statistics

- **Total Size**: ~105KB of comprehensive development guidance
- **Code Examples**: 100+ practical, tested code snippets
- **Coverage Areas**: Architecture, Backend, Frontend, Database, AI Agents
- **Development Patterns**: Routes, Components, Queries, Agents, Testing, Deployment

---

### 🚀 Getting Started Checklist

For new developers joining the project:

- [ ] Read [CLAUDE.md](./CLAUDE.md) - Main guide (15 min)
- [ ] Skim relevant specialty guide based on your role:
  - Backend: [CLAUDE-BACKEND.md](./CLAUDE-BACKEND.md)
  - Frontend: [CLAUDE-FRONTEND.md](./CLAUDE-FRONTEND.md)
  - Database: [CLAUDE-DATABASE.md](./CLAUDE-DATABASE.md)
  - AI Agents: [CLAUDE-MCP-AGENTS.md](./CLAUDE-MCP-AGENTS.md)
- [ ] Review [API-ENDPOINTS.md](./API-ENDPOINTS.md) - API reference
- [ ] Check [.github/copilot-instructions.md](./.github/copilot-instructions.md) - Critical patterns
- [ ] Run `npm install && npm run dev` - Verify local setup works

---

### 💡 Tips for Using These Guides

**For Claude Code AI**:
- Start with CLAUDE.md for general context
- Load specific specialty guides as needed for deep dives
- Reference CLAUDE-DATABASE.md for any database work
- Check CLAUDE-MCP-AGENTS.md when working with AI agents

**For Human Developers**:
- Use as reference, not tutorial - assumes TypeScript/React knowledge
- Code examples are production-ready patterns from the actual codebase
- Navigation section helps find specific tasks quickly
- Keep open in split screen while coding

**For Code Reviews**:
- Ensure new code follows patterns in relevant guide
- Database changes must follow CLAUDE-DATABASE.md schema patterns
- New agents must extend BaseAgent per CLAUDE-MCP-AGENTS.md
- API routes must follow CLAUDE-BACKEND.md structure

---

**Last Updated**: October 2025
**Maintained by**: TerraFusion Development Team
**Classification**: Internal Development Documentation
**Quality Standard**: The TerraFusion Way - Execute with Excellence
