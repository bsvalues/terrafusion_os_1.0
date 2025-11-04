
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Building, DollarSign  } from '@mui/icons-material';
import { useCounties } from "@/hooks/useCounties";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function PropertyMetrics() {
  const { data: counties } = useCounties();

  const { data: propertyStats } = useQuery({
    queryKey: ["property-analytics"],
    queryFn: async () => {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("assessed_value, property_type, last_assessment_date")
        .eq("active", true);

      if (error) throw error;

      const totalProperties = properties?.length || 0;
      const totalValue = properties?.reduce((sum, p) => sum + (p.assessed_value || 0), 0) || 0;
      const avgValue = totalProperties > 0 ? totalValue / totalProperties : 0;
      
      const recentAssessments = properties?.filter(p => {
        const assessmentDate = new Date(p.last_assessment_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return assessmentDate > thirtyDaysAgo;
      }).length || 0;

      const propertyTypes = properties?.reduce((acc, p) => {
        acc[p.property_type] = (acc[p.property_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalProperties,
        totalValue,
        avgValue,
        recentAssessments,
        propertyTypes,
        assessmentCompletion: totalProperties > 0 ? (recentAssessments / totalProperties) * 100 : 0
      };
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

          <CardTitle className="text-sm font-medium text-white">Total Properties</CardTitle>
          <Building
</> className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent><>

          <div className="text-2xl font-bold text-white">
            {propertyStats?.totalProperties.toLocaleString() || "0"}
          </div>
          <p
</> className="text-xs text-slate-400">
            Across {counties?.length || 0} counties
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

          <CardTitle className="text-sm font-medium text-white">Total Assessed Value</CardTitle>
          <DollarSign
</> className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent><>

          <div className="text-2xl font-bold text-white">
            {formatCurrency(propertyStats?.totalValue || 0)}
          </div>
          <p
</> className="text-xs text-slate-400">
            Average: {formatCurrency(propertyStats?.avgValue || 0)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

          <CardTitle className="text-sm font-medium text-white">Recent Assessments</CardTitle>
          <TrendingUp
</> className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent><>

          <div className="text-2xl font-bold text-white">
            {propertyStats?.recentAssessments || 0}
          </div>
          <p
</> className="text-xs text-slate-400">
            Last 30 days
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

          <CardTitle className="text-sm font-medium text-white">Assessment Progress</CardTitle>
          <TrendingUp
</> className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent><>

          <div className="text-2xl font-bold text-white">
            {Math.round(propertyStats?.assessmentCompletion || 0)}%
          </div>
          <Progress
</> 
            value={propertyStats?.assessmentCompletion || 0} 
            className="mt-2 bg-white/10" 
          />
          <p className="text-xs text-slate-400 mt-1">
            Current cycle completion
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
