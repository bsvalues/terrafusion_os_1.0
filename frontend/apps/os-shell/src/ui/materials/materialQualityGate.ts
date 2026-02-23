/**
 * @fileoverview Material Quality Gate
 *
 * Runtime classifier for GPU tier, reduced-motion preference, and low-power mode.
 * This gate determines which visual effects are safe to render without causing
 * performance degradation or accessibility issues.
 *
 * Design Principles:
 * 1. NO POLLING - quality is computed once and cached
 * 2. NO INTERVALS - never schedules recurring updates
 * 3. NO RAF LOOPS - effects are event-driven only
 * 4. GRACEFUL DEGRADATION - always provides a usable fallback
 *
 * @module materialQualityGate
 */

import { useSyncExternalStore } from 'react';

// ============================================================================
// Types & Constants
// ============================================================================

export enum MaterialQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface MaterialQualityState {
  /** Current quality tier */
  tier: MaterialQuality;
  /** GPU tier (0-3, where 0-1 = low power) */
  gpuTier: number;
  /** Whether backdrop-filter is safe to use */
  enableBackdropBlur: boolean;
  /** Whether WebGL distortion effects are safe */
  enableGlassDistortion: boolean;
  /** Whether spring animations are allowed */
  enableSprings: boolean;
  /** Whether warp/displacement effects are allowed */
  enableWarps: boolean;
  /** Whether looping animations are allowed */
  enableLoopingAnimations: boolean;
  /** User prefers reduced motion */
  prefersReducedMotion: boolean;
}

export interface QualityOverrides {
  gpuTier?: number;
  forceReducedMotion?: boolean;
  forceLowPower?: boolean;
}

// Constitutional values
const GPU_TIER_LOW = 1;
const GPU_TIER_MEDIUM = 2;
const GPU_TIER_HIGH = 3;

// Contrast calculation constants (WCAG)
const WCAG_AA_NORMAL = 4.5;
// const WCAG_AA_LARGE = 3.0;

// ============================================================================
// Reduced Motion Detection
// ============================================================================

/**
 * Check if user prefers reduced motion.
 * This is computed once and never polled.
 */
function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// ============================================================================
// GPU Tier Detection
// ============================================================================

/**
 * Estimate GPU tier based on available APIs and heuristics.
 * This is a simplified version - in production you might use detect-gpu library.
 *
 * Returns:
 * - 0: Very low (no WebGL, software rendering)
 * - 1: Low (basic WebGL, mobile/integrated GPU)
 * - 2: Medium (decent WebGL, mid-range GPU)
 * - 3: High (full WebGL2, dedicated GPU)
 */
function detectGPUTier(): number {
  if (typeof window === 'undefined') return 1;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) return 0;

    // Check for WebGL2 support
    const isWebGL2 = gl instanceof WebGL2RenderingContext;

    // Get renderer info if available
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

    // Heuristics for GPU tier
    const rendererLower = renderer.toLowerCase();

    // High-end dedicated GPUs
    if (
      rendererLower.includes('nvidia') ||
      rendererLower.includes('radeon') ||
      rendererLower.includes('geforce')
    ) {
      return GPU_TIER_HIGH;
    }

    // Mid-range or newer integrated
    if (isWebGL2 && (rendererLower.includes('intel') || rendererLower.includes('amd'))) {
      return GPU_TIER_MEDIUM;
    }

    // Basic WebGL support
    return GPU_TIER_LOW;
  } catch {
    return GPU_TIER_LOW;
  }
}

// ============================================================================
// Singleton State (Computed Once, Never Polled)
// ============================================================================

let cachedQuality: MaterialQualityState | null = null;
let isInitialized = false;

/**
 * Compute quality state based on system capabilities.
 * This is computed ONCE and cached - no polling, no intervals.
 */
function computeQualityState(overrides?: QualityOverrides): MaterialQualityState {
  const gpuTier = overrides?.gpuTier ?? detectGPUTier();
  const prefersReducedMotion = overrides?.forceReducedMotion ?? checkReducedMotion();
  const isLowPower = overrides?.forceLowPower ?? gpuTier <= GPU_TIER_LOW;

  // Determine quality tier
  let tier: MaterialQuality;
  if (isLowPower || gpuTier <= GPU_TIER_LOW) {
    tier = MaterialQuality.LOW;
  } else if (gpuTier === GPU_TIER_MEDIUM) {
    tier = MaterialQuality.MEDIUM;
  } else {
    tier = MaterialQuality.HIGH;
  }

  return {
    tier,
    gpuTier,
    // Backdrop blur is expensive - only on medium+
    enableBackdropBlur: tier !== MaterialQuality.LOW,
    // Distortion is very expensive - only on high
    enableGlassDistortion: tier === MaterialQuality.HIGH && !prefersReducedMotion,
    // Springs require motion permission
    enableSprings: !prefersReducedMotion,
    // Warps require motion permission
    enableWarps: tier === MaterialQuality.HIGH && !prefersReducedMotion,
    // Looping animations require motion permission
    enableLoopingAnimations: !prefersReducedMotion,
    prefersReducedMotion,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize the material quality gate.
 * Call this once at app startup. Safe to call multiple times (idempotent).
 */
export function initMaterialQualityGate(): void {
  if (isInitialized) return;
  isInitialized = true;
  cachedQuality = computeQualityState();
}

/**
 * Get the current material quality state.
 * Returns a cached value - never triggers recomputation or polling.
 */
export function getMaterialQuality(overrides?: QualityOverrides): MaterialQualityState {
  // If overrides provided, compute fresh (for testing)
  if (overrides) {
    return computeQualityState(overrides);
  }

  // Use cached value or compute it once
  if (!cachedQuality) {
    cachedQuality = computeQualityState();
  }

  return cachedQuality;
}

/**
 * Reset the quality gate (for testing only).
 * @internal
 */
export function resetMaterialQualityGate(): void {
  cachedQuality = null;
  isInitialized = false;
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * Subscribe to quality state changes.
 * Note: Quality state is computed once and never changes during the session,
 * so this subscription will never fire updates. This is intentional - no polling.
 */
function subscribeToQuality(callback: () => void): () => void {
  // Quality is computed once and cached - no updates to subscribe to
  // But we still support the pattern for future media query listeners
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = () => {
      // Recompute on media query change (rare, user-initiated)
      cachedQuality = computeQualityState();
      callback();
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }

  return () => {};
}

function getQualitySnapshot(): MaterialQualityState {
  return getMaterialQuality();
}

function getServerSnapshot(): MaterialQualityState {
  // Server-side, assume low quality for safety
  return {
    tier: MaterialQuality.LOW,
    gpuTier: 1,
    enableBackdropBlur: false,
    enableGlassDistortion: false,
    enableSprings: false,
    enableWarps: false,
    enableLoopingAnimations: false,
    prefersReducedMotion: true,
  };
}

/**
 * React hook to access material quality state.
 * This is reactive to media query changes but never polls.
 */
export function useMaterialQuality(): MaterialQualityState {
  return useSyncExternalStore(subscribeToQuality, getQualitySnapshot, getServerSnapshot);
}

// ============================================================================
// Contrast Utilities
// ============================================================================

/**
 * Get luminance of an RGB color (0-1).
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse a CSS color string to RGB.
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle color functions with r, g, b, a components
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
    };
  }

  // Handle hex
  const hexMatch = color.match(/^#([a-f0-9]{6})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1].slice(0, 2), 16),
      g: parseInt(hexMatch[1].slice(2, 4), 16),
      b: parseInt(hexMatch[1].slice(4, 6), 16),
    };
  }

  return null;
}

/**
 * Check contrast ratio between two colors.
 * Returns the WCAG contrast ratio.
 */
export function checkContrastRatio(foreground: string, background: string): number {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  if (!fg || !bg) return 0;

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get a contrast-safe text color for glass surfaces.
 */
export function getGlassTextColor(glassVariant: 'dark' | 'light'): string {
  // These colors are pre-validated to meet WCAG AA contrast on glass
  if (glassVariant === 'dark') {
    // Light text on dark glass
    return 'hsl(var(--tf-neutral-hs) 100%)'; // Pure white
  } else {
    // Dark text on light glass
    return 'hsl(var(--tf-neutral-hs) 4%)'; // Near black
  }
}

/**
 * Check if a color combination meets WCAG AA requirements.
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = checkContrastRatio(foreground, background);
  const required = isLargeText ? 3.0 : WCAG_AA_NORMAL;
  return ratio >= required;
}
