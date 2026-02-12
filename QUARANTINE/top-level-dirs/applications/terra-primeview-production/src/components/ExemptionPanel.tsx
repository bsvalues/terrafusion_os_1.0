
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExemptions } from "@/hooks/useProperty";
import { formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, FileText  } from '@mui/icons-material';

interface ExemptionPanelProps {
  propertyId: string;
}

export function ExemptionPanel({ propertyId }: ExemptionPanelProps) {
  const { data: exemptions, isLoading } = useExemptions(propertyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Exemptions</span>
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

  const activeExemptions = exemptions?.filter(e => e.status === 'Active') || [];
  const totalExemptionAmount = activeExemptions.reduce((sum, e) => sum + (e.exemption_amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Exemptions</span>
          {activeExemptions.length > 0 && (
            <Badge variant="secondary">{activeExemptions.length} Active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeExemptions.length === 0 ? (
          <p className="text-gray-500 text-sm">No active exemptions</p>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Total Exemption Value</span>
              </div>
              <span className="font-bold text-green-800">
                {formatCurrency(totalExemptionAmount)}
              </span>
            </div>
            
            <div className="space-y-3">
              {activeExemptions.map((exemption) => (
                <div key={exemption.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between"><>

                    <h4 className="font-medium">{exemption.exemption_type}</h4>
                    <Badge
</> variant={exemption.status === 'Active' ? 'default' : 'secondary'}>
                      {exemption.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{formatCurrency(exemption.exemption_amount || 0)}</span>
                    </div>
                    {exemption.percentage_exempt && (
                      <div>
                        <span>{exemption.percentage_exempt}% exempt</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(exemption.start_date).toLocaleDateString()}</span>
                    </div>
                    {exemption.end_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Expires: {new Date(exemption.end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {exemption.notes && (
                    <p className="text-sm text-gray-600 mt-2">{exemption.notes}</p>
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
