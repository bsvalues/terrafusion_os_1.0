# TerraFusionPlatform ICSF - Bootstrap Guide

## Complete Setup and Development Guide

This guide provides step-by-step instructions for setting up, developing, and deploying TerraFusionPlatform ICSF from scratch.

## Prerequisites

### System Requirements
- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 13 or higher
- Docker and Docker Compose (for production deployment)
- Git for version control

### API Keys Required
- OpenAI API Key (for GPT-4 integration)
- Anthropic API Key (for Claude 3.5 integration)

## Development Environment Setup

### 1. Clone and Initialize Project
```bash
# Clone the repository
git clone <repository-url>
cd terraflow-platform

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install streamlit openai anthropic psycopg2-binary pandas numpy plotly python-dotenv requests pydantic

# Install Node.js dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```bash
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
DATABASE_URL=postgresql://username:password@localhost:5432/terraflow_db
DEBUG=true
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb terraflow_db

# Run database migrations (if available)
python -m services.database.migrate
```

### 4. Start Development Servers
```bash
# Terminal 1: Start main Streamlit application
streamlit run terraflow_enhanced_refactored.py --server.port 5000

# Terminal 2: Start Express API server
cd server
npm start
```

## Project Structure Deep Dive

### Core Application Files
```
terraflow_enhanced_refactored.py    # Main application entry point
core/
├── __init__.py                     # Core package initialization
└── config.py                       # System configuration management
```

### Frontend Components
```
components/
├── __init__.py                     # Component exports
├── navigation.py                   # Navigation components
├── styling.py                      # Styling utilities
├── ui.py                          # Core UI components
└── ui_components.py               # Extended UI components

views/
├── __init__.py                    # View exports
├── auth.py                        # Authentication views
├── dashboard.py                   # Main dashboard
├── mcp_console.py                 # MCP console interface
├── phase_workflow.py              # Workflow management
├── reports.py                     # Report generation
└── user_management.py             # User administration
```

### Backend Services
```
server/
├── src/
│   ├── index.js                   # Express server entry point
│   ├── middleware/                # Authentication and error handling
│   ├── routes/                    # API route definitions
│   └── services/                  # Business logic services

services/
├── ai_models/                     # AI service integrations
├── agent_orchestrator/            # Multi-agent coordination
├── code_analyzer/                 # Code analysis engine
├── database/                      # Database services
└── visualization_service/         # Data visualization
```

### Configuration and Deployment
```
deployment/
└── docker-compose.yml             # Container orchestration

nginx/
├── nginx.conf                     # Reverse proxy configuration
└── ssl/                          # SSL certificates directory

scripts/
└── deploy.sh                     # Automated deployment script
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test locally
streamlit run terraflow_enhanced_refactored.py --server.port 5000

# Run tests (when available)
python -m pytest tests/

# Commit changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### 2. Code Quality Checks
```bash
# Format code with Black
black .

# Check code style with flake8
flake8 .

# Type checking with mypy
mypy .

# Security scanning
bandit -r .
```

### 3. Testing Strategy
```bash
# Unit tests
python -m pytest tests/unit/

# Integration tests
python -m pytest tests/integration/

# End-to-end tests
python -m pytest tests/e2e/

# Coverage report
python -m pytest --cov=. --cov-report=html
```

## AI Integration Setup

### OpenAI Configuration
```python
# In core/config.py
OPENAI_MODELS = {
    "gpt-4": "gpt-4",
    "gpt-4-turbo": "gpt-4-turbo-preview",
    "gpt-3.5-turbo": "gpt-3.5-turbo"
}
```

### Anthropic Configuration
```python
# In core/config.py
ANTHROPIC_MODELS = {
    "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-haiku": "claude-3-haiku-20240307"
}
```

### Multi-Provider Failover
The `ModelInterface` class automatically handles provider failover:
```python
# Example usage
from model_interface import ModelInterface

model = ModelInterface()
response = model.generate_text(
    prompt="Analyze this code",
    provider="openai",  # Will fallback to anthropic if unavailable
    model="gpt-4"
)
```

## Database Schema Management

### Schema Definition
Database schema is defined in `shared/schema.ts` using TypeScript:
```typescript
// Example table definition
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'developer' | 'analyst' | 'viewer';
  created_at: Date;
  updated_at: Date;
}
```

### Migration Commands
```bash
# Generate new migration
npm run db:generate

# Push schema changes to database
npm run db:push

# Reset database (development only)
npm run db:reset
```

## Agent Development

### Creating New Agents
```python
# In services/agent_orchestrator/
from agent_base import Agent, AgentCategory

class CustomAgent(Agent):
    def __init__(self, agent_id: str):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentCategory.CODE_QUALITY,
            capabilities=["custom_analysis"]
        )
    
    def _execute_task(self, task):
        # Implement custom logic
        return {"status": "completed", "result": "analysis_complete"}
```

### Agent Registration
```python
# In agent_orchestration_ui.py
from services.agent_orchestrator.custom_agent import CustomAgent

# Register agent
agent = CustomAgent("custom_agent_001")
agent.start()
```

## UI Component Development

### Creating Reusable Components
```python
# In components/ui.py
import streamlit as st
from design_system import COLORS, card

def display_custom_metric(title: str, value: str, change: float):
    """Display a custom metric card with trend indication."""
    with st.container():
        st.markdown(card(f"""
            <div class="metric-card">
                <h3>{title}</h3>
                <div class="metric-value">{value}</div>
                <div class="metric-change {'positive' if change > 0 else 'negative'}">
                    {'+' if change > 0 else ''}{change:.1f}%
                </div>
            </div>
        """), unsafe_allow_html=True)
```

### Design System Usage
```python
# Import design tokens
from design_system import COLORS, TYPOGRAPHY, card, alert

# Use consistent styling
st.markdown(card("Content here"), unsafe_allow_html=True)
st.markdown(alert("Warning message", "warning"), unsafe_allow_html=True)
```

## Production Deployment

### 1. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
cp your_certificate.pem nginx/ssl/cert.pem
cp your_private_key.pem nginx/ssl/key.pem

# Set proper permissions
chmod 600 nginx/ssl/*.pem
```

### 2. Environment Configuration
```bash
# Production environment variables
cat > .env << EOF
OPENAI_API_KEY=sk-your-production-key
ANTHROPIC_API_KEY=sk-ant-your-production-key
DATABASE_URL=postgresql://user:pass@prod-db:5432/terraflow
DEBUG=false
NODE_ENV=production
EOF
```

### 3. Deploy with Docker
```bash
# Build and start services
bash scripts/deploy.sh

# Verify deployment
curl -f http://localhost:5000/health
curl -f http://localhost:5001/api/health
```

### 4. Monitor Deployment
```bash
# Check service logs
docker-compose logs -f terraflow-app
docker-compose logs -f api-server
docker-compose logs -f nginx

# Monitor resource usage
docker stats
```

## Monitoring and Maintenance

### Health Checks
```bash
# Application health
curl -f http://localhost:5000/_stcore/health

# API health
curl -f http://localhost:5001/api/health

# Database connectivity
psql $DATABASE_URL -c "SELECT 1;"
```

### Log Management
```bash
# View application logs
docker-compose logs -f --tail=100 terraflow-app

# Search logs for errors
docker-compose logs terraflow-app | grep ERROR

# Export logs for analysis
docker-compose logs --no-color > application.log
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Database performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5001/api/status
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Kill processes using required ports
sudo lsof -ti:5000 | xargs kill -9
sudo lsof -ti:5001 | xargs kill -9
```

#### Database Connection Issues
```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Reset database connection pool
docker-compose restart api-server
```

#### AI API Failures
```bash
# Test OpenAI connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Test Anthropic connectivity
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
     https://api.anthropic.com/v1/messages
```

#### SSL Certificate Issues
```bash
# Verify certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL configuration
openssl s_client -connect localhost:443 -servername localhost
```

### Performance Optimization

#### Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON sessions(token);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

#### Application Optimization
```python
# Enable Streamlit caching
@st.cache_data
def load_expensive_data():
    return expensive_computation()

# Use connection pooling
from sqlalchemy.pool import QueuePool
engine = create_engine(DATABASE_URL, poolclass=QueuePool)
```

## Security Best Practices

### Environment Security
- Never commit API keys or secrets to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly
- Implement proper access controls for production environments

### Application Security
- Validate all user inputs
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Regularly update dependencies for security patches

### Database Security
- Use strong database passwords
- Implement database-level access controls
- Enable audit logging for sensitive operations
- Regular security assessments and penetration testing

## Contributing Guidelines

### Code Standards
- Follow PEP 8 for Python code
- Use TypeScript for all Node.js code
- Implement comprehensive error handling
- Add type hints to all function parameters
- Write descriptive commit messages

### Pull Request Process
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation as needed
4. Submit pull request with clear description
5. Address code review feedback
6. Merge after approval and CI passes

### Documentation Requirements
- Update README for new features
- Add docstrings to all functions and classes
- Include examples in documentation
- Update API documentation for backend changes

This bootstrap guide provides comprehensive instructions for setting up, developing, and maintaining TerraFusionPlatform ICSF. Follow these guidelines to ensure consistent development practices and successful deployments.