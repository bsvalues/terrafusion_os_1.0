
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSalesComparables } from "@/hooks/useProperty";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Calendar, CheckCircle, AlertCircle  } from '@mui/icons-material';

interface SalesComparablesPanelProps {
  propertyId: string;
}

export function SalesComparablesPanel({ propertyId }: SalesComparablesPanelProps) {
  const { data: sales, isLoading } = useSalesComparables(propertyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Sales History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3"><>

            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div
</> className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentSales = sales?.slice(0, 5) || [];
  const averagePrice = sales?.length > 0 
    ? sales.reduce((sum, sale) => sum + sale.sale_price, 0) / sales.length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Sales History</span>
          {sales?.length && (
            <Badge variant="secondary">{sales.length} Sales</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentSales.length === 0 ? (
          <p className="text-gray-500 text-sm">No sales history available</p>
        ) : (
          <>
            {averagePrice > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"><>

                <span className="font-medium text-blue-800">Average Sale Price</span>
                <span
</> className="font-bold text-blue-800">
                  {formatCurrency(averagePrice)}
                </span>
              </div>
            )}
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Recent Sales</h4>
              {recentSales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {sale.verified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <Badge variant={sale.verified ? 'default' : 'secondary'}>
                        {sale.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between"><>

                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(sale.sale_price)}
                    </span>
                    <Badge
</> variant="outline">{sale.sale_type}</Badge>
                  </div>
                  
                  {sale.validity_score && (
                    <div className="flex items-center space-x-2 text-sm"><>

                      <span className="text-gray-600">Validity Score:</span>
                      <div
</> className="flex items-center space-x-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full"><>

                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${sale.validity_score * 100}%` }}
                          />
                        </div>
                        <span
</> className="text-xs font-medium">
                          {Math.round(sale.validity_score * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {sale.verification_source && (
                    <p className="text-xs text-gray-500">
                      Source: {sale.verification_source}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
