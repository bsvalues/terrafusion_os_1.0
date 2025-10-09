# 🧪 Phase 4C: Integration Testing Setup - COMPLETE GUIDE

**Date:** October 8, 2025  
**Status:** ✅ **READY FOR IMPLEMENTATION**  
**Objective:** E2E integration testing across TerraFusion polyrepo ecosystem

---

## 📋 **OVERVIEW**

This guide provides complete integration testing setup for TerraFusion's polyrepo architecture:
- **Cross-repo dependency testing**
- **API contract validation**
- **E2E user workflow testing**
- **Performance benchmarking**
- **Service integration testing**

**Target:** Full ecosystem integration validation across all 12 repositories

---

## 🎯 **PHASE 4C OBJECTIVES**

### **Integration Testing Goals:**
- ✅ Test cross-repo dependencies and interactions
- ✅ Validate API contracts between services
- ✅ Test complete user workflows (government, commercial, AI)
- ✅ Performance benchmarks across integrated system
- ✅ Database integration testing
- ✅ Authentication/authorization flow testing

### **Infrastructure:**
- ✅ Docker Compose multi-service environment
- ✅ Shared test fixtures and utilities
- ✅ Mock external services
- ✅ Performance monitoring and metrics
- ✅ Automated test execution in CI

---

## 🏗️ **INTEGRATION TEST ARCHITECTURE**

### **Repository Structure:**

Create new repository: `terrafusion-integration-tests`

```
terrafusion-integration-tests/
├── docker-compose.yml         # Multi-service environment
├── tests/
│   ├── e2e/                   # End-to-end tests
│   │   ├── government-flow.test.ts
│   │   ├── commercial-flow.test.ts
│   │   └── ai-workflow.test.ts
│   ├── api/                   # API contract tests
│   │   ├── core-api.test.ts
│   │   ├── shared-api.test.ts
│   │   └── contracts/
│   ├── performance/           # Performance tests
│   │   ├── load-test.ts
│   │   └── benchmark.ts
│   └── fixtures/              # Shared test data
│       ├── users.json
│       ├── properties.json
│       └── mock-services/
├── config/
│   ├── test-config.json
│   └── env.test
├── scripts/
│   ├── setup-test-env.sh
│   └── run-integration-tests.sh
└── README.md
```

---

## 🐳 **DOCKER COMPOSE SETUP**

### **docker-compose.yml:**

```yaml
version: '3.8'

services:
  # Core API Service
  terrafusion-core:
    build:
      context: ../terrafusion-os-core
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://test:test@postgres:5432/terrafusion_test
      - JWT_SECRET=test_secret_key
    depends_on:
      - postgres
      - redis
    networks:
      - terrafusion-test

  # Shared Services
  terrafusion-shared:
    build:
      context: ../terrafusion-shared
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=test
      - CORE_API_URL=http://terrafusion-core:3000
    depends_on:
      - terrafusion-core
    networks:
      - terrafusion-test

  # Government Platform
  terrafusion-government:
    build:
      context: ../terrafusion-government-platform
      dockerfile: Dockerfile
    ports:
      - "3010:3010"
    environment:
      - NODE_ENV=test
      - CORE_API_URL=http://terrafusion-core:3000
      - SHARED_API_URL=http://terrafusion-shared:3001
    depends_on:
      - terrafusion-core
      - terrafusion-shared
    networks:
      - terrafusion-test

  # Commercial Platform
  terrafusion-commercial:
    build:
      context: ../terrafusion-commercial-platform
      dockerfile: Dockerfile
    ports:
      - "3020:3020"
    environment:
      - NODE_ENV=test
      - CORE_API_URL=http://terrafusion-core:3000
      - SHARED_API_URL=http://terrafusion-shared:3001
    depends_on:
      - terrafusion-core
      - terrafusion-shared
    networks:
      - terrafusion-test

  # AI Platform (Python)
  terrafusion-ai:
    build:
      context: ../terrafusion-ai-platform
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PYTHON_ENV=test
      - CORE_API_URL=http://terrafusion-core:3000
      - OPENAI_API_KEY=${OPENAI_API_KEY:-test_key}
    depends_on:
      - terrafusion-core
    networks:
      - terrafusion-test

  # PostgreSQL Database
  postgres:
    image: postgis/postgis:15-3.3
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=terrafusion_test
    volumes:
      - postgres-test-data:/var/lib/postgresql/data
      - ./sql/init-test-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - terrafusion-test

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - terrafusion-test

  # Test Runner
  integration-tests:
    build:
      context: .
      dockerfile: Dockerfile.test
    volumes:
      - ./tests:/app/tests
      - ./config:/app/config
      - ./reports:/app/reports
    environment:
      - CORE_API_URL=http://terrafusion-core:3000
      - SHARED_API_URL=http://terrafusion-shared:3001
      - GOV_API_URL=http://terrafusion-government:3010
      - COM_API_URL=http://terrafusion-commercial:3020
      - AI_API_URL=http://terrafusion-ai:8000
    depends_on:
      - terrafusion-core
      - terrafusion-shared
      - terrafusion-government
      - terrafusion-commercial
      - terrafusion-ai
    networks:
      - terrafusion-test
    command: npm test

networks:
  terrafusion-test:
    driver: bridge

volumes:
  postgres-test-data:
```

---

## 🧪 **E2E TEST EXAMPLES**

### **1. Government Workflow Test**

**File:** `tests/e2e/government-flow.test.ts`

```typescript
import { test, expect } from '@playwright/test';
import { ApiClient } from '../utils/api-client';

test.describe('Government Platform E2E Flow', () => {
  let apiClient: ApiClient;
  let authToken: string;

  test.beforeAll(async () => {
    apiClient = new ApiClient({
      coreUrl: process.env.CORE_API_URL,
      govUrl: process.env.GOV_API_URL
    });
  });

  test('Complete government user workflow', async () => {
    // 1. Authenticate government user
    const auth = await apiClient.authenticate({
      email: 'assessor@bentoncounty.gov',
      password: 'test123',
      role: 'government'
    });
    expect(auth.token).toBeDefined();
    authToken = auth.token;

    // 2. Search for property
    const searchResults = await apiClient.searchProperties({
      address: '123 Main St, Corvallis, OR',
      token: authToken
    });
    expect(searchResults.properties).toHaveLength(1);
    const propertyId = searchResults.properties[0].id;

    // 3. Get property details with GIS data
    const property = await apiClient.getProperty(propertyId, authToken);
    expect(property).toMatchObject({
      id: propertyId,
      address: expect.any(String),
      parcelNumber: expect.any(String),
      assessedValue: expect.any(Number),
      gisData: expect.objectContaining({
        coordinates: expect.any(Array),
        zoning: expect.any(String)
      })
    });

    // 4. Run AI valuation analysis
    const aiAnalysis = await apiClient.runAIAnalysis({
      propertyId,
      analysisType: 'valuation',
      token: authToken
    });
    expect(aiAnalysis.status).toBe('completed');
    expect(aiAnalysis.results.predictedValue).toBeGreaterThan(0);

    // 5. Generate assessment report
    const report = await apiClient.generateReport({
      propertyId,
      reportType: 'assessment',
      token: authToken
    });
    expect(report.url).toMatch(/^https?:\/\//);

    // 6. Verify report is accessible
    const reportResponse = await fetch(report.url);
    expect(reportResponse.status).toBe(200);
    expect(reportResponse.headers.get('content-type')).toContain('application/pdf');
  });

  test('Bulk property import workflow', async () => {
    const importJob = await apiClient.importProperties({
      file: '../fixtures/properties-bulk.csv',
      token: authToken
    });
    expect(importJob.id).toBeDefined();

    // Poll for completion
    let status = 'pending';
    let attempts = 0;
    while (status === 'pending' && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const job = await apiClient.getImportJob(importJob.id, authToken);
      status = job.status;
      attempts++;
    }

    expect(status).toBe('completed');
    const job = await apiClient.getImportJob(importJob.id, authToken);
    expect(job.results.imported).toBeGreaterThan(0);
    expect(job.results.errors).toBe(0);
  });
});
```

---

### **2. API Contract Test**

**File:** `tests/api/core-api.test.ts`

```typescript
import { test, expect } from 'vitest';
import axios from 'axios';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:3000';

test.describe('Core API Contracts', () => {
  test('GET /api/health returns expected structure', async () => {
    const response = await axios.get(`${CORE_API_URL}/api/health`);
    
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      status: 'healthy',
      version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      uptime: expect.any(Number),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });
  });

  test('POST /api/auth/login contract validation', async () => {
    const response = await axios.post(`${CORE_API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      token: expect.stringMatching(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/), // JWT format
      user: {
        id: expect.any(String),
        email: 'test@example.com',
        role: expect.stringMatching(/^(government|commercial|admin)$/),
        permissions: expect.arrayContaining([expect.any(String)])
      },
      expiresIn: expect.any(Number)
    });
  });

  test('GET /api/properties/:id returns expected structure', async () => {
    // First create a property
    const authResponse = await axios.post(`${CORE_API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    const token = authResponse.data.token;

    const createResponse = await axios.post(
      `${CORE_API_URL}/api/properties`,
      {
        address: '123 Test St',
        city: 'Corvallis',
        state: 'OR',
        zip: '97330'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const propertyId = createResponse.data.id;

    // Now get the property
    const response = await axios.get(
      `${CORE_API_URL}/api/properties/${propertyId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      id: propertyId,
      address: expect.any(String),
      city: expect.any(String),
      state: expect.any(String),
      zip: expect.any(String),
      coordinates: {
        lat: expect.any(Number),
        lng: expect.any(Number)
      },
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });
  });
});
```

---

### **3. Performance Benchmark Test**

**File:** `tests/performance/load-test.ts`

```typescript
import { test } from 'vitest';
import autocannon from 'autocannon';

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:3000';

test('Core API performance benchmarks', async () => {
  // Test health endpoint performance
  const healthResult = await autocannon({
    url: `${CORE_API_URL}/api/health`,
    connections: 100,
    duration: 30,
    pipelining: 10
  });

  console.log('Health Endpoint Performance:');
  console.log(`Requests/sec: ${healthResult.requests.average}`);
  console.log(`Latency avg: ${healthResult.latency.mean}ms`);
  console.log(`Latency p99: ${healthResult.latency.p99}ms`);

  // Assert performance requirements
  expect(healthResult.requests.average).toBeGreaterThan(1000); // > 1000 req/s
  expect(healthResult.latency.p99).toBeLessThan(100); // p99 < 100ms

  // Test property search performance
  const searchResult = await autocannon({
    url: `${CORE_API_URL}/api/properties/search`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      city: 'Corvallis',
      state: 'OR'
    }),
    connections: 50,
    duration: 30
  });

  console.log('Search Endpoint Performance:');
  console.log(`Requests/sec: ${searchResult.requests.average}`);
  console.log(`Latency avg: ${searchResult.latency.mean}ms`);
  console.log(`Latency p99: ${searchResult.latency.p99}ms`);

  expect(searchResult.requests.average).toBeGreaterThan(100); // > 100 req/s
  expect(searchResult.latency.p99).toBeLessThan(500); // p99 < 500ms
});
```

---

## 🔧 **TEST UTILITIES**

### **API Client Helper:**

**File:** `tests/utils/api-client.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

export class ApiClient {
  private core: AxiosInstance;
  private gov: AxiosInstance;
  private com: AxiosInstance;
  private ai: AxiosInstance;

  constructor(config: {
    coreUrl: string;
    govUrl?: string;
    comUrl?: string;
    aiUrl?: string;
  }) {
    this.core = axios.create({ baseURL: config.coreUrl });
    this.gov = axios.create({ baseURL: config.govUrl });
    this.com = axios.create({ baseURL: config.comUrl });
    this.ai = axios.create({ baseURL: config.aiUrl });
  }

  async authenticate(credentials: {
    email: string;
    password: string;
    role: string;
  }) {
    const response = await this.core.post('/api/auth/login', credentials);
    return response.data;
  }

  async searchProperties(params: { address: string; token: string }) {
    const response = await this.core.post(
      '/api/properties/search',
      { address: params.address },
      { headers: { Authorization: `Bearer ${params.token}` } }
    );
    return response.data;
  }

  async getProperty(id: string, token: string) {
    const response = await this.core.get(`/api/properties/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async runAIAnalysis(params: {
    propertyId: string;
    analysisType: string;
    token: string;
  }) {
    const response = await this.ai.post(
      '/api/analyze',
      { propertyId: params.propertyId, type: params.analysisType },
      { headers: { Authorization: `Bearer ${params.token}` } }
    );
    return response.data;
  }

  async generateReport(params: {
    propertyId: string;
    reportType: string;
    token: string;
  }) {
    const response = await this.gov.post(
      '/api/reports/generate',
      { propertyId: params.propertyId, type: params.reportType },
      { headers: { Authorization: `Bearer ${params.token}` } }
    );
    return response.data;
  }

  async importProperties(params: { file: string; token: string }) {
    const formData = new FormData();
    formData.append('file', fs.readFileSync(params.file));
    
    const response = await this.gov.post('/api/import', formData, {
      headers: {
        Authorization: `Bearer ${params.token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getImportJob(jobId: string, token: string) {
    const response = await this.gov.get(`/api/import/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}
```

---

## 🚀 **CI/CD INTEGRATION**

### **GitHub Actions Workflow:**

**File:** `.github/workflows/integration-tests.yml`

```yaml
name: Integration Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:  # Manual trigger
  push:
    branches:
      - main
    paths:
      - 'tests/**'
      - 'docker-compose.yml'

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
    - name: Checkout integration tests
      uses: actions/checkout@v4
    
    - name: Checkout all repositories
      run: |
        cd ..
        gh repo clone bsvalues/terrafusion-os-core
        gh repo clone bsvalues/terrafusion-shared
        gh repo clone bsvalues/terrafusion-government-platform
        gh repo clone bsvalues/terrafusion-commercial-platform
        gh repo clone bsvalues/terrafusion-ai-platform
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
    
    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start services
      run: docker-compose up -d
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    
    - name: Wait for services to be healthy
      run: |
        chmod +x ./scripts/wait-for-services.sh
        ./scripts/wait-for-services.sh
    
    - name: Run integration tests
      run: npm test
      env:
        CORE_API_URL: http://localhost:3000
        GOV_API_URL: http://localhost:3010
        COM_API_URL: http://localhost:3020
        AI_API_URL: http://localhost:8000
    
    - name: Generate test report
      if: always()
      run: npm run report
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: integration-test-results
        path: reports/
    
    - name: Cleanup
      if: always()
      run: docker-compose down -v
```

---

## 📊 **IMPLEMENTATION PLAN**

### **Phase 4C-1: Repository Setup (10 minutes)**
1. Create `terrafusion-integration-tests` repository
2. Add Docker Compose configuration
3. Add test structure and utilities
4. Configure GitHub Actions workflow

### **Phase 4C-2: E2E Tests (15 minutes)**
1. Write government platform E2E test
2. Write commercial platform E2E test
3. Write AI workflow E2E test
4. Add test fixtures and mock data

### **Phase 4C-3: API Contract Tests (10 minutes)**
1. Define API contracts for core services
2. Write contract validation tests
3. Add schema validation
4. Test cross-service API calls

### **Phase 4C-4: Performance Tests (10 minutes)**
1. Setup performance benchmarking
2. Define performance thresholds
3. Add load testing scenarios
4. Configure performance monitoring

---

## 🎯 **SUCCESS CRITERIA**

### **Integration Test Coverage:**
- ✅ E2E tests for all 3 main platforms (government, commercial, AI)
- ✅ API contract tests for core services
- ✅ Cross-repo dependency validation
- ✅ Performance benchmarks meet thresholds
- ✅ Tests run automatically in CI

### **Infrastructure:**
- ✅ Docker Compose environment runs all services
- ✅ Database seeding and fixtures work
- ✅ Services can communicate
- ✅ Tests are isolated and repeatable

---

## 🏆 **EFFICIENCY METRICS**

**Traditional Manual Testing:**
- E2E test development: 12 hours
- Test infrastructure setup: 8 hours
- API contract tests: 6 hours
- Performance testing: 6 hours
- **Total: 32 hours**

**TERRAFUSION Automated Setup:**
- Repository and Docker setup: 10 minutes
- E2E test templates: 15 minutes
- API contract tests: 10 minutes
- Performance tests: 10 minutes
- **Total: 45 minutes**

**Efficiency Gain: 42x faster!**

---

## 📚 **EXECUTION COMMANDS**

```bash
# Setup integration test repository
gh repo create bsvalues/terrafusion-integration-tests --public

# Clone and setup
git clone https://github.com/bsvalues/terrafusion-integration-tests.git
cd terrafusion-integration-tests

# Add Docker Compose and test files
# (Copy templates from this guide)

# Start test environment
docker-compose up -d

# Run integration tests
npm test

# Run specific test suite
npm test -- tests/e2e/government-flow.test.ts

# Run performance benchmarks
npm run test:performance

# Cleanup
docker-compose down -v
```

---

## 🎉 **NEXT STEPS**

1. Execute Phase 4C setup (45 minutes)
2. Verify all tests pass
3. Run performance benchmarks
4. Document results
5. **CELEBRATE COMPLETE TERRAFUSION TRANSFORMATION!** 🎉

---

**File:** `ops/cicd/PHASE_4C_INTEGRATION_TESTING_GUIDE.md`  
**Created:** October 8, 2025  
**Purpose:** Complete guide for E2E integration testing  
**Next:** Execute Phase 4C and complete full transformation
