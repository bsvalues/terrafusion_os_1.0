/**
 * TerraFusion Tabs & Accordion System - Production-Ready Components
 * 
 * @module tabs-accordion
 * @description Complete tabs and accordion system for TerraFusion property assessment platform
 * 
 * Components:
 * - Tabs: Multi-section navigation with keyboard support (property details, tax history)
 * - TabList: Container for tab buttons with orientation support
 * - Tab: Individual tab button with active states and badges
 * - TabPanel: Content area for active tab
 * - Accordion: Collapsible sections for settings and filters
 * - AccordionItem: Individual accordion section
 * - AccordionTrigger: Clickable header with expand/collapse
 * - AccordionContent: Collapsible content area
 * 
 * Features:
 * - ✅ Keyboard Navigation (Arrow keys, Home, End, Enter, Space)
 * - ✅ Controlled/Uncontrolled modes (defaultValue vs value)
 * - ✅ Horizontal/Vertical orientations
 * - ✅ Multiple variants (default, pills, underline, cards)
 * - ✅ Icon and badge support in tabs
 * - ✅ Smooth animations (expand, collapse, transitions)
 * - ✅ Single/Multiple accordion expansion modes
 * - ✅ Disabled states for tabs and accordion items
 * - ✅ Full accessibility (ARIA attributes, focus management)
 * - ✅ Dark mode built-in
 * - ✅ Zero dependencies (pure React + CSS)
 * 
 * Integration:
 * - Day 6: Forms in accordion sections (settings, filters)
 * - Day 15: Loading states in tab panels (skeleton while loading)
 * - Day 16: Notifications for tab/accordion actions
 * - Day 17: Tabs inside modals, accordions in drawers
 * 
 * @example
 * ```tsx
 * // Property details tabs in modal
 * <Tabs defaultValue="details" variant="underline">
 *   <TabList>
 *     <Tab value="details" icon="🏠">Property Details</Tab>
 *     <Tab value="tax" badge={5}>Tax History</Tab>
 *     <Tab value="comparables">Comparables</Tab>
 *   </TabList>
 *   <TabPanel value="details"><PropertyDetails /></TabPanel>
 *   <TabPanel value="tax"><TaxHistory /></TabPanel>
 *   <TabPanel value="comparables"><Comparables /></TabPanel>
 * </Tabs>
 * 
 * // Settings accordion in drawer
 * <Accordion type="multiple" defaultValue={["display", "notifications"]}>
 *   <AccordionItem value="display">
 *     <AccordionTrigger>Display Settings</AccordionTrigger>
 *     <AccordionContent><DisplayForm /></AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="notifications">
 *     <AccordionTrigger>Notifications</AccordionTrigger>
 *     <AccordionContent><NotificationForm /></AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 * 
 * @author TerraFusion Development Team
 * @version 1.0.0
 * @since Day 18
 */

import * as React from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsVariant = 'default' | 'pills' | 'underline' | 'cards';
export type AccordionType = 'single' | 'multiple';

// Tabs interfaces
export interface TabsContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  orientation: TabsOrientation;
  variant: TabsVariant;
  disabled?: boolean;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current active tab (controlled) */
  value?: string;
  /** Default active tab (uncontrolled) */
  defaultValue?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  /** Tab orientation */
  orientation?: TabsOrientation;
  /** Tab variant style */
  variant?: TabsVariant;
  /** Disable all tabs */
  disabled?: boolean;
  /** Tab content */
  children: React.ReactNode;
}

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tab value (unique identifier) */
  value: string;
  /** Icon before label */
  icon?: React.ReactNode;
  /** Badge content */
  badge?: string | number;
  /** Tab content */
  children: React.ReactNode;
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Panel value (matches tab value) */
  value: string;
  /** Panel content */
  children: React.ReactNode;
}

// Accordion interfaces
export interface AccordionContextValue {
  type: AccordionType;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accordion type (single or multiple) */
  type?: AccordionType;
  /** Current expanded value(s) (controlled) */
  value?: string | string[];
  /** Default expanded value(s) (uncontrolled) */
  defaultValue?: string | string[];
  /** Callback when expansion changes */
  onValueChange?: (value: string | string[]) => void;
  /** Disable all accordion items */
  disabled?: boolean;
  /** Accordion content */
  children: React.ReactNode;
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Item value (unique identifier) */
  value: string;
  /** Disable this item */
  disabled?: boolean;
  /** Item content */
  children: React.ReactNode;
}

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Trigger content */
  children: React.ReactNode;
}

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content */
  children: React.ReactNode;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for components
 */
const generateId = (): string => {
  return `tabs-accordion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get CSS animations for components
 */
const getAnimationStyles = (): string => `
@keyframes accordionSlideDown {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
    opacity: 1;
  }
}

@keyframes accordionSlideUp {
  from {
    height: var(--radix-accordion-content-height);
    opacity: 1;
  }
  to {
    height: 0;
    opacity: 0;
  }
}

@keyframes tabSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes chevronRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}

.accordion-content-enter {
  animation: accordionSlideDown 0.3s ease-out;
}

.accordion-content-exit {
  animation: accordionSlideUp 0.3s ease-out;
}

.tab-panel-enter {
  animation: tabSlideIn 0.2s ease-out;
}

.accordion-trigger-icon {
  transition: transform 0.2s ease;
}

.accordion-trigger-icon-open {
  transform: rotate(180deg);
}
`;

// Inject animations into document
if (typeof document !== 'undefined') {
  const styleId = 'terrafusion-tabs-accordion-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = getAnimationStyles();
    document.head.appendChild(style);
  }
}

// ============================================================================
// CONTEXTS
// ============================================================================

const TabsContext = React.createContext<TabsContextValue | null>(null);
const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<{ value: string; disabled?: boolean } | null>(null);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

const useAccordionContext = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion component');
  }
  return context;
};

const useAccordionItemContext = () => {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionTrigger and AccordionContent must be used within an AccordionItem');
  }
  return context;
};

// ============================================================================
// TABS COMPONENTS
// ============================================================================

/**
 * Tabs root component - manages tab state and provides context
 */
export const Tabs: React.FC<TabsProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  variant = 'default',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState<string>(defaultValue || '');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = React.useCallback((newValue: string) => {
    if (disabled) return;
    setInternalValue(newValue);
    onValueChange?.(newValue);
  }, [disabled, onValueChange]);

  const contextValue: TabsContextValue = {
    value,
    onValueChange: handleValueChange,
    orientation,
    variant,
    disabled,
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'column' : 'row',
    gap: '1rem',
    width: '100%',
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={`terrafusion-tabs terrafusion-tabs-${orientation} terrafusion-tabs-${variant} ${className}`}
        style={containerStyle}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * TabList - container for tab buttons
 */
export const TabList: React.FC<TabListProps> = ({
  children,
  className = '',
  ...props
}) => {
  const { orientation, variant } = useTabsContext();
  const tabListRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!tabListRef.current) return;

    const tabs = Array.from(tabListRef.current.querySelectorAll('[role="tab"]:not([disabled])')) as HTMLButtonElement[];
    const currentIndex = tabs.findIndex(tab => tab === document.activeElement);

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault();
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault();
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
    }

    if (nextIndex !== currentIndex && tabs[nextIndex]) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  }, [orientation]);

  const getTabListStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex',
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
      gap: variant === 'pills' ? '0.5rem' : '0',
      borderRadius: variant === 'default' ? '0.5rem' : '0',
      padding: variant === 'default' ? '0.25rem' : '0',
      backgroundColor: variant === 'default' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
      borderBottom: variant === 'underline' && orientation === 'horizontal' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
      borderRight: variant === 'underline' && orientation === 'vertical' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
    };

    if (variant === 'cards') {
      base.gap = '0.5rem';
      base.backgroundColor = 'transparent';
      base.padding = '0';
    }

    return base;
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-orientation={orientation}
      className={`terrafusion-tab-list ${className}`}
      style={getTabListStyles()}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Tab - individual tab button
 */
export const Tab: React.FC<TabProps> = ({
  value,
  icon,
  badge,
  children,
  disabled = false,
  className = '',
  ...props
}) => {
  const { value: activeValue, onValueChange, variant, disabled: contextDisabled } = useTabsContext();
  const isActive = value === activeValue;
  const isDisabled = disabled || contextDisabled;

  const handleClick = () => {
    if (!isDisabled) {
      onValueChange?.(value);
    }
  };

  const getTabStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '0.75rem 1.25rem',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#ffffff',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      fontWeight: isActive ? 600 : 400,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      outline: 'none',
      fontSize: '0.875rem',
    };

    if (variant === 'default') {
      base.backgroundColor = isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
      base.borderRadius = '0.375rem';
      base.boxShadow = isActive ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none';
    } else if (variant === 'pills') {
      base.backgroundColor = isActive ? '#0ea5e9' : 'rgba(255, 255, 255, 0.05)';
      base.borderRadius = '9999px';
      base.color = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
    } else if (variant === 'underline') {
      base.borderBottom = isActive ? '2px solid #0ea5e9' : '2px solid transparent';
      base.marginBottom = '-1px';
      base.color = isActive ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)';
      base.borderRadius = '0';
    } else if (variant === 'cards') {
      base.backgroundColor = isActive ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.05)';
      base.border = isActive ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)';
      base.borderRadius = '0.5rem';
      base.padding = '1rem';
    }

    return base;
  };

  return (
    <button
      role="tab"
      id={`tab-${value}`}
      aria-controls={`panel-${value}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={isDisabled}
      className={`terrafusion-tab ${isActive ? 'terrafusion-tab-active' : ''} ${className}`}
      style={getTabStyles()}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="terrafusion-tab-icon">{icon}</span>}
      <span className="terrafusion-tab-label">{children}</span>
      {badge !== undefined && (
        <span
          className="terrafusion-tab-badge"
          style={{
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.25rem 0.5rem',
            borderRadius: '9999px',
            minWidth: '1.25rem',
            textAlign: 'center',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

/**
 * TabPanel - content area for active tab
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  value,
  children,
  className = '',
  ...props
}) => {
  const { value: activeValue } = useTabsContext();
  const isActive = value === activeValue;

  if (!isActive) return null;

  const panelStyle: React.CSSProperties = {
    outline: 'none',
    animation: 'tabSlideIn 0.2s ease-out',
  };

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={`terrafusion-tab-panel ${className}`}
      style={panelStyle}
      {...props}
    >
      {children}
    </div>
  );
};

// ============================================================================
// ACCORDION COMPONENTS
// ============================================================================

/**
 * Accordion root component - manages accordion state and provides context
 */
export const Accordion: React.FC<AccordionProps> = ({
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    defaultValue || (type === 'multiple' ? [] : '')
  );

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = React.useCallback((itemValue: string) => {
    if (disabled) return;

    let newValue: string | string[];

    if (type === 'single') {
      newValue = value === itemValue ? '' : itemValue;
    } else {
      const currentArray = Array.isArray(value) ? value : [];
      newValue = currentArray.includes(itemValue)
        ? currentArray.filter(v => v !== itemValue)
        : [...currentArray, itemValue];
    }

    setInternalValue(newValue);
    onValueChange?.(newValue);
  }, [type, value, disabled, onValueChange]);

  const contextValue: AccordionContextValue = {
    type,
    value,
    onValueChange: handleValueChange,
    disabled,
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <div
        className={`terrafusion-accordion ${className}`}
        style={containerStyle}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

/**
 * AccordionItem - individual accordion section
 */
export const AccordionItem: React.FC<AccordionItemProps> = ({
  value,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const { disabled: contextDisabled } = useAccordionContext();
  const isDisabled = disabled || contextDisabled;

  const itemStyle: React.CSSProperties = {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  };

  return (
    <AccordionItemContext.Provider value={{ value, disabled: isDisabled }}>
      <div
        className={`terrafusion-accordion-item ${className}`}
        style={itemStyle}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

/**
 * AccordionTrigger - clickable header with expand/collapse
 */
export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
  className = '',
  ...props
}) => {
  const { type, value, onValueChange } = useAccordionContext();
  const { value: itemValue, disabled } = useAccordionItemContext();

  const isExpanded = type === 'single' 
    ? value === itemValue 
    : Array.isArray(value) && value.includes(itemValue);

  const handleClick = () => {
    if (!disabled) {
      onValueChange?.(itemValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    padding: '1rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    fontWeight: 500,
    textAlign: 'left',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const chevronStyle: React.CSSProperties = {
    fontSize: '1rem',
    transition: 'transform 0.2s ease',
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    color: 'rgba(255, 255, 255, 0.6)',
  };

  return (
    <button
      className={`terrafusion-accordion-trigger ${className}`}
      style={triggerStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
      aria-controls={`accordion-content-${itemValue}`}
      disabled={disabled}
      {...props}
    >
      <span>{children}</span>
      <span style={chevronStyle}>▼</span>
    </button>
  );
};

/**
 * AccordionContent - collapsible content area
 */
export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
  className = '',
  ...props
}) => {
  const { type, value } = useAccordionContext();
  const { value: itemValue } = useAccordionItemContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  const isExpanded = type === 'single' 
    ? value === itemValue 
    : Array.isArray(value) && value.includes(itemValue);

  React.useEffect(() => {
    if (contentRef.current) {
      const content = contentRef.current;
      if (isExpanded) {
        content.style.height = `${content.scrollHeight}px`;
        content.style.opacity = '1';
      } else {
        content.style.height = '0px';
        content.style.opacity = '0';
      }
    }
  }, [isExpanded]);

  const contentStyle: React.CSSProperties = {
    height: isExpanded ? 'auto' : '0px',
    opacity: isExpanded ? 1 : 0,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  };

  const innerStyle: React.CSSProperties = {
    padding: isExpanded ? '1rem 1.5rem' : '0 1.5rem',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.875rem',
    lineHeight: 1.6,
  };

  return (
    <div
      ref={contentRef}
      id={`accordion-content-${itemValue}`}
      role="region"
      aria-labelledby={`accordion-trigger-${itemValue}`}
      className={`terrafusion-accordion-content ${className}`}
      style={contentStyle}
      {...props}
    >
      <div style={innerStyle}>
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// COMPOUND COMPONENT EXPORTS
// ============================================================================

// Create compound components for easier imports
const TabsCompound = Object.assign(Tabs, {
  List: TabList,
  Tab: Tab,
  Panel: TabPanel,
});

const AccordionCompound = Object.assign(Accordion, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Individual components
  TabList,
  Tab,
  TabPanel,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  
  // Compound components
  TabsCompound as TabsComponent,
  AccordionCompound as AccordionComponent,
};

export default {
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};