import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ModuleRenderer from '../moduleComponents';
import type { DesktopWindow } from '../../stores/desktopStore';

vi.mock('../../pages/forge/county-studio/CountyStudyPage', () => ({
  CountyStudyPage: () => <div data-testid="county-study-page">County Studio</div>,
}));
vi.mock('../../pages/forge/atlas-live/AtlasLivePage', () => ({
  AtlasLivePage: () => <div data-testid="atlas-live-page">Atlas Live</div>,
}));
vi.mock('../../pages/suites/ForgeSuiteHome', () => ({
  default: ({ metadata }: { metadata?: Record<string, unknown> }) => (
    <div data-testid="forge-suite-home">
      {String(metadata?.countyCode ?? 'missing-county')}
    </div>
  ),
}));

const makeModule = (id: string) => ({
  id,
  moduleId: id,
  title: id,
  state: 'normal' as const,
  position: { x: 0, y: 0 },
  size: { width: 800, height: 600 },
  zIndex: 1,
  isActive: true,
  icon: '',
  desktopId: 'desktop-1',
});

describe('ModuleRenderer — county-studio and atlas-live-view', () => {
  it('renders CountyStudyPage for county-studio', async () => {
    render(<ModuleRenderer module={makeModule('county-studio') as any} />);
    expect(await screen.findByTestId('county-study-page')).toBeInTheDocument();
  });

  it('renders AtlasLivePage for atlas-live-view', async () => {
    render(<ModuleRenderer module={makeModule('atlas-live-view') as any} />);
    expect(await screen.findByTestId('atlas-live-page')).toBeInTheDocument();
  });

  it('forwards Counties Hub metadata into the TerraForge suite home', async () => {
    render(
      <ModuleRenderer
        module={makeModule('suite-forge') as any}
        metadata={{ countyCode: '063' }}
      />,
    );

    expect(await screen.findByTestId('forge-suite-home')).toHaveTextContent('063');
  });
});
