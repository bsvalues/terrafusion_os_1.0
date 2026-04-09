import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { DataLineageRecord, getSourceLabel } from '@/lib/dataLineageService';

interface LineageSummaryProps {
  records: DataLineageRecord[];
  title?: string;
}

export function LineageSummary({ records, title = 'Data Lineage Summary' }: LineageSummaryProps) {
  // Group records by source to show distribution
  const sourceDistribution = React.useMemo(() => {
    const distribution: { [key: string]: number } = {};
    
    records.forEach(record => {
      if (!distribution[record.source]) {
        distribution[record.source] = 0;
      }
      distribution[record.source]++;
    });
    
    // Convert to array format for the chart
    return Object.entries(distribution).map(([source, count]) => ({
      source: getSourceLabel(source),
      count,
    }));
  }, [records]);
  
  // Group records by field name to show which fields change most often
  const fieldDistribution = React.useMemo(() => {
    const distribution: { [key: string]: number } = {};
    
    records.forEach(record => {
      if (!distribution[record.fieldName]) {
        distribution[record.fieldName] = 0;
      }
      distribution[record.fieldName]++;
    });
    
    // Convert to array format for the chart, limit to top 5 if needed
    return Object.entries(distribution)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);
  
  // Get the most recent change date
  const mostRecentChange = React.useMemo(() => {
    if (records.length === 0) return null;
    
    return new Date(
      Math.max(...records.map(record => new Date(record.changeTimestamp).getTime()))
    );
  }, [records]);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            Count: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Summary Statistics</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total Changes:</dt>
                <dd className="font-medium">{records.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Unique Fields Modified:</dt>
                <dd className="font-medium">{Object.keys(fieldDistribution).length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Most Recent Change:</dt>
                <dd className="font-medium">
                  {mostRecentChange ? mostRecentChange.toLocaleString() : 'N/A'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Source Types:</dt>
                <dd className="font-medium">{sourceDistribution.length}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Changes by Source</h3>
            {sourceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sourceDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="source" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="var(--primary)" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No data available
              </div>
            )}
          </div>
          
          <div className="sm:col-span-2">
            <h3 className="text-lg font-medium mb-4">Most Frequently Changed Fields</h3>
            {fieldDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fieldDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="field" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="var(--primary)" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}