import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface MascotToggleProps {
  className?: string;
}

export const MascotToggle: React.FC<MascotToggleProps> = ({ 
  className = '' 
}) => {
  const { showMascot, toggleMascot } = useOnboarding();
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Switch
        id="mascot-toggle"
        checked={showMascot}
        onCheckedChange={toggleMascot}
      />
      <Label htmlFor="mascot-toggle" className="cursor-pointer">Show Mascot</Label>
    </div>
  );
};