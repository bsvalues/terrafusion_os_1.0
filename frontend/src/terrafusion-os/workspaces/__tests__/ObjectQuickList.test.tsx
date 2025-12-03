import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectQuickList } from '../ObjectQuickList';

const mockSetIntent = vi.fn();

vi.mock('../../core/state/OmniIntentContext', () => ({
  useOmniIntent: () => ({
    setIntent: mockSetIntent,
  }),
}));

describe('ObjectQuickList', () => {
  beforeEach(() => {
    mockSetIntent.mockReset();
  });

  it('fires object_selected intent with objectId when a row is clicked', async () => {
    const user = userEvent.setup();
    render(<ObjectQuickList />);

    const rows = screen.getAllByTestId('object-quick-list-row');
    await user.click(rows[0]);

    expect(mockSetIntent).toHaveBeenCalledWith('object_selected', { objectId: 'OBJ-001' });
  });
});
