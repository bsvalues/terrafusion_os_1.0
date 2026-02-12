#!/bin/bash

# TerraFusion OS Module Generator
# Creates production-ready module structure with all required components

set -euo pipefail

# Default values
MODULE_NAME=""
MODULE_TYPE="government"
MODULE_TIER="tier2"
WITH_AI="true"
WITH_DATABASE="true"
WITH_FRONTEND="true"
WITH_TESTS="true"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --name=*)
      MODULE_NAME="${1#*=}"
      shift
      ;;
    --type=*)
      MODULE_TYPE="${1#*=}"
      shift
      ;;
    --tier=*)
      MODULE_TIER="${1#*=}"
      shift
      ;;
    --no-ai)
      WITH_AI="false"
      shift
      ;;
    --no-database)
      WITH_DATABASE="false"
      shift
      ;;
    --no-frontend)
      WITH_FRONTEND="false"
      shift
      ;;
    --no-tests)
      WITH_TESTS="false"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 --name=MODULE_NAME [OPTIONS]"
      echo "Options:"
      echo "  --name=NAME       Module name (required)"
      echo "  --type=TYPE       Module type (government|commercial|ai) [default: government]"
      echo "  --tier=TIER       Module tier (tier1|tier2|tier3) [default: tier2]"
      echo "  --no-ai          Skip AI integration"
      echo "  --no-database    Skip database components"
      echo "  --no-frontend    Skip frontend components"
      echo "  --no-tests       Skip test scaffolding"
      echo "  -h, --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$MODULE_NAME" ]]; then
  echo "Error: --name parameter is required"
  echo "Use --help for usage information"
  exit 1
fi

# Validate module type
case $MODULE_TYPE in
  government|commercial|ai)
    ;;
  *)
    echo "Error: Invalid module type '$MODULE_TYPE'. Must be: government, commercial, or ai"
    exit 1
    ;;
esac

# Set up variables
MODULE_DIR="modules/$MODULE_NAME"
PASCAL_NAME=$(echo "$MODULE_NAME" | sed 's/-/_/g' | sed 's/\b\w/\U&/g')
NAMESPACE="TerraFusion.Modules.$PASCAL_NAME"

echo "🚀 Creating TerraFusion module: $MODULE_NAME"
echo "   Type: $MODULE_TYPE"
echo "   Tier: $MODULE_TIER"
echo "   Directory: $MODULE_DIR"
echo "   Namespace: $NAMESPACE"
echo ""

# Create module directory structure
mkdir -p "$MODULE_DIR"/{src,backend,docs,tests}

if [[ "$WITH_FRONTEND" == "true" ]]; then
  mkdir -p "$MODULE_DIR"/src/{components,services,types,hooks}
  mkdir -p "$MODULE_DIR"/src-tauri/src
fi

if [[ "$WITH_DATABASE" == "true" ]]; then
  mkdir -p "$MODULE_DIR"/backend/{Entities,Services,Controllers,DTOs}
fi

if [[ "$WITH_TESTS" == "true" ]]; then
  mkdir -p "$MODULE_DIR"/tests/{unit,integration,e2e}
fi

# Generate module manifest
cat > "$MODULE_DIR/module.manifest.json" << EOF
{
  "name": "$MODULE_NAME",
  "version": "1.0.0",
  "displayName": "$(echo "$MODULE_NAME" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')",
  "description": "Custom $MODULE_TYPE module for TerraFusion OS",
  "type": "$MODULE_TYPE-module",
  "tier": "$MODULE_TIER",
  "priority": "normal",
  "status": "development",
  "capabilities": [
    "data-processing",
    "api-integration"$(if [[ "$WITH_AI" == "true" ]]; then echo ',
    "ai-integration"'; fi)$(if [[ "$MODULE_TYPE" == "government" ]]; then echo ',
    "government-compliance"'; fi)
  ],
  "components": [],
  "dependencies": [
    "government-edition"$(if [[ "$WITH_AI" == "true" ]]; then echo ',
    "ai-command-brain"'; fi)
  ],
  "configuration": {
    "environment": {
      "MODULE_ENABLED": "true"$(if [[ "$WITH_AI" == "true" ]]; then echo ',
      "AI_INTEGRATION_ENABLED": "true"'; fi)
    },
    "resources": {
      "memory": "1GB",
      "cpu": "1 core",
      "storage": "500MB"
    }
  },
  "api": {
    "endpoints": [
      "/api/$MODULE_NAME/health",
      "/api/$MODULE_NAME/metrics"
    ],
    "events": [
      "module-initialized",
      "data-processed"
    ]
  },
  "security": {
    "authentication": "required",
    "authorization": "rbac",
    "encryption": "aes-256"$(if [[ "$MODULE_TYPE" == "government" ]]; then echo ',
    "compliance": ["FISMA", "NIST"]'; fi)
  },
  "monitoring": {
    "metrics": [
      "requests_total",
      "response_time",
      "error_rate"
    ],
    "alerts": [
      "high_error_rate",
      "slow_response"
    ]
  },
  "testing": {
    "unitTests": "npm run test:unit",
    "integrationTests": "npm run test:integration",
    "coverage": ">80%"
  },
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "author": "TerraFusion Developer",
  "license": "Proprietary"
}
EOF

# Generate package.json for frontend
if [[ "$WITH_FRONTEND" == "true" ]]; then
  cat > "$MODULE_DIR/package.json" << EOF
{
  "name": "$MODULE_NAME",
  "version": "1.0.0",
  "description": "TerraFusion $MODULE_TYPE module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "vite dev --port 3001",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext ts,tsx",
    "lint:fix": "eslint src --ext ts,tsx --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@mui/material": "^5.18.0",
    "@mui/icons-material": "^5.18.0",
    "axios": "^1.6.2",
    "react-router-dom": "^6.20.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.2",
    "vite": "^5.0.8",
    "vitest": "^1.0.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0"
  }
}
EOF

# Generate Tauri configuration
cat > "$MODULE_DIR/src-tauri/tauri.conf.json" << EOF
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3001",
    "distDir": "../dist"
  },
  "package": {
    "productName": "$MODULE_NAME",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "dialog": {
        "all": false,
        "open": true,
        "save": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Government",
      "copyright": "",
      "deb": {
        "depends": []
      },
      "externalBin": [],
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "com.terrafusion.$MODULE_NAME",
      "longDescription": "",
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      },
      "resources": [],
      "shortDescription": "",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": null
    },
    "updater": {
      "active": false
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "$MODULE_NAME",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
EOF

fi

# Generate backend service template
if [[ "$WITH_DATABASE" == "true" ]]; then
  cat > "$MODULE_DIR/backend/${PASCAL_NAME}Service.cs" << EOF
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AutoMapper;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Models;

namespace $NAMESPACE.Services;

public interface I${PASCAL_NAME}Service
{
    Task<${PASCAL_NAME}Dto> GetByIdAsync(Guid id);
    Task<PagedResult<${PASCAL_NAME}Dto>> GetAllAsync(int page, int pageSize);
    Task<${PASCAL_NAME}Dto> CreateAsync(Create${PASCAL_NAME}Dto createDto);
    Task<${PASCAL_NAME}Dto> UpdateAsync(Guid id, Update${PASCAL_NAME}Dto updateDto);
    Task<bool> DeleteAsync(Guid id);
    Task<HealthStatus> GetHealthAsync();
}

public class ${PASCAL_NAME}Service : I${PASCAL_NAME}Service
{
    private readonly ITerraFusionDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<${PASCAL_NAME}Service> _logger;

    public ${PASCAL_NAME}Service(
        ITerraFusionDbContext context,
        IMapper mapper,
        ILogger<${PASCAL_NAME}Service> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<${PASCAL_NAME}Dto> GetByIdAsync(Guid id)
    {
        var entity = await _context.${PASCAL_NAME}s
            .FirstOrDefaultAsync(e => e.Id == id);

        return entity != null ? _mapper.Map<${PASCAL_NAME}Dto>(entity) : null;
    }

    public async Task<PagedResult<${PASCAL_NAME}Dto>> GetAllAsync(int page, int pageSize)
    {
        var totalCount = await _context.${PASCAL_NAME}s.CountAsync();
        
        var entities = await _context.${PASCAL_NAME}s
            .OrderBy(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = _mapper.Map<List<${PASCAL_NAME}Dto>>(entities);

        return new PagedResult<${PASCAL_NAME}Dto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<${PASCAL_NAME}Dto> CreateAsync(Create${PASCAL_NAME}Dto createDto)
    {
        var entity = _mapper.Map<${PASCAL_NAME}>(createDto);
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        _context.${PASCAL_NAME}s.Add(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created {EntityType} with ID {EntityId}", 
            nameof($PASCAL_NAME), entity.Id);

        return _mapper.Map<${PASCAL_NAME}Dto>(entity);
    }

    public async Task<${PASCAL_NAME}Dto> UpdateAsync(Guid id, Update${PASCAL_NAME}Dto updateDto)
    {
        var entity = await _context.${PASCAL_NAME}s
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entity == null)
            return null;

        _mapper.Map(updateDto, entity);
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated {EntityType} with ID {EntityId}", 
            nameof($PASCAL_NAME), entity.Id);

        return _mapper.Map<${PASCAL_NAME}Dto>(entity);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _context.${PASCAL_NAME}s
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entity == null)
            return false;

        _context.${PASCAL_NAME}s.Remove(entity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted {EntityType} with ID {EntityId}", 
            nameof($PASCAL_NAME), entity.Id);

        return true;
    }

    public async Task<HealthStatus> GetHealthAsync()
    {
        try
        {
            // Check database connectivity
            await _context.Database.CanConnectAsync();
            
            // Check basic functionality
            var count = await _context.${PASCAL_NAME}s.CountAsync();
            
            return new HealthStatus
            {
                IsHealthy = true,
                Message = \$"Module healthy. {count} records available.",
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed for {ModuleName}", "$MODULE_NAME");
            
            return new HealthStatus
            {
                IsHealthy = false,
                Message = ex.Message,
                Timestamp = DateTime.UtcNow
            };
        }
    }
}
EOF

fi

# Generate React component template
if [[ "$WITH_FRONTEND" == "true" ]]; then
  cat > "$MODULE_DIR/src/components/${PASCAL_NAME}Dashboard.tsx" << EOF
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Dashboard, Add, Refresh } from '@mui/icons-material';
import { ${PASCAL_NAME}Service } from '../services/${PASCAL_NAME}Service';
import { ${PASCAL_NAME}Dto, PagedResult } from '../types/${PASCAL_NAME}Types';

interface ${PASCAL_NAME}DashboardProps {
  title?: string;
}

export const ${PASCAL_NAME}Dashboard: React.FC<${PASCAL_NAME}DashboardProps> = ({
  title = "${MODULE_NAME} Dashboard"
}) => {
  const [data, setData] = useState<PagedResult<${PASCAL_NAME}Dto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ${PASCAL_NAME}Service.getAll(1, 20);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Dashboard sx={{ mr: 2 }} />
              {title}
            </Typography>
            <div>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
                sx={{ mr: 2 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                color="primary"
              >
                Add New
              </Button>
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h5" component="div">
                {data?.totalCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Current Page
              </Typography>
              <Typography variant="h5" component="div">
                {data?.page || 1} of {Math.ceil((data?.totalCount || 0) / (data?.pageSize || 1))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Module Status
              </Typography>
              <Typography variant="h5" component="div" color="success.main">
                Operational
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Data grid would go here */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Module Data
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Implement your data grid component here using @mui/x-data-grid
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ${PASCAL_NAME}Dashboard;
EOF

fi

# Generate AI agent template
if [[ "$WITH_AI" == "true" ]]; then
  cat > "$MODULE_DIR/src/agents/${PASCAL_NAME}Agent.js" << EOF
import { AIAgentBase } from '../../../backend/ai-swarm/agents/AIAgentBase.js';

/**
 * Custom AI Agent for $MODULE_NAME module
 * Integrates with TerraFusion AI Swarm (1,008 agents)
 */
export class ${PASCAL_NAME}Agent extends AIAgentBase {
  constructor(config = {}) {
    super({
      id: \`${MODULE_NAME.toUpperCase()}_AGENT_\${Date.now()}\`,
      type: 'CUSTOM_MODULE_AGENT',
      capabilities: [
        'data-processing',
        'analysis',
        'reporting'
      ],
      ...config
    });
    
    this.moduleName = '$MODULE_NAME';
    this.agentVersion = '1.0.0';
  }

  /**
   * Execute module-specific AI task
   */
  async executeTask(task) {
    this.updateStatus('PROCESSING');
    
    try {
      const startTime = performance.now();
      
      // Custom AI logic implementation
      const result = await this.processTask(task);
      
      const duration = performance.now() - startTime;
      
      // Report metrics to Supreme Commander
      await this.reportMetrics({
        taskType: task.type,
        duration,
        success: true,
        result: result.summary
      });
      
      this.updateStatus('ACTIVE');
      return result;
      
    } catch (error) {
      await this.reportError(error, task);
      this.updateStatus('ERROR');
      throw error;
    }
  }

  /**
   * Custom task processing logic
   */
  async processTask(task) {
    switch (task.type) {
      case 'DATA_ANALYSIS':
        return await this.analyzeData(task.data);
      
      case 'PROPERTY_VALUATION':
        return await this.valuateProperty(task.property);
      
      case 'COMPLIANCE_CHECK':
        return await this.checkCompliance(task.parameters);
      
      default:
        throw new Error(\`Unknown task type: \${task.type}\`);
    }
  }

  /**
   * Analyze data using AI capabilities
   */
  async analyzeData(data) {
    // Implement AI data analysis logic
    return {
      summary: 'Data analysis completed',
      insights: [],
      recommendations: [],
      confidence: 0.95
    };
  }

  /**
   * Perform property valuation using AI models
   */
  async valuateProperty(property) {
    // Implement AI property valuation logic
    return {
      estimatedValue: property.assessedValue * 1.1,
      confidence: 0.87,
      factors: ['location', 'size', 'age', 'market_trends'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check government compliance requirements
   */
  async checkCompliance(parameters) {
    // Implement compliance checking logic
    return {
      compliant: true,
      checks: ['FISMA', 'NIST', 'Section508'],
      issues: [],
      recommendations: []
    };
  }

  /**
   * Get agent health status
   */
  async getHealth() {
    return {
      agentId: this.id,
      status: this.status,
      uptime: this.getUptime(),
      tasksCompleted: this.metrics.tasksCompleted,
      errorRate: this.metrics.errorRate,
      lastActivity: this.lastActivity
    };
  }
}

// Export for swarm registration
export default ${PASCAL_NAME}Agent;
EOF

fi

# Generate test templates
if [[ "$WITH_TESTS" == "true" ]]; then
  cat > "$MODULE_DIR/tests/unit/${PASCAL_NAME}Service.test.ts" << EOF
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ${PASCAL_NAME}Service } from '../../backend/${PASCAL_NAME}Service';

// Mock dependencies
const mockContext = {
  ${PASCAL_NAME}s: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  }
};

const mockMapper = {
  map: vi.fn()
};

const mockLogger = {
  logInformation: vi.fn(),
  logError: vi.fn()
};

describe('${PASCAL_NAME}Service', () => {
  let service: ${PASCAL_NAME}Service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ${PASCAL_NAME}Service(
      mockContext as any,
      mockMapper as any,
      mockLogger as any
    );
  });

  describe('getByIdAsync', () => {
    it('should return entity when found', async () => {
      // Arrange
      const entityId = 'test-id';
      const mockEntity = { id: entityId, name: 'Test Entity' };
      const mockDto = { id: entityId, name: 'Test Entity' };
      
      mockContext.${PASCAL_NAME}s.findUnique.mockResolvedValue(mockEntity);
      mockMapper.map.mockReturnValue(mockDto);

      // Act
      const result = await service.getByIdAsync(entityId);

      // Assert
      expect(result).toEqual(mockDto);
      expect(mockContext.${PASCAL_NAME}s.findUnique).toHaveBeenCalledWith({
        where: { id: entityId }
      });
      expect(mockMapper.map).toHaveBeenCalledWith(mockEntity);
    });

    it('should return null when entity not found', async () => {
      // Arrange
      mockContext.${PASCAL_NAME}s.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getByIdAsync('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createAsync', () => {
    it('should create and return new entity', async () => {
      // Arrange
      const createDto = { name: 'New Entity' };
      const mockEntity = { id: 'new-id', name: 'New Entity', createdAt: new Date() };
      const mockDto = { id: 'new-id', name: 'New Entity' };
      
      mockMapper.map.mockReturnValue(mockEntity);
      mockContext.${PASCAL_NAME}s.create.mockResolvedValue(mockEntity);
      mockMapper.map.mockReturnValue(mockDto);

      // Act
      const result = await service.createAsync(createDto);

      // Assert
      expect(result).toEqual(mockDto);
      expect(mockContext.${PASCAL_NAME}s.create).toHaveBeenCalled();
      expect(mockLogger.logInformation).toHaveBeenCalled();
    });
  });

  describe('getHealthAsync', () => {
    it('should return healthy status when database accessible', async () => {
      // Arrange
      mockContext.${PASCAL_NAME}s.count.mockResolvedValue(42);

      // Act
      const result = await service.getHealthAsync();

      // Assert
      expect(result.isHealthy).toBe(true);
      expect(result.message).toContain('42');
    });

    it('should return unhealthy status on database error', async () => {
      // Arrange
      mockContext.${PASCAL_NAME}s.count.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.getHealthAsync();

      // Assert
      expect(result.isHealthy).toBe(false);
      expect(result.message).toContain('Database error');
      expect(mockLogger.logError).toHaveBeenCalled();
    });
  });
});
EOF

fi

# Generate Dockerfile
cat > "$MODULE_DIR/Dockerfile" << EOF
# Multi-stage Dockerfile for $MODULE_NAME module
FROM node:18-alpine AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json vite.config.ts ./

RUN npm run build

# .NET backend stage
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS backend-build

WORKDIR /src
COPY backend/ ./
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine

RUN addgroup -g 1000 terrafusion && \\
    adduser -D -s /bin/sh -u 1000 -G terrafusion terrafusion

WORKDIR /app
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/dist ./wwwroot

USER terrafusion

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["dotnet", "${PASCAL_NAME}.dll"]
EOF

# Generate deployment script
cat > "$MODULE_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# TerraFusion Module Deployment Script
set -euo pipefail

MODULE_NAME="$MODULE_NAME"
ENVIRONMENT="${ENVIRONMENT:-development}"
NAMESPACE="terrafusion-modules"

echo "🚀 Deploying $MODULE_NAME to $ENVIRONMENT environment"

# Build container
echo "📦 Building container..."
docker build -t "terrafusion/$MODULE_NAME:latest" .

# Deploy with Helm
echo "⚙️  Deploying with Helm..."
helm upgrade --install "$MODULE_NAME" \
  ../../../infrastructure/helm/terrafusion-module \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --set image.repository="terrafusion/$MODULE_NAME" \
  --set image.tag="latest" \
  --set module.name="$MODULE_NAME" \
  --set module.type="$MODULE_TYPE" \
  --set environment="$ENVIRONMENT"

# Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/"$MODULE_NAME" -n "$NAMESPACE" --timeout=300s

# Verify health
echo "🏥 Checking module health..."
kubectl get pods -n "$NAMESPACE" -l app="$MODULE_NAME"

echo "✅ $MODULE_NAME deployed successfully!"
EOF

chmod +x "$MODULE_DIR/deploy.sh"

# Generate README
cat > "$MODULE_DIR/README.md" << EOF
# $MODULE_NAME

$(echo "$MODULE_NAME" | sed 's/-/ /g' | sed 's/\b\w/\U&/g') - TerraFusion OS Module

## Overview

This is a $MODULE_TYPE module for TerraFusion OS 1.0, providing custom functionality for government AI operations.

## Features

- ✅ TerraFusion OS integration
- ✅ Government-grade security$(if [[ "$WITH_AI" == "true" ]]; then echo '
- ✅ AI swarm integration'; fi)$(if [[ "$WITH_DATABASE" == "true" ]]; then echo '
- ✅ Database persistence'; fi)$(if [[ "$WITH_FRONTEND" == "true" ]]; then echo '
- ✅ React 18 frontend'; fi)
- ✅ Comprehensive testing
- ✅ Production deployment ready

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Deploy to staging
./deploy.sh
\`\`\`

## Architecture

- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: .NET 8 + Entity Framework Core$(if [[ "$WITH_AI" == "true" ]]; then echo '
- **AI Integration**: TerraFusion AI Swarm (1,008 agents)'; fi)
- **Database**: PostgreSQL with audit logging
- **Security**: FISMA compliant with RBAC
- **Deployment**: Kubernetes + Helm

## Development

See [TerraFusion SDK Documentation](../../../SDK/README.md) for detailed development guidelines.

## License

Proprietary - TerraFusion Government License
EOF

echo ""
echo "✅ Module '$MODULE_NAME' created successfully!"
echo ""
echo "📁 Module structure:"
find "$MODULE_DIR" -type f | head -10
echo "   ... and more"
echo ""
echo "🚀 Next steps:"
echo "   1. cd $MODULE_DIR"
echo "   2. npm install"
echo "   3. npm run dev"
echo ""
echo "📖 Documentation: $MODULE_DIR/README.md"
echo "🔧 Configuration: $MODULE_DIR/module.manifest.json"