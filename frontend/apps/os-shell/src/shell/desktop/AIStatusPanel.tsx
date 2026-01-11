/**
 * TerraFusion OS AI Status Panel
 * 
 * System tray component showing AI agent status and metrics.
 * Click to open detailed panel with agent categories and activity.
 * 
 * @module shell/desktop/AIStatusPanel
 * @see SUCCESS CRITERIA Phase 7: System Tray
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface AIAgentCategory {
  name: string;
  count: number;
  status: 'active' | 'idle' | 'error';
}

export interface AIStatus {
  totalAgents: number;
  activeAgents: number;
  categories: AIAgentCategory[];
  lastActivity: string;
  systemLoad: number;
  error?: string;
}

export interface AIStatusIndicatorProps {
  status: AIStatus;
  className?: string;
}

export interface AIStatusPanelProps {
  status: AIStatus | undefined;
  onClose: () => void;
  className?: string;
}

// ============================================================================
// Default Status (for demo/fallback)
// ============================================================================

export const defaultAIStatus: AIStatus = {
  totalAgents: 1008,
  activeAgents: 987,
  categories: [
    { name: 'Data Analysis', count: 245, status: 'active' },
    { name: 'Document Processing', count: 312, status: 'active' },
    { name: 'GIS Operations', count: 189, status: 'active' },
    { name: 'Cost Estimation', count: 156, status: 'active' },
    { name: 'Tax Assessment', count: 105, status: 'idle' },
  ],
  lastActivity: new Date().toISOString(),
  systemLoad: 0.72,
};

// ============================================================================
// AIStatusPanel Component
// ============================================================================

export const AIStatusPanel: React.FC<AIStatusPanelProps> = ({
  status,
  onClose,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Loading state
  if (!status) {
    return (
      <div
        ref={panelRef}
        data-testid="ai-status-panel"
        role="dialog"
        aria-label="AI Swarm Status"
        className={cn(
          'absolute bottom-full right-0 mb-2',
          'w-72 p-4 rounded-lg',
          'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
          'border border-[var(--tf-transcend-highlight)]/20',
          'shadow-[0_-8px_30px_rgba(0,0,0,0.5),0_0_40px_rgba(0,255,238,0.1)]',
          className
        )}
      >
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[var(--tf-transcend-highlight)] border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-white/70">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (status.error) {
    return (
      <div
        ref={panelRef}
        data-testid="ai-status-panel"
        role="dialog"
        aria-label="AI Swarm Status"
        className={cn(
          'absolute bottom-full right-0 mb-2',
          'w-72 p-4 rounded-lg',
          'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
          'border border-red-500/30',
          'shadow-[0_-8px_30px_rgba(0,0,0,0.5)]',
          className
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">AI Swarm Status</h3>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="text-red-400 text-sm">{status.error}</div>
      </div>
    );
  }

  const loadPercentage = Math.round(status.systemLoad * 100);

  return (
    <div
      ref={panelRef}
      data-testid="ai-status-panel"
      role="dialog"
      aria-label="AI Swarm Status"
      className={cn(
        'absolute bottom-full right-0 mb-2',
        'w-80 rounded-lg overflow-hidden',
        'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
        'border border-[var(--tf-transcend-highlight)]/20',
        'shadow-[0_-8px_30px_rgba(0,0,0,0.5),0_0_40px_rgba(0,255,238,0.1)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h3 className="text-sm font-semibold text-white">AI Swarm Status</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 p-3 border-b border-white/10">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--tf-transcend-highlight)]">
            {status.totalAgents.toLocaleString()}
          </div>
          <div className="text-xs text-white/60">Total Agents</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--tf-accent-success)]">
            {status.activeAgents.toLocaleString()}
          </div>
          <div className="text-xs text-white/60">Active</div>
        </div>
      </div>

      {/* System Load */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/60">System Load</span>
          <span className="text-xs font-medium text-white">{loadPercentage}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              loadPercentage < 50 && 'bg-[var(--tf-accent-success)]',
              loadPercentage >= 50 && loadPercentage < 80 && 'bg-[var(--warning-amber)]',
              loadPercentage >= 80 && 'bg-[var(--error-red)]'
            )}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
          Agent Categories
        </h4>
        <div className="space-y-2">
          {status.categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-2">
                <span
                  data-testid={`category-status-${category.status}`}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    category.status === 'active' && 'bg-[var(--tf-accent-success)] shadow-[0_0_6px_rgba(0,255,170,0.6)]',
                    category.status === 'idle' && 'bg-[var(--gray-400)]',
                    category.status === 'error' && 'bg-[var(--error-red)]'
                  )}
                />
                <span className="text-sm text-white/90">{category.name}</span>
              </div>
              <span className="text-sm font-medium text-white/70">
                {category.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-[var(--tf-transcend-highlight)]/5 border-t border-white/10">
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <span className="w-1.5 h-1.5 bg-[var(--tf-accent-success)] rounded-full animate-pulse" />
          <span>Live • Last update: just now</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// AIStatusIndicator Component
// ============================================================================

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  status,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <button
        data-testid="ai-status-indicator"
        onClick={togglePanel}
        aria-label="AI Status - Click to view details"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md',
          'bg-gradient-to-r from-[var(--tf-transcend-highlight)]/10 to-transparent',
          'hover:bg-white/10 cursor-pointer',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tf-transcend-highlight)]',
          isOpen && 'bg-white/10'
        )}
      >
        <div className="relative">
          <span className="text-lg">🧠</span>
          {/* Pulse indicator */}
          <span
            data-testid="ai-pulse"
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--tf-accent-success)] rounded-full animate-pulse"
          />
        </div>
        <span className="text-xs text-[var(--tf-transcend-highlight)] font-medium">
          {status.totalAgents.toLocaleString()}
        </span>
      </button>

      {/* Panel */}
      {isOpen && <AIStatusPanel status={status} onClose={closePanel} />}
    </div>
  );
};

export default AIStatusIndicator;
