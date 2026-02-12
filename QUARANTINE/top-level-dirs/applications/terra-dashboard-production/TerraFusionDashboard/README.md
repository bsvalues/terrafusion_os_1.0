# Terrafusion Platform

Enterprise-grade AI-powered property assessment platform with authentic Benton County Washington data integration.

## Features

- **Authentic Property Data**: Real Benton County assessment records with 50+ properties
- **AI Agent Orchestration**: Intelligent task processing and property analysis
- **Real-time Dashboard**: Live system monitoring and property insights
- **Enterprise APIs**: Comprehensive REST endpoints for property management
- **Production-Ready**: Docker, Kubernetes, and cloud deployment configurations

## Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the application
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Deployment

#### Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Kubernetes

```bash
# Deploy to Kubernetes cluster
kubectl apply -f k8s-deployment.yaml

# Check deployment status
kubectl get pods -n terrafusion
```

## API Endpoints

### Core Endpoints

- `GET /api/system/health` - System health check
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get property details
- `GET /api/counties` - List counties
- `GET /api/dashboard/stats` - Dashboard statistics

### AI Agent System

- `GET /api/agents` - List available agents
- `POST /api/orchestrator/submit` - Submit analysis task
- `GET /api/orchestrator/stats` - Task queue statistics
- `GET /api/agents/jobs/recent` - Recent job history

## Data Sources

### Benton County Integration

The platform contains authentic property assessment data from Benton County, Washington:

- **Properties**: 50+ real property records
- **Assessments**: Current assessed values, land values, improvement values
- **Addresses**: Complete situs address information
- **Sales Data**: Historical sales transaction records

## AI Agents

### Available Agents

1. **NarratorAI v2.1.0** - Property narrative generation
2. **ExemptionSeer v1.8.2** - Tax exemption analysis
3. **SalesValidator v3.0.1** - Sales comparison validation
4. **CostAnalyzer v2.3.0** - Replacement cost analysis

### Task Types

- `property-analysis` - Comprehensive property evaluation
- `cost-analysis` - Replacement cost estimation
- `exemption-analysis` - Tax exemption eligibility
- `compliance-check` - Regulatory compliance verification
- `market-analysis` - Market value assessment
- `explanation-generation` - AI-powered explanations

## Architecture

### Technology Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **AI Services**: OpenAI and Anthropic Claude integration
- **Real-time**: WebSocket connections
- **Deployment**: Docker, Kubernetes, Nginx

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Task Queue     │    │  AI Agents      │
│                 │    │                 │    │                 │
│ - Dashboard     │────│ - Orchestrator  │────│ - NarratorAI    │
│ - Property View │    │ - Job Scheduler │    │ - ExemptionSeer │
│ - Agent Console │    │ - Status Track  │    │ - SalesValidator│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │                 │
                    │ - Properties    │
                    │ - Tasks         │
                    │ - Results       │
                    └─────────────────┘
```

## Testing

### Run Integration Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test integration.test.js

# Run with coverage
npm run test:coverage
```

### Test Coverage

- System health endpoints
- Property data integrity
- AI agent functionality
- Task orchestration
- Performance benchmarks

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/terrafusion

# AI Services (required for full functionality)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Application
NODE_ENV=production
PORT=5000
```

## Monitoring

### Health Checks

The system provides comprehensive health monitoring:

- Database connectivity
- AI service availability
- Task queue status
- System performance metrics

### Dashboard Metrics

- Total properties loaded
- Active AI agents
- Task completion rates
- System uptime

## Support

For technical support or questions about the Terrafusion platform, please refer to the system documentation or contact the development team.

## License

Enterprise Commercial License - All rights reserved.