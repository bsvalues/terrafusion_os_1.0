// CostForge is an OS module loaded via AppFrame (iframe).
// The TerraFusion OS shell owns: window chrome, navigation, auth.
// MainLayout provides only module-level content structure — no header, no sidebar.

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDataFlow } from '@/contexts/DataFlowContext';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  fullWidth?: boolean;
  loading?: boolean;
  error?: {
    title?: string;
    message: string;
    type?: 'error' | 'warning';
  };
  trackPageView?: boolean;
  // Legacy props — accepted but ignored (OS owns these concerns)
  hideFooter?: boolean;
  isLanding?: boolean;
  breadcrumbs?: { label: string; href?: string }[];
  showDataFlow?: boolean;
}

export default function MainLayout({
  children,
  pageTitle,
  pageDescription,
  fullWidth = false,
  loading = false,
  error,
  trackPageView = true,
}: MainLayoutProps) {
  const { trackUserActivity } = useDataFlow();

  useEffect(() => {
    if (trackPageView && pageTitle) {
      trackUserActivity(`Viewed page: ${pageTitle}`);
    }
  }, [pageTitle, trackPageView, trackUserActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] bg-background">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 p-6"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{pageTitle ? `Loading ${pageTitle}...` : 'Loading...'}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className={cn('p-4 md:p-6 mx-auto', fullWidth ? 'w-full' : 'max-w-7xl')}>
        {/* Error/Warning notifications */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-4"
            >
              <Alert variant={error.type === 'warning' ? 'default' : 'destructive'}>
                {error.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {error.title && <AlertTitle>{error.title}</AlertTitle>}
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page header */}
        {(pageTitle || pageDescription) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            {pageTitle && (
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{pageTitle}</h1>
            )}
            {pageDescription && <p className="mt-1 text-muted-foreground">{pageDescription}</p>}
          </motion.div>
        )}

        {/* Module content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
