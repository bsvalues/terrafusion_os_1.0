import React from 'react';
import { useTour, TourType } from '@/contexts/TourContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HelpCircle  } from '@mui/icons-material';
import { Separator } from '@/components/ui/separator';

/**
 * Help center component that provides access to all available tours
 */
export function HelpCenter() {
  const { startTour, isTourActive } = useTour();

  const availableTours = [
    {
      type: TourType.ONBOARDING,
      label: 'Application Overview',
      description: 'Learn about the main areas of the application',
    },
    {
      type: TourType.DASHBOARD,
      label: 'Dashboard Tour',
      description: 'Explore the dashboard features and metrics',
    },
    {
      type: TourType.PERMIT_PROCESSING,
      label: 'Permit Management',
      description: 'Learn how to upload and manage permits',
    },
    {
      type: TourType.AI_FEATURES,
      label: 'AI Tools',
      description: 'Discover our powerful AI-powered tools',
    },
    {
      type: TourType.COLLABORATION,
      label: 'Collaboration Features',
      description: 'See how to collaborate with your team',
    },
    {
      type: TourType.HELP_CENTER,
      label: 'Help Center',
      description: 'Explore the help center features',
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Help Center">
          <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0">
        <div className="p-4">
          <div className="font-medium text-center">Help Center</div>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-2">
            Interactive tours to help you learn the app
          </p>
        </div>
        <Separator />
        <div className="p-2">
          {availableTours.map((tour) => (
            <Button
              key={tour.type}
              variant="ghost"
              className="flex flex-col items-start w-full p-3 h-auto"
              disabled={isTourActive}
              onClick={() => startTour(tour.type)}
            >
              <span className="font-medium text-sm">{tour.label}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {tour.description}
              </span>
            </Button>
          ))}
        </div>
        <Separator />
        <div className="p-3 text-xs text-center text-muted-foreground">
          Tours can be restarted at any time through this help center
        </div>
      </PopoverContent>
    </Popover>
  );
}