import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import PropertyForge from '../../pages/workbench/tabs/PropertyForge';

const TestWrapper: React.FC<{ parcelId: string }> = ({ parcelId }) => (
  <MemoryRouter initialEntries={[`/property/${parcelId}/forge`]}>
    <Routes>
      <Route
        path="/property/:parcelId"
        element={<Outlet context={{ parcelId }} />}
      >
        <Route path="forge" element={<PropertyForge />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

describe('PropertyForge income hosting', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reveals the real income sub-tab surface when the income tab is selected', async () => {
    render(<TestWrapper parcelId="12345-001" />);

    fireEvent.click(screen.getByRole('tab', { name: /income/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /quick income valuation/i })).toBeInTheDocument();
      expect(screen.getByText(/income approach: 12345-001/i)).toBeInTheDocument();
    });
  });
});
