import React, { useState, createContext, useContext } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Create context for tabs
type TabsContextType = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextType>({
  activeTab: '',
  setActiveTab: () => {},
});

/**
 * Tabs container variants
 */
const tabsVariants = cva('', {
  variants: {
    variant: {
      default: '',
      pills: '',
      underline: '',
      enclosed: '',
      vertical: 'flex',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    {
      variant: 'vertical',
      className: 'flex-row',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * TabsList variants
 */
const tabsListVariants = cva('flex', {
  variants: {
    variant: {
      default: 'bg-muted p-1 rounded-md',
      pills: 'space-x-1',
      underline: 'space-x-4 border-b border-border',
      enclosed: 'space-x-1',
      vertical: 'flex-col',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  compoundVariants: [
    {
      variant: ['default', 'pills', 'enclosed', 'underline'],
      className: 'flex-row',
    },
    {
      variant: 'vertical',
      className: 'flex-col mr-6 border-r border-border pr-2 space-y-1',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * TabsTrigger variants
 */
const tabsTriggerVariants = cva(
  'flex items-center justify-center whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'data-[state=active]:bg-background data-[state=active]:text-foreground',
        pills: 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
        underline:
          'border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground',
        enclosed:
          'border border-transparent data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background',
        vertical: 'data-[state=active]:bg-muted data-[state=active]:text-foreground justify-start',
      },
      size: {
        sm: 'px-2.5 py-1 text-sm',
        md: 'px-3 py-1.5',
        lg: 'px-4 py-2 text-lg',
      },
    },
    compoundVariants: [
      {
        variant: 'default',
        className: 'rounded-sm',
      },
      {
        variant: 'pills',
        className: 'rounded-md',
      },
      {
        variant: 'underline',
        className: 'rounded-none px-1 pb-3',
      },
      {
        variant: 'enclosed',
        className: 'rounded-t-md -mb-px',
      },
      {
        variant: 'vertical',
        className: 'rounded-md py-2 px-3',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/**
 * TabsContent variants
 */
const tabsContentVariants = cva(
  'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  {
    variants: {
      variant: {
        default: '',
        pills: '',
        underline: 'pt-4',
        enclosed: 'border-t border-border pt-4',
        vertical: '',
      },
      animate: {
        none: '',
        fade: 'transition-opacity animate-in fade-in-75',
        slide: 'transition-all animate-in slide-in-from-right-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      animate: 'fade',
    },
  }
);

export interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsVariants> {
  /**
   * Default active tab value
   */
  defaultValue?: string;
  /**
   * Controlled active tab value
   */
  value?: string;
  /**
   * Callback when tab changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Whether tabs should take up full width
   */
  fullWidth?: boolean;
  /**
   * Whether to animate tab content
   */
  animate?: VariantProps<typeof tabsContentVariants>['animate'];
}

/**
 * Tabs component
 *
 * A component for organizing content into multiple tabs.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * ```
 */
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      variant,
      size,
      defaultValue,
      value,
      onValueChange,
      fullWidth,
      animate = 'fade',
      children,
      ...props
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState(value || defaultValue || '');

    const handleTabChange = (newValue: string) => {
      if (!value) {
        setActiveTab(newValue);
      }

      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    return (
      <TabsContext.Provider
        value={{
          activeTab: value || activeTab,
          setActiveTab: handleTabChange,
        }}
      >
        <div
          ref={ref}
          className={cn(tabsVariants({ variant, size }), fullWidth && 'w-full', className)}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {
  /**
   * Whether tabs should take up full width
   */
  fullWidth?: boolean;
}

/**
 * TabsList component
 */
export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(tabsListVariants({ variant, size }), fullWidth && 'w-full', className)}
        role="tablist"
        {...props}
      />
    );
  }
);

TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsTriggerVariants> {
  /**
   * Value of the tab
   */
  value: string;
  /**
   * Whether tab should take up full width
   */
  fullWidth?: boolean;
  /**
   * Icon to display with the trigger
   */
  icon?: React.ReactNode;
  /**
   * Position for the icon
   */
  iconPosition?: 'left' | 'right';
}

/**
 * TabsTrigger component
 */
export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  (
    { className, variant, size, value, fullWidth, icon, iconPosition = 'left', children, ...props },
    ref
  ) => {
    const { activeTab, setActiveTab } = useContext(TabsContext);
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(tabsTriggerVariants({ variant, size }), fullWidth && 'w-full', className)}
        onClick={() => setActiveTab(value)}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsContentVariants> {
  /**
   * Value of the tab this content belongs to
   */
  value: string;
  /**
   * Whether to force render even when not active
   */
  forceMount?: boolean;
}

/**
 * TabsContent component
 */
export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, variant, animate, value, forceMount, children, ...props }, ref) => {
    const { activeTab } = useContext(TabsContext);
    const isActive = activeTab === value;

    if (!isActive && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-hidden={!isActive}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(tabsContentVariants({ variant, animate }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

// Components already exported above
