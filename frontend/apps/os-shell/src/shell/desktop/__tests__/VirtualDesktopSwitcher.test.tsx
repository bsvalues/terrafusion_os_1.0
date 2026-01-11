import { fireEvent, render, screen } from '@testing-library/react';
import { useVirtualDesktops } from '../../../stores/desktopStore';
import { VirtualDesktopSwitcher } from '../VirtualDesktopSwitcher';

// Mock the store
jest.mock('../../../stores/desktopStore', () => {
  const actual = jest.requireActual('../../../stores/desktopStore');
  return {
    ...actual,
    useVirtualDesktops: jest.fn(),
  };
});

describe('VirtualDesktopSwitcher', () => {
  const mockAddDesktop = jest.fn();
  const mockRemoveDesktop = jest.fn();
  const mockSwitchDesktop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useVirtualDesktops as jest.Mock).mockReturnValue({
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
    render(<VirtualDesktopSwitcher isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders desktops when open', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Desktop 1')).toBeInTheDocument();
    expect(screen.getByText('Desktop 2')).toBeInTheDocument();
  });

  it('highlights current desktop', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={jest.fn()} />);
    const desktop1 = screen.getByText('Desktop 1').closest('div');
    expect(desktop1?.parentElement).toHaveClass('border-[var(--tf-transcend-highlight)]');
  });

  it('switches desktop on click', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByText('Desktop 2'));
    expect(mockSwitchDesktop).toHaveBeenCalledWith('desktop-2');
  });

  it('adds new desktop', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTitle('New Desktop'));
    expect(mockAddDesktop).toHaveBeenCalled();
  });

  it('removes desktop', () => {
    render(<VirtualDesktopSwitcher isOpen={true} onClose={jest.fn()} />);
    const removeButtons = screen.getAllByTitle('Remove Desktop');
    fireEvent.click(removeButtons[0]);
    expect(mockRemoveDesktop).toHaveBeenCalledWith('desktop-1');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<VirtualDesktopSwitcher isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
