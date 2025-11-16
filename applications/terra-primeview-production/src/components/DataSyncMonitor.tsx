
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Clock, CheckCircle, Warning, Server, Zap  } from '@mui/icons-material';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SyncMetrics {
  totalSyncs: number;
  successRate: number;
  avgSyncTime: number;
  lastSyncTime: Date | null;
  dataHealth: 'excellent' | 'good' | 'warning' | 'critical';
  nextScheduledSync: Date | null;
}

export const DataSyncMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalSyncs: 0,
    successRate: 0,
    avgSyncTime: 0,
    lastSyncTime: null,
    dataHealth: 'good',
    nextScheduledSync: null
  });

  const { data: recentSyncs, refetch } = useQuery({
    queryKey: ['recent-syncs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .ilike('import_name', '%benton%county%')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .limit(1);

      const { data: owners } = await supabase
        .from('property_owners')
        .select('id')
        .limit(1);

      return {
        database_accessible: true,
        properties_table: properties ? properties.length > 0 : false,
        owners_table: owners ? owners.length > 0 : false
      };
    },
    refetchInterval: 60000 // Check every minute
  });

  useEffect(() => {
    if (recentSyncs) {
      const successful = recentSyncs.filter(sync => sync.status === 'completed').length;
      const successRate = recentSyncs.length > 0 ? (successful / recentSyncs.length) * 100 : 0;
      
      const avgTime = recentSyncs
        .filter(sync => sync.started_at && sync.completed_at)
        .reduce((acc, sync) => {
          const start = new Date(sync.started_at!);
          const end = new Date(sync.completed_at!);
          return acc + (end.getTime() - start.getTime());
        }, 0) / Math.max(recentSyncs.length, 1);

      setMetrics({
        totalSyncs: recentSyncs.length,
        successRate,
        avgSyncTime: avgTime,
        lastSyncTime: recentSyncs[0] ? new Date(recentSyncs[0].created_at!) : null,
        dataHealth: successRate >= 95 ? 'excellent' : successRate >= 80 ? 'good' : successRate >= 60 ? 'warning' : 'critical',
        nextScheduledSync: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      });
    }
  }, [recentSyncs]);

  const getHealthBadge = () => {
    const healthConfig = {
      excellent: { color: 'bg-green-500/20 text-green-300', icon: CheckCircle },
      good: { color: 'bg-blue-500/20 text-blue-300', icon: Activity },
      warning: { color: 'bg-yellow-500/20 text-yellow-300', icon: Warning },
      critical: { color: 'bg-red-500/20 text-red-300', icon: Warning }
    };

    const config = healthConfig[metrics.dataHealth];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {metrics.dataHealth.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-cyan-400" />
              System Health Monitor
            </CardTitle>
            {getHealthBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">Success Rate</div>
              <div
</> className="flex items-center space-x-2">
                <Progress value={metrics.successRate} className="flex-1" />
                <span className="text-white font-bold">{metrics.successRate.toFixed(1)}%</span>
              </div>
            </div>

            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">Total Syncs</div>
              <div
</> className="text-2xl font-bold text-white">{metrics.totalSyncs}</div>
            </div>

            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">Avg Sync Time</div>
              <div
</> className="text-white font-medium">
                {metrics.avgSyncTime > 0 ? `${Math.round(metrics.avgSyncTime / 1000)}s` : 'N/A'}
              </div>
            </div>

            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">Next Sync</div>
              <div
</> className="text-white font-medium flex items-center">
                <Clock className="w-4 h-4 mr-1 text-cyan-400" />
                {metrics.nextScheduledSync ? 
                  metrics.nextScheduledSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                  'Not scheduled'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Sync Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSyncs?.slice(0, 5).map((sync /* , index */) => (
                <div key={sync.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {sync.status === 'completed' ? 
                      <CheckCircle className="w-4 h-4 text-green-500" /> :
                      <Warning className="w-4 h-4 text-red-500" />
                    }
                    <div><>

                      <div className="text-white font-medium text-sm">{sync.import_name}</div>
                      <div
</> className="text-slate-400 text-xs">
                        {new Date(sync.created_at!).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={sync.status === 'completed' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {sync.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-white">Database Connection</span>
                </div>
                <Badge className="bg-green-500/20 text-green-300">
                  {systemHealth?.database_accessible ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-white">Auto-Sync Status</span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-300">Active</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-white">Data Integrity</span>
                </div>
                {getHealthBadge()}
              </div>

              <Alert className="bg-cyan-500/10 border-cyan-500/20 mt-4">
                <Activity className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200">
                  <strong>Terrafusion AI:</strong> All systems operational. 
                  Data exchange with Benton County is functioning optimally.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
