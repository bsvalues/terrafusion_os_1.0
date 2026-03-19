/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION LAUNCHER
 * Unified navigation surface (Start Menu / Cmd+K equivalent)
 *
 * Built with Liquid/Tactile primitives behind materialQualityGate.
 * Keyboard-first design with focus trap.
 *
 * @see Slice 3 plan for requirements
 * @see Slice 5: Personalization (pins, recents, ranking)
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Pin, PinOff } from 'lucide-react';
import { getLucideIcon } from '../../config/iconMap';
import { useCommandPaletteStore } from '../../stores/commandPaletteStore';
import { TerraSphereIcon, type TerraSphereIconVariant } from '../../ui/brand/TerraSphereIcon';
import { LiquidPanel, TactileButton } from '../../ui/materials';
import { MaterialQuality, useMaterialQuality } from '../../ui/materials/materialQualityGate';
import {
    getIntentBadgeText,
    getLauncherSections,
    navigateToLauncherItem,
    type LauncherItem,
    type LauncherSection
} from './launcherModel';
import { useAuthContextOptional, toOsActor } from '@/auth/useAuthContext';

const INTENT_ICON_VARIANT: Record<LauncherItem['intent'], TerraSphereIconVariant> = {
  workbench: 'assessment',
  standalone: 'mapping',
  system: 'system',
};
import { initPinsStore, usePinsStore } from './pinsStore';
import { buildSectionsForEmptyQuery, rankItems, type RankingContext } from './ranking';
import { initRecentsStore, useRecentsStore } from './recentsStore';

// ============================================================================
// Types
// ============================================================================

export interface LauncherProps {
  /** Ref to the element that invoked the launcher (for focus restoration) */
  invokerRef?: React.RefObject<HTMLElement>;
  /** Override items for testing */
  testItems?: LauncherItem[];
}

// ============================================================================
// Hook: Focus Trap
// ============================================================================

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab: wrap to last from first
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: wrap to first from last
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
}

// ============================================================================
// Hook: Arrow Key Navigation
// ============================================================================

function useArrowNavigation(items: LauncherItem[], onActivate: (item: LauncherItem) => void) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!items.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
          if (activeIndex >= 0 && items[activeIndex]) {
            e.preventDefault();
            onActivate(items[activeIndex]);
          }
          break;
      }
    },
    [items, activeIndex, onActivate]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset when items change
  useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  return { activeIndex, setActiveIndex };
}

// ============================================================================
// Components
// ============================================================================

/**
 * Launcher Item Component
 */
const LauncherItemButton: React.FC<{
  item: LauncherItem;
  isActive: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  onClick: () => void;
  useTactile: boolean;
  prefersReducedMotion: boolean;
}> = ({ item, isActive, isPinned, onTogglePin, onClick, useTactile, prefersReducedMotion }) => {
  const Icon = getLucideIcon(item.iconName || item.icon || 'Activity');
  const intentBadge = getIntentBadgeText(item.intent);

  const buttonClasses = useTactile
    ? 'tactile-button w-full text-left group'
    : 'launcher-item-fallback w-full text-left group hover:bg-white/10 rounded-lg p-3 transition-colors';

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin();
  };

  const content = (
    <>
      <span className='mr-3' aria-hidden='true'>
        <TerraSphereIcon
          size={28}
          variant={INTENT_ICON_VARIANT[item.intent]}
          glyph={<Icon className='h-3 w-3' />}
        />
      </span>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='launcher-item-label font-medium text-white truncate'>{item.label}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium
              ${item.intent === 'workbench' ? 'bg-emerald-500/80 text-white' : ''}
              ${item.intent === 'standalone' ? 'bg-slate-500/80 text-white' : ''}
              ${item.intent === 'system' ? 'bg-blue-500/80 text-white' : ''}
            `}
            data-badge
          >
            {intentBadge}
          </span>
        </div>
        <p className='text-white/60 text-sm truncate'>{item.description}</p>
      </div>
      {/* Pin Toggle Button */}
      {useTactile ? (
        <TactileButton
          variant='ghost'
          size='sm'
          className={`ml-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
                      focus:opacity-100 transition-opacity ${isPinned ? 'opacity-100 text-cyan-400' : 'text-white/40'}`}
          onClick={handlePinClick}
          aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
          aria-pressed={isPinned}
        >
          {isPinned ? <PinOff className='h-3.5 w-3.5' /> : <Pin className='h-3.5 w-3.5' />}
        </TactileButton>
      ) : (
        <button
          type='button'
          className={`ml-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
                      focus:opacity-100 transition-opacity p-1 rounded
                      ${isPinned ? 'opacity-100 text-cyan-400' : 'text-white/40 hover:text-white/60'}
                      focus:outline-none focus:ring-2 focus:ring-cyan-400/50`}
          onClick={handlePinClick}
          aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
          aria-pressed={isPinned}
        >
          {isPinned ? <PinOff className='h-3.5 w-3.5' /> : <Pin className='h-3.5 w-3.5' />}
        </button>
      )}
    </>
  );

  if (useTactile) {
    return (
      <TactileButton
        variant='ghost'
        size='md'
        className={`${buttonClasses} justify-start gap-0 focus-visible:ring-2 focus-visible:ring-cyan-400`}
        onClick={onClick}
        data-id={item.id}
        data-intent={item.intent}
        data-active={isActive}
        data-reduced-motion={prefersReducedMotion}
        aria-label={item.a11yLabel}
        aria-selected={isActive}
      >
        {content}
      </TactileButton>
    );
  }

  return (
    <button
      type='button'
      className={`${buttonClasses} flex items-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none`}
      onClick={onClick}
      data-id={item.id}
      data-intent={item.intent}
      data-active={isActive}
      data-reduced-motion={prefersReducedMotion}
      aria-label={item.a11yLabel}
      aria-selected={isActive}
    >
      {content}
    </button>
  );
};

/**
 * Launcher Section Component
 */
const LauncherSectionView: React.FC<{
  section: LauncherSection;
  activeIndex: number;
  sectionStartIndex: number;
  onItemClick: (item: LauncherItem) => void;
  onTogglePin: (id: string) => void;
  isPinned: (id: string) => boolean;
  useTactile: boolean;
  prefersReducedMotion: boolean;
}> = ({
  section,
  activeIndex,
  sectionStartIndex,
  onItemClick,
  onTogglePin,
  isPinned,
  useTactile,
  prefersReducedMotion,
}) => (
  <div role='group' aria-labelledby={`section-${section.id}`} className='mb-4'>
    <h3
      id={`section-${section.id}`}
      className='text-xs uppercase tracking-wider text-white/50 font-semibold mb-2 px-2'
    >
      {section.label}
    </h3>
    <div className='space-y-1'>
      {section.items.map((item, index) => (
        <LauncherItemButton
          key={item.id}
          item={item}
          isActive={sectionStartIndex + index === activeIndex}
          isPinned={isPinned(item.id)}
          onTogglePin={() => onTogglePin(item.id)}
          onClick={() => onItemClick(item)}
          useTactile={useTactile}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </div>
  </div>
);

// ============================================================================
// Main Launcher Component
// ============================================================================

export const Launcher: React.FC<LauncherProps> = ({ invokerRef, testItems }) => {
  const navigate = useNavigate();
  const auth = useAuthContextOptional();
  const quality = useMaterialQuality();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Store state (using commandPaletteStore for Ctrl+K trigger)
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const close = useCommandPaletteStore((state) => state.close);
  const searchQuery = useCommandPaletteStore((state) => state.searchQuery);
  const setSearchQuery = useCommandPaletteStore((state) => state.setSearchQuery);

  // Personalization stores (Slice 5)
  const isPinned = usePinsStore((state) => state.isPinned);
  const togglePin = usePinsStore((state) => state.togglePin);
  const pinnedIds = usePinsStore((state) => state.pinnedIds);
  const recordRecent = useRecentsStore((state) => state.record);
  const recentIds = useRecentsStore((state) => state.recentIds);

  // Hydrate stores on mount
  useEffect(() => {
    initPinsStore();
    initRecentsStore();
  }, []);

  // Material quality checks
  const useLiquid = quality.tier !== MaterialQuality.LOW;
  const useTactile = quality.enableSprings;
  const useBackdropBlur = quality.enableBackdropBlur;

  // Get launcher items
  const sections = getLauncherSections();
  const allItems = testItems || sections.flatMap((s) => s.items);

  // Build ranking context
  const rankingContext: RankingContext = {
    pinnedIds: pinnedIds,
    recentIds: recentIds,
  };

  // Filter and rank items
  const filteredItems = searchQuery.trim()
    ? rankItems(allItems, searchQuery, rankingContext)
    : allItems;

  // Build sections based on search state
  const filteredSections: LauncherSection[] = searchQuery.trim()
    ? [{ id: 'results', label: 'Results', items: filteredItems }]
    : buildSectionsForEmptyQuery(allItems, rankingContext);

  // Arrow key navigation
  const handleActivate = useCallback(
    (item: LauncherItem) => {
      // Record in recents before navigating (Slice 5)
      recordRecent(item.id);
      navigateToLauncherItem(item, navigate, auth ? toOsActor(auth) : null);
      close();
    },
    [navigate, close, recordRecent]
  );

  const { activeIndex, setActiveIndex } = useArrowNavigation(filteredItems, handleActivate);

  // Focus trap
  useFocusTrap(containerRef, isOpen);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Restore focus on close
  useEffect(() => {
    if (!isOpen && invokerRef?.current) {
      invokerRef.current.focus();
    }
  }, [isOpen, invokerRef]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Don't render if closed
  if (!isOpen) return null;

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  // Calculate section start indices for active state
  let currentIndex = 0;
  const sectionIndices = filteredSections.map((section) => {
    const startIndex = currentIndex;
    currentIndex += section.items.length;
    return startIndex;
  });

  const content = (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[10vh]
        ${useBackdropBlur ? 'backdrop-blur' : ''}`}
      data-testid='launcher-backdrop'
      onClick={handleBackdropClick}
    >
      {useLiquid ? (
        <LiquidPanel
          ref={containerRef}
          variant='default'
          className='liquid-panel w-full max-w-xl max-h-[60vh] overflow-hidden flex flex-col'
          role='dialog'
          aria-modal='true'
          aria-label='TerraFusion Launcher - Search and navigate'
          data-testid='launcher-content'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className='p-4 border-b border-white/10'>
            <input
              ref={searchInputRef}
              type='search'
              role='searchbox'
              aria-label='Search suites and actions'
              placeholder='Search suites, tools, settings...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg
                       text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-cyan-400/50'
            />
          </div>

          {/* Items List */}
          <div className='flex-1 overflow-y-auto p-4'>
            {filteredItems.length > 0 ? (
              filteredSections.map((section, sectionIdx) => (
                <LauncherSectionView
                  key={section.id}
                  section={section}
                  activeIndex={activeIndex}
                  sectionStartIndex={sectionIndices[sectionIdx]}
                  onItemClick={handleActivate}
                  onTogglePin={togglePin}
                  isPinned={isPinned}
                  useTactile={useTactile}
                  prefersReducedMotion={quality.prefersReducedMotion}
                />
              ))
            ) : (
              <div className='text-center text-white/50 py-8'>
                No results found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer Hints */}
          <div className='p-3 border-t border-white/10 text-white/40 text-xs flex justify-between'>
            <span>
              <kbd className='px-1.5 py-0.5 bg-white/10 rounded'>↑↓</kbd> Navigate
              <span className='mx-2'>•</span>
              <kbd className='px-1.5 py-0.5 bg-white/10 rounded'>Enter</kbd> Open
            </span>
            <span>
              <kbd className='px-1.5 py-0.5 bg-white/10 rounded'>Esc</kbd> Close
            </span>
          </div>
        </LiquidPanel>
      ) : (
        // Fallback container (no glass effects)
        <div
          ref={containerRef}
          className='launcher-fallback w-full max-w-xl max-h-[60vh] overflow-hidden flex flex-col
                     bg-slate-900/95 border border-white/20 rounded-xl shadow-2xl'
          role='dialog'
          aria-modal='true'
          aria-label='TerraFusion Launcher - Search and navigate'
          data-testid='launcher-content'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className='p-4 border-b border-white/10'>
            <input
              ref={searchInputRef}
              type='search'
              role='searchbox'
              aria-label='Search suites and actions'
              placeholder='Search suites, tools, settings...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg
                       text-white placeholder-white/50
                       focus:outline-none focus:ring-2 focus:ring-cyan-400/50'
            />
          </div>

          {/* Items List */}
          <div className='flex-1 overflow-y-auto p-4'>
            {filteredItems.length > 0 ? (
              filteredSections.map((section, sectionIdx) => (
                <LauncherSectionView
                  key={section.id}
                  section={section}
                  activeIndex={activeIndex}
                  sectionStartIndex={sectionIndices[sectionIdx]}
                  onItemClick={handleActivate}
                  onTogglePin={togglePin}
                  isPinned={isPinned}
                  useTactile={false}
                  prefersReducedMotion={quality.prefersReducedMotion}
                />
              ))
            ) : (
              <div className='text-center text-white/50 py-8'>
                No results found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer Hints */}
          <div className='p-3 border-t border-white/10 text-white/40 text-xs flex justify-between'>
            <span>
              <kbd className='px-1.5 py-0.5 bg-white/10 rounded'>↑↓</kbd> Navigate
              <span className='mx-2'>•</span>
              <kbd className='px-1.5 py-0.5 bg-white/10 rounded'>Enter</kbd> Open
            </span>
            <span>
              <kbd className='px-1.5 py-0.5 bg-white/10 rounded'>Esc</kbd> Close
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // Render in portal
  return createPortal(content, document.body);
};

export default Launcher;
