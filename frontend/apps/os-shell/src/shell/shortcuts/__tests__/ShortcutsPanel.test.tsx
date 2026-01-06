import { render, screen } from '@testing-library/react';
import { ShortcutsPanel } from '../ShortcutsPanel';

describe('ShortcutsPanel', () => {
  it('renders the shortcuts list', () => {
    render(<ShortcutsPanel />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    // Check for key categories
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Window Management')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('displays specific shortcuts', () => {
    render(<ShortcutsPanel />);

    // System
    expect(screen.getByText('Toggle Start Menu')).toBeInTheDocument();

    // Window
    expect(screen.getByText('Snap Left')).toBeInTheDocument();
    expect(screen.getByText('Snap Right')).toBeInTheDocument();

    // Navigation
    expect(screen.getByText('Launch App')).toBeInTheDocument();
  });

  it('renders key combinations correctly', () => {
    render(<ShortcutsPanel />);

    // Check for visual representation of keys
    const winKeys = screen.getAllByText('Win');
    expect(winKeys.length).toBeGreaterThan(0);

    const ctrlKeys = screen.getAllByText('Ctrl');
    expect(ctrlKeys.length).toBeGreaterThan(0);
  });
});
