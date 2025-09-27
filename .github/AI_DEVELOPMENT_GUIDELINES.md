# TerraFusion OS - AI Development Guidelines

## 🚨 CRITICAL FRONTEND ARCHITECTURE RULE

**NEVER work in `/frontend/` - ALWAYS use `/frontend-v2/`**

The `/frontend/` directory is legacy code with 97+ TypeScript errors.  
The `/frontend-v2/` directory is the enterprise-grade frontend (Version 2.0.0).

---

## Frontend Architecture

- **Legacy Frontend**: `/frontend/` (DEPRECATED - DO NOT USE)
- **Enterprise Frontend**: `/frontend-v2/` (ACTIVE - USE THIS)

### Frontend-v2 Structure
```
frontend-v2/
├── shell/                 # OS Shell Application (Port \${{TF_LOKI_PORT:-3100}})
├── packages/
│   ├── shared/           # Brand System & Components
│   └── modules/          # Government Service Modules
```

---

## Development Commands

### Frontend-v2 (Enterprise)
```bash
cd frontend-v2/shell
npm install && npm run dev:os    # Port \${{TF_LOKI_PORT:-3100}}
```

### Backend API
```bash
cd backend/TerraFusion.API
dotnet run                       # Port \${{TF_LOKI_PORT:-3100}}
```

---

## Architecture Principles

1. **Government Operating System**: TerraFusion OS is NOT a web app
2. **Module Economy**: 33+ hot-swappable government applications
3. **AI Orchestration**: 50,000+ agents coordinated by Supreme Commander Claude
4. **Enterprise Standards**: PhD-level engineering with zero compromises

---

## Quality Gates

- Zero TypeScript compilation errors
- Government service integration
- TerraFusion brand system compliance
- Trust Fabric monitoring active

---

**Remember: We do it right the first time. Enterprise-grade only.**