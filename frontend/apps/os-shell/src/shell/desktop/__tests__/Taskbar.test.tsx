/**
 * TerraFusion OS Taskbar Component Tests
 * 
 * Government-Grade Desktop Taskbar
 * Tests for the main taskbar at bottom of desktop.
 * 
 * @module shell/desktop/__tests__/Taskbar.test
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Taskbar } from '../Taskbar';
import { useDesktopStore } from '../../../stores/desktopStore';
import { useStartMenuStore } from '../../../stores/startMenuStore';

// Reset stores before each test
beforeEach(() => {
  useDesktopStore.setState({
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
  });
  useStartMenuStore.setState({
    isOpen: false,
    searchQuery: '',
    modules: [],
  });
});

describe('Taskbar Component', () => {
  
  describe('Rendering', () => {
    it('renders taskbar at bottom of screen', () => {
      render(<Taskbar />);
      
      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      expect(taskbar).toBeInTheDocument();
    });

    it('has fixed position styling', () => {
      render(<Taskbar />);
      
      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      expect(taskbar).toHaveClass('fixed', 'bottom-0');
    });

    it('has correct height (48px)', () => {
      render(<Taskbar />);
      
      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      expect(taskbar).toHaveClass('h-12'); // h-12 = 48px
    });

    it('uses TerraFusion design tokens (glass effect)', () => {
      render(<Taskbar />);
      
      const taskbar = screen.getByRole('navigation', { name: /taskbar/i });
      // Should have glass morphism classes
      expect(taskbar).toHaveClass('backdrop-blur-xl');
    });
  });

  describe('Start Button', () => {
    it('renders start button with TerraFusion logo', () => {
      render(<Taskbar />);
      
      const startButton = screen.getByRole('button', { name: /start menu/i });
      expect(startButton).toBeInTheDocument();
    });

    it('toggles Start Menu when clicked', async () => {
      const user = userEvent.setup();
      render(<Taskbar />);
      
      const startButton = screen.getByRole('button', { name: /start menu/i });
      
      // Initially closed
      expect(useStartMenuStore.getState().isOpen).toBe(false);
      
      // Click to open
      await user.click(startButton);
      expect(useStartMenuStore.getState().isOpen).toBe(true);
      
      // Click to close
      await user.click(startButton);
      expect(useStartMenuStore.getState().isOpen).toBe(false);
    });

    it('shows visual indicator when Start Menu is open', () => {
      useStartMenuStore.setState({ isOpen: true });
      render(<Taskbar />);
      
      const startButton = screen.getByRole('button', { name: /start menu/i });
      expect(startButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper focus styles for accessibility', () => {
      render(<Taskbar />);
      
      const startButton = screen.getByRole('button', { name: /start menu/i });
      startButton.focus();
      
      // Should have visible focus ring
      expect(document.activeElement).toBe(startButton);
    });
  });

  describe('Running Apps Section', () => {
    it('renders running apps container', () => {
      render(<Taskbar />);
      
      const runningApps = screen.getByTestId('running-apps');
      expect(runningApps).toBeInTheDocument();
    });

    it('shows no apps when no windows are open', () => {
      render(<Taskbar />);
      
      const runningApps = screen.getByTestId('running-apps');
      const buttons = within(runningApps).queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('shows app button for each open window', () => {
      // Open some windows
      useDesktopStore.getState().openWindow({
        moduleId: 'module-1',
        title: 'Module 1',
        icon: '📊',
      });
      useDesktopStore.getState().openWindow({
        moduleId: 'module-2',
        title: 'Module 2',
        icon: '📈',
      });
      
      render(<Taskbar />);
      
      const runningApps = screen.getByTestId('running-apps');
      const buttons = within(runningApps).getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('displays window title on app button', () => {
      useDesktopStore.getState().openWindow({
        moduleId: 'government-edition',
        title: 'Government Edition',
        icon: '🏛️',
      });
      
      render(<Taskbar />);
      
      expect(screen.getByText('Government Edition')).toBeInTheDocument();
    });

    it('displays window icon on app button', () => {
      useDesktopStore.getState().openWindow({
        moduleId: 'government-edition',
        title: 'Government Edition',
        icon: '🏛️',
      });
      
      render(<Taskbar />);
      
      expect(screen.getByText('🏛️')).toBeInTheDocument();
    });

    it('highlights active window button', () => {
      const windowId = useDesktopStore.getState().openWindow({
        moduleId: 'module-1',
        title: 'Module 1',
        icon: '📊',
      });
      
      render(<Taskbar />);
      
      const activeButton = screen.getByRole('button', { name: /module 1/i });
      expect(activeButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('focuses window when app button is clicked', async () => {
      const user = userEvent.setup();
      
      const window1Id = useDesktopStore.getState().openWindow({
        moduleId: 'module-1',
        title: 'Module 1',
        icon: '📊',
      });
      const window2Id = useDesktopStore.getState().openWindow({
        moduleId: 'module-2',
        title: 'Module 2',
        icon: '📈',
      });
      
      render(<Taskbar />);
      
      // window2 is active
      expect(useDesktopStore.getState().activeWindowId).toBe(window2Id);
      
      // Click on module 1 button
      const module1Button = screen.getByRole('button', { name: /module 1/i });
      await user.click(module1Button);
      
      // window1 should now be active
      expect(useDesktopStore.getState().activeWindowId).toBe(window1Id);
    });

    it('restores minimized window when its button is clicked', async () => {
      const user = userEvent.setup();
      
      const windowId = useDesktopStore.getState().openWindow({
        moduleId: 'module-1',
        title: 'Module 1',
        icon: '📊',
      });
      useDesktopStore.getState().minimizeWindow(windowId);
      
      render(<Taskbar />);
      
      const window = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(window?.state).toBe('minimized');
      
      // Click on the taskbar button
      const module1Button = screen.getByRole('button', { name: /module 1/i });
      await user.click(module1Button);
      
      // Window should be restored
      const updatedWindow = useDesktopStore.getState().windows.find(w => w.id === windowId);
      expect(updatedWindow?.state).toBe('normal');
    });

    it('shows visual indicator for minimized windows', () => {
      const windowId = useDesktopStore.getState().openWindow({
        moduleId: 'module-1',
        title: 'Module 1',
        icon: '📊',
      });
      useDesktopStore.getState().minimizeWindow(windowId);
      
      render(<Taskbar />);
      
      const module1Button = screen.getByRole('button', { name: /module 1/i });
      expect(module1Button).toHaveAttribute('data-minimized', 'true');
    });
  });

  describe('System Tray', () => {
    it('renders system tray section', () => {
      render(<Taskbar />);
      
      const systemTray = screen.getByTestId('system-tray');
      expect(systemTray).toBeInTheDocument();
    });

    it('displays current time', () => {
      render(<Taskbar />);
      
      // Should show time in HH:MM format
      const timeDisplay = screen.getByTestId('clock');
      expect(timeDisplay).toBeInTheDocument();
      expect(timeDisplay.textContent).toMatch(/\d{1,2}:\d{2}/);
    });

    it('displays AI agent status indicator', () => {
      render(<Taskbar />);
      
      const aiStatus = screen.getByTestId('ai-status');
      expect(aiStatus).toBeInTheDocument();
    });

    it('displays system health indicator', () => {
      render(<Taskbar />);
      
      const healthIndicator = screen.getByTestId('system-health');
      expect(healthIndicator).toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('is keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<Taskbar />);
      
      // Tab to start button
      await user.tab();
      expect(screen.getByRole('button', { name: /start menu/i })).toHaveFocus();
    });

    it('opens Start Menu with keyboard (Enter)', async () => {
      const user = userEvent.setup();
      render(<Taskbar />);
      
      const startButton = screen.getByRole('button', { name: /start menu/i });
      startButton.focus();
      
      await user.keyboard('{Enter}');
      
      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });

    it('opens Start Menu with keyboard (Space)', async () => {
      const user = userEvent.setup();
      render(<Taskbar />);
      
      const startButton = screen.getByRole('button', { name: /start menu/i });
      startButton.focus();
      
      await user.keyboard(' ');
      
      expect(useStartMenuStore.getState().isOpen).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('truncates long window titles', () => {
      useDesktopStore.getState().openWindow({
        moduleId: 'module-1',
        title: 'This Is A Very Long Module Title That Should Be Truncated',
        icon: '📊',
      });
      
      render(<Taskbar />);
      
      const button = screen.getByRole('button', { name: /this is a very long/i });
      expect(button).toHaveClass('truncate');
    });
  });
});
