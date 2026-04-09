import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronRight, 
  RefreshCw, 
  BarChart2, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  HelpCircle, 
  Activity,
  Clock,
  AlertTriangle,
  Bell,
  Calendar,
  Filter,
  FileDown,
  FileText,
  Download,
  Printer
} from 'lucide-react';
import AnimatedLineChart, { DataPoint } from './AnimatedLineChart';
import AnimatedPieChart, { PieDataPoint } from './AnimatedPieChart';
import AnimatedBarChart, { BarDataPoint } from './AnimatedBarChart';
import { Badge } from '@/components/ui/badge';
import { 
  getPerformanceData, 
  getResourceUsageData, 
  getSystemMetricsData, 
  getWeeklyTrafficData,
  getAnomalyData,
  generateInsights 
} from '@/services/visualizationService';
import { 
  exportElementToPDF, 
  generateComprehensiveReport,
  exportToExcel,
  exportToCSV,
  exportVisualizationData
} from '@/services/exportService';

interface DashboardVisualizationsProps {
  className?: string;
}

const DashboardVisualizations: React.FC<DashboardVisualizationsProps> = ({ className = '' }) => {
  // Data states
  const [performanceData, setPerformanceData] = useState<DataPoint[]>([]);
  const [resourceData, setResourceData] = useState<PieDataPoint[]>([]);
  const [metricsData, setMetricsData] = useState<BarDataPoint[]>([]);
  const [trafficData, setTrafficData] = useState<DataPoint[]>([]);
  const [anomalyData, setAnomalyData] = useState<DataPoint[]>([]);
  
  // UI states
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [focusedInsight, setFocusedInsight] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Refs for sections we want to export
  const dashboardRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const anomaliesRef = useRef<HTMLDivElement>(null);
  
  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);
  
  // Load data from our service
  const loadAllData = () => {
    setPerformanceData(getPerformanceData());
    setResourceData(getResourceUsageData());
    setMetricsData(getSystemMetricsData());
    setTrafficData(getWeeklyTrafficData());
    setAnomalyData(getAnomalyData());
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  // Filter data based on category if selected
  const getFilteredMetricsData = () => {
    if (!selectedCategory) return metricsData;
    return metricsData.filter(item => item.category === selectedCategory);
  };
  
  // Event handlers
  const handleBarClick = (_item: BarDataPoint, index: number) => {
    setSelectedBarIndex(index === selectedBarIndex ? null : index);
    
    // If clicking on a bar, also set the category filter
    if (index !== selectedBarIndex) {
      setSelectedCategory(_item.category || null);
    } else {
      setSelectedCategory(null);
    }
  };
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate a refresh with slight delay for visual feedback
    setTimeout(() => {
      loadAllData();
      setIsRefreshing(false);
    }, 800);
  };
  
  const handleInsightFocus = (insight: string) => {
    setFocusedInsight(insight === focusedInsight ? null : insight);
  };
  
  const handleViewModeChange = (mode: 'daily' | 'weekly' | 'monthly') => {
    setViewMode(mode);
    
    // In a real app, we'd fetch new data based on the timeframe
    // For now, just simulate different data sets
    if (mode === 'daily') {
      setPerformanceData(getAnomalyData());
    } else if (mode === 'weekly') {
      setPerformanceData(getWeeklyTrafficData());
    } else {
      setPerformanceData(getPerformanceData());
    }
  };
  
  // Export current view to PDF
  const handleExportToPDF = (element: HTMLElement | null, filename: string) => {
    if (!element) return;
    
    setIsExporting(true);
    
    exportElementToPDF(element, filename)
      .then(() => {
        console.log(`Exported ${filename} successfully`);
      })
      .catch(error => {
        console.error('Error exporting to PDF:', error);
      })
      .finally(() => {
        setIsExporting(false);
      });
  };
  
  // Export data in various formats
  const handleExportData = async (
    data: Array<any>, 
    type: 'pdf' | 'excel' | 'csv', 
    title: string, 
    element?: HTMLElement
  ) => {
    setIsExporting(true);
    
    try {
      await exportVisualizationData(data, type, title, element);
      console.log(`Exported ${title} as ${type} successfully`);
    } catch (error) {
      console.error(`Error exporting to ${type}:`, error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Generate comprehensive report with all data
  const handleGenerateReport = () => {
    setIsExporting(true);
    
    generateComprehensiveReport(
      performanceData,
      resourceData,
      metricsData,
      anomalyData,
      `system-performance-report-${new Date().toISOString().split('T')[0]}`
    )
      .then(() => {
        console.log('Comprehensive report generated successfully');
      })
      .catch(error => {
        console.error('Error generating report:', error);
      })
      .finally(() => {
        setIsExporting(false);
      });
  };
  
  // Generate insights based on current data
  const performanceInsights = generateInsights(performanceData, activeTab === 'anomalies' ? 'anomaly' : 'performance');
  const trafficInsights = generateInsights(trafficData, 'traffic');
  
  return (
    <motion.div 
      ref={dashboardRef}
      className={`space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between">
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-900">Data Storytelling</h2>
          <p className="text-gray-600">Interactive visualizations that reveal system patterns</p>
        </motion.div>
        
        <motion.div 
          className="flex space-x-2"
          variants={itemVariants}
        >
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
          <Button 
            variant={isRefreshing ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4"
          >
            <h3 className="font-semibold text-blue-800 mb-2">Interactive Data Exploration Guide:</h3>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>Click on any data point to see detailed information</li>
              <li>Toggle between daily, weekly, and monthly views for different perspectives</li>
              <li>Click on insights to emphasize the related data patterns</li>
              <li>Filter metrics by category to focus on specific areas</li>
              <li>Anomaly detection automatically highlights unusual patterns</li>
              <li>Use the refresh button to update all visualizations with latest data</li>
            </ul>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setShowHelp(false)} 
              className="text-blue-600 mt-2 p-0"
            >
              Hide Guide
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div variants={itemVariants} className="bg-white border rounded-lg p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <span className="font-medium">View Mode:</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'daily' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleViewModeChange('daily')}
          >
            Daily
          </Button>
          <Button 
            variant={viewMode === 'weekly' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleViewModeChange('weekly')}
          >
            Weekly
          </Button>
          <Button 
            variant={viewMode === 'monthly' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleViewModeChange('monthly')}
          >
            Monthly
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {selectedCategory && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {selectedCategory}
              <button onClick={() => setSelectedCategory(null)} className="ml-1">×</button>
            </Badge>
          )}
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString()} • Live data
          </span>
        </div>
      </motion.div>
      
      <Tabs 
        defaultValue="performance" 
        className="space-y-4"
        onValueChange={(value) => setActiveTab(value)}
      >
        <motion.div variants={itemVariants}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              <span>Resources</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span>Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Anomalies</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>
        
        <TabsContent value="performance" className="space-y-4" ref={performanceRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div variants={itemVariants} className="md:col-span-2">
              <Card>
                <CardHeader className="card-header">
                  <CardTitle className="high-contrast-text flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    System Performance Trends
                  </CardTitle>
                  <CardDescription className="secondary-text">
                    {viewMode === 'monthly' ? 'Monthly' : viewMode === 'weekly' ? 'Weekly' : 'Daily'} performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 py-6 bg-white">
                  <AnimatedLineChart 
                    data={performanceData}
                    title={viewMode === 'daily' ? 'Hourly Request Volume' : 'Response Time (ms)'}
                    description={viewMode === 'daily' 
                      ? 'Request volume throughout the day' 
                      : viewMode === 'weekly' 
                        ? 'Weekly traffic patterns' 
                        : 'Response time trends over 9 months'
                    }
                    color="#3b82f6"
                    isAnimating={true}
                    withGradient={true}
                    height={320}
                    showControls={true}
                  />
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="card-header">
                  <CardTitle className="high-contrast-text flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Key Insights
                  </CardTitle>
                  <CardDescription className="secondary-text">
                    Automated analysis of performance data
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-5 py-4 bg-white">
                  <div className="space-y-3">
                    {performanceInsights.map((insight, index) => (
                      <motion.div 
                        key={index}
                        className={`p-3 rounded-md border cursor-pointer transition-colors ${
                          focusedInsight === insight 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-gray-50 border-gray-200 hover:bg-blue-50'
                        }`}
                        onClick={() => handleInsightFocus(insight)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <p className="text-sm font-medium text-gray-800">{insight}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="card-footer justify-between">
                  <span className="text-xs text-gray-500">Click on an insight to explore</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                      onClick={() => handleExportData(performanceData, 'pdf', 'performance-insights', performanceRef.current || undefined)}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {isExporting ? 'Exporting...' : 'PDF'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                      onClick={() => handleExportData(performanceData, 'excel', 'performance-data')}
                      disabled={isExporting}
                    >
                      <FileDown className="h-3 w-3" />
                      Excel
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                      onClick={() => handleExportData(performanceData, 'csv', 'performance-data')}
                      disabled={isExporting}
                    >
                      <Download className="h-3 w-3" />
                      CSV
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
          
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="card-header">
                <CardTitle className="high-contrast-text flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Weekly Traffic Patterns
                </CardTitle>
                <CardDescription className="secondary-text">Weekly traffic analysis by day</CardDescription>
              </CardHeader>
              <CardContent className="px-5 py-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <AnimatedLineChart 
                      data={trafficData}
                      title="Daily Request Volume"
                      description="Request patterns throughout the week"
                      color="#8b5cf6"
                      isAnimating={true}
                      withGradient={true}
                      height={250}
                      showControls={false}
                    />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Weekly Patterns</h3>
                    {trafficInsights.map((insight, index) => (
                      <div 
                        key={index}
                        className="p-3 rounded-md bg-purple-50 border border-purple-200"
                      >
                        <p className="text-sm text-purple-800">{insight}</p>
                      </div>
                    ))}
                    <div className="p-3 border border-dashed border-purple-300 rounded-md mt-4">
                      <h4 className="font-medium text-sm text-purple-800">Suggested Actions</h4>
                      <ul className="mt-2 text-xs text-purple-700 space-y-1">
                        <li>• Scale resources for midweek traffic peaks</li>
                        <li>• Schedule maintenance during weekend lows</li>
                        <li>• Investigate Monday morning traffic spikes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4" ref={resourcesRef}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="card-header">
                <CardTitle className="high-contrast-text">Resource Distribution</CardTitle>
                <CardDescription className="secondary-text">Current allocation of system resources</CardDescription>
              </CardHeader>
              <CardContent className="px-5 py-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <AnimatedPieChart 
                    data={resourceData}
                    title="Resource Allocation"
                    description="Distribution of resources across system components"
                    isAnimating={true}
                    height={350}
                    showLabels={true}
                    showInsights={true}
                    innerRadius={60}
                    outerRadius={120}
                  />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Resource Efficiency Analysis</h3>
                    
                    {resourceData.map((resource, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div 
                          className="h-10 w-10 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: resource.color || '#3b82f6' }}
                        >
                          <span className="text-white font-bold">{resource.value}%</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{resource.name}</h4>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <motion.div 
                              className="h-2 rounded-full" 
                              style={{ backgroundColor: resource.color || '#3b82f6' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${resource.value}%` }}
                              transition={{ duration: 1, delay: idx * 0.1 }}
                            />
                          </div>
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {resource.value > 30 ? 'Optimal' : resource.value > 15 ? 'Adequate' : 'Low Usage'}
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-3 border border-blue-200 bg-blue-50 rounded-md mt-6">
                      <h4 className="font-medium text-blue-800">Optimization Opportunities</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Based on current resource allocation, consider rebalancing API Processing (32%) 
                        and Background Tasks (9%) for better overall performance.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="card-footer">
                <div className="flex items-center justify-between w-full">
                  <Badge variant="outline" className="text-blue-700 bg-blue-50">Updated: Today at {new Date().toLocaleTimeString()}</Badge>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                        onClick={() => handleExportData(resourceData, 'pdf', 'resource-allocation', resourcesRef.current || undefined)}
                        disabled={isExporting}
                      >
                        {isExporting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        {isExporting ? 'Exporting...' : 'PDF'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                        onClick={() => handleExportData(resourceData, 'excel', 'resource-allocation')}
                        disabled={isExporting}
                      >
                        <FileDown className="h-3 w-3" />
                        Excel
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                        onClick={() => handleExportData(resourceData, 'csv', 'resource-allocation')}
                        disabled={isExporting}
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </Button>
                    </div>
                    <Button variant="outline" className="gap-1 text-blue-700">
                      <RefreshCw className="h-4 w-4" />
                      Analyze Optimization Options
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4" ref={metricsRef}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="high-contrast-text">System Metrics Comparison</CardTitle>
                    <CardDescription className="secondary-text">
                      Current metrics compared to previous period
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {['performance', 'resource', 'engagement', 'reliability'].map(category => (
                      <Badge 
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        className={`cursor-pointer ${selectedCategory === category ? 'bg-blue-600' : 'hover:bg-blue-50'}`}
                        onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-6 bg-white">
                <AnimatedBarChart 
                  data={getFilteredMetricsData()}
                  title="Current vs. Previous Period"
                  description="Click on bars to explore specific metrics"
                  isAnimating={true}
                  color="#3b82f6"
                  comparisonColor="#93c5fd"
                  height={360}
                  showAverage={true}
                  showInsights={true}
                  onBarClick={handleBarClick}
                  highlightedIndex={selectedBarIndex}
                />
              </CardContent>
              <CardFooter className="card-footer bg-blue-50 rounded-b-lg">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-800 mb-2">Performance Summary</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                        onClick={() => handleExportData(metricsData, 'pdf', 'system-metrics', metricsRef.current || undefined)}
                        disabled={isExporting}
                      >
                        {isExporting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        {isExporting ? 'Exporting...' : 'PDF'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                        onClick={() => handleExportData(metricsData, 'excel', 'system-metrics')}
                        disabled={isExporting}
                      >
                        <FileDown className="h-3 w-3" />
                        Excel
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                        onClick={() => handleExportData(metricsData, 'csv', 'system-metrics')}
                        disabled={isExporting}
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 bg-white rounded-md border border-blue-200">
                      <div className="text-xs text-gray-500 mb-1">Improved</div>
                      <div className="text-2xl font-bold text-green-600">4</div>
                      <div className="text-xs text-gray-500">metrics</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-md border border-blue-200">
                      <div className="text-xs text-gray-500 mb-1">Unchanged</div>
                      <div className="text-2xl font-bold text-blue-600">1</div>
                      <div className="text-xs text-gray-500">metrics</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-md border border-blue-200">
                      <div className="text-xs text-gray-500 mb-1">Declined</div>
                      <div className="text-2xl font-bold text-amber-600">1</div>
                      <div className="text-xs text-gray-500">metrics</div>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="anomalies" className="space-y-4" ref={anomaliesRef}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="card-header">
                <CardTitle className="high-contrast-text flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Anomaly Detection
                </CardTitle>
                <CardDescription className="secondary-text">
                  Automated detection of unusual system behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 py-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <AnimatedLineChart 
                      data={anomalyData}
                      title="24-Hour System Activity"
                      description="Request volume with anomaly detection"
                      color="#f59e0b"
                      isAnimating={true}
                      withGradient={true}
                      height={280}
                      showControls={true}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <h3 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Detected Anomalies
                      </h3>
                      <p className="text-sm text-amber-700">
                        3 anomalies detected in the last 24 hours that deviate significantly from normal patterns.
                      </p>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      {[
                        { time: '10:00', description: 'Morning traffic spike', severity: 'medium' },
                        { time: '15:00', description: 'Afternoon system issue', severity: 'high' },
                        { time: '02:00', description: 'Suspicious night activity', severity: 'high' }
                      ].map((anomaly, idx) => (
                        <motion.div 
                          key={idx}
                          className={`p-3 rounded-md border flex items-start gap-3 ${
                            anomaly.severity === 'high' 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-amber-50 border-amber-200'
                          }`}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.2 }}
                        >
                          <div className={`h-5 w-5 rounded-full flex-shrink-0 mt-0.5 ${
                            anomaly.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          <div>
                            <h4 className={`font-medium ${
                              anomaly.severity === 'high' ? 'text-red-800' : 'text-amber-800'
                            }`}>
                              {anomaly.time}
                            </h4>
                            <p className="text-sm text-gray-600">{anomaly.description}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`ml-auto ${
                              anomaly.severity === 'high' 
                                ? 'border-red-300 text-red-700' 
                                : 'border-amber-300 text-amber-700'
                            }`}
                          >
                            {anomaly.severity}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    
                    <Button variant="outline" className="w-full mt-4 text-amber-700 border-amber-200 hover:bg-amber-50">
                      Investigate All Anomalies
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="card-footer justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-gray-600">Anomaly detection refreshes every 15 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                      onClick={() => handleExportData(anomalyData, 'pdf', 'anomaly-detection', anomaliesRef.current || undefined)}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {isExporting ? 'Exporting...' : 'PDF'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                      onClick={() => handleExportData(anomalyData, 'excel', 'anomaly-detection')}
                      disabled={isExporting}
                    >
                      <FileDown className="h-3 w-3" />
                      Excel
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium p-0 flex items-center gap-1"
                      onClick={() => handleExportData(anomalyData, 'csv', 'anomaly-detection')}
                      disabled={isExporting}
                    >
                      <Download className="h-3 w-3" />
                      CSV
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Configure Alerts
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      
      <motion.div variants={itemVariants} className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-blue-600 hover:text-blue-800 font-medium gap-1"
          onClick={() => handleGenerateReport()}
          disabled={isExporting}
        >
          {isExporting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {isExporting ? 'Generating PDF...' : 'Export All Data Analysis'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default DashboardVisualizations;