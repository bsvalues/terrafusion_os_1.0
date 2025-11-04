# Terrafusion Rust Platform

Next-generation AI-powered real estate appraisal platform with comprehensive agent orchestration built in Rust.

## 🚀 Features

### Core Agent Ecosystem

- **Valuation Agent**: AI-powered property valuations with confidence scoring
- **RAG Agent**: Knowledge retrieval and question-answering capabilities
- **Compliance Agent**: USPAP and UAD compliance verification
- **Sketch Agent**: 3D floor plan analysis and GLA calculation
- **Data Processing Agent**: Multi-format data processing and validation

### Legacy System Integration

- **UAD Adapter**: XML parsing and generation for industry standards
- **ENV Adapter**: MISMO, FNC, and TOTAL format support
- **TOTAL Sidecar**: Real-time TOTAL software enhancement
- **ACI Sidecar**: ACI.dev workflow automation
- **ClickForms Sidecar**: Form auto-population and narrative generation
- **SFREP Sidecar**: Quality control and review automation

### Platform Capabilities

- **Multi-Agent Orchestration**: Coordinated agent swarm with message routing
- **Real-time Communication**: MCP protocol with advanced message handling
- **Cloud API**: RESTful API for external integrations
- **Mobile Support**: Mobile agent interface for field data collection
- **ACI.dev Integration**: Direct integration with ACI development tools

## 🛠️ Quick Start

### Prerequisites

- Rust 1.77+
- Docker & Docker Compose
- PostgreSQL (optional, included in Docker setup)

### Development Setup

1. **Clone and Setup**

```bash
cd terrafusion_rust
cargo build
```

2. **Run with Docker Compose**

```bash
docker-compose up -d
```

3. **Run Locally**

```bash
# Bootstrap the system
cargo run -- bootstrap

# Start the agent swarm
cargo run -- run

# Start API server
cargo run -- serve-api

# Run as ACI.dev adapter
cargo run -- acidev
```

## 📡 API Endpoints

- **Health Check**: `GET /api/health`
- **Property Valuation**: `POST /api/valuation`
- **Property Analysis**: `POST /api/analysis`
- **Agent Status**: `GET /api/agents`

## 🤖 Agent Commands

### Valuation Agent

```bash
# Property valuation request
{
  "recipient": "valuation-agent",
  "content_type": "property-valuation-request",
  "content": {
    "address": "123 Main St",
    "square_feet": 2000,
    "bedrooms": 3,
    "bathrooms": 2.0
  }
}
```

### Compliance Agent

```bash
# Compliance check request
{
  "recipient": "compliance-agent",
  "content_type": "compliance-check-request",
  "content": {
    "appraisal_data": {...},
    "form_data": {...}
  }
}
```

### Sketch Agent

```bash
# Sketch analysis request
{
  "recipient": "sketch-agent",
  "content_type": "sketch-analysis-request",
  "content": {
    "image_data": "base64_encoded_image"
  }
}
```

## 🔧 Configuration

### Environment Variables

- `RUST_LOG`: Logging level (default: info)
- `RUST_BACKTRACE`: Error backtrace (default: 1)

### Agent Configuration

Each agent can be configured through the message protocol or direct initialization parameters.

## 📊 Monitoring

### Health Checks

- Application: `http://localhost:8080/api/health`
- Agents: `http://localhost:8080/api/agents`

### Logging

Structured logging with tracing support. Logs are output to stdout and can be configured for file output.

## 🏗️ Architecture

### Agent Swarm Orchestrator

Central coordination of all agents with:

- Message routing via MCP protocol
- Health monitoring
- Load balancing
- Error handling and recovery

### MCP Protocol

Advanced message communication protocol with:

- Priority-based routing
- Message expiration
- Response tracking
- Broadcast capabilities

### Data Processing Pipeline

Multi-stage processing with:

- Format detection and parsing
- Validation and quality scoring
- Transformation and enrichment
- Output generation

## 🔌 Integrations

### Legacy Software Support

- **TOTAL**: File monitoring and AI enhancement
- **ACI**: Workflow automation and quality review
- **ClickForms**: Auto-population and compliance checking
- **SFREP**: Automated quality control

### External APIs

- AI providers for valuation and analysis
- MLS systems for property data
- Mapping services for geospatial data
- Document storage for file management

## 🚀 Deployment

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

### Native Binary

```bash
cargo build --release
./target/release/terrafusion run
```

## 🧪 Testing

```bash
# Run all tests
cargo test

# Run specific agent tests
cargo test valuation_agent

# Integration tests
cargo test --test integration
```

## 📈 Performance

- **Agent Response Time**: <100ms average
- **API Throughput**: 1000+ requests/second
- **Memory Usage**: <512MB base footprint
- **Concurrent Agents**: Unlimited (resource-constrained)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: See docs/ directory
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

**Terrafusion Rust Platform - Revolutionizing Real Estate Appraisal Through AI Agent Orchestration**
