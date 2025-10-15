# TerraAgent MCP Server

## MIT PhD-Level Model Context Protocol Implementation

The TerraAgent MCP Server is a production-grade Model Context Protocol server that provides comprehensive real estate assessment and property analysis tools through a standardized interface.

## Features

### 🏠 **Property Intelligence Tools**
- **Property Search**: Advanced property search with location-based filtering
- **Property Analysis**: Comprehensive property valuation and market analysis  
- **Assessment Tools**: Property assessment data and tax calculations
- **Market Analysis**: Local market trends and statistics
- **Comparable Analysis**: Find and analyze comparable properties (CMA)
- **Valuation Tools**: Automated property valuation models
- **Neighborhood Analysis**: Demographics, amenities, and market characteristics
- **Tax Calculations**: Property tax calculations and projections
- **Property History**: Historical sales, assessments, and ownership data
- **Document Analysis**: AI-powered analysis of property documents

### 🚀 **Production Features**
- **High Performance**: Intelligent caching and request optimization
- **Scalability**: Designed for high-concurrency workloads
- **Monitoring**: Comprehensive metrics and logging
- **Reliability**: Error handling and graceful degradation
- **Security**: Input validation and secure API communication
- **Flexibility**: Configurable cache strategies and service integrations

## Installation

### Prerequisites
- Node.js 18+ 
- npm 8+
- Access to TerraAgent backend services

### Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Build the Server**
```bash
npm run build
```

4. **Start the Server**
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/staging/production) | development |
| `DB_TYPE` | Database type (sqlite/postgresql) | sqlite |
| `CACHE_PROVIDER` | Cache provider (memory/redis) | memory |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |
| `TERRA_AGENT_BACKEND_URL` | TerraAgent backend service URL | http://localhost:5000 |

See `.env.example` for complete configuration options.

## MCP Tools

### Property Search
Search for properties using various criteria:
```json
{
  "name": "property-search",
  "arguments": {
    "address": "123 Main St, Benton City, WA",
    "filters": {
      "propertyTypes": ["residential"],
      "priceRange": { "min": 300000, "max": 500000 }
    },
    "pagination": { "page": 1, "limit": 20 }
  }
}
```

### Property Analysis
Comprehensive property analysis:
```json
{
  "name": "property-analysis", 
  "arguments": {
    "propertyId": "prop_001",
    "analysisTypes": ["valuation", "market", "comparables"],
    "includeComparables": true,
    "maxComparables": 5
  }
}
```

### Assessment Data
Get property assessment information:
```json
{
  "name": "assessment",
  "arguments": {
    "propertyId": "prop_001",
    "assessmentYear": 2024
  }
}
```

### Market Analysis
Analyze local market conditions:
```json
{
  "name": "market-analysis",
  "arguments": {
    "zipCode": "99320",
    "timeframe": "6months"
  }
}
```

## Architecture

### Core Components

- **MCP Server**: Main server implementing Model Context Protocol
- **Tool Registry**: Dynamic tool registration and management
- **Validation Service**: Input validation and schema enforcement
- **Cache Service**: Intelligent result caching with TTL and LRU
- **Metrics Collector**: Performance monitoring and analytics
- **Configuration Manager**: Environment-based configuration

### Tool Framework

Each tool implements the `MCPTool` interface:
```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema7;
  cacheConfig?: CacheConfig;
  execute(args: any, context: ToolExecutionContext): Promise<any>;
}
```

### Caching Strategy

- **Memory Cache**: LRU cache with configurable memory limits
- **Redis Cache**: Optional Redis backend for distributed caching
- **Smart TTL**: Tool-specific cache lifetimes
- **Tag-based Invalidation**: Invalidate related cache entries

## Development

### Project Structure
```
src/
├── config/          # Configuration management
├── services/        # Core services (validation, cache)
├── tools/           # MCP tool implementations  
├── types/           # TypeScript type definitions
├── utils/           # Utilities (logger, metrics)
└── index.ts         # Main server entry point
```

### Adding New Tools

1. **Create Tool Class**
```typescript
export class NewTool implements MCPTool {
  public readonly name = 'new-tool';
  public readonly description = 'Tool description';
  public readonly inputSchema = { /* JSON Schema */ };
  
  public async execute(args: any, context: ToolExecutionContext): Promise<any> {
    // Implementation
  }
}
```

2. **Register Tool**
Add to `initializeTools()` in `index.ts`

3. **Add Validation**
Add tool-specific validation to `ValidationService`

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

## Production Deployment

### Docker Deployment
```bash
# Build image
docker build -t terraagent-mcp-server .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_TYPE=postgresql \
  terraagent-mcp-server
```

### Performance Tuning

- **Memory Cache**: Adjust `CACHE_MAX_MEMORY_MB` based on available memory
- **Concurrency**: Configure `MAX_CONCURRENT_REQUESTS` for your workload  
- **TTL Values**: Tune cache TTL values per tool for optimal performance
- **Database**: Use PostgreSQL for production workloads

### Monitoring

The server exposes metrics for:
- Tool execution times
- Cache hit/miss rates  
- Request success/failure rates
- Memory usage
- Active connections

## Integration

### TerraFusion OS Integration

The MCP server integrates with:
- **TerraAgent Backend**: Core property data services
- **Assessment APIs**: County assessment systems
- **Property Data Services**: MLS and public records
- **AI Services**: Document analysis and ML models

### Client Integration

Use with any MCP-compatible client:
```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'terraagent-client',
  version: '1.0.0',
});

// List available tools
const tools = await client.listTools();

// Execute tool
const result = await client.callTool({
  name: 'property-search',
  arguments: { address: '123 Main St' }
});
```

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- GitHub Issues: [Repository Issues](https://github.com/terrafusion/terrafusion-os/issues)
- Documentation: [TerraFusion Docs](https://docs.terrafusion.ai)
- Email: support@terrafusion.ai
