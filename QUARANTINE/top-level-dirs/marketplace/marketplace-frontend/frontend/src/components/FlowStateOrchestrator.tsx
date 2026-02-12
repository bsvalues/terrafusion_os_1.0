/**
 * Flow State Orchestrator - React Component Wrapper
 *
 * Implements Csikszentmihalyi's Flow Theory principles:
 * 1. Clear goals (immediate visual feedback)
 * 2. Challenge/skill balance (adaptive difficulty)
 * 3. Merging of action and awareness (intuitive controls)
 * 4. Concentration on task (distraction elimination)
 * 5. Loss of self-consciousness (immersive design)
 * 6. Temporal distortion (engagement tracking)
 *
 * Research Foundation:
 * - Flow: The Psychology of Optimal Experience (Csikszentmihalyi, 1990)
 * - Attention and effort (Kahneman, 1973)
 * - Intrinsic motivation theory (Deci & Ryan, 1985)
 * - Keyboard vs mouse efficiency (Card et al., 1983)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { FlowStateMetrics } from '../types';
import './FlowStateOrchestrator.css';

export interface FlowStateOrchestratorProps {
  onMetricsUpdate?: (metrics: FlowStateMetrics) => void;
  onZenModeChange?: (active: boolean) => void;
  enableAudioFeedback?: boolean;
  enableHapticFeedback?: boolean;
}

/**
 * Flow State Orchestrator Component
 *
 * Manages Zen Mode, keyboard shortcuts, engagement monitoring, and time distortion tracking
 */
export const FlowStateOrchestrator: React.FC<FlowStateOrchestratorProps> = ({
  onMetricsUpdate,
  onZenModeChange,
  enableAudioFeedback = true,
  enableHapticFeedback = true,
}) => {
  // Flow state tracking
  const [sessionStartTime] = useState<number>(Date.now());
  const [engagementScore, setEngagementScore] = useState<number>(100);
  const [interactionCount, setInteractionCount] = useState<number>(0);
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());
  const [keyboardShortcutUsage, setKeyboardShortcutUsage] = useState<number>(0);
  
  // Zen Mode state
  const [zenModeActive, setZenModeActive] = useState<boolean>(false);
  const [zenUltraActive, setZenUltraActive] = useState<boolean>(false);
  const [showKeyboardCheatsheet, setShowKeyboardCheatsheet] = useState<boolean>(false);
  
  // Audio context for feedback sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  const parameterAdjustSound = useRef<AudioBuffer | null>(null);

  /**
   * Initialize audio feedback system
   */
  useEffect(() => {
    if (!enableAudioFeedback) return;

    const initAudio = async () => {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create simple beep sound for parameter adjustments
      const sampleRate = audioContextRef.current.sampleRate;
      const buffer = audioContextRef.current.createBuffer(1, sampleRate * 0.05, sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
      }
      
      parameterAdjustSound.current = buffer;
    };

    initAudio();

    return () => {
      audioContextRef.current?.close();
    };
  }, [enableAudioFeedback]);

  /**
   * Play parameter adjustment sound
   */
  const playParameterAdjustSound = useCallback(() => {
    if (!audioContextRef.current || !parameterAdjustSound.current) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = parameterAdjustSound.current;
    source.connect(audioContextRef.current.destination);
    source.start();
  }, []);

  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback((duration: number = 50, intensity: number = 0.5) => {
    if (!enableHapticFeedback || !navigator.vibrate) return;
    navigator.vibrate(duration);
  }, [enableHapticFeedback]);

  /**
   * Record user interaction for engagement tracking
   */
  const recordInteraction = useCallback(() => {
    setLastInteractionTime(Date.now());
    setInteractionCount(prev => prev + 1);
  }, []);

  /**
   * Toggle Zen Mode
   */
  const toggleZenMode = useCallback(() => {
    const newZenState = !zenModeActive;
    setZenModeActive(newZenState);
    
    if (newZenState) {
      document.body.classList.add('zen-mode');
      triggerHaptic(50, 0.5);
    } else {
      document.body.classList.remove('zen-mode');
      document.body.classList.remove('zen-ultra');
      setZenUltraActive(false);
      triggerHaptic(100, 0.3);
    }
    
    onZenModeChange?.(newZenState);
    recordInteraction();
  }, [zenModeActive, onZenModeChange, recordInteraction, triggerHaptic]);

  /**
   * Enhance flow state (Zen → Zen Ultra)
   */
  const enhanceFlowState = useCallback(() => {
    if (zenModeActive && !zenUltraActive) {
      document.body.classList.add('zen-ultra');
      setZenUltraActive(true);
      
      // Show depth indicator
      const indicator = document.createElement('div');
      indicator.className = 'zen-depth-indicator';
      indicator.textContent = '🧠 Deep Flow State';
      indicator.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: rgba(136, 68, 255, 0.2);
        color: #8844ff;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
        z-index: 9998;
        animation: quantum-pulse 2s ease-in-out infinite;
      `;
      document.body.appendChild(indicator);
      
      setTimeout(() => indicator.remove(), 3000);
      triggerHaptic(200, 1.0);
    }
  }, [zenModeActive, zenUltraActive, triggerHaptic]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const shift = e.shiftKey;
      const ctrl = e.ctrlKey || e.metaKey;

      let handled = false;

      // Zen Mode toggle
      if (key === 'escape' && zenModeActive) {
        toggleZenMode();
        handled = true;
      }

      // Keyboard cheatsheet
      if (key === '?') {
        setShowKeyboardCheatsheet(prev => !prev);
        handled = true;
      }

      // Parameter shortcuts (emit custom events for other components to handle)
      if (key === 'c') {
        window.dispatchEvent(new CustomEvent('quantum-adjust-coherence', { 
          detail: { delta: shift ? -0.001 : 0.001 } 
        }));
        playParameterAdjustSound();
        handled = true;
      }

      if (key === 'e') {
        window.dispatchEvent(new CustomEvent('quantum-adjust-entanglement', { 
          detail: { delta: shift ? -0.001 : 0.001 } 
        }));
        playParameterAdjustSound();
        handled = true;
      }

      if (key === 'o') {
        window.dispatchEvent(new CustomEvent('quantum-adjust-optimization', { 
          detail: { delta: shift ? -1 : 1 } 
        }));
        playParameterAdjustSound();
        handled = true;
      }

      // Action shortcuts
      if (key === ' ') {
        window.dispatchEvent(new CustomEvent('quantum-toggle-live-mode'));
        handled = true;
      }

      if (key === 'r') {
        window.dispatchEvent(new CustomEvent('quantum-reset-optimal'));
        handled = true;
      }

      if (key === 'p') {
        window.dispatchEvent(new CustomEvent('quantum-preview-impact'));
        handled = true;
      }

      if (key === 'enter') {
        window.dispatchEvent(new CustomEvent('quantum-apply-changes'));
        handled = true;
      }

      // Save/Undo
      if (ctrl && key === 's') {
        window.dispatchEvent(new CustomEvent('quantum-save-config'));
        handled = true;
      }

      if (ctrl && key === 'z') {
        window.dispatchEvent(new CustomEvent('quantum-undo-change'));
        handled = true;
      }

      // Preset jumps (1-9)
      if (key >= '1' && key <= '9') {
        window.dispatchEvent(new CustomEvent('quantum-apply-preset', { 
          detail: { presetNumber: parseInt(key) } 
        }));
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        recordInteraction();
        setKeyboardShortcutUsage(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zenModeActive, recordInteraction, toggleZenMode, playParameterAdjustSound]);

  /**
   * Monitor engagement and adjust interface
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime;
      const sessionDuration = (Date.now() - sessionStartTime) / 1000 / 60; // minutes

      // Calculate engagement score
      setEngagementScore(prev => {
        let newScore = prev;
        
        if (timeSinceLastInteraction < 5000) {
          // Recent interaction = engaged
          newScore = Math.min(100, prev + 5);
        } else if (timeSinceLastInteraction > 30000) {
          // No interaction for 30s = disengaged
          newScore = Math.max(0, prev - 10);
        }
        
        return newScore;
      });

      // Calculate time distortion factor
      const timeDistortionFactor = 1 + (engagementScore / 100) * 2; // 1x to 3x

      // Update metrics
      const metrics: FlowStateMetrics = {
        engagementScore,
        sessionDuration,
        interactionCount,
        keyboardShortcutUsage,
        zenModeActive,
        timeDistortionFactor,
      };
      
      onMetricsUpdate?.(metrics);

      // Suggest break when engagement drops
      if (engagementScore < 30 && sessionDuration > 20) {
        // Show break suggestion (implement break notification component)
        console.log('Consider a 5-minute break for optimal performance');
      }

      // Enhance flow state when highly engaged
      if (engagementScore > 80 && sessionDuration < 90 && zenModeActive) {
        enhanceFlowState();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [
    lastInteractionTime,
    sessionStartTime,
    engagementScore,
    interactionCount,
    keyboardShortcutUsage,
    zenModeActive,
    onMetricsUpdate,
    enhanceFlowState,
  ]);

  return (
    <>
      {/* Zen Mode Indicator */}
      {zenModeActive && (
        <div className="zen-mode-indicator">
          Zen Mode Active • Press Esc to exit
        </div>
      )}

      {/* Keyboard Cheatsheet Overlay */}
      {showKeyboardCheatsheet && (
        <div 
          className="keyboard-cheatsheet" 
          onClick={() => setShowKeyboardCheatsheet(false)}
        >
          <div className="cheatsheet-content" onClick={e => e.stopPropagation()}>
            <button 
              className="close-button"
              onClick={() => setShowKeyboardCheatsheet(false)}
              aria-label="Close keyboard shortcuts"
            >
              ×
            </button>
            
            <h3>⌨️ Keyboard Shortcuts</h3>
            
            <div className="shortcut-grid">
              <div className="shortcut-section">
                <h4>Parameters</h4>
                <div className="shortcut-item">
                  <kbd>C</kbd> <span>Increase Coherence</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Shift+C</kbd> <span>Decrease Coherence</span>
                </div>
                <div className="shortcut-item">
                  <kbd>E</kbd> <span>Increase Entanglement</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Shift+E</kbd> <span>Decrease Entanglement</span>
                </div>
                <div className="shortcut-item">
                  <kbd>O</kbd> <span>Increase Optimization</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Shift+O</kbd> <span>Decrease Optimization</span>
                </div>
              </div>
              
              <div className="shortcut-section">
                <h4>Actions</h4>
                <div className="shortcut-item">
                  <kbd>Space</kbd> <span>Toggle Live Mode</span>
                </div>
                <div className="shortcut-item">
                  <kbd>R</kbd> <span>Reset to Optimal</span>
                </div>
                <div className="shortcut-item">
                  <kbd>P</kbd> <span>Preview Impact</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Enter</kbd> <span>Apply Changes</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Cmd/Ctrl+S</kbd> <span>Save Config</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Cmd/Ctrl+Z</kbd> <span>Undo</span>
                </div>
              </div>
              
              <div className="shortcut-section">
                <h4>Navigation</h4>
                <div className="shortcut-item">
                  <kbd>1-9</kbd> <span>Jump to Preset</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Tab</kbd> <span>Next Parameter</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Shift+Tab</kbd> <span>Previous Parameter</span>
                </div>
                <div className="shortcut-item">
                  <kbd>?</kbd> <span>Show This Help</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Esc</kbd> <span>Exit Zen Mode</span>
                </div>
              </div>
            </div>
            
            <p className="cheatsheet-tip">
              💡 Keyboard shortcuts are 2-3x faster than mouse
            </p>
          </div>
        </div>
      )}

      {/* Flow State Toggle Button */}
      <button
        onClick={toggleZenMode}
        className={`flow-state-toggle ${zenModeActive ? 'active' : ''}`}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          background: zenModeActive ? '#00ff88' : '#2a3344',
          color: zenModeActive ? '#0a0e1a' : '#00ff88',
          border: '2px solid #00ff88',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.9rem',
          zIndex: 1000,
          transition: 'all 0.3s ease',
        }}
        aria-label={zenModeActive ? 'Exit Zen Mode' : 'Enter Zen Mode'}
      >
        {zenModeActive ? '🧘 Exit Zen Mode' : '🧘 Enter Zen Mode'}
      </button>
    </>
  );
};
