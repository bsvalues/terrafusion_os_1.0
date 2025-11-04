/**
 * Unit Tests for Enhanced Validation Runner
 *
 * Tests the functionality of the enhanced validation pipeline
 */

// Create a mock storage implementation for testing
const mockStorage = {
  updateProperty: jest.fn().mockResolvedValue({}),
  getAllProperties: jest.fn().mockResolvedValue([
    {
      id: 1,
      propertyId: 'TEST001',
      address: '123 Test St',
      parcelNumber: '12-34-56789',
      propertyType: 'Residential',
      acres: 0.25,
      value: 250000,
      status: 'active',
      extraFields: {},
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      propertyId: 'TEST002',
      address: '456 Validation Ave',
      parcelNumber: '12-34-56790',
      propertyType: 'Commercial',
      acres: 1.5,
      value: 750000,
      status: 'active',
      extraFields: {
        validationStatus: 'validated',
        lastValidated: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      propertyId: 'TEST003',
      address: '789 Issue Lane',
      parcelNumber: 'invalid-parcel', // Invalid format to trigger validation error
      propertyType: 'Residential',
      acres: 0.5,
      value: 300000,
      status: 'active',
      extraFields: {},
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]),
};

// Create a mock validation engine for testing
const mockValidationEngine = {
  validateProperty: jest.fn(property => {
    // Simulate validation results based on property data
    if (property.parcelNumber === 'invalid-parcel') {
      return Promise.resolve([
        {
          issueId: 'test-issue-1',
          ruleId: 'wa_data_quality_parcel_format',
          entityType: 'property',
          entityId: String(property.id),
          propertyId: property.propertyId,
          level: 'error',
          message: 'Parcel number does not match the required Washington format',
          details: { parcelNumber: property.parcelNumber },
          status: 'open',
          createdAt: new Date(),
        },
      ]);
    }

    // No issues for valid properties
    return Promise.resolve([]);
  }),
};

// Import and initialize the enhanced validation runner with mocks
import { EnhancedValidationRunner } from '../server/services/data-quality/enhanced-validation-runner';
const validationRunner = new EnhancedValidationRunner(mockStorage, mockValidationEngine);

// Mock console.log and console.error
global.console.log = jest.fn();
global.console.error = jest.fn();

describe('Enhanced Validation Runner', () => {
  beforeEach(() => {
    // Reset the mock function calls
    mockStorage.updateProperty.mockClear();
    mockValidationEngine.validateProperty.mockClear();
  });

  test('validates a batch of properties correctly', async () => {
    const properties = await mockStorage.getAllProperties();

    const result = await validationRunner.validateProperties(properties, {
      batchSize: 2,
      skipValidated: false,
      logProgress: false,
    });

    expect(result.total).toBe(3);
    expect(result.valid).toBe(2);
    expect(result.invalid).toBe(1);
    expect(result.issues.length).toBe(1);
    expect(result.issues[0].propertyId).toBe('TEST003');
    expect(result.processingTime).toBeGreaterThan(0);

    // Should call validateProperty for all 3 properties
    expect(mockValidationEngine.validateProperty).toHaveBeenCalledTimes(3);
  });

  test('skips already validated properties when skipValidated is true', async () => {
    const properties = await mockStorage.getAllProperties();

    const result = await validationRunner.validateProperties(properties, {
      batchSize: 2,
      skipValidated: true,
      logProgress: false,
    });

    expect(result.total).toBe(3);
    // One property is already validated (TEST002)
    expect(mockValidationEngine.validateProperty).toHaveBeenCalledTimes(2);

    // Storage should be updated for validated properties
    expect(mockStorage.updateProperty).toHaveBeenCalledTimes(1);
  });

  test('updates property validation status after validation', async () => {
    const properties = [
      {
        id: 1,
        propertyId: 'TEST001',
        address: '123 Test St',
        parcelNumber: '12-34-56789',
        propertyType: 'Residential',
        acres: 0.25,
        value: 250000,
        status: 'active',
        extraFields: {},
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    await validationRunner.validateProperties(properties, {
      logProgress: false,
    });

    // Check if updateProperty was called with correct parameters
    expect(mockStorage.updateProperty).toHaveBeenCalledWith(1, {
      extraFields: {
        validationStatus: 'validated',
        lastValidated: expect.any(String),
      },
    });
  });

  test('validates specific fields when validateFields option is provided', async () => {
    const properties = [
      {
        id: 1,
        propertyId: 'TEST001',
        address: '123 Test St',
        parcelNumber: '12-34-56789',
        propertyType: 'Residential',
        acres: 0.25,
        value: 250000,
        status: 'active',
        extraFields: {},
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];

    await validationRunner.validateProperties(properties, {
      validateFields: ['parcelNumber', 'propertyType'],
      logProgress: false,
    });

    // Check if validateProperty was called with fields option
    expect(mockValidationEngine.validateProperty).toHaveBeenCalledWith(expect.anything(), {
      fields: ['parcelNumber', 'propertyType'],
    });
  });
});
