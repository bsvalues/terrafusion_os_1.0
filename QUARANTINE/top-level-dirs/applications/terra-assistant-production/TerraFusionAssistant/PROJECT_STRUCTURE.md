# TerraFusionPlatform ICSF - Project Structure

## Core Application Files

```
terraflow_enhanced_refactored.py    # Main application entry point
README.md                           # Project documentation
DEPLOYMENT_GUIDE.md                 # Deployment instructions
.env.example                        # Environment configuration template
.gitignore                          # Git ignore rules
Dockerfile                          # Container configuration
```

## Application Architecture

```
core/                               # Core system configuration
├── __init__.py                     # Package initialization
└── config.py                       # System configuration management

components/                         # Reusable UI components
├── __init__.py                     # Component exports
├── navigation.py                   # Navigation components
├── styling.py                      # Styling utilities
├── ui.py                          # Core UI components
└── ui_components.py               # Extended UI components

views/                             # Application views and pages
├── __init__.py                    # View exports
├── auth.py                        # Authentication views
├── dashboard.py                   # Main dashboard
├── mcp_console.py                 # MCP console interface
├── phase_workflow.py              # Workflow management
├── reports.py                     # Report generation
└── user_management.py             # User administration

pages/                             # Streamlit page modules
├── 1_Sync_Service_Dashboard.py    # Sync service monitoring
├── 2_Code_Analysis_Dashboard.py   # Code analysis tools
├── 3_Agent_Orchestration.py       # Agent coordination
├── 4_Workflow_Visualization.py    # Workflow mapping
├── 5_Repository_Analysis.py       # Repository insights
├── 6_AI_Chat_Interface.py         # AI communication
└── 7_Security_Dashboard.py        # Security monitoring
```

## Backend Services

```
server/                            # Express.js API server
├── src/                          # Server source code
├── data/                         # Server data storage
├── package.json                  # Node.js dependencies
└── tsconfig.json                 # TypeScript configuration

services/                         # Microservices architecture
├── academic/                     # Academic research services
├── agent_orchestrator/           # Agent coordination
├── ai_models/                    # AI model interfaces
├── api_gateway/                  # API gateway services
├── code_analyzer/                # Code analysis engine
├── continuous_learning/          # Learning systems
├── database/                     # Database services
├── knowledge_graph/              # Knowledge management
├── model_hub/                    # Model repository
├── multimodal/                   # Multimodal processing
├── neuro_symbolic/               # Neuro-symbolic AI
├── repository_service/           # Repository management
├── sdk/                         # Software development kit
└── visualization_service/        # Data visualization

mcp_core/                         # MCP integration layer
├── agents/                       # MCP agent definitions
└── mcp_controller.py             # MCP coordination
```

## Core Modules

```
agent_base.py                     # Base agent framework
auth_manager.py                   # Authentication management
code_analyzer.py                  # Code analysis engine
database_analyzer.py              # Database analysis tools
design_system.py                  # UI design system
documentation_agent.py            # Documentation generation
domain_knowledge_agent.py         # Domain expertise
model_interface.py                # AI model interfaces
report_generator.py               # Report generation
repository_handler.py             # Repository management
state_manager.py                  # Application state
sync_service.py                   # Synchronization services
```

## Deployment Infrastructure

```
deployment/                       # Deployment configurations
└── docker-compose.yml            # Container orchestration

nginx/                            # Reverse proxy configuration
├── nginx.conf                    # Nginx configuration
└── ssl/                         # SSL certificates directory

scripts/                          # Deployment and utility scripts
└── deploy.sh                     # Automated deployment script

shared/                           # Shared configurations
├── config.ts                     # TypeScript configuration
└── schema.ts                     # Database schema
```

## Styling and Assets

```
styles/                           # Application styling
└── terraflow.css                # Custom CSS styles

.streamlit/                       # Streamlit configuration
└── config.toml                  # Streamlit settings
```

## Archive Structure

```
archive/                          # Archived reference materials
├── README.md                     # Archive documentation
├── attached_assets/              # User-uploaded assets
├── deprecated_modules/           # Superseded modules
├── legacy_apps/                  # Previous application versions
├── old_configs/                  # Legacy configurations
├── reference_files/              # Reference materials
└── unused_components/            # Unused code components
```

## Key Features by Directory

### `/core` - System Foundation
- Centralized configuration management
- Environment variable handling
- System-wide constants and settings

### `/components` - UI Building Blocks
- Reusable Streamlit components
- Consistent styling and theming
- Navigation and layout components

### `/views` - Application Pages
- Main application views
- Authentication and authorization
- Dashboard and monitoring interfaces

### `/services` - Backend Logic
- Microservices architecture
- API endpoints and business logic
- Data processing and analysis

### `/deployment` - Infrastructure
- Container orchestration
- Load balancing and SSL termination
- Automated deployment scripts