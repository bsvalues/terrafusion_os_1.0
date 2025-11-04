import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon,
  children,
  className,
  titleClassName,
  actions,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0",
        className
      )}
    >
      <div>
        <h1
          className={cn(
            "text-2xl font-bold tracking-tight flex items-center gap-2",
            titleClassName
          )}
        >
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {(children || actions) && (
        <div className="flex items-center gap-2">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
