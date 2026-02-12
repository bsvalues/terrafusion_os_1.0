import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronDown  } from '@mui/icons-material';

/**
 * NavMenu variants using class-variance-authority
 */
const navMenuVariants = cva('flex', {
  variants: {
    variant: {
      horizontal: 'flex-row items-center',
      vertical: 'flex-col items-start',
    },
    size: {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-4',
    },
    spacing: {
      compact: 'gap-1',
      normal: 'gap-2',
      relaxed: 'gap-4',
    },
  },
  defaultVariants: {
    variant: 'horizontal',
    size: 'md',
    spacing: 'normal',
  },
});

/**
 * NavMenuItem variants using class-variance-authority
 */
const navMenuItemVariants = cva(
  'relative flex items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
  {
    variants: {
      variant: {
        default: 'hover:bg-muted/50 focus:bg-muted',
        bordered: 'border border-border hover:border-primary/50 hover:bg-muted/50 focus:bg-muted',
        minimal: 'hover:text-primary focus:text-primary',
        ghost: 'hover:bg-muted focus:bg-muted',
        underlined: 'border-b-2 border-transparent hover:border-primary/50 rounded-none',
      },
      size: {
        sm: 'text-sm px-2 py-1',
        md: 'px-3 py-2',
        lg: 'text-lg px-4 py-2.5',
      },
      active: {
        true: 'bg-primary/10 text-primary font-medium',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'underlined',
        active: true,
        className: 'border-primary',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      active: false,
    },
  }
);

export interface NavMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navMenuItemVariants> {
  /**
   * Icon to display before the label
   */
  icon?: React.ReactNode;
  /**
   * To render as a link with href
   */
  href?: string;
  /**
   * Key for the item, used for tracking active state
   */
  itemKey?: string;
  /**
   * Is the item a dropdown trigger
   */
  isDropdown?: boolean;
}

/**
 * NavMenuItem component
 *
 * A navigation item within NavMenu.
 */
export const NavMenuItem = React.forwardRef<HTMLButtonElement, NavMenuItemProps>(
  (
    { className, variant, size, active, icon, href, itemKey, isDropdown, children, ...props },
    ref
  ) => {
    const classes = cn(navMenuItemVariants({ variant, size, active }), className);

    // Render as link if href is provided
    if (href) {
      return (
        <a href={href} className={classes} ref={ref as any} {...(props as any)}>
          {icon && <span className="mr-2">{icon}</span>}
          <span>{children}</span>
          {isDropdown && <ChevronDown className="ml-1 h-4 w-4" />}
        </a>
      );
    }

    // Otherwise render as button
    return (
      <button type="button" className={classes} ref={ref} {...props}>
        {icon && <span className="mr-2">{icon}</span>}
        <span>{children}</span>
        {isDropdown && <ChevronDown className="ml-1 h-4 w-4" />}
      </button>
    );
  }
);

NavMenuItem.displayName = 'NavMenuItem';

export interface NavMenuItemGroup {
  /**
   * Label for the group
   */
  label: string;
  /**
   * Icon for the group
   */
  icon?: React.ReactNode;
  /**
   * Unique key for the group
   */
  key: string;
  /**
   * Items in the group
   */
  items: NavMenuItemData[];
}

export interface NavMenuItemData {
  /**
   * Label for the item
   */
  label: string;
  /**
   * Icon for the item
   */
  icon?: React.ReactNode;
  /**
   * URL for the item
   */
  href?: string;
  /**
   * Unique key for the item
   */
  key: string;
  /**
   * Is the item a dropdown trigger
   */
  isDropdown?: boolean;
  /**
   * Should the item be highlighted
   */
  highlight?: boolean;
  /**
   * Sub-items for a dropdown
   */
  children?: NavMenuItemData[];
}

export interface NavMenuProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navMenuVariants> {
  /**
   * Array of menu items
   */
  items?: NavMenuItemData[];
  /**
   * Item variant style
   */
  itemVariant?: VariantProps<typeof navMenuItemVariants>['variant'];
  /**
   * Item size
   */
  itemSize?: VariantProps<typeof navMenuItemVariants>['size'];
  /**
   * Active item key
   */
  activeKey?: string;
  /**
   * Callback when an item is clicked
   */
  onItemClick?: (item: NavMenuItemData) => void;
  /**
   * Groups for categorizing menu items
   */
  groups?: NavMenuItemGroup[];
  /**
   * Should show dividers between groups
   */
  showGroupDividers?: boolean;
}

/**
 * NavMenu component
 *
 * A navigation menu component that displays horizontal or vertical navigation.
 *
 * @example
 * ```tsx
 * <NavMenu
 *   variant="horizontal"
 *   items={[
 *     { key: 'home', label: 'Home', href: '/' },
 *     { key: 'about', label: 'About', href: '/about' },
 *     { key: 'contact', label: 'Contact', href: '/contact' }
 *   ]}
 *   activeKey="home"
 * />
 * ```
 */
export const NavMenu = React.forwardRef<HTMLDivElement, NavMenuProps>(
  (
    {
      className,
      variant,
      size,
      spacing,
      items = [],
      itemVariant = 'default',
      itemSize = 'md',
      activeKey,
      onItemClick,
      groups = [],
      showGroupDividers = true,
      children,
      ...props
    },
    ref
  ) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleItemClick = (item: NavMenuItemData) => {
      if (item.isDropdown) {
        setOpenDropdown(openDropdown === item.key ? null : item.key);
      } else {
        setOpenDropdown(null);
      }

      if (onItemClick) {
        onItemClick(item);
      }
    };

    const renderItems = (menuItems: NavMenuItemData[]) =>
      menuItems.map(item => (
        <div key={item.key} className="relative">
          <NavMenuItem
            variant={itemVariant}
            size={itemSize}
            active={item.key === activeKey}
            icon={item.icon}
            href={item.href}
            itemKey={item.key}
            isDropdown={item.isDropdown || (item.children && item.children.length > 0)}
            onClick={() => handleItemClick(item)}
            className={item.highlight ? 'text-primary font-medium' : ''}
          >
            {item.label}
          </NavMenuItem>

          {/* Dropdown menu */}
          {item.children && item.children.length > 0 && openDropdown === item.key && (
            <div
              className={cn(
                'absolute z-10 mt-1 py-1 bg-card border border-border rounded-md shadow-md min-w-[160px]',
                variant === 'vertical' ? 'left-full top-0' : 'left-0 top-full'
              )}
            >
              {item.children.map(child => (
                <NavMenuItem
                  key={child.key}
                  variant="ghost"
                  size={itemSize}
                  active={child.key === activeKey}
                  icon={child.icon}
                  href={child.href}
                  itemKey={child.key}
                  onClick={() => {
                    setOpenDropdown(null);
                    if (onItemClick) onItemClick(child);
                  }}
                  className="w-full flex justify-start"
                >
                  {child.label}
                </NavMenuItem>
              ))}
            </div>
          )}
        </div>
      ));

    return (
      <nav
        ref={ref}
        className={cn(navMenuVariants({ variant, size, spacing }), className)}
        {...props}
      >
        {/* Render items without groups */}
        {items.length > 0 && !groups.length && renderItems(items)}

        {/* Render grouped items */}
        {groups.length > 0 && (
          <>
            {groups.map((group /* , index */) => (
              <React.Fragment key={group.key}>
                {/* Group divider */}
                {index > 0 && showGroupDividers && variant === 'vertical' && (
                  <hr className="w-full my-2 border-t border-border" />
                )}

                {/* Group label */}
                {variant === 'vertical' && (
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.icon && <span className="mr-2">{group.icon}</span>}
                    {group.label}
                  </div>
                )}

                {/* Group items */}
                <div
                  className={cn(
                    variant === 'vertical'
                      ? 'flex flex-col w-full gap-1'
                      : 'flex items-center gap-2'
                  )}
                >
                  {renderItems(group.items)}
                </div>
              </React.Fragment>
            ))}
          </>
        )}

        {/* Render children */}
        {children}
      </nav>
    );
  }
);

NavMenu.displayName = 'NavMenu';

export default NavMenu;
