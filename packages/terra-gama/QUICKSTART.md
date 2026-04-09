# TerraFusionGama Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Python 3.12+ installed
- Git installed

### Development Setup

1. **Install Dependencies**
   ```powershell
   npm install --legacy-peer-deps
   pip install -r requirements.txt
   ```

2. **Start Development Servers**
   ```powershell
   # Option 1: Automated startup (both servers)
   .\start-dev.ps1

   # Option 2: Manual startup
   # Terminal 1: Next.js
   npm run dev
   
   # Terminal 2: Flask Analytics (optional)
   python app.py
   ```

3. **Access Application**
   - Next.js: http://localhost:3000
   - Flask Analytics: http://localhost:5003
   - Dashboard: http://localhost:3000/dashboard

### Production Build

```powershell
# Build for production
.\build-production.ps1

# Or manually:
npm run build
npm start
```

### Electron Desktop App

```powershell
# Development
npm run dev
electron .

# Production (after build)
npm run build
electron .
```

## 📁 Project Structure

```
TerraFusionGama_PRODUCTION/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── properties/    # Property CRUD
│   │   ├── analysis/      # AI analysis engine
│   │   └── market/        # Market data
│   ├── dashboard/         # Dashboard page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Radix UI components
│   └── *.tsx             # Feature components
├── electron.js           # Electron main process
├── app.py               # Flask analytics server
└── .env.local           # Environment configuration
```

## 🔧 Key Features

### 1. Property Agent (`/dashboard` → AI Agent tab)
- AI-powered property valuation
- Sacred geometry analysis
- Confidence scoring

### 2. Sacred Geometry (`/dashboard` → Sacred Geometry tab)
- Fibonacci spiral visualization
- Golden ratio calculations
- Voronoi diagrams

### 3. Real-Time Dashboard (`/dashboard` → Live Dashboard tab)
- Market flow simulation
- Property analytics
- Live data visualization

### 4. Property Search (`/dashboard` → Property Search tab)
- Advanced filtering
- CRUD operations
- Mock data integration

### 5. Benton County GIS (`/dashboard` → Benton GIS tab)
- GIS data visualization
- Parcel information
- Spatial analytics

## 🌐 TerraFusion Ecosystem Integration

GAMA connects to these services:
- **TerraFusion Build** (Port 5000) - Property database & GIS
- **TerraFlow** (Port 5001) - Workflow management
- **TerraSync** (Port 5002) - Data synchronization hub
- **BCBSGISPRO** (Port 5004) - Multi-agent AI mesh

## 📊 API Endpoints

### Properties
- `GET /api/properties` - List all properties
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Analysis
- `POST /api/analysis` - Run AI analysis on property

### Market
- `GET /api/market/data` - Get real-time market data

## 🛠️ Troubleshooting

### Dependencies Issue
```powershell
npm install --legacy-peer-deps
```

### Port Already in Use
```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### TypeScript Errors
The project uses `ignoreBuildErrors: true` for development. Errors won't block builds.

### Material UI Icons Missing
Already fixed! `@mui/icons-material` installed with `--legacy-peer-deps`.

## 🔒 Security

- Snyk scanning enabled (`.cursor/rules/snyk_rules.mdc`)
- Run security scan: `snyk test`
- JWT authentication (planned)
- Environment variables for secrets

## 📚 Documentation

Full documentation: `.github/copilot-instructions.md`

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run security scan
4. Test locally
5. Create pull request

## 📝 License

Proprietary - TerraFusion Government OS
© 2025 BSValues - Intelligence That Counties Envy
