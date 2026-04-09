import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of rows to show in the card content
   */
  rows?: number;
  /**
   * Whether to show a footer
   */
  footer?: boolean;
}

export function CardSkeleton({
  className,
  rows = 3,
  footer = false,
  ...props
}: CardSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array(rows)
          .fill(null)
          .map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
      </CardContent>
      {footer && (
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-1/4" />
        </CardFooter>
      )}
    </Card>
  );
}