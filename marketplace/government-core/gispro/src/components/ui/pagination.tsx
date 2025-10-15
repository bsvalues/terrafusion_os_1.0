import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "../../lib/utils"
import { ButtonProps, buttonVariants } from "./button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      "cursor-pointer",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// Enhanced pagination hook for complex pagination logic
interface UsePaginationProps {
  currentPage: number;
  totalPages: number;
  maxVisiblePages?: number;
  onPageChange: (page: number) => void;
}

export const usePagination = ({
  currentPage,
  totalPages,
  maxVisiblePages = 5,
  onPageChange
}: UsePaginationProps) => {
  const getVisiblePages = React.useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages, maxVisiblePages]);

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;
  const showStartEllipsis = getVisiblePages[0] > 1;
  const showEndEllipsis = getVisiblePages[getVisiblePages.length - 1] < totalPages;

  const goToNext = React.useCallback(() => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, canGoNext, onPageChange]);

  const goToPrevious = React.useCallback(() => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, canGoPrevious, onPageChange]);

  const goToFirst = React.useCallback(() => {
    onPageChange(1);
  }, [onPageChange]);

  const goToLast = React.useCallback(() => {
    onPageChange(totalPages);
  }, [onPageChange, totalPages]);

  return {
    visiblePages: getVisiblePages,
    canGoNext,
    canGoPrevious,
    showStartEllipsis,
    showEndEllipsis,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    goToPage: onPageChange
  };
};

// Complete pagination component with enhanced features
interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  maxVisiblePages?: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  showGoToFirst?: boolean;
  showGoToLast?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const SmartPagination: React.FC<SmartPaginationProps> = ({
  currentPage,
  totalPages,
  maxVisiblePages = 5,
  onPageChange,
  showPageInfo = false,
  showGoToFirst = true,
  showGoToLast = true,
  size = "default",
  className
}) => {
  const {
    visiblePages,
    canGoNext,
    canGoPrevious,
    showStartEllipsis,
    showEndEllipsis,
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast,
    goToPage
  } = usePagination({
    currentPage,
    totalPages,
    maxVisiblePages,
    onPageChange
  });

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={goToPrevious}
              className={cn(
                !canGoPrevious && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

          {/* Go to First */}
          {showGoToFirst && showStartEllipsis && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => goToPage(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          {/* Page Numbers */}
          {visiblePages.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => goToPage(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {/* Go to Last */}
          {showGoToLast && showEndEllipsis && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => goToPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={goToNext}
              className={cn(
                !canGoNext && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
};

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
