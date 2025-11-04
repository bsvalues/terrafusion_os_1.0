
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Search, Bot, BarChart3, Map, Users, Settings, Database  } from '@mui/icons-material';
import { Link } from "react-router-dom";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { PropertySearch } from "@/components/search/PropertySearch";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center"><>

                <Building className="w-6 h-6 text-white" />
              </div>
              <div
</>><>

                <h1 className="text-xl font-bold text-white">Terrafusion AI</h1>
                <p
</> className="text-cyan-400 text-sm">Civil Infrastructure Intelligence Platform</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              System Online
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8"><>

          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome to Terrafusion AI
          </h2>
          <p
</> className="text-slate-300 text-lg">
            Enterprise-grade property assessment platform with advanced AI capabilities
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/10">
            <TabsTrigger value="search" className="text-white data-[state=active]:bg-cyan-500/20"><>

              <Search className="w-4 h-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger
</> value="analytics" className="text-white data-[state=active]:bg-cyan-500/20"><>

              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
</> value="tools" className="text-white data-[state=active]:bg-cyan-500/20"><>

              <Bot className="w-4 h-4 mr-2" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger
</> value="maps" className="text-white data-[state=active]:bg-cyan-500/20"><>

              <Map className="w-4 h-4 mr-2" />
              Maps
            </TabsTrigger>
            <TabsTrigger
</> value="admin" className="text-white data-[state=active]:bg-cyan-500/20">
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-6"><>

            <PropertySearch />
          </TabsContent>

          <TabsContent
</> value="analytics" className="mt-6"><>

            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent
</> value="tools" className="mt-6">
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <Link to="/agent-dashboard">
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center"><>

                      <Bot className="w-5 h-5 mr-2 text-cyan-400" />
                      AI Agent Dashboard
                    </CardTitle>
                    <CardDescription
</> className="text-slate-300">
                      Monitor and manage AI assessment agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 text-sm">
                      Real-time agent monitoring, task orchestration, and performance analytics
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/property-record">
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center"><>

                      <Database className="w-5 h-5 mr-2 text-cyan-400" />
                      Property Records
                    </CardTitle>
                    <CardDescription
</> className="text-slate-300">
                      Detailed property information and history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 text-sm">
                      Access comprehensive property data, assessments, and ownership details
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/orchestrator-monitor">
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center"><>

                      <Settings className="w-5 h-5 mr-2 text-cyan-400" />
                      Orchestrator Monitor
                    </CardTitle>
                    <CardDescription
</> className="text-slate-300">
                      System health and orchestration oversight
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 text-sm">
                      Monitor system health, manage configurations, and oversee operations
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="maps" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center"><>

                  <Map className="w-5 h-5 mr-2 text-cyan-400" />
                  Geographic Information System
                </CardTitle>
                <CardDescription
</> className="text-slate-300">
                  Interactive mapping and spatial analysis tools
                </CardDescription>
              </CardHeader>
              <CardContent className="py-12">
                <div className="text-center">
                  <Map className="w-16 h-16 text-slate-600 mx-auto mb-4" /><>

                  <p className="text-slate-400 mb-4">GIS mapping interface coming soon</p>
                  <Button
</> variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    View Development Roadmap
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link to="/county-landing">
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center"><>

                      <Users className="w-5 h-5 mr-2 text-cyan-400" />
                      County Management
                    </CardTitle>
                    <CardDescription
</> className="text-slate-300">
                      Configure county settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 text-sm">
                      Manage county configurations, assessment cycles, and administrative settings
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/data-import-dashboard">
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center"><>

                      <Database className="w-5 h-5 mr-2 text-cyan-400" />
                      Data Import Center
                    </CardTitle>
                    <CardDescription
</> className="text-slate-300">
                      Import CSV files and geo data from FTP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 text-sm">
                      Upload property data, manage FTP imports, and process geographic files
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center"><>

                    <Settings className="w-5 h-5 mr-2 text-cyan-400" />
                    System Configuration
                  </CardTitle>
                  <CardDescription
</> className="text-slate-300">
                    Platform-wide settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent><>

                  <p className="text-slate-400 text-sm mb-4">
                    Configure system-wide settings, user permissions, and integration parameters
                  </p>
                  <Button
</> variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Access Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
