# Terrafusion Development Environment Setup

This guide will help you set up a complete development environment for
Terrafusion Platform.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Required Software](#required-software)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Service Configuration](#service-configuration)
6. [Running the Platform](#running-the-platform)
7. [Development Tools](#development-tools)
8. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **CPU**: 4 cores
- **RAM**: 16 GB
- **Storage**: 50 GB free space
- **OS**: Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+)

### Recommended Requirements

- **CPU**: 8 cores
- **RAM**: 32 GB
- **Storage**: 100 GB SSD
- **OS**: Latest stable version

## Required Software

### Core Dependencies

#### Node.js and npm

```bash
# Install Node.js 18+ using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

#### Python

```bash
# Install Python 3.10+
# macOS
brew install python@3.10

# Ubuntu/Debian
sudo apt update
sudo apt install python3.10 python3.10-venv python3.10-dev

# Verify installation
python3 --version  # Should show Python 3.10.x
```

#### Docker

```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Or use package manager:

# macOS
brew install --cask docker

# Ubuntu
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

#### PostgreSQL

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu
sudo apt install postgresql-14 postgresql-client-14
sudo systemctl start postgresql
```

#### Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis-server
```

### Development Tools

#### Git

```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.editor "vim"  # or your preferred editor
```

#### VS Code (Recommended)

Download from [https://code.visualstudio.com/](https://code.visualstudio.com/)

Recommended extensions:

- ESLint
- Prettier
- Python
- Docker
- GitLens
- Thunder Client (API testing)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/terrafusion/terrafusion-platform.git
cd terrafusion-platform
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

Key environment variables:

```env
# Application
NODE_ENV=development
PORT=\${{TF_FRONTEND_PORT:-3000}}
API_URL=http://localhost:\${{TF_FRONTEND_PORT:-3000}}

# Database
DATABASE_URL=postgresql://postgres:password@localhost:\${{TF_FRONTEND_PORT:-3000}}/terrafusion_dev
REDIS_URL=redis://localhost:\${{TF_FRONTEND_PORT:-3000}}

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=another-secret-key

# Services
QUANTUM_SERVICE_URL=http://localhost:\${{TF_FRONTEND_PORT:-3000}}
AI_SERVICE_URL=http://localhost:\${{TF_FRONTEND_PORT:-3000}}
EDGE_SERVICE_URL=http://localhost:\${{TF_FRONTEND_PORT:-3000}}

# External APIs (optional)
OPENAI_API_KEY=your-key-here
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret-here
```

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE terrafusion_dev;
CREATE USER terrafusion WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE terrafusion_dev TO terrafusion;
\q
```

### 2. Run Migrations

```bash
# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 3. Verify Database

```bash
# Connect to database
psql -U terrafusion -d terrafusion_dev

# Check tables
\dt

# Should see tables like:
# - users
# - tenants
# - workflows
# - quantum_jobs
# etc.
```

## Service Configuration

### AI Agent and Swarm Protocols

Before configuring or deploying any AI agents or agent swarms, review the
canonical protocols and deployment instructions in `/ai-agent-instructions/`.
This folder contains:

- Master agent governance and escalation protocols
- Subagent swarm build and deployment strategies
- Deployment scripts and historical manifests

Always follow the latest instructions in `/ai-agent-instructions/` to ensure
operational excellence and compliance.

### 1. Start Infrastructure Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps

# Should see:
# - postgres
# - redis
# - rabbitmq
# - elasticsearch
# - prometheus
# - grafana
```

### 2. Configure Microservices

#### V1 Foundation Service

```bash
cd v1_foundation
npm install
npm run dev
```

#### V2 Project Reflex Service

```bash
cd v2_project_reflex
npm install
npm run dev
```

#### V3 Cosmic Governance Service

```bash
cd v3_cosmic_governance
npm install
npm run dev
```

### 3. Start Development Servers

```bash
# In root directory, start all services
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:\${{TF_FRONTEND_PORT:-3000}}
npm run dev:api      # API on http://localhost:\${{TF_FRONTEND_PORT:-3000}}
npm run dev:workers  # Background workers
```

## Running the Platform

### Development Mode

```bash
# Start everything with hot-reload
npm run dev

# Access at:
# - Frontend: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
# - API: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
# - API Docs: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/docs
# - Grafana: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
# - RabbitMQ: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Building for Production

```bash
# Build all services
npm run build

# Build specific service
npm run build:frontend
npm run build:api
```

## Development Tools

### Database Management

#### pgAdmin

```bash
# Install pgAdmin
# macOS
brew install --cask pgadmin4

# Or use Docker
docker run -p 5050:80 \
  -e 'PGADMIN_DEFAULT_EMAIL=admin@local.dev' \
  -e 'PGADMIN_DEFAULT_PASSWORD=admin' \
  -d dpage/pgadmin4
```

#### Database Migrations

```bash
# Create new migration
npm run db:migration:create -- --name add_quantum_fields

# Run migrations
npm run db:migrate

# Rollback
npm run db:rollback
```

### API Development

#### Swagger UI

Access API documentation at: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/docs

#### Postman Collection

Import the collection from: `docs/api/postman/Terrafusion-API-Collection.json`

### Monitoring

#### Prometheus

- URL: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
- Metrics endpoint: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/metrics

#### Grafana

- URL: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
- Default login: admin/admin
- Pre-configured dashboards available

### Debugging

#### VS Code Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/v1_foundation/src/main.js",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "terrafusion:*"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### Chrome DevTools

For frontend debugging:

1. Run with `npm run dev:frontend:debug`
2. Open Chrome DevTools
3. Go to chrome://inspect
4. Click "inspect" on the target

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U terrafusion -d terrafusion_dev -c "SELECT 1"

# Reset database
npm run db:reset
```

#### Docker Issues

```bash
# Clean up Docker
docker-compose down -v
docker system prune -a
docker-compose up -d
```

#### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### Performance Optimization

#### Development Build Too Slow

```bash
# Use development build with minimal optimization
npm run dev:fast

# Disable source maps
GENERATE_SOURCEMAP=false npm run dev
```

#### Memory Issues

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"
npm run dev
```

### Getting Help

#### Logs

```bash
# View application logs
npm run logs

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

#### Debug Mode

```bash
# Run with debug logging
DEBUG=terrafusion:* npm run dev

# Specific namespaces
DEBUG=terrafusion:api:* npm run dev:api
DEBUG=terrafusion:quantum:* npm run dev:quantum
```

## Next Steps

1. **Run the test suite** to ensure everything is working
2. **Explore the codebase** starting with `v1_foundation/src/main.js`
3. **Read the architecture documentation** in `docs/architecture/`
4. **Join the developer community** on Discord
5. **Pick an issue** from GitHub and start contributing!

## Additional Resources

- [Architecture Overview](../architecture/system-overview.md)
- [API Documentation](../api/reference.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Troubleshooting Guide](./troubleshooting.md)

Happy coding! 🚀
