import { Loader2  } from '@mui/icons-material';
import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface LoadingStateProps {
  /**
   * The message to display while loading
   */
  message?: string;

  /**
   * The variant of the loading state
   */
  variant?: "default" | "inline" | "card" | "skeleton" | "minimal";

  /**
   * Number of skeleton items to display (only used with skeleton variant)
   */
  count?: number;

  /**
   * Height of each skeleton item (only used with skeleton variant)
   */
  height?: string;

  /**
   * Width of each skeleton item (only used with skeleton variant)
   */
  width?: string;

  /**
   * Additional className to apply
   */
  className?: string;
}

/**
 * LoadingState component to provide consistent loading UI across the application
 */
export function LoadingState({
  message = "Loading...",
  variant = "default",
  count = 3,
  height = "2rem",
  width = "100%",
  className = "",
}: LoadingStateProps) {
  // Default spinner with message
  if (variant === "default") {
    return (
      <div className={`w-full flex flex-col items-center justify-center py-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  // Inline spinner with message
  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  // Card with spinner
  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  // Skeleton loading (useful for content placeholders)
  if (variant === "skeleton") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            style={{ height, width }}
            className={i === 0 ? "bg-muted/80" : "bg-muted/60"}
          />
        ))}
      </div>
    );
  }

  // Minimal spinner (just the spinner, no text)
  return (
    <div className={`flex justify-center ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
