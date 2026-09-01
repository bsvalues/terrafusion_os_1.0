export type RevealableWindowState = 'normal' | 'minimized' | 'maximized' | 'snapped';

export interface RevealableWindow {
  id: string;
  desktopId: string;
  state: RevealableWindowState;
  zIndex: number;
}

export interface WindowRevealSnapshot<TWindow extends RevealableWindow> {
  windows: TWindow[];
  nextZIndex: number;
  currentDesktopId: string;
}

export interface WindowRevealTransition<TWindow extends RevealableWindow>
  extends WindowRevealSnapshot<TWindow> {
  activeWindowId: string;
  wasMinimized: boolean;
  switchedDesktop: boolean;
}

/**
 * Computes the non-toggling visibility transition used by explicit module
 * activation. Keeping this transition dependency-free lets the root contract
 * suite exercise the production window behavior without loading the shell's
 * Zustand runtime.
 */
export function computeWindowReveal<TWindow extends RevealableWindow>(
  snapshot: WindowRevealSnapshot<TWindow>,
  windowId: string,
): WindowRevealTransition<TWindow> | null {
  const targetWindow = snapshot.windows.find((window) => window.id === windowId);
  if (!targetWindow) return null;

  const wasMinimized = targetWindow.state === 'minimized';
  const switchedDesktop = targetWindow.desktopId !== snapshot.currentDesktopId;
  const maxZIndex = Math.max(...snapshot.windows.map((window) => window.zIndex));
  const needsNewZIndex = targetWindow.zIndex < maxZIndex;

  return {
    windows: snapshot.windows.map((window) =>
      window.id === windowId
        ? {
            ...window,
            state: wasMinimized ? ('normal' as const) : window.state,
            zIndex: needsNewZIndex ? snapshot.nextZIndex : window.zIndex,
          }
        : window,
    ),
    activeWindowId: windowId,
    currentDesktopId: targetWindow.desktopId,
    nextZIndex: needsNewZIndex ? snapshot.nextZIndex + 1 : snapshot.nextZIndex,
    wasMinimized,
    switchedDesktop,
  };
}
