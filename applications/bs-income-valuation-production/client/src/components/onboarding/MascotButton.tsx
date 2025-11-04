import React from 'react';
import { motion } from 'framer-motion';
import { Mascot } from './Mascot';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface MascotButtonProps {
  className?: string;
}

export const MascotButton: React.FC<MascotButtonProps> = ({ 
  className = '' 
}) => {
  const { showMascot, startOnboarding } = useOnboarding();

  if (!showMascot) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={`fixed bottom-6 right-6 z-40 cursor-pointer ${className}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20 
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => startOnboarding('welcome')}
          >
            <Button 
              size="lg" 
              className="rounded-full w-14 h-14 p-0 shadow-lg relative hover:shadow-xl transition-shadow"
            ><>

              <span className="sr-only">Get help</span>
              <Mascot
</>

size="md" className="w-10 h-10" />
            </Button>
            <motion.div 
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              ?
            </motion.div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Need help? Click to start the tour!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};