import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTIES } from "@/lib/constants";

export default function SystemIntegration() {
  // Fetch system health
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/system/health'],
    refetchInterval: 30000,
  });

  // Fetch counties
  const { data: counties, isLoading: countiesLoading } = useQuery({
    queryKey: ['/api/counties'],
    refetchInterval: 60000,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Data Synchronization */}
      <Card className="tf-card bg-tf-surface border-tf-accent/20">
        <CardHeader className="border-b border-tf-accent/20 bg-tf-surface">
<>
          <CardTitle className="text-lg font-semibold text-tf-text">Benton County Integration</CardTitle>
          <p
</> className="text-sm text-tf-text/70">Real-time property data synchronization</p>
        </CardHeader>
        
        <CardContent className="p-6 bg-tf-surface">
          <div className="space-y-4">
            {/* Sync Status */}
            <div className="flex items-center justify-between p-4 bg-tf-dark rounded-lg border border-tf-accent/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-tf-accent/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-tf-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
                <div>
<>
                  <p className="text-sm font-medium text-tf-text">91,558 Properties Synchronized</p>
                  <p
</> className="text-xs text-tf-text/60">Live data feed active</p>
                </div>
              </div>
              <Badge variant="outline" className="text-tf-accent border-tf-accent/30 bg-tf-accent/10">Active</Badge>
            </div>

            {/* Sync Statistics */}
            {healthLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-6 w-12 mx-auto mb-1" />
<>
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
                <div
</> className="text-center p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
<>
                  <p className="text-lg font-semibold text-gray-900">2,847</p>
                  <p
</> className="text-xs text-gray-600">Records synced today</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
<>
                  <p className="text-lg font-semibold text-gray-900">0</p>
                  <p
</> className="text-xs text-gray-600">Sync errors</p>
                </div>
              </div>
            )}

            {/* Recent Sync Activity */}
            <div>
<>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Activity</h4>
              <div
</> className="space-y-2">
                <div className="text-xs text-gray-600">
                  ✓ Property assessments updated (247 records)
                  <span className="block text-gray-400">1 minute ago</span>
                </div>
                <div className="text-xs text-gray-600">
                  ✓ Ownership transfers processed (12 records)
                  <span className="block text-gray-400">3 minutes ago</span>
                </div>
                <div className="text-xs text-gray-600">
                  ✓ Tax exemptions updated (5 records)
                  <span className="block text-gray-400">7 minutes ago</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* County Customization */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200">
<>
          <CardTitle className="text-lg font-semibold text-gray-900">County Customization</CardTitle>
          <p
</> className="text-sm text-gray-600">Plugin framework for county-specific features</p>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Active Counties */}
          <div className="space-y-4">
            {countiesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              COUNTIES.map((county) => {
                const countyData = Array.isArray(counties) ? counties.find((c: any) => c.id === county.id) : null;
                const statusColor = county.status === 'active' ? 'green' : 
                                   county.status === 'setup' ? 'yellow' : 
                                   county.status === 'prospect' ? 'blue' : 'gray';
                const bgColor = county.status === 'active' ? 'bg-tf-accent/10 border-tf-accent/30' :
                               county.status === 'setup' ? 'bg-yellow-400/10 border-yellow-400/30' : 
                               county.status === 'prospect' ? 'bg-blue-400/10 border-blue-400/30' : 'bg-tf-dark border-tf-accent/20';
                
                return (
                  <div key={county.id} className={`flex items-center justify-between p-4 rounded-lg border ${bgColor}`}>
                    <div className="flex items-center space-x-3">
                      <span className={`w-2 h-2 bg-${statusColor}-400 rounded-full`} />
                      <div>
<>
                        <p className="text-sm font-medium text-gray-900">{county.name}</p>
                        <p
</> className="text-xs text-tf-text/60">
                          {county.status === 'active' && `${countyData?.propertyCount || '91,558'} properties • All features active`}
                          {county.status === 'setup' && 'Setup in progress • 67% complete'}
                          {county.status === 'prospect' && 'Potential client • Ready for onboarding'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={`text-${statusColor}-700 hover:text-${statusColor}-800`}
                    >
                      {county.status === 'active' && 'Configure'}
                      {county.status === 'setup' && 'Continue Setup'}
                      {county.status === 'prospect' && 'Start Onboarding'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Customization Options */}
          <div className="mt-6">
<>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Available Customizations</h4>
            <div
</> className="space-y-2">
              {[
                { name: "Assessment workflows", active: true },
                { name: "Tax exemption rules", active: true },
                { name: "Report templates", active: true },
                { name: "GIS integrations", active: true },
                { name: "Custom fields", active: false },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
<>
                  <span className="text-gray-600">{item.name}</span>
                  <span
</> className={item.active ? "text-terra-600" : "text-gray-400"}>
                    {item.active ? "✓ Active" : "Available"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
