import React from "react";
import { Helmet } from "react-helmet";
import { SyncStatus, SyncState } from "../ui/sync-status";
import { Button } from "../ui/button";
import { ChevronLeft, Home, Menu, MoreHorizontal  } from '@mui/icons-material';
import { useLocation, Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface PageLayoutProps {
  /**
   * Page title (for browser title bar and SEO)
   */
  title: string;

  /**
   * Page subtitle (optional)
   */
  subtitle?: string;

  /**
   * Page description (optional) - appears below the title
   */
  description?: string;

  /**
   * Main content
   */
  children: React.ReactNode;

  /**
   * Back button URL (optional - if provided, shows a back button)
   */
  backUrl?: string;

  /**
   * Whether to show the home button
   */
  showHomeButton?: boolean;

  /**
   * Actions to display in the top-right
   */
  actions?: React.ReactNode;

  /**
   * Whether the page is loading
   */
  isLoading?: boolean;

  /**
   * Whether the content is being edited
   */
  isEditing?: boolean;

  /**
   * Whether to show the sync status
   */
  showSyncStatus?: boolean;

  /**
   * Current sync state
   */
  syncState?: SyncState;

  /**
   * Last synced time
   */
  lastSynced?: Date | string | null;

  /**
   * Sync error message (if syncState is 'error')
   */
  syncErrorMessage?: string;

  /**
   * Handler for sync retry
   */
  onSyncRetry?: () => void;

  /**
   * Menu items to display in the overflow menu (optional)
   */
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    isDanger?: boolean;
  }>;

  /**
   * Whether to show full-width content
   */
  fullWidth?: boolean;

  /**
   * Extra classes for the content area
   */
  contentClassName?: string;
}

/**
 * PageLayout component for consistent page layouts throughout the application
 */
export function PageLayout({
  title,
  subtitle,
  description,
  children,
  backUrl,
  showHomeButton = false,
  actions,
  isLoading = false,
  isEditing = false,
  showSyncStatus = false,
  syncState,
  lastSynced,
  syncErrorMessage,
  onSyncRetry,
  menuItems,
  fullWidth = false,
  contentClassName = "",
}: PageLayoutProps) {
  const [, navigate] = useLocation();

  // Handle back button click
  const handleBackClick = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      window.history.back();
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${title} | TerraFusionPlatform`}</title>
      </Helmet>

      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {backUrl !== undefined && (
              <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-1">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {showHomeButton && (
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <div>
              <h1 className="text-xl font-semibold leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {syncState && (
              <SyncStatus
                state={syncState}
                lastSynced={lastSynced}
                errorMessage={syncErrorMessage}
                onRetry={onSyncRetry}
                compact
                className="mr-2"
              />
            )}

            {isEditing && (
              <div className="bg-amber-100 text-amber-700 px-2 py-0.5 text-xs rounded-full mr-2">
                Editing
              </div>
            )}

            {actions}

            {menuItems && menuItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menuItems.map((item /* , index */) => (
                    <React.Fragment key={index}>
                      <DropdownMenuItem
                        onClick={item.onClick}
                        className={item.isDanger ? "text-red-600" : ""}
                      >
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        {item.label}
                      </DropdownMenuItem>
                      {index < menuItems.length - 1 && <DropdownMenuSeparator />}
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Main content */}
        <main
          className={`flex-1 overflow-auto ${fullWidth ? "p-0" : "p-4 max-w-7xl mx-auto w-full"} ${contentClassName}`}
        >
          {children}
        </main>
      </div>
    </>
  );
}
