import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    
    const contextValue = React.useMemo(() => {
      const currentValue = value !== undefined ? value : internalValue;
      return {
        value: currentValue,
        onValueChange: (newValue: string) => {
          setInternalValue(newValue);
          onValueChange?.(newValue);
        },
      };
    }, [internalValue, onValueChange, value]);
    
    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={cn("", className)} {...props} />
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
          className
        )}
        {...props}
      />
    );
  }
);

TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsTrigger must be used within Tabs");
    }
    
    const isActive = context.value === value;
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-background text-foreground shadow"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
        onClick={() => context.onValueChange(value)}
        {...props}
      />
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error("TabsContent must be used within Tabs");
    }
    
    const isActive = context.value === value;
    
    if (!isActive) return null;
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);

TabsContent.displayName = "TabsContent";

// Create Context
type TabsContextType = {
  value?: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextType | null>(null);

export { Tabs, TabsList, TabsTrigger, TabsContent };