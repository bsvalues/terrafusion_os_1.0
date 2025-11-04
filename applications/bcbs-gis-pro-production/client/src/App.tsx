import React from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import BentonCountyDashboard from './pages/BentonCountyDashboard';
import TerraFusionWorkflow from './pages/TerraFusionWorkflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Bot, BarChart3, Building  } from '@mui/icons-material';

const Navigation = () => {
  const [location] = useLocation();
  
  const navItems = [
    { path: '/', label: 'Benton County Dashboard', icon: Building },
    { path: '/workflow', label: 'AI Workflow Assistant', icon: Bot },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Terrafusion Benton County, Washington</h1>
          </div>
          <nav className="flex gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <Button 
                  variant={location === path ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </CardContent>
    </Card>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <Navigation />
        
        <Switch>
          <Route path="/" component={BentonCountyDashboard} />
          <Route path="/workflow" component={TerraFusionWorkflow} />
          <Route>
            <div className="text-center py-12"><>

              <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
              <Link
</>

href="/">
                <Button>Return to Benton County Dashboard</Button>
              </Link>
            </div>
          </Route>
        </Switch>
      </div>
    </div>
  );
};

export default App;