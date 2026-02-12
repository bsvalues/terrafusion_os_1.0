# 📅 **TerraFusion OS - Daily Developer Workflow**

**Government. Transcended.** - Your daily routine for championship excellence

## 🌅 **Morning Startup (5 minutes)**

### **1. Environment Activation**
```powershell
# Navigate to TerraFusion OS
cd C:\Users\bsval\terrafusion_os_1.0

# Activate Python environment
& .\.venv\Scripts\Activate.ps1

# Quick health check
.\GET_STARTED.ps1
```

### **2. Choose Your Workspace**
```powershell
# For full-system work
code workspaces/master.code-workspace

# For specific development focus
code workspaces/frontend.code-workspace        # React 18 PWA
code workspaces/backend.code-workspace         # .NET 8 APIs
code workspaces/consciousness.code-workspace   # AI agents
code workspaces/property-workbench.code-workspace # Property assessment
```

## ⚙️ **Service Startup Sequence**

### **Option A: Development Mode (Local Testing)**
```powershell
# Terminal 1: Backend API
cd backend
dotnet run --project TerraFusion.API --urls http://localhost:5000

# Terminal 2: AI Consciousness Engine
cd backend
dotnet run --project TerraFusion.Consciousness --urls http://localhost:3004

# Terminal 3: Frontend Development
cd frontend
npm run dev  # http://localhost:3000
```

### **Option B: Production Mode (Full System)**
```powershell
# Use VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")
"Launch Core Services (Degraded)"              # Starts API + AI
"Build TerraFusion Elite Government OS"        # Complete build
```

## 💻 **Development Workflows**

### **🎨 Frontend Development Day**
```powershell
# 1. Open frontend workspace
code workspaces/frontend.code-workspace

# 2. Start development server
cd frontend
npm run dev

# 3. Common tasks
npm run build                    # Production build
npm run test                     # Run tests
npm run government:compliance    # Compliance check
npm run storybook               # Component library
```

### **⚙️ Backend Development Day**
```powershell
# 1. Open backend workspace
code workspaces/backend.code-workspace

# 2. Start API server
cd backend
dotnet run --project TerraFusion.API

# 3. Common tasks
dotnet build                         # Build solution
dotnet test --nologo                # Run tests
dotnet ef database update           # Database migration
dotnet ef migrations add [Name]     # Create migration
```

### **🤖 AI Development Day**
```powershell
# 1. Open consciousness workspace
code workspaces/consciousness.code-workspace

# 2. Start AI coordination engine
cd backend
dotnet run --project TerraFusion.Consciousness --urls http://localhost:3004

# 3. Monitor AI agents
curl http://localhost:3004/health                    # Health check
curl http://localhost:3004/api/swarm/metrics         # Swarm metrics
curl http://localhost:3004/api/consciousness/status  # Consciousness state
```

### **🏛️ Government Module Development**
```powershell
# 1. Create new module (SDK)
cd SDK
.\scripts\create-module.sh --name="my-county-module" --type="government"

# 2. Validate module
.\tools\validate-manifest.sh --module="my-county-module"

# 3. Test module
.\tools\test-module.sh --module="my-county-module"
```

## 🔍 **Daily Health Checks**

### **System Status Dashboard**
```powershell
# Overall system health
npm run diagnostic

# Service endpoints check
curl http://localhost:5000/health     # Backend API
curl http://localhost:3004/health     # AI Consciousness
curl http://localhost:3000            # Frontend

# Database connectivity
dotnet ef database validate --project backend/TerraFusion.Data
```

### **Performance Monitoring**
```powershell
# Check running processes
Get-Process -Name "dotnet" | Format-Table ProcessName, Id, CPU

# Memory usage
Get-WmiObject -Class Win32_OperatingSystem | Select-Object @{Name="FreeGB";Expression={[math]::Round($_.FreePhysicalMemory/1MB,2)}}

# AI agent performance
curl http://localhost:3004/api/agents/performance
```

### **Government Compliance Validation**
```powershell
# Security compliance
npm run security:scan

# County data isolation test
dotnet test --filter "Category=CountyIsolation"

# FISMA compliance
python config/validate_compliance.py --standard=fisma-high

# Audit log integrity
python monitoring/audit_log_validation.py
```

## 🛠️ **Common Daily Tasks**

### **Code Quality & Testing**
```powershell
# Run all tests
dotnet test --nologo                          # Backend tests
npm test                                       # Frontend tests
python -m pytest tests/                       # Python tests

# Code formatting
dotnet format                                  # .NET formatting
npm run prettier                              # Frontend formatting

# Build verification
dotnet build --configuration Release          # Production build
npm run build                                 # Frontend production build
```

### **Database Operations**
```powershell
# View pending migrations
dotnet ef migrations list --project backend/TerraFusion.Data

# Apply migrations
dotnet ef database update --project backend/TerraFusion.Data

# Backup database (production)
pg_dump -h localhost -U postgres -d terrafusion > backup_$(Get-Date -Format "yyyy-MM-dd").sql
```

### **County-Specific Operations**
```powershell
# Validate county configuration
python config/validate_tenant_config.py --county=benton

# Test Harris PACS integration
dotnet test --filter "Category=HarrisPACS" --logger "console;verbosity=detailed"

# Property assessment sync
python scripts/property_sync.py --county=benton --mode=test
```

## 🚨 **Troubleshooting Routine**

### **Common Issues Checklist**
```powershell
# 1. Port conflicts
netstat -ano | findstr :5000
netstat -ano | findstr :3004
netstat -ano | findstr :3000

# 2. Service health
Get-Service -Name postgresql*
Get-Process -Name "dotnet"
Get-Process -Name "node"

# 3. Clean restart
# Kill all dotnet processes
Get-Process dotnet | Stop-Process -Force

# Clear caches
npm run clean && npm install
dotnet clean && dotnet restore

# 4. Database connectivity
psql -h localhost -U postgres -d terrafusion -c "SELECT version();"
```

## 🌙 **Evening Shutdown**

### **Graceful Service Shutdown**
```powershell
# 1. Stop services gracefully
# Ctrl+C in each terminal running services

# 2. Verify cleanup
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue
Get-Process -Name "node" -ErrorAction SilentlyContinue

# 3. Commit work
git add .
git commit -m "Daily development progress - $(Get-Date -Format 'yyyy-MM-dd')"
git push origin main
```

### **System Status Summary**
```powershell
# Generate daily report
npm run diagnostic > daily_report_$(Get-Date -Format "yyyy-MM-dd").txt

# Performance summary
curl http://localhost:3004/api/daily-summary > ai_performance_$(Get-Date -Format "yyyy-MM-dd").json
```

## 📊 **Weekly Maintenance**

### **Every Monday**
- Update dependencies: `npm update`, `dotnet update`
- Review security alerts: `npm audit`, `dotnet list package --vulnerable`
- Database maintenance: `VACUUM ANALYZE` on PostgreSQL

### **Every Friday**
- Performance review: Analyze weekly metrics
- Backup verification: Test database restore procedures
- Documentation update: Update any changed workflows

---

## 🏆 **Success Metrics to Track**

- **Daily uptime**: >99.9%
- **Test coverage**: >95%
- **Build time**: <2 minutes
- **AI response time**: <10ms
- **Compliance score**: 100%

---

**Execute with championship excellence every day!** 🏛️⚡🚀

*Your daily commitment to government transcendence makes the difference.*
