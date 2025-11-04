import { ReactNode } from 'react';
import '../styles/terrafusion-quantum.css';

export interface TerraFusionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'quantum' | 'transcendent' | 'championship' | 'consciousness';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function TerraFusionButton({
  children,
  onClick,
  variant = 'quantum',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  className = '',
}: TerraFusionButtonProps) {
  const baseClasses = 'tf-clarity-button relative overflow-hidden transition-all duration-300';

  const variantClasses = {
    quantum: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500',
    transcendent: 'bg-gradient-to-r from-cyan-400 to-blue-600',
    championship: 'bg-gradient-to-br from-green-400 via-cyan-400 to-blue-500',
    consciousness: 'bg-gradient-to-br from-purple-500 via-cyan-500 to-indigo-600',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-12 py-5 text-xl',
  };

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl hover:-translate-y-1'}
    ${className}
  `.trim();

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={typeof children === 'string' ? children : 'TerraFusion action button'}
    >
      {/* Quantum scan line animation */}
      <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" />

      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            <span className="uppercase font-semibold text-white">
              QUANTUM ALGORITHMS COMPUTING...
            </span>
          </>
        ) : (
          <>
            {icon && <span className="text-lg">{icon}</span>}
            <span className="uppercase font-semibold text-white">{children}</span>
          </>
        )}
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 rounded-full" />
    </button>
  );
}

// Preset button variants for common TerraFusion actions
export const TerraFusionButtons = {
  QuantumDeploy: (props: Omit<TerraFusionButtonProps, 'children' | 'icon'>) => (
    <TerraFusionButton {...props} icon="🚀" variant="quantum">
      QUANTUM DEPLOY
    </TerraFusionButton>
  ),

  EnhanceAgents: (props: Omit<TerraFusionButtonProps, 'children' | 'icon'>) => (
    <TerraFusionButton {...props} icon="⚡" variant="transcendent">
      ENHANCE AGENTS
    </TerraFusionButton>
  ),

  PrecisionCalc: (props: Omit<TerraFusionButtonProps, 'children' | 'icon'>) => (
    <TerraFusionButton {...props} icon="🎯" variant="championship">
      PRECISION CALC
    </TerraFusionButton>
  ),

  TranscendLimits: (props: Omit<TerraFusionButtonProps, 'children' | 'icon'>) => (
    <TerraFusionButton {...props} icon="💎" variant="quantum" size="lg">
      TRANSCEND LIMITS
    </TerraFusionButton>
  ),

  InfiniteScale: (props: Omit<TerraFusionButtonProps, 'children' | 'icon'>) => (
    <TerraFusionButton {...props} icon="∞" variant="transcendent">
      INFINITE SCALE
    </TerraFusionButton>
  ),
};

export default TerraFusionButton;
