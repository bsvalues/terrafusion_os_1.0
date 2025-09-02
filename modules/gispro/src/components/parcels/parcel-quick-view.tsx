import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, MapPin, ChevronRight  } from '@mui/icons-material';
import { useIsMobile } from "@/hooks/use-mobile";
import { QuickParcelPreview } from './quick-parcel-preview';
import { MapLayer, DEFAULT_MAP_LAYERS } from '@/lib/map-utils';
import { useLocation } from "wouter";

type ParcelQuickViewProps = {
  parcelId: string;
  children: React.ReactNode;
  triggerType?: 'button' | 'custom';
  viewType?: 'popover' | 'dialog' | 'drawer' | 'auto';
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonText?: string;
  mapLayers?: MapLayer[];
  onViewDetails?: (parcelId: string) => void;
};

export function ParcelQuickView({
  parcelId,
  children,
  triggerType = 'custom',
  viewType = 'auto',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonText = 'Quick View',
  mapLayers = DEFAULT_MAP_LAYERS,
  onViewDetails,
}: ParcelQuickViewProps) {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Determine the actual view type based on viewType and device
  const actualViewType = viewType === 'auto'
    ? (isMobile ? 'drawer' : 'popover')
    : viewType;
  
  // Handle view details click
  const handleViewDetails = (parcelId: string) => {
    setIsOpen(false);
    if (onViewDetails) {
      onViewDetails(parcelId);
    } else {
      // Default behavior: navigate to property details page
      navigate(`/property/${parcelId}`);
    }
  };
  
  // Generate the trigger element
  const triggerElement = triggerType === 'button' ? (
    <Button variant={buttonVariant} size={buttonSize}>
      <MapPin className="h-4 w-4 mr-1.5" />
      {buttonText}
      <ChevronRight className="h-4 w-4 ml-1.5" />
    </Button>
  ) : children;
  
  // Render the appropriate view component
  if (actualViewType === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}><>

        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
        <PopoverContent
</> side="right" className="w-[360px] p-0 shadow-lg">
          <QuickParcelPreview
            parcelId={parcelId}
            mapLayers={mapLayers}
            onViewDetails={handleViewDetails}
            onClose={() => setIsOpen(false)}
          />
        </PopoverContent>
      </Popover>
    );
  }
  
  if (actualViewType === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}><>

        <DialogTrigger asChild>
          {triggerElement}
        </DialogTrigger>
        <DialogContent
</> className="p-0 max-w-md">
          <QuickParcelPreview
            parcelId={parcelId}
            mapLayers={mapLayers}
            onViewDetails={handleViewDetails}
            onClose={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }
  
  // Drawer view (mobile)
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}><>

      <DrawerTrigger asChild>
        {triggerElement}
      </DrawerTrigger>
      <DrawerContent
</>>
        <div className="px-4 py-4 max-w-md mx-auto w-full">
          <QuickParcelPreview
            parcelId={parcelId}
            mapLayers={mapLayers}
            onViewDetails={handleViewDetails}
            className="border-0 shadow-none"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}