import * as React from "react";
import { cn } from "@/lib/utils";
import { X  } from '@mui/icons-material';

export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  onClose?: () => void;
  duration?: number;
  className?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", title, description, action, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group pointer-events-auto relative flex w-full max-w-md items-start gap-4 overflow-hidden rounded-md border p-4 pr-10 shadow-lg transition-all",
          {
            "bg-background text-foreground": variant === "default",
            "bg-destructive text-destructive-foreground": variant === "destructive",
            "bg-success text-success-foreground": variant === "success",
          },
          className
        )}
        {...props}
      >
        <div className="grid gap-1 flex-1">
          {title && <h4 className="font-medium leading-none">{title}</h4>}
          {description && (
            <p className="text-sm opacity-90">{description}</p>
          )}
          {action && (
            <div className="mt-2">{action}</div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring",
              {
                "text-foreground/70 hover:text-foreground": variant === "default",
                "text-destructive-foreground/70 hover:text-destructive-foreground": variant === "destructive",
                "text-success-foreground/70 hover:text-success-foreground": variant === "success",
              }
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = "Toast";

// Toast Close button component
const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/70 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring",
        className
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
);

ToastClose.displayName = "ToastClose";

// Toast Title component
const ToastTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
  )
);

ToastTitle.displayName = "ToastTitle";

// Toast Description component
const ToastDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
  )
);

ToastDescription.displayName = "ToastDescription";

// Toast Provider component
interface ToastProviderProps {
  children: React.ReactNode;
}

const ToastProvider = ({ children }: ToastProviderProps) => {
  return <>{children}</>;
};

// Toast Viewport component
const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className
      )}
      {...props}
    />
  )
);

ToastViewport.displayName = "ToastViewport";

export { Toast, ToastClose, ToastTitle, ToastDescription, ToastProvider, ToastViewport };