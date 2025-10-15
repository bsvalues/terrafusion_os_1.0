import React, { createContext, useState, useCallback } from 'react';
import { Toast, ToastProps } from './toast';
import { createPortal } from 'react-dom';
import { generateId } from '@/lib/utils';

type ToastContextType = {
  toast: (props: ToastProps) => void;
  info: (props: Omit<ToastProps, 'variant'>) => void;
  success: (props: Omit<ToastProps, 'variant'>) => void;
  warning: (props: Omit<ToastProps, 'variant'>) => void;
  error: (props: Omit<ToastProps, 'variant'>) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextType | null>(null);

interface ToastItem extends ToastProps {
  id: string;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((props: ToastProps) => {
    const id = generateId();
    const toastItem: ToastItem = {
      ...props,
      id,
      onClose: () => dismiss(id),
    };
    setToasts((prev) => [...prev, toastItem]);

    // Auto-dismiss after duration
    if (props.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, props.duration || 5000);
    }

    return id;
  }, []);

  const info = useCallback(
    (props: Omit<ToastProps, 'variant'>) => toast({ ...props, variant: 'default' }),
    [toast]
  );

  const success = useCallback(
    (props: Omit<ToastProps, 'variant'>) => toast({ ...props, variant: 'success' }),
    [toast]
  );

  const warning = useCallback(
    (props: Omit<ToastProps, 'variant'>) =>
      toast({ ...props, variant: 'destructive', title: `Warning: ${props.title || ''}` }),
    [toast]
  );

  const error = useCallback(
    (props: Omit<ToastProps, 'variant'>) => 
      toast({ ...props, variant: 'destructive' }),
    [toast]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = {
    toast,
    info,
    success,
    warning,
    error,
    dismiss,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-h-screen overflow-hidden">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="animate-in slide-in-from-bottom-5 duration-300"
              >
                <Toast {...toast} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}