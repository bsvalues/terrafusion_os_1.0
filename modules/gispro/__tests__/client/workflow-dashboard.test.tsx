import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { WorkflowDashboard } from '@/components/workflow/workflow-dashboard';
import { Workflow, WorkflowEvent } from '@shared/schema';

// Mock the hooks and API calls
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isLoading: false
  })
}));

const mockWorkflows: Workflow[] = [
  {
    id: 1,
    userId: 1,
    type: 'long_plat',
    title: 'Test Long Plat 1',
    description: 'High priority workflow',
    status: 'in_progress',
    priority: 'high',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-05').toISOString()
  },
  {
    id: 2,
    userId: 1,
    type: 'bla',
    title: 'Test BLA 1',
    description: 'Medium priority workflow',
    status: 'review',
    priority: 'medium',
    createdAt: new Date('2025-01-02').toISOString(),
    updatedAt: new Date('2025-01-04').toISOString()
  },
  {
    id: 3,
    userId: 1,
    type: 'merge_split',
    title: 'Test Merge Split',
    description: 'Low priority workflow',
    status: 'completed',
    priority: 'low',
    createdAt: new Date('2025-01-03').toISOString(),
    updatedAt: new Date('2025-01-06').toISOString()
  }
];

const mockWorkflowEvents: WorkflowEvent[] = [
  {
    id: 1,
    workflowId: 1,
    eventType: 'created',
    description: 'Workflow created',
    metadata: JSON.stringify({ userId: 1 }),
    createdAt: new Date('2025-01-01T10:00:00Z').toISOString()
  },
  {
    id: 2,
    workflowId: 1,
    eventType: 'status_updated',
    description: 'Status updated to in_progress',
    metadata: JSON.stringify({ oldStatus: 'draft', newStatus: 'in_progress' }),
    createdAt: new Date('2025-01-02T14:30:00Z').toISOString()
  },
  {
    id: 3,
    workflowId: 1,
    eventType: 'priority_updated',
    description: 'Priority updated to high',
    metadata: JSON.stringify({ oldPriority: 'medium', newPriority: 'high' }),
    createdAt: new Date('2025-01-03T09:15:00Z').toISOString()
  },
  {
    id: 4,
    workflowId: 1,
    eventType: 'note_added',
    description: 'Note added',
    metadata: JSON.stringify({ note: 'This is an important update' }),
    createdAt: new Date('2025-01-04T11:45:00Z').toISOString()
  }
];

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockImplementation(({ queryKey }) => {
    if (queryKey[0] === '/api/workflows') {
      return {
        data: mockWorkflows,
        isLoading: false,
        error: null
      };
    }
    if (queryKey[0] === '/api/workflow-events' && queryKey[1]) {
      return {
        data: mockWorkflowEvents.filter(event => event.workflowId === queryKey[1]),
        isLoading: false,
        error: null
      };
    }
    return {
      data: null,
      isLoading: false,
      error: null
    };
  }),
  useMutation: jest.fn().mockImplementation(() => ({
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    isSuccess: false
  }))
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('WorkflowDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render workflow dashboard with all workflows', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.getByText('Test Merge Split')).toBeInTheDocument();
    });
  });

  test('should filter workflows by status', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Initial render should show all workflows
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.getByText('Test Merge Split')).toBeInTheDocument();
    });
    
    // Filter by In Progress
    const inProgressFilter = screen.getByRole('button', { name: /in progress/i });
    fireEvent.click(inProgressFilter);
    
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.queryByText('Test BLA 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
  });

  test('should filter workflows by priority', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Initial render should show all workflows
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.getByText('Test Merge Split')).toBeInTheDocument();
    });
    
    // Filter by High Priority
    const highPriorityFilter = screen.getByRole('button', { name: /high priority/i });
    fireEvent.click(highPriorityFilter);
    
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.queryByText('Test BLA 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
  });

  test('should highlight high priority workflows', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    await waitFor(() => {
      const highPriorityWorkflow = screen.getByText('Test Long Plat 1').closest('.workflow-item');
      expect(highPriorityWorkflow).toHaveClass('priority-high');
    });
  });

  test('should display workflow timeline', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Click on a workflow to view details with timeline
    const workflowTitle = screen.getByText('Test Long Plat 1');
    fireEvent.click(workflowTitle);
    
    await waitFor(() => {
      expect(screen.getByText('Workflow Timeline')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Jan 1, 2025')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.getByText('Jan 5, 2025')).toBeInTheDocument();
    });
  });
  
  test('should display detailed workflow events in timeline', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Click on a workflow to view details with timeline
    const workflowTitle = screen.getByText('Test Long Plat 1');
    fireEvent.click(workflowTitle);
    
    await waitFor(() => {
      expect(screen.getByText('Workflow created')).toBeInTheDocument();
      expect(screen.getByText('Status updated to in_progress')).toBeInTheDocument();
      expect(screen.getByText('Priority updated to high')).toBeInTheDocument();
      expect(screen.getByText('Note added')).toBeInTheDocument();
    });
  });
  
  test('should expand event details when clicked', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Click on a workflow to view details
    const workflowTitle = screen.getByText('Test Long Plat 1');
    fireEvent.click(workflowTitle);
    
    // Wait for timeline to appear
    await waitFor(() => {
      expect(screen.getByText('Workflow Timeline')).toBeInTheDocument();
    });
    
    // Click on an event to expand details
    const eventItem = screen.getByText('Priority updated to high');
    fireEvent.click(eventItem);
    
    // Check that expanded details are visible
    await waitFor(() => {
      expect(screen.getByText(/Old Priority: medium/i)).toBeInTheDocument();
      expect(screen.getByText(/New Priority: high/i)).toBeInTheDocument();
    });
  });
  
  test('should filter workflows by date range', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Open date filter dialog
    const dateFilterButton = screen.getByRole('button', { name: /filter by date/i });
    fireEvent.click(dateFilterButton);
    
    // Set date range
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    fireEvent.change(startDateInput, { target: { value: '2025-01-02' } });
    fireEvent.change(endDateInput, { target: { value: '2025-01-05' } });
    
    // Apply filter
    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);
    
    // Check filtered results
    await waitFor(() => {
      expect(screen.queryByText('Test Long Plat 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
  });
  
  test('should update workflow priority', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Select a workflow
    const workflowItem = screen.getByText('Test BLA 1').closest('.workflow-item');
    fireEvent.click(workflowItem!);
    
    // Open priority dropdown
    const priorityButton = screen.getByRole('button', { name: /medium priority/i });
    fireEvent.click(priorityButton);
    
    // Select high priority
    const highPriorityOption = screen.getByRole('option', { name: /high/i });
    fireEvent.click(highPriorityOption);
    
    // Verify priority was updated in UI
    await waitFor(() => {
      const updatedWorkflowItem = screen.getByText('Test BLA 1').closest('.workflow-item');
      expect(updatedWorkflowItem).toHaveClass('priority-high');
    });
  });
  
  test('should handle sorting of workflows', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Click on priority column header to sort
    const priorityHeader = screen.getByRole('columnheader', { name: /priority/i });
    fireEvent.click(priorityHeader);
    
    // Check that high priority workflow is first
    await waitFor(() => {
      const firstWorkflow = screen.getAllByTestId('workflow-row')[0];
      expect(firstWorkflow).toHaveTextContent('Test Long Plat 1');
    });
    
    // Click again to reverse sort
    fireEvent.click(priorityHeader);
    
    // Check that low priority workflow is now first
    await waitFor(() => {
      const firstWorkflow = screen.getAllByTestId('workflow-row')[0];
      expect(firstWorkflow).toHaveTextContent('Test Merge Split');
    });
  });
  
  test('should search workflows by title', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search workflows/i);
    fireEvent.change(searchInput, { target: { value: 'BLA' } });
    
    // Check filtered results
    await waitFor(() => {
      expect(screen.queryByText('Test Long Plat 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
  });
  
  // Edge cases and boundary tests
  
  test('should handle empty filter results gracefully', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Type in search box with no matches
    const searchInput = screen.getByPlaceholderText(/search workflows/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentWorkflow' } });
    
    // Check empty state is shown
    await waitFor(() => {
      expect(screen.queryByText('Test Long Plat 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test BLA 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
      expect(screen.getByText(/no workflows found/i)).toBeInTheDocument();
    });
  });
  
  test('should combine multiple filters', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Filter by status
    const reviewFilter = screen.getByRole('button', { name: /review/i });
    fireEvent.click(reviewFilter);
    
    // Also filter by priority
    const mediumPriorityFilter = screen.getByRole('button', { name: /medium priority/i });
    fireEvent.click(mediumPriorityFilter);
    
    // Check that only the workflow matching both filters is shown
    await waitFor(() => {
      expect(screen.queryByText('Test Long Plat 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
  });
  
  test('should reset all filters', async () => {
    renderWithProviders(<WorkflowDashboard />);
    
    // Apply a filter
    const highPriorityFilter = screen.getByRole('button', { name: /high priority/i });
    fireEvent.click(highPriorityFilter);
    
    // Check filtered results
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.queryByText('Test BLA 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Merge Split')).not.toBeInTheDocument();
    });
    
    // Reset filters
    const resetButton = screen.getByRole('button', { name: /reset filters/i });
    fireEvent.click(resetButton);
    
    // Check all workflows are shown
    await waitFor(() => {
      expect(screen.getByText('Test Long Plat 1')).toBeInTheDocument();
      expect(screen.getByText('Test BLA 1')).toBeInTheDocument();
      expect(screen.getByText('Test Merge Split')).toBeInTheDocument();
    });
  });
});