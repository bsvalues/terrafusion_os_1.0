import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PipelineBuilder from './pipeline-builder';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock ReactFlow since it uses canvas which isn't available in test environment
vi.mock('reactflow', () => {
  return {
    __esModule: true,
    ...vi.importActual('reactflow'),
    ReactFlow: vi.fn(() => <div data-testid="react-flow">Mock ReactFlow</div>),
    Background: vi.fn(() => <div>Background</div>),
    Controls: vi.fn(() => <div>Controls</div>),
    MiniMap: vi.fn(() => <div>MiniMap</div>),
    useNodesState: vi.fn(() => [
      [
        { id: 'source1', type: 'source', data: { label: 'Source 1' }, position: { x: 100, y: 100 } },
        { id: 'transform1', type: 'transform', data: { label: 'Transform 1' }, position: { x: 300, y: 100 } }
      ],
      vi.fn()
    ]),
    useEdgesState: vi.fn(() => [
      [{ id: 'edge1', source: 'source1', target: 'transform1' }],
      vi.fn()
    ]),
    addEdge: vi.fn((edge, edges) => [...edges, edge]),
  };
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock the pipeline node components
vi.mock('../components/pipeline/nodes', () => ({
  SourceNode: () => <div data-testid="source-node">Source Node</div>,
  TransformNode: () => <div data-testid="transform-node">Transform Node</div>,
  FilterNode: () => <div data-testid="filter-node">Filter Node</div>,
  JoinNode: () => <div data-testid="join-node">Join Node</div>,
  OutputNode: () => <div data-testid="output-node">Output Node</div>,
}));

describe('PipelineBuilder Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderPipelineBuilder = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PipelineBuilder />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders the pipeline builder with title and flow editor', () => {
    renderPipelineBuilder();
    
    expect(screen.getByRole('heading', { name: /Pipeline Builder/i })).toBeInTheDocument();
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('displays the node palette', () => {
    renderPipelineBuilder();
    
    expect(screen.getByText(/Node Palette/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(6); // 5 node types + Save button
  });

  it('loads existing pipeline when one exists', async () => {
    // Mock successful pipeline fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        name: 'Test Pipeline',
        nodes: JSON.stringify([
          { id: 'source1', type: 'source', data: { label: 'Source 1' }, position: { x: 100, y: 100 } },
          { id: 'transform1', type: 'transform', data: { label: 'Transform 1' }, position: { x: 300, y: 100 } }
        ]),
        edges: JSON.stringify([
          { id: 'edge1', source: 'source1', target: 'transform1' }
        ]),
        userId: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }),
    });
    
    renderPipelineBuilder();
    
    await waitFor(() => {
      expect(screen.getByText('Test Pipeline')).toBeInTheDocument();
    });
  });

  it('handles save pipeline operation', async () => {
    // Mock successful pipeline save
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        name: 'New Pipeline',
        nodes: "[]",
        edges: "[]",
        userId: 1,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }),
    });
    
    renderPipelineBuilder();
    
    // Find and click the save button
    const saveButton = screen.getByRole('button', { name: /Save Pipeline/i });
    fireEvent.click(saveButton);
    
    // Open pipeline name dialog
    const nameInput = screen.getByLabelText(/Pipeline Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Pipeline' } });
    
    // Click save in dialog
    const saveDialogButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveDialogButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/pipelines', expect.any(Object));
    });
  });

  it('displays error when pipeline save fails', async () => {
    // Mock failed pipeline save
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Failed to save pipeline' }),
    });
    
    renderPipelineBuilder();
    
    // Find and click the save button
    const saveButton = screen.getByRole('button', { name: /Save Pipeline/i });
    fireEvent.click(saveButton);
    
    // Open pipeline name dialog
    const nameInput = screen.getByLabelText(/Pipeline Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Pipeline' } });
    
    // Click save in dialog
    const saveDialogButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveDialogButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to save pipeline/i)).toBeInTheDocument();
    });
  });
});