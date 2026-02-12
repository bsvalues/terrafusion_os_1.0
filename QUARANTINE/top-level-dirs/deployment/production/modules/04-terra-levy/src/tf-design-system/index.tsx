/**
 * TerraFusion Design System Components
 * Championship Edition - First 5 Components
 *
 * These components will be extracted to @terrafusion/ui package.
 */

import React from 'react';

// ============================================================================
// 1. TFFrame: The Root Container (Handles Embed Logic)
// ============================================================================
interface TFFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const TFFrame: React.FC<TFFrameProps> = ({ children, className = '' }) => {
  const isEmbed = new URLSearchParams(window.location.search).get('tf_embed') === '1';

  return (
    <div
      className={`min-h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden flex flex-col ${className}`}
      style={{ padding: isEmbed ? '0' : undefined }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// 2. TFHeader: The HUD Identity Bar
// ============================================================================
interface TFHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent?: 'emerald' | 'indigo' | 'cyan' | 'amber' | 'blue';
}

const accentClasses = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    dot: 'bg-indigo-500',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    dot: 'bg-cyan-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
  },
};

export const TFHeader: React.FC<TFHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  accent = 'emerald',
}) => {
  const colors = accentClasses[accent];
  const isEmbed = new URLSearchParams(window.location.search).get('tf_embed') === '1';

  if (isEmbed) return null; // Hide header in embed mode

  return (
    <header className="flex items-center gap-4 px-6 py-5 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
      <div
        className={`p-2.5 rounded-xl border ${colors.bg} ${colors.border} shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]`}
      >
        <Icon size={24} className={colors.text} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight leading-tight">{title}</h1>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`}></span>
          <span className={`text-xs font-mono ${colors.text} opacity-80 uppercase tracking-wide`}>
            {subtitle}
          </span>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// 3. TFCard: The Data Container
// ============================================================================
interface TFCardProps {
  children: React.ReactNode;
  className?: string;
}

export const TFCard: React.FC<TFCardProps> = ({ children, className = '' }) => (
  <div
    className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm transition-all hover:bg-white/[0.07] ${className}`}
  >
    {children}
  </div>
);

// ============================================================================
// 4. TFKpi: The Metric Display
// ============================================================================
interface TFKpiProps {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: 'emerald' | 'indigo' | 'cyan' | 'amber' | 'blue';
}

export const TFKpi: React.FC<TFKpiProps> = ({ label, value, icon: Icon, accent = 'emerald' }) => {
  const colors = accentClasses[accent];

  return (
    <TFCard className="p-5 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider group-hover:text-slate-400 transition-colors">
          {label}
        </span>
        <Icon
          size={16}
          className={`${colors.text} opacity-80 group-hover:opacity-100 transition-opacity`}
        />
      </div>
      <div className="text-2xl font-mono font-bold text-white tracking-tight">{value}</div>
    </TFCard>
  );
};

// ============================================================================
// 5. TFButton: The Action Trigger
// ============================================================================
interface TFButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: 'emerald' | 'indigo' | 'cyan' | 'amber' | 'blue';
  icon?: React.ElementType;
  disabled?: boolean;
}

export const TFButton: React.FC<TFButtonProps> = ({
  children,
  onClick,
  accent = 'emerald',
  icon: Icon,
  disabled = false,
}) => {
  const colors = accentClasses[accent];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${colors.bg} ${colors.text} border ${colors.border}
        hover:bg-opacity-20 hover:border-opacity-40
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
      {Icon && <Icon size={16} />}
    </button>
  );
};

// Export all components
export default {
  TFFrame,
  TFHeader,
  TFCard,
  TFKpi,
  TFButton,
};
