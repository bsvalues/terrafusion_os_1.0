import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowMapControls } from '@/components/maps/workflow-map-controls';
import { Workflow, WorkflowState } from '@shared/schema';
import { MapTool } from '@/lib/map-utils';
import { WorkflowMapIntegration } from '@/lib/workflow-map-integration';

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockImplementation(({ queryKey }) => {
    if (queryKey[0] === '/api/workflows' && queryKey[2] === 'state') {
      return {
        data: mockWorkflowState,
        isLoading: false,
      };
    }
    return {
      data: null,
      isLoading: false,
    };
  }),
}));

// Mock the WorkflowMapIntegration service
jest.mock('@/lib/workflow-map-integration', () => {
  return {
    WorkflowMapIntegration: jest.fn().mockImplementation(() => {
      return {
        loadState: jest.fn().mockResolvedValue(mockWorkflowState),
        getEnabledMapTools: jest.fn().mockReturnValue(['pan', 'select', 'measure', 'draw', 'edit']),
        logMapInteraction: jest.fn(),
      };
    }),
  };
});

// Mock the GeoDataIO component
jest.mock('@/components/maps/geo-data-io', () => ({
  GeoDataIO: ({ onImport, onExport, importDialogOpen, exportDialogOpen }) => (
    <div data-testid="geo-data-io">
      {importDialogOpen && <div data-testid="import-dialog">Import Dialog</div>}
      {exportDialogOpen && <div data-testid="export-dialog">Export Dialog</div>}
    </div>
  ),
}));

// Sample workflow data for testing
const mockWorkflow: Workflow = {
  id: 1,
  title: 'Test Long Plat',
  type: 'long_plat',
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

describe('WorkflowMapControls', () => {
  const handleToolChange = jest.fn();
  const handleSaveGeometry = jest.fn();
  const handleImportGeoJSON = jest.fn();
  const handleExportGeoJSON = jest.fn();
  
  // Default props
  const defaultProps = {
    workflow: mockWorkflow,
    activeTool: MapTool.PAN,
    onToolChange: handleToolChange,
    onSaveGeometry: handleSaveGeometry,
    onImportGeoJSON: handleImportGeoJSON,
    onExportGeoJSON: handleExportGeoJSON,
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with correct workflow information', () => {
    render(<WorkflowMapControls {...defaultProps} />);
    
    // Check that the title and step information are displayed
    expect(screen.getByText(/Process Long Plat Map Tools/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 3: Parcels/i)).toBeInTheDocument();
    expect(screen.getByText(/in_progress/i)).toBeInTheDocument();
  });
  
  test('tool buttons change the active tool', () => {
    render(<WorkflowMapControls {...defaultProps} />);
    
    // Find and click the measure tool button
    const measureTool = screen.getAllByRole('tab')[2]; // Index 2 for measure
    fireEvent.click(measureTool);
    
    // Check that the callback was called with the correct parameter
    expect(handleToolChange).toHaveBeenCalledWith(MapTool.MEASURE);
  });
  
  test('save button triggers the save callback', () => {
    render(<WorkflowMapControls {...defaultProps} />);
    
    // Find and click the save button
    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);
    
    // Check that the callback was called
    expect(handleSaveGeometry).toHaveBeenCalled();
  });
  
  test('import button opens the import dialog', () => {
    render(<WorkflowMapControls {...defaultProps} />);
    
    // Find and click the import button
    const importButton = screen.getByText(/Import/i);
    fireEvent.click(importButton);
    
    // Check that the import dialog is opened
    expect(screen.getByTestId('import-dialog')).toBeInTheDocument();
  });
  
  test('export button opens the export dialog', () => {
    render(<WorkflowMapControls {...defaultProps} />);
    
    // Find and click the export button
    const exportButton = screen.getByText(/Export/i);
    fireEvent.click(exportButton);
    
    // Check that the export dialog is opened
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
  });
  
  test('drawing tools are displayed when draw tool is active', () => {
    render(<WorkflowMapControls {...defaultProps} activeTool={MapTool.DRAW} />);
    
    // Check that the drawing tools are displayed
    // For long_plat workflow, we expect to see buttons for drawing parcels, circles, and lines
    expect(screen.getAllByRole('button').length).toBeGreaterThan(5); // Main tools + drawing tools
  });
  
  test('tools are disabled when workflow is completed', () => {
    // Mock the WorkflowMapIntegration to return only viewing tools
    (WorkflowMapIntegration as jest.Mock).mockImplementation(() => {
      return {
        loadState: jest.fn().mockResolvedValue({
          ...mockWorkflowState,
          status: 'completed',
        }),
        getEnabledMapTools: jest.fn().mockReturnValue(['pan', 'select', 'measure']),
        logMapInteraction: jest.fn(),
      };
    });
    
    render(<WorkflowMapControls {...defaultProps} />);
    
    // The draw and edit tool buttons should be disabled
    const tabs = screen.getAllByRole('tab');
    const drawTab = tabs[3]; // Index 3 for draw
    const editTab = tabs[4]; // Index 4 for edit
    
    expect(drawTab).toHaveAttribute('disabled');
    expect(editTab).toHaveAttribute('disabled');
    
    // The save button should also be disabled
    const saveButton = screen.getByText(/Save Changes/i);
    expect(saveButton).toHaveAttribute('disabled');
  });
  
  test('initializes the map integration with the provided workflow', () => {
    render(<WorkflowMapControls {...defaultProps} />);
    
    // Check that WorkflowMapIntegration was initialized with the correct workflow
    expect(WorkflowMapIntegration).toHaveBeenCalledWith(mockWorkflow);
  });
});