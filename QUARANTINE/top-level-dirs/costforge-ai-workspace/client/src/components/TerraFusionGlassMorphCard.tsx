import { ReactNode } from 'react';
import '../styles/terrafusion-quantum.css';

export interface GlassMorphCardProps {
  children: ReactNode;
  variant?: 'default' | 'consciousness' | 'panel' | 'transcendent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  scanLine?: boolean;
  quantumGrid?: boolean;
}

export function GlassMorphCard({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  title,
  subtitle,
  icon,
  actions,
  scanLine = true,
  quantumGrid = false
}: GlassMorphCardProps) {
  const baseClasses = 'tf-glass-card tf-quantum-lift';

  const variantClasses = {
    default: 'bg-white/10',
    consciousness: 'tf-consciousness-display',
    panel: 'bg-white/5 border-cyan-500/40',
    transcendent: 'bg-gradient-to-br from-white/10 to-cyan-500/10'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const cardClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim();

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* Quantum grid background */}
      {quantumGrid && (
        <div className="tf-quantum-grid absolute inset-0 opacity-20" />
      )}

      {/* Quantum scan line animation */}
      {scanLine && (
        <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-scan" />
      )}

      {/* Card header */}
      {(title || icon || actions) && (
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="tf-transcendent-heading text-lg font-bold text-cyan-400 uppercase tracking-wide">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-cyan-300/70 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 rounded-2xl" />
    </div>
  );
}

// Preset card variants for common TerraFusion use cases
export const TerraFusionCards = {
  ConsciousnessDisplay: (props: Omit<GlassMorphCardProps, 'variant' | 'quantumGrid'>) => (
    <GlassMorphCard {...props} variant="consciousness" quantumGrid={true} />
  ),

  DataPanel: (props: Omit<GlassMorphCardProps, 'variant'>) => (
    <GlassMorphCard {...props} variant="panel" />
  ),

  TranscendentCard: (props: Omit<GlassMorphCardProps, 'variant'>) => (
    <GlassMorphCard {...props} variant="transcendent" />
  ),

  QuantumDashboard: (props: Omit<GlassMorphCardProps, 'variant' | 'quantumGrid' | 'scanLine'>) => (
    <GlassMorphCard {...props} variant="consciousness" quantumGrid={true} scanLine={true} />
  )
};

export default GlassMorphCard;