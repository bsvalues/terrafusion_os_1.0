/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION WIDGET MANAGER CONTEXT
 * Centralized widget state management for hide, auto-hide, and arrangement
 * ═══════════════════════════════════════════════════════════════
 */

import React, { createContext, useCallback, useContext, useReducer } from 'react';

// ═══ TYPES & INTERFACES ═══
export interface WidgetState {
  id: string;
  title: string;
  isVisible: boolean;
  isCollapsed: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  order: number;
  autoHide: boolean;
  lastInteraction: Date;
}

export interface WidgetManagerState {
  widgets: Record<string, WidgetState>;
  arrangementMode: boolean;
  globalAutoHide: boolean;
  autoHideDelay: number;
}

// ═══ ACTION TYPES ═══
type WidgetManagerAction =
  | { type: 'REGISTER_WIDGET'; payload: { id: string; title: string; autoHide?: boolean } }
  | { type: 'UNREGISTER_WIDGET'; payload: { id: string } }
  | { type: 'TOGGLE_WIDGET_VISIBILITY'; payload: { id: string } }
  | { type: 'HIDE_WIDGET'; payload: { id: string } }
  | { type: 'SHOW_WIDGET'; payload: { id: string } }
  | { type: 'COLLAPSE_WIDGET'; payload: { id: string; collapsed: boolean } }
  | { type: 'UPDATE_WIDGET_POSITION'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'UPDATE_WIDGET_SIZE'; payload: { id: string; size: { width: number; height: number } } }
  | { type: 'SET_ARRANGEMENT_MODE'; payload: boolean }
  | { type: 'SET_GLOBAL_AUTO_HIDE'; payload: boolean }
  | { type: 'SET_AUTO_HIDE_DELAY'; payload: number }
  | { type: 'UPDATE_INTERACTION'; payload: { id: string } }
  | { type: 'REORDER_WIDGETS'; payload: { dragId: string; hoverId: string } }
  | { type: 'RESET_POSITIONS' }
  | { type: 'HIDE_ALL_WIDGETS' }
  | { type: 'SHOW_ALL_WIDGETS' }
  | { type: 'SAVE_LAYOUT' }
  | { type: 'LOAD_LAYOUT'; payload: WidgetManagerState };

// ═══ INITIAL STATE ═══
const initialState: WidgetManagerState = {
  widgets: {},
  arrangementMode: false,
  globalAutoHide: false,
  autoHideDelay: 5000,
};

// ═══ REDUCER ═══
function widgetManagerReducer(
  state: WidgetManagerState,
  action: WidgetManagerAction
): WidgetManagerState {
  switch (action.type) {
    case 'REGISTER_WIDGET':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            id: action.payload.id,
            title: action.payload.title,
            isVisible: true,
            isCollapsed: false,
            order: Object.keys(state.widgets).length,
            autoHide: action.payload.autoHide || state.globalAutoHide,
            lastInteraction: new Date(),
          },
        },
      };

    case 'UNREGISTER_WIDGET': {
      const { [action.payload.id]: _, ...remainingWidgets } = state.widgets;
      return {
        ...state,
        widgets: remainingWidgets,
      };
    }

    case 'TOGGLE_WIDGET_VISIBILITY':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            isVisible: !state.widgets[action.payload.id]?.isVisible,
            lastInteraction: new Date(),
          },
        },
      };

    case 'HIDE_WIDGET':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            isVisible: false,
            lastInteraction: new Date(),
          },
        },
      };

    case 'SHOW_WIDGET':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            isVisible: true,
            lastInteraction: new Date(),
          },
        },
      };

    case 'COLLAPSE_WIDGET':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            isCollapsed: action.payload.collapsed,
            lastInteraction: new Date(),
          },
        },
      };

    case 'UPDATE_WIDGET_POSITION':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            position: action.payload.position,
            lastInteraction: new Date(),
          },
        },
      };

    case 'UPDATE_WIDGET_SIZE':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            size: action.payload.size,
            lastInteraction: new Date(),
          },
        },
      };

    case 'SET_ARRANGEMENT_MODE':
      return {
        ...state,
        arrangementMode: action.payload,
      };

    case 'SET_GLOBAL_AUTO_HIDE':
      return {
        ...state,
        globalAutoHide: action.payload,
        widgets: Object.keys(state.widgets).reduce(
          (acc, id) => {
            acc[id] = {
              ...state.widgets[id],
              autoHide: action.payload,
            };
            return acc;
          },
          {} as Record<string, WidgetState>
        ),
      };

    case 'SET_AUTO_HIDE_DELAY':
      return {
        ...state,
        autoHideDelay: action.payload,
      };

    case 'UPDATE_INTERACTION':
      return {
        ...state,
        widgets: {
          ...state.widgets,
          [action.payload.id]: {
            ...state.widgets[action.payload.id],
            lastInteraction: new Date(),
          },
        },
      };

    case 'REORDER_WIDGETS': {
      const { dragId, hoverId } = action.payload;
      const dragWidget = state.widgets[dragId];
      const hoverWidget = state.widgets[hoverId];

      if (!dragWidget || !hoverWidget) return state;

      return {
        ...state,
        widgets: {
          ...state.widgets,
          [dragId]: { ...dragWidget, order: hoverWidget.order },
          [hoverId]: { ...hoverWidget, order: dragWidget.order },
        },
      };
    }

    case 'RESET_POSITIONS':
      return {
        ...state,
        widgets: Object.keys(state.widgets).reduce(
          (acc, id) => {
            acc[id] = {
              ...state.widgets[id],
              position: undefined,
              size: undefined,
            };
            return acc;
          },
          {} as Record<string, WidgetState>
        ),
      };

    case 'HIDE_ALL_WIDGETS':
      return {
        ...state,
        widgets: Object.keys(state.widgets).reduce(
          (acc, id) => {
            acc[id] = {
              ...state.widgets[id],
              isVisible: false,
            };
            return acc;
          },
          {} as Record<string, WidgetState>
        ),
      };

    case 'SHOW_ALL_WIDGETS':
      return {
        ...state,
        widgets: Object.keys(state.widgets).reduce(
          (acc, id) => {
            acc[id] = {
              ...state.widgets[id],
              isVisible: true,
            };
            return acc;
          },
          {} as Record<string, WidgetState>
        ),
      };

    case 'SAVE_LAYOUT':
      // Save to localStorage
      localStorage.setItem('terrafusion-widget-layout', JSON.stringify(state));
      return state;

    case 'LOAD_LAYOUT':
      return action.payload;

    default:
      return state;
  }
}

// ═══ CONTEXT ═══
interface WidgetManagerContextType {
  state: WidgetManagerState;
  dispatch: React.Dispatch<WidgetManagerAction>;
  registerWidget: (id: string, title: string, autoHide?: boolean) => void;
  unregisterWidget: (id: string) => void;
  toggleWidgetVisibility: (id: string) => void;
  hideWidget: (id: string) => void;
  showWidget: (id: string) => void;
  collapseWidget: (id: string, collapsed: boolean) => void;
  updateWidgetPosition: (id: string, position: { x: number; y: number }) => void;
  updateWidgetSize: (id: string, size: { width: number; height: number }) => void;
  setArrangementMode: (enabled: boolean) => void;
  setGlobalAutoHide: (enabled: boolean) => void;
  setAutoHideDelay: (delay: number) => void;
  updateInteraction: (id: string) => void;
  reorderWidgets: (dragId: string, hoverId: string) => void;
  resetPositions: () => void;
  hideAllWidgets: () => void;
  showAllWidgets: () => void;
  saveLayout: () => void;
  loadLayout: () => void;
  getVisibleWidgets: () => WidgetState[];
  getHiddenWidgets: () => WidgetState[];
}

const WidgetManagerContext = createContext<WidgetManagerContextType | undefined>(undefined);

// ═══ PROVIDER ═══
export function WidgetManagerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(widgetManagerReducer, initialState);

  // Load saved layout on mount
  React.useEffect(() => {
    const savedLayout = localStorage.getItem('terrafusion-widget-layout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout) as WidgetManagerState;
        dispatch({ type: 'LOAD_LAYOUT', payload: parsedLayout });
      } catch (error) {
      }
    }
  }, []);

  const registerWidget = useCallback((id: string, title: string, autoHide?: boolean) => {
    dispatch({ type: 'REGISTER_WIDGET', payload: { id, title, autoHide } });
  }, []);

  const unregisterWidget = useCallback((id: string) => {
    dispatch({ type: 'UNREGISTER_WIDGET', payload: { id } });
  }, []);

  const toggleWidgetVisibility = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_WIDGET_VISIBILITY', payload: { id } });
  }, []);

  const hideWidget = useCallback((id: string) => {
    dispatch({ type: 'HIDE_WIDGET', payload: { id } });
  }, []);

  const showWidget = useCallback((id: string) => {
    dispatch({ type: 'SHOW_WIDGET', payload: { id } });
  }, []);

  const collapseWidget = useCallback((id: string, collapsed: boolean) => {
    dispatch({ type: 'COLLAPSE_WIDGET', payload: { id, collapsed } });
  }, []);

  const updateWidgetPosition = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'UPDATE_WIDGET_POSITION', payload: { id, position } });
  }, []);

  const updateWidgetSize = useCallback((id: string, size: { width: number; height: number }) => {
    dispatch({ type: 'UPDATE_WIDGET_SIZE', payload: { id, size } });
  }, []);

  const setArrangementMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_ARRANGEMENT_MODE', payload: enabled });
  }, []);

  const setGlobalAutoHide = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_GLOBAL_AUTO_HIDE', payload: enabled });
  }, []);

  const setAutoHideDelay = useCallback((delay: number) => {
    dispatch({ type: 'SET_AUTO_HIDE_DELAY', payload: delay });
  }, []);

  const updateInteraction = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_INTERACTION', payload: { id } });
  }, []);

  const reorderWidgets = useCallback((dragId: string, hoverId: string) => {
    dispatch({ type: 'REORDER_WIDGETS', payload: { dragId, hoverId } });
  }, []);

  const resetPositions = useCallback(() => {
    dispatch({ type: 'RESET_POSITIONS' });
  }, []);

  const hideAllWidgets = useCallback(() => {
    dispatch({ type: 'HIDE_ALL_WIDGETS' });
  }, []);

  const showAllWidgets = useCallback(() => {
    dispatch({ type: 'SHOW_ALL_WIDGETS' });
  }, []);

  const saveLayout = useCallback(() => {
    dispatch({ type: 'SAVE_LAYOUT' });
  }, []);

  const loadLayout = useCallback(() => {
    const savedLayout = localStorage.getItem('terrafusion-widget-layout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout) as WidgetManagerState;
        dispatch({ type: 'LOAD_LAYOUT', payload: parsedLayout });
      } catch (error) {
      }
    }
  }, []);

  const getVisibleWidgets = useCallback(() => {
    return Object.values(state.widgets)
      .filter((widget) => widget.isVisible)
      .sort((a, b) => a.order - b.order);
  }, [state.widgets]);

  const getHiddenWidgets = useCallback(() => {
    return Object.values(state.widgets)
      .filter((widget) => !widget.isVisible)
      .sort((a, b) => a.order - b.order);
  }, [state.widgets]);

  const value: WidgetManagerContextType = {
    state,
    dispatch,
    registerWidget,
    unregisterWidget,
    toggleWidgetVisibility,
    hideWidget,
    showWidget,
    collapseWidget,
    updateWidgetPosition,
    updateWidgetSize,
    setArrangementMode,
    setGlobalAutoHide,
    setAutoHideDelay,
    updateInteraction,
    reorderWidgets,
    resetPositions,
    hideAllWidgets,
    showAllWidgets,
    saveLayout,
    loadLayout,
    getVisibleWidgets,
    getHiddenWidgets,
  };

  return <WidgetManagerContext.Provider value={value}>{children}</WidgetManagerContext.Provider>;
}

// ═══ CUSTOM HOOK ═══
export function useWidgetManager() {
  const context = useContext(WidgetManagerContext);
  if (context === undefined) {
    throw new Error('useWidgetManager must be used within a WidgetManagerProvider');
  }
  return context;
}

// ═══ WIDGET HOOK ═══
export function useWidget(id: string, title: string, autoHide?: boolean) {
  const {
    state,
    registerWidget,
    unregisterWidget,
    updateInteraction,
    hideWidget,
    showWidget,
    collapseWidget,
    updateWidgetPosition,
  } = useWidgetManager();

  const widget = state.widgets[id];

  React.useEffect(() => {
    registerWidget(id, title, autoHide);
    return () => unregisterWidget(id);
  }, [id, title, autoHide, registerWidget, unregisterWidget]);

  const markInteraction = useCallback(() => {
    updateInteraction(id);
  }, [id, updateInteraction]);

  const hide = useCallback(() => {
    hideWidget(id);
  }, [id, hideWidget]);

  const show = useCallback(() => {
    showWidget(id);
  }, [id, showWidget]);

  const collapse = useCallback(
    (collapsed: boolean) => {
      collapseWidget(id, collapsed);
    },
    [id, collapseWidget]
  );

  const updatePosition = useCallback(
    (position: { x: number; y: number }) => {
      updateWidgetPosition(id, position);
    },
    [id, updateWidgetPosition]
  );

  return {
    widget,
    isVisible: widget?.isVisible ?? true,
    isCollapsed: widget?.isCollapsed ?? false,
    position: widget?.position,
    markInteraction,
    hide,
    show,
    collapse,
    updatePosition,
  };
}
