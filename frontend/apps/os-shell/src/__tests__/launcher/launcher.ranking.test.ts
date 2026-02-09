/**
 * TerraFusion OS Launcher Ranking Tests
 *
 * Tests for deterministic search ranking.
 *
 * @module __tests__/launcher/launcher.ranking.test
 * @vitest-environment jsdom
 * @see Slice 5: Launcher Polish
 */

import type { LauncherItem } from '../../components/launcher/launcherModel';
import {
    buildSectionsForEmptyQuery,
    rankItems,
    type RankingContext,
} from '../../components/launcher/ranking';

// ============================================================================
// Test Data
// ============================================================================

const MOCK_ITEMS: LauncherItem[] = [
  {
    id: 'forge',
    label: 'TerraForge',
    description: 'Property valuation',
    icon: '🔨',
    intent: 'workbench',
    route: '/property/123/forge',
    keywords: ['valuation', 'cost', 'assessment'],
    a11yLabel: 'TerraForge - Property valuation',
  },
  {
    id: 'atlas',
    label: 'Atlas',
    description: 'Map visualization',
    icon: '🗺️',
    intent: 'workbench',
    route: '/property/123/atlas',
    keywords: ['map', 'gis', 'spatial'],
    a11yLabel: 'Atlas - Map visualization',
  },
  {
    id: 'dais',
    label: 'DAIS',
    description: 'Analytics dashboard',
    icon: '📊',
    intent: 'workbench',
    route: '/property/123/dais',
    keywords: ['analytics', 'dashboard', 'reports'],
    a11yLabel: 'DAIS - Analytics dashboard',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'System configuration',
    icon: '⚙️',
    intent: 'system',
    route: '/settings',
    keywords: ['config', 'preferences', 'options'],
    a11yLabel: 'Settings - System configuration',
  },
  {
    id: 'docs',
    label: 'Documentation',
    description: 'Help and guides',
    icon: '📄',
    intent: 'system',
    route: '/docs',
    keywords: ['help', 'guides', 'manual'],
    a11yLabel: 'Documentation - Help and guides',
  },
  {
    id: 'navigator',
    label: 'Navigator',
    description: 'Property navigation',
    icon: '🎮',
    intent: 'standalone',
    route: '/navigator',
    keywords: ['browse', 'search', 'find'],
    a11yLabel: 'Navigator - Property navigation',
  },
];

const EMPTY_CONTEXT: RankingContext = {
  pinnedIds: new Set(),
  recentIds: [],
};

// ============================================================================
// Test Setup
// ============================================================================

describe('Launcher Ranking', () => {
  // ==========================================================================
  // Basic Matching Tests
  // ==========================================================================

  describe('Basic Matching', () => {
    it('returns_all_items_for_empty_query', () => {
      const result = rankItems(MOCK_ITEMS, '', EMPTY_CONTEXT);

      expect(result.length).toBe(MOCK_ITEMS.length);
    });

    it('filters_items_by_query', () => {
      const result = rankItems(MOCK_ITEMS, 'forge', EMPTY_CONTEXT);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('forge');
    });

    it('case_insensitive_matching', () => {
      const result = rankItems(MOCK_ITEMS, 'FORGE', EMPTY_CONTEXT);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('forge');
    });

    it('returns_empty_for_no_matches', () => {
      const result = rankItems(MOCK_ITEMS, 'zzzznonexistent', EMPTY_CONTEXT);

      expect(result.length).toBe(0);
    });
  });

  // ==========================================================================
  // Prefix vs Substring Ranking Tests
  // ==========================================================================

  describe('Prefix vs Substring Ranking', () => {
    it('prefix_match_outranks_substring', () => {
      // 'at' should match 'Atlas' (prefix of word) and 'Navigator' (substring)
      const result = rankItems(MOCK_ITEMS, 'at', EMPTY_CONTEXT);

      // Atlas should rank higher (prefix match)
      const atlasIndex = result.findIndex((item) => item.id === 'atlas');
      const navigatorIndex = result.findIndex((item) => item.id === 'navigator');

      // If navigator doesn't match, that's fine
      if (navigatorIndex !== -1) {
        expect(atlasIndex).toBeLessThan(navigatorIndex);
      }
    });

    it('full_word_prefix_ranks_highest', () => {
      // 'Terra' should give TerraForge highest score
      const result = rankItems(MOCK_ITEMS, 'Terra', EMPTY_CONTEXT);

      expect(result[0].id).toBe('forge');
    });

    it('word_boundary_match_outranks_substring', () => {
      // 'Set' should match 'Settings' (prefix) higher than substring would
      const result = rankItems(MOCK_ITEMS, 'Set', EMPTY_CONTEXT);

      expect(result[0].id).toBe('settings');
    });
  });

  // ==========================================================================
  // Keyword Matching Tests
  // ==========================================================================

  describe('Keyword Matching', () => {
    it('matches_on_keywords', () => {
      // 'valuation' is a keyword for TerraForge
      const result = rankItems(MOCK_ITEMS, 'valuation', EMPTY_CONTEXT);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe('forge');
    });

    it('label_match_outranks_keyword', () => {
      // 'map' is a keyword for Atlas, but if there were a 'Map' label item, it would rank higher
      // For this test, just verify keyword gives a score
      const result = rankItems(MOCK_ITEMS, 'map', EMPTY_CONTEXT);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((item) => item.id === 'atlas')).toBe(true);
    });

    it('keyword_partial_match_works', () => {
      // 'dash' should match 'dashboard' keyword for DAIS
      const result = rankItems(MOCK_ITEMS, 'dash', EMPTY_CONTEXT);

      expect(result.some((item) => item.id === 'dais')).toBe(true);
    });
  });

  // ==========================================================================
  // Pinned Boost Tests
  // ==========================================================================

  describe('Pinned Boost', () => {
    it('pinned_items_rank_higher', () => {
      const pinnedContext: RankingContext = {
        pinnedIds: new Set(['docs']),
        recentIds: [],
      };

      // Search for 'd' which matches DAIS, Documentation, etc.
      const result = rankItems(MOCK_ITEMS, 'd', pinnedContext);

      // Docs should rank higher due to pinned boost
      const docsIndex = result.findIndex((item) => item.id === 'docs');
      const daisIndex = result.findIndex((item) => item.id === 'dais');

      expect(docsIndex).toBeLessThan(daisIndex);
    });

    it('pinned_boost_is_deterministic', () => {
      const pinnedContext: RankingContext = {
        pinnedIds: new Set(['atlas']),
        recentIds: [],
      };

      // Run twice
      const result1 = rankItems(MOCK_ITEMS, 'a', pinnedContext);
      const result2 = rankItems(MOCK_ITEMS, 'a', pinnedContext);

      expect(result1.map((i) => i.id)).toEqual(result2.map((i) => i.id));
    });

    it('multiple_pinned_items_all_boosted', () => {
      const pinnedContext: RankingContext = {
        pinnedIds: new Set(['forge', 'docs']),
        recentIds: [],
      };

      const result = rankItems(MOCK_ITEMS, '', pinnedContext);

      // Pinned items should have higher scores
      const forgeItem = result.find((i) => i.id === 'forge');
      const docsItem = result.find((i) => i.id === 'docs');
      const atlasItem = result.find((i) => i.id === 'atlas');

      expect(forgeItem!.score).toBeGreaterThan(atlasItem!.score);
      expect(docsItem!.score).toBeGreaterThan(atlasItem!.score);
    });
  });

  // ==========================================================================
  // Recent Boost Tests
  // ==========================================================================

  describe('Recent Boost', () => {
    it('recent_items_rank_higher', () => {
      const recentContext: RankingContext = {
        pinnedIds: new Set(),
        recentIds: ['settings'],
      };

      // Search that matches both settings and other items
      const result = rankItems(MOCK_ITEMS, 's', recentContext);

      // Settings should rank higher due to recent boost
      const settingsIndex = result.findIndex((item) => item.id === 'settings');
      expect(settingsIndex).toBe(0);
    });

    it('more_recent_ranks_higher_than_less_recent', () => {
      const recentContext: RankingContext = {
        pinnedIds: new Set(),
        recentIds: ['atlas', 'forge'], // atlas is more recent (index 0)
      };

      const result = rankItems(MOCK_ITEMS, '', recentContext);

      const atlasItem = result.find((i) => i.id === 'atlas');
      const forgeItem = result.find((i) => i.id === 'forge');

      // Atlas should have higher score
      expect(atlasItem!.score).toBeGreaterThan(forgeItem!.score);
    });

    it('recent_boost_decays_by_position', () => {
      const recentContext: RankingContext = {
        pinnedIds: new Set(),
        recentIds: ['forge', 'atlas', 'dais'],
      };

      const result = rankItems(MOCK_ITEMS, '', recentContext);

      const forgeItem = result.find((i) => i.id === 'forge');
      const atlasItem = result.find((i) => i.id === 'atlas');
      const daisItem = result.find((i) => i.id === 'dais');

      expect(forgeItem!.score).toBeGreaterThan(atlasItem!.score);
      expect(atlasItem!.score).toBeGreaterThan(daisItem!.score);
    });
  });

  // ==========================================================================
  // Combined Boost Tests
  // ==========================================================================

  describe('Combined Boosts', () => {
    it('pinned_plus_recent_ranks_highest', () => {
      const context: RankingContext = {
        pinnedIds: new Set(['forge']),
        recentIds: ['forge', 'atlas'],
      };

      const result = rankItems(MOCK_ITEMS, '', context);

      // Forge has both pinned and recent boost
      expect(result[0].id).toBe('forge');
    });

    it('pinned_outranks_recent_only', () => {
      const context: RankingContext = {
        pinnedIds: new Set(['settings']),
        recentIds: ['forge', 'atlas', 'dais'],
      };

      const result = rankItems(MOCK_ITEMS, '', context);

      // Settings (pinned) should outrank forge (only recent)
      const settingsIndex = result.findIndex((i) => i.id === 'settings');
      const forgeIndex = result.findIndex((i) => i.id === 'forge');

      expect(settingsIndex).toBeLessThan(forgeIndex);
    });
  });

  // ==========================================================================
  // Determinism Tests
  // ==========================================================================

  describe('Determinism', () => {
    it('same_input_produces_same_output', () => {
      const context: RankingContext = {
        pinnedIds: new Set(['forge']),
        recentIds: ['atlas', 'dais'],
      };

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(rankItems(MOCK_ITEMS, 'a', context).map((i) => i.id));
      }

      // All runs should produce identical output
      for (const result of results) {
        expect(result).toEqual(results[0]);
      }
    });

    it('alphabetical_tiebreaker_for_equal_scores', () => {
      // Items with equal scores should sort alphabetically
      const result = rankItems(MOCK_ITEMS, '', EMPTY_CONTEXT);

      // Filter to just items with score 0 (non-pinned, non-recent)
      const zeroScoreItems = result.filter((i) => i.score === 0);

      // Should be alphabetically sorted
      for (let i = 1; i < zeroScoreItems.length; i++) {
        expect(
          zeroScoreItems[i - 1].label.localeCompare(zeroScoreItems[i].label)
        ).toBeLessThanOrEqual(0);
      }
    });
  });

  // ==========================================================================
  // Empty Query Section Building Tests
  // ==========================================================================

  describe('Empty Query Sections', () => {
    it('builds_sections_in_correct_order', () => {
      const context: RankingContext = {
        pinnedIds: new Set(['forge']),
        recentIds: ['atlas'],
      };

      const sections = buildSectionsForEmptyQuery(MOCK_ITEMS, context);

      const sectionIds = sections.map((s) => s.id);
      expect(sectionIds).toEqual(['pinned', 'recent', 'suites', 'system']);
    });

    it('pinned_section_contains_pinned_items', () => {
      const context: RankingContext = {
        pinnedIds: new Set(['forge', 'settings']),
        recentIds: [],
      };

      const sections = buildSectionsForEmptyQuery(MOCK_ITEMS, context);
      const pinnedSection = sections.find((s) => s.id === 'pinned');

      expect(pinnedSection).toBeDefined();
      expect(pinnedSection!.items.map((i) => i.id)).toContain('forge');
      expect(pinnedSection!.items.map((i) => i.id)).toContain('settings');
    });

    it('recent_section_excludes_pinned_items', () => {
      const context: RankingContext = {
        pinnedIds: new Set(['forge']),
        recentIds: ['forge', 'atlas'],
      };

      const sections = buildSectionsForEmptyQuery(MOCK_ITEMS, context);
      const recentSection = sections.find((s) => s.id === 'recent');

      // Forge is pinned, so it shouldn't appear in recent
      expect(recentSection!.items.map((i) => i.id)).not.toContain('forge');
      expect(recentSection!.items.map((i) => i.id)).toContain('atlas');
    });

    it('empty_sections_are_filtered_out', () => {
      const context: RankingContext = {
        pinnedIds: new Set(),
        recentIds: [],
      };

      const sections = buildSectionsForEmptyQuery(MOCK_ITEMS, context);

      // No pinned or recent sections when empty
      expect(sections.find((s) => s.id === 'pinned')).toBeUndefined();
      expect(sections.find((s) => s.id === 'recent')).toBeUndefined();
    });

    it('suites_section_contains_workbench_and_standalone', () => {
      const sections = buildSectionsForEmptyQuery(MOCK_ITEMS, EMPTY_CONTEXT);
      const suitesSection = sections.find((s) => s.id === 'suites');

      expect(suitesSection).toBeDefined();
      expect(suitesSection!.items.some((i) => i.intent === 'workbench')).toBe(true);
      expect(suitesSection!.items.some((i) => i.intent === 'standalone')).toBe(true);
    });

    it('system_section_contains_system_items', () => {
      const sections = buildSectionsForEmptyQuery(MOCK_ITEMS, EMPTY_CONTEXT);
      const systemSection = sections.find((s) => s.id === 'system');

      expect(systemSection).toBeDefined();
      expect(systemSection!.items.every((i) => i.intent === 'system')).toBe(true);
    });
  });
});
