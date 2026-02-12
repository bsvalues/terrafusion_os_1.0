import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Menu  } from '@mui/icons-material';

/**
 * AppBar variants using class-variance-authority
 */
const appBarVariants = cva('relative flex items-center py-3 px-4 h-16 transition-colors', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground border-b border-border/40',
      primary: 'bg-primary text-primary-foreground border-b border-primary-foreground/10',
      transparent: 'bg-transparent text-foreground',
      glass: 'tf-glass text-foreground backdrop-blur-md',
    },
    sticky: {
      true: 'sticky top-0 z-30',
      false: 'relative',
    },
    elevation: {
      none: 'shadow-none',
      low: 'shadow-sm',
      medium: 'shadow-md',
      high: 'shadow-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    sticky: true,
    elevation: 'low',
  },
});

export interface AppBarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof appBarVariants> {
  /**
   * The title to display in the app bar
   */
  title?: string;
  /**
   * Logo component or element
   */
  logo?: React.ReactNode;
  /**
   * Menu items to display
   */
  menu?: React.ReactNode;
  /**
   * Actions to display (buttons, user menu, etc.)
   */
  actions?: React.ReactNode;
  /**
   * Whether to show a menu toggle button
   */
  showMenuToggle?: boolean;
  /**
   * Callback for when the menu button is clicked
   */
  onMenuClick?: () => void;
  /**
   * Screen size where the menu toggles to mobile view
   */
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * AppBar component
 *
 * A navigation component that displays at the top of the application.
 *
 * @example
 * ```tsx
 * <AppBar
 *   title="Application Title"
 *   logo={<Logo />}
 *   actions={<UserMenu />}
 *   variant="primary"
 * />
 * ```
 */
export const AppBar = forwardRef<HTMLDivElement, AppBarProps>(
  (
    {
      className,
      variant,
      sticky,
      elevation,
      title,
      logo,
      menu,
      actions,
      showMenuToggle = false,
      onMenuClick,
      breakpoint = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const breakpointMap = {
      sm: 'sm:flex',
      md: 'md:flex',
      lg: 'lg:flex',
      xl: 'xl:flex',
      '2xl': '2xl:flex',
    };

    const menuBreakpoint = breakpointMap[breakpoint];

    return (
      <div
        ref={ref}
        className={cn(appBarVariants({ variant, sticky, elevation }), className)}
        {...props}
      >
        {/* Left section: Menu toggle, Logo, Title */}
        <div className="flex items-center gap-4">
          {showMenuToggle && (
            <button
              onClick={onMenuClick}
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center',
                'hover:bg-foreground/5 focus:outline-none'
              )}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {logo && <div className="flex items-center">{logo}</div>}

          {title && <h1 className="tf-heading text-lg font-semibold">{title}</h1>}
        </div>

        {/* Middle section: Navigation menu */}
        {menu && <div className={cn('hidden', menuBreakpoint, 'flex-1 mx-4')}>{menu}</div>}

        {/* Right section: Actions */}
        {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}

        {/* Fallback for children if no structured content is provided */}
        {!menu && !actions && children && <div className="flex-1 mx-4">{children}</div>}
      </div>
    );
  }
);

AppBar.displayName = 'AppBar';

export default AppBar;
