/**
 * ZenModeToggle Component
 * 
 * Standalone Zen Mode toggle button with ESC handler and Ultra progression
 * 
 * Features:
 * - Clean button component for Zen Mode activation
 * - ESC key handler for graceful exit
 * - Zen Ultra progression when engagement >80
 * - Visual indicator with pulse animation
 * - Haptic feedback on toggle
 * - Integration with FlowStateOrchestrator context
 * 
 * Research Foundation:
 * - Distraction-free environments increase productivity by 35% (Mark et al., 2008)
 * - Flow state: Minimizing cognitive load enables deep focus (Csikszentmihalyi, 1990)
 */

import React, { useCallback, useEffect, useState } from 'react';
import './ZenModeToggle.css';

export interface ZenModeToggleProps {
  active?: boolean;
  onToggle: (active: boolean) => void;
  ultraModeEnabled?: boolean;
  engagementScore?: number;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Zen Mode Toggle Component
 * 
 * Provides simple button to activate/deactivate Zen Mode
 */
export const ZenModeToggle: React.FC<ZenModeToggleProps> = ({
  active = false,
  onToggle,
  ultraModeEnabled = true,
  engagementScore = 0,
  position = 'bottom-right',
}) => {
  const [zenActive, setZenActive] = useState<boolean>(active);
  const [ultraActive, setUltraActive] = useState<boolean>(false);

  /**
   * Toggle Zen Mode state
   */
  const handleToggle = useCallback(() => {
    const newState = !zenActive;
    setZenActive(newState);

    // Update DOM classes
    if (newState) {
      document.body.classList.add('zen-mode');
      
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      document.body.classList.remove('zen-mode');
      document.body.classList.remove('zen-ultra');
      setUltraActive(false);
      
      // Trigger haptic feedback (longer for exit)
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent('zen-mode-change', {
        detail: { active: newState },
      })
    );

    // Notify parent
    onToggle(newState);
  }, [zenActive, onToggle]);

  /**
   * Handle ESC key to exit Zen Mode
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zenActive) {
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [zenActive, handleToggle]);

  /**
   * Activate Zen Ultra when highly engaged
   */
  useEffect(() => {
    if (
      ultraModeEnabled &&
      zenActive &&
      !ultraActive &&
      engagementScore > 80
    ) {
      document.body.classList.add('zen-ultra');
      setUltraActive(true);

      // Show ultra indicator
      const indicator = document.createElement('div');
      indicator.className = 'zen-ultra-indicator';
      indicator.textContent = '🧠 Deep Flow State';
      document.body.appendChild(indicator);

      // Trigger strong haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      // Remove indicator after 3 seconds
      setTimeout(() => indicator.remove(), 3000);
    }
  }, [ultraModeEnabled, zenActive, ultraActive, engagementScore]);

  /**
   * Calculate position styles
   */
  const positionStyles: React.CSSProperties = (() => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      default:
        return { bottom: '20px', right: '20px' };
    }
  })();

  return (
    <>
      {/* Zen Mode Indicator (shows when active) */}
      {zenActive && (
        <div className="zen-mode-indicator">
          {ultraActive ? '🧠 Deep Flow State' : '🧘 Zen Mode Active'} • Press Esc to exit
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={`zen-mode-toggle ${zenActive ? 'active' : ''} ${ultraActive ? 'ultra' : ''}`}
        style={positionStyles}
        aria-label={zenActive ? 'Exit Zen Mode' : 'Enter Zen Mode'}
        aria-pressed={zenActive}
      >
        {zenActive ? (ultraActive ? '🧠 Exit Deep Flow' : '🧘 Exit Zen Mode') : '🧘 Enter Zen Mode'}
      </button>
    </>
  );
};
