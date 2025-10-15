import { useEffect, useState } from 'react';
import { Toast } from './toast';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  const [mounted, setMounted] = useState(false);

  // Don't render during SSR to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-0 z-[100] flex flex-col items-end pt-4 pr-4 gap-2 w-full max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="w-full"
          >
            <Toast
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              action={toast.action}
              onClose={() => dismiss(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}