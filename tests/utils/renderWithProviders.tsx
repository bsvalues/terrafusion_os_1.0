import React from 'react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import compGrid from '../../apps/ui/src/store/compGrid/slice';
import {SessionProvider} from 'next-auth/react';
import {render} from '@testing-library/react';

export function renderWithProviders(ui: React.ReactElement, preloadedState?: any) {const store = configureStore({ reducer: { compGrid}, preloadedState });
  return {
    store,
    ...render(
      <SessionProvider session={null}><Provider store={store}>{ui}</Provider></SessionProvider>
    ),
  };
}
