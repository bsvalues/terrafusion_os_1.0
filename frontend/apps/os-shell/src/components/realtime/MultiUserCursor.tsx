/**
 * MultiUserCursor - Visual Multi-User Cursor Tracking Component
 *
 * Production-ready component for displaying other users' cursors with smooth
 * animations, user colors, and labels.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 5
 */

import React, { useEffect, useRef, useState } from 'react';
import { CursorPosition } from '../../services/SignalRService';
import { Badge } from '../ui/badge';

// ==================== TYPES ====================

export interface MultiUserCursorProps {
  userName: string;
  position: CursorPosition;
  color?: string;
  cellRef: React.RefObject<HTMLElement>;
  showLabel?: boolean;
  animationDuration?: number;
}

interface CursorCoordinates {
  x: number;
  y: number;
}

// ==================== CONSTANTS ====================

const USER_COLORS = [
  'var(--tf-transcend-cyan)', // terra-cyan (primary)
  'var(--tf-accent-error)', // red
  'var(--tf-accent-teal)', // teal
  'var(--tf-accent-yellow)', // yellow
  'var(--tf-accent-cyan-light)', // light blue
  'var(--tf-accent-orange-light)', // orange
  'var(--tf-accent-orange-dark)', // coral
  'var(--tf-accent-teal-dark)', // green
  'var(--tf-accent-red)', // crimson
  'var(--tf-accent-blue-gray)', // steel blue
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get consistent color for a user based on their username
 */
function getUserColor(userName: string, customColor?: string): string {
  if (customColor) return customColor;

  // Generate consistent color index from username
  const hash = userName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

/**
 * Calculate cursor coordinates from cell position and line/column
 */
function calculateCursorCoordinates(
  cellRef: React.RefObject<HTMLElement>,
  position: CursorPosition
): CursorCoordinates | null {
  if (!cellRef.current) return null;

  const cellRect = cellRef.current.getBoundingClientRect();

  // Find textarea or content editable element within cell
  const textArea = cellRef.current.querySelector('textarea, [contenteditable]');
  if (!textArea) return null;

  const textRect = textArea.getBoundingClientRect();

  // Estimate line height (16px default for most monospace fonts)
  const lineHeight = 20;
  const charWidth = 8.4; // Approximate width for monospace characters

  // Calculate position relative to cell
  const x = textRect.left - cellRect.left + position.column * charWidth;
  const y = textRect.top - cellRect.top + position.line * lineHeight;

  return { x, y };
}

// ==================== COMPONENT ====================

export function MultiUserCursor({
  userName,
  position,
  color,
  cellRef,
  showLabel = true,
  animationDuration = 150,
}: MultiUserCursorProps) {
  // ==================== STATE ====================

  const [coordinates, setCoordinates] = useState<CursorCoordinates | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const userColor = getUserColor(userName, color);

  // ==================== EFFECTS ====================

  // Calculate cursor position when position or cellRef changes
  useEffect(() => {
    const updatePosition = () => {
      const coords = calculateCursorCoordinates(cellRef, position);
      if (coords) {
        setCoordinates(coords);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    updatePosition();

    // Update on window resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position, cellRef]);

  // Auto-hide cursor after 5 seconds of inactivity
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [position]);

  // ==================== RENDER ====================

  if (!isVisible || !coordinates) return null;

  return (
    <div
      ref={cursorRef}
      className='multi-user-cursor absolute z-50 pointer-events-none'
      style={{
        left: `${coordinates.x}px`,
        top: `${coordinates.y}px`,
        transition: `all ${animationDuration}ms ease-out`,
      }}
    >
      {/* Cursor Line */}
      <div
        className='cursor-line'
        style={{
          width: '2px',
          height: '20px',
          backgroundColor: userColor,
          boxShadow: `0 0 4px ${userColor}`,
          animation: 'cursor-blink 1s infinite',
        }}
      />

      {/* User Label */}
      {showLabel && (
        <div
          className='cursor-label absolute top-0 left-2 whitespace-nowrap'
          style={{
            transform: 'translateY(-100%)',
            marginBottom: '2px',
          }}
        >
          <Badge
            variant='default'
            style={{
              backgroundColor: userColor,
              color: 'var(--tf-void-black)',
              fontSize: '10px',
              padding: '2px 6px',
              boxShadow: `0 2px 4px hsl(var(--tf-neutral-hs) 0% / 0.2)`,
            }}
          >
            {userName}
          </Badge>
        </div>
      )}

      {/* Cursor Glow Effect */}
      <div
        className='cursor-glow absolute top-0 left-0'
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: userColor,
          opacity: 0.3,
          transform: 'translate(-3px, -4px)',
          animation: 'cursor-pulse 2s infinite',
        }}
      />

      <style jsx>{`
        @keyframes cursor-blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0.3;
          }
        }

        @keyframes cursor-pulse {
          0%,
          100% {
            transform: translate(-3px, -4px) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-3px, -4px) scale(1.5);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}

// ==================== MULTI-USER CURSOR OVERLAY ====================

export interface MultiUserCursorOverlayProps {
  cursors: Map<string, CursorPosition>;
  cellRef: React.RefObject<HTMLElement>;
  currentUserName?: string;
  showLabels?: boolean;
}

/**
 * Overlay component that displays all users' cursors
 */
export function MultiUserCursorOverlay({
  cursors,
  cellRef,
  currentUserName,
  showLabels = true,
}: MultiUserCursorOverlayProps) {
  return (
    <div className='multi-user-cursor-overlay absolute inset-0 pointer-events-none'>
      {Array.from(cursors.entries()).map(([userName, position]) => {
        // Don't show current user's cursor
        if (userName === currentUserName) return null;

        return (
          <MultiUserCursor
            key={userName}
            userName={userName}
            position={position}
            cellRef={cellRef}
            showLabel={showLabels}
          />
        );
      })}
    </div>
  );
}

export default MultiUserCursor;
