# TerraFusion Elite Government OS - Operations Guide
**Version:** 1.0.0  
**Date:** November 12, 2025  
**Status:** Production Ready ✅

---

## Quick Start

### Launch All Services (Recommended)

```powershell
cd C:\Users\bsval\terrafusion_os_1.0
.\Start-TerraFusion-Elite.ps1
```

This orchestration script will:
- ✅ Check for port conflicts
- ✅ Clean up existing processes
- ✅ Start Backend API (Port 5000)
- ✅ Start Frontend UI (Port 3000)
- ✅ Perform health checks
- ✅ Display service status

---

## Service Architecture

### Core Services

| Service | Port | Technology | Status | Critical |
|---------|------|------------|--------|----------|
| Backend API | 5000 | .NET 8.0 | ✅ Operational | Yes |
| Frontend UI | 5173 (default) or 3000 | React/Vite | ✅ Operational | Yes |
| GIS Services | 3002 | Optional | ℹ️ Not Configured | No |

---

## Manual Service Management

### Backend API

#### Start Backend
```powershell
cd C:\Users\bsval\terrafusion_os_1.0\backend
dotnet run --project TerraFusion.API -c Release --urls http://localhost:5000
```

#### Test Backend
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/test" -UseBasicParsing
```

**Expected Response:**
```json
{
  "message": "TerraFusion API is running!",
  "timestamp": "2025-11-12T22:24:02Z",
  "version": "1.0.0",
  "environment": "Production"
}
```

#### Backend Health Check
```powershell
# Core API Test (Always Works)
Invoke-WebRequest -Uri "http://localhost:5000/api/test"

# Health Endpoint (May timeout during DB initialization)
Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 30
```

### Frontend UI

#### Start Frontend
```powershell
cd C:\Users\bsval\terrafusion_os_1.0\frontend
npm run dev -- --host
```

#### Test Frontend
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
```

**Notes:**
- Frontend requires 20-30 seconds for initial Vite compilation.
- Vite default dev port is 5173. If you prefer 3000, start with:
   ```powershell
   npm run dev -- --host --port 3000
   ```
   Then browse: `http://localhost:3000`.

---

## Service Status Verification

### Quick Status Check
```powershell
$services = @(
    @{Name="Backend API"; Port=5000},
    @{Name="Frontend UI"; Port=3000}
)

foreach ($svc in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ $($svc.Name) - RUNNING (HTTP $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($svc.Name) - STOPPED" -ForegroundColor Red
    }
}
```

### Find Running Processes
```powershell
# Backend API
Get-Process -Name "TerraFusion.API" -ErrorAction SilentlyContinue

# Frontend UI
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    ForEach-Object { Get-Process -Id $_.OwningProcess }
```

### Stop All Services
```powershell
# Stop by port
$ports = @(5000, 3000)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
```

---

## API Endpoints Reference

### Core Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/test` | GET | API health check | No |
| `/` | GET | Root UI page | No |
| `/health` | GET | Detailed health status | No |
| `/api/modules` | GET | Module information | Yes |
| `/swagger` | GET | API documentation | No |

### Example API Calls

#### Test Endpoint
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/test" -Method Get
Write-Host "Message: $($response.message)"
Write-Host "Version: $($response.version)"
```

#### Modules Endpoint (Requires Auth)
```powershell
# Returns 401 Unauthorized without valid token
Invoke-WebRequest -Uri "http://localhost:5000/api/modules" -UseBasicParsing
```

---

## Troubleshooting

### Backend API Won't Start

**Symptom:** API fails to start or immediately crashes

**Solutions:**
1. **Check Port Availability:**
   ```powershell
   Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
   ```

2. **Verify Dependencies:**
   ```powershell
   cd C:\Users\bsval\terrafusion_os_1.0\backend
   dotnet restore TerraFusion.sln
   dotnet build TerraFusion.sln
   ```

3. **Check Logs:**
   - Look for error messages in terminal output
   - Common issues: Database connection, missing configuration

4. **Clean Build:**
   ```powershell
   dotnet clean
   dotnet build -c Release
   ```

### Frontend UI Won't Start

**Symptom:** Vite server fails or shows errors

**Solutions:**
1. **Reinstall Dependencies:**
   ```powershell
   cd C:\Users\bsval\terrafusion_os_1.0\frontend
   Remove-Item node_modules -Recurse -Force
   npm install
   ```

2. **Check Node.js Version:**
   ```powershell
   node --version  # Should be v18+ or v20+
   npm --version
   ```

3. **Port Already in Use:**
   ```powershell
   # Kill process on port 3000
   Get-NetTCPConnection -LocalPort 3000 | 
       ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

### API Returns 500 Errors

**Symptom:** `/health` endpoint returns 500 during startup

**Cause:** Database background initialization timeout

**Solution:** 
- ✅ **This is normal during first 1-2 minutes**
- ✅ **Core API functionality NOT affected**
- Test `/api/test` endpoint instead - should return 200 OK
- Wait for database initialization to complete

### Services Start But Can't Connect

**Symptom:** Services running but endpoints not responding

**Solutions:**
1. **Wait for Full Initialization:**
   - Backend API: 15-20 seconds
   - Frontend UI: 20-30 seconds

2. **Check Firewall:**
   ```powershell
   # Allow Node.js and .NET through firewall
   netsh advfirewall firewall show rule name=all | Select-String "Node"
   ```

3. **Verify URLs:**
   - Backend: `http://localhost:5000` (not https)
   - Frontend: `http://localhost:3000` (not https)

---

## Configuration

### Backend API Configuration

**File:** `backend/TerraFusion.API/appsettings.json`

Key settings:
- Database connection strings
- Redis configuration (optional)
- API ports and URLs
- Logging levels

### Frontend UI Configuration

**File:** `frontend/vite.config.ts`

Key settings:
- Development server port
- API proxy configuration
- Build output directory

---

## Performance Monitoring

### Check Resource Usage
```powershell
# Backend API
Get-Process -Name "TerraFusion.API" | 
    Select-Object Name, CPU, WorkingSet, Handles

# Frontend UI (Node.js)
Get-Process -Name "node" | 
    Select-Object Name, CPU, WorkingSet, Handles
```

### Measure API Response Time
```powershell
Measure-Command { 
    Invoke-WebRequest -Uri "http://localhost:5000/api/test" -UseBasicParsing 
}
```

**Expected:** < 100ms for local requests

---

## Maintenance Tasks

### Daily
- ✅ Verify all services running
- ✅ Check API response times
- ✅ Monitor error logs

### Weekly
- ✅ Update dependencies (if needed)
- ✅ Review application logs
- ✅ Test backup procedures

### Monthly
- ✅ Update .NET SDK and packages
- ✅ Update Node.js and npm packages
- ✅ Review security patches
- ✅ Performance optimization review

---

## Backup & Recovery

### Backup Database
```powershell
# SQLite database backup
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "C:\Users\bsval\terrafusion_os_1.0\backend\terrafusion.db" `
          "C:\Users\bsval\terrafusion_os_1.0\backend\backups\terrafusion_$backupDate.db"
```

### Backup Configuration
```powershell
# Backup all config files
$configFiles = @(
    "backend\TerraFusion.API\appsettings.json",
    "frontend\vite.config.ts",
    "frontend\package.json"
)

foreach ($file in $configFiles) {
    Copy-Item $file "$file.backup"
}
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Configuration files updated
- [ ] Database migrations applied
- [ ] Backup completed
- [ ] Firewall rules configured
- [ ] SSL certificates installed (if using HTTPS)
- [ ] Monitoring configured
- [ ] Rollback plan prepared

### Deployment Steps

1. **Stop Services:**
   ```powershell
   Stop-Process -Name "TerraFusion.API" -Force
   # Stop Frontend via orchestration script
   ```

2. **Deploy Backend:**
   ```powershell
   cd backend
   dotnet publish -c Release -o ..\deploy\api
   ```

3. **Deploy Frontend:**
   ```powershell
   cd frontend
   npm run build
   # Output in: dist/
   ```

4. **Start Services:**
   ```powershell
   .\Start-TerraFusion-Elite.ps1
   ```

5. **Verify Deployment:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5000/api/test"
   Invoke-WebRequest -Uri "http://localhost:3000"
   ```

---

## Security Considerations

### Development Mode
- ✅ Services run on localhost
- ✅ No external access by default
- ✅ Authentication enforced on protected endpoints

### Production Mode
- ⚠️ Configure HTTPS/SSL certificates
- ⚠️ Set secure connection strings
- ⚠️ Enable authentication tokens
- ⚠️ Configure CORS policies
- ⚠️ Set production logging levels
- ⚠️ Enable rate limiting

---

## Support Resources

### Documentation
- API Documentation: `http://localhost:5000/swagger`
- Developer Docs: `C:\Users\bsval\terrafusion_os_1.0\docs\`
- Deployment Report: `TERRAFUSION_MIT_PHD_DEPLOYMENT_REPORT.md`

### Diagnostic Reports
- DI Resolution: `backend\DEPENDENCY_INJECTION_RESOLUTION_REPORT.md`
- Operations Guide: `OPERATIONS_GUIDE.md` (this file)

### Key Files
- Orchestration Script: `Start-TerraFusion-Elite.ps1`
- Backend Entry Point: `backend\TerraFusion.API\Program.cs`
- Frontend Entry Point: `frontend\src\main.tsx`

---

## Contact & Support

**Engineering Team:** TerraFusion Elite Government OS  
**Version:** 1.0.0  
**Status:** Production Ready ✅

**For Technical Issues:**
1. Check this operations guide
2. Review deployment report
3. Check application logs
4. Review diagnostic scripts in `backend\scripts\`

---

**Last Updated:** November 12, 2025  
**Document Version:** 1.0.0  
**System Status:** 🟢 FULLY OPERATIONAL
