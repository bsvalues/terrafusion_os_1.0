# Terrafusion OS 1.0 - Fix for Localhost:3000 Errors

## Problem Summary

When navigating to http://localhost:\${{TF_FRONTEND_PORT:-3000}}/, you're experiencing:

1. **Backend API not running** - GET http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/health returns
   404
2. **Frontend repeatedly trying to connect** - Multiple failed fetch attempts
3. **No unified startup process** - Services need to be started separately

## Root Causes

1. **Backend API server is not running** on port \${{TF_API_PORT:-5000}}
2. **Frontend is running** but can't connect to backend
3. **No orchestrated startup script** to ensure both services run together

## Immediate Fix - Quick Start

### Option 1: Windows (PowerShell)

```powershell
# Run this from the project root directory
.\start-terrafusion.ps1
```

### Option 2: Windows (Command Prompt)

```batch
# Run this from the project root directory
START_TERRAFUSION.bat
```

### Option 3: Mac/Linux

```bash
# Make the script executable (first time only)
chmod +x start-terrafusion.sh

# Run the startup script
./start-terrafusion.sh
```

### Option 4: Manual Start (Any OS)

```bash
# Terminal 1 - Start Backend
cd backend/Terrafusion.API
dotnet run --urls "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"

# Terminal 2 - Start Frontend
cd frontend
npm install  # First time only
npm start
```

## Verification Steps

1. **Check Backend Health**
   - Navigate to: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health
   - Expected response:

   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-23T...",
     "server": "Terrafusion OS 1.0",
     "modules": {
       "total": 15,
       "core": 5,
       "status": "loaded"
     }
   }
   ```

2. **Check Frontend**
   - Navigate to: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
   - Should load without console errors
   - API connection status should show "Connected"

## Troubleshooting

### If Backend Won't Start

```bash
# Check if .NET SDK is installed
dotnet --version

# If not installed, download from:
# https://dotnet.microsoft.com/download/dotnet/8.0

# Restore packages
cd backend/Terrafusion.API
dotnet restore
dotnet build
```

### If Frontend Won't Start

```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### If Ports Are Already In Use

```bash
# Windows - Find and kill process on port \${{TF_API_PORT:-5000}}
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux - Find and kill process on port \${{TF_API_PORT:-5000}}
lsof -i :5000
kill -9 <PID>
```

## Architecture Overview

```
Terrafusion OS 1.0
├── Frontend (React) - Port \${{TF_FRONTEND_PORT:-3000}}
│   └── OSShellWindow Component
│       └── Connects to Backend API
├── Backend (.NET Core) - Port \${{TF_FRONTEND_PORT:-3000}}
│   ├── /health - System health endpoint
│   ├── /api/test - Test endpoint
│   ├── /api/modules - Module management
│   └── /api/swarm - AI swarm orchestration
```

## Development Configuration

### Backend Configuration (`backend/Terrafusion.API/appsettings.Development.json`)

- API runs on port \${{TF_API_PORT:-5000}}
- CORS enabled for localhost:\${{TF_FRONTEND_PORT:-3000}}
- SQLite database for development

### Frontend Configuration

- Proxy configured for API calls
- Health checks every 30 seconds
- Automatic retry on connection failure

## Performance Optimizations Applied

1. **Connection Pooling** - Reuses HTTP connections
2. **Health Check Intervals** - Optimized to 30-second intervals
3. **Timeout Settings** - 2-second timeout for health checks
4. **Offline Mode** - Frontend continues with limited functionality if API
   unavailable

## Security Considerations

1. **CORS Configuration** - Limited to localhost origins
2. **HTTPS in Production** - Enforced via configuration
3. **API Rate Limiting** - 100 requests/minute in production
4. **JWT Authentication** - Ready for production deployment

## Next Steps

1. **Production Deployment**

   ```bash
   npm run build
   npm run deploy:docker
   ```

2. **Enable SSL/TLS**

   ```bash
   dotnet dev-certs https --trust
   ```

3. **Configure Environment Variables**
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=http://localhost:\${{TF_FRONTEND_PORT:-3000}}" > frontend/.env
   echo "ASPNETCORE_ENVIRONMENT=Development" > backend/.env
   ```

## Support

For additional help:

1. Check logs: `logs/terrafusion-*.txt`
2. Run diagnostics: `npm run validate`
3. View full documentation: `docs/API_DOCUMENTATION.md`

---

**Terrafusion OS 1.0** - Excellence in Government AI Infrastructure Version:
1.0.0 | Build: Production-Ready | Status: 🟢 Operational
