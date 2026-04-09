import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LucideIcon  } from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | null;
  icon: LucideIcon;
  color?: "primary" | "green" | "indigo" | "amber";
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  isLoading = false
}: MetricCardProps) {
  
  // Color variants for icons
  const colorVariants = {
    primary: "text-blue-500 bg-blue-100",
    green: "text-green-500 bg-green-100",
    indigo: "text-indigo-500 bg-indigo-100",
    amber: "text-amber-500 bg-amber-100"
  };
  
  // Color variants for text
  const textColorVariants = {
    primary: "text-blue-700",
    green: "text-green-700",
    indigo: "text-indigo-700",
    amber: "text-amber-700"
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-full", colorVariants[color])}><>

            <Icon className="h-5 w-5" />
          </div>
          
          <div
</> className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            
            {isLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className={cn("text-2xl font-bold", textColorVariants[color])}>
                {value || "N/A"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}