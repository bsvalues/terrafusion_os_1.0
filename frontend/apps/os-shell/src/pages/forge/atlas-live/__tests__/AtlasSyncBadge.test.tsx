import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { AtlasSyncBadge } from '../components/AtlasSyncBadge';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';

describe('AtlasSyncBadge', () => {
  it('shows DISCONNECTED state', () => {
    act(() => {
      useAtlasLiveStore.getState().setSyncState('DISCONNECTED');
    });
    render(<AtlasSyncBadge />);
    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('shows LIVE state', () => {
    act(() => {
      useAtlasLiveStore.getState().setSyncState('LIVE');
    });
    render(<AtlasSyncBadge />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('shows STAGED state', () => {
    act(() => {
      useAtlasLiveStore.getState().setSyncState('STAGED');
    });
    render(<AtlasSyncBadge />);
    expect(screen.getByText('STAGED')).toBeInTheDocument();
  });

  it('shows SNAPSHOT state', () => {
    act(() => {
      useAtlasLiveStore.getState().setSyncState('SNAPSHOT');
    });
    render(<AtlasSyncBadge />);
    expect(screen.getByText('SNAPSHOT')).toBeInTheDocument();
  });
});
