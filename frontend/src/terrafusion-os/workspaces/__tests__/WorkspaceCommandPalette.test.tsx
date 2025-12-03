/**
 * WorkspaceCommandPalette tests – validates rendering, filtering, and intent emission.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetWorkspaceCommandProvider,
  setWorkspaceCommandProvider,
} from '../../core/command/WorkspaceCommandProvider';
import type { WorkspaceCommand } from '../../core/command/types';
import { WorkspaceCommandPalette } from '../WorkspaceCommandPalette';

// Mock the OmniIntent hook
const mockSetIntent = vi.fn();
vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => ({
    setIntent: mockSetIntent,
    currentIntent: null,
    gravityWell: { activePanels: [] },
    rightRail: { panel: null, props: {} },
    clearIntent: vi.fn(),
    setRightRail: vi.fn(),
    closeRightRail: vi.fn(),
  }),
}));

describe('WorkspaceCommandPalette', () => {
  const mockCommands: WorkspaceCommand[] = [
    { id: 'cmd-alpha', label: 'Alpha Command', category: 'navigation' },
    { id: 'cmd-beta', label: 'Beta Action', category: 'system', description: 'Does beta things' },
    { id: 'cmd-gamma', label: 'Gamma Tool', category: 'tools' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetWorkspaceCommandProvider();
  });

  it('renders loading state initially', async () => {
    // Create a provider that never resolves during the test
    let resolveCommands: (cmds: WorkspaceCommand[]) => void;
    const pendingPromise = new Promise<WorkspaceCommand[]>((resolve) => {
      resolveCommands = resolve;
    });

    setWorkspaceCommandProvider({
      getCommands: () => pendingPromise,
    });

    render(<WorkspaceCommandPalette />);

    expect(screen.getByTestId('workspace-command-palette-loading')).toBeInTheDocument();

    // Cleanup
    resolveCommands!([]);
  });

  it('renders commands after loading', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-list')).toBeInTheDocument();
    });

    const items = screen.getAllByTestId('workspace-command-palette-item');
    expect(items).toHaveLength(3);
    expect(screen.getByText('Alpha Command')).toBeInTheDocument();
    expect(screen.getByText('Beta Action')).toBeInTheDocument();
    expect(screen.getByText('Gamma Tool')).toBeInTheDocument();
  });

  it('renders error state on provider failure', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockRejectedValue(new Error('Network failure')),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Unable to load commands/i)).toBeInTheDocument();
  });

  it('renders empty state when no commands match', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-list')).toBeInTheDocument();
    });

    const input = screen.getByTestId('workspace-command-palette-input');
    fireEvent.change(input, { target: { value: 'zzzzzznotfound' } });

    expect(screen.getByTestId('workspace-command-palette-empty')).toBeInTheDocument();
    expect(screen.getByText(/No commands match/i)).toBeInTheDocument();
  });

  it('filters commands based on search query', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getAllByTestId('workspace-command-palette-item')).toHaveLength(3);
    });

    const input = screen.getByTestId('workspace-command-palette-input');
    fireEvent.change(input, { target: { value: 'alpha' } });

    const items = screen.getAllByTestId('workspace-command-palette-item');
    expect(items).toHaveLength(1);
    expect(screen.getByText('Alpha Command')).toBeInTheDocument();
  });

  it('filters by label text match', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getAllByTestId('workspace-command-palette-item')).toHaveLength(3);
    });

    const input = screen.getByTestId('workspace-command-palette-input');
    fireEvent.change(input, { target: { value: 'Beta' } });

    const items = screen.getAllByTestId('workspace-command-palette-item');
    expect(items).toHaveLength(1);
    expect(screen.getByText('Beta Action')).toBeInTheDocument();
  });

  it('emits workspace_command_invoked intent on command click', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-list')).toBeInTheDocument();
    });

    const betaItem = screen.getByText('Beta Action').closest('li');
    fireEvent.click(betaItem!);

    expect(mockSetIntent).toHaveBeenCalledTimes(1);
    expect(mockSetIntent).toHaveBeenCalledWith('workspace_command_invoked', {
      commandId: 'cmd-beta',
      label: 'Beta Action',
      workspaceId: undefined, // Inherits from context (mocked as undefined)
    });
  });

  it('displays description when available', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-list')).toBeInTheDocument();
    });

    expect(screen.getByText('Does beta things')).toBeInTheDocument();
  });

  it('has accessible search input with placeholder', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-input')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Type a command/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders palette container with correct test id', async () => {
    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mockCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette')).toBeInTheDocument();
    });
  });
});

describe('WorkspaceCommandPalette – core/suggested sections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetWorkspaceCommandProvider();
  });

  it('renders core commands in core section', async () => {
    const coreCommands: WorkspaceCommand[] = [
      { id: 'core-1', label: 'Core One', kind: 'core' },
      { id: 'core-2', label: 'Core Two', kind: 'core' },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(coreCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-group-core')).toBeInTheDocument();
    });

    const coreSection = screen.getByTestId('workspace-command-group-core');
    expect(coreSection).toHaveTextContent('Core One');
    expect(coreSection).toHaveTextContent('Core Two');
  });

  it('renders suggested commands in suggested section', async () => {
    const mixedCommands: WorkspaceCommand[] = [
      { id: 'core-cmd', label: 'Core Command', kind: 'core' },
      { id: 'sug-1', label: 'Suggestion One', kind: 'suggested', score: 0.9 },
      { id: 'sug-2', label: 'Suggestion Two', kind: 'suggested', score: 0.8 },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mixedCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-group-suggested')).toBeInTheDocument();
    });

    const suggestedSection = screen.getByTestId('workspace-command-group-suggested');
    expect(suggestedSection).toHaveTextContent('Suggestion One');
    expect(suggestedSection).toHaveTextContent('Suggestion Two');
  });

  it('does not render suggested section when no suggestions exist', async () => {
    const coreOnlyCommands: WorkspaceCommand[] = [
      { id: 'core-a', label: 'Core A', kind: 'core' },
      { id: 'core-b', label: 'Core B', kind: 'core' },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(coreOnlyCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-group-core')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('workspace-command-group-suggested')).not.toBeInTheDocument();
  });

  it('renders suggested items with correct test ids', async () => {
    const mixedCommands: WorkspaceCommand[] = [
      { id: 'core-cmd', label: 'Core Command', kind: 'core' },
      { id: 'sug-item', label: 'Suggested Item', kind: 'suggested', score: 0.85 },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mixedCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-group-suggested')).toBeInTheDocument();
    });

    // Suggested items should have the suggested-specific test id
    const suggestedItems = screen.getAllByTestId('workspace-command-palette-item-suggested');
    expect(suggestedItems).toHaveLength(1);
    expect(suggestedItems[0]).toHaveTextContent('Suggested Item');
  });

  it('treats commands without kind as core', async () => {
    const mixedCommands: WorkspaceCommand[] = [
      { id: 'no-kind', label: 'No Kind Set' }, // No kind specified
      { id: 'sug', label: 'Suggestion', kind: 'suggested', score: 0.7 },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mixedCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-group-core')).toBeInTheDocument();
    });

    // The no-kind command should be in core section
    const coreSection = screen.getByTestId('workspace-command-group-core');
    expect(coreSection).toHaveTextContent('No Kind Set');

    // Suggestion should be in suggested section
    const suggestedSection = screen.getByTestId('workspace-command-group-suggested');
    expect(suggestedSection).toHaveTextContent('Suggestion');
  });

  it('filters both core and suggested commands with search', async () => {
    const mixedCommands: WorkspaceCommand[] = [
      { id: 'core-alpha', label: 'Alpha Core', kind: 'core' },
      { id: 'core-beta', label: 'Beta Core', kind: 'core' },
      { id: 'sug-alpha', label: 'Alpha Suggestion', kind: 'suggested', score: 0.9 },
      { id: 'sug-gamma', label: 'Gamma Suggestion', kind: 'suggested', score: 0.8 },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mixedCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-list')).toBeInTheDocument();
    });

    const input = screen.getByTestId('workspace-command-palette-input');
    fireEvent.change(input, { target: { value: 'alpha' } });

    // Should show Alpha Core in core section and Alpha Suggestion in suggested section
    const coreSection = screen.getByTestId('workspace-command-group-core');
    expect(coreSection).toHaveTextContent('Alpha Core');
    expect(coreSection).not.toHaveTextContent('Beta Core');

    const suggestedSection = screen.getByTestId('workspace-command-group-suggested');
    expect(suggestedSection).toHaveTextContent('Alpha Suggestion');
    expect(suggestedSection).not.toHaveTextContent('Gamma Suggestion');
  });

  it('shows empty state when filter matches no core or suggested commands', async () => {
    const mixedCommands: WorkspaceCommand[] = [
      { id: 'core-one', label: 'Core One', kind: 'core' },
      { id: 'sug-one', label: 'Suggestion One', kind: 'suggested', score: 0.9 },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mixedCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-palette-list')).toBeInTheDocument();
    });

    const input = screen.getByTestId('workspace-command-palette-input');
    fireEvent.change(input, { target: { value: 'zzzznotfound' } });

    expect(screen.getByTestId('workspace-command-palette-empty')).toBeInTheDocument();
  });

  it('emits intent with correct data when clicking suggested command', async () => {
    const mixedCommands: WorkspaceCommand[] = [
      { id: 'core-cmd', label: 'Core Command', kind: 'core' },
      { id: 'sug-cmd', label: 'Suggested Command', kind: 'suggested', score: 0.95 },
    ];

    setWorkspaceCommandProvider({
      getCommands: vi.fn().mockResolvedValue(mixedCommands),
    });

    render(<WorkspaceCommandPalette />);

    await waitFor(() => {
      expect(screen.getByTestId('workspace-command-group-suggested')).toBeInTheDocument();
    });

    const suggestedItem = screen.getByText('Suggested Command').closest('li');
    fireEvent.click(suggestedItem!);

    expect(mockSetIntent).toHaveBeenCalledTimes(1);
    expect(mockSetIntent).toHaveBeenCalledWith('workspace_command_invoked', {
      commandId: 'sug-cmd',
      label: 'Suggested Command',
      workspaceId: undefined,
    });
  });
});
