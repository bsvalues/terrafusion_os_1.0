import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { AtlasLivePage } from '../AtlasLivePage';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';

// GeoForgeV2Map requires Mapbox GL JS + canvas — not available in jsdom
// Since AtlasMapSurface catches the require error, mock-map div is rendered automatically
// No explicit vi.mock needed

describe('AtlasLivePage', () => {
  it('renders the Atlas Live View header', () => {
    render(<AtlasLivePage />);
    expect(screen.getByText(/Atlas Live View/i)).toBeInTheDocument();
  });

  it('renders the sync badge', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-sync-badge')).toBeInTheDocument();
  });

  it('renders the map surface placeholder', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-map-surface')).toBeInTheDocument();
  });

  it('renders the toolbar', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-toolbar')).toBeInTheDocument();
  });

  it('Lasso tool button toggles lasso mode in store', () => {
    act(() => {
      useAtlasLiveStore.getState().setActiveTool('none');
    });
    render(<AtlasLivePage />);
    const lassoBtn = screen.getByRole('button', { name: /Lasso/i });
    fireEvent.click(lassoBtn);
    expect(useAtlasLiveStore.getState().activeTool).toBe('lasso');
  });
});
