/**
 * Event Visualizer Component for MCP Events
 * 
 * This component provides visual analytics for events captured by the EventBus system,
 * including charts, trends, and real-time statistics.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventBus, Event, EventCategory } from '@/lib/event-bus';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Warning, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, RefreshCcw  } from '@mui/icons-material';

// Component props
export interface MCPEventVisualizerProps {
  eventBus?: EventBus;
  className?: string;
  standalone?: boolean; // Controls whether the component should render its own Tabs wrapper
}

// Chart color scheme
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899'];
const CATEGORY_COLORS = {
  [EventCategory.CIRCUIT_BREAKER]: '#F59E0B',
  [EventCategory.AGENT_MESSAGE]: '#3B82F6',
  [EventCategory.WORKFLOW]: '#10B981',
  [EventCategory.SYSTEM]: '#6366F1',
  [EventCategory.ERROR]: '#EC4899',
  [EventCategory.DIAGNOSTIC]: '#8B5CF6'
};

// Time intervals for trend analysis
const TIME_INTERVALS = [
  { label: 'Last 5 minutes', value: 5 * 60 * 1000 },
  { label: 'Last 15 minutes', value: 15 * 60 * 1000 },
  { label: 'Last 30 minutes', value: 30 * 60 * 1000 },
  { label: 'Last 1 hour', value: 60 * 60 * 1000 },
  { label: 'Last 3 hours', value: 3 * 60 * 60 * 1000 },
  { label: 'Last 12 hours', value: 12 * 60 * 60 * 1000 },
  { label: 'Last 24 hours', value: 24 * 60 * 60 * 1000 }
];

/**
 * The main event visualizer component
 */
export function MCPEventVisualizer({ 
  eventBus = new EventBus({ persistEvents: true }), 
  className,
  standalone = true // By default, this component is self-contained with its own Tabs
}: MCPEventVisualizerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeChartType, setActiveChartType] = useState('distribution');
  const [selectedTimeInterval, setSelectedTimeInterval] = useState(TIME_INTERVALS[1].value);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load events on component mount
  useEffect(() => {
    const loadedEvents = eventBus.getPersistedEvents();
    setEvents(loadedEvents);
    
    // Subscribe to new events
    const unsubscribe = eventBus.subscribe((event) => {
      setEvents(prevEvents => [...prevEvents, event]);
    });
    
    return () => {
      unsubscribe();
    };
  }, [eventBus]);
  
  // Filter events based on time interval
  const filteredEvents = useMemo(() => {
    const cutoffTime = Date.now() - selectedTimeInterval;
    return events.filter(event => event.timestamp >= cutoffTime);
  }, [events, selectedTimeInterval]);
  
  // Prepare data for category distribution chart
  const categoryDistributionData = useMemo(() => {
    const categories: Record<string, number> = {};
    
    filteredEvents.forEach(event => {
      const category = event.category;
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([category, value]) => ({
        name: getCategoryLabel(category),
        value,
        color: CATEGORY_COLORS[category as EventCategory] || COLORS[0]
      }));
  }, [filteredEvents]);
  
  // Prepare data for circuit breaker state distribution
  const stateDistributionData = useMemo(() => {
    const states: Record<string, number> = {};
    
    filteredEvents
      .filter(event => event.category === EventCategory.CIRCUIT_BREAKER)
      .forEach(event => {
        const state = event.data.state || 'unknown';
        states[state] = (states[state] || 0) + 1;
      });
    
    return Object.entries(states)
      .map(([state, value]) => {
        let color = '#6366F1';
        
        if (state === 'open') color = '#EC4899';
        else if (state === 'closed') color = '#10B981';
        else if (state === 'half-open') color = '#F59E0B';
        
        return { name: state.charAt(0).toUpperCase() + state.slice(1), value, color };
      });
  }, [filteredEvents]);
  
  // Prepare data for time-based trend chart
  const timeTrendData = useMemo(() => {
    // Group events into time buckets
    const buckets: Record<string, Record<string, number>> = {};
    const bucketSize = Math.max(Math.floor(selectedTimeInterval / 20), 60000); // At least 1 minute buckets
    
    filteredEvents.forEach(event => {
      const bucketTime = Math.floor(event.timestamp / bucketSize) * bucketSize;
      const timeString = new Date(bucketTime).toLocaleTimeString();
      const category = event.category;
      
      if (!buckets[timeString]) {
        buckets[timeString] = {};
      }
      
      buckets[timeString][category] = (buckets[timeString][category] || 0) + 1;
    });
    
    // Convert buckets to array format for chart
    return Object.entries(buckets)
      .map(([time, categories]) => ({
        time,
        ...categories,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredEvents, selectedTimeInterval]);
  
  // Prepare data for service activity chart
  const serviceActivityData = useMemo(() => {
    const services: Record<string, number> = {};
    
    filteredEvents.forEach(event => {
      let serviceName = '';
      
      // Extract service name based on event type
      if (event.data.service) {
        serviceName = event.data.service;
      } else if (event.data.agent) {
        serviceName = event.data.agent;
      } else if (event.data.component) {
        serviceName = event.data.component;
      } else if (event.data.workflow) {
        serviceName = event.data.workflow;
      }
      
      if (serviceName) {
        services[serviceName] = (services[serviceName] || 0) + 1;
      }
    });
    
    return Object.entries(services)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredEvents]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate refresh delay
    setTimeout(() => {
      const refreshedEvents = eventBus.getPersistedEvents();
      setEvents(refreshedEvents);
      setIsRefreshing(false);
    }, 500);
  };
  
  // Helper function to get category label
  function getCategoryLabel(type: string) {
    // Convert "SNAKE_CASE" to "Snake Case"
    const words = type.split('_');
    return words.map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };
  
  // Chart content for Distribution view
  const renderDistributionChart = () => (
    <>
      {categoryDistributionData.length > 0 ? (
        <motion.div 
          key="distribution"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="h-[300px]"><>

            <h3 className="text-sm font-medium mb-2">Events by Category</h3>
            <ResponsiveContainer
</> width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryDistributionData.map((entry /* , index */) => (<>

                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
</> formatter={(value) => [`${value} events`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">Circuit Breaker States</h3>
            {stateDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stateDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stateDistributionData.map((entry /* , index */) => (<>

                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
</> formatter={(value) => [`${value} events`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Alert>
                  <Warning className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    No circuit breaker events in the selected time range
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="distribution-empty"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="h-[300px] flex items-center justify-center"
        >
          <Alert>
            <Warning className="h-4 w-4 mr-2" />
            <AlertDescription>
              No events in the selected time range
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </>
  );

  // Chart content for Timeline view
  const renderTimelineChart = () => (
    <motion.div
      key="timeline"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="h-[300px]">
        <h3 className="text-sm font-medium mb-2">Event Activity Over Time</h3>
        {timeTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeTrendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.values(EventCategory).map((category /* , index */) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={getCategoryLabel(category)}
                  stroke={CATEGORY_COLORS[category] || COLORS[index % COLORS.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Alert>
              <Warning className="h-4 w-4 mr-2" />
              <AlertDescription>
                No events in the selected time range
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Chart content for Services view
  const renderServicesChart = () => (
    <motion.div
      key="services"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="h-[300px]">
        <h3 className="text-sm font-medium mb-2">Service Activity</h3>
        {serviceActivityData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={serviceActivityData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar 
                dataKey="value" 
                name="Events" 
                fill="#3B82F6"
                label={{ position: 'right' }}
                animationDuration={500}
              >
                {serviceActivityData.map((entry /* , index */) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Alert>
              <Warning className="h-4 w-4 mr-2" />
              <AlertDescription>
                No service activity in the selected time range
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Render the appropriate chart based on active tab
  const renderActiveChart = () => {
    switch (activeChartType) {
      case 'distribution':
        return renderDistributionChart();
      case 'timeline':
        return renderTimelineChart();
      case 'services':
        return renderServicesChart();
      default:
        return null;
    }
  };

  // Controls UI shared between both rendering modes
  const renderControls = () => (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedTimeInterval.toString()} 
        onValueChange={(value) => setSelectedTimeInterval(parseInt(value))}
      >
        <SelectTrigger className="w-[180px]"><>

          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent
</>>
          {TIME_INTERVALS.map((interval) => (
            <SelectItem key={interval.value} value={interval.value.toString()}>
              {interval.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </motion.div>
    </div>
  );

  if (standalone) {
    // Standalone mode with Tabs wrapper
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-4">
          <Tabs value={activeChartType} onValueChange={setActiveChartType} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="distribution"><>

                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Category Distribution
                </TabsTrigger>
                <TabsTrigger
</> value="timeline"><>

                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Event Timeline
                </TabsTrigger>
                <TabsTrigger
</> value="services">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Service Activity
                </TabsTrigger>
              </TabsList>
              {renderControls()}
            </div><>

            
            <TabsContent value="distribution">
              {renderDistributionChart()}
            </TabsContent>
            
            <TabsContent
</> value="timeline">
              {renderTimelineChart()}
            </TabsContent>
            
            <TabsContent value="services">
              {renderServicesChart()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  } else {
    // Non-standalone mode (for use within another Tabs component)
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-4">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeChartType === 'distribution' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveChartType('distribution')}
                  className="flex items-center gap-1"
                >
                  <PieChartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Distribution</span>
                </Button>
                
                <Button 
                  variant={activeChartType === 'timeline' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveChartType('timeline')}
                  className="flex items-center gap-1"
                >
                  <LineChartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </Button>
                
                <Button 
                  variant={activeChartType === 'services' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setActiveChartType('services')}
                  className="flex items-center gap-1"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Services</span>
                </Button>
              </div>
              
              {renderControls()}
            </div>
            
            <div className="mt-4">
              {renderActiveChart()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}