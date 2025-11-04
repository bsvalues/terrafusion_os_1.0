/**
 * Focus Level Selector Component
 *
 * Interactive component for selecting developer focus levels
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Target, Layers, ZoomOut, Dices  } from '@mui/icons-material';

interface FocusLevelSelectorProps {
  currentLevel: string;
  onLevelChange: (level: string) => void;
  isUpdating: boolean;
}

const FocusLevelSelector: React.FC<FocusLevelSelectorProps> = ({
  currentLevel,
  onLevelChange,
  isUpdating,
}) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Button
        variant={currentLevel === 'DEEP' ? 'default' : 'outline'}
        className={`flex items-center justify-center ${currentLevel === 'DEEP' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
        onClick={() => onLevelChange('DEEP')}
        disabled={isUpdating}
        size="sm"
      >
        {isUpdating && currentLevel === 'DEEP' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (<>

          <Target className="h-4 w-4 mr-1" />
        )}
        Deep
      </Button>

      <Button
</>
        variant={currentLevel === 'MODERATE' ? 'default' : 'outline'}
        className={`flex items-center justify-center ${currentLevel === 'MODERATE' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
        onClick={() => onLevelChange('MODERATE')}
        disabled={isUpdating}
        size="sm"
      >
        {isUpdating && currentLevel === 'MODERATE' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (<>

          <Layers className="h-4 w-4 mr-1" />
        )}
        Moderate
      </Button>

      <Button
</>
        variant={currentLevel === 'SHALLOW' ? 'default' : 'outline'}
        className={`flex items-center justify-center ${currentLevel === 'SHALLOW' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
        onClick={() => onLevelChange('SHALLOW')}
        disabled={isUpdating}
        size="sm"
      >
        {isUpdating && currentLevel === 'SHALLOW' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (<>

          <ZoomOut className="h-4 w-4 mr-1" />
        )}
        Shallow
      </Button>

      <Button
</>
        variant={currentLevel === 'DISTRACTED' ? 'default' : 'outline'}
        className={`flex items-center justify-center ${currentLevel === 'DISTRACTED' ? 'bg-red-500 hover:bg-red-600' : ''}`}
        onClick={() => onLevelChange('DISTRACTED')}
        disabled={isUpdating}
        size="sm"
      >
        {isUpdating && currentLevel === 'DISTRACTED' ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Dices className="h-4 w-4 mr-1" />
        )}
        Distracted
      </Button>
    </div>
  );
};

export default FocusLevelSelector;
