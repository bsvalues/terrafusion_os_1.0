# 🔧 OS KERNEL - TerraFusion Operating System Core

**The Engine Room for Generation 2 Applications**

---

## Overview

The `os-kernel` directory contains the foundational infrastructure that all Generation 2 TerraFusion applications depend on:

| Component | Location | Purpose |
|-----------|----------|---------|
| **Database Schema** | `database/` | PostgreSQL schema for OS Data Layer |
| **API Gateway** | `api/` | Deno-native HTTP API server |
| **Migrations** | `run-migrations.ps1` | Database migration runner |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GEN 2 APPLICATIONS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ TerraDossier│  │  Future App │  │  Future App │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          │                                          │
│                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              OS KERNEL API GATEWAY (:5000)                   │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ /api/health     │ /api/identity │ /api/data/*       │    │   │
│  │  │ /api/ai/chat    │ /api/ai/generate                  │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └────────────────────────────┬────────────────────────────────┘   │
│                               │                                     │
│                               ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              POSTGRESQL (WSL :5432)                          │   │
│  │              Database: terrafusion_os                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Start PostgreSQL (OS Data Layer)

```powershell
# From project root
.\scripts\ignite-os-data-layer.ps1
```

### 2. Run Database Migrations

```powershell
cd os-kernel
.\run-migrations.ps1
```

### 3. Start API Gateway

```powershell
cd os-kernel/api
deno task dev
```

The API will be available at: **http://localhost:5000**

---

## API Endpoints

### Health Check

```http
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "service": "os-kernel-api",
  "version": "1.0.0",
  "generation": 2,
  "components": {
    "database": "connected",
    "api": "running"
  }
}
```

### Identity

```http
GET /api/identity/me
```

Returns the current user context (from OS Shell session).

### Notebooks (TerraDossier Data)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/data/notebooks` | List all notebooks |
| `POST` | `/api/data/notebooks` | Create notebook |
| `GET` | `/api/data/notebooks/:id` | Get notebook with blocks |
| `PUT` | `/api/data/notebooks/:id` | Update notebook |
| `DELETE` | `/api/data/notebooks/:id` | Archive notebook |
| `POST` | `/api/data/notebooks/:id/blocks` | Add block |
| `PUT` | `/api/data/notebooks/:id/blocks/:blockId` | Update block |
| `DELETE` | `/api/data/notebooks/:id/blocks/:blockId` | Delete block |

### AI Swarm Gateway

```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "Generate a property assessment report",
  "model": "gpt-4o"
}
```

```http
POST /api/ai/generate
Content-Type: application/json

{
  "template": "property-assessment",
  "data": {
    "parcelId": "123456",
    "address": "123 Main St"
  }
}
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `counties` | Multi-tenant county isolation |
| `users` | User accounts (synced from OS Shell) |
| `sessions` | API authentication sessions |
| `notebooks` | TerraDossier notebooks |
| `notebook_blocks` | Content blocks within notebooks |
| `ai_conversations` | AI chat sessions |
| `ai_messages` | Individual AI messages |
| `audit_log` | FISMA compliance audit trail |
| `system_config` | System configuration |
| `feature_flags` | Feature flag management |
| `schema_migrations` | Migration tracking |

### Entity Relationships

```
counties ─┬─► users ─┬─► sessions
          │          │
          │          ├─► notebooks ───► notebook_blocks
          │          │
          │          └─► ai_conversations ───► ai_messages
          │
          └─► audit_log
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `5000` | API server port |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_DB` | `terrafusion_os` | Database name |
| `POSTGRES_USER` | `terrafusion_admin` | Database user |
| `POSTGRES_PASSWORD` | `tf_sovereign_dev_pw` | Database password |

These can be set in `.env.sovereign` at the project root.

---

## Development

### Prerequisites

- Deno 2.x
- PostgreSQL (via WSL)
- WSL with Ubuntu

### Running Tests

```bash
cd os-kernel/api
deno task test
```

### Formatting & Linting

```bash
deno task fmt
deno task lint
```

---

## Directory Structure

```
os-kernel/
├── api/
│   ├── deno.json           # Deno manifest
│   └── main.ts             # API server
├── database/
│   └── 001_initial_schema.sql   # Initial schema
├── run-migrations.ps1      # Migration runner
└── README.md               # This file
```

---

## Security Notes

- All database operations are county-scoped
- Audit logging tracks all data changes
- CORS configured for known origins only
- Session tokens are hashed
- FISMA-HIGH compliance ready

---

## Integration with Gen 2 Apps

Generation 2 applications connect to this API instead of managing their own infrastructure:

```typescript
// TerraDossier connecting to OS Kernel API
const response = await fetch('http://localhost:5000/api/data/notebooks');
const { data: notebooks } = await response.json();
```

This is the **TerraFusion Way** - lightweight apps, powerful kernel.

---

*OS Kernel API - The Engine Room of TerraFusion OS*
