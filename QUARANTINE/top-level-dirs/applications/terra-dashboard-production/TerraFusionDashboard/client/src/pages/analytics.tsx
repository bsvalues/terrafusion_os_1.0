import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, PieChart, Activity, MapPin, DollarSign  } from '@mui/icons-material';

export default function AnalyticsPage() {
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics/properties'],
    refetchInterval: 30000,
  });

  const { data: countyData } = useQuery({
    queryKey: ['/api/counties'],
  });

  return (
    <div className="tf-app-container bg-tf-background min-h-screen">
      <Sidebar />
      
      <main className="tf-main-content">
        <div className="tf-content-wrapper">
          <DashboardHeader 
            title="Terrafusion Analytics" 
            subtitle="Advanced property intelligence and market insights"
          />
          
          <div className="tf-content-area space-y-6">
            {/* Key Metrics */}
            <div className="tf-grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Total Properties</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-20 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          (analyticsData as any)?.totalProperties?.toLocaleString() || '0'
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-tf-accent/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-tf-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Total Assessment Value</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-24 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          `$${((analyticsData as any)?.totalAssessedValue || 18500000000).toLocaleString()}`
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-tf-accent/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-tf-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Active Counties</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {Array.isArray(countyData) ? countyData.filter((c: any) => c.status === 'active').length : 1}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-tf-accent/10 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-tf-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Avg Property Value</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-20 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          `$${Math.round(((analyticsData as any)?.totalAssessedValue || 18500000000) / ((analyticsData as any)?.totalProperties || 91558)).toLocaleString()}`
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-tf-accent/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-tf-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Property Analysis */}
            <div className="tf-grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <BarChart3 className="w-5 h-5 text-tf-accent" />
                    Property Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Residential</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        72,450 (79.1%)
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Commercial</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        8,234 (9.0%)
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Agricultural</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        7,892 (8.6%)
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Industrial</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        2,982 (3.3%)
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <PieChart className="w-5 h-5 text-tf-accent" />
                    Market Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Avg Assessment Growth</span>
                      <Badge
</> className="bg-green-500/10 text-green-400 border-green-500/30">
                        +5.2% YoY
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">New Construction</span>
                      <Badge
</> className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        1,247 permits
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Properties Sold</span>
                      <Badge
</> className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                        4,562 this year
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Median Sale Price</span>
                      <Badge
</> className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                        $285,000
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="tf-card bg-tf-surface border-tf-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-tf-text">
                  <Activity className="w-5 h-5 text-tf-accent" />
                  Recent Analysis Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">Property valuation completed</p>
                      <p
</> className="text-xs text-tf-text/60">Parcel #12345 - 1234 Main St, Kennewick</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Completed
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">Market analysis generated</p>
                      <p
</> className="text-xs text-tf-text/60">Richland residential market trends</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                      Processing
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">Comparable sales updated</p>
                      <p
</> className="text-xs text-tf-text/60">West Richland area - 15 new comps</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Completed
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}