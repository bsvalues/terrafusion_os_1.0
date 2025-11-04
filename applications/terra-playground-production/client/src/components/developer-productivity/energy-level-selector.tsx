/**
 * Energy Level Selector Component
 *
 * Interactive component for selecting developer energy levels
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, BatteryFull, BatteryMedium, BatteryLow  } from '@mui/icons-material';

interface EnergyLevelSelectorProps {
  currentLevel: string;
  onLevelChange: (level: string) => void;
  isUpdating: boolean;
}

const EnergyLevelSelector: React.FC<EnergyLevelSelectorProps> = ({
  currentLevel,
  onLevelChange,
  isUpdating,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        variant={currentLevel === 'HIGH' ? 'default' : 'outline'}
        className={`flex items-center justify-center ${currentLevel === 'HIGH' ? 'bg-green-600 hover:bg-green-700' : ''}`}
        onClick={() => onLevelChange('HIGH')}
        disabled={isUpdating}
      >
        {isUpdating && currentLevel === 'HIGH' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (<>

          <BatteryFull className="h-4 w-4 mr-1" />
        )}
        High
      </Button>

      <Button
</>
        variant={currentLevel === 'MEDIUM' ? 'default' : 'outline'}
        className={`flex items-center justify-center ${currentLevel === 'MEDIUM' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
        onClick={() => onLevelChange('MEDIUM')}
        disabled={isUpdating}
      >
        {isUpdating && currentLevel === 'MEDIUM' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (<>

          <BatteryMedium className="h-4 w-4 mr-1" />
        )}
        Medium
      </Button>

      <Button
</>
        variant={currentLevel === 'LOW' ? 'default' : 'outline'}
        className={`flex items-center justify-center ${currentLevel === 'LOW' ? 'bg-red-500 hover:bg-red-600' : ''}`}
        onClick={() => onLevelChange('LOW')}
        disabled={isUpdating}
      >
        {isUpdating && currentLevel === 'LOW' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <BatteryLow className="h-4 w-4 mr-1" />
        )}
        Low
      </Button>
    </div>
  );
};

export default EnergyLevelSelector;
