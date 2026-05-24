import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../auth/authContextDef';
import { OperatorSessionButton } from '../OperatorSessionButton';

function LocationProbe() {
  const location = useLocation();
  return <span data-testid='location'>{location.pathname}</span>;
}

describe('OperatorSessionButton', () => {
  it('reveals sign out from profile and clears auth through AuthContext', () => {
    const logout = vi.fn();

    render(
      <MemoryRouter initialEntries={['/canon']}>
        <AuthContext.Provider
          value={{
            token: 'ACTIVE_TOKEN',
            isAuthenticated: true,
            login: vi.fn(),
            logout,
          }}
        >
          <OperatorSessionButton />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /profile/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));

    expect(logout).toHaveBeenCalledWith('operator-sign-out');
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });
});
