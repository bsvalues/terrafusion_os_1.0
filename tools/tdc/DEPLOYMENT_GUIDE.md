# 🚀 TDC Complete System Deployment Guide

**TerraFusion Development Console (TDC)**  
Complete deployment guide for all components across development, staging, and production environments.

---

## 📋 Prerequisites

### Required Software
- **Node.js**: v18+ (v20 recommended)
- **pnpm**: v8+ (for monorepo management)
- **TypeScript**: v5.0+
- **.NET**: 8.0 SDK (for backend services)
- **PostgreSQL**: 15+ (for database)
- **Redis**: 7+ (for caching)

### Environment Variables
```bash
# Create .env file in /tools/tdc/
TRANSPARENCY_WS_PORT=8788
PORTAL_DEV_PORT=5173
TF_API_PORT=8787
TF_CONSCIOUSNESS_PORT=3004
NODE_ENV=development
```

---

## 🏗️ Component-by-Component Deployment

### 1. Transparency Engine (Phase 2)

**Development Mode**:
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc/packages/transparency-engine
pnpm install
pnpm build
node dist/server.js
```

**Production Mode**:
```bash
# Build with optimizations
pnpm build --mode production

# Run with PM2 process manager
pm2 start dist/server.js --name transparency-engine

# Or with systemd
sudo systemctl start transparency-engine.service
```

**Health Check**:
```bash
# Test WebSocket connection
wscat -c ws://localhost:8788

# Should receive:
# {"type":"connection","connected":true}
```

---

### 2. Portal UI (Phase 4)

**Development Mode**:
```bash
cd /workspaces/terrafusion_os_1.0/TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend
npm install
npm run dev
# Running on http://localhost:5173
```

**Production Build**:
```bash
# Build optimized production bundle
npm run build
# Output: dist/ folder

# Preview production build locally
npm run preview
# Running on http://localhost:4173
```

**Production Deployment**:

**Option A: Static Hosting (Recommended)**
```bash
# Deploy to Nginx
sudo cp -r dist/* /var/www/tdc-portal/
sudo systemctl restart nginx

# nginx.conf:
server {
    listen 80;
    server_name tdc.terrafusion.gov;
    root /var/www/tdc-portal;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy WebSocket to Transparency Engine
    location /ws {
        proxy_pass http://localhost:8788;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Option B: Node Server**
```bash
# Use serve package
npm install -g serve
serve -s dist -l 5173

# Or with PM2
pm2 start "serve -s dist -l 5173" --name tdc-portal
```

---

### 3. CLI (Phase 1)

**Development Mode**:
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc
pnpm install
pnpm build

# Link globally for testing
pnpm link --global
tdc status
```

**Production Installation**:
```bash
# Install globally
npm install -g /workspaces/terrafusion_os_1.0/tools/tdc

# Verify
tdc --version
tdc status
```

**Binary Distribution** (Optional):
```bash
# Use pkg to create standalone binary
npm install -g pkg
pkg . --targets node18-linux-x64,node18-macos-x64,node18-win-x64

# Creates:
# - tdc-linux
# - tdc-macos  
# - tdc-win.exe
```

---

### 4. VS Code Extension (Phase 5)

**Development Mode**:
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc/extension
npm install
npm run compile

# Open in VS Code Extension Development Host
code .
# Press F5 to launch Extension Development Host
```

**Production Packaging**:
```bash
# Install vsce (Visual Studio Code Extension Manager)
npm install -g @vscode/vsce

# Package extension
vsce package
# Creates: terrafusion-tdc-1.0.0.vsix

# Install locally
code --install-extension terrafusion-tdc-1.0.0.vsix

# Publish to Marketplace (requires publisher account)
vsce publish
```

---

### 5. Backend Services Integration

**Start TerraFusion API** (Port 8787):
```bash
cd /workspaces/terrafusion_os_1.0/backend
dotnet run --project TerraFusion.API --urls "http://localhost:8787"
```

**Start Consciousness Engine** (Port 3004):
```bash
cd /workspaces/terrafusion_os_1.0/backend
dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"
```

**Production Backend Deployment**:
```bash
# Build for production
dotnet publish -c Release -o /opt/terrafusion/api
dotnet publish -c Release -o /opt/terrafusion/consciousness

# Run with systemd
sudo systemctl start terrafusion-api.service
sudo systemctl start terrafusion-consciousness.service
```

---

## 🔗 Full Stack Deployment Scenarios

### Scenario 1: Development (All Components)

**Terminal 1 - Transparency Engine**:
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc/packages/transparency-engine
pnpm build && node dist/server.js
```

**Terminal 2 - Portal UI**:
```bash
cd /workspaces/terrafusion_os_1.0/TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend
npm run dev
```

**Terminal 3 - Backend Services**:
```bash
cd /workspaces/terrafusion_os_1.0/backend
dotnet run --project TerraFusion.API --urls "http://localhost:8787"
```

**Terminal 4 - CLI**:
```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc
tdc status
tdc workspace list
tdc ai trace --follow
```

**Access**:
- Portal: http://localhost:5173
- API: http://localhost:8787
- WebSocket: ws://localhost:8788

---

### Scenario 2: Production (Docker Compose)

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  transparency-engine:
    build: ./packages/transparency-engine
    ports:
      - "8788:8788"
    environment:
      - NODE_ENV=production
    restart: always

  portal-ui:
    build: ./TerraFusion_Command_Portal_Starter/terrafusion-command-portal/frontend
    ports:
      - "5173:80"
    depends_on:
      - transparency-engine
    restart: always

  terrafusion-api:
    build: ./backend/TerraFusion.API
    ports:
      - "8787:8787"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__Default=${DB_CONNECTION}
    restart: always

  consciousness:
    build: ./backend/TerraFusion.Consciousness
    ports:
      - "3004:3004"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=terrafusion
      - POSTGRES_USER=tfuser
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: always

volumes:
  postgres-data:
```

**Deploy**:
```bash
docker-compose up -d
docker-compose ps
docker-compose logs -f portal-ui
```

---

### Scenario 3: Production (Kubernetes)

**kubernetes/deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tdc-portal
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tdc-portal
  template:
    metadata:
      labels:
        app: tdc-portal
    spec:
      containers:
      - name: portal
        image: terrafusion/tdc-portal:1.0.0
        ports:
        - containerPort: 80
        env:
        - name: VITE_TRANSPARENCY_WS_URL
          value: "ws://transparency-engine-service:8788"

---
apiVersion: v1
kind: Service
metadata:
  name: tdc-portal-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: tdc-portal
```

**Deploy**:
```bash
kubectl apply -f kubernetes/
kubectl get pods
kubectl get services
```

---

## 🔍 Health Checks & Monitoring

### Portal UI Health
```bash
# Check Vite server
curl http://localhost:5173

# Check bundle size
cd dist/
du -sh .
# Should be < 5MB for optimal performance
```

### Transparency Engine Health
```bash
# WebSocket connection test
wscat -c ws://localhost:8788

# HTTP health endpoint (if implemented)
curl http://localhost:8788/health
```

### Backend Services Health
```bash
# API health
curl http://localhost:8787/health

# Consciousness health
curl http://localhost:3004/health
```

---

## 🛡️ Security Hardening

### Production Checklist
- [ ] Enable HTTPS/TLS for all services
- [ ] Configure CORS properly (whitelist specific origins)
- [ ] Set secure WebSocket (wss://) in production
- [ ] Enable rate limiting on API endpoints
- [ ] Set proper Content Security Policy headers
- [ ] Remove all development dependencies from production builds
- [ ] Use environment variables for secrets (never hardcode)
- [ ] Enable authentication/authorization for Portal
- [ ] Set up reverse proxy (Nginx/Apache) for Portal
- [ ] Configure database connection pooling

### Environment Variables (Production)
```bash
# .env.production
NODE_ENV=production
VITE_API_URL=https://api.terrafusion.gov
VITE_TRANSPARENCY_WS_URL=wss://ws.terrafusion.gov
DATABASE_URL=${SECRET_DB_URL}
REDIS_URL=${SECRET_REDIS_URL}
```

---

## 📊 Performance Optimization

### Portal UI Optimizations
```bash
# Enable compression in Vite
npm install -D vite-plugin-compression
```

**vite.config.ts**:
```typescript
import compression from 'vite-plugin-compression'

export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['./src/components']
        }
      }
    }
  },
  plugins: [compression()]
}
```

### Transparency Engine Optimizations
- Use Redis for action buffering (reduce memory usage)
- Implement WebSocket message compression
- Set max connections limit (default: 1000)
- Enable clustering for multi-core utilization

---

## 🧪 Deployment Verification

### Post-Deployment Tests

**1. Portal UI**:
```bash
# Verify build
npm run build
ls -lh dist/

# Lighthouse audit
npm install -g lighthouse
lighthouse http://localhost:5173 --view

# Accessibility audit
npm install -g @axe-core/cli
axe http://localhost:5173
```

**2. Transparency Engine**:
```bash
# Load test WebSocket connections
npm install -g artillery
artillery quick --count 100 --num 10 ws://localhost:8788
```

**3. Full System Integration**:
```bash
# Run integration tests
cd /workspaces/terrafusion_os_1.0/tools/tdc
pnpm test:integration

# Expected: All tests passing
```

---

## 🔧 Troubleshooting

### Portal Not Loading
```bash
# Check Vite process
ps aux | grep vite

# Check port availability
lsof -i :5173

# Rebuild node_modules
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### WebSocket Connection Failed
```bash
# Check Transparency Engine
ps aux | grep "node.*server.js"

# Check port
lsof -i :8788

# Test connection
wscat -c ws://localhost:8788
```

### Backend Services Down
```bash
# Check .NET processes
ps aux | grep dotnet

# Check ports
lsof -i :8787  # API
lsof -i :3004  # Consciousness

# Restart services
dotnet run --project TerraFusion.API --urls "http://localhost:8787"
```

---

## 📦 Backup & Rollback

### Backup Procedure
```bash
# Backup Portal dist/
tar -czf tdc-portal-backup-$(date +%Y%m%d).tar.gz dist/

# Backup Transparency Engine
tar -czf transparency-engine-backup-$(date +%Y%m%d).tar.gz packages/transparency-engine/dist/

# Backup configuration
cp .env .env.backup
```

### Rollback Procedure
```bash
# Restore previous Portal build
tar -xzf tdc-portal-backup-20251115.tar.gz

# Restart services
pm2 restart tdc-portal
pm2 restart transparency-engine
```

---

## 🎯 Production Deployment Checklist

- [ ] All components built for production (`npm run build`)
- [ ] Environment variables configured (`.env.production`)
- [ ] HTTPS/TLS certificates installed
- [ ] Database migrations applied
- [ ] Redis cache configured
- [ ] Monitoring enabled (Prometheus/Grafana)
- [ ] Logging configured (centralized logs)
- [ ] Backup procedures tested
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained on deployment procedures

---

**Status**: ✅ **DEPLOYMENT GUIDE COMPLETE**

All 5 TDC components ready for production deployment across development, staging, and production environments.

**Government. Transcended.**

