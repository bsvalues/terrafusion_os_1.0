import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Server, Database, Cpu, Network, Bell, CloudOff, Clock, RotateCw  } from '@mui/icons-material';

const ConfigurationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div><>

        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p
</> className="text-gray-500 mt-2">
          Configure and manage your system settings
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <div className="flex">
          <div className="w-64 border-r pr-6">
            <TabsList className="flex flex-col w-full h-auto space-y-1">
              <TabsTrigger value="general" className="justify-start"><>

                <Settings className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger
</> value="services" className="justify-start"><>

                <Server className="mr-2 h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger
</> value="database" className="justify-start"><>

                <Database className="mr-2 h-4 w-4" />
                Database
              </TabsTrigger>
              <TabsTrigger
</> value="performance" className="justify-start"><>

                <Cpu className="mr-2 h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger
</> value="network" className="justify-start"><>

                <Network className="mr-2 h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger
</> value="notifications" className="justify-start"><>

                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
</> value="fallback" className="justify-start"><>

                <CloudOff className="mr-2 h-4 w-4" />
                Fallback Modes
              </TabsTrigger>
              <TabsTrigger
</> value="scheduling" className="justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Scheduling
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 pl-6">
            <TabsContent value="general" className="space-y-4 mt-0">
              <Card>
                <CardHeader><>

                  <CardTitle>System Information</CardTitle>
                  <CardDescription
</>>Overview of your system configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div><>

                      <h4 className="text-sm font-medium text-gray-500">System Version</h4>
                      <p
</> className="text-lg">v2.5.3</p>
                    </div>
                    <div><>

                      <h4 className="text-sm font-medium text-gray-500">Environment</h4>
                      <p
</> className="text-lg">Production</p>
                    </div>
                    <div><>

                      <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                      <p
</> className="text-lg">2023-05-15 14:30:00</p>
                    </div>
                    <div><>

                      <h4 className="text-sm font-medium text-gray-500">Status</h4>
                      <div
</> className="flex items-center"><>

                        <Badge className="bg-green-100 text-green-800 mr-2">Healthy</Badge>
                        <RotateCw
</> className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><>

                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription
</>>Manage API settings and configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div><>

                        <h4 className="font-medium">API Rate Limiting</h4>
                        <p
</> className="text-sm text-gray-500">Limit the number of API requests per minute</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="number" className="w-16 rounded-md border" defaultValue="100" />
                        <span className="text-sm text-gray-500">requests/min</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div><>

                        <h4 className="font-medium">API Timeout</h4>
                        <p
</> className="text-sm text-gray-500">Maximum time for API requests to complete</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="number" className="w-16 rounded-md border" defaultValue="30" />
                        <span className="text-sm text-gray-500">seconds</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div><>

                        <h4 className="font-medium">Enable API Logging</h4>
                        <p
</> className="text-sm text-gray-500">Log all API requests for debugging</p>
                      </div>
                      <div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                          <span className="absolute h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button>Save API Configuration</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="services" className="space-y-4 mt-0">
              <Card>
                <CardHeader><>

                  <CardTitle>Service Health</CardTitle>
                  <CardDescription
</>>Status of system services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Authentication Service', status: 'Healthy', uptime: '99.98%' },
                      { name: 'Database Service', status: 'Healthy', uptime: '100%' },
                      { name: 'API Gateway', status: 'Healthy', uptime: '99.95%' },
                      { name: 'Notification Service', status: 'Degraded', uptime: '98.72%' },
                      { name: 'Analytics Service', status: 'Healthy', uptime: '99.87%' },
                    ].map((service /* , index */) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div><>

                          <h4 className="font-medium">{service.name}</h4>
                          <div
</> className="text-sm text-gray-500">Uptime: {service.uptime}</div>
                        </div>
                        <Badge className={
                          service.status === 'Healthy' ? 'bg-green-100 text-green-800' : 
                          service.status === 'Degraded' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }>
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><>

                  <CardTitle>Circuit Breaker Configuration</CardTitle>
                  <CardDescription
</>>Configure circuit breaker thresholds for services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2"><>

                      <label className="text-sm font-medium">Error Threshold (%)</label>
                      <input
</> type="range" min="5" max="50" step="5" defaultValue="20" 
                        className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500"><>

                        <span>5%</span>
                        <span
</>>20%</span>
                        <span>50%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2"><>

                      <label className="text-sm font-medium">Reset Timeout (seconds)</label>
                      <input
</> type="range" min="10" max="300" step="10" defaultValue="60" 
                        className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500"><>

                        <span>10s</span>
                        <span
</>>60s</span>
                        <span>300s</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="auto-retry" defaultChecked />
                      <label htmlFor="auto-retry" className="text-sm">Enable automatic retry after timeout</label>
                    </div>
                  </div>
                  
                  <Button>Apply Circuit Breaker Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="database" className="mt-0">
              <Card>
                <CardHeader><>

                  <CardTitle>Database Configuration</CardTitle>
                  <CardDescription
</>>Manage database connection settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><>

                        <label className="text-sm font-medium">Connection Pool Size</label>
                        <input
</> type="number" className="w-full rounded-md border" defaultValue="20" />
                      </div>
                      <div className="space-y-2"><>

                        <label className="text-sm font-medium">Connection Timeout (ms)</label>
                        <input
</> type="number" className="w-full rounded-md border" defaultValue="5000" />
                      </div>
                      <div className="space-y-2"><>

                        <label className="text-sm font-medium">Query Timeout (ms)</label>
                        <input
</> type="number" className="w-full rounded-md border" defaultValue="10000" />
                      </div>
                      <div className="space-y-2"><>

                        <label className="text-sm font-medium">Max Idle Connections</label>
                        <input
</> type="number" className="w-full rounded-md border" defaultValue="10" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between"><>

                        <label className="text-sm font-medium">Enable Query Logging</label>
                        <div
</> className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                          <span className="absolute h-4 w-4 transform rounded-full bg-white transition-transform" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2"><>

                      <label className="text-sm font-medium">Database URI</label>
                      <div
</> className="flex">
                        <input type="text" className="flex-1 rounded-l-md border" value="postgresql://user:****@localhost:5432/appdb" readOnly />
                        <button className="bg-gray-200 px-4 rounded-r-md">Test</button>
                      </div>
                    </div>
                    
                    <Button>Save Database Configuration</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Add more TabsContent sections for other tabs as needed */}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default ConfigurationPage;