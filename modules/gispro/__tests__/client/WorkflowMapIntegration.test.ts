import { WorkflowMapIntegration } from '@/lib/workflow-map-integration';
import { queryClient } from '@/lib/queryClient';
import { Workflow, WorkflowState } from '@shared/schema';
import { WorkflowType } from '@/lib/workflow-types';

// Mock the queryClient
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    fetchQuery: jest.fn(),
    invalidateQueries: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('WorkflowMapIntegration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  // Sample workflow data for testing
  const mockLongPlatWorkflow: Workflow = {
    id: 1,
    title: 'Test Long Plat',
    type: 'long_plat' as WorkflowType,
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockBLAWorkflow: Workflow = {
    id: 2,
    title: 'Test BLA',
    type: 'bla' as WorkflowType,
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockWorkflowState: WorkflowState = {
    id: 1,
    workflowId: 1,
    currentStep: 3, // Parcels step
    currentStepName: 'Parcels',
    status: 'in_progress',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const mockGeoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 1 },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-122.0, 47.0],
              [-122.0, 47.1],
              [-121.9, 47.1],
              [-121.9, 47.0],
              [-122.0, 47.0],
            ],
          ],
        },
      },
    ],
  };

  test('loadState fetches and returns workflow state', async () => {
    // Mock the fetchQuery response
    (queryClient.fetchQuery as jest.Mock).mockResolvedValue(mockWorkflowState);
    
    const integration = new WorkflowMapIntegration(mockLongPlatWorkflow);
    const state = await integration.loadState();
    
    // Check that fetchQuery was called with the correct parameters
    expect(queryClient.fetchQuery).toHaveBeenCalledWith({
      queryKey: ['/api/workflows', 1, 'state'],
      queryFn: expect.any(Function),
    });
    
    // Check that the state was returned correctly
    expect(state).toEqual(mockWorkflowState);
  });
  
  test('getEnabledMapTools returns correct tools for long_plat workflow', async () => {
    // Mock the fetchQuery response
    (queryClient.fetchQuery as jest.Mock).mockResolvedValue(mockWorkflowState);
    
    const integration = new WorkflowMapIntegration(mockLongPlatWorkflow);
    await integration.loadState();
    
    const tools = integration.getEnabledMapTools();
    
    // For step 3 (Parcels) in a long_plat workflow, drawing tools should be enabled
    expect(tools).toContain('pan');
    expect(tools).toContain('select');
    expect(tools).toContain('measure');
    expect(tools).toContain('draw');
    expect(tools).toContain('edit');
  });
  
  test('getEnabledMapTools returns correct tools for completed workflow', async () => {
    // Mock a completed workflow state
    const completedState = { ...mockWorkflowState, status: 'completed' };
    (queryClient.fetchQuery as jest.Mock).mockResolvedValue(completedState);
    
    const integration = new WorkflowMapIntegration(mockLongPlatWorkflow);
    await integration.loadState();
    
    const tools = integration.getEnabledMapTools();
    
    // For a completed workflow, only viewing tools should be enabled
    expect(tools).toContain('pan');
    expect(tools).toContain('select');
    expect(tools).toContain('measure');
    expect(tools).not.toContain('draw');
    expect(tools).not.toContain('edit');
  });
  
  test('getRelevantMapLayers returns correct layers for each workflow type', async () => {
    const longPlatIntegration = new WorkflowMapIntegration(mockLongPlatWorkflow);
    const blaIntegration = new WorkflowMapIntegration(mockBLAWorkflow);
    
    const longPlatLayers = await longPlatIntegration.getRelevantMapLayers();
    const blaLayers = await blaIntegration.getRelevantMapLayers();
    
    // Check that the correct layers are returned for each workflow type
    expect(longPlatLayers).toContain('Parcels');
    expect(longPlatLayers).toContain('Zoning');
    expect(longPlatLayers).toContain('Streets');
    
    expect(blaLayers).toContain('Parcels');
    expect(blaLayers).toContain('Property Lines');
    expect(blaLayers).not.toContain('Zoning');
  });
  
  test('saveWorkflowGeometry sends data to the server', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    
    const integration = new WorkflowMapIntegration(mockLongPlatWorkflow);
    const result = await integration.saveWorkflowGeometry(mockGeoJSON);
    
    // Check that fetch was called with the correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workflows/1/geometry',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.any(String),
      })
    );
    
    // Parse the request body to check it contains the correct data
    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody.geometry).toEqual(mockGeoJSON);
    
    // Check that the query cache was invalidated
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/workflows', 1],
    });
    
    // Check that the function returned true
    expect(result).toBe(true);
  });
  
  test('loadWorkflowGeometry fetches geometry from the server', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ geometry: mockGeoJSON }),
    });
    
    const integration = new WorkflowMapIntegration(mockLongPlatWorkflow);
    const result = await integration.loadWorkflowGeometry();
    
    // Check that fetch was called with the correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workflows/1/geometry',
      expect.objectContaining({
        credentials: 'include',
      })
    );
    
    // Check that the function returned the correct data
    expect(result).toEqual(mockGeoJSON);
  });
  
  test('logMapInteraction sends event data to the server', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });
    
    const integration = new WorkflowMapIntegration(mockLongPlatWorkflow);
    await integration.logMapInteraction('tool_change', { tool: 'draw' });
    
    // Check that fetch was called with the correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/workflows/1/events',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.any(String),
      })
    );
    
    // Parse the request body to check it contains the correct data
    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody.type).toBe('map_interaction');
    expect(requestBody.action).toBe('tool_change');
    expect(requestBody.details.tool).toBe('draw');
  });
});