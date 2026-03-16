import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useVirtualDesktops } from '../../../stores/desktopStore';
import { VirtualDesktopSwitcher } from '../VirtualDesktopSwitcher';

// Mock the store
vi.mock('../../../stores/desktopStore', async () => {
  const actual = await vi.importActual('../../../stores/desktopStore');
  return {
    ...actual,
    useVirtualDesktops: vi.fn(),
  };
});

describe('VirtualDesktopSwitcher', () => {
  const mockAddDesktop = vi.fn();
  const mockRemoveDesktop = vi.fn();
  const mockSwitchDesktop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useVirtualDesktops as vi.Mock).mockReturnValue({
      currentDesktopId: 'desktop-1',
      desktops: [
        { id: 'desktop-1', name: 'Desktop 1' },
        { id: 'desktop-2', name: 'Desktop 2' },
      ],
      addDesktop: mockAddDesktop,
      removeDesktop: mockRemoveDesktop,
      switchDesktop: mockSwitchDesktop,
    });
  });

  it('renders nothing when closed', () => {
    render(<VirtualDesktopSwitcher isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders desktops when open', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Desktop 1')).toBeInTheDocument();
    expect(screen.getByText('Desktop 2')).toBeInTheDocument();
  });

  it('highlights current desktop', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={vi.fn()} />);
    const desktop1 = screen.getByTestId('desktop-tile-desktop-1');
    expect(desktop1).toHaveAttribute('aria-selected', 'true');
  });

  it('switches desktop on click', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Desktop 2'));
    expect(mockSwitchDesktop).toHaveBeenCalledWith('desktop-2');
  });

  it('adds new desktop', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTitle('New Desktop'));
    expect(mockAddDesktop).toHaveBeenCalled();
  });

  it('removes desktop', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={vi.fn()} />);
    const removeButtons = screen.getAllByTitle('Remove Desktop');
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveDesktop).toHaveBeenCalledWith('desktop-1');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<VirtualDesktopSwitcher isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
