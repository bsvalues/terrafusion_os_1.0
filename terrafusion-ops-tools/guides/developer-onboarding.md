# Terrafusion Developer Onboarding Guide

## Welcome to Terrafusion Development Team!

This guide will help you set up your development environment and understand the
Terrafusion ecosystem.

## Prerequisites

### Required Software

- **Git** (latest version)
- **Python 3.11+** with pip
- **Node.js 18+** with npm
- **PostgreSQL 16+**
- **Redis 7+**
- **Docker & Docker Compose** (recommended)
- **VS Code or PyCharm** (recommended IDEs)

### Access Requirements

Before starting, ensure you have:

- [ ] GitHub/GitLab access to Terrafusion repositories
- [ ] Access to team communication channels (Slack/Teams)
- [ ] Access to project documentation (Confluence/Wiki)
- [ ] VPN access (if required)
- [ ] AWS/Cloud console access (if applicable)

## Project Structure

```
terrafusion/
├── backend/           # Python FastAPI backend
├── ai_engine/        # AI cost calculation engine
├── frontend/         # React TypeScript frontend
├── database/         # Database migrations and schemas
├── docker/           # Docker configurations
├── scripts/          # Utility scripts
├── docs/            # Documentation
└── tests/           # Integration tests
```

## Environment Setup

### 1. Clone Repositories

```bash
# Main application
git clone https://github.com/yourorg/terrafusion.git
cd terrafusion

# If using submodules
git submodule update --init --recursive
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Copy environment template
cp .env.example .env
# Edit .env with your local configuration
```

### 3. AI Engine Setup

```bash
cd ../ai_engine

# Use same virtual environment or create new one
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Configure API endpoints
```

### 5. Database Setup

```bash
# Start PostgreSQL (via Docker or local installation)
docker run -d \
  --name terrafusion-db \
  -e POSTGRES_DB=terrafusion_dev \
  -e POSTGRES_USER=tf_dev \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  postgres:16

# Run migrations
cd backend
python manage.py migrate  # or alembic upgrade head
```

### 6. Redis Setup

```bash
# Start Redis
docker run -d \
  --name terrafusion-redis \
  -p 6379:6379 \
  redis:7
```

## Running the Application

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:\${{TF_DESKTOP_PORT:-3003}}
# - Backend API: http://localhost:\${{TF_DESKTOP_PORT:-3003}}
# - AI Engine: http://localhost:\${{TF_DESKTOP_PORT:-3003}}
```

### Option 2: Manual Start

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port \${{TF_ADMIN_PORT:-8080}}

# Terminal 2: AI Engine
cd ai_engine
source venv/bin/activate
python app.py  # or uvicorn main:app --port \${{TF_ADMIN_PORT:-8080}}

# Terminal 3: Frontend
cd frontend
npm start
```

## Development Workflow

### 1. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Code Standards

#### Python (Backend & AI Engine)

- Follow PEP 8
- Use type hints
- Run `black` for formatting
- Run `flake8` for linting
- Run `mypy` for type checking

```bash
# Format code
black .

# Lint
flake8 .

# Type check
mypy .
```

#### TypeScript/React (Frontend)

- Follow ESLint rules
- Use TypeScript strictly
- Run Prettier for formatting

```bash
# Lint and format
npm run lint
npm run format
```

### 3. Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
cd tests
python run_integration_tests.py
```

## Key Development Areas

### 1. API Development (Backend)

- FastAPI routes in `backend/api/`
- Database models in `backend/models/`
- Business logic in `backend/services/`
- Authentication in `backend/auth/`

### 2. AI Engine Development

- Cost calculation algorithms in `ai_engine/calculators/`
- ML models in `ai_engine/models/`
- API endpoints in `ai_engine/api/`

### 3. Frontend Development

- Components in `frontend/src/components/`
- Pages in `frontend/src/pages/`
- State management in `frontend/src/store/`
- API clients in `frontend/src/services/`

## Common Tasks

### Adding a New API Endpoint

1. Define route in `backend/api/routes/`
2. Create service logic in `backend/services/`
3. Add tests in `backend/tests/`
4. Update API documentation
5. Update frontend API client

### Adding a New Frontend Feature

1. Create component in `frontend/src/components/`
2. Add to appropriate page
3. Connect to state management
4. Add API integration
5. Write component tests

### Database Changes

1. Create migration script
2. Test migration locally
3. Update models
4. Update API endpoints
5. Document schema changes

## Debugging Tips

### Backend Debugging

- Use `import pdb; pdb.set_trace()` for breakpoints
- Check logs in `backend/logs/`
- Use FastAPI's automatic `/docs` endpoint

### Frontend Debugging

- Use React Developer Tools
- Check browser console
- Use Redux DevTools (if using Redux)
- Network tab for API calls

### Database Debugging

- Use `psql` or pgAdmin
- Check query logs
- Use EXPLAIN for slow queries

## Useful Commands

```bash
# View logs
docker-compose logs -f [service_name]

# Access database
docker exec -it terrafusion-db psql -U tf_dev -d terrafusion_dev

# Clear Redis cache
docker exec -it terrafusion-redis redis-cli FLUSHALL

# Run specific test
pytest path/to/test.py::TestClass::test_method

# Check code coverage
pytest --cov=backend tests/
```

## Getting Help

1. **Documentation**: Check `/docs` folder and wiki
2. **Team Chat**: Ask in #terrafusion-dev channel
3. **Code Reviews**: Request review from senior developers
4. **Pair Programming**: Schedule sessions for complex features
5. **Architecture**: Review system design documents

## Next Steps

1. Complete the sample tutorial in `/docs/tutorial.md`
2. Fix a "good first issue" from the issue tracker
3. Attend team standup meetings
4. Review existing code to understand patterns
5. Set up your IDE with project-specific settings

## Important Links

- [Project Wiki](https://wiki.company.com/terrafusion)
- [API Documentation](http://localhost:\${{TF_DESKTOP_PORT:-3003}}/docs)
- [Design System](https://design.company.com/terrafusion)
- [Issue Tracker](https://jira.company.com/terrafusion)
- [CI/CD Pipeline](https://jenkins.company.com/terrafusion)

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify credentials in .env
   - Check firewall/network settings

2. **Frontend Can't Connect to API**
   - Check CORS settings
   - Verify API URL in .env
   - Check backend is running

3. **Import Errors**
   - Verify virtual environment is activated
   - Run `pip install -r requirements.txt`
   - Check Python version

4. **Redis Connection Failed**
   - Ensure Redis is running
   - Check Redis configuration
   - Verify connection string

## Welcome Aboard!

Remember:

- Ask questions early and often
- Read existing code before writing new code
- Test your changes thoroughly
- Document your work
- Have fun building Terrafusion!

For any questions not covered here, reach out to your team lead or mentor.
