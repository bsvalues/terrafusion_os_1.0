
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  actionLabel?: string;
  actionUrl?: string;
  valueColor?: string;
  trend?: number;
  subtitle?: string;
  isLoading?: boolean;
  error?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon, 
  actionLabel = "View all", 
  actionUrl = "#",
  valueColor = "text-gray-900",
  trend,
  subtitle,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <Card className="bg-white overflow-hidden shadow animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mt-4"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white overflow-hidden shadow border-red-200">
        <CardContent className="p-6">
          <h3 className="text-lg text-gray-600">{title}</h3>
          <p className="text-red-500 mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white overflow-hidden shadow">
      <CardContent className="p-0">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg text-gray-600 dark:text-gray-300 font-medium">{title}</h3>
            {trend && (
              <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
          )}
        </div>
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a 
              href={actionUrl} 
              className="font-medium text-primary-700 hover:text-primary-900"
            >
              {actionLabel}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
