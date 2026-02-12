import React from "react";
import { File, FilePlus, FolderPlus, Plus  } from '@mui/icons-material';
import { Card, CardContent, CardFooter } from "./card";
import { Button } from "./button";

interface EmptyStateProps {
  /**
   * Title to display
   */
  title: string;

  /**
   * Message to display
   */
  message?: string;

  /**
   * Icon to display
   */
  icon?: React.ReactNode;

  /**
   * Action button text
   */
  actionText?: string;

  /**
   * Action button click handler
   */
  onAction?: () => void;

  /**
   * Secondary action button text
   */
  secondaryActionText?: string;

  /**
   * Secondary action button click handler
   */
  onSecondaryAction?: () => void;

  /**
   * Custom actions to render
   */
  actions?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Type of empty state (controls the icon if not provided)
   */
  type?: "default" | "file" | "folder" | "data" | "search";
}

/**
 * EmptyState component for standardized empty state display
 */
export function EmptyState({
  title,
  message,
  icon,
  actionText = "Create New",
  onAction,
  secondaryActionText,
  onSecondaryAction,
  actions,
  className = "",
  type = "default",
}: EmptyStateProps) {
  // Default icon based on type
  const defaultIcon = React.useMemo(() => {
    switch (type) {
      case "file":
        return <File className="h-12 w-12 text-muted-foreground/60" />;
      case "folder":
        return <FolderPlus className="h-12 w-12 text-muted-foreground/60" />;
      case "data":
        return <FilePlus className="h-12 w-12 text-muted-foreground/60" />;
      default:
        return <Plus className="h-12 w-12 text-muted-foreground/60" />;
    }
  }, [type]);

  return (
    <Card className={`border-dashed bg-muted/5 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {icon || defaultIcon}

        <h3 className="mt-4 text-lg font-medium">{title}</h3>

        {message && (
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
        )}

        {(actions || onAction) && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {actions || (
              <>
                {onAction && (
                  <Button onClick={onAction} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {actionText}
                  </Button>
                )}

                {onSecondaryAction && (
                  <Button onClick={onSecondaryAction} variant="outline">
                    {secondaryActionText}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
