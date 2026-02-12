import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
  duration?: number; // ms
}

interface ToastContextValue {
  show: (message: string, options?: { kind?: ToastKind; duration?: number }) => void;
  info: (message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const defaultDuration = 4500;

// Global toast bridge for non-React callers (e.g., React Query caches)
export type ToastBridge = {
  show: (message: string, options?: { kind?: ToastKind; duration?: number }) => void;
  info: (message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
};

export const toastBridge: ToastBridge = {
  show: () => {},
  info: () => {},
  success: () => {},
  warning: () => {},
  error: () => {},
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timeouts.current[id];
    if (t) {
      clearTimeout(t);
      delete timeouts.current[id];
    }
  }, []);

  const show = useCallback((message: string, options?: { kind?: ToastKind; duration?: number }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastItem = {
      id,
      message,
      kind: options?.kind ?? 'info',
      duration: options?.duration ?? defaultDuration,
    };
    setToasts((prev) => [toast, ...prev].slice(0, 5)); // cap at 5
    timeouts.current[id] = setTimeout(() => remove(id), toast.duration);
  }, [remove]);

  const api: ToastContextValue = useMemo(
    () => ({
      show,
      info: (message, duration) => show(message, { kind: 'info', duration }),
      success: (message, duration) => show(message, { kind: 'success', duration }),
      warning: (message, duration) => show(message, { kind: 'warning', duration }),
      error: (message, duration) => show(message, { kind: 'error', duration }),
    }),
    [show]
  );

  // Update global bridge when provider mounts/updates
  useEffect(() => {
    toastBridge.show = api.show;
    toastBridge.info = api.info;
    toastBridge.success = api.success;
    toastBridge.warning = api.warning;
    toastBridge.error = api.error;
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Container */}
  <div className="fixed top-4 right-4 z-[9999] space-y-2 w-[92vw] max-w-sm" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              `terra-glass border rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm transition-all ` +
              `border-[#00ffee]/30 text-white ` +
              (t.kind === 'success' ? 'bg-emerald-500/20' : '') +
              (t.kind === 'error' ? 'bg-rose-500/20' : '') +
              (t.kind === 'warning' ? 'bg-amber-500/20' : '') +
              (t.kind === 'info' ? 'bg-[#1E293B]/70' : '')
            }
          >
            <div className="flex items-start gap-3">
              <span className={
                `mt-0.5 inline-block h-2 w-2 rounded-full ` +
                (t.kind === 'success' ? 'bg-[#00ffaa]' : '') +
                (t.kind === 'error' ? 'bg-[#ff0055]' : '') +
                (t.kind === 'warning' ? 'bg-amber-400' : '') +
                (t.kind === 'info' ? 'bg-[#00ffee]' : '')
              } />
              <div className="flex-1 text-sm">{t.message}</div>
              <button
                aria-label="Dismiss notification"
                className="text-[#00ffee]/80 hover:text-white transition-colors"
                onClick={() => remove(t.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
