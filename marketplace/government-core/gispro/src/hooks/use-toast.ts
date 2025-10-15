import { useState, useEffect } from 'react';
import { ToastProps } from '@/components/ui/toast';

type Toast = ToastProps & { id: string };

// Global store for toasts
const toastStore = {
  toasts: [] as Toast[],
  listeners: [] as ((toasts: Toast[]) => void)[],
  
  add(props: ToastProps) {
    const id = Math.random().toString(36).slice(2, 9);
    this.toasts = [...this.toasts, { ...props, id }];
    this.notify();
    
    // Auto-dismiss after duration
    if (props.duration !== 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, props.duration || 5000);
    }
    
    return id;
  },
  
  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  },
  
  notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  },
  
  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastStore.toasts);
  
  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);
  
  return {
    toasts,
    dismiss: (id: string) => toastStore.dismiss(id),
    toast: toast
  };
}

// Simple toast function with variant helpers
export const toast = function(props: ToastProps) {
  return toastStore.add(props);
} as {
  (props: ToastProps): string;
  success: (props: Omit<ToastProps, 'variant'>) => string;
  error: (props: Omit<ToastProps, 'variant'>) => string;
  warning: (props: Omit<ToastProps, 'variant'>) => string;
  info: (props: Omit<ToastProps, 'variant'>) => string;
  default: (props: Omit<ToastProps, 'variant'>) => string;
};

// Add helper methods
toast.success = (props) => toastStore.add({ ...props, variant: 'success' });
toast.error = (props) => toastStore.add({ ...props, variant: 'destructive' });
toast.warning = (props) => toastStore.add({ 
  ...props, 
  variant: 'destructive',
  title: props.title ? `Warning: ${props.title}` : 'Warning' 
});
toast.info = (props) => toastStore.add({ ...props, variant: 'default' });
toast.default = (props) => toastStore.add({ ...props, variant: 'default' });

export type { ToastProps };