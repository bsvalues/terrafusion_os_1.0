/**
 * TerraFusion Testing Template
 * Comprehensive testing utilities and examples for all TerraFusion components
 * 
 * Includes:
 * - Unit tests for services
 * - Integration tests for APIs
 * - Component tests for React components
 * - E2E tests for user workflows
 * - Mock data generators
 * - Testing utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import supertest from 'supertest';
import { DatabaseService } from './database-service-template';
import { AIAssessmentService } from './ai-assessment-service-template';
import { TerraFusionAPIClient } from './api-client-template';
import type { PropertyAssessment, CreateAssessmentRequest } from './api-client-template';

// =============================================
// MOCK DATA GENERATORS
// =============================================

export class MockDataGenerator {
  static randomId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static randomParcelNumber(): string {
    return `${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
  }

  static randomAddress(): string {
    const streetNumbers = [123, 456, 789, 1001, 2456];
    const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Cedar Ln', 'Elm Dr'];
    const cities = ['Springfield', 'Franklin', 'Madison', 'Georgetown', 'Riverside'];
    
    return `${streetNumbers[Math.floor(Math.random() * streetNumbers.length)]} ${streetNames[Math.floor(Math.random() * streetNames.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}, ST 12345`;
  }

  static createMockAssessment(overrides: Partial<PropertyAssessment> = {}): PropertyAssessment {
    const landValue = Math.floor(Math.random() * 200000) + 50000;
    const improvementValue = Math.floor(Math.random() * 300000) + 100000;
    
    return {
      id: this.randomId(),
      parcelNumber: this.randomParcelNumber(),
      address: this.randomAddress(),
      landValue,
      improvementValue,
      totalAssessedValue: landValue + improvementValue,
      marketValue: (landValue + improvementValue) * (0.9 + Math.random() * 0.2),
      confidence: 0.85 + Math.random() * 0.1,
      lastUpdated: new Date().toISOString(),
      aiAnalysis: {
        comparableProperties: [
          {
            address: this.randomAddress(),
            salePrice: 350000 + Math.random() * 100000,
            adjustedValue: 340000 + Math.random() * 120000,
            distance: Math.random() * 2
          }
        ],
        marketTrends: {
          trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
          changePercent: -5 + Math.random() * 10,
          timeframe: '12 months'
        },
        riskFactors: ['Market volatility', 'Neighborhood development']
      },
      ...overrides
    };
  }

  static createMockCreateRequest(overrides: Partial<CreateAssessmentRequest> = {}): CreateAssessmentRequest {
    return {
      parcelNumber: this.randomParcelNumber(),
      address: this.randomAddress(),
      propertyType: 'residential',
      lotSize: 0.15 + Math.random() * 0.5,
      buildingArea: 800 + Math.floor(Math.random() * 1500),
      yearBuilt: 1950 + Math.floor(Math.random() * 70),
      bedrooms: 2 + Math.floor(Math.random() * 4),
      bathrooms: 1 + Math.floor(Math.random() * 3),
      requestedBy: 'test-user-id',
      ...overrides
    };
  }

  static createMockAssessments(count: number): PropertyAssessment[] {
    return Array.from({ length: count }, () => this.createMockAssessment());
  }
}

// =============================================
// MSW SERVER SETUP FOR API MOCKING
// =============================================

const mockAssessments = MockDataGenerator.createMockAssessments(10);

export const handlers = [
  rest.post('/api/assessments', (req, res, ctx) => {
    const newAssessment = MockDataGenerator.createMockAssessment();
    mockAssessments.push(newAssessment);
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: newAssessment,
        timestamp: new Date().toISOString(),
        requestId: MockDataGenerator.randomId()
      })
    );
  }),

  rest.get('/api/assessments/:id', (req, res, ctx) => {
    const { id } = req.params;
    const assessment = mockAssessments.find(a => a.id === id);
    
    if (!assessment) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: 'Assessment not found',
          timestamp: new Date().toISOString(),
          requestId: MockDataGenerator.randomId()
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: assessment,
        timestamp: new Date().toISOString(),
        requestId: MockDataGenerator.randomId()
      })
    );
  }),

  rest.get('/api/assessments/search', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          assessments: mockAssessments.slice(startIndex, endIndex),
          total: mockAssessments.length,
          page,
          limit
        },
        timestamp: new Date().toISOString(),
        requestId: MockDataGenerator.randomId()
      })
    );
  }),

  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          status: 'healthy',
          services: {
            database: 'healthy',
            redis: 'healthy',
            ai: 'healthy'
          },
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        requestId: MockDataGenerator.randomId()
      })
    );
  })
];

export const server = setupServer(...handlers);

// =============================================
// TESTING UTILITIES
// =============================================

export class TestUtils {
  static async waitForValue<T>(
    getValue: () => T | Promise<T>,
    expectedValue: T,
    timeout = 5000
  ): Promise<T> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const value = await getValue();
      if (value === expectedValue) {
        return value;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Expected value ${expectedValue} not reached within ${timeout}ms`);
  }

  static createTestDatabase(): DatabaseService {
    // Return a mock database service for testing
    return {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      saveAssessment: vi.fn().mockResolvedValue(MockDataGenerator.createMockAssessment()),
      getAssessment: vi.fn().mockResolvedValue(MockDataGenerator.createMockAssessment()),
      updateAssessment: vi.fn().mockResolvedValue(MockDataGenerator.createMockAssessment()),
      deleteAssessment: vi.fn().mockResolvedValue(undefined),
      searchAssessments: vi.fn().mockResolvedValue({
        assessments: MockDataGenerator.createMockAssessments(5),
        total: 5,
        page: 1,
        limit: 10
      })
    } as any;
  }

  static createTestAIService(): AIAssessmentService {
    return {
      analyzeProperty: vi.fn().mockResolvedValue({
        estimatedValue: 350000,
        confidence: 0.87,
        comparableProperties: [],
        marketAnalysis: {
          trend: 'stable',
          changePercent: 2.1,
          confidenceLevel: 0.82
        },
        riskAssessment: {
          overall: 'low',
          factors: []
        }
      }),
      getComparableProperties: vi.fn().mockResolvedValue([]),
      getMarketTrends: vi.fn().mockResolvedValue({
        trend: 'stable',
        changePercent: 2.1,
        confidenceLevel: 0.82
      })
    } as any;
  }
}

// =============================================
// UNIT TESTS
// =============================================

describe('MockDataGenerator', () => {
  it('should generate valid assessment data', () => {
    const assessment = MockDataGenerator.createMockAssessment();
    
    expect(assessment.id).toMatch(/^id_\d+_[a-z0-9]+$/);
    expect(assessment.parcelNumber).toMatch(/^\d{6}$/);
    expect(assessment.address).toContain(',');
    expect(assessment.totalAssessedValue).toBe(assessment.landValue + assessment.improvementValue);
    expect(assessment.confidence).toBeGreaterThan(0.8);
    expect(assessment.aiAnalysis).toBeDefined();
  });

  it('should generate multiple unique assessments', () => {
    const assessments = MockDataGenerator.createMockAssessments(5);
    const ids = assessments.map(a => a.id);
    const uniqueIds = new Set(ids);
    
    expect(assessments).toHaveLength(5);
    expect(uniqueIds.size).toBe(5); // All IDs should be unique
  });

  it('should accept overrides', () => {
    const customAddress = '999 Test St, Test City, ST 99999';
    const assessment = MockDataGenerator.createMockAssessment({
      address: customAddress,
      landValue: 100000
    });
    
    expect(assessment.address).toBe(customAddress);
    expect(assessment.landValue).toBe(100000);
    expect(assessment.totalAssessedValue).toBeGreaterThanOrEqual(100000);
  });
});

describe('API Client Tests', () => {
  let apiClient: TerraFusionAPIClient;

  beforeEach(() => {
    server.listen();
    apiClient = new TerraFusionAPIClient({
      baseURL: 'http://localhost',
      timeout: 5000
    });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should create a new assessment', async () => {
    const createRequest = MockDataGenerator.createMockCreateRequest();
    const assessment = await apiClient.assessments.create(createRequest);
    
    expect(assessment).toBeDefined();
    expect(assessment.id).toBeDefined();
    expect(assessment.parcelNumber).toBeDefined();
    expect(assessment.totalAssessedValue).toBeGreaterThan(0);
  });

  it('should retrieve assessment by id', async () => {
    const mockId = mockAssessments[0].id;
    const assessment = await apiClient.assessments.getById(mockId);
    
    expect(assessment).toBeDefined();
    expect(assessment.id).toBe(mockId);
  });

  it('should handle 404 errors gracefully', async () => {
    await expect(apiClient.assessments.getById('non-existent-id')).rejects.toThrow('API Error 404');
  });

  it('should search assessments with pagination', async () => {
    const results = await apiClient.assessments.search({ page: 1, limit: 5 });
    
    expect(results.assessments).toBeDefined();
    expect(results.assessments.length).toBeLessThanOrEqual(5);
    expect(results.total).toBeGreaterThan(0);
    expect(results.page).toBe(1);
    expect(results.limit).toBe(5);
  });

  it('should check system health', async () => {
    const health = await apiClient.health.check();
    
    expect(health.status).toBe('healthy');
    expect(health.services).toBeDefined();
    expect(health.timestamp).toBeDefined();
  });
});

// =============================================
// INTEGRATION TESTS
// =============================================

describe('Database Service Integration', () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    dbService = TestUtils.createTestDatabase();
  });

  it('should save and retrieve assessments', async () => {
    const mockAssessment = MockDataGenerator.createMockAssessment();
    const createRequest = MockDataGenerator.createMockCreateRequest();
    
    const saved = await dbService.saveAssessment(createRequest, 'test-user');
    expect(saved).toBeDefined();
    
    const retrieved = await dbService.getAssessment(saved.id);
    expect(retrieved).toBeDefined();
  });

  it('should handle search with filters', async () => {
    const results = await dbService.searchAssessments({
      minValue: 100000,
      maxValue: 500000,
      page: 1,
      limit: 10
    });
    
    expect(results.assessments).toBeDefined();
    expect(results.total).toBeGreaterThanOrEqual(0);
  });
});

describe('AI Service Integration', () => {
  let aiService: AIAssessmentService;

  beforeEach(() => {
    aiService = TestUtils.createTestAIService();
  });

  it('should analyze property and return valuation', async () => {
    const propertyData = MockDataGenerator.createMockCreateRequest();
    const analysis = await aiService.analyzeProperty(propertyData);
    
    expect(analysis.estimatedValue).toBeGreaterThan(0);
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.confidence).toBeLessThanOrEqual(1);
    expect(analysis.marketAnalysis).toBeDefined();
    expect(analysis.riskAssessment).toBeDefined();
  });

  it('should get comparable properties', async () => {
    const comparables = await aiService.getComparableProperties('123 Test St', 0.5);
    expect(Array.isArray(comparables)).toBe(true);
  });

  it('should get market trends', async () => {
    const trends = await aiService.getMarketTrends('Test County', '12M');
    expect(trends.trend).toBeDefined();
    expect(trends.changePercent).toBeDefined();
    expect(trends.confidenceLevel).toBeGreaterThan(0);
  });
});

// =============================================
// COMPONENT TESTS (React Testing Library)
// =============================================

// Mock React component for testing
const MockAssessmentForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit({
      parcelNumber: formData.get('parcelNumber'),
      address: formData.get('address'),
      propertyType: formData.get('propertyType')
    });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="assessment-form">
      <input name="parcelNumber" placeholder="Parcel Number" required />
      <input name="address" placeholder="Property Address" required />
      <select name="propertyType" defaultValue="residential">
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
      </select>
      <button type="submit">Create Assessment</button>
    </form>
  );
};

describe('Assessment Form Component', () => {
  it('should render form fields correctly', () => {
    const mockSubmit = vi.fn();
    render(<MockAssessmentForm onSubmit={mockSubmit} />);
    
    expect(screen.getByPlaceholderText('Parcel Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Property Address')).toBeInTheDocument();
    expect(screen.getByDisplayValue('residential')).toBeInTheDocument();
    expect(screen.getByText('Create Assessment')).toBeInTheDocument();
  });

  it('should call onSubmit with form data', async () => {
    const mockSubmit = vi.fn();
    render(<MockAssessmentForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Parcel Number'), {
      target: { value: '123456' }
    });
    fireEvent.change(screen.getByPlaceholderText('Property Address'), {
      target: { value: '123 Test St' }
    });
    
    fireEvent.click(screen.getByText('Create Assessment'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        parcelNumber: '123456',
        address: '123 Test St',
        propertyType: 'residential'
      });
    });
  });
});

// =============================================
// END-TO-END TEST EXAMPLE
// =============================================

describe('E2E: Assessment Creation Workflow', () => {
  let apiClient: TerraFusionAPIClient;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    apiClient = new TerraFusionAPIClient({
      baseURL: 'http://localhost',
      timeout: 10000
    });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('should complete full assessment creation workflow', async () => {
    // 1. Check system health
    const health = await apiClient.health.check();
    expect(health.status).toBe('healthy');

    // 2. Create assessment
    const createRequest = MockDataGenerator.createMockCreateRequest();
    const assessment = await apiClient.assessments.create(createRequest);
    expect(assessment.id).toBeDefined();

    // 3. Retrieve created assessment
    const retrieved = await apiClient.assessments.getById(assessment.id);
    expect(retrieved.parcelNumber).toBe(createRequest.parcelNumber);

    // 4. Search for assessment
    const searchResults = await apiClient.assessments.search({
      address: createRequest.address
    });
    expect(searchResults.assessments.length).toBeGreaterThan(0);

    // 5. Verify assessment appears in search results
    const foundAssessment = searchResults.assessments.find(a => a.id === assessment.id);
    expect(foundAssessment).toBeDefined();
  });
});

// =============================================
// PERFORMANCE TESTS
// =============================================

describe('Performance Tests', () => {
  it('should handle multiple concurrent assessment creations', async () => {
    server.listen();
    
    const apiClient = new TerraFusionAPIClient({
      baseURL: 'http://localhost',
      timeout: 30000
    });

    const startTime = Date.now();
    const concurrentRequests = 10;
    
    const promises = Array.from({ length: concurrentRequests }, () => {
      const createRequest = MockDataGenerator.createMockCreateRequest();
      return apiClient.assessments.create(createRequest);
    });

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    expect(results).toHaveLength(concurrentRequests);
    expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    
    server.close();
  }, 10000);
});

export { MockDataGenerator, TestUtils, handlers, server };

// Usage Examples:
/*
// Running tests with Vitest
npm run test

// Running specific test suites
npm run test -- --run assessments
npm run test -- --run database
npm run test -- --run components

// Running tests with coverage
npm run test:coverage

// Running tests in watch mode
npm run test:watch

// Setting up test data in your test file
import { MockDataGenerator, TestUtils, server } from './testing-template';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockAssessment = MockDataGenerator.createMockAssessment();
const testDatabase = TestUtils.createTestDatabase();
*/