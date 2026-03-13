/**
 * TerraFusion OS Shell Mode Contract
 *
 * Governing rule: Home is a shell state, not a forever overlay.
 * Desktop is never permanently trapped behind Home.
 *
 * OS Ontology:
 *   home        → launch / orientation / pulse
 *   desktop     → persistent workspace and window field
 *   application → focused task immersion
 *
 * @module contracts/shellMode
 */

// ============================================================================
// Shell Mode Type
// ============================================================================

/**
 * The three architectural shell states of TerraFusion OS.
 *
 * - `home`        – Launch surface with recent work, quick actions, county map.
 * - `desktop`     – Full window management workspace with dock and icon grid.
 * - `application` – Focused single-app immersion (e.g. maximized workbench).
 */
export type TerraFusionShellMode = 'home' | 'desktop' | 'application';

/**
 * Canonical ordered list of shell modes for testing and iteration.
 */
export const SHELL_MODES = ['home', 'desktop', 'application'] as const;

// ============================================================================
// Surface Visibility Policy
// ============================================================================

/**
 * Surface visibility state for a given shell mode.
 *
 * - `visible`  – Rendered and interactive
 * - `hidden`   – Not rendered / display:none
 * - `receded`  – Rendered but non-interactive / behind other layers
 */
export type SurfaceVisibility = 'visible' | 'hidden' | 'receded';

/**
 * The shell surfaces controlled by mode transitions.
 */
export interface ShellSurfaces {
  recentWork: SurfaceVisibility;
  quickActions: SurfaceVisibility;
  countyMap: SurfaceVisibility;
  desktop: SurfaceVisibility;
  dock: SurfaceVisibility;
}

/**
 * ShellSurfacePolicy — source of truth for what is visible in each mode.
 *
 * | Surface       | home    | desktop | application |
 * |---------------|---------|---------|-------------|
 * | recentWork    | visible | hidden  | hidden      |
 * | quickActions  | visible | hidden  | hidden      |
 * | countyMap     | visible | hidden  | hidden      |
 * | desktop       | hidden  | visible | receded     |
 * | dock          | visible | visible | visible     |
 */
export const SHELL_SURFACE_POLICY: Record<TerraFusionShellMode, ShellSurfaces> = {
  home: {
    recentWork: 'visible',
    quickActions: 'visible',
    countyMap: 'visible',
    desktop: 'hidden',
    dock: 'visible',
  },
  desktop: {
    recentWork: 'hidden',
    quickActions: 'hidden',
    countyMap: 'hidden',
    desktop: 'visible',
    dock: 'visible',
  },
  application: {
    recentWork: 'hidden',
    quickActions: 'hidden',
    countyMap: 'hidden',
    desktop: 'receded',
    dock: 'visible',
  },
};

// ============================================================================
// Required Truths (governance assertions)
// ============================================================================

/**
 * Shell mode contract truths that governance tests enforce:
 *
 * 1. System starts in `home`.
 * 2. User can always enter `desktop`.
 * 3. App launch may enter `application`.
 * 4. Home can always be recalled without destroying session state.
 * 5. Dock remains accessible in ALL modes.
 * 6. Desktop is never permanently trapped behind Home.
 */
export const SHELL_MODE_TRUTHS = [
  'system-starts-in-home',
  'user-can-enter-desktop',
  'app-launch-enters-application',
  'home-recall-preserves-session',
  'dock-always-accessible',
  'desktop-not-trapped-behind-home',
] as const;

export type ShellModeTruth = (typeof SHELL_MODE_TRUTHS)[number];

/**
 * The initial shell mode when the OS boots.
 */
export const INITIAL_SHELL_MODE: TerraFusionShellMode = 'home';

// ============================================================================
// Transition Rules
// ============================================================================

/**
 * Valid mode transitions. Every mode can reach every other mode,
 * but the canonical paths are:
 *
 *   home → desktop      (user clicks desktop / dismisses home)
 *   home → application  (user launches an app from home)
 *   desktop → home      (user presses home / recalls home)
 *   desktop → application (user maximizes / focuses an app)
 *   application → desktop (user exits focused app / restores)
 *   application → home   (user presses home from app)
 */
export const VALID_TRANSITIONS: Record<TerraFusionShellMode, TerraFusionShellMode[]> = {
  home: ['desktop', 'application'],
  desktop: ['home', 'application'],
  application: ['home', 'desktop'],
};

/**
 * Check whether a shell mode transition is valid.
 */
export function isValidTransition(
  from: TerraFusionShellMode,
  to: TerraFusionShellMode
): boolean {
  if (from === to) return true; // no-op is always valid
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Get the surface policy for a given shell mode.
 */
export function getSurfacePolicy(mode: TerraFusionShellMode): ShellSurfaces {
  return SHELL_SURFACE_POLICY[mode];
}

/**
 * Check whether a specific surface is visible in a given mode.
 */
export function isSurfaceVisible(
  mode: TerraFusionShellMode,
  surface: keyof ShellSurfaces
): boolean {
  return SHELL_SURFACE_POLICY[mode][surface] === 'visible';
}
