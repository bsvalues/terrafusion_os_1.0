/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — WORKBENCH RAIL
 * Left-side vertical navigation dock for the Property Workbench.
 *
 * Behaviour mirrors the OS bottom taskbar:
 *   expanded   → 200px — icon + label
 *   collapsed  → 56px  — icon only (label as tooltip)
 *   hidden     → 8px   — thin edge strip, click to expand
 *
 * State persisted in localStorage('tf-wbr-state').
 *
 * Styling: Liquid Glass (dark glass matching the bottom OS dock).
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Flame,
  Globe,
  ClipboardList,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
} from 'lucide-react';
import type { WorkbenchTabSlug } from '../../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

type RailState = 'expanded' | 'collapsed' | 'hidden';

export interface WorkbenchRailTab {
  id: WorkbenchTabSlug;
  label: string;
  path: string;
  enabled: boolean;
}

export interface WorkbenchRailProps {
  tabs: WorkbenchRailTab[];
  parcelId: string;
  currentTabId: WorkbenchTabSlug;
}

// ============================================================================
// Tab Icon Map
// ============================================================================

const TAB_ICONS: Partial<Record<WorkbenchTabSlug, React.ElementType>> = {
  summary:  LayoutGrid,
  forge:    Flame,
  atlas:    Globe,
  dais:     ClipboardList,
  dossier:  FolderOpen,
};

function TabIcon({ slug, size = 20 }: { slug: WorkbenchTabSlug; size?: number }) {
  const Icon = (TAB_ICONS[slug] ?? LayoutGrid) as React.FC<{ size?: number }>;
  return <Icon size={size} />;
}

// ============================================================================
// WorkbenchRail
// ============================================================================

const STORAGE_KEY = 'tf-wbr-state';

export const WorkbenchRail: React.FC<WorkbenchRailProps> = ({
  tabs,
  parcelId,
  currentTabId,
}) => {
  const [railState, setRailState] = useState<RailState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as RailState | null;
      return saved ?? 'expanded';
    } catch {
      return 'expanded';
    }
  });

  const saveState = (next: RailState) => {
    setRailState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  };

  const cycleState = () => {
    saveState(
      railState === 'expanded'  ? 'collapsed' :
      railState === 'collapsed' ? 'hidden'    : 'expanded'
    );
  };

  // ── Hidden: thin edge strip ──────────────────────────────────
  if (railState === 'hidden') {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Show navigation rail"
        onClick={() => saveState('collapsed')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') saveState('collapsed'); }}
        title="Show navigation"
        style={{
          width: 8,
          flexShrink: 0,
          cursor: 'pointer',
          background: 'hsl(var(--tf-accent) / 0.15)',
          borderRight: '1px solid hsl(var(--tf-accent) / 0.25)',
          transition: 'background 200ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'hsl(var(--tf-accent) / 0.35)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'hsl(var(--tf-accent) / 0.15)';
        }}
      />
    );
  }

  const isExpanded = railState === 'expanded';
  const width = isExpanded ? 200 : 56;

  // ── Toggle icon ──────────────────────────────────────────────
  const ToggleIcon = isExpanded ? PanelLeftClose : PanelLeftOpen;

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        background: 'hsl(var(--tf-bg) / 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid hsl(var(--tf-border) / 0.3)',
        overflow: 'hidden',
        zIndex: 20,
      }}
      data-testid="workbench-rail"
      data-state={railState}
    >
      {/* ── Toggle button ── */}
      <button
        onClick={cycleState}
        title={isExpanded ? 'Collapse rail' : 'Expand rail'}
        aria-label={isExpanded ? 'Collapse navigation rail' : 'Expand navigation rail'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-end' : 'center',
          padding: '10px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'hsl(var(--tf-text) / 0.4)',
          flexShrink: 0,
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--tf-accent))';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--tf-text) / 0.4)';
        }}
      >
        <ToggleIcon size={14} />
      </button>

      {/* ── Navigation items ── */}
      <nav
        role="navigation"
        aria-label="Suite navigation"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '4px 8px',
          gap: 2,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentTabId;
          const href = tab.path
            ? `/property/${parcelId}/${tab.path}`
            : `/property/${parcelId}`;

          return (
            <NavLink
              key={tab.id}
              to={href}
              end={tab.path === ''}
              title={!isExpanded ? tab.label : undefined}
              aria-label={tab.label}
              onClick={(e) => { if (!tab.enabled) e.preventDefault(); }}
              style={({ isActive: linkActive }) => {
                const active = linkActive || isActive;
                return {
                  display: 'flex',
                  alignItems: 'center',
                  gap: isExpanded ? 10 : 0,
                  justifyContent: isExpanded ? 'flex-start' : 'center',
                  padding: isExpanded ? '9px 12px' : '10px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active
                    ? 'hsl(var(--tf-accent))'
                    : 'hsl(var(--tf-text) / 0.62)',
                  background: active
                    ? 'hsl(var(--tf-accent) / 0.12)'
                    : 'transparent',
                  border: `1px solid ${active ? 'hsl(var(--tf-accent) / 0.25)' : 'transparent'}`,
                  opacity: tab.enabled ? 1 : 0.4,
                  cursor: tab.enabled ? 'pointer' : 'not-allowed',
                  transition: 'background 140ms ease, color 140ms ease, border-color 140ms ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                };
              }}
            >
              {({ isActive: linkActive }) => {
                const active = linkActive || isActive;
                return (
                  <>
                    {/* Active indicator dot */}
                    <span
                      style={{
                        position: 'relative',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TabIcon slug={tab.id} size={18} />
                      {active && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: -3,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: 'hsl(var(--tf-accent))',
                          }}
                        />
                      )}
                    </span>
                    {isExpanded && (
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: active ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-text) / 0.75)',
                        }}
                      >
                        {tab.label}
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bottom: PanelLeft "hide" shortcut ── */}
      <button
        onClick={() => saveState('hidden')}
        title="Hide rail"
        aria-label="Hide navigation rail"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          gap: isExpanded ? 8 : 0,
          padding: isExpanded ? '8px 12px' : '8px',
          margin: '4px 8px 8px',
          background: 'none',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          color: 'hsl(var(--tf-text) / 0.3)',
          fontSize: 11,
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--tf-text) / 0.6)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--tf-text) / 0.3)';
        }}
      >
        <PanelLeft size={13} />
        {isExpanded && <span>Hide</span>}
      </button>
    </div>
  );
};
