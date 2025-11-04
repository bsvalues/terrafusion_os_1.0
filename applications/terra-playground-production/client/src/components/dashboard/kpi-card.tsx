import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

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
  actionLabel = 'View all',
  actionUrl = '#',
  valueColor = 'text-gray-900',
  trend,
  subtitle,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-white overflow-hidden shadow-md animate-pulse border border-primary-blue-light/20">
        <CardContent className="p-6"><>

          <div className="h-4 bg-primary-blue-light/20 rounded w-3/4"></div>
          <div
</> className="h-8 bg-primary-blue-light/10 rounded w-1/2 mt-4"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white overflow-hidden shadow-md border-red-200 border">
        <CardContent className="p-6"><>

          <h3 className="text-lg text-primary-blue-dark tf-font-heading">{title}</h3>
          <p
</> className="text-red-500 mt-2 tf-font-body">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white overflow-hidden shadow border-primary-blue-light/20 border">
      <CardContent className="p-0">
        <div className="p-6 bg-white rounded-xl shadow-lg transition-all hover:shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg text-primary-blue-dark font-medium tf-font-heading">{title}</h3>
            {trend && (
              <span className={`text-sm ${trend > 0 ? 'text-primary-teal' : 'text-red-500'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-primary-blue to-primary-teal bg-clip-text text-transparent tf-font-heading">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-primary-blue-light mt-2 tf-font-body">{subtitle}</p>
          )}
        </div>
        <div className="bg-primary-blue-light/5 px-5 py-3 border-t border-primary-blue-light/20">
          <div className="text-sm">
            <a
              href={actionUrl}
              className="font-medium text-primary-teal hover:text-primary-teal-dark tf-font-body transition-colors"
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
