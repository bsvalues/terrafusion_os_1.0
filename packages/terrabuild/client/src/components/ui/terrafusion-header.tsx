import { cn } from '@/lib/utils';
import React from 'react';
import { Link } from 'wouter';

interface TerraFusionHeaderProps {
  title: string;
  subtitle?: string;
  showHeroBackground?: boolean;
  className?: string;
  showLogo?: boolean;
  logoSize?: 'small' | 'medium' | 'large';
  hideNavigation?: boolean;
  navigationLinks?: {
    label: string;
    href: string;
    active?: boolean;
  }[];
  actions?: React.ReactNode;
}

export default function TerraFusionHeader({
  title,
  subtitle,
  showHeroBackground = false,
  className,
  showLogo = true,
  logoSize = 'medium',
  hideNavigation = false,
  navigationLinks = [],
  actions
}: TerraFusionHeaderProps) {
  // Logo size mappings
  const logoSizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  // Default navigation links for TerraFusion Government OS
  const defaultNavLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Calculator', href: '/calculator' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Data Import', href: '/data-import' },
    { label: 'Reports', href: '/reports' }
  ];

  const links = navigationLinks.length > 0 ? navigationLinks : defaultNavLinks;

  // TerraFusion Government OS branding colors and gradients
  const heroGradient = 'from-slate-900 via-blue-900 to-indigo-900';
  const logoGradient = 'from-blue-600 to-indigo-600';

  return (
    <header className={cn(
      'relative w-full overflow-hidden',
      showHeroBackground ? `bg-gradient-to-r ${heroGradient} text-white h-[200px] md:h-[300px]` : 'bg-white border-b py-4',
      className
    )}>
      {/* Hero background pattern for TerraFusion OS */}
      {showHeroBackground && (
        <div className="absolute inset-0 w-full h-full opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[size:20px_20px]"></div>
        </div>
      )}

      {/* Overlay gradient for hero background */}
      {showHeroBackground && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 to-transparent z-10" />
      )}

      <div className={cn(
        'container mx-auto px-4 relative flex flex-col md:flex-row items-center justify-between',
        showHeroBackground ? 'z-20 h-full' : 'py-4'
      )}>
        <div className="flex items-center gap-3">
          {showLogo && (
            <Link href="/">
              <div className={cn(
                `bg-gradient-to-br ${logoGradient} rounded-lg flex items-center justify-center text-white font-bold`,
                logoSizeClasses[logoSize]
              )}>
                <span className="text-xs font-black">TF</span>
              </div>
            </Link>
          )}

          <div>
            <h1 className={cn(
              'font-bold tracking-tight text-3xl md:text-4xl',
              showHeroBackground
                ? 'text-white'
                : 'bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent'
            )}>
              {title}
            </h1>

            {subtitle && (
              <p className={cn(
                'mt-1 text-lg md:text-xl',
                showHeroBackground
                  ? 'text-white/90 max-w-md'
                  : 'text-muted-foreground'
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {!showHeroBackground && !hideNavigation && (
          <nav className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600 hover:underline',
                  link.active === true
                    ? 'text-blue-600'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {!showHeroBackground && actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}

        {showHeroBackground && !hideNavigation && (
          <nav className="mt-auto mb-4 hidden md:flex items-center gap-6 bg-white/10 backdrop-blur-sm py-2 px-4 rounded-md">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-white hover:underline',
                  link.active === true
                    ? 'text-white'
                    : 'text-white/80'
                )}
              >
                {link.label}
              </Link>
            ))}
            {showHeroBackground && actions && (
              <div className="ml-4">{actions}</div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
