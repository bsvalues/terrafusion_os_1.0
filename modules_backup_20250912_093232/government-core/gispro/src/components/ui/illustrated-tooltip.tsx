import React, {ReactNode} from 'react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from './tooltip';
import {HelpCircle, Info, Lightbulb, AlertCircle, CheckCircle2} from 'lucide-react';
import {cn} from '../../lib/utils';

interface IllustratedTooltipProps {title: string;
  content: ReactNode;
  illustration?: string | ReactNode;
  trigger?: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: number;
  height?: number;
  iconSize?: number;
  variant?: 'default' | 'info' | 'warning' | 'success' | 'error';
  showIcon?: boolean;
  interactive?: boolean;
  className?: string;
  delay?: number;}

const VARIANT_CONFIGS = {default: {
    icon: HelpCircle,
    iconClass: 'text-muted-foreground',
    contentClass: 'bg-popover border-border',},
  info: {icon: Info,
    iconClass: 'text-blue-500',
    contentClass: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',},
  warning: {icon: AlertCircle,
    iconClass: 'text-amber-500',
    contentClass: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',},
  success: {icon: CheckCircle2,
    iconClass: 'text-green-500',
    contentClass: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',},
  error: {icon: AlertCircle,
    iconClass: 'text-red-500',
    contentClass: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',},
};

/**
 * Enhanced tooltip component with illustration support and multiple variants.
 * Perfect for providing rich contextual help with visual aids.
 */
export function IllustratedTooltip({title,
  content,
  illustration,
  trigger,
  position = 'top',
  width = 320,
  height = 200,
  iconSize = 16,
  variant = 'default',
  showIcon = true,
  interactive = false,
  className,
  delay = 200,}: IllustratedTooltipProps) {
  const config = VARIANT_CONFIGS[variant];
  const Icon = config.icon;

  // Default illustration SVG
  const defaultIllustration = (
    <svg width={width} height={height * 0.6} viewBox="0 0 320 120" className="w-full"><defs><linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg-gradient)" rx="8" /><circle cx="80" cy="40" r="20" fill="hsl(var(--primary))" fillOpacity="0.3" /><circle cx="240" cy="80" r="15" fill="hsl(var(--primary))" fillOpacity="0.4" /><rect
        x="120"
        y="30"
        width="80"
        height="8"
        fill="hsl(var(--muted-foreground))"
        fillOpacity="0.3"
        rx="4" /><rect
        x="120"
        y="50"
        width="120"
        height="6"
        fill="hsl(var(--muted-foreground))"
        fillOpacity="0.2"
        rx="3" /><rect
        x="120"
        y="70"
        width="60"
        height="6"
        fill="hsl(var(--muted-foreground))"
        fillOpacity="0.2"
        rx="3" /></svg>);

  const renderIllustration = () => {
    if (typeof illustration === 'string') {
      return (<div
          className="w-full flex-shrink-0"
          style={{ height: `${height * 0.6}px` }}
          dangerouslySetInnerHTML={{ __html: illustration}} />);
    }

    if (React.isValidElement(illustration)) {
      return (<div
          className="w-full flex-shrink-0 flex items-center justify-center"
          style={{ height: `${height * 0.6}px` }}
        >{illustration}</div>);
    }

    return defaultIllustration;
  };

  return (<TooltipProvider delayDuration={delay}><Tooltip><TooltipTrigger asChild><span className={cn('inline-flex items-center cursor-help', className)}>{trigger ||
              (showIcon && (<Icon size={iconSize} className={cn('transition-colors', config.iconClass)} />))}</span></TooltipTrigger><TooltipContent
          side={position}
          className={cn('p-0 overflow-hidden shadow-lg border', config.contentClass)}
          style={{ width: `${width}px`, maxWidth: `${width}px` }}
          {...(interactive && {onPointerDownOutside: e => e.preventDefault()})}
        ><div className="flex flex-col">{/* Illustration Section */}<div className="w-full bg-gradient-to-br from-background/50 to-muted/50">{renderIllustration()}</div>{/* Content Section */}<div className="p-4 space-y-2"><div className="flex items-start gap-2">{!trigger && !showIcon && (<Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', config.iconClass)} />)}<div className="min-w-0 flex-1"><h4 className="font-semibold text-sm leading-tight text-foreground mb-1">{title}</h4><div className="text-xs text-muted-foreground leading-relaxed">{content}</div></div></div></div></div></TooltipContent></Tooltip></TooltipProvider>
  );
}

// Preset tooltip variants for common use cases
export const InfoTooltip = (props: Omit<IllustratedTooltipProps, 'variant'>) => (<IllustratedTooltip {...props} variant="info" />
);

export const WarningTooltip = (props: Omit<IllustratedTooltipProps, 'variant'>) => (<IllustratedTooltip {...props} variant="warning" />
);

export const SuccessTooltip = (props: Omit<IllustratedTooltipProps, 'variant'>) => (<IllustratedTooltip {...props} variant="success" />
);

export const ErrorTooltip = (props: Omit<IllustratedTooltipProps, 'variant'>) => (<IllustratedTooltip {...props} variant="error" />
);

// Simple help tooltip with just text
export const HelpTooltip = ({text,
  ...props}: {text: string} & Partial<IllustratedTooltipProps>) => (<IllustratedTooltip title="Help" content={text} {...props} />
);

// Feature spotlight tooltip for highlighting new features
export const FeatureTooltip = ({featureName,
  description,
  isNew = false,
  ...props}: {featureName: string;
  description: string;
  isNew?: boolean;} & Partial<IllustratedTooltipProps>) => (<IllustratedTooltip
    title={isNew ? `🎉 New: ${featureName}` : featureName}
    content={description}
    variant="info"
    trigger={<div className="relative inline-flex"><Lightbulb size={16} className="text-amber-500" />{isNew && (<span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />)}</div>
    }
    {...props}
  />
);

export default IllustratedTooltip;
