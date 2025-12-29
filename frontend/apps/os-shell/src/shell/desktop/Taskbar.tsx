/**
 * TerraFusion OS Taskbar Component
 * 
 * Government-Grade Desktop Taskbar
 * Fixed position at bottom of screen with Start button, running apps, and system tray.
 * 
 * @module shell/desktop/Taskbar
 * @see SUCCESS CRITERIA SC-2
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useDesktopStore } from '../../stores/desktopStore';
import { useStartMenuStore } from '../../stores/startMenuStore';
import { brandColors, semanticColors, gradients } from '@/design-system/tokens/colors';

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * TerraFusion Start Button
 */
const StartButton: React.FC = () => {
  const { isOpen, toggle } = useStartMenuStore();

  return (
    <button
      onClick={toggle}
      aria-label="Start Menu"
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className={cn(
        // Base styles
        'flex items-center justify-center',
        'w-12 h-10 rounded-md',
        'transition-all duration-200 ease-out',
        // Focus states
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        // Hover state
        'hover:bg-white/10',
        // Active/pressed state
        isOpen && 'bg-white/15 shadow-[0_0_20px_rgba(0,255,238,0.3)]'
      )}
    >
      {/* TerraFusion Logo */}
      <div
        className={cn(
          'w-7 h-7 rounded-md',
          'flex items-center justify-center',
          'font-bold text-sm',
          'bg-gradient-to-br from-[#0099ff] to-[#00ffee]',
          'text-[#0a0e1a]',
          'shadow-[0_0_10px_rgba(0,153,255,0.5)]',
          'transition-transform duration-200',
          isOpen && 'scale-110'
        )}
      >
        TF
      </div>
    </button>
  );
};

/**
 * Taskbar App Button for running windows
 */
interface TaskbarAppButtonProps {
  windowId: string;
  title: string;
  icon: string;
  isActive: boolean;
  isMinimized: boolean;
  onClick: () => void;
}

const TaskbarAppButton: React.FC<TaskbarAppButtonProps> = ({
  windowId,
  title,
  icon,
  isActive,
  isMinimized,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      aria-pressed={isActive}
      data-minimized={isMinimized}
      className={cn(
        // Base styles
        'flex items-center gap-2 px-3 h-10',
        'max-w-[180px] min-w-[100px]',
        'rounded-md',
        'transition-all duration-150 ease-out',
        // Text styles
        'text-sm text-white/90 truncate',
        // Focus states
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffee] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        // Hover state
        'hover:bg-white/10',
        // Active window indicator
        isActive && [
          'bg-white/15',
          'border-b-2 border-[#00ffee]',
          'shadow-[0_2px_10px_rgba(0,255,238,0.3)]',
        ],
        // Minimized state (dimmed)
        isMinimized && !isActive && 'opacity-60'
      )}
    >
      <span className="text-lg flex-shrink-0" role="img" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{title}</span>
    </button>
  );
};

/**
 * Running Apps Section
 */
const RunningAppsBar: React.FC = () => {
  const { windows, activeWindowId, focusWindow } = useDesktopStore();

  const handleAppClick = (windowId: string) => {
    focusWindow(windowId);
  };

  return (
    <div
      data-testid="running-apps"
      className="flex items-center gap-1 flex-1 min-w-0 px-2"
      role="group"
      aria-label="Running applications"
    >
      {windows.map((window) => (
        <TaskbarAppButton
          key={window.id}
          windowId={window.id}
          title={window.title}
          icon={window.icon}
          isActive={window.id === activeWindowId}
          isMinimized={window.state === 'minimized'}
          onClick={() => handleAppClick(window.id)}
        />
      ))}
    </div>
  );
};

/**
 * Clock Display
 */
const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      data-testid="clock"
      className="flex flex-col items-end text-right px-2"
    >
      <span className="text-sm text-white/90 font-medium">{formattedTime}</span>
      <span className="text-xs text-white/60">{formattedDate}</span>
    </div>
  );
};

/**
 * AI Status Indicator
 */
const AIStatusIndicator: React.FC = () => {
  return (
    <div
      data-testid="ai-status"
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        'bg-gradient-to-r from-[#00ffee]/10 to-transparent',
        'hover:bg-white/5 cursor-pointer',
        'transition-colors duration-150'
      )}
      title="AI Swarm Status: 1,008 agents active"
    >
      <div className="relative">
        <span className="text-lg">🧠</span>
        {/* Pulse indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#00ffaa] rounded-full animate-pulse" />
      </div>
      <span className="text-xs text-[#00ffee] font-medium hidden sm:inline">1,008</span>
    </div>
  );
};

/**
 * System Health Indicator
 */
const SystemHealthIndicator: React.FC = () => {
  return (
    <div
      data-testid="system-health"
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        'hover:bg-white/5 cursor-pointer',
        'transition-colors duration-150'
      )}
      title="System Health: Optimal"
    >
      <span className="w-2 h-2 bg-[#00ffaa] rounded-full shadow-[0_0_6px_rgba(0,255,170,0.6)]" />
      <span className="text-xs text-white/70 hidden sm:inline">Healthy</span>
    </div>
  );
};

/**
 * System Tray
 */
const SystemTray: React.FC = () => {
  return (
    <div
      data-testid="system-tray"
      className="flex items-center gap-1 border-l border-white/10 pl-3"
      role="group"
      aria-label="System tray"
    >
      <AIStatusIndicator />
      <SystemHealthIndicator />
      <Clock />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface TaskbarProps {
  className?: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({ className }) => {
  return (
    <nav
      role="navigation"
      aria-label="Taskbar"
      className={cn(
        // Position
        'fixed bottom-0 left-0 right-0 z-50',
        // Size
        'h-12', // 48px
        // Background with glass effect
        'bg-[#0a0e1a]/80 backdrop-blur-xl',
        // Border
        'border-t border-[#00ffee]/20',
        // Shadow
        'shadow-[0_-4px_20px_rgba(0,0,0,0.5),0_0_40px_rgba(0,255,238,0.1)]',
        // Layout
        'flex items-center px-1',
        className
      )}
    >
      {/* Start Button */}
      <StartButton />
      
      {/* Divider */}
      <div className="w-px h-8 bg-white/10 mx-1" />
      
      {/* Running Apps */}
      <RunningAppsBar />
      
      {/* System Tray */}
      <SystemTray />
    </nav>
  );
};

export default Taskbar;
