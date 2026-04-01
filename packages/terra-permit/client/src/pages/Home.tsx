import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast, toast } from '@/hooks/use-toast';
import { Activity, Server, Clock, Bell, BarChart2, Settings, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { DashboardVisualizations } from '@/components/visualizations';
import Welcome from '@/components/welcome/Welcome';
import { ContextualTooltip } from '@/components/ui/contextual-tooltip';
import { FeatureSpotlight } from '@/components/tour/FeatureSpotlight';
import { ContextualHelp } from '@/components/help/ContextualHelp';
import { helpContent } from '@/data/helpContent';
import { TourType, useTour } from '@/contexts/TourContext';
import PermitManager from '@/components/PermitManager';
import { UploadResult } from '@/types';
import { queryClient } from '@/lib/queryClient';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { startTour } = useTour();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  
  // Start the tour manually if needed
  const startDashboardTour = () => {
    startTour(TourType.DASHBOARD);
  };
  
  // Handle upload completion
  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);
    
    // Show a success message
    toast({
      title: "Upload Complete",
      description: `Successfully processed ${result.summary.totalCount} permits (${result.summary.enterCount} to enter, ${result.summary.skipCount} to skip)`,
      variant: "default"
    });
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
  };
  
  const stats = [
    {
      title: 'System Status',
      value: 'Healthy',
      description: 'All systems operational',
      icon: Server,
      color: 'text-green-500',
      link: '/status',
    },
    {
      title: 'Active Workflows',
      value: '12',
      description: '3 pending approval',
      icon: Activity,
      color: 'text-blue-500',
      link: '/workflows',
    },
    {
      title: 'Recent Alerts',
      value: '5',
      description: '2 require attention',
      icon: Bell,
      color: 'text-amber-500',
      link: '/alerts',
    },
    {
      title: 'Uptime',
      value: '99.9%',
      description: 'Last 30 days',
      icon: Clock,
      color: 'text-indigo-500',
      link: '/analytics',
    },
  ];
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Welcome component for first-time users */}
      <Welcome />
      
      {/* Contextual help for the dashboard */}
      <ContextualHelp 
        context="dashboard" 
        position="bottom-right" 
        items={helpContent.dashboard}
        maxItems={3}
        showInitially={true}
      />
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex justify-between items-center"
        data-tour="dashboard-header"
      >
        <div>
          <motion.h1 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="page-title"
          >
            Dashboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="page-subtitle mt-1"
          >
            Welcome back, {user?.displayName || user?.username || 'User'}
          </motion.p>
        </div>
        <div className="flex gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ContextualTooltip
              content="Get help with dashboard features"
              side="bottom"
              asSpan={true}
            >
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white border-blue-200 text-blue-700" 
                onClick={startDashboardTour}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </ContextualTooltip>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="btn-trustworthy flex items-center gap-2 px-4" data-tour="dashboard-filters">
              <Settings className="h-4 w-4" />
              Configure Dashboard
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-summary">
        {stats.map((stat, index) => {
          if (index === 0) {
            return (
              <FeatureSpotlight
                key={index}
                id="system-status-spotlight"
                title="System Status"
                description="Monitor system health and performance metrics at a glance"
                position="bottom"
                showOnce={true}
                delay={3000}
                width={300}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <Card className="stat-card">
                    <CardHeader className="card-header flex flex-row items-center justify-between">
                      <CardTitle className="high-contrast-text">{stat.title}</CardTitle>
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                      >
                        <stat.icon className={`h-6 w-6 text-blue-600`} />
                      </motion.div>
                    </CardHeader>
                    <CardContent className="pt-6 px-5 bg-white">
                      <motion.div 
                        className="stat-value"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        {stat.value}
                      </motion.div>
                      <p className="secondary-text mt-2">{stat.description}</p>
                    </CardContent>
                    <CardFooter className="card-footer">
                      <Link href={stat.link} className="text-sm font-bold text-blue-700 hover:text-blue-800 hover:underline transition-colors">
                        View details
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              </FeatureSpotlight>
            );
          } else {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                }}
              >
                <Card className="stat-card">
                  <CardHeader className="card-header flex flex-row items-center justify-between">
                    <CardTitle className="high-contrast-text">{stat.title}</CardTitle>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                    >
                      <stat.icon className={`h-6 w-6 text-blue-600`} />
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6 px-5 bg-white">
                    <motion.div 
                      className="stat-value"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      {stat.value}
                    </motion.div>
                    <p className="secondary-text mt-2">{stat.description}</p>
                  </CardContent>
                  <CardFooter className="card-footer">
                    <Link href={stat.link} className="text-sm font-bold text-blue-700 hover:text-blue-800 hover:underline transition-colors">
                      View details
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          }
        })}
      </div>
      
      {/* Permit Manager Tab Interface */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8"
        data-tour="permit-manager"
      >
        <PermitManager onUploadComplete={handleUploadComplete} />
      </motion.div>
      
      {/* Animated Data Storytelling Visualizations */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-8"
        data-tour="dashboard-charts"
      >
        <DashboardVisualizations />
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <Card className="card" data-tour="dashboard-recent">
            <CardHeader className="card-header">
              <CardTitle className="high-contrast-text text-lg">Recent Events</CardTitle>
              <CardDescription className="secondary-text">Latest system events and notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-5 bg-white">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div 
                    key={i} 
                    className={`flex items-start gap-4 pb-4 mb-2 ${i % 2 === 0 ? 'bg-blue-50 bg-opacity-30 p-3 rounded-md' : ''} border-b last:border-b-0`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + i * 0.1 }}
                  >
                    <motion.div 
                      className={`mt-1 h-4 w-4 rounded-full ${i % 3 === 0 ? 'bg-amber-500' : i % 2 === 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.4 + i * 0.1, type: "spring" }}
                    />
                    <div className={i % 3 === 0 ? 'authority-accent' : ''}>
                      <h4 className="high-contrast-text font-medium">
                        {i % 3 === 0 ? 'Warning' : i % 2 === 0 ? 'Success' : 'Info'}: System {i % 2 === 0 ? 'update completed' : 'alert triggered'}
                      </h4>
                      <p className="secondary-text mt-1">
                        {new Date(Date.now() - i * 3600000).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="card-footer">
              <motion.div 
                className="w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" className="w-full font-medium text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300">View All Events</Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.3 }}
        >
          <Card className="card" data-tour="system-actions">
            <CardHeader className="card-header">
              <CardTitle className="high-contrast-text text-lg">System Actions</CardTitle>
              <CardDescription className="secondary-text">Quick actions and system controls</CardDescription>
            </CardHeader>
            <CardContent className="p-5 bg-white">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Run Diagnostics', icon: Activity, color: 'bg-blue-100 text-blue-700' },
                  { title: 'System Backup', icon: Server, color: 'bg-green-100 text-green-700' },
                  { title: 'Maintenance Mode', icon: Settings, color: 'bg-amber-100 text-amber-700' },
                  { title: 'Reset Alerts', icon: Bell, color: 'bg-red-100 text-red-700' }
                ].map((action, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer"
                  >
                    <div className={`p-4 rounded-lg ${action.color.split(' ')[0]} flex flex-col items-center justify-center text-center`}>
                      <action.icon className={`h-8 w-8 mb-2 ${action.color.split(' ')[1]}`} />
                      <p className="font-medium text-sm">{action.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="card-footer">
              <motion.div
                className="w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" className="w-full font-medium text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300">Advanced System Controls</Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;