# Developer Getting Started Guide

Welcome to Terrafusion development! This guide will get you up and running with the Terrafusion platform in minutes.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Rust** 1.70+ (for Tauri desktop development)
- **Docker** & Docker Compose (for local services)
- **Git** for version control
- **VS Code** (recommended) with Terrafusion extensions

### 1. Clone the Repository
```bash
git clone https://github.com/terrafusion/terrafusion-master-workspace.git
cd terrafusion-master-workspace
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Setup Rust toolchain (for desktop development)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add x86_64-unknown-linux-gnu
```

### 3. Start Development Environment
```bash
# Start infrastructure services
docker-compose up -d postgres redis

# Start development server
npm run dev

# In another terminal, start desktop app (optional)
npm run tauri dev
```

### 4. Verify Installation
```bash
# Run health checks
npm run health-check

# Run basic tests
npm test

# Open development dashboard
open http://localhost:3000
```

## 🏗️ Project Structure

```
TerraFusion_Master_Workspace/
├── 📱 Frontend/                    # React frontend applications
│   ├── TerraFusion_Remix_Clean/   # Main web application
│   └── enterprise_logger.ts       # Logging utilities
├── 🦀 src-tauri/                  # Rust desktop application
│   ├── src/                       # Rust source code
│   └── tauri.conf.json           # Desktop app configuration
├── 🧩 apps/                       # Microservice applications
│   ├── terrainsight/             # Property intelligence service
│   ├── costforge/                # Valuation engine
│   ├── propertyworkbench/        # Property management tools
│   └── TerraFusionDashboard/     # Analytics dashboard
├── 🔌 Plugins/                    # Plugin ecosystem
│   ├── office365-toolkit/        # Office 365 integration
│   └── document-processor/       # Document processing
├── 📊 monitoring/                 # Monitoring and observability
├── 🚀 deployment/                 # Deployment configurations
├── 📚 docs/                       # Documentation
└── 🧪 tests/                      # Test suites
```

## 🛠️ Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-valuation-model

# Start development server with hot reload
npm run dev:watch

# Run tests in watch mode
npm run test:watch

# Build and test
npm run build:test
```

### 2. Code Quality
```bash
# Run linting
npm run lint

# Fix code style issues
npm run lint:fix

# Run type checking
npm run type-check

# Format code
npm run format
```

### 3. Testing
```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📊 Core Development Concepts

### 1. Property Intelligence Architecture
```typescript
// Property data structure
interface Property {
  id: string;
  address: Address;
  characteristics: PropertyCharacteristics;
  valuation: ValuationData;
  market: MarketData;
  location: GeoLocation;
}

// Valuation service
class ValuationService {
  async calculateValue(property: Property): Promise<Valuation> {
    // ML-powered valuation logic
  }
}
```

### 2. Real-time Data Flow
```typescript
// WebSocket connection for real-time updates
const socket = new TerraFusionSocket();

socket.subscribe('property-updates', (data) => {
  updatePropertyValuation(data);
});

socket.subscribe('market-alerts', (alert) => {
  showMarketAlert(alert);
});
```

### 3. Plugin Architecture
```typescript
// Plugin interface
interface TerraFusionPlugin {
  name: string;
  version: string;
  initialize(): Promise<void>;
  onPropertyUpdate(property: Property): void;
  onMarketUpdate(market: MarketData): void;
}

// Register plugin
PluginManager.register(new Office365Plugin());
```

## 🔧 Development Tools

### VS Code Extensions
Install the Terrafusion development pack:
```bash
code --install-extension terrafusion.terrafusion-dev-pack
```

Includes:
- Terrafusion IntelliSense
- Property data debugger
- API testing tools
- Code snippets
- Theme and icons

### CLI Tools
```bash
# Install Terrafusion CLI
npm install -g @terrafusion/cli

# Create new component
tf create component PropertyCard

# Generate API client
tf generate api-client

# Run development checks
tf dev-check

# Deploy to staging
tf deploy staging
```

### Development Dashboard
Access the development dashboard at `http://localhost:3000/dev`:
- 📊 Real-time metrics
- 🔍 API explorer
- 🧪 Test runner
- 📝 Documentation browser
- 🔧 Configuration editor

## 🌐 API Development

### 1. Making API Calls
```typescript
import { TerraFusionClient } from '@terrafusion/sdk';

const client = new TerraFusionClient({
  apiKey: process.env.TERRAFUSION_API_KEY,
  environment: 'development'
});

// Get property data
const property = await client.properties.get('prop_123');

// Create valuation
const valuation = await client.valuations.create({
  propertyId: 'prop_123',
  type: 'comprehensive'
});
```

### 2. Error Handling
```typescript
import { TerraFusionError, isRateLimitError } from '@terrafusion/sdk';

try {
  const result = await client.properties.search(criteria);
} catch (error) {
  if (error instanceof TerraFusionError) {
    if (isRateLimitError(error)) {
      // Handle rate limiting
      await delay(error.retryAfter * 1000);
    }
    console.error('API Error:', error.code, error.message);
  }
}
```

### 3. Caching Strategies
```typescript
import { CacheManager } from '@terrafusion/cache';

const cache = new CacheManager({
  redis: process.env.REDIS_URL,
  ttl: {
    properties: 3600,    // 1 hour
    valuations: 1800,    // 30 minutes
    market: 300          // 5 minutes
  }
});

// Cached API call
const property = await cache.get(`property:${id}`, async () => {
  return client.properties.get(id);
});
```

## 🧪 Testing Guidelines

### 1. Unit Tests
```typescript
// tests/services/valuation.test.ts
import { ValuationService } from '../src/services';

describe('ValuationService', () => {
  it('should calculate property value accurately', async () => {
    const service = new ValuationService();
    const property = createMockProperty();
    
    const valuation = await service.calculateValue(property);
    
    expect(valuation.estimate).toBeGreaterThan(0);
    expect(valuation.confidence).toBeBetween(0.7, 1.0);
  });
});
```

### 2. Integration Tests
```typescript
// tests/integration/api.test.ts
describe('Properties API Integration', () => {
  it('should retrieve property data from API', async () => {
    const response = await request(app)
      .get('/api/v1/properties/test_property_id')
      .expect(200);
    
    expect(response.body.data.property).toBeDefined();
    expect(response.body.data.property.id).toBe('test_property_id');
  });
});
```

### 3. E2E Tests
```typescript
// tests/e2e/property-search.test.ts
import { test, expect } from '@playwright/test';

test('property search workflow', async ({ page }) => {
  await page.goto('/');
  
  // Enter search criteria
  await page.fill('[data-testid=location-input]', 'Seattle, WA');
  await page.selectOption('[data-testid=property-type]', 'residential');
  await page.click('[data-testid=search-button]');
  
  // Verify results
  await expect(page.locator('[data-testid=search-results]')).toBeVisible();
  await expect(page.locator('[data-testid=property-card]')).toHaveCount.greaterThan(0);
});
```

## 🔍 Debugging

### 1. Development Server Debugging
```typescript
// Enable debug mode
process.env.DEBUG = 'terrafusion:*';

// Use debugger
import debug from 'debug';
const log = debug('terrafusion:valuation');

log('Processing valuation for property %s', propertyId);
```

### 2. API Request Debugging
```bash
# Enable request logging
export TERRAFUSION_DEBUG_API=true

# Verbose HTTP logging
export TERRAFUSION_LOG_LEVEL=debug

# Run with debugging
npm run dev:debug
```

### 3. Database Debugging
```sql
-- Enable query logging in PostgreSQL
SET log_statement = 'all';
SET log_duration = on;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 📈 Performance Optimization

### 1. Code Splitting
```typescript
// Lazy load components
const PropertyDetails = lazy(() => import('./PropertyDetails'));
const MarketAnalysis = lazy(() => import('./MarketAnalysis'));

// Route-based splitting
const router = createBrowserRouter([
  {
    path: "/properties",
    lazy: () => import("./routes/properties"),
  },
  {
    path: "/analytics",
    lazy: () => import("./routes/analytics"),
  },
]);
```

### 2. Caching
```typescript
// React Query for API caching
const { data: property } = useQuery({
  queryKey: ['property', propertyId],
  queryFn: () => client.properties.get(propertyId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Service Worker caching
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/properties/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

### 3. Bundle Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'd3'],
          maps: ['mapbox-gl', 'turf']
        }
      }
    }
  }
});
```

## 🚀 Deployment

### Development Deployment
```bash
# Build for development
npm run build:dev

# Deploy to dev environment
npm run deploy:dev

# Run smoke tests
npm run test:smoke
```

### Production Deployment
```bash
# Build optimized production bundle
npm run build:prod

# Run full test suite
npm run test:all

# Deploy to production
npm run deploy:prod
```

## 📚 Additional Resources

- [API Reference](../api/rest-api.md)
- [Component Library](./components.md)
- [Testing Guide](./testing.md)
- [Performance Guide](./performance.md)
- [Deployment Guide](../deployment/overview.md)
- [Contributing Guidelines](./contributing.md)

## 🆘 Getting Help

- **Documentation**: Browse our comprehensive docs
- **Discord**: Join our developer community
- **GitHub Issues**: Report bugs and request features
- **Stack Overflow**: Use tag `terrafusion`
- **Email**: developers@terrafusion.ai

---

**Next Steps:**
1. Complete the [Environment Setup](./environment-setup.md)
2. Follow the [First Application Tutorial](./tutorials/first-app.md)
3. Explore the [Component Library](./components.md)
4. Read the [API Documentation](../api/overview.md)