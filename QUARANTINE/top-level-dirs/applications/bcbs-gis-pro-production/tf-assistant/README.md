# Terrafusion GIS Workflow Assistant
## Local LLM + RAG Agent Mesh for Benton County, Washington

### Overview
A fully offline, county-compliant GIS automation tool for Benton County Assessor workflows including parcel management, SM00 reports, and Boundary Line Adjustments (BLA/Merge/Splits). Designed to run completely local without Docker or internet connectivity.

### Architecture
```
Multi-Agent Mesh System:
├── WorkflowAgent    - Parcel processing and checklist automation
├── JudgeAgent       - Compliance validation (RCW/WAC/County Code)
└── NarratorAgent    - Workflow summaries and audit trails

Local LLM Integration:
├── LM Studio        - Primary LLM runtime (mistral-7b-instruct)
├── Ollama           - Alternative LLM runtime
└── ChromaDB         - Vector database for RAG document retrieval
```

### Quick Start

1. **One-Click Launch**
   ```batch
   start-gis-agent.bat
   ```

2. **Manual Setup**
   ```bash
   cd tf-assistant/backend
   npm install
   node server.js
   ```

3. **Initialize RAG System**
   ```bash
   cd tf-assistant/rag
   python rag-setup.py
   ```

### System Requirements

- **Node.js**: LTS version (16.0+ recommended)
- **Python**: 3.8+ for RAG system
- **LLM Runtime**: LM Studio or Ollama
- **Storage**: 2GB for models and documents
- **Memory**: 8GB RAM minimum, 16GB recommended

### Features

#### Core Workflows
- **SM00 Report Generation**: Automated property assessment reports
- **Boundary Line Adjustments**: BLA/Merge/Split processing
- **Agricultural Assessment**: Current use assessment (RCW 84.34)
- **Wine Country Properties**: Specialized vineyard assessments

#### Compliance Framework
- **Washington State**: RCW 84 (Property Tax), RCW 58.17 (Subdivisions)
- **County Regulations**: Benton County Code Title 19/20
- **Assessment Standards**: WAC 458-07 procedures

#### Multi-Agent Processing
- **Workflow Processing**: Task analysis and recommendation generation
- **Compliance Validation**: Regulatory compliance verification
- **Audit Documentation**: Professional summaries and trails

### API Endpoints

#### Agent Mesh
```
POST /agent-mesh/workflow
Body: {
  "task": "Generate SM00 report",
  "parcelData": {...},
  "workflowType": "assessment"
}
```

#### Parcel Operations
```
POST /parcel/sm00-report
Body: {
  "parcelNumber": "1234567-123-123",
  "ownerName": "John Doe",
  "legalDescription": "..."
}

POST /parcel/bla-merge-split
Body: {
  "operation": "boundary_adjustment",
  "sourceParcels": [...],
  "targetConfiguration": {...}
}
```

#### Document Search
```
POST /rag/search
Body: {
  "query": "BLA requirements",
  "documentType": "procedure",
  "workflowStage": "validation"
}
```

### Configuration

#### Environment Variables (.env.local)
```
LLM_ENDPOINT=http://localhost:11434
LLM_MODEL=mistral:7b-instruct
RAG_ENABLED=true
COUNTY_NAME=Benton County
OFFLINE_MODE=true
```

#### Agent Configuration
Each agent uses JSON prompt templates in `/prompts/`:
- `workflow_agent.json` - Task processing prompts
- `judge_agent.json` - Compliance validation prompts  
- `narrator_agent.json` - Documentation generation prompts

### Benton County Specifics

#### Assessment Districts
- **Richland District**: Urban residential/commercial
- **Kennewick District**: Mixed urban (population 83,920)
- **West Richland District**: Suburban residential
- **Prosser District**: County seat, wine country
- **Rural Districts**: Agricultural operations

#### Special Considerations
- **Hanford Nuclear Reservation**: 586 square miles federal property
- **Wine Country**: 200+ wineries, vineyard assessments
- **Agricultural Focus**: Current use assessment program
- **Columbia River**: Recreational property impacts

### Compliance Features

#### Data Integrity
- No synthetic or mock data usage
- Real property data connections only
- Authentic document sources required
- Error states for unavailable data

#### Security & Privacy
- Complete offline operation
- No external API calls
- Local file system storage
- County-controlled data access

#### Audit Trail
- Complete workflow logging
- Compliance verification records
- Agent interaction documentation
- Regulatory citation tracking

### Troubleshooting

#### LLM Connection Issues
1. Verify LM Studio is running on port 11434
2. Check model is loaded (mistral-7b-instruct recommended)
3. Confirm endpoint in .env.local file

#### RAG System Issues
1. Run `python rag-setup.py` to initialize
2. Verify ChromaDB installation
3. Check document loading logs

#### Agent Mesh Failures
1. Check agent readiness at `/health` endpoint
2. Review prompt template JSON files
3. Verify workflow type compatibility

### Development

#### Adding New Workflows
1. Update `WorkflowAgent` with new processing logic
2. Add validation rules to `JudgeAgent`
3. Create documentation templates in `NarratorAgent`
4. Update prompt templates with new procedures

#### Custom Document Integration
1. Add documents to `/rag/documents/` directory
2. Update `rag-setup.py` with document metadata
3. Re-run RAG initialization
4. Test retrieval with sample queries

### Support

For technical issues or Benton County-specific workflow questions:
- Review logs in `/logs/` directory
- Check agent health status
- Verify LLM model performance
- Consult prompt template configurations

### License
MIT License - County deployment approved for local government use.