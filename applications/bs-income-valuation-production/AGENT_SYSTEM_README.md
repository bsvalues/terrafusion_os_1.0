# Multi-Agent System Architecture

The Multi-Agent System is an intelligent orchestration layer that powers the Benton County Property Valuation System. This architecture enables communication, coordination, and collaboration between specialized AI agents, enhancing the platform's capabilities for data analysis, property valuation, and report generation.

## System Components

### 1. Master Control Program (MCP)

The Master Control Program is the central coordination component that manages message routing, agent registration, and system-wide monitoring. It ensures that all agents can communicate efficiently and that messages are properly delivered.

Features:
- Agent registration and discovery
- Message routing and delivery
- Capability-based agent selection
- Experience collection via Replay Buffer
- Health monitoring and metrics collection

### 2. Core Orchestrator

The Core serves as the high-level orchestrator for the entire system. It provides:
- System initialization and configuration
- Master prompt management and distribution
- Agent registration with the MCP
- System-wide event handling
- Health check coordination

### 3. Command Structure Agents

#### Architect Prime Agent
Maintains architectural vision and system integrity:
- Architectural review and guidance
- System vision maintenance
- Architecture diagram generation
- High-level architectural decisions
- Vision statement broadcasting

#### Integration Coordinator Agent
Manages cross-component integration and contracts:
- API contract validation
- Integration point monitoring
- Dependency mapping
- Cross-component testing
- Integration issue resolution
- Dependency diagram generation

#### Component Lead Agents
Provide domain-specific leadership for specialized operational areas:
- Domain expertise coordination and specialized guidance
- Team agent oversight, status monitoring, and performance tracking
- Best practices enforcement and quality control
- Assistance request handling for domain-specific questions
- Domain-specific knowledge management

Currently implemented Component Lead Agents:
- **Valuation Lead Agent**: Oversees property valuation methodologies, cap rate validation, market trend incorporation, and valuation quality control
- **Data Cleaning Lead Agent**: Manages data quality standards, outlier detection, field validation, format standardization, and duplicate detection
- **Reporting Lead Agent**: Coordinates report generation, visualization standards, insight quality, narrative generation, and comparative analysis

### 4. Operational Agents

#### Valuation Agent
Specialized in calculating property values based on income data and market conditions:
- Income stream analysis
- Capitalization rate adjustment
- Value projection with confidence scores
- Market trend incorporation

#### Data Cleaner Agent
Focused on data quality and preprocessing:
- Anomaly detection in data inputs
- Standardization of formats
- Missing value handling
- Outlier identification and cleaning

#### Reporting Agent
Generates insights and reports based on valuation data:
- Summary report generation
- Chart and visualization creation
- Trend analysis and projection
- Natural language insights

## Communication Protocol

Agents communicate through a standardized message protocol defined in `shared/agentProtocol.ts`. Each message includes:
- Unique message and correlation IDs
- Source and target agent identifiers
- Event type (e.g., STATUS_UPDATE, COMMAND, ASSISTANCE_REQUESTED)
- Payload with event-specific data
- Timestamp

### Key Event Types

#### STATUS_UPDATE
Agents report their status to monitor system health:
- Current operational state
- Performance metrics
- Resource utilization
- Recent activity summary

#### COMMAND
Used to trigger specific actions in target agents:
- Direct instructions to execute a specific function
- Configuration updates
- Task assignments with parameters
- System-wide directives

#### ASSISTANCE_REQUESTED
Allows agents to request help from other agents:
- Problem description
- Context information
- Requested agent capabilities
- Priority level

#### ASSISTANCE_RESPONSE
Provides help in response to assistance requests:
- Guidance and solutions
- Related reference materials
- Action recommendations
- Follow-up instructions

#### BROADCAST
System-wide announcements to all agents:
- Vision statements
- Priority changes
- System status notifications
- Global configuration updates

## API Endpoints

The system exposes several API endpoints for interaction:

### Status and Monitoring
- `GET /api/mcp/status` - Get the current status of the MCP and all agents
- `GET /api/mcp/agents/:agentId/metrics` - Get metrics for a specific agent
- `GET /api/mcp/agents/type/:agentType` - Get all agents of a specific type

### Agent Interaction
- `POST /api/mcp/process/:agentType` - Process a request through a specific agent type
- `POST /api/mcp/command/:agentType` - Send a command to agents of a specific type
- `POST /api/mcp/train` - Trigger training for all agents

### Experience Management
- `GET /api/mcp/experiences` - Get experiences from the replay buffer

## Continuous Learning

The system employs a Replay Buffer to store and retrieve agent experiences. This enables:
- Learning from past interactions
- Improvement of agent capabilities over time
- Analysis of system performance
- Training of new agents based on historical data

## System Integration

The Multi-Agent System is integrated with the rest of the application through:
- Server initialization in `server/index.ts`
- API routes in `server/mcpRoutes.ts`
- Controller functions in `server/mcpController.ts`

## Future Enhancements

Planned enhancements to the Multi-Agent System include:

### Command Structure Expansion
- Automated testing agents for system validation
- Self-healing mechanisms for automatic recovery from failures
- Dynamic configuration for real-time agent behavior adjustment
- Expanded specialist agent roles for additional domains

### Intelligence Improvements
- Enhanced learning through prioritized experience replay
- More sophisticated collaboration between agents through the ASSISTANCE_RESPONSE protocol
- Natural language interface improvements for user interaction
- Advanced pattern recognition for financial data analysis

### Infrastructure Enhancements
- Visualization tools for system monitoring
- Metrics dashboard for agent performance tracking
- Distributed deployment support for scalability
- Enhanced security protocols for data protection