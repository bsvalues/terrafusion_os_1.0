import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Database, FileText, Users, Building, Server, Activity, CheckCircle  } from '@mui/icons-material';
import { Link } from "react-router-dom";
import DataImportManager from "@/components/DataImportManager";
import FTPDataImportManager from "@/components/FTPDataImportManager";
import BentonCountyDataSync from "@/components/BentonCountyDataSync";
import { useDataImports } from "@/hooks/useDataImports";
import { useCounties } from "@/hooks/useCounties";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DataImportDashboard = () => {
  const { imports } = useDataImports();
  const { data: counties } = useCounties();

  const { data: propertyCount } = useQuery({
    queryKey: ['property-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: ownerCount } = useQuery({
    queryKey: ['owner-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('property_owners')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  const bentonCountyImports = imports?.filter(imp => 
    imp.import_name?.toLowerCase().includes('benton') || 
    imp.metadata?.county_id === '53005'
  ) || [];

  const recentImports = imports?.slice(0, 5) || [];
  const totalRecordsImported = imports?.reduce((sum, imp) => sum + (imp.success_records || 0), 0) || 0;
  const failedImports = imports?.filter(imp => imp.status === 'failed').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Suite
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center"><>

                  <Database className="w-6 h-6 mr-2 text-cyan-400" />
                  Terrafusion Data Exchange Center
                </h1>
                <p
</> className="text-sm text-slate-300">🎯 Enterprise-grade white-glove service for Benton County, WA</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30"><>

                <Upload className="w-3 h-3 mr-1" />
                Production Active
              </Badge>
              <Badge
</> variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                <Server className="w-3 h-3 mr-1" />
                Terrafusion AI
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Benton County VIP Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Building className="w-6 h-6 text-cyan-400" /><>

            <h2 className="text-2xl font-bold text-white">Benton County, Washington</h2>
            <Badge
</> className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
              White Glove Service
            </Badge>
          </div>
          <BentonCountyDataSync />
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-300 text-sm font-medium flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Active Counties
              </CardTitle>
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{counties?.length || 0}</div>
              <p
</> className="text-xs text-blue-200">Benton County priority</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-300 text-sm font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{propertyCount?.toLocaleString() || 0}</div>
              <p
</> className="text-xs text-green-200">Enterprise validated</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-purple-300 text-sm font-medium flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Property Owners
              </CardTitle>
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{ownerCount?.toLocaleString() || 0}</div>
              <p
</> className="text-xs text-purple-200">AI-verified records</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-300 text-sm font-medium flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Sync Operations
              </CardTitle>
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{bentonCountyImports.length}</div>
              <p
</> className="text-xs text-yellow-200">
                {failedImports > 0 ? `${failedImports} need attention` : 'All successful'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benton County Activity Log */}
        {bentonCountyImports.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center"><>

                <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                Benton County Exchange Activity
              </CardTitle>
              <CardDescription
</> className="text-slate-300">Recent automated data synchronizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bentonCountyImports.slice(0, 5).map((importItem) => (
                  <div key={importItem.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg"><>

                        <Database className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div
</>><>

                        <div className="text-white font-medium">{importItem.import_name}</div>
                        <div
</> className="text-sm text-slate-400">
                          {importItem.success_records || 0} records processed • {importItem.error_records || 0} errors
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(importItem.created_at!).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={importItem.status === 'completed' ? 'default' : 
                                 importItem.status === 'failed' ? 'destructive' : 'secondary'}
                        className={importItem.status === 'completed' ? 'bg-green-500/20 text-green-300' : ''}
                      >
                        {importItem.status}
                      </Badge>
                      {importItem.metadata?.sync_type === 'scheduled' && (
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Imports Summary */}
        {recentImports.length > 0 && (
          <Card className="mb-8 bg-black/20 border-white/10">
            <CardHeader><>

              <CardTitle className="text-white">Recent Imports</CardTitle>
              <CardDescription
</> className="text-slate-300">Latest data import activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentImports.map((importItem) => (
                  <div key={importItem.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <div><>

                        <div className="text-white font-medium">{importItem.import_name}</div>
                        <div
</> className="text-sm text-slate-400">
                          {importItem.success_records} successful, {importItem.error_records} errors
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={importItem.status === 'completed' ? 'default' : 
                               importItem.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {importItem.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Import Options */}
        <div className="bg-black/20 rounded-lg p-6 border border-white/10">
          <Tabs defaultValue="benton-county" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="benton-county" className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Benton County</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Manual Upload</span>
              </TabsTrigger>
              <TabsTrigger value="ftp" className="flex items-center space-x-2">
                <Server className="w-4 h-4" />
                <span>FTP Import</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="benton-county">
              <Card className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border-cyan-500/20">
                <CardHeader><>

                  <CardTitle className="text-white">Benton County Washington - VIP Service</CardTitle>
                  <CardDescription
</> className="text-slate-300">
                    🎯 Production-ready automated data exchange with enterprise support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><>

                        <Building className="w-8 h-8 text-cyan-400" />
                      </div>
                      <h3
</> className="text-white text-xl mb-2">White Glove Data Exchange</h3>
                      <p className="text-slate-400">
                        Your Benton County data sync is fully configured and monitored above.
                      </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" /><>

                        <div className="text-white font-medium">Pre-Configured</div>
                        <div
</> className="text-slate-400">FTP connections ready</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <Server className="w-5 h-5 text-blue-400 mx-auto mb-2" /><>

                        <div className="text-white font-medium">Automated</div>
                        <div
</> className="text-slate-400">Daily sync at 2 AM</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" /><>

                        <div className="text-white font-medium">Supported</div>
                        <div
</> className="text-slate-400">24/7 monitoring</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual"><>

              <DataImportManager />
            </TabsContent>

            <TabsContent
</> value="ftp">
              <FTPDataImportManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DataImportDashboard;
