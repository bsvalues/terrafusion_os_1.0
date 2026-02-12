import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import { DataPoint } from '@/components/visualizations/AnimatedLineChart';
import { PieDataPoint } from '@/components/visualizations/AnimatedPieChart';
import { BarDataPoint } from '@/components/visualizations/AnimatedBarChart';

/**
 * Export a DOM element to PDF
 * @param element The DOM element to export
 * @param filename The name of the PDF file
 */
export const exportElementToPDF = async (
  element: HTMLElement,
  filename: string = 'report'
): Promise<void> => {
  try {
    // Show a temporary "Generating PDF..." overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        <div style="display: flex; align-items: center; gap: 12px;"><>

          <div class="animate-spin" style="border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px;"></div>
          <p
</> style="font-size: 16px; color: #1f2937;">Generating PDF...</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Create a copy of the element to avoid modifying the original
    const elementClone = element.cloneNode(true) as HTMLElement;
    
    // Apply some styling for better PDF output
    elementClone.style.width = '100%';
    elementClone.style.backgroundColor = '#ffffff';
    elementClone.style.padding = '20px';
    
    // Temporarily attach to body but make it invisible
    elementClone.style.position = 'absolute';
    elementClone.style.top = '-9999px';
    elementClone.style.left = '-9999px';
    document.body.appendChild(elementClone);
    
    // Generate canvas from the element
    const canvas = await html2canvas(elementClone, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow cross-origin images
      logging: false, // Disable logging
      backgroundColor: '#ffffff',
    });
    
    // Calculate dimensions for the PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    // Create PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    
    // Add title
    pdf.setFontSize(18);
    pdf.setTextColor(59, 130, 246); // Blue
    pdf.text('Data Visualization Report', 105, 15, { align: 'center' });
    
    // Add current date
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
    
    // Add image
    pdf.addImage(imgData, 'PNG', 0, 30, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save PDF
    pdf.save(`${filename}.pdf`);
    
    // Clean up
    document.body.removeChild(elementClone);
    document.body.removeChild(overlay);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('There was an error generating the PDF. Please try again.');
  }
};

/**
 * Generate a comprehensive report from visualization data
 * 
 * @param performanceData Performance trend data
 * @param resourceData Resource allocation data
 * @param metricsData System metrics data
 * @param anomalyData Anomaly detection data
 * @param filename The name of the PDF file
 */
export const generateComprehensiveReport = async (
  performanceData: DataPoint[],
  resourceData: PieDataPoint[],
  metricsData: BarDataPoint[],
  anomalyData: DataPoint[],
  filename: string = 'comprehensive-report'
): Promise<void> => {
  try {
    // Create a report container
    const reportContainer = document.createElement('div');
    reportContainer.style.width = '800px';
    reportContainer.style.padding = '40px';
    reportContainer.style.backgroundColor = '#ffffff';
    reportContainer.style.fontFamily = 'Arial, sans-serif';
    
    // Add report header
    reportContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;"><>

        <h1 style="color: #1e3a8a; margin-bottom: 10px; font-size: 28px;">System Performance Report</h1>
        <p
</> style="color: #6b7280; font-size: 14px;">Generated on ${new Date().toLocaleString()}</p>
        <div style="width: 100px; height: 4px; background-color: #3b82f6; margin: 20px auto;"></div>
      </div>
      
      <div style="margin-bottom: 40px;"><>

        <h2 style="color: #1e40af; margin-bottom: 15px; font-size: 20px;">Executive Summary</h2>
        <p
</> style="color: #374151; line-height: 1.6; font-size: 14px;">
          This report provides a comprehensive overview of system performance metrics, resource allocation,
          and anomaly detection results. The data presented offers insights into current system status,
          potential optimization opportunities, and areas requiring attention.
        </p>
      </div>
      
      <div style="margin-bottom: 40px;"><>

        <h2 style="color: #1e40af; margin-bottom: 15px; font-size: 20px;">Performance Trends</h2>
        <p
</> style="color: #374151; line-height: 1.6; font-size: 14px;">
          Performance metrics show ${getPerformanceTrend(performanceData)}. 
          The average response time is ${getAverageValue(performanceData).toFixed(1)}ms with peak values 
          reaching ${getMaxValue(performanceData)}ms during high traffic periods.
        </p>
        <div style="margin-top: 10px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
          <p style="color: #4b5563; font-size: 13px; margin: 0;">
            <strong>Key Observation:</strong> ${getKeyObservation(performanceData, 'performance')}
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;"><>

        <h2 style="color: #1e40af; margin-bottom: 15px; font-size: 20px;">Resource Allocation</h2>
        <p
</> style="color: #374151; line-height: 1.6; font-size: 14px;">
          Current resource allocation shows distribution across ${resourceData.length} key components.
          The largest allocation goes to ${getTopResource(resourceData)} (${getTopResourcePercentage(resourceData)}%),
          while the smallest is allocated to ${getBottomResource(resourceData)} (${getBottomResourcePercentage(resourceData)}%).
        </p>
        <div style="margin-top: 10px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
          <p style="color: #4b5563; font-size: 13px; margin: 0;">
            <strong>Optimization Recommendation:</strong> ${getResourceRecommendation(resourceData)}
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;"><>

        <h2 style="color: #1e40af; margin-bottom: 15px; font-size: 20px;">System Metrics</h2>
        <p
</> style="color: #374151; line-height: 1.6; font-size: 14px;">
          Comparison with previous period shows ${getMetricsComparison(metricsData)}.
          ${getImprovedMetricsCount(metricsData)} metrics have improved while ${getDeterioratedMetricsCount(metricsData)}
          have deteriorated compared to the baseline.
        </p>
        <div style="margin-top: 10px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
          <p style="color: #4b5563; font-size: 13px; margin: 0;">
            <strong>Action Item:</strong> ${getMetricsActionItem(metricsData)}
          </p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;"><>

        <h2 style="color: #1e40af; margin-bottom: 15px; font-size: 20px;">Anomaly Detection</h2>
        <p
</> style="color: #374151; line-height: 1.6; font-size: 14px;">
          Anomaly detection algorithms identified ${getAnomalyCount(anomalyData)} significant anomalies
          in the monitored period. The most notable anomaly occurred at ${getMostSignificantAnomalyTime(anomalyData)}
          with a deviation of ${getMostSignificantAnomalyDeviation(anomalyData).toFixed(1)}% from normal patterns.
        </p>
        <div style="margin-top: 10px; padding: 12px; ${getAnomalyCount(anomalyData) > 0 ? 'background-color: #fee2e2; border: 1px solid #fecaca;' : 'background-color: #d1fae5; border: 1px solid #a7f3d0;'} border-radius: 6px;">
          <p style="color: ${getAnomalyCount(anomalyData) > 0 ? '#b91c1c' : '#065f46'}; font-size: 13px; margin: 0;">
            <strong>${getAnomalyCount(anomalyData) > 0 ? 'Alert:' : 'Status:'}</strong> ${getAnomalyStatus(anomalyData)}
          </p>
        </div>
      </div>
      
      <div style="margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
        <p style="color: #6b7280; font-size: 12px;">
          This report was automatically generated by the System Monitoring Dashboard.<br>
          For questions or further analysis, please contact the system administrator.
        </p>
      </div>
    `;
    
    // Temporarily add to document
    reportContainer.style.position = 'absolute';
    reportContainer.style.top = '-9999px';
    reportContainer.style.left = '-9999px';
    document.body.appendChild(reportContainer);
    
    // Export the report to PDF
    await exportElementToPDF(reportContainer, filename);
    
    // Clean up
    document.body.removeChild(reportContainer);
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    alert('There was an error generating the report. Please try again.');
  }
};

// Helper functions for the report generation

function getPerformanceTrend(data: DataPoint[]): string {
  if (data.length < 2) return 'insufficient data to determine trends';
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
  
  if (secondHalfAvg < firstHalfAvg * 0.95) {
    return 'a significant improvement in recent periods';
  } else if (secondHalfAvg > firstHalfAvg * 1.05) {
    return 'a concerning degradation in recent periods';
  } else {
    return 'relatively stable performance across all periods';
  }
}

function getAverageValue(data: DataPoint[]): number {
  if (!data.length) return 0;
  return data.reduce((sum, item) => sum + item.value, 0) / data.length;
}

function getMaxValue(data: DataPoint[]): number {
  if (!data.length) return 0;
  return Math.max(...data.map(item => item.value));
}

function getMinValue(data: DataPoint[]): number {
  if (!data.length) return 0;
  return Math.min(...data.map(item => item.value));
}

function getKeyObservation(data: DataPoint[], type: string): string {
  if (!data.length) return 'Insufficient data to derive observations';
  
  if (type === 'performance') {
    const avg = getAverageValue(data);
    const max = getMaxValue(data);
    const maxItem = data.find(item => item.value === max);
    
    if (max > avg * 1.5) {
      return `Significant performance spike detected in ${maxItem?.name || 'certain periods'}, 
              which might indicate potential bottlenecks during high traffic.`;
    } else {
      return `Performance remains within acceptable parameters across all monitored periods, 
              suggesting effective load handling and resource allocation.`;
    }
  }
  
  return 'System is operating within expected parameters.';
}

function getTopResource(data: PieDataPoint[]): string {
  if (!data.length) return 'N/A';
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return sorted[0].name;
}

function getTopResourcePercentage(data: PieDataPoint[]): number {
  if (!data.length) return 0;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return sorted[0].value;
}

function getBottomResource(data: PieDataPoint[]): string {
  if (!data.length) return 'N/A';
  const sorted = [...data].sort((a, b) => a.value - b.value);
  return sorted[0].name;
}

function getBottomResourcePercentage(data: PieDataPoint[]): number {
  if (!data.length) return 0;
  const sorted = [...data].sort((a, b) => a.value - b.value);
  return sorted[0].value;
}

function getResourceRecommendation(data: PieDataPoint[]): string {
  if (!data.length) return 'Insufficient data to provide recommendations';
  
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  
  if (top.value > 30 && bottom.value < 10) {
    return `Consider rebalancing resources from ${top.name} (${top.value}%) to 
            enhance ${bottom.name} (${bottom.value}%) for better overall system performance.`;
  } else {
    return `Current resource allocation appears balanced and optimized for the workload.
            Maintain current distribution and monitor for changes in usage patterns.`;
  }
}

function getMetricsComparison(data: BarDataPoint[]): string {
  if (!data.length) return 'insufficient data for comparison';
  
  let improved = 0;
  let deteriorated = 0;
  
  data.forEach(item => {
    if (item.comparisonValue !== undefined) {
      // For metrics like error rate, lower is better
      const isErrorMetric = item.name.toLowerCase().includes('error');
      
      if (isErrorMetric) {
        if (item.value < item.comparisonValue) improved++;
        else if (item.value > item.comparisonValue) deteriorated++;
      } else {
        // For other metrics, higher is usually better
        if (item.value > item.comparisonValue) improved++;
        else if (item.value < item.comparisonValue) deteriorated++;
      }
    }
  });
  
  if (improved > deteriorated * 2) {
    return 'significant overall improvement across most metrics';
  } else if (improved > deteriorated) {
    return 'moderate improvement with some areas for attention';
  } else if (improved === deteriorated) {
    return 'mixed results with equal improvements and declines';
  } else {
    return 'concerning trend with more metrics showing deterioration than improvement';
  }
}

function getImprovedMetricsCount(data: BarDataPoint[]): number {
  if (!data.length) return 0;
  
  let improved = 0;
  
  data.forEach(item => {
    if (item.comparisonValue !== undefined) {
      const isErrorMetric = item.name.toLowerCase().includes('error');
      
      if (isErrorMetric) {
        if (item.value < item.comparisonValue) improved++;
      } else {
        if (item.value > item.comparisonValue) improved++;
      }
    }
  });
  
  return improved;
}

function getDeterioratedMetricsCount(data: BarDataPoint[]): number {
  if (!data.length) return 0;
  
  let deteriorated = 0;
  
  data.forEach(item => {
    if (item.comparisonValue !== undefined) {
      const isErrorMetric = item.name.toLowerCase().includes('error');
      
      if (isErrorMetric) {
        if (item.value > item.comparisonValue) deteriorated++;
      } else {
        if (item.value < item.comparisonValue) deteriorated++;
      }
    }
  });
  
  return deteriorated;
}

function getMetricsActionItem(data: BarDataPoint[]): string {
  if (!data.length) return 'Gather more metrics data for actionable insights';
  
  const worstMetric = data.reduce((worst, current) => {
    if (current.comparisonValue === undefined) return worst;
    
    const isErrorMetric = current.name.toLowerCase().includes('error');
    let currentDiff;
    
    if (isErrorMetric) {
      // For error metrics, calculate how much worse it got (positive is bad)
      currentDiff = current.value - current.comparisonValue;
    } else {
      // For other metrics, calculate how much worse it got (negative is bad)
      currentDiff = current.comparisonValue - current.value;
    }
    
    if (worst.diff === null || currentDiff > worst.diff) {
      return { metric: current, diff: currentDiff };
    }
    return worst;
  }, { metric: null as BarDataPoint | null, diff: null as number | null });
  
  if (worstMetric.metric) {
    return `Prioritize investigation of ${worstMetric.metric.name} which shows the most 
            significant degradation compared to previous periods.`;
  }
  
  return 'Continue monitoring all metrics for any significant changes.';
}

function getAnomalyCount(data: DataPoint[]): number {
  if (!data.length) return 0;
  
  const avg = getAverageValue(data);
  const stdDev = Math.sqrt(
    data.reduce((sum, item) => sum + Math.pow(item.value - avg, 2), 0) / data.length
  );
  
  return data.filter(item => Math.abs(item.value - avg) > 2 * stdDev).length;
}

function getMostSignificantAnomalyTime(data: DataPoint[]): string {
  if (!data.length) return 'N/A';
  
  const avg = getAverageValue(data);
  const anomalies = data.map(item => ({
    ...item,
    deviation: Math.abs(item.value - avg)
  })).sort((a, b) => b.deviation - a.deviation);
  
  return anomalies[0]?.name || 'N/A';
}

function getMostSignificantAnomalyDeviation(data: DataPoint[]): number {
  if (!data.length) return 0;
  
  const avg = getAverageValue(data);
  const anomalies = data.map(item => ({
    ...item,
    deviation: Math.abs(item.value - avg)
  })).sort((a, b) => b.deviation - a.deviation);
  
  if (!anomalies.length) return 0;
  
  return (anomalies[0].deviation / avg) * 100;
}

function getAnomalyStatus(data: DataPoint[]): string {
  const anomalyCount = getAnomalyCount(data);
  
  if (anomalyCount === 0) {
    return 'No anomalies detected. System is operating within normal parameters.';
  } else if (anomalyCount === 1) {
    return 'One anomaly detected. Requires investigation but may be an isolated incident.';
  } else if (anomalyCount <= 3) {
    return `${anomalyCount} anomalies detected. Pattern suggests systematic issue requiring attention.`;
  } else {
    return `High number of anomalies (${anomalyCount}) indicating significant system instability. Immediate investigation required.`;
  }
}

/**
 * Export data to Excel format
 * 
 * @param data The data to export
 * @param sheetName The name of the Excel sheet
 * @param filename The name of the Excel file
 */
export const exportToExcel = async <T extends Record<string, any>>(
  data: T[],
  sheetName: string = 'Data Export',
  filename: string = 'data-export'
): Promise<void> => {
  try {
    // Show a temporary "Generating Excel..." overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        <div style="display: flex; align-items: center; gap: 12px;"><>

          <div class="animate-spin" style="border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px;"></div>
          <p
</> style="font-size: 16px; color: #1f2937;">Generating Excel file...</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'System Monitoring Dashboard';
    workbook.created = new Date();
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet(sheetName);
    
    if (data.length > 0) {
      // Add headers
      const headers = Object.keys(data[0]).filter(key => 
        // Filter out complex objects that can't be serialized well to Excel
        typeof data[0][key] !== 'object' || data[0][key] === null
      );
      worksheet.addRow(headers);
      
      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' } // Blue color
      };
      headerRow.font = {
        color: { argb: 'FFFFFFFF' }, // White text
        bold: true
      };
      
      // Add data rows
      data.forEach(item => {
        const rowData = headers.map(header => item[header]);
        worksheet.addRow(rowData);
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column) {
          let maxLength = 0;
          // Use non-null assertion to tell TypeScript the method exists
          column.eachCell!({ includeEmpty: true }, cell => {
            const textLength = cell.value ? cell.value.toString().length : 10;
            maxLength = Math.max(maxLength, textLength);
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50); // Width between 10 and 50
        }
      });
      
      // Add alternating row colors
      worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          if (rowNumber % 2 === 0) {
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3F4F6' } // Light gray for even rows
            };
          }
        }
      });
      
      // Add borders to all cells
      worksheet.eachRow({ includeEmpty: true }, row => {
        row.eachCell({ includeEmpty: true }, cell => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });
      
      // Add metadata in top rows
      worksheet.insertRow(1, ['Report Generated:', new Date().toLocaleString()]);
      worksheet.insertRow(2, ['Total Records:', data.length.toString()]);
      worksheet.insertRow(3, []); // Empty row for spacing
      
      // Style metadata rows
      for (let i = 1; i <= 2; i++) {
        const row = worksheet.getRow(i);
        row.getCell(1).font = { bold: true };
      }
      
      // Move the actual data rows down to account for metadata
      const actualHeaderRow = worksheet.getRow(4);
      actualHeaderRow.font = { bold: true };
      actualHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' } // Blue color
      };
      actualHeaderRow.font = {
        color: { argb: 'FFFFFFFF' }, // White text
        bold: true
      };
    }
    
    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create a Blob and download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    document.body.removeChild(overlay);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    alert('There was an error generating the Excel file. Please try again.');
  }
};

/**
 * Export data to CSV format
 * 
 * @param data The data to export
 * @param filename The name of the CSV file
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string = 'data-export'
): void => {
  try {
    if (!data.length) {
      alert('No data to export');
      return;
    }
    
    // Show a temporary "Generating CSV..." overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
        <div style="display: flex; align-items: center; gap: 12px;"><>

          <div class="animate-spin" style="border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px;"></div>
          <p
</> style="font-size: 16px; color: #1f2937;">Generating CSV file...</p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Get headers (filter out complex objects)
    const headers = Object.keys(data[0]).filter(key => 
      typeof data[0][key] !== 'object' || data[0][key] === null
    );
    
    // Function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = value.toString();
      // Escape quotes and wrap in quotes if contains comma, quote or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add metadata
    csvContent += `"Report Generated:","${new Date().toLocaleString()}"\r\n`;
    csvContent += `"Total Records:","${data.length}"\r\n\r\n`;
    
    // Add headers
    csvContent += headers.map(escapeCSV).join(',') + '\r\n';
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => escapeCSV(item[header])).join(',');
      csvContent += row + '\r\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    document.body.removeChild(overlay);
  } catch (error) {
    console.error('Error generating CSV file:', error);
    alert('There was an error generating the CSV file. Please try again.');
  }
};

/**
 * Export visualization data to various formats
 * 
 * @param data The data to export
 * @param type The export format type ('pdf', 'excel', 'csv')
 * @param title The title/name for the export
 * @param element The DOM element to export (for PDF only)
 */
export const exportVisualizationData = async (
  data: Array<any>,
  type: 'pdf' | 'excel' | 'csv',
  title: string,
  element?: HTMLElement | null
): Promise<void> => {
  try {
    switch (type) {
      case 'pdf':
        if (!element) {
          throw new Error('DOM element is required for PDF export');
        }
        await exportElementToPDF(element, title);
        break;
      case 'excel':
        await exportToExcel(data, title, title);
        break;
      case 'csv':
        exportToCSV(data, title);
        break;
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
  } catch (error) {
    console.error(`Error during ${type} export:`, error);
    alert(`There was an error generating the ${type.toUpperCase()} file. Please try again.`);
  }
};