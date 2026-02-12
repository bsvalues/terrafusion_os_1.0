import { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  moduleName: string;
  onComplete?: () => void;
  logo?: string;
}

export function SplashScreen({ moduleName, onComplete, logo }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);

  // Default Terrafusion logo if none provided
  const defaultLogo = '/Terrafusion-logo.svg';

  // Effect for progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  // Separate effect to handle completion
  useEffect(() => {
    if (progress === 100 && onComplete && !completedRef.current) {
      completedRef.current = true;
      // Add a small delay before calling onComplete
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-tf-dark-blue z-50">
      {/* Background glow effect */}
      <div className="absolute inset-0">
<>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-tf-primary opacity-10 blur-[100px] animate-pulse-glow" />
      </div>

      <div
</> className="flex flex-col md:flex-row items-center justify-center gap-8 z-10 px-6">
        {/* Terrafusion Logo */}
        <div className="w-24 h-24 relative">
          <img
            src={logo || defaultLogo}
            alt="Terrafusion Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Module name */}
        <h1
          className="text-4xl font-bold text-white"
          style={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}
        >
          {moduleName}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-1/3 max-w-md">
        <div className="h-10 bg-black/20 rounded-full overflow-hidden backdrop-blur-md">
          <div
            className="h-full bg-gradient-to-r from-tf-secondary to-tf-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
