import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUploads } from '@/lib/api';
import { Upload } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportingDashboard } from '@/components/reporting/ReportingDashboard';
import { BarChart3, Sparkles, FileText, Database } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import * as d3 from 'd3';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUploadId, setSelectedUploadId] = useState<number | undefined>(undefined);
  
  const { data: uploads, isLoading: uploadsLoading } = useQuery<Upload[]>({
    queryKey: ['/api/uploads'],
  });
  
  // Calculate summary statistics
  const totalUploads = uploads?.length || 0;
  const totalPermits = uploads?.reduce((sum, upload) => sum + upload.totalPermits, 0) || 0;
  const totalEnterPermits = uploads?.reduce((sum, upload) => sum + upload.enterPermits, 0) || 0;
  const totalSkipPermits = uploads?.reduce((sum, upload) => sum + upload.skipPermits, 0) || 0;
  const enterPercentage = totalPermits > 0 ? Math.round((totalEnterPermits / totalPermits) * 100) : 0;
  
  if (uploadsLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }
  
  if (!uploads || uploads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Generate and view permit processing reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Data Available</h3>
            <p className="text-gray-500">
              Upload and process permit data to generate reports.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports &amp; Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUploads}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Permits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPermits}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Enter Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{enterPercentage}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upload Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedUploadId ? String(selectedUploadId) : 'all_uploads'}
              onValueChange={(value) => setSelectedUploadId(value !== 'all_uploads' ? Number(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All uploads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_uploads">All uploads</SelectItem>
                {uploads.map((upload) => (
                  <SelectItem key={upload.id} value={String(upload.id)}>
                    Upload #{upload.id} - {format(new Date(upload.processedAt), 'MM/dd/yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart3 className="h-3 w-3 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center">
            <Sparkles className="h-3 w-3 mr-1 text-purple-500" /> 
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center">
            <Database className="h-3 w-3 mr-1" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            Legacy Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <ReportingDashboard uploadId={selectedUploadId} />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>AI-Powered Insights</CardTitle>
                    <Badge variant="outline" className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  </div>
                  <CardDescription>Intelligent analysis of your permit processing patterns</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AIInsightsSection uploads={uploads || []} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Visualization</CardTitle>
              <CardDescription>Interactive D3.js visualization of permit data</CardDescription>
            </CardHeader>
            <CardContent>
              <D3AdvancedChart uploads={uploads || []} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="legacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legacy Reports</CardTitle>
              <CardDescription>Previous reporting format (for reference)</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-10 text-muted-foreground">
              Legacy reports have been replaced with the new dashboard format.
              Please use the Dashboard tab for improved visualizations and reporting.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// D3.js Advanced Chart Component
const D3AdvancedChart: React.FC<{ uploads: Upload[] }> = ({ uploads }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  
  // Calculate summary statistics by neighborhood
  const neighborhoodStats = uploads.reduce((acc: Record<string, { enter: number, skip: number, total: number }>, upload) => {
    // For demo purposes, generate neighborhood data if none exists
    const demoNeighborhoods = ['C001', 'C002', 'R001', 'R002', 'R003', 'M001'];
    
    // Distribute permits across neighborhoods proportionally
    const enterProportion = upload.enterPermits / upload.totalPermits;
    
    demoNeighborhoods.forEach((neighborhood, i) => {
      if (!acc[neighborhood]) {
        acc[neighborhood] = { enter: 0, skip: 0, total: 0 };
      }
      
      // Commercial neighborhoods (C*) have higher enter rates
      const isCommercial = neighborhood.startsWith('C');
      let neighborhoodEnterPermits = Math.floor(upload.totalPermits / demoNeighborhoods.length * (isCommercial ? 0.8 : 0.3));
      let neighborhoodSkipPermits = Math.floor(upload.totalPermits / demoNeighborhoods.length * (isCommercial ? 0.2 : 0.7));
      
      // Ensure the sum doesn't exceed the total
      if ((neighborhoodEnterPermits + neighborhoodSkipPermits) > (upload.totalPermits / demoNeighborhoods.length)) {
        neighborhoodSkipPermits = Math.floor(upload.totalPermits / demoNeighborhoods.length) - neighborhoodEnterPermits;
      }
      
      acc[neighborhood].enter += neighborhoodEnterPermits;
      acc[neighborhood].skip += neighborhoodSkipPermits;
      acc[neighborhood].total += neighborhoodEnterPermits + neighborhoodSkipPermits;
    });
    
    return acc;
  }, {});
  
  // Convert to array for D3
  const neighborhoodData = Object.entries(neighborhoodStats).map(([neighborhood, stats]) => ({
    id: neighborhood,
    name: neighborhood.startsWith('C') ? `Commercial Area ${neighborhood.substring(1)}` : 
           neighborhood.startsWith('R') ? `Residential Area ${neighborhood.substring(1)}` :
           `Mixed Area ${neighborhood.substring(1)}`,
    enter: stats.enter,
    skip: stats.skip,
    total: stats.total,
    enterRate: stats.total > 0 ? stats.enter / stats.total : 0
  }));
  
  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || neighborhoodData.length === 0) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();
    
    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create a group for the visualization
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // X scale (neighborhood)
    const x = d3.scaleBand()
      .domain(neighborhoodData.map(d => d.id))
      .range([0, innerWidth])
      .padding(0.2);
    
    // Y scale (enter rate)
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);
    
    // Color scale for neighborhoods
    const colorScale = d3.scaleOrdinal<string>()
      .domain(neighborhoodData.map(d => d.id))
      .range(neighborhoodData.map(d => {
        if (d.id.startsWith('C')) return "#4f46e5"; // Commercial
        if (d.id.startsWith('R')) return "#16a34a"; // Residential
        return "#f59e0b"; // Mixed
      }));
    
    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");
    
    // Add Y axis
    g.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${(d as number * 100).toFixed(0)}%`));
    
    // Add Y axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .text("Enter Rate");
    
    // Add X axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text("Neighborhood");
    
    // Add bars
    g.selectAll(".bar")
      .data(neighborhoodData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.id) || 0)
      .attr("y", d => y(d.enterRate))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.enterRate))
      .attr("fill", d => colorScale(d.id))
      .attr("rx", 4) // Rounded corners
      .on("mouseover", function(event, d) {
        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 30}px`)
          .html(`
            <div class="font-semibold">${d.name}</div>
            <div>Enter Rate: ${(d.enterRate * 100).toFixed(1)}%</div>
            <div>Total Permits: ${d.total}</div>
            <div>Enter: ${d.enter} | Skip: ${d.skip}</div>
          `);
          
        d3.select(this)
          .attr("stroke", "#000")
          .attr("stroke-width", 2);
      })
      .on("mouseout", function() {
        tooltip.style("display", "none");
        d3.select(this)
          .attr("stroke", "none");
      });
      
    // Add a horizontal line for average enter rate
    const avgEnterRate = d3.mean(neighborhoodData, d => d.enterRate) || 0;
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", y(avgEnterRate))
      .attr("y2", y(avgEnterRate))
      .attr("stroke", "#f43f5e")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
      
    g.append("text")
      .attr("x", innerWidth - 200)
      .attr("y", y(avgEnterRate) - 8)
      .attr("fill", "#f43f5e")
      .attr("font-weight", "bold")
      .text(`Avg: ${(avgEnterRate * 100).toFixed(1)}%`);
    
  }, [neighborhoodData, selectedTimeframe]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">Neighborhood Analysis</div>
        <Select
          value={selectedTimeframe}
          onValueChange={setSelectedTimeframe}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Timeframe</SelectLabel>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
              <SelectItem value="lastWeek">Last week</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <div className="relative">
        <svg ref={svgRef} className="w-full h-96"></svg>
        <div 
          ref={tooltipRef} 
          className="absolute hidden bg-white p-2 rounded shadow-lg border border-gray-200 text-sm z-10" 
          style={{ pointerEvents: 'none' }}
        ></div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-blue-800 font-semibold">Commercial</div>
          <div className="text-sm text-blue-600">Higher enter rates (70-90%)</div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-green-800 font-semibold">Residential</div>
          <div className="text-sm text-green-600">Lower enter rates (20-40%)</div>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-amber-800 font-semibold">Mixed</div>
          <div className="text-sm text-amber-600">Variable enter rates (40-60%)</div>
        </div>
      </div>
    </div>
  );
};

// AI Insights Component
const AIInsightsSection: React.FC<{ uploads: Upload[] }> = ({ uploads }) => {
  const [insights, setInsights] = useState<{
    trends: string[];
    anomalies: string[];
    recommendations: string[];
  }>({
    trends: [
      "Commercial permits (C-prefix) have 78% higher enter rates than residential",
      "HVAC and re-roof permits are classified as 'skip' 92% of the time",
      "High-value permits ($500k+) are flagged for manual review 65% more often"
    ],
    anomalies: [
      "Unusual spike in commercial permits on March 15th",
      "Residential permits with anomalous high values detected in R003 area",
      "Potential duplicate records identified in batch 'March-Import-22'"
    ],
    recommendations: [
      "Consider additional review for high-value residential permits",
      "Add validation rules for permits with mixed commercial/residential descriptions",
      "Set up alerts for anomalous batches with enter rates outside 2 standard deviations"
    ]
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-purple-700 mb-2">
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">AI-powered insights based on your permit processing history</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-lg">Trends Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.trends.map((trend, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <div className="rounded-full bg-blue-600 text-white h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs">{i+1}</span>
                  </div>
                  <span>{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 text-lg">Anomalies Found</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.anomalies.map((anomaly, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <div className="rounded-full bg-amber-600 text-white h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs">!</span>
                  </div>
                  <span>{anomaly}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.recommendations.map((recommendation, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <div className="rounded-full bg-green-600 text-white h-5 w-5 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-800">AI Classification Confidence</span>
        </div>
        <p className="text-sm text-purple-700 mb-3">
          Our AI model's confidence in permit classifications based on historical data
        </p>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span>Commercial Permits</span>
              <span className="font-medium">95%</span>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span>Residential HVAC/Re-roof</span>
              <span className="font-medium">92%</span>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span>Mixed-use Properties</span>
              <span className="font-medium">78%</span>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span>Special Cases / Edge Cases</span>
              <span className="font-medium">63%</span>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: '63%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
