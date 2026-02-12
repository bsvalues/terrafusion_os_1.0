import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCounties } from "@/hooks/useCounties";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Users, TrendingUp, Activity, Building  } from '@mui/icons-material';

export function CountyStatistics() {
  const { data: counties } = useCounties();

  const { data: countyStats } = useQuery({
    queryKey: ["county-statistics"],
    queryFn: async () => {
      if (!counties) return null;

      const statsPromises = counties.map(async (county) => {
        const { data: properties } = await supabase
          .from("properties")
          .select("id, assessed_value, property_type")
          .eq("county_id", county.id)
          .eq("active", true);

        const { data: neighborhoods } = await supabase
          .from("neighborhoods")
          .select("id")
          .eq("county_id", county.id)
          .eq("active", true);

        const { data: recentExecutions } = await supabase
          .from("agent_executions")
          .select("id")
          .in("property_id", properties?.map(p => p.id) || [])
          .gte("started_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        return {
          county,
          propertyCount: properties?.length || 0,
          totalValue: properties?.reduce((sum, p) => sum + (p.assessed_value || 0), 0) || 0,
          neighborhoodCount: neighborhoods?.length || 0,
          aiActivity: recentExecutions?.length || 0,
        };
      });

      return Promise.all(statsPromises);
    },
    enabled: !!counties,
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (!countyStats) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">County Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4"><>

            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div
</> className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topCounties = countyStats
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-cyan-400" />
          County Performance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCounties.map((stat) => (
          <div key={stat.county.id} className="border-b border-white/10 pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2"><>

                <h3 className="text-white font-medium">{stat.county.name}</h3>
                <Badge
</> variant="secondary" className="bg-slate-700 text-slate-200">
                  {stat.county.state}
                </Badge>
              </div>
              <Badge 
                variant="outline" 
                className="border-cyan-400 text-cyan-300"
              >
                {formatCurrency(stat.totalValue)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span className="text-slate-300">{stat.propertyCount} properties</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span className="text-slate-300">{stat.neighborhoodCount} areas</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 text-slate-400" />
                <span className="text-slate-300">{stat.aiActivity} AI tasks</span>
              </div>
            </div>
          </div>
        ))}
        
        {countyStats.length === 0 && (
          <p className="text-slate-400 text-center py-4">
            No county data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
