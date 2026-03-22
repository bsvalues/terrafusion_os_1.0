import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkbenchSourceBadge } from '../../components/workbench/WorkbenchSourceBadge';

describe('WorkbenchSourceBadge', () => {
  it('renders Live badge for live source', () => {
    render(<WorkbenchSourceBadge source="live" />);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Live');
    expect(badge).toHaveAttribute('data-source', 'live');
  });

  it('renders Demo data badge for fallback source', () => {
    render(<WorkbenchSourceBadge source="fallback" />);
    const badge = screen.getByTestId('workbench-source-badge');
    expect(badge).toHaveTextContent('Demo data');
    expect(badge).toHaveAttribute('data-source', 'fallback');
  });

  it('renders Unavailable badge for unavailable source', () => {
    render(<WorkbenchSourceBadge source="unavailable" />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveTextContent('Unavailable');
  });

  it('renders partial label with field counts', () => {
    render(<WorkbenchSourceBadge source="partial" liveFields={3} totalFields={8} />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveTextContent(
      'Partial — 3 of 8 fields live',
    );
  });

  it('renders partial label without counts when counts omitted', () => {
    render(<WorkbenchSourceBadge source="partial" />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveTextContent('Partial');
  });

  it('accepts className prop', () => {
    render(<WorkbenchSourceBadge source="live" className="ml-2" />);
    expect(screen.getByTestId('workbench-source-badge')).toHaveClass('ml-2');
  });
});
