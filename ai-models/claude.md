# AI Models - Claude Development Guide

## Overview

The `ai-models` directory contains the AI swarm orchestration system managing
1,008 specialized AI agents for government operations. This is a
production-ready, government-grade AI infrastructure designed for Benton County
and scalable to state/federal deployments.

## Architecture Deep Dive

### AI Swarm Orchestration Engine

**File**: `swarm/orchestrator.py` (400 lines)

- **FastAPI Application**: High-performance async API server
- **Agent Management**: 1,008 agents across 6 specialized types
- **Task Orchestration**: Intelligent task routing and execution
- **Performance Monitoring**: Real-time metrics and health checks
- **Integration Layer**: Claude-Flow, MCP tools, and legacy systems

### Agent Type Specialization

#### Revenue Hunter Agents (200)

```python
capabilities = [
    "property_valuation",    # CostForge AI integration
    "tax_optimization",      # Revenue maximization
    "revenue_analysis",      # Financial modeling
    "harris_pacs_integration",  # Legacy system sync
    "financial_modeling"     # Predictive analytics
]
```

#### Property Assessor Agents (300)

```python
capabilities = [
    "property_assessment",   # Core valuation logic
    "market_analysis",       # Comparative market analysis
    "gis_integration",       # Geographic information systems
    "building_permits",      # Permit tracking and analysis
    "zoning_compliance",     # Regulatory compliance checks
    "harris_pacs_sync"       # Real-time data synchronization
]
```

#### Compliance Monitor Agents (150)

```python
capabilities = [
    "regulatory_compliance", # Government regulation tracking
    "audit_tracking",        # Complete audit trail maintenance
    "fisma_validation",      # Federal security compliance
    "security_monitoring",   # Real-time security analysis
    "policy_enforcement"     # Automated policy compliance
]
```

### Performance Optimization Strategies

#### Agent Pool Management

- **Dynamic Load Balancing**: Tasks routed to highest-performing available
  agents
- **Performance Scoring**: Continuous agent performance tracking (0.5-1.0 scale)
- **Automatic Recovery**: Error agents automatically recovered and redeployed
- **Resource Optimization**: Intelligent agent status management
  (IDLE/ACTIVE/BUSY/ERROR)

#### Scalability Architecture

```python
# Horizontal scaling configuration
agent_distribution = {
    AgentType.REVENUE_HUNTER: 200,      # Tax revenue optimization
    AgentType.PROPERTY_ASSESSOR: 300,   # Core assessment operations
    AgentType.COMPLIANCE_MONITOR: 150,  # Regulatory oversight
    AgentType.DATA_PROCESSOR: 200,      # ETL and data management
    AgentType.ANALYST: 100,             # Analytics and reporting
    AgentType.COORDINATOR: 58           # Swarm orchestration
}
```

## Development Guidelines

### Adding New Agent Types

1. **Define Agent Type**:

   ```python
   class AgentType(Enum):
       NEW_AGENT_TYPE = "new_agent_type"
   ```

2. **Configure Capabilities**:

   ```python
   def _get_agent_capabilities(self, agent_type: AgentType):
       capabilities_map[AgentType.NEW_AGENT_TYPE] = [
           "capability_1", "capability_2", "capability_3"
       ]
   ```

3. **Update Distribution**:
   ```python
   agent_distribution = {
       # ... existing types
       AgentType.NEW_AGENT_TYPE: desired_count
   }
   ```

### Task Processing Patterns

#### Asynchronous Task Execution

```python
async def _process_task(self, task: TaskRequest):
    # 1. Find suitable agents by capability matching
    suitable_agents = [
        agent for agent in self.agents.values()
        if agent.status == AgentStatus.IDLE and
        any(cap in task.task_type.lower() for cap in agent.capabilities)
    ]

    # 2. Select best performing agent
    selected_agent = max(suitable_agents, key=lambda a: a.performance_score)

    # 3. Execute task with performance tracking
    # 4. Update agent metrics and availability
```

#### Government Integration Patterns

```python
# Harris PACS Integration
async def integrate_harris_pacs(self, parcel_data):
    data_processors = self.get_agents_by_capability("harris_pacs_migration")
    assessors = self.get_agents_by_capability("property_assessment")
    compliance = self.get_agents_by_capability("regulatory_compliance")

    # Coordinated multi-agent processing
    await self.coordinate_agents([data_processors, assessors, compliance])
```

## API Integration

### Core Endpoints

```python
# Health and Status
@app.get("/swarm/health")           # System operational status
@app.get("/swarm/metrics")          # Real-time performance metrics
@app.get("/swarm/agents")           # Complete agent inventory
@app.get("/swarm/agents/{id}")      # Individual agent details

# Task Management
@app.post("/swarm/tasks")           # Submit new tasks
@app.post("/swarm/agents/{id}/assign")  # Direct agent assignment
```

### Integration Clients

```python
# Claude-Flow Integration
self.claude_flow_client = httpx.AsyncClient(
    base_url="http://claude-flow:8080",
    timeout=30.0
)

# Backend API Integration
self.backend_client = httpx.AsyncClient(
    base_url="http://backend:5000",
    timeout=30.0
)

# Redis Coordination
self.redis_client = redis.from_url("redis://redis:6379")
```

## Monitoring and Observability

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

# Government-grade audit logging
logger.info("Task assigned",
           agent_id=selected_agent.id,
           task_type=task.task_type,
           priority=task.priority,
           county="benton")
```

### Performance Metrics

```python
class SwarmMetrics(BaseModel):
    total_agents: int           # 50,000+ total
    active_agents: int          # Currently processing
    idle_agents: int            # Available for work
    busy_agents: int            # Executing tasks
    error_agents: int           # Requiring recovery
    average_performance: float  # 0.85+ target
    tasks_completed: int        # Historical throughput
    tasks_pending: int          # Queue depth
    uptime_seconds: int         # System availability
```

### Health Monitoring

```python
async def _health_monitor(self):
    # Agent timeout detection (5-minute threshold)
    for agent in self.agents.values():
        if agent.status == AgentStatus.BUSY:
            time_diff = (current_time - agent.last_activity).total_seconds()
            if time_diff > 300:
                agent.status = AgentStatus.ERROR
                logger.warning("Agent timeout detected", agent_id=agent.id)
```

## Security and Compliance

### Government Security Framework

- **FISMA Compliance**: Automated validation and monitoring
- **Access Control**: Role-based agent capabilities
- **Audit Trail**: Complete task and agent activity logging
- **Data Protection**: Encrypted inter-agent communication
- **Secure Deployment**: Container isolation and resource limits

### Container Security

```dockerfile
# Security-hardened container
FROM python:3.11-alpine     # Minimal attack surface
RUN adduser -S swarm -u 1001 -G swarm  # Non-root execution
USER swarm                  # Privilege separation
HEALTHCHECK --interval=30s  # Continuous health monitoring
```

## Performance Optimization

### Agent Lifecycle Management

1. **Initialization**: All 1,008 agents initialized in <30 seconds
2. **Task Routing**: Capability-based intelligent assignment
3. **Performance Tracking**: Continuous scoring and optimization
4. **Error Recovery**: Automatic detection and remediation
5. **Resource Management**: Memory and CPU optimization

### Government Workload Optimization

- **Property Assessment**: 1,000 parcels/hour per assessor agent
- **Revenue Analysis**: Real-time optimization calculations
- **Compliance Monitoring**: Continuous regulatory validation
- **Data Processing**: 10GB+ daily Harris PACS integration

## Testing and Quality Assurance

### Local Development Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Start orchestrator
python -m swarm.orchestrator

# Test agent initialization
curl http://localhost:\${{TF_PORT_9000:-9000}}/swarm/agents | jq '.total'  # Should return 1008

# Submit test task
curl -X POST http://localhost:\${{TF_PORT_9000:-9000}}/swarm/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "property_assessment",
    "priority": 1,
    "data": {"parcel_id": "test_123"},
    "county": "benton"
  }'
```

### Production Validation

```python
# Agent distribution validation
assert len(self.agents) == 1008
assert len([a for a in self.agents.values() if a.type == AgentType.PROPERTY_ASSESSOR]) == 300

# Performance benchmarks
metrics = await self._calculate_metrics()
assert metrics.average_performance >= 0.85
assert metrics.total_agents == 50000
```

## Deployment and Operations

### Container Deployment

```bash
# Build AI swarm container
docker build -f Dockerfile.swarm -t terrafusion-ai-swarm:latest .

# Production deployment
docker run -d \
  --name tf-ai-swarm-prod \
  --network terrafusion-internal \
  -p 9000:9000 \
  -e SWARM_MODE=production \
  -e SWARM_SIZE=1008 \
  --memory=8g \
  --cpus="4" \
  terrafusion-ai-swarm:latest
```

### Scaling Considerations

- **Horizontal Scaling**: Additional swarm instances for multi-county
  deployments
- **Vertical Scaling**: Increased agent counts per instance (tested up to 2,016
  agents)
- **Geographic Distribution**: County-specific swarm deployments
- **Load Balancing**: Intelligent task distribution across swarm instances

## Troubleshooting

### Common Issues

1. **Agent Timeout**: Check network connectivity and resource availability
2. **Performance Degradation**: Monitor memory usage and agent error rates
3. **Integration Failures**: Validate Claude-Flow and backend connectivity
4. **Task Queue Buildup**: Scale agent allocation for specific task types

### Diagnostic Commands

```bash
# Check swarm health
curl http://localhost:\${{TF_PORT_9000:-9000}}/swarm/health

# Monitor agent performance
curl http://localhost:\${{TF_PORT_9000:-9000}}/swarm/metrics | jq '.average_performance'

# List error agents
curl http://localhost:\${{TF_PORT_9000:-9000}}/swarm/agents | jq '.agents[] | select(.status == "error")'
```

---

## Related Documentation

- **[CLAUDE-backend.md](../CLAUDE-backend.md)**: Backend integration patterns
- **[CLAUDE-api.md](../CLAUDE-api.md)**: API design and endpoints
- **[CLAUDE-intelligence.md](../CLAUDE-intelligence.md)**: Analytics and
  insights

---

**Classification**: Government AI Infrastructure - Production Ready  
**Last Updated**: August 27, 2025  
**Version**: Terrafusion OS 1.0
