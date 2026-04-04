import * as React from "react";

export type ToastProps = {
  id: string;
  className?: string;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number;
};

export type ToastActionElement = React.ReactElement<any>;
