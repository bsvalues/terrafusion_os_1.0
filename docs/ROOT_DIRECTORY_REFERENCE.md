# Terrafusion OS - Root Directory Reference

## 📁 **Directories**

### **Core Application Directories**
| Directory | Purpose | Usage |
|-----------|---------|-------|
| `backend/` | .NET 8.0 API services | Main backend API, business logic, data access |
| `frontend/` | React 18 + TypeScript frontend | Web UI, Electron app, components |
| `modules/` | Government applications (32 modules) | Individual county modules, testing suite |
| `scripts/` | Build and automation scripts | Development, deployment, maintenance scripts |
| `tests/` | Test infrastructure | Core testing, configurations, orchestrators |

### **Configuration & Setup**
| Directory | Purpose | Usage |
|-----------|---------|-------|
| `config/` | Configuration files | MCP, security, deployment configurations |
| `.vscode/` | Visual Studio Code settings | IDE configuration, debug settings |
| `.devcontainer/` | Development container setup | Docker dev environment |
| `docs/` | Documentation | All project documentation, organized by type |

### **Development Tools**
| Directory | Purpose | Usage |
|-----------|---------|-------|
| `tools/` | Development utilities | Prototypes, demos, helper scripts |
| `archive/` | Archived content | Experiments, deprecated code, old prompts |
| `deployment/` | Deployment configurations | County-specific deployment configs |
| `infrastructure/` | Infrastructure as Code | Kubernetes, Terraform, monitoring |

### **Data & Assets**
| Directory | Purpose | Usage |
|-----------|---------|-------|
| `data/` | Application data | County data, intelligence, cost matrices |
| `database/` | Database assets | Migrations, seed data, schemas |
| `keys/` | Cryptographic keys | Ed25519 keys for plugin signing |
| `artifacts/` | Build artifacts | Test results, deployment packages |

### **Legacy/Specialized**
| Directory | Purpose | Usage |
|-----------|---------|-------|
| `ai-models/` | AI model storage | Empty - models stored elsewhere |
| `packages/` | Legacy packages | Old package structure |
| `src-enhanced/` | Enhanced source | Alternative implementations |
| `championship/` | AI testing framework | Championship test orchestration |

---

## 📄 **Files**

### **Essential Project Files**
| File | Purpose | How to Use |
|------|---------|------------|
| `README.md` | Project overview and setup | **START HERE** - main project documentation |
| `package.json` | Node.js dependencies and scripts | Run `npm install`, `npm run dev` |
| `package-lock.json` | Locked dependency versions | Auto-managed by npm |
| `CHANGELOG.md` | Version history | Track changes between releases |
| `LICENSE` | Project license | Legal usage terms |

### **Development Documentation**
| File | Purpose | How to Use |
|------|---------|------------|
| `START_HERE.md` | AI agent orientation guide | **MANDATORY** for any AI working on project |
| `CLAUDE.md` | Main development guide | Core instructions for Claude Code |
| `CLAUDE-frontend.md` | Frontend development guide | React, TypeScript, Electron guidance |
| `CLAUDE-backend.md` | Backend development guide | .NET, database, infrastructure |
| `CLAUDE-ai.md` | AI swarm documentation | 1,008 agents, ML models, quantum |
| `CLAUDE-testing.md` | Testing strategies | QA, validation, test frameworks |
| `CLAUDE-api.md` | API design guide | REST endpoints, integration patterns |
| `CLAUDE-intelligence.md` | Analytics documentation | Insights, predictive capabilities |
| `TEST_REGISTRY.md` | Complete test catalog | Shows ALL 361 test locations |
| `CONTRIBUTING.md` | Contribution guidelines | How to contribute to the project |
| `SECURITY.md` | Security policies | Vulnerability reporting, security practices |

### **Configuration Files**
| File | Purpose | How to Use |
|------|---------|------------|
| `.gitignore` | Git exclusion rules | Prevents adding unwanted files |
| `.editorconfig` | Code formatting rules | IDE formatting consistency |
| `.eslintrc.json` | JavaScript/TypeScript linting | Code quality enforcement |
| `.prettierrc` | Code formatting preferences | Auto-formatting rules |
| `.lintstagedrc.json` | Pre-commit hook configuration | Lint staged files before commit |
| `tsconfig.json` | TypeScript configuration (multiple) | Primary at `frontend/tsconfig.json`; additional per-module configs |
| `vitest.config.ts` | Test framework configuration (multiple) | Root config plus `tests/vitest.config.ts` and `testing/config/vitest.config.ts` |
| `playwright.config.ts` | E2E test configuration | Playwright browser testing |
| `playwright.mcp.config.ts` | MCP-enhanced Playwright config | Enhanced testing with MCP |
| `stryker.conf.json` | Mutation testing configuration | Code mutation testing |
| `lighthouserc.json` | Performance testing | Lighthouse CI configuration |
| `perf-budgets.json` | Performance budgets | Performance target definitions |
| `nodemon.json` | Development server config | Auto-restart during development |

### **Environment & Deployment**
| File | Purpose | How to Use |
|------|---------|------------|
| `.env.example` | Environment variable template | Copy to `.env.local` and customize |
| `.env.benton` | Benton County configuration | County-specific environment |
| `.env.cowlitz` | Cowlitz County configuration | County-specific environment |
| `.env.yakima` | Yakima County configuration | County-specific environment |
| `.env.franklin` | Franklin County configuration | County-specific environment |
| `.env.asotin` | Asotin County configuration | County-specific environment |
| `.env.template` | Generic environment template | Base template for new counties |
| `.env.benton.example` | Benton County example | Example Benton configuration |
| `.env.benton.template` | Benton County template | Template for Benton setup |
| `docker-compose.dev.yml` | Development Docker setup | `docker-compose -f docker-compose.dev.yml up` |
| `docker-compose.production.yml` | Production Docker setup | Production containerization |
| `terrafusion.config.json` | Main application configuration | Core app settings |

### **Build & Automation**
| File | Purpose | How to Use |
|------|---------|------------|
| `Makefile` | Build automation | Run `make help` for available commands |
| `ai-start.sh` | AI agent startup script | `./ai-start.sh` |
| `start-simple-api.sh` | Simple API startup | `./start-simple-api.sh` |
| `start-backend-only.sh` | Backend-only startup | `./start-backend-only.sh` |
| `launch-terrafusion.sh` | Full system launcher | `./launch-terrafusion.sh` |
| `launch-terrafusion-fixed.sh` | Fixed system launcher | `./launch-terrafusion-fixed.sh` |
| `stop-terrafusion.sh` | System shutdown | `./stop-terrafusion.sh` |
| `deploy-benton.ps1` | Benton County deployment | PowerShell deployment script |
| `deploy-benton-fixed.ps1` | Fixed Benton deployment | Updated deployment script |
| `deploy-static-demo.ps1` | Static demo deployment | Deploy demo version |
| `run-test-demo.ps1` | Test demo runner | Run demo tests |

### **MCP & Integration**
| File | Purpose | How to Use |
|------|---------|------------|
| `mcp.json` | MCP server configuration | MCP protocol setup |
| `mcp-setup-report.json` | MCP setup results | Setup validation report |

### **Cryptographic & Security**
| File | Purpose | How to Use |
|------|---------|------------|
| `sign-hello.mjs` | Signature testing script | Test cryptographic signing |
| `verify-openssl.mjs` | OpenSSL verification | Verify cryptographic operations |
| `test_key.pem` | Test private key | **FOR TESTING ONLY** |
| `test_pub.pem` | Test public key | **FOR TESTING ONLY** |
| `sig.bin` | Signature file | Binary signature data |
| `test_sig.bin` | Test signature | Test signature file |
| `msg.txt` | Test message | Test message for signing |

### **Reports & Results**
| File | Purpose | How to Use |
|------|---------|------------|
| `health-check.json` | System health status | Current system health metrics |
| `validation-report.json` | System validation results | Validation test results |
| `deployment-success-report.json` | Deployment status | Last deployment results |
| `pilot-deployment-report.json` | Pilot deployment metrics | Pilot program results |
| `quantum_performance_results.json` | Quantum performance data | Performance test results |
| `quantum_roi_results.json` | Quantum ROI analysis | Return on investment metrics |
| `terrafusion-brand-context.json` | Branding context | Brand guidelines and context |

### **Project Structure**
| File | Purpose | How to Use |
|------|---------|------------|
| `TerraFusion_OS_1.0.code-workspace` | VS Code workspace | Open in VS Code for full project |
| `TerraFusionSimple.csproj` | Simple C# project | Standalone C# utilities |
| `test-plugin-submission.json` | Plugin submission test | Test plugin marketplace submission |

### **Legacy/Temporary Files**
| File | Purpose | How to Use |
|------|---------|------------|
| `AI_START.cmd` | Windows AI start script | Windows batch file for AI startup |
| `LAUNCH.bat` | Windows launcher | Legacy Windows launcher |

---

## 🎯 **Quick Navigation**

### **Getting Started**

1. **Read first**: `README.md`
2. **For AI agents**: `START_HERE.md`
3. **Development setup**: `CLAUDE.md`
4. **Install dependencies**: `npm install`
5. **Start development**: `npm run dev`

### **Common Tasks**

- **Run tests**: `npm test`
- **Build project**: `npm run build`
- **Start backend only**: `./start-backend-only.sh`
- **Deploy to Benton**: `./deploy-benton-fixed.ps1`
- **Check system health**: View `health-check.json`

### **Configuration**

- **Environment setup**: Copy `.env.example` to `.env.local`
- **County-specific**: Use appropriate `.env.[county]` file
- **MCP setup**: Check `mcp.json` and `mcp-setup-report.json`

### **Paths of Interest**

- **Frontend App root**: `frontend/src/App.tsx`
- **Electron preload**: `frontend/electron/preload.js`
- **Electron OS bridge**: `frontend/electron/os-bridge.js`

### **Documentation Deep Dive**

- **Frontend work**: `CLAUDE-frontend.md`
- **Backend work**: `CLAUDE-backend.md`
- **AI/ML work**: `CLAUDE-ai.md`
- **Testing work**: `CLAUDE-testing.md`
- **API work**: `CLAUDE-api.md`
- **Analytics work**: `CLAUDE-intelligence.md`

### **Troubleshooting**
- **Windows vs. POSIX scripts**: Prefer `.ps1` on Windows PowerShell; `.sh` requires WSL or Git Bash. Example: `deploy-benton-fixed.ps1`.
- **Multiple tsconfig files**: Use the project-specific `tsconfig.json` (e.g., `frontend/tsconfig.json`) when running editors/TS tooling.
- **Playwright MCP config**: If MCP tests fail, verify `playwright.mcp.config.ts` exists at repo root and credentials in `.env.local`.
- **Electron context isolation**: Ensure any Node access is proxied via `frontend/electron/preload.js` and `frontend/electron/os-bridge.js`.

---

**💡 Pro Tip**: Always start with `README.md` and `START_HERE.md` for comprehensive orientation!