# Terrafusion OS Development Environment Setup

## Prerequisites

### Required Software
- **.NET 8 SDK** - For backend API development
- **Node.js 18+** - For frontend development and mock backend
- **Docker Desktop** - For containerized development (optional)
- **Visual Studio Code** - Recommended IDE

### Installation Commands

#### Windows (PowerShell)
```powershell
# Install .NET 8 SDK
winget install Microsoft.DotNet.SDK.8

# Install Node.js
winget install OpenJS.NodeJS

# Install Docker Desktop
winget install Docker.DockerDesktop

# Verify installations
dotnet --version
node --version
docker --version
```

## Backend Setup

### Option 1: .NET Development Server
```bash
cd backend
dotnet restore
dotnet run --project Terrafusion.API
```
Backend will be available at: `https://localhost:5001`

### Option 2: Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start only backend
docker-compose -f docker-compose.dev.yml up backend
```

### Option 3: Mock Backend (Development Only)
```bash
# Install dependencies
npm install express cors

# Start mock server
node mock-backend.js
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at: `http://localhost:3000`

## Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=https://localhost:5001/api
VITE_ENVIRONMENT=development
```

### Backend (appsettings.Development.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=./data/terrafusion.db"
  },
  "AllowedOrigins": [
    "http://localhost:3000",
    "https://localhost:3001"
  ]
}
```

## Common Issues & Solutions

### Backend Connection Errors
- **Error**: `ERR_CONNECTION_REFUSED`
- **Solution**: Start backend server or use mock backend
- **Fallback**: Frontend APIs include mock data fallbacks

### Process Environment Errors
- **Error**: `process is not defined`
- **Solution**: Use `import.meta.env` instead of `process.env` in frontend
- **Fixed**: Already resolved in systemAPI.ts and moduleAPI.ts

### React Router Warnings
- **Warning**: Future flag warnings
- **Solution**: Update router configuration (pending)

## Development Workflow

1. **Start Backend**: Choose one of the backend options above
2. **Start Frontend**: `npm run dev` in frontend directory
3. **Development**: Frontend will use mock data if backend is unavailable
4. **Testing**: Run `npm test` in respective directories

## Architecture Notes

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: .NET 8 Web API + Entity Framework
- **Database**: SQLite (development) / SQL Server (production)
- **Desktop**: Electron shell + Tauri modules
- **Styling**: Tailwind CSS + Championship brand system

## Troubleshooting

### No Backend Available
The frontend is designed to work without a backend using mock data. All API services include fallback responses for offline development.

### Module Launch Issues
Module launching is simulated when backend is unavailable. Real module launching requires the full .NET backend and Tauri runtime.

### Database Issues
For development, SQLite database is created automatically. For production deployment, use the migration scripts in the `database/` directory.
