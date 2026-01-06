/**
 * TerraFusion OS Command Palette
 *
 * Global search interface for quick access to modules, settings, and actions.
 * Triggered by Ctrl+K keyboard shortcut.
 *
 * Features:
 * - Fuzzy search across modules, settings, shortcuts
 * - Recent commands history
 * - Keyboard navigation
 * - TerraFusion glass morphism styling
 *
 * @module shell/command-palette/CommandPalette
 * @see Priority 10: Global Search
 */

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { activateModule } from '../../orchestration/moduleActivation';
import {
  useCommandPaletteStore,
  useCommandPaletteOpen,
  useRecentCommands,
  type CommandCategory,
} from '../../stores/commandPaletteStore';
import { useSettingsStore } from '../../stores/settingsStore';

// ============================================================================
// Types
// ============================================================================

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: CommandCategory;
  keywords?: string[];
  shortcut?: string;
  action: () => void;
}

export interface CommandPaletteProps {
  /** Optional className */
  className?: string;
}

// ============================================================================
// Command Registry
// ============================================================================

function useCommandRegistry(): CommandItem[] {
  const { keyboardShortcuts } = useSettingsStore();
  const { close, addToRecent } = useCommandPaletteStore();

  return useMemo(() => {
    const commands: CommandItem[] = [];

    // ========================================================================
    // Module Commands
    // ========================================================================
    const modules = [
      { id: 'costforge', label: 'CostForge', icon: '💎', keywords: ['cost', 'property', 'assessment'] },
      { id: 'terra-gaia', label: 'TerraGaia', icon: '🌍', keywords: ['earth', 'gis', 'map', 'geo'] },
      { id: 'atlas-ai', label: 'ATLAS AI', icon: '🤖', keywords: ['ai', 'assistant', 'intelligence'] },
      { id: 'reporting', label: 'Analytics', icon: '📈', keywords: ['reports', 'data', 'charts', 'analytics'] },
      { id: 'marketplace', label: 'Marketplace', icon: '🏪', keywords: ['store', 'apps', 'plugins'] },
      { id: 'counties', label: 'Counties Hub', icon: '🏛️', keywords: ['county', 'government', 'admin'] },
      { id: 'government-architecture', label: 'Gov Architecture', icon: '🏗️', keywords: ['architecture', 'infrastructure'] },
      { id: 'levy-calculator', label: 'Levy Calculator', icon: '📊', keywords: ['levy', 'tax', 'calculate'] },
      { id: 'gis-viewer', label: 'GIS Viewer', icon: '🗺️', keywords: ['gis', 'map', 'parcels'] },
      { id: 'document-manager', label: 'Documents', icon: '📁', keywords: ['files', 'documents', 'records'] },
    ];

    modules.forEach((mod) => {
      const shortcut = keyboardShortcuts.find(
        (s) => s.action.toLowerCase().includes(mod.label.toLowerCase().split(' ')[0])
      );

      commands.push({
        id: `module:${mod.id}`,
        label: `Open ${mod.label}`,
        description: `Launch the ${mod.label} module`,
        icon: mod.icon,
        category: 'modules',
        keywords: mod.keywords,
        shortcut: shortcut?.keys,
        action: () => {
          activateModule(mod.id, { source: 'command_palette' });
          addToRecent(`module:${mod.id}`);
          close();
        },
      });
    });

    // ========================================================================
    // Settings Commands
    // ========================================================================
    const settingsTabs = [
      { id: 'general', label: 'General Settings', icon: '⚙️', keywords: ['system', 'info', 'language'] },
      { id: 'appearance', label: 'Appearance Settings', icon: '🎨', keywords: ['theme', 'dark', 'light'] },
      { id: 'accessibility', label: 'Accessibility Settings', icon: '♿', keywords: ['contrast', 'motion', 'font'] },
      { id: 'notifications', label: 'Notification Settings', icon: '🔔', keywords: ['alerts', 'toast', 'sound'] },
      { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️', keywords: ['keyboard', 'hotkeys', 'bindings'] },
      { id: 'about', label: 'About TerraFusion', icon: 'ℹ️', keywords: ['version', 'info', 'about'] },
    ];

    settingsTabs.forEach((tab) => {
      commands.push({
        id: `settings:${tab.id}`,
        label: tab.label,
        description: `Open ${tab.label.toLowerCase()}`,
        icon: tab.icon,
        category: 'settings',
        keywords: tab.keywords,
        shortcut: tab.id === 'shortcuts' ? 'Ctrl+,' : undefined,
        action: () => {
          activateModule('settings', { 
            source: 'command_palette',
          });
          addToRecent(`settings:${tab.id}`);
          close();
        },
      });
    });

    // ========================================================================
    // Action Commands
    // ========================================================================
    const actions = [
      { 
        id: 'toggle-start', 
        label: 'Toggle Start Menu', 
        icon: '🚀', 
        shortcut: 'Ctrl+`',
        keywords: ['start', 'menu', 'launch'],
      },
      { 
        id: 'refresh', 
        label: 'Refresh Desktop', 
        icon: '🔄', 
        keywords: ['refresh', 'reload'],
      },
    ];

    actions.forEach((action) => {
      commands.push({
        id: `action:${action.id}`,
        label: action.label,
        icon: action.icon,
        category: 'actions',
        keywords: action.keywords,
        shortcut: action.shortcut,
        action: () => {
          addToRecent(`action:${action.id}`);
          close();
        },
      });
    });

    return commands;
  }, [keyboardShortcuts, close, addToRecent]);
}

// ============================================================================
// Fuzzy Search
// ============================================================================

function fuzzyMatch(text: string, query: string): boolean {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Direct substring match
  if (textLower.includes(queryLower)) return true;

  // Fuzzy match - all query chars appear in order
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === queryLower.length;
}

function filterCommands(commands: CommandItem[], query: string): CommandItem[] {
  if (!query.trim()) return commands;

  return commands.filter((cmd) => {
    // Match against label
    if (fuzzyMatch(cmd.label, query)) return true;
    // Match against description
    if (cmd.description && fuzzyMatch(cmd.description, query)) return true;
    // Match against keywords
    if (cmd.keywords?.some((kw) => fuzzyMatch(kw, query))) return true;
    return false;
  });
}

// ============================================================================
// Highlight Component
// ============================================================================

const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);

  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className='bg-[var(--tf-transcend-highlight)]/30 text-[var(--tf-transcend-highlight)] rounded px-0.5'>
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
};

// ============================================================================
// Command Item Component
// ============================================================================

interface CommandItemRowProps {
  command: CommandItem;
  isSelected: boolean;
  searchQuery: string;
  onClick: () => void;
}

const CommandItemRow: React.FC<CommandItemRowProps> = ({
  command,
  isSelected,
  searchQuery,
  onClick,
}) => (
  <button
    role='option'
    aria-selected={isSelected}
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 text-left',
      'transition-colors duration-100',
      'focus:outline-none',
      isSelected
        ? 'bg-[var(--tf-transcend-highlight)]/10 text-white'
        : 'text-white/80 hover:bg-white/5'
    )}
  >
    <span className='text-xl flex-shrink-0'>{command.icon}</span>
    <div className='flex-1 min-w-0'>
      <div className='text-sm font-medium truncate'>
        <HighlightedText text={command.label} query={searchQuery} />
      </div>
      {command.description && (
        <div className='text-xs text-white/50 truncate'>
          {command.description}
        </div>
      )}
    </div>
    {command.shortcut && (
      <kbd className='px-2 py-1 text-xs bg-white/10 rounded text-white/60 font-mono'>
        {command.shortcut}
      </kbd>
    )}
  </button>
);

// ============================================================================
// Main Component
// ============================================================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({ className }) => {
  const isOpen = useCommandPaletteOpen();
  const recentCommandIds = useRecentCommands();
  const { close, setSearchQuery } = useCommandPaletteStore();
  const commands = useCommandRegistry();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => filterCommands(commands, query), [commands, query]);

  // Get recent commands
  const recentCommands = useMemo(() => {
    if (query.trim()) return []; // Don't show recent when searching
    return recentCommandIds
      .map((id) => commands.find((c) => c.id === id))
      .filter((c): c is CommandItem => c !== undefined);
  }, [recentCommandIds, commands, query]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      recent: [],
      modules: [],
      settings: [],
      actions: [],
    };

    // Add recent items
    if (!query.trim() && recentCommands.length > 0) {
      groups.recent = recentCommands;
    }

    // Add filtered items to their categories (excluding items already in recent)
    const recentIds = new Set(recentCommandIds);
    const itemsToGroup = query.trim() ? filteredCommands : commands;
    
    itemsToGroup.forEach((item) => {
      // Skip if already in recent section (when not searching)
      if (!query.trim() && recentIds.has(item.id)) return;
      
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });

    return groups;
  }, [filteredCommands, commands, query, recentCommands, recentCommandIds]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const result: CommandItem[] = [];
    ['recent', 'modules', 'settings', 'actions'].forEach((cat) => {
      result.push(...(groupedItems[cat] || []));
    });
    return result;
  }, [groupedItems]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatList.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[selectedIndex]) {
            flatList[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [flatList, selectedIndex, close]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector('[aria-selected="true"]');
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle query change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSearchQuery(e.target.value);
  };

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    recent: 'Recent',
    modules: 'Modules',
    settings: 'Settings',
    actions: 'Actions',
  };

  // Track current index for flat navigation
  let currentFlatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid='command-palette-backdrop'
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]'
        onClick={close}
        aria-hidden='true'
      />

      {/* Palette */}
      <div
        data-testid='command-palette'
        role='dialog'
        aria-label='Command Palette'
        aria-modal='true'
        className={cn(
          'fixed top-[15%] left-1/2 -translate-x-1/2',
          'w-full max-w-xl',
          'bg-[var(--tf-void-black)]/95 backdrop-blur-xl',
          'border border-[var(--tf-transcend-highlight)]/30',
          'rounded-xl overflow-hidden',
          'shadow-[0_0_60px_rgba(0,255,238,0.2),0_25px_50px_rgba(0,0,0,0.5)]',
          'z-[10000]',
          className
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className='flex items-center gap-3 px-4 py-3 border-b border-white/10'>
          <span className='text-white/50' aria-hidden='true'>🔍</span>
          <input
            ref={inputRef}
            data-testid='command-palette-input'
            type='text'
            placeholder='Search modules, settings, actions...'
            value={query}
            onChange={handleQueryChange}
            className={cn(
              'flex-1 bg-transparent text-white placeholder-white/40',
              'text-sm outline-none'
            )}
            aria-label='Search commands'
            autoComplete='off'
          />
          <kbd className='px-2 py-1 text-xs bg-white/10 rounded text-white/40'>
            esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          role='listbox'
          aria-label='Search results'
          className='max-h-[400px] overflow-y-auto'
        >
          {flatList.length === 0 ? (
            <div 
              data-testid='command-palette-empty'
              className='py-12 text-center text-white/50'
            >
              <span className='text-3xl block mb-2'>🔍</span>
              <p className='text-sm'>No results found</p>
            </div>
          ) : (
            ['recent', 'modules', 'settings', 'actions'].map((category) => {
              const items = groupedItems[category] || [];
              if (items.length === 0) return null;

              const startIndex = currentFlatIndex;

              return (
                <div key={category} role='group' aria-label={categoryLabels[category]}>
                  <div 
                    data-testid={`command-palette-group-${category}`}
                    className='px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider'
                  >
                    {categoryLabels[category]}
                  </div>
                  {items.map((item, idx) => {
                    const flatIdx = startIndex + idx;
                    currentFlatIndex++;
                    return (
                      <CommandItemRow
                        key={item.id}
                        command={item}
                        isSelected={flatIdx === selectedIndex}
                        searchQuery={query}
                        onClick={item.action}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-white/40'>
          <div className='flex items-center gap-4'>
            <span>
              <kbd className='px-1 bg-white/10 rounded'>↑↓</kbd> navigate
            </span>
            <span>
              <kbd className='px-1 bg-white/10 rounded'>⏎</kbd> select
            </span>
          </div>
          <span data-testid='command-palette-count'>{flatList.length} commands</span>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
