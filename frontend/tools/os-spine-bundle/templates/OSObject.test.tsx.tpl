/**
 * __OS_OBJECT_NAME__ Tests
 *
 * Tests for the __OS_OBJECT_ID__ OS object.
 * Verifies intent spine integration and rendering.
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __OS_OBJECT_NAME__ } from '../__OS_OBJECT_NAME__';

// Mock the OmniIntent context
const mockEmitIntent = vi.fn();

vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => ({
    emitIntent: mockEmitIntent,
    rightRail: null,
    setRightRail: vi.fn(),
  }),
}));

describe('__OS_OBJECT_NAME__', () => {
  beforeEach(() => {
    mockEmitIntent.mockClear();
  });

  it('renders with correct test id', () => {
    render(<__OS_OBJECT_NAME__ workspaceId="home" />);
    expect(screen.getByTestId('__OS_OBJECT_ID__')).toBeInTheDocument();
  });

  it('displays the component name', () => {
    render(<__OS_OBJECT_NAME__ workspaceId="home" />);
    expect(screen.getByText('__OS_OBJECT_NAME__')).toBeInTheDocument();
  });

  it('emits object_selected intent on click', () => {
    render(<__OS_OBJECT_NAME__ workspaceId="test-workspace" />);

    fireEvent.click(screen.getByTestId('__OS_OBJECT_ID__'));

    expect(mockEmitIntent).toHaveBeenCalledTimes(1);
    expect(mockEmitIntent).toHaveBeenCalledWith('object_selected', {
      workspaceId: 'test-workspace',
      objectId: '__OS_OBJECT_ID__',
      objectType: '__OS_OBJECT_NAME__',
    });
  });

  it('emits object_selected intent on Enter key', () => {
    render(<__OS_OBJECT_NAME__ workspaceId="test-workspace" />);

    fireEvent.keyDown(screen.getByTestId('__OS_OBJECT_ID__'), { key: 'Enter' });

    expect(mockEmitIntent).toHaveBeenCalledTimes(1);
    expect(mockEmitIntent).toHaveBeenCalledWith('object_selected', {
      workspaceId: 'test-workspace',
      objectId: '__OS_OBJECT_ID__',
      objectType: '__OS_OBJECT_NAME__',
    });
  });

  it('emits object_selected intent on Space key', () => {
    render(<__OS_OBJECT_NAME__ workspaceId="test-workspace" />);

    fireEvent.keyDown(screen.getByTestId('__OS_OBJECT_ID__'), { key: ' ' });

    expect(mockEmitIntent).toHaveBeenCalledTimes(1);
  });

  it('renders without workspaceId', () => {
    render(<__OS_OBJECT_NAME__ />);
    expect(screen.getByTestId('__OS_OBJECT_ID__')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('__OS_OBJECT_ID__'));

    expect(mockEmitIntent).toHaveBeenCalledWith('object_selected', {
      workspaceId: undefined,
      objectId: '__OS_OBJECT_ID__',
      objectType: '__OS_OBJECT_NAME__',
    });
  });

  it('has accessible role and tabIndex', () => {
    render(<__OS_OBJECT_NAME__ workspaceId="home" />);
    const element = screen.getByTestId('__OS_OBJECT_ID__');

    expect(element).toHaveAttribute('role', 'button');
    expect(element).toHaveAttribute('tabIndex', '0');
  });
});
