/**
 * Launcher Ranking Engine
 *
 * Deterministic search ranking for launcher items.
 * Uses a scoring system based on match type and personalization boosts.
 *
 * Ranking Order (descending priority):
 * 1. Prefix match in label (100 points)
 * 2. Word match in label (70 points)
 * 3. Substring match in label (40 points)
 * 4. Keyword match (20 points)
 * 5. Pinned boost (+50 points if pinned)
 * 6. Recent boost (+30 points scaled by recency)
 *
 * @module launcher/ranking
 */

import type { LauncherItem } from './launcherModel';

// ============================================================================
// Types
// ============================================================================

export interface RankingContext {
  /** Set of pinned item IDs */
  pinnedIds: Set<string>;
  /** List of recent item IDs (MRU order) */
  recentIds: string[];
}

export interface RankedItem extends LauncherItem {
  /** Computed ranking score */
  score: number;
}

// ============================================================================
// Scoring Constants
// ============================================================================

const SCORE_PREFIX_MATCH = 100;
const SCORE_WORD_MATCH = 70;
const SCORE_SUBSTRING_MATCH = 40;
const SCORE_KEYWORD_MATCH = 20;

const BOOST_PINNED = 50;
const BOOST_RECENT_MAX = 30;

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate match score for a query against an item's label.
 */
function calculateLabelScore(label: string, query: string): number {
  if (!query) return 0;

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Prefix match (highest priority)
  if (lowerLabel.startsWith(lowerQuery)) {
    return SCORE_PREFIX_MATCH;
  }

  // Word match (starts of words)
  const words = lowerLabel.split(/\s+/);
  if (words.some((word) => word.startsWith(lowerQuery))) {
    return SCORE_WORD_MATCH;
  }

  // Substring match
  if (lowerLabel.includes(lowerQuery)) {
    return SCORE_SUBSTRING_MATCH;
  }

  return 0;
}

/**
 * Calculate score for keyword matches.
 */
function calculateKeywordScore(keywords: string[], query: string): number {
  if (!query) return 0;

  const lowerQuery = query.toLowerCase();

  // Check if any keyword contains the query
  const hasMatch = keywords.some((kw) => kw.toLowerCase().includes(lowerQuery));

  return hasMatch ? SCORE_KEYWORD_MATCH : 0;
}

/**
 * Calculate pinned boost.
 */
function calculatePinnedBoost(id: string, pinnedIds: Set<string>): number {
  return pinnedIds.has(id) ? BOOST_PINNED : 0;
}

/**
 * Calculate recent boost (scaled by recency position).
 * Index 0 = most recent = full boost, decays linearly.
 */
function calculateRecentBoost(id: string, recentIds: string[]): number {
  const index = recentIds.indexOf(id);
  if (index === -1) return 0;

  // Linear decay: index 0 = 30, index 9 = 3
  const positionFactor = 1 - index / Math.max(recentIds.length, 1);
  return Math.round(BOOST_RECENT_MAX * positionFactor);
}

/**
 * Calculate total score for an item.
 */
function calculateScore(item: LauncherItem, query: string, context: RankingContext): number {
  const labelScore = calculateLabelScore(item.label, query);
  const keywordScore = calculateKeywordScore(item.keywords, query);
  const pinnedBoost = calculatePinnedBoost(item.id, context.pinnedIds);
  const recentBoost = calculateRecentBoost(item.id, context.recentIds);

  // Use highest match score (not cumulative for match types)
  const matchScore = Math.max(labelScore, keywordScore);

  // Add boosts
  return matchScore + pinnedBoost + recentBoost;
}

// ============================================================================
// Ranking Function
// ============================================================================

/**
 * Rank launcher items by search query and personalization context.
 *
 * When query is empty:
 * - Items are ranked by: Pinned > Recent > Alphabetical within sections
 *
 * When query is present:
 * - Items are ranked by score (descending)
 * - Items with score 0 are filtered out
 *
 * @param items - All launcher items
 * @param query - Search query (empty string = no filter)
 * @param context - Personalization context (pinned, recents)
 * @returns Ranked and filtered items
 */
export function rankItems(
  items: LauncherItem[],
  query: string,
  context: RankingContext
): RankedItem[] {
  const trimmedQuery = query.trim();

  // Score all items
  const scoredItems: RankedItem[] = items.map((item) => ({
    ...item,
    score: calculateScore(item, trimmedQuery, context),
  }));

  // Filter out non-matching items when query is present.
  // Must pass on MATCH score (label/keyword), not total score — pinned/recent boosts
  // should only affect ordering among matched items, not whether an item appears.
  const filteredItems = trimmedQuery
    ? scoredItems.filter(
        (item) =>
          Math.max(
            calculateLabelScore(item.label, trimmedQuery),
            calculateKeywordScore(item.keywords, trimmedQuery),
          ) > 0,
      )
    : scoredItems;

  // Sort by score descending, then alphabetically by label for stable ordering
  return filteredItems.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.label.localeCompare(b.label);
  });
}

/**
 * Check if an item matches a query (for filtering).
 */
export function itemMatchesQuery(item: LauncherItem, query: string): boolean {
  if (!query.trim()) return true;

  const lowerQuery = query.toLowerCase();

  return (
    item.label.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery) ||
    item.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Build sections for launcher display (empty query view).
 * Order: Pinned → Recent → Suites → System
 */
export function buildSectionsForEmptyQuery(
  items: LauncherItem[],
  context: RankingContext
): Array<{ id: string; label: string; items: LauncherItem[] }> {
  const pinnedItems = items.filter((item) => context.pinnedIds.has(item.id));
  const recentItems = context.recentIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is LauncherItem => item !== undefined)
    .filter((item) => !context.pinnedIds.has(item.id)); // Don't duplicate pinned

  const remainingItems = items.filter(
    (item) => !context.pinnedIds.has(item.id) && !context.recentIds.includes(item.id)
  );

  const suiteItems = remainingItems.filter(
    (item) => item.intent === 'workbench' || item.intent === 'standalone'
  );
  const systemItems = remainingItems.filter((item) => item.intent === 'system');

  const sections = [
    { id: 'pinned', label: 'Pinned', items: pinnedItems },
    { id: 'recent', label: 'Recent', items: recentItems },
    { id: 'suites', label: 'Suites', items: suiteItems },
    { id: 'system', label: 'System', items: systemItems },
  ];

  // Filter out empty sections
  return sections.filter((section) => section.items.length > 0);
}
