import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(
  undefined
);

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onValueChange,
  className,
  children,
}) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-3", className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
};

interface RadioGroupItemProps {
  value: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(
  ({ value, id, className, disabled = false }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context) {
      throw new Error("RadioGroupItem must be used within a RadioGroup");
    }

    const { value: groupValue, onValueChange } = context;
    const checked = value === groupValue;

    return (
      <div
        ref={ref}
        className={cn(
          "h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          checked && "bg-primary",
          className
        )}
        onClick={() => {
          if (!disabled) {
            onValueChange(value);
          }
        }}
        role="radio"
        aria-checked={checked}
        aria-labelledby={id}
        data-state={checked ? "checked" : "unchecked"}
        data-disabled={disabled ? "" : undefined}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {checked && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
        )}
      </div>
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };