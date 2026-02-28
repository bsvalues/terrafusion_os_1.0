/**
 * SceneSelector Tests — Phase 8 Context Mode
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock LiquidPanel
jest.mock('../../../ui/materials', () => ({
  LiquidPanel: ({ children, ...props }: any) => (
    <div data-testid='liquid-panel' {...props}>
      {children}
    </div>
  ),
}));

// Mock activateModule
const mockActivateModule = jest.fn();
jest.mock('../../../orchestration/moduleActivation', () => ({
  activateModule: (...args: any[]) => mockActivateModule(...args),
}));

import SceneSelector from '../SceneSelector';
import { useSceneStore, SCENE_LIBRARY } from '../../../stores/sceneStore';

describe('SceneSelector', () => {
  const mockClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useSceneStore.setState({ activeSceneId: null });
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <SceneSelector isOpen={false} onClose={mockClose} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the panel when open', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Scenes')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Scene Selector');
  });

  it('shows all scene labels', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    for (const scene of SCENE_LIBRARY) {
      expect(screen.getByText(scene.label)).toBeInTheDocument();
    }
  });

  it('shows category group headings', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    expect(screen.getByText('Valuation')).toBeInTheDocument();
    expect(screen.getByText('Intake')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('calls activateModule for each window on scene click', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    const ingestionBtn = screen.getByText('Ingestion Gate').closest('button')!;
    fireEvent.click(ingestionBtn);

    const ingestionScene = SCENE_LIBRARY.find((s) => s.id === 'ingestion-gate')!;
    expect(mockActivateModule).toHaveBeenCalledTimes(ingestionScene.windows.length);
    for (const w of ingestionScene.windows) {
      expect(mockActivateModule).toHaveBeenCalledWith(w.moduleId, expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({ scene: 'ingestion-gate' }),
      }));
    }
  });

  it('calls onClose after activating a scene', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    fireEvent.click(screen.getByText('Ratio Study').closest('button')!);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    const backdrop = document.querySelector('.scene-backdrop')!;
    fireEvent.click(backdrop);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('has a close button', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    const closeBtn = screen.getByLabelText('Close scene selector');
    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('shows window count per scene', () => {
    render(<SceneSelector isOpen={true} onClose={mockClose} />);
    expect(screen.getAllByText(/^\d+ windows?$/).length).toBeGreaterThan(0);
  });
});
