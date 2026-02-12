import { toast } from "@/hooks/use-toast";

interface EnhancedToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

export const enhancedToast = {
  success: (options: EnhancedToastOptions) => {
    const { title, description, duration = 5000 } = options;

    return toast({
      title: `✅ ${title}`,
      description,
      variant: "default",
      duration,
      className: "bg-green-50 text-green-800 border-green-200",
    });
  },

  error: (options: EnhancedToastOptions) => {
    const { title, description, duration = 8000 } = options;

    return toast({
      title: `❌ ${title}`,
      description,
      variant: "destructive",
      duration,
    });
  },

  warning: (options: EnhancedToastOptions) => {
    const { title, description, duration = 6000 } = options;

    return toast({
      title: `⚠️ ${title}`,
      description,
      variant: "default",
      duration,
      className: "bg-amber-50 text-amber-800 border-amber-200",
    });
  },

  info: (options: EnhancedToastOptions) => {
    const { title, description, duration = 4000 } = options;

    return toast({
      title: `ℹ️ ${title}`,
      description,
      variant: "default",
      duration,
      className: "bg-blue-50 text-blue-800 border-blue-200",
    });
  },

  loading: (options: EnhancedToastOptions) => {
    const { title, description, duration = 100000 } = options;

    return toast({
      title: `⏳ ${title}`,
      description,
      variant: "default",
      duration,
      className: "bg-slate-50 text-slate-800 border-slate-200",
    });
  },
};
