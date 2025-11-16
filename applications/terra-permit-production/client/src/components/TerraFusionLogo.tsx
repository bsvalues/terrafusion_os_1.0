import React from 'react';

export const TerraFusionLogo: React.FC<{ className?: string, variant?: 'default' | 'light' | 'dark' }> = ({ 
  className = 'h-10',
  variant = 'default'
}) => {
  // Color scheme based on variant
  const colors = {
    default: {
      textMain: 'text-white',
      textSecondary: 'text-yellow-300',
      textSmall: 'text-blue-100',
    },
    light: {
      textMain: 'text-blue-700',
      textSecondary: 'text-blue-500',
      textSmall: 'text-gray-600',
    },
    dark: {
      textMain: 'text-white',
      textSecondary: 'text-yellow-200',
      textSmall: 'text-gray-300',
    }
  };

  const { textMain, textSecondary, textSmall } = colors[variant];

  return (
    <div className={`flex items-center ${className}`}>
      <div className="mr-3">
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#2A5B7C" strokeWidth="4"/>
          <rect x="20" y="25" width="60" height="50" rx="10" fill="#2A5B7C"/>
          <path d="M30 40 H70" stroke="#4CAF50" strokeWidth="3"/>
          <path d="M30 50 H70" stroke="#4CAF50" strokeWidth="3"/>
          <path d="M30 60 H70" stroke="#4CAF50" strokeWidth="3"/>
          <path d="M50 35 L50 65" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="2 2"/>
          <circle cx="50" cy="50" r="10" fill="#4CAF50" fillOpacity="0.6"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center"><>

          <span className={`${textMain} font-bold text-xl tracking-wide`}>TERRA</span>
          <span
</> className={`${textSecondary} font-bold ml-1`}>FUSION</span>
        </div>
        <span className={`${textSmall} font-medium text-xs tracking-wider`}>PERMIT SYSTEM</span>
      </div>
    </div>
  );
};

export default TerraFusionLogo;