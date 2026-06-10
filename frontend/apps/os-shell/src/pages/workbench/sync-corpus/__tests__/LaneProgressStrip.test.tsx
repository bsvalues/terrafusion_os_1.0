/**
 * SYNC-UX-1C: LaneProgressStrip tests.
 */

import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import LaneProgressStrip from '../LaneProgressStrip';
import { LaneOrder, type LaneName } from '@/api/syncCorpus';
import { makeLanes } from './testHelpers';

function Wrapper({
  lanes,
}: {
  lanes: ReturnType<typeof makeLanes>;
}) {
  const [selected, setSelected] = useState<LaneName | null>(null);
  return (
    <LaneProgressStrip
      lanes={lanes}
      selectedLane={selected}
      onSelectLane={setSelected}
    />
  );
}

describe('LaneProgressStrip', () => {
  it('renders all six lanes in canonical order', () => {
    render(<Wrapper lanes={makeLanes()} />);
    LaneOrder.forEach((lane) => {
      expect(screen.getByTestId(`lane-pill-${lane}`)).toBeInTheDocument();
    });
    const pills = screen.getAllByTestId(/^lane-pill-/);
    const order = pills.map((p) => p.getAttribute('data-lane'));
    expect(order).toEqual([...LaneOrder]);
  });

  it('marks the running lane with data-running="true"', () => {
    const lanes = makeLanes({ improvement: { status: 'Running' } });
    render(<Wrapper lanes={lanes} />);
    const running = screen.getByTestId('lane-pill-improvement');
    expect(running.getAttribute('data-running')).toBe('true');
    expect(running.getAttribute('data-lane-status')).toBe('Running');
  });

  it('expands the lane detail panel when clicked', () => {
    const lanes = makeLanes({
      parcel: {
        status: 'Completed',
        countsJson: JSON.stringify({ rowsLanded: 89247 }),
      },
    });
    const onSelect = vi.fn();
    render(
      <LaneProgressStrip
        lanes={lanes}
        selectedLane={null}
        onSelectLane={onSelect}
      />,
    );
    fireEvent.click(screen.getByTestId('lane-pill-parcel'));
    expect(onSelect).toHaveBeenCalledWith('parcel');
  });
});
