import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { MoreVertical, Settings, Refresh, Download, Maximize2, 
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
  TrendingUp, TrendingDown, Minus
 } from '@mui/icons-material';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetData {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'trend';
  title: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  value?: number;
  change?: number;
  unit?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface DashboardWidgetProps {
  widget: WidgetData;
  onUpdate?: (widget: WidgetData) => void;
  onRemove?: (widgetId: string) => void;
  onRefresh?: (widgetId: string) => void;
}

const chartColors = {
  primary: "#3b82f6",
  secondary: "#10b981",
  tertiary: "#f59e0b",
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
};

export default function DashboardWidget({ 
  widget, 
  onUpdate, 
  onRemove, 
  onRefresh 
}: DashboardWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh(widget.id);
    }
  };

  const handleChartTypeChange = (newChartType: string) => {
    if (onUpdate) {
      onUpdate({ ...widget, chartType: newChartType as any });
    }
  };

  const renderChart = () => {
    if (!widget.data || widget.data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      );
    }

    const commonProps = {
      data: widget.data,
      width: '100%',
      height: 200,
    };

    switch (widget.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={widget.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={widget.color || chartColors.primary} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={widget.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={widget.color || chartColors.primary}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={widget.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={widget.color || chartColors.primary}
                fill={widget.color || chartColors.primary}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={widget.data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill={widget.color || chartColors.primary}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {widget.data.map((entry /* , index */) => (<>

                  <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip
</>

/>
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return renderChart();
    }
  };

  const renderMetric = () => {
    const changeIcon = widget.change && widget.change > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      widget.change && widget.change < 0 ? 
      <TrendingDown className="h-4 w-4 text-red-600" /> :
      <Minus className="h-4 w-4 text-gray-400" />;

    return (
      <div className="text-center p-6">
        <div className="text-3xl font-bold mb-2">
          {widget.value?.toLocaleString()}{widget.unit}
        </div>
        {widget.change !== undefined && (
          <div className="flex items-center justify-center gap-2 text-sm">
            {changeIcon}
            <span className={`${
              widget.change > 0 ? 'text-green-600' : 
              widget.change < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {Math.abs(widget.change)}% from last period
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderTrend = () => {
    if (!widget.data || widget.data.length === 0) {
      return <div className="text-center text-gray-500 p-6">No trend data</div>;
    }

    return (
      <div className="p-4">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={widget.data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={widget.color || chartColors.primary}
              strokeWidth={2}
              dot={false}
            />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTable = () => {
    if (!widget.data || widget.data.length === 0) {
      return <div className="text-center text-gray-500 p-6">No table data</div>;
    }

    const headers = Object.keys(widget.data[0] || {});

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {headers.map((header) => (
                <th key={header} className="text-left p-2 font-medium">
                  {header.charAt(0).toUpperCase() + header.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {widget.data.slice(0, 5).map((row /* , index */) => (
              <tr key={index} className="border-b border-gray-100">
                {headers.map((header) => (
                  <td key={header} className="p-2">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'chart':
        return renderChart();
      case 'metric':
        return renderMetric();
      case 'trend':
        return renderTrend();
      case 'table':
        return renderTable();
      default:
        return <div className="p-6 text-center text-gray-500">Unknown widget type</div>;
    }
  };

  const getWidgetSize = () => {
    switch (widget.size) {
      case 'sm':
        return 'col-span-1 row-span-1';
      case 'lg':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  return (
    <Card className={`${getWidgetSize()} relative group`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        
        <div
</>

className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          ><>

            <Refresh className="h-4 w-4" />
          </Button>
          
          <DropdownMenu
</>

</>>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {widget.type === 'chart' && (
                  <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}><>

                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuSeparator
</>

/>
              )}
              <DropdownMenuItem><>

                <Maximize2 className="mr-2 h-4 w-4" />
                Expand
              </DropdownMenuItem>
              <DropdownMenuItem
</>

</>><>

                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator
</>

/>
              {onRemove && (
                <DropdownMenuItem 
                  onClick={() => onRemove(widget.id)}
                  className="text-red-600"
                >
                  Remove Widget
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {isEditing && widget.type === 'chart' && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2"><>

            <label className="text-sm font-medium">Chart Type:</label>
            <Select
</>

value={widget.chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger className="w-32"><>

                <SelectValue />
              </SelectTrigger>
              <SelectContent
</>

</>>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4" />
                    Line
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4" />
                    Area
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    Pie
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <CardContent className="pt-0">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
}

// Widget factory function for creating new widgets
export function createWidget(
  type: WidgetData['type'], 
  title: string, 
  data: any[] = [], 
  options: Partial<WidgetData> = {}
): WidgetData {
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    title,
    data,
    chartType: type === 'chart' ? 'bar' : undefined,
    size: 'md',
    color: chartColors.primary,
    ...options,
  };
}

// Predefined widget templates
export const widgetTemplates = {
  auditVolume: () => createWidget('chart', 'Audit Volume', [], { chartType: 'line' }),
  statusDistribution: () => createWidget('chart', 'Status Distribution', [], { chartType: 'pie' }),
  completionRate: () => createWidget('metric', 'Completion Rate', [], { unit: '%', value: 0 }),
  recentAudits: () => createWidget('table', 'Recent Audits', []),
  performanceTrend: () => createWidget('trend', 'Performance Trend', []),
};