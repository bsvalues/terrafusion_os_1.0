/**
 * Terrafusion Genius Notification System
 * Transforms alerts into delightful, actionable experiences
 * Embodies Jobs/Ive/Musk/Tesla excellence in user feedback
 */

import React, { useState, useEffect, useRef } from 'react';
import './GeniusNotification.css';

export interface GeniusNotificationProps {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'celebration';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
  }>;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  animate?: boolean;
  sound?: boolean;
  haptic?: boolean;
}

export const GeniusNotification: React.FC<GeniusNotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  persistent = false,
  actions = [],
  icon,
  onDismiss,
  position = 'top-right',
  animate = true,
  sound = true,
  haptic = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const notificationRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();
  const dismissTimeout = useRef<NodeJS.Timeout>();

  // Genius UX: Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Genius UX: Auto-dismiss with progress indicator
  useEffect(() => {
    if (persistent || duration <= 0) return;

    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      
      setProgress(progressPercent);
      
      if (remaining <= 0) {
        handleDismiss();
      }
    };

    progressInterval.current = setInterval(updateProgress, 50);
    dismissTimeout.current = setTimeout(handleDismiss, duration);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    };
  }, [duration, persistent]);

  // Genius UX: Sound feedback for important notifications
  useEffect(() => {
    if (!sound) return;

    const playNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different tones for different notification types
        const frequencies = {
          success: [523.25, 659.25, 783.99], // C5, E5, G5 (major chord)
          celebration: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6
          info: [440], // A4
          warning: [466.16, 554.37], // Bb4, C#5
          error: [311.13, 369.99] // Eb4, F#4
        };

        const notes = frequencies[type] || frequencies.info;
        
        notes.forEach((freq /* , index */) => {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);
            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
          }, index * 100);
        });
      } catch (error) {
        // Graceful fallback - no sound
        console.debug('Audio not available:', error);
      }
    };

    playNotificationSound();
  }, [type, sound]);

  // Genius UX: Haptic feedback
  useEffect(() => {
    if (!haptic || !('vibrate' in navigator)) return;

    const vibrationPatterns = {
      success: [50, 50, 100],
      celebration: [100, 50, 100, 50, 200],
      info: [50],
      warning: [100, 100, 100],
      error: [200, 100, 200]
    };

    navigator.vibrate(vibrationPatterns[type] || vibrationPatterns.info);
  }, [type, haptic]);

  const handleDismiss = () => {
    if (isExiting) return;
    
    setIsExiting(true);
    
    // Genius UX: Exit animation
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  const handleMouseEnter = () => {
    // Pause auto-dismiss on hover
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
  };

  const handleMouseLeave = () => {
    // Resume auto-dismiss after hover
    if (persistent || duration <= 0) return;
    
    const remainingTime = (progress / 100) * duration;
    dismissTimeout.current = setTimeout(handleDismiss, remainingTime);
  };

  // Genius UX: Keyboard accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleDismiss();
    }
  };

  const getIcon = () => {
    if (icon) return icon;

    const defaultIcons = {
      success: '✅',
      celebration: '🎉',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    };

    return defaultIcons[type];
  };

  const notificationClasses = [
    'genius-notification',
    `genius-notification--${type}`,
    `genius-notification--${position}`,
    isVisible && 'genius-notification--visible',
    isExiting && 'genius-notification--exiting',
    animate && 'genius-notification--animated',
    type === 'celebration' && 'genius-notification--celebration'
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={notificationRef}
      className={notificationClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-labelledby={`notification-title-${id}`}
      aria-describedby={`notification-message-${id}`}
    >
      {/* Progress indicator */}
      {!persistent && duration > 0 && (
        <div className="genius-notification__progress">
          <div 
            className="genius-notification__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="genius-notification__content">
        {/* Icon */}
        <div className="genius-notification__icon">
          {getIcon()}
        </div>

        {/* Text content */}
        <div className="genius-notification__text"><>

          <h4 
            id={`notification-title-${id}`}
            className="genius-notification__title"
          >
            {title}
          </h4>
          <p
</> 
            id={`notification-message-${id}`}
            className="genius-notification__message"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="genius-notification__actions">
            {actions.map((action /* , index */) => (
              <button
                key={index}
                className={`genius-notification__action genius-notification__action--${action.style || 'secondary'}`}
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Dismiss button */}
        <button
          className="genius-notification__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Celebration particles */}
      {type === 'celebration' && (
        <div className="genius-notification__particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="genius-notification__particle"
              style={{
                '--delay': `${i * 0.1}s`,
                '--angle': `${i * 30}deg`
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GeniusNotification;
