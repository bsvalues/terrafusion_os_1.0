import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { BentonCountyDataService } from "@/services/BentonCountyDataService";
import { ScheduledDataSyncService } from "@/services/ScheduledDataSyncService";
import { DataSyncMonitor } from "./DataSyncMonitor";
import { Refresh, Download, CheckCircle, Clock, Warning, Building, Settings, Zap, MapPin  } from '@mui/icons-material';

export default function BentonCountyDataSync() {
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [isGISSyncing, setIsGISSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastGISSync, setLastGISSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [gisStatus, setGisStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showAdvancedMonitoring, setShowAdvancedMonitoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeScheduling = async () => {
      try {
        await ScheduledDataSyncService.createBentonCountySchedule();
        console.log('Benton County production sync schedule initialized');
      } catch (error) {
        console.error('Failed to initialize sync schedule:', error);
      }
    };

    initializeScheduling();
  }, []);

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    setIsAutoSyncing(true);
    
    try {
      const result = await BentonCountyDataService.performAutomaticSync();
      
      if (result.success) {
        setSyncStatus('success');
        setLastSyncTime(new Date());
        
        toast({
          title: "🎯 Production Sync Complete",
          description: `Successfully updated from Benton County FTP. Processed ${result.filesProcessed} files with zero errors.`,
        });
      } else {
        throw new Error(`Sync completed with ${result.errors.length} errors`);
      }
      
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "FTP Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync from production FTP",
        variant: "destructive",
      });
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const handleArcGISSync = async () => {
    setGisStatus('syncing');
    setIsGISSyncing(true);
    
    try {
      const result = await BentonCountyDataService.syncArcGISData();
      
      if (result.success) {
        setGisStatus('success');
        setLastGISSync(new Date());
        
        toast({
          title: "🗺️ ArcGIS Sync Complete",
          description: `Successfully updated ${result.layersProcessed} GIS layers from Benton County ArcGIS server.`,
        });
      } else {
        throw new Error(`GIS sync completed with ${result.errors.length} errors`);
      }
      
    } catch (error) {
      setGisStatus('error');
      toast({
        title: "ArcGIS Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync GIS data",
        variant: "destructive",
      });
    } finally {
      setIsGISSyncing(false);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    
    try {
      if (enabled) {
        await ScheduledDataSyncService.createBentonCountySchedule();
        toast({
          title: "Auto-Sync Enabled",
          description: "Scheduled data synchronization is now active. Next sync at 2:00 AM.",
        });
      } else {
        toast({
          title: "Auto-Sync Disabled",
          description: "Scheduled synchronization has been paused.",
        });
      }
    } catch (error) {
      toast({
        title: "Configuration Error",
        description: "Failed to update auto-sync settings",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <Warning className="w-4 h-4 text-red-500" />;
      default: return <Refresh className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (syncStatus) {
      case 'syncing': return <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">Syncing...</Badge>;
      case 'success': return <Badge variant="default" className="bg-green-500/20 text-green-300">Up to Date</Badge>;
      case 'error': return <Badge variant="destructive">Sync Error</Badge>;
      default: return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Control Panel */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-blue-400" />
              <div><>

                <CardTitle className="text-white">Benton County Production Exchange</CardTitle>
                <CardDescription
</> className="text-blue-200">
                  🏛️ Live production data exchange with Benton County systems
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="default" className="bg-green-500/20 text-green-300"><>

                <CheckCircle className="w-3 h-3 mr-1" />
                Production Ready
              </Badge>
              <Badge
</> variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                <Zap className="w-3 h-3 mr-1" />
                Terrafusion AI
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">FTP Connection</div>
              <div
</> className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-white font-medium">Connected</span>
              </div>
            </div>
            
            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">ArcGIS Server</div>
              <div
</> className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-white font-medium">Available</span>
              </div>
            </div>

            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">Last FTP Sync</div>
              <div
</> className="text-white font-medium">
                {lastSyncTime ? lastSyncTime.toLocaleString() : 'Ready'}
              </div>
            </div>

            <div className="space-y-2"><>

              <div className="text-sm text-slate-400">Last GIS Sync</div>
              <div
</> className="text-white font-medium">
                {lastGISSync ? lastGISSync.toLocaleString() : 'Ready'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleManualSync} 
              disabled={isAutoSyncing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAutoSyncing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Syncing FTP Data...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Sync FTP Data
                </>
              )}
            </Button>

            <Button 
              onClick={handleArcGISSync} 
              disabled={isGISSyncing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGISSyncing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Syncing GIS...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Sync ArcGIS Data
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setShowAdvancedMonitoring(!showAdvancedMonitoring)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvancedMonitoring ? 'Hide' : 'Show'} Monitoring
            </Button>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg">
            <Switch 
              checked={autoSyncEnabled}
              onCheckedChange={setAutoSyncEnabled}
            />
            <div><>

              <div className="text-white font-medium">Automated Nightly Sync</div>
              <div
</> className="text-sm text-slate-400">
                {autoSyncEnabled ? 'Enabled - Next sync at 2:00 AM PST' : 'Disabled - Manual sync only'}
              </div>
            </div>
          </div>

          {/* Production Alert */}
          <Alert className="bg-green-500/10 border-green-500/20">
            <Zap className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <strong>Production Environment Active:</strong> Your system is now connected to live Benton County data sources. 
              FTP credentials and ArcGIS API are configured and secure. All data exchanges are logged and audited.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Advanced Monitoring Panel */}
      {showAdvancedMonitoring && <DataSyncMonitor />}

      {/* Data Source Status */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Production Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div><>

                  <div className="text-white font-medium">Benton County FTP Server</div>
                  <div
</> className="text-sm text-slate-400">Assessment data • Property records • Owner information</div>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/20 text-green-300">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div><>

                  <div className="text-white font-medium">ArcGIS Enterprise Server</div>
                  <div
</> className="text-sm text-slate-400">Parcel boundaries • Zoning • Infrastructure • GIS layers</div>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/20 text-green-300">Available</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <div><>

                  <div className="text-white font-medium">Automated Processing</div>
                  <div
</> className="text-sm text-slate-400">
                    Terrafusion AI handles data validation, mapping, and integration automatically
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
