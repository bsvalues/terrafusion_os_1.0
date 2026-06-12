/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PropertyWorkbench from '../../pages/workbench/PropertyWorkbench';
import { useDesktopStore } from '../../stores/desktopStore';

vi.mock('../../stores/moduleLoaderStore', () => ({
  useModuleLoaderStore: {
    getState: () => ({
      loadModule: vi.fn(() => Promise.resolve()),
    }),
  },
}));

vi.mock('../../stores/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      addNotification: vi.fn(),
    }),
  },
}));

describe('PropertyWorkbench route activation contract', () => {
  beforeEach(() => {
    useDesktopStore.setState({
      windows: [],
      activeWindowId: null,
      nextZIndex: 1,
      snapPreview: null,
      currentDesktopId: 'desktop-1',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('direct parcel deep-link opens the canonical Workbench window before normalizing home', async () => {
    render(
      <MemoryRouter initialEntries={['/property/101040000000000/forge']}>
        <Routes>
          <Route path="/" element={<div data-testid="os-home">TerraFusion OS</div>} />
          <Route path="/property/:parcelId/*" element={<PropertyWorkbench />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('os-home')).toBeInTheDocument();
    });

    const { windows, activeWindowId } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      moduleId: 'property-workbench',
      metadata: { parcelId: '101040000000000', tabId: 'forge' },
      state: 'normal',
    });
    expect(activeWindowId).toBe(windows[0].id);
  });

  it('direct parcel deep-link keeps the Workbench visible under React StrictMode double effects', async () => {
    render(
      <React.StrictMode>
        <MemoryRouter initialEntries={['/property/101040000000000/forge']}>
          <Routes>
            <Route path="/" element={<div data-testid="os-home">TerraFusion OS</div>} />
            <Route path="/property/:parcelId/*" element={<PropertyWorkbench />} />
          </Routes>
        </MemoryRouter>
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('os-home')).toBeInTheDocument();
    });

    const { windows } = useDesktopStore.getState();
    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      moduleId: 'property-workbench',
      metadata: { parcelId: '101040000000000', tabId: 'forge' },
      state: 'normal',
    });
  });
});
