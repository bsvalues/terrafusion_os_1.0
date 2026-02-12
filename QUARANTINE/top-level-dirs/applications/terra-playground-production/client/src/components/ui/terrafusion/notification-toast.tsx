import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info  } from '@mui/icons-material';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationToastProps {
  message: string;
  type?: NotificationType;
  duration?: number; // in milliseconds
  onClose?: () => void;
  title?: string;
}

export function NotificationToast({
  message,
  type = 'success',
  duration = 5000,
  onClose,
  title,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss
  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 0.5;
        });
      }, duration / 200); // 200 steps for the progress

      return () => clearInterval(interval);
    }
  }, [duration]);

  // Auto-close when progress is done
  useEffect(() => {
    if (progress <= 0) {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }
  }, [progress, onClose]);

  // Get appropriate icon and colors based on type
  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} />,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          progressColor: 'bg-emerald-500',
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} />,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          progressColor: 'bg-red-500',
        };
      case 'info':
      default:
        return {
          icon: <Info size={20} />,
          color: 'text-tf-primary',
          bgColor: 'bg-tf-primary/10',
          borderColor: 'border-tf-primary/20',
          progressColor: 'bg-tf-primary',
        };
    }
  };

  const { icon, color, bgColor, borderColor, progressColor } = getIconAndColors();

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`relative flex p-4 rounded-lg shadow-lg border ${borderColor} ${bgColor} backdrop-blur-md`}
        style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
      ><>

        <div className={`flex-shrink-0 mr-3 ${color}`}>{icon}</div>

        <div
</> className="flex-grow">
          {title && <h4 className="font-medium text-white mb-1">{title}</h4>}
          <p className="text-sm text-white/80">{message}</p>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-4 flex-shrink-0 text-white/60 hover:text-white"
        >
          <X size={16} />
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div
            className={`h-full ${progressColor} transition-all duration-300 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
