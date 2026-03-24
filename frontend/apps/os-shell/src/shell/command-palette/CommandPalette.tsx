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
import { LiquidPanel } from '../../ui/materials';
import { getLucideIcon } from '../../config/iconMap';
import { activateModule } from '../../orchestration/moduleActivation';
import { SCENE_LIBRARY } from '../../stores/sceneStore';
import { Z } from '../desktop/zIndex';
import {
  useCommandPaletteStore,
  useCommandPaletteOpen,
  useRecentCommands,
  type CommandCategory,
} from '../../stores/commandPaletteStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { TerraSphereIcon, type TerraSphereIconVariant } from '../../ui/brand/TerraSphereIcon';
import { useParcelSearch } from './useParcelSearch';

// ============================================================================
// Types
// ============================================================================

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  iconName: string;
  iconVariant?: TerraSphereIconVariant;
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
      {
        id: 'suite-forge',
        label: 'TerraForge',
        iconName: 'Hammer',
        iconVariant: 'assessment' as TerraSphereIconVariant,
        keywords: ['forge', 'valuation', 'cost', 'assessment', 'property'],
      },
      {
        id: 'suite-atlas',
        label: 'TerraAtlas',
        iconName: 'Globe',
        iconVariant: 'mapping' as TerraSphereIconVariant,
        keywords: ['atlas', 'map', 'gis', 'geographic', 'parcels'],
      },
      {
        id: 'suite-dais',
        label: 'TerraDais',
        iconName: 'LayoutDashboard',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['dais', 'workflow', 'governance', 'dashboard'],
      },
      {
        id: 'suite-dossier',
        label: 'TerraDossier',
        iconName: 'FileStack',
        iconVariant: 'records' as TerraSphereIconVariant,
        keywords: ['dossier', 'document', 'records', 'archive'],
      },
      {
        id: 'suite-gpt',
        label: 'TerraGPT',
        iconName: 'Brain',
        iconVariant: 'ai' as TerraSphereIconVariant,
        keywords: ['gpt', 'ai', 'assistant', 'chat', 'natural language'],
      },
      {
        id: 'costforge',
        label: 'TerraForge Legacy',
        iconName: 'Calculator',
        iconVariant: 'tax' as TerraSphereIconVariant,
        description: 'Launch the legacy CostForge valuation panel',
        keywords: ['terraforge', 'costforge', 'legacy', 'cost', 'property', 'assessment'],
        shortcutTerms: ['costforge', 'terraforge'],
      },
      {
        id: 'terra-gaia',
        label: 'TerraGPT Legacy',
        iconName: 'Globe',
        iconVariant: 'mapping' as TerraSphereIconVariant,
        description: 'Launch the legacy TerraGaia assistant panel',
        keywords: ['terragpt', 'terragaia', 'legacy', 'earth', 'gis', 'map', 'geo', 'assistant'],
        shortcutTerms: ['terragaia', 'terragpt'],
      },
      {
        id: 'atlas-ai',
        label: 'TerraAtlas Legacy AI',
        iconName: 'Brain',
        iconVariant: 'ai' as TerraSphereIconVariant,
        description: 'Launch the legacy ATLAS AI assistant panel',
        keywords: ['terraatlas', 'atlas ai', 'atlas', 'legacy', 'ai', 'assistant', 'intelligence'],
        shortcutTerms: ['atlas ai', 'terraatlas'],
      },
      {
        id: 'reporting',
        label: 'Analytics',
        iconName: 'BarChart3',
        iconVariant: 'analytics' as TerraSphereIconVariant,
        keywords: ['reports', 'data', 'charts', 'analytics'],
      },
      {
        id: 'marketplace',
        label: 'Marketplace',
        iconName: 'Briefcase',
        iconVariant: 'default' as TerraSphereIconVariant,
        keywords: ['store', 'apps', 'plugins'],
      },
      {
        id: 'counties',
        label: 'Counties Hub',
        iconName: 'Building2',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['county', 'government', 'admin'],
      },
      {
        id: 'government-architecture',
        label: 'Gov Architecture',
        iconName: 'Layers',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['architecture', 'infrastructure'],
      },
      {
        id: 'levy-calculator',
        label: 'Levy Calculator',
        iconName: 'Calculator',
        iconVariant: 'tax' as TerraSphereIconVariant,
        keywords: ['levy', 'tax', 'calculate'],
      },
      {
        id: 'gis-viewer',
        label: 'GIS Viewer',
        iconName: 'Map',
        iconVariant: 'mapping' as TerraSphereIconVariant,
        keywords: ['gis', 'map', 'parcels'],
      },
      {
        id: 'document-manager',
        label: 'Documents',
        iconName: 'FileText',
        iconVariant: 'records' as TerraSphereIconVariant,
        keywords: ['files', 'documents', 'records'],
      },
    ];

    modules.forEach((mod) => {
      const shortcutTerms = mod.shortcutTerms ?? [mod.label.toLowerCase().split(' ')[0]];
      const shortcut = keyboardShortcuts.find(
        (s) => shortcutTerms.some((term) => s.action.toLowerCase().includes(term))
      );

      commands.push({
        id: `module:${mod.id}`,
        label: `Open ${mod.label}`,
        description: mod.description ?? `Launch the ${mod.label} module`,
        iconName: mod.iconName,
        iconVariant: mod.iconVariant,
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
      {
        id: 'general',
        label: 'General Settings',
        iconName: 'Settings',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['system', 'info', 'language'],
      },
      {
        id: 'appearance',
        label: 'Appearance Settings',
        iconName: 'LayoutDashboard',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['theme', 'dark', 'light'],
      },
      {
        id: 'accessibility',
        label: 'Accessibility Settings',
        iconName: 'Shield',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['contrast', 'motion', 'font'],
      },
      {
        id: 'notifications',
        label: 'Notification Settings',
        iconName: 'Activity',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['alerts', 'toast', 'sound'],
      },
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        iconName: 'Terminal',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['keyboard', 'hotkeys', 'bindings'],
      },
      {
        id: 'about',
        label: 'About TerraFusion',
        iconName: 'FileText',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['version', 'info', 'about'],
      },
    ];

    settingsTabs.forEach((tab) => {
      commands.push({
        id: `settings:${tab.id}`,
        label: tab.label,
        description: `Open ${tab.label.toLowerCase()}`,
        iconName: tab.iconName,
        iconVariant: tab.iconVariant,
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
        iconName: 'LayoutDashboard', 
        iconVariant: 'system' as TerraSphereIconVariant,
        shortcut: 'Ctrl+`',
        keywords: ['start', 'menu', 'launch'],
      },
      { 
        id: 'refresh', 
        label: 'Refresh Desktop', 
        iconName: 'Activity',
        iconVariant: 'system' as TerraSphereIconVariant,
        keywords: ['refresh', 'reload'],
      },
    ];

    actions.forEach((action) => {
      commands.push({
        id: `action:${action.id}`,
        label: action.label,
        iconName: action.iconName,
        iconVariant: action.iconVariant,
        category: 'actions',
        keywords: action.keywords,
        shortcut: action.shortcut,
        action: () => {
          addToRecent(`action:${action.id}`);
          close();
        },
      });
    });

    // ========================================================================
    // Scene Commands (Phase 8: Context Mode / Canonical Scenes)
    // ========================================================================
    SCENE_LIBRARY.forEach((scene) => {
      commands.push({
        id: `scene:${scene.id}`,
        label: `Scene: ${scene.label}`,
        description: scene.description,
        icon: scene.icon,
        category: 'actions',
        keywords: ['scene', 'layout', 'workflow', ...scene.keywords],
        action: () => {
          for (const w of scene.windows) {
            activateModule(w.moduleId, {
              source: 'command_palette',
              metadata: { scene: scene.id, ...w.metadata },
            });
          }
          addToRecent(`scene:${scene.id}`);
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
}) => {
  const Icon = getLucideIcon(command.iconName);

  return (
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
      <TerraSphereIcon
        size={24}
        variant={command.iconVariant ?? 'default'}
        glyph={<Icon className='h-2.5 w-2.5' />}
      />
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-medium truncate'>
          <HighlightedText text={command.label} query={searchQuery} />
        </div>
        {command.description && (
          <div className='text-xs text-white/50 truncate'>{command.description}</div>
        )}
      </div>
      {command.shortcut && (
        <kbd className='px-2 py-1 text-xs bg-white/10 rounded text-white/60 font-mono'>
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
};

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

  // API-backed parcel search (address/owner queries)
  const { results: parcelSearchResults, isLoading: isParcelSearchLoading } = useParcelSearch(query, isOpen);

  // Filter commands based on query
  const filteredCommands = useMemo(() => filterCommands(commands, query), [commands, query]);

  // Dynamic parcel search command — when query is all digits, offer "Go to Parcel"
  const parcelCommand = useMemo((): CommandItem | null => {
    const trimmed = query.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) return null;
    return {
      id: `nav:parcel:${trimmed}`,
      label: `Go to Parcel ${trimmed}`,
      description: 'Open property workbench for this parcel',
      iconName: 'MapPin',
      iconVariant: 'mapping',
      category: 'navigation',
      keywords: ['parcel', 'property'],
      action: async () => {
        const { openWorkbenchWindow } = await import('../../context/parcelContext');
        openWorkbenchWindow(trimmed);
        close();
      },
    };
  }, [query, close]);

  // Convert API parcel search results into CommandItems
  const parcelSearchCommands = useMemo((): CommandItem[] => {
    return parcelSearchResults.map((r) => ({
      id: `search:parcel:${r.parcelNumber}`,
      label: `${r.address}`,
      description: `${r.parcelNumber} — ${r.ownerName}`,
      iconName: 'MapPin',
      iconVariant: 'mapping' as TerraSphereIconVariant,
      category: 'navigation' as CommandCategory,
      keywords: ['parcel', 'property', 'search'],
      action: async () => {
        const { openWorkbenchWindow } = await import('../../context/parcelContext');
        openWorkbenchWindow(r.parcelNumber);
        close();
      },
    }));
  }, [parcelSearchResults, close]);

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
      navigation: [],
      recent: [],
      modules: [],
      settings: [],
      actions: [],
    };

    // Add dynamic parcel search command at the top (digits-only shortcut)
    if (parcelCommand) {
      groups.navigation.push(parcelCommand);
    }

    // Add API-backed parcel search results below the digits shortcut
    if (parcelSearchCommands.length > 0) {
      groups.navigation.push(...parcelSearchCommands);
    }

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
  }, [filteredCommands, commands, query, recentCommands, recentCommandIds, parcelCommand, parcelSearchCommands]);

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const result: CommandItem[] = [];
    ['navigation', 'recent', 'modules', 'settings', 'actions'].forEach((cat) => {
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
    navigation: 'Navigate',
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
        className='fixed inset-0 bg-[hsl(var(--tf-bg)/0.5)] backdrop-blur-sm'
        style={{ zIndex: Z.commandBackdrop }}
        onClick={close}
        aria-hidden='true'
      />

      {/* Palette */}
      <LiquidPanel
        variant='shell'
        radius='xl'
        blurIntensity={3}
        data-testid='command-palette'
        role='dialog'
        aria-label='Command Palette'
        aria-modal='true'
        style={{ zIndex: Z.commandPalette }}
        className={cn(
          'fixed top-[15%] left-1/2 -translate-x-1/2',
          'w-full max-w-xl',
          'overflow-hidden',
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
            role='combobox'
            aria-expanded={isOpen}
            aria-autocomplete='list'
            aria-label='Search commands'
            autoComplete='off'
          />
          {isParcelSearchLoading && (
            <span data-testid='parcel-search-loading' className='text-xs text-white/40 animate-pulse'>Searching…</span>
          )}
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
            ['navigation', 'recent', 'modules', 'settings', 'actions'].map((category) => {
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
      </LiquidPanel>
    </>
  );
};

export default CommandPalette;
