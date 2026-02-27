/**
 * ToolInvokePanel.test.tsx
 *
 * Phase 2: TerraPilot Read-Only Tool Invocation Vertical Slice
 * Tests the end-to-end flow: UI → pilotApi.invokeTool() → correlationId display
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as pilotApi from '../../api/pilotApi';
import { ToolInvokePanel } from '../../components/pilot/ToolInvokePanel';

// Mock the pilotApi module
vi.mock('../../api/pilotApi');

// Cast to Jest mock for type-safe mock access
const mockInvokeTool = pilotApi.invokeTool as vi.MockedFunction<typeof pilotApi.invokeTool>;

describe('ToolInvokePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Read-Only Tool Invocation', () => {
    it('invokes read-only tool successfully and displays result with correlationId', async () => {
      // Arrange: Mock successful tool invocation
      const mockResponse = {
        success: true,
        correlationId: 'corr-abc123-success',
        result: {
          toolId: 'registry.list_tools',
          output: JSON.stringify([
            { id: 'tool1', name: 'Tool One' },
            { id: 'tool2', name: 'Tool Two' },
          ]),
        },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      // Act: Render panel and invoke tool
      render(<ToolInvokePanel />);

      const runButton = screen.getByRole('button', { name: /run tool/i });
      fireEvent.click(runButton);

      // Assert: Success state rendered
      await waitFor(() => {
        // Result displayed
        expect(screen.getByText(/tool one/i)).toBeInTheDocument();

        // correlationId displayed (may appear multiple times in dev mode - badge + trace hint)
        expect(screen.getAllByText(/corr-abc123-success/).length).toBeGreaterThan(0);

        // No error displayed
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });

      // Verify API called with correct params
      expect(pilotApi.invokeTool).toHaveBeenCalledWith({
        toolId: 'registry.list_tools',
        params: {},
      });
    });

    it('surfaces backend error via ErrorDisplay with correlationId', async () => {
      // Arrange: Mock tool execution failure
      const mockError = {
        success: false,
        correlationId: 'corr-def456-fail',
        error: {
          code: 'EXECUTION_FAILED',
          message: 'Tool registry not initialized',
          severity: 'error',
        },
      };

      mockInvokeTool.mockResolvedValue(mockError);

      // Act: Render panel and invoke tool
      render(<ToolInvokePanel />);

      const runButton = screen.getByRole('button', { name: /run tool/i });
      fireEvent.click(runButton);

      // Assert: Error state rendered via ErrorDisplay
      await waitFor(() => {
        // Error message displayed
        expect(screen.getByText(/tool registry not initialized/i)).toBeInTheDocument();

        // correlationId displayed (may appear multiple times)
        expect(screen.getAllByText(/corr-def456-fail/).length).toBeGreaterThan(0);

        // Copy button present (from ErrorDisplay)
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
    });

    it('surfaces network error with client-generated correlationId', async () => {
      // Arrange: Mock network failure
      mockInvokeTool.mockRejectedValue(new TypeError('Failed to fetch'));

      // Act: Render panel and invoke tool
      render(<ToolInvokePanel />);

      const runButton = screen.getByRole('button', { name: /run tool/i });
      fireEvent.click(runButton);

      // Assert: Network error normalized to ErrorDisplay
      await waitFor(() => {
        // Error message from TypeError shown via ErrorDisplay
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();

        // Client-generated correlationId (net-* prefix) - may appear multiple times
        const correlationIds = screen.getAllByText(/net-/);
        expect(correlationIds.length).toBeGreaterThan(0);
      });
    });

    it('disables Run button while invocation is in-flight', async () => {
      // Arrange: Mock slow API call
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-slow',
                  result: { toolId: 'test', output: '{}' },
                }),
              100
            )
          )
      );

      // Act: Render panel and start invocation
      render(<ToolInvokePanel />);

      const runButton = screen.getByRole('button', { name: /run tool/i });
      fireEvent.click(runButton);

      // Assert: Button disabled during flight
      expect(runButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(runButton).not.toBeDisabled();
      });
    });

    it('shows loading state during tool invocation', async () => {
      // Arrange: Mock API call with delay
      mockInvokeTool.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  correlationId: 'corr-loading',
                  result: { toolId: 'test', output: '{}' },
                }),
              50
            )
          )
      );

      // Act: Render and invoke
      render(<ToolInvokePanel />);

      const runButton = screen.getByRole('button', { name: /run tool/i });
      fireEvent.click(runButton);

      // Assert: Loading indicator visible (multiple elements contain 'invoking')
      expect(screen.getAllByText(/invoking/i).length).toBeGreaterThan(0);

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/invoking tool/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('correlationId Copy-to-Clipboard', () => {
    it('renders copy button for successful responses', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        correlationId: 'corr-copy-test',
        result: { toolId: 'test', output: '{}' },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      // Act
      render(<ToolInvokePanel />);
      fireEvent.click(screen.getByRole('button', { name: /run tool/i }));

      // Assert
      await waitFor(() => {
        const copyButton = screen.getByRole('button', { name: /copy/i });
        expect(copyButton).toBeInTheDocument();
      });
    });
  });

  describe('Dev-Mode Trace Hints', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      // Restore original NODE_ENV after each test
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('shows trace query hint in dev mode', async () => {
      // Arrange: Set dev mode (Jest default is 'test', which getEnv() treats as DEV)
      process.env.NODE_ENV = 'development';

      const mockResponse = {
        success: true,
        correlationId: 'corr-dev-hint',
        result: { toolId: 'test', output: '{}' },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      // Act
      render(<ToolInvokePanel />);
      fireEvent.click(screen.getByRole('button', { name: /run tool/i }));

      // Assert: Trace query hint visible in dev mode
      await waitFor(() => {
        expect(screen.getByText(/pnpm run trace:query/)).toBeInTheDocument();
      });
    });

    it('hides trace query hint in production mode', async () => {
      // Arrange: Set production mode
      process.env.NODE_ENV = 'production';

      const mockResponse = {
        success: true,
        correlationId: 'corr-prod-no-hint',
        result: { toolId: 'test', output: '{}' },
      };

      mockInvokeTool.mockResolvedValue(mockResponse);

      // Act
      render(<ToolInvokePanel />);
      fireEvent.click(screen.getByRole('button', { name: /run tool/i }));

      // Assert: Trace hint hidden in production
      await waitFor(() => {
        expect(screen.queryByText(/pnpm run trace:query/)).not.toBeInTheDocument();

        // But correlationId still visible
        expect(screen.getByText(/corr-prod-no-hint/)).toBeInTheDocument();
      });
    });
  });
});
