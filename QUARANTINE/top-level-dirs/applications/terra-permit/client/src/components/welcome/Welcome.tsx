import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PlayTourButton from '@/components/tour/TourButton';
import { TourType } from '@/types/tour';
import { motion } from 'framer-motion';
import { X  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';

const WELCOME_SHOWN_KEY = 'welcome_dismissed';

/**
 * Welcome component that shows for first-time users
 * Displays a card with a welcome message and a button to start the onboarding tour
 */
const Welcome = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the welcome message has been dismissed before
    const wasShown = localStorage.getItem(WELCOME_SHOWN_KEY) === 'true';
    if (!wasShown) {
      // If not, show it after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    // Remember that the welcome message has been dismissed
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', duration: 0.8 }}
      className="fixed bottom-8 right-8 z-50 max-w-md"
    >
      <Card className="welcome-card border-2 border-blue-300 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-primary">Welcome to Permit Processor!</CardTitle>
            <Button variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Get started with a quick tour of the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-gray-700">
            This interactive walkthrough will help you discover the key features of our permit processing platform.
          </p>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between items-center w-full">
            <Button variant="outline" onClick={handleDismiss}>
              Maybe Later
            </Button>
            <PlayTourButton tourName={TourType.ONBOARDING} 
              variant="default"
              label="Take the Tour"
            />
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default Welcome;