import { DataPoint } from '@/components/visualizations/AnimatedLineChart';
import { PieDataPoint } from '@/components/visualizations/AnimatedPieChart';
import { BarDataPoint } from '@/components/visualizations/AnimatedBarChart';

// This service would typically fetch data from API endpoints
// For now, we'll generate sample data with more realistic patterns

// Performance data with meaningful trends
export const getPerformanceData = (): DataPoint[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  
  // Create a realistic performance curve with seasonal patterns and a general trend
  return months.map((month, index) => {
    // Base trend: gradually improving performance (decreasing response time)
    const trendComponent = 80 - (index * 4);
    
    // Seasonal component: higher in middle months
    const seasonalIndex = index < months.length / 2 ? index : months.length - index - 1;
    const seasonalComponent = seasonalIndex * 6;
    
    // Random fluctuation for realism
    const randomComponent = Math.random() * 10 - 5;
    
    // System slowdown event in April
    const eventComponent = month === 'Apr' ? 25 : 0;
    
    // Calculate final value (response time)
    const value = Math.max(10, Math.round(trendComponent + seasonalComponent + randomComponent + eventComponent));
    
    return {
      name: month,
      value,
      timestamp: new Date(2024, index, 15).toISOString(),
      category: value > 50 ? 'high' : value > 30 ? 'medium' : 'low',
    };
  });
};

// Resource usage data with realistic distribution
export const getResourceUsageData = (): PieDataPoint[] => {
  // Based on typical enterprise system resource allocation
  return [
    { name: 'API Processing', value: 32, color: '#3b82f6' },
    { name: 'Data Storage', value: 27, color: '#60a5fa' },
    { name: 'Authentication', value: 18, color: '#93c5fd' },
    { name: 'UI Rendering', value: 14, color: '#bfdbfe' },
    { name: 'Background Tasks', value: 9, color: '#dbeafe' },
  ];
};

// System metrics showing current vs. baseline metrics
export const getSystemMetricsData = (): BarDataPoint[] => {
  return [
    { 
      name: 'Response Time', 
      value: 42, 
      comparisonValue: 65,
      category: 'performance',
      color: '#3b82f6' 
    },
    { 
      name: 'Error Rate', 
      value: 1.8, 
      comparisonValue: 3.2,
      category: 'reliability',
      color: '#ef4444' 
    },
    { 
      name: 'CPU Usage', 
      value: 68, 
      comparisonValue: 72,
      category: 'resource',
      color: '#10b981' 
    },
    { 
      name: 'Memory', 
      value: 52, 
      comparisonValue: 48,
      category: 'resource',
      color: '#f59e0b' 
    },
    { 
      name: 'DB Queries', 
      value: 1240, 
      comparisonValue: 980,
      category: 'performance',
      color: '#8b5cf6' 
    },
    { 
      name: 'Active Users', 
      value: 842, 
      comparisonValue: 756,
      category: 'engagement',
      color: '#ec4899' 
    },
  ];
};

// Weekly traffic pattern showing day-by-day variations
export const getWeeklyTrafficData = (): DataPoint[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Create a realistic weekly pattern with weekday peak and weekend trough
  return days.map((day, index) => {
    // Base workweek pattern (mid-week peak)
    let baseValue: number;
    
    if (index < 5) {
      // Weekday pattern: ramp up to Wednesday, then taper off
      baseValue = index < 2 ? 5000 + (index * 2000) : 9000 - ((index - 2) * 1000);
    } else {
      // Weekend pattern: significant drop
      baseValue = 3000 - ((index - 5) * 800);
    }
    
    // Add some random variation
    const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
    const value = Math.round(baseValue * randomFactor);
    
    return {
      name: day,
      value,
      timestamp: new Date(2024, 3, index + 1).toISOString(),
      category: index < 5 ? 'weekday' : 'weekend',
    };
  });
};

// Anomaly detection data with clear outliers
export const getAnomalyData = (): DataPoint[] => {
  // Generate hourly data for a 24-hour period
  return Array.from({ length: 24 }, (_, hour) => {
    // Base pattern: normal business hours traffic
    let baseValue: number;
    
    if (hour >= 8 && hour <= 18) {
      // Business hours: higher traffic with lunch dip
      const lunchDip = hour >= 12 && hour <= 13 ? 0.7 : 1;
      baseValue = 300 * lunchDip;
    } else if (hour >= 19 && hour <= 22) {
      // Evening: moderate traffic
      baseValue = 150;
    } else {
      // Night: low traffic
      baseValue = 50;
    }
    
    // Add random variation
    const randomVariation = (Math.random() * 0.3) - 0.15; // -15% to +15%
    
    // Add anomalies
    let anomalyValue = 0;
    if (hour === 10) {
      // Morning traffic spike
      anomalyValue = 400;
    } else if (hour === 15) {
      // Afternoon system issue
      anomalyValue = 600;
    } else if (hour === 2) {
      // Suspicious night activity
      anomalyValue = 300;
    }
    
    const value = Math.round(baseValue * (1 + randomVariation) + anomalyValue);
    
    return {
      name: `${hour}:00`,
      value,
      timestamp: new Date(2024, 3, 10, hour).toISOString(),
      category: anomalyValue > 0 ? 'anomaly' : 'normal',
    };
  });
};

// Get data for heatmap visualization
export const getServiceHealthData = () => {
  const services = ['API Gateway', 'Auth Service', 'User Service', 'Data Service', 'Notification', 'Payment', 'Analytics'];
  const metrics = ['Latency', 'Error Rate', 'CPU Usage', 'Memory', 'Throughput'];
  
  return metrics.map(metric => {
    // Create object with the metric name as a property
    const data: any = { metric: metric };
    
    services.forEach(service => {
      // Generate different patterns based on the metric
      let value: number;
      
      switch (metric) {
        case 'Latency':
          // API Gateway and Auth tend to be faster
          value = service.includes('API') || service.includes('Auth') 
            ? 20 + Math.random() * 30 
            : 50 + Math.random() * 100;
          break;
          
        case 'Error Rate':
          // Payment and Notification have higher error rates
          value = service.includes('Payment') || service.includes('Notification')
            ? 0.5 + Math.random() * 1.5
            : 0.1 + Math.random() * 0.5;
          break;
          
        case 'CPU Usage':
          // Analytics and Data Service use more CPU
          value = service.includes('Analytics') || service.includes('Data')
            ? 60 + Math.random() * 25
            : 30 + Math.random() * 20;
          break;
          
        case 'Memory':
          // User and Data services use more memory
          value = service.includes('User') || service.includes('Data')
            ? 50 + Math.random() * 30
            : 30 + Math.random() * 20;
          break;
          
        case 'Throughput':
          // API Gateway has highest throughput
          value = service.includes('API')
            ? 800 + Math.random() * 200
            : 200 + Math.random() * 400;
          break;
          
        default:
          value = Math.random() * 100;
      }
      
      data[service] = Math.round(value * 10) / 10; // Round to one decimal place
    });
    
    return data;
  });
};

// Calculate insights based on data
export const generateInsights = (data: DataPoint[], type: string): string[] => {
  const insights: string[] = [];
  
  if (!data.length) return insights;
  
  // Calculate statistics
  const values = data.map(item => item.value);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const maxPoint = data.find(item => item.value === max);
  const minPoint = data.find(item => item.value === min);
  
  // Generate insights based on data type
  switch (type) {
    case 'performance':
      insights.push(`Average response time is ${average.toFixed(1)}ms across all periods.`);
      insights.push(`Peak response time of ${max}ms occurred in ${maxPoint?.name}.`);
      insights.push(`Best performance of ${min}ms achieved in ${minPoint?.name}.`);
      
      // Check for trends
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
      
      if (secondHalfAvg < firstHalfAvg * 0.9) {
        insights.push(`Performance is improving significantly, with a ${((1 - secondHalfAvg/firstHalfAvg) * 100).toFixed(1)}% reduction in response times.`);
      } else if (secondHalfAvg > firstHalfAvg * 1.1) {
        insights.push(`Performance is degrading, with a ${((secondHalfAvg/firstHalfAvg - 1) * 100).toFixed(1)}% increase in response times.`);
      }
      break;
      
    case 'traffic':
      insights.push(`Average traffic volume is ${Math.round(average)} requests per period.`);
      insights.push(`Peak traffic of ${max} requests occurred on ${maxPoint?.name}.`);
      insights.push(`Lowest traffic of ${min} requests occurred on ${minPoint?.name}.`);
      
      // Calculate weekday vs weekend traffic if applicable
      const weekdayData = data.filter(item => item.category === 'weekday');
      const weekendData = data.filter(item => item.category === 'weekend');
      
      if (weekdayData.length && weekendData.length) {
        const weekdayAvg = weekdayData.reduce((sum, item) => sum + item.value, 0) / weekdayData.length;
        const weekendAvg = weekendData.reduce((sum, item) => sum + item.value, 0) / weekendData.length;
        
        insights.push(`Weekday traffic is ${(weekdayAvg/weekendAvg).toFixed(1)}x higher than weekend traffic.`);
      }
      break;
      
    case 'anomaly':
      // Find anomalies (values that deviate significantly from the average)
      const stdDev = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
      );
      
      const anomalies = data.filter(item => Math.abs(item.value - average) > 2 * stdDev);
      
      if (anomalies.length) {
        insights.push(`Detected ${anomalies.length} anomalies that deviate significantly from normal patterns.`);
        insights.push(`Most significant anomaly: ${anomalies[0].value} at ${anomalies[0].name}.`);
      } else {
        insights.push(`No significant anomalies detected in the current data set.`);
      }
      
      insights.push(`System activity follows expected patterns ${(100 - (anomalies.length / data.length) * 100).toFixed(1)}% of the time.`);
      break;
      
    default:
      insights.push(`Average value across all data points is ${average.toFixed(1)}.`);
      insights.push(`Values range from ${min} to ${max}.`);
  }
  
  return insights;
};