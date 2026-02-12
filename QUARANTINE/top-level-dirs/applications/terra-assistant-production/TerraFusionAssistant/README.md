# TerraFusionPlatform ICSF

An advanced AI-powered civil infrastructure brain that combines precision automation, elegant simplicity, and tactical execution excellence. Built for organizations that demand Tesla-tier precision, Jobs-level elegance, and Brady/Belichick tactical efficiency.

## Core Architecture

**Streamlined AI-Driven Platform:**
- Streamlit-based interactive interface with cyberpunk-inspired design
- Multi-agent AI orchestration system with intelligent task distribution
- Real-time code analysis and optimization with dual AI provider support
- Advanced cross-service integration (OpenAI GPT-4 + Anthropic Claude 3.5)
- Comprehensive security and performance monitoring dashboard
- PostgreSQL database with automated schema management and connection pooling

## Quick Start

### Development Mode
```bash
# Start the main application
streamlit run terraflow_enhanced_refactored.py --server.port 5000

# Start the API server (separate terminal)
node server/src/index.js
```

### Production Deployment
```bash
# Place SSL certificates in nginx/ssl/ as cert.pem and key.pem
# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and database URL

# Deploy with automated verification
bash scripts/deploy.sh
```

## Key Features

### Real-time AI Analysis
Advanced code quality assessment and optimization recommendations powered by dual AI providers with intelligent failover capabilities.

### Multi-Agent Orchestration
Coordinated AI agents for comprehensive project analysis including code quality, architecture, database optimization, and security scanning.

### Security Monitoring
Continuous security scanning and threat detection with automated vulnerability assessment and compliance reporting.

### Performance Optimization
Automated performance bottleneck identification and resolution with real-time metrics collection and analysis.

### Workflow Visualization
Interactive process mapping with bottleneck identification and optimization recommendations for development workflows.

### Deployment Automation
One-command deployment with health verification, SSL configuration, and automated service orchestration.

## Technology Stack

- **AI Integration:** OpenAI GPT-4o and Anthropic Claude 3.5 models
- **Frontend:** Streamlit for interactive UI components
- **Visualization:** Matplotlib, Plotly for data visualization
- **Analysis:** Custom code analysis modules powered by AI
- **Performance Monitoring:** Real-time metrics collection and analysis

## Installation & Setup

### Prerequisites

- Python 3.10+
- API keys for OpenAI and/or Anthropic (optional, but recommended)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/terrafusion/ai-platform.git
   cd ai-platform
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up environment variables for API keys:
   ```
   export OPENAI_API_KEY="your_openai_api_key"
   export ANTHROPIC_API_KEY="your_anthropic_api_key"
   ```

### Running the Platform

Launch the application:
```
streamlit run app.py
```

The application will be available at http://localhost:5000

## Usage

### Main Dashboard

The main dashboard provides an overview of system performance, AI service status, and access to all specialized tools.

### Analyzing Code

1. Navigate to the Code Analysis dashboard
2. Upload a file or paste code directly
3. Select the type of analysis (quality, architecture, performance, security)
4. Choose your preferred AI provider
5. View detailed analysis results and recommendations

### Optimizing Workflows

1. Navigate to the Workflow Visualization dashboard
2. Import or create a workflow diagram
3. Analyze for bottlenecks and inefficiencies
4. View optimization suggestions
5. Export optimized workflow

## AI Integration

The platform integrates with both OpenAI and Anthropic models:

- **OpenAI:** Utilizes GPT-4o for advanced code analysis and generation
- **Anthropic:** Leverages Claude 3.5 for additional insights and perspectives

The `ModelInterface` class provides a unified API for both providers, allowing seamless switching between models and fallback options if one provider is unavailable.

## Architecture

The platform follows a modular architecture:

- **Core Services:** Foundational services for AI integration and basic functionality
- **Specialized Modules:** Purpose-built modules for specific analysis tasks
- **UI Components:** Streamlit-based UI for interactive user experience
- **Agent Framework:** Infrastructure for multi-agent coordination and communication

## Contributing

We welcome contributions to the Terrafusion AI Platform! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The OpenAI team for their powerful API
- The Anthropic team for their Claude models
- The Streamlit team for their excellent UI framework
- All contributors who have helped improve this platform

---

© 2025 Terrafusion AI Platform | Advanced Code Analysis and Optimization