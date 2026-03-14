/**
 * TerraFusion OS — Shell Z-Index Hierarchy
 *
 * Single source of truth for z-index layering in the desktop shell.
 * Import these constants instead of using magic numbers.
 *
 * Layer order (back → front):
 *   desktop → topbar → contextMenu → window(Active) → dock → startMenu →
 *   dockContextMenu → snapPreview → peek → sentinel(Panel) →
 *   altTab(Backdrop) → commandPalette(Backdrop) → overlay → debug → skipNav
 */
export const Z = Object.freeze({
  /** Desktop background & icon grid */
  desktop: 0,

  /** Top bar / system bar */
  topbar: 10,

  /** Context menus (between dock and start menu) */
  contextMenu: 20,

  /** Window chrome (inactive) */
  window: 30,

  /** Window chrome (active / focused) */
  windowActive: 35,

  /** Dock / Taskbar */
  dock: 1000,

  /** Start menu / Launchpad */
  startMenu: 1010,

  /** Right-click context menus over dock */
  dockContextMenu: 1020,

  /** Window snap preview overlay */
  snapPreview: 1040,

  /** Window peek (hover preview) */
  peek: 1100,

  /** Sentinel panel backdrop */
  sentinel: 1150,

  /** Sentinel panel */
  sentinelPanel: 1151,

  /** Alt+Tab backdrop */
  altTabBackdrop: 1200,

  /** Alt+Tab switcher panel */
  altTab: 1201,

  /** Command palette backdrop */
  commandBackdrop: 1299,

  /** Command palette */
  commandPalette: 1300,

  /** Modal overlays */
  overlay: 1400,

  /** Debug panels (gated by env flag) */
  debug: 9000,

  /** Skip-to-content nav link (WCAG a11y, focus-only) */
  skipNav: 99999,
});
