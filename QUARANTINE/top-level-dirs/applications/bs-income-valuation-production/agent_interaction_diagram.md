# Agent Interaction Diagram

This document visualizes the interaction patterns between different agents in the command structure of the Benton County Property Valuation System.

## Command Structure Interaction Flow

```mermaid
sequenceDiagram
    participant Client as Client API
    participant MCP as Master Control Program
    participant Core as Core Orchestrator
    participant ArchPrime as Architect Prime
    participant IntCoord as Integration Coordinator
    participant ValAgent as Valuation Agent
    participant DataAgent as Data Cleaner Agent
    participant RepAgent as Reporting Agent
    
    %% System Initialization
    Client->>MCP: Start System
    MCP->>Core: Initialize System
    Core->>MCP: Register Self
    Core->>MCP: Register Agents
    Core->>MCP: Broadcast Announcement
    MCP-->>ArchPrime: Forward Broadcast
    MCP-->>IntCoord: Forward Broadcast
    MCP-->>ValAgent: Forward Broadcast
    MCP-->>DataAgent: Forward Broadcast
    MCP-->>RepAgent: Forward Broadcast
    
    %% Vision Statement Broadcast
    ArchPrime->>MCP: Broadcast Vision
    MCP-->>IntCoord: Forward Vision
    MCP-->>ValAgent: Forward Vision
    MCP-->>DataAgent: Forward Vision
    MCP-->>RepAgent: Forward Vision
    
    %% Property Valuation Request
    Client->>MCP: Valuation Request
    MCP->>ValAgent: Process Request
    ValAgent->>MCP: Request Data Cleaning
    MCP->>DataAgent: Clean Data Request
    DataAgent->>MCP: Return Cleaned Data
    MCP->>ValAgent: Deliver Cleaned Data
    ValAgent->>MCP: Return Valuation
    MCP->>RepAgent: Generate Report
    RepAgent->>MCP: Return Report
    MCP->>Client: Deliver Final Result
    
    %% Integration Issue Resolution
    DataAgent->>MCP: Report Integration Issue
    MCP->>IntCoord: Forward Issue
    IntCoord->>MCP: Request Assistance
    MCP->>ArchPrime: Forward Assistance Request
    ArchPrime->>MCP: Provide Architectural Guidance
    MCP->>IntCoord: Deliver Guidance
    IntCoord->>MCP: Resolution Plan
    MCP->>DataAgent: Implementation Instructions
    DataAgent->>MCP: Confirm Resolution
    MCP->>IntCoord: Update Integration Status
    
    %% System Health Monitoring
    Core->>MCP: Health Check Request
    MCP->>ValAgent: Request Status
    MCP->>DataAgent: Request Status
    MCP->>RepAgent: Request Status
    MCP->>ArchPrime: Request Status
    MCP->>IntCoord: Request Status
    ValAgent->>MCP: Status Update
    DataAgent->>MCP: Status Update
    RepAgent->>MCP: Status Update
    ArchPrime->>MCP: Status Update
    IntCoord->>MCP: Status Update
    MCP->>Core: System Health Report
```

## Message Flow by Event Type

### Normal Operation

1. **Client Request Processing**
   - Client sends request to MCP
   - MCP routes to appropriate operational agent
   - Agent processes request and returns result
   - MCP delivers result to client

2. **Inter-Agent Collaboration**
   - Agent sends assistance request to MCP
   - MCP routes to capable agent
   - Receiving agent processes and returns assistance
   - MCP delivers assistance to requesting agent

3. **System Monitoring**
   - Core initiates health check
   - MCP collects status from all agents
   - MCP aggregates and returns system health report
   - Core takes action if needed

### Command Structure Coordination

1. **Architectural Guidance**
   - Architect Prime broadcasts vision statements periodically
   - Architect Prime generates system architecture diagrams
   - Architect Prime responds to architectural questions
   - Architect Prime performs architectural reviews

2. **Integration Coordination**
   - Integration Coordinator validates API contracts
   - Integration Coordinator monitors integration points
   - Integration Coordinator maps dependencies
   - Integration Coordinator resolves integration issues

## Event Type Usage

| Event Type | Primary Users | Purpose |
|------------|---------------|---------|
| REQUEST | Client → MCP → Agent | Process client requests |
| RESPONSE | Agent → MCP → Client | Return processing results |
| COMMAND | Core/MCP → Agent | Direct agent to perform action |
| COMMAND_RESULT | Agent → MCP → Core | Return command execution result |
| ASSISTANCE_REQUESTED | Agent → MCP → Agent | Request help from another agent |
| ASSISTANCE_RESPONSE | Agent → MCP → Agent | Provide help to requesting agent |
| BROADCAST | Core/Architect Prime → MCP → All | System-wide announcements |
| STATUS_UPDATE | Agent → MCP → Core | Report agent health and metrics |
| HEALTH_CHECK | Core → MCP → All | Trigger system health check |
| ERROR | Any → MCP → Core | Report errors or issues |

## Benefits of the Interaction Model

1. **Centralized Coordination**: All messages flow through the MCP, enabling monitoring, logging, and replay buffer collection
2. **Clear Responsibility Boundaries**: Each agent has well-defined roles and message types it can send/receive
3. **Scalable Architecture**: New agents can be added without changing the interaction pattern
4. **Consistent Messaging Protocol**: Standardized message format simplifies agent implementation
5. **Improved Observability**: Communication flow makes it easy to trace request handling