import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown  } from '@mui/icons-material';

interface SelectContextProps {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextProps | undefined>(undefined);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("useSelect must be used within a SelectProvider");
  }
  return context;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange: controlledOnValueChange,
  children,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [open, setOpen] = React.useState(false);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const onValueChange = React.useCallback(
    (newValue: string) => {
      if (controlledOnValueChange) {
        controlledOnValueChange(newValue);
      } else {
        setInternalValue(newValue);
      }
      setOpen(false);
    },
    [controlledOnValueChange]
  );
  
  const onOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen);
  }, []);
  
  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, onOpenChange }}
    >
      {children}
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className,
  ...props
}) => {
  const { open, onOpenChange } = useSelect();
  
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => onOpenChange(!open)}
      aria-expanded={open}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = useSelect();
  
  return (
    <span className={cn("text-sm", !value && "text-muted-foreground")}>
      {value || placeholder}
    </span>
  );
};

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className,
  ...props
}) => {
  const { open, onOpenChange } = useSelect();
  
  if (!open) return null;
  
  return (
    <div className="relative z-50">
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
      <div
        className={cn(
          "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
          className
        )}
        {...props}
      >
        <div className="p-1">{children}</div>
      </div>
    </div>
  );
};

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className,
  ...props
}) => {
  const { value: selectedValue, onValueChange } = useSelect();
  const isSelected = selectedValue === value;
  
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
      role="option"
      aria-selected={isSelected}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
};

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};