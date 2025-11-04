import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, BarChart3, TrendingUp, AlertCircle, CheckCircle, Building2, DollarSign, Calculator, MapPin, Users, PieChart, Target, Activity  } from '@mui/icons-material';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
}

interface ReportConfig {
  reportType: 'executive' | 'detailed' | 'audit' | 'comparative' | 'forecasting';
  year: string;
  format: 'html' | 'pdf' | 'excel' | 'json';
  includeCharts: boolean;
  includeAnalysis: boolean;
}

interface GeneratedReport {
  id: string;
  title: string;
  generatedAt: string;
  config: ReportConfig;
  sections: any[];
  metadata: {
    totalPilt: number;
    totalDistricts: number;
    dataQualityScore: number;
    confidenceLevel: number;
  };
  insights: string[];
  recommendations: string[];
}

export default function SpectacularReportGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedFormat, setSelectedFormat] = useState<'html' | 'pdf' | 'excel' | 'json'>('html');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [activeTab, setActiveTab] = useState('configure');

  const queryClient = useQueryClient();

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/reports/templates'],
    queryFn: () => fetch('/api/reports/templates').then(res => res.json())
  });

  const { data: piltHistory } = useQuery({
    queryKey: ['/api/pilt/history'],
    queryFn: () => fetch('/api/pilt/history').then(res => res.json())
  });

  const generateReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const result = await response.json();
      return result.report;
    },
    onSuccess: (report) => {
      setGeneratedReport(report);
      setActiveTab('preview');
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
  });

  const handleGenerateReport = () => {
    if (!selectedTemplate || !selectedYear) return;

    const config: ReportConfig = {
      reportType: selectedTemplate as any,
      year: selectedYear,
      format: selectedFormat,
      includeCharts,
      includeAnalysis,
    };

    generateReportMutation.mutate(config);
  };

  const availableYears = piltHistory && Array.isArray(piltHistory) ? 
    Array.from(new Set(piltHistory.map((p: any) => p.year))).sort().reverse() : 
    ['2024', '2023', '2022', '2021', '2020'];

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'executive': return <FileText className="h-5 w-5" />;
      case 'detailed': return <BarChart3 className="h-5 w-5" />;
      case 'audit': return <CheckCircle className="h-5 w-5" />;
      case 'comparative': return <TrendingUp className="h-5 w-5" />;
      case 'forecasting': return <AlertCircle className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleDownloadReport = async () => {
    if (!generatedReport) return;

    const reportTitle = `PILT_Report_${selectedTemplate}_${selectedYear}`;
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (selectedFormat === 'html') {
      // Create HTML content with styling
      const htmlContent = `
<!DOCTYPE html>
<html>
<head><>

    <title>${reportTitle}</title>
    <meta
</> charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: linear-gradient(to right, #2563eb, #1e40af); color: white; padding: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; page-break-inside: avoid; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; font-weight: bold; }
        .chart-container { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .metric { display: inline-block; background: #e3f2fd; padding: 10px; margin: 5px; border-radius: 5px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header"><>

        <h1>Benton County PILT Report</h1>
        <p
</>>Generated: ${new Date().toLocaleDateString()} | Year: ${selectedYear} | Type: ${selectedTemplate}</p>
    </div>
    ${document.querySelector('.space-y-6')?.innerHTML || 'Report content not available'}
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle}_${timestamp}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } 
    else if (selectedFormat === 'json') {
      // Download as JSON
      const jsonContent = JSON.stringify({
        metadata: {
          title: reportTitle,
          generated: new Date().toISOString(),
          year: selectedYear,
          type: selectedTemplate,
          format: selectedFormat
        },
        report: generatedReport
      }, null, 2);
      
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle}_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    else if (selectedFormat === 'pdf') {
      // Generate proper PDF using jsPDF
      try {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;
        
        const pdf = new jsPDF();
        
        // Add header
        pdf.setFontSize(16);
        pdf.text('Benton County PILT Report', 105, 20, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text('Generated: ${new Date().toLocaleDateString()} | Year: ${selectedYear} | Type: ${selectedTemplate}', 105, 30, { align: 'center' });
        
        // Add certification
        pdf.setFontSize(10);
        const certText = 'I, Bill Spencer, Assessor of Benton County, State of Washington, do hereby certify that the foregoing is a correct assessed value, with the appropriate levies for the applicable taxing districts. These values and levies have been applied to the Hanford lands within Benton County.';
        const lines = pdf.splitTextToSize(certText, 180);
        pdf.text(lines, 15, 55);
        
        let yPosition = 85;
        
        // Add sections from the generated report
        if (generatedReport.sections) {
          generatedReport.sections.forEach((section: any) => {
            if (yPosition > 250) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(section.title, 15, yPosition);
            yPosition += 10;
            
            if (section.type === 'distribution_table' && section.data.distributions) {
              const tableData = section.data.distributions.map((dist: any) => [
                dist.district,
                `$${dist.assessedValue.toLocaleString()}`,
                dist.levyRate.toFixed(10),
                `$${dist.piltDue.toLocaleString()}`
              ]);
              
              autoTable(pdf, {
                head: [['District', 'Assessed Value', 'Levy Rate', 'PILT Due']],
                body: tableData,
                startY: yPosition,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [230, 230, 230] }
              });
              
              yPosition = (pdf as any).lastAutoTable.finalY + 10;
            }
            
            if (section.type === 'land_classification' && section.data.classifications) {
              section.data.classifications.forEach((classification: any) => {
                if (yPosition > 240) {
                  pdf.addPage();
                  yPosition = 20;
                }
                
                const classData = [];
                if (classification.dryland) {
                  classData.push([
                    classification.district,
                    'Dryland',
                    classification.dryland.acres.toLocaleString(),
                    `$${classification.dryland.rate}`,
                    `$${classification.dryland.value.toLocaleString()}`
                  ]);
                }
                if (classification.irrigable) {
                  classData.push([
                    '',
                    'Irrigable Land',
                    classification.irrigable.acres.toLocaleString(),
                    `$${classification.irrigable.rate.toLocaleString()}`,
                    `$${classification.irrigable.value.toLocaleString()}`
                  ]);
                }
                
                if (classData.length > 0) {
                  autoTable(pdf, {
                    head: [['District', 'Land Type', 'Acres', 'Rate per Acre', 'Total Value']],
                    body: classData,
                    startY: yPosition,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [230, 230, 230] }
                  });
                  
                  yPosition = (pdf as any).lastAutoTable.finalY + 10;
                }
              });
            }
            
            yPosition += 5;
          });
        }
        
        // Add footer
        const pageCount = pdf.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.text('Benton County Assessor\'s Office | PO Box 902, Prosser, WA 99350 | Phone: (509) 735-2394', 105, 285, { align: 'center' });
        }
        
        // Download the PDF
        pdf.save(`${reportTitle}_${timestamp}.pdf`);
        
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('PDF generation failed. Please try again or use a different format.');
      }
    }
    else if (selectedFormat === 'excel') {
      // Create CSV content for Excel compatibility
      let csvContent = `Benton County PILT Report\n`;
      csvContent += `Generated: ${new Date().toLocaleDateString()}\n`;
      csvContent += `Year: ${selectedYear}\n`;
      csvContent += `Type: ${selectedTemplate}\n\n`;
      
      if (generatedReport.sections) {
        generatedReport.sections.forEach((section: any) => {
          csvContent += `\n${section.title}\n`;
          csvContent += `${'='.repeat(section.title.length)}\n`;
          
          if (section.type === 'distribution_table' && section.data.distributions) {
            csvContent += `District,Assessed Value,Levy Rate,PILT Due\n`;
            section.data.distributions.forEach((dist: any) => {
              csvContent += `${dist.district},${dist.assessedValue},${dist.levyRate},${dist.piltDue}\n`;
            });
          }
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle}_${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const renderReportSection = (section: any) => {
    switch (section.type) {
      case 'header':
        return (
          <Card key={section.id} className="mb-6 border-2 border-blue-600">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <div className="flex items-center justify-between">
                <div><>

                  <CardTitle className="text-xl font-bold">BENTON COUNTY</CardTitle>
                  <p
</> className="text-blue-100">OFFICE OF THE ASSESSOR</p>
                </div>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <div className="text-blue-600 font-bold text-xs text-center">
                    COUNTY OF<br/>BENTON<br/>EST. 1905<br/>WASHINGTON
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4"><>

                <div className="text-right text-sm text-muted-foreground">
                  {section.data.reportDate}
                </div>
                
                <div
</> className="space-y-2"><>

                  <p className="font-medium">{section.data.treasurerTitle}</p>
                  <p
</>>{section.data.treasurerName}</p><>

                  <p>PO Box 630</p>
                  <p
</>>Prosser WA 99350</p>
                </div>

                <div className="py-4">
                  <p className="text-justify leading-relaxed">
                    {section.data.certificationText}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-center font-bold text-lg">
                    The assessed value of land for calculation of Payment in Lieu of Tax is: 
                    <span className="block text-2xl text-blue-600 mt-2">
                      {formatNumber(section.data.assessedValue)}
                    </span>
                  </p>
                </div>

                <div className="pt-6 space-y-2"><>

                  <p>Sincerely,</p>
                  <div
</> className="py-4"><>

                    <div className="border-b border-gray-400 w-48 mb-2"></div>
                    <p
</> className="font-bold">{section.data.assessorName}</p>
                    <p>{section.data.assessorTitle}</p>
                  </div>
                </div>

                <div className="pt-4 text-sm text-muted-foreground"><>

                  <p>Enclosures: {section.data.county} Total Assessed Value</p>
                  <p
</> className="ml-12">Payment in Lieu of Tax for Hanford Site</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'historical_chart':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader><>

              <CardTitle className="text-center text-xl font-bold text-blue-800">
                {section.data.chartTitle}
              </CardTitle>
              <p
</> className="text-center text-sm text-muted-foreground">
                {section.data.subtitle}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="flex items-end justify-center space-x-1 h-64 bg-gradient-to-b from-blue-50 to-blue-100 p-4 rounded-lg">
                      {section.data.historicalData.map((item: any, idx: number) => {
                        const maxAmount = Math.max(...section.data.historicalData.map((d: any) => d.amount));
                        const height = (item.amount / maxAmount) * 200;
                        const isCurrentYear = item.year === section.data.currentYear;
                        
                        return (
                          <div key={idx} className="flex flex-col items-center"><>

                            <div className="text-xs mb-1 font-bold">
                              {formatNumber(item.amount)}
                            </div>
                            <div
</>
                              className={`w-8 transition-all duration-300 ${
                                isCurrentYear 
                                  ? 'bg-red-500 border-2 border-red-700' 
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                              style={{ height: `${height}px` }}
                              title={`${item.year}: ${formatNumber(item.amount)}`}
                            ></div>
                            <div className={`text-xs mt-1 font-medium ${
                              isCurrentYear ? 'text-red-600 font-bold' : 'text-gray-700'
                            }`}>
                              {item.year}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg"><>

                    <div className="text-xl font-bold text-green-600">
                      {formatNumber(section.data.currentAmount)}
                    </div>
                    <p
</> className="text-sm text-muted-foreground">Current Year ({section.data.currentYear})</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                    <div className="text-xl font-bold text-blue-600">
                      {section.data.historicalData.length}
                    </div>
                    <p
</> className="text-sm text-muted-foreground">Years of Data</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg"><>

                    <div className="text-xl font-bold text-purple-600">
                      {formatNumber(section.data.historicalData.reduce((sum: number, d: any) => sum + d.amount, 0))}
                    </div>
                    <p
</> className="text-sm text-muted-foreground">Total PILT (All Years)</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center italic">
                    {section.data.note}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'summary':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(section.data.totalAmount)}
                  </div>
                  <p
</> className="text-sm text-muted-foreground">Total PILT Amount</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg"><>

                  <div className="text-2xl font-bold text-green-600">
                    {section.data.totalDistricts}
                  </div>
                  <p
</> className="text-sm text-muted-foreground">Districts Served</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg"><>

                  <div className="text-2xl font-bold text-purple-600">
                    {section.data.assessedValue ? formatNumber(section.data.assessedValue) : 'N/A'}
                  </div>
                  <p
</> className="text-sm text-muted-foreground">Assessed Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'distribution_table':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-blue-600 text-white"><>

                        <th className="border border-gray-300 p-3 text-left font-semibold">District</th>
                        <th
</> className="border border-gray-300 p-3 text-right font-semibold">Assessed Value</th><>

                        <th className="border border-gray-300 p-3 text-right font-semibold">Levy Rate*</th>
                        <th
</> className="border border-gray-300 p-3 text-center font-semibold">Less 81-874 deduction</th>
                        <th className="border border-gray-300 p-3 text-right font-semibold">PILT Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.data.distributions.map((dist: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}><>

                          <td className="border border-gray-300 p-3 font-medium">{dist.district}</td>
                          <td
</> className="border border-gray-300 p-3 text-right">
                            $ {formatNumber(dist.assessedValue)}
                          </td><>

                          <td className="border border-gray-300 p-3 text-right">
                            {dist.levyRate.toFixed(10)}
                          </td>
                          <td
</> className="border border-gray-300 p-3 text-center text-gray-500">
                            {dist.less81874Deduction}
                          </td>
                          <td className="border border-gray-300 p-3 text-right font-semibold text-green-600">
                            $ {formatNumber(dist.piltDue)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-800 text-white font-bold"><>

                        <td className="border border-gray-300 p-3">Total PILT DUE</td>
                        <td
</> className="border border-gray-300 p-3"></td><>

                        <td className="border border-gray-300 p-3"></td>
                        <td
</> className="border border-gray-300 p-3"></td>
                        <td className="border border-gray-300 p-3 text-right">
                          $ {formatNumber(section.data.totalPiltDue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic">{section.data.note}</p>
                </div>

                {/* PILT Due Chart */}
                <div className="mt-6"><>

                  <h4 className="text-lg font-semibold mb-4 text-center bg-gray-700 text-white p-2">PILT DUE</h4>
                  <div
</> className="bg-gradient-to-r from-blue-600 to-orange-500 p-4 rounded-lg">
                    <div className="space-y-2">
                      {section.data.distributions
                        .sort((a: any, b: any) => b.piltDue - a.piltDue)
                        .map((dist: any, idx: number) => {
                          const percentage = (dist.piltDue / section.data.totalPiltDue) * 100;
                          return (
                            <div key={idx} className="flex items-center justify-between text-white text-sm"><>

                              <span className="w-1/3 truncate">{dist.district}</span>
                              <div
</> className="w-1/2 bg-white bg-opacity-20 rounded-full h-6 mr-2 relative overflow-hidden"><>

                                <div 
                                  className="bg-white h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                                <span
</> className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                              <span className="w-1/6 text-right font-bold">
                                ${formatNumber(dist.piltDue)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'land_classification':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-green-600 text-white"><>

                        <th className="border border-gray-300 p-2 text-left">Row Labels</th>
                        <th
</> className="border border-gray-300 p-2 text-right">Sum of acres</th><>

                        <th className="border border-gray-300 p-2 text-right">Sum of $/acre</th>
                        <th
</> className="border border-gray-300 p-2 text-right">Sum of value</th>
                        <th className="border border-gray-300 p-2 text-right">Sum of Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.data.classifications.map((classification: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <tr className="bg-gray-100 font-semibold"><>

                            <td className="border border-gray-300 p-2" colSpan={4}>
                              📋 {classification.district}
                            </td>
                            <td
</> className="border border-gray-300 p-2 text-right font-bold">
                              ${formatNumber(classification.totalValue)}
                            </td>
                          </tr>
                          
                          {classification.dryland && (
                            <tr><>

                              <td className="border border-gray-300 p-2 pl-6">Dryland *(per acre)</td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                {classification.dryland.acres.toLocaleString()}
                              </td><>

                              <td className="border border-gray-300 p-2 text-right">
                                ${classification.dryland.rate}
                              </td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                ${formatNumber(classification.dryland.value)}
                              </td>
                              <td className="border border-gray-300 p-2"></td>
                            </tr>
                          )}
                          
                          {classification.irrigable && (
                            <tr><>

                              <td className="border border-gray-300 p-2 pl-6">Irrigable Land (Per Acre)</td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                {classification.irrigable.acres.toLocaleString()}
                              </td><>

                              <td className="border border-gray-300 p-2 text-right">
                                ${classification.irrigable.rate.toLocaleString()}
                              </td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                ${formatNumber(classification.irrigable.value)}
                              </td>
                              <td className="border border-gray-300 p-2"></td>
                            </tr>
                          )}
                          
                          {classification.riverfront && (
                            <tr><>

                              <td className="border border-gray-300 p-2 pl-6">Lesser Riverfront (per linear foot)</td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                {classification.riverfront.acres.toLocaleString()}
                              </td><>

                              <td className="border border-gray-300 p-2 text-right">
                                ${classification.riverfront.rate}
                              </td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                ${formatNumber(classification.riverfront.value)}
                              </td>
                              <td className="border border-gray-300 p-2"></td>
                            </tr>
                          )}
                          
                          {classification.residential && (
                            <tr><>

                              <td className="border border-gray-300 p-2 pl-6">Rural Residential(per acre)</td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                {classification.residential.acres}
                              </td><>

                              <td className="border border-gray-300 p-2 text-right">
                                ${classification.residential.rate.toLocaleString()}
                              </td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                ${formatNumber(classification.residential.value)}
                              </td>
                              <td className="border border-gray-300 p-2"></td>
                            </tr>
                          )}
                          
                          {classification.townPlats && (
                            <tr><>

                              <td className="border border-gray-300 p-2 pl-6">Town Plats (per acre)</td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                {classification.townPlats.acres}
                              </td><>

                              <td className="border border-gray-300 p-2 text-right">
                                ${classification.townPlats.rate.toLocaleString()}
                              </td>
                              <td
</> className="border border-gray-300 p-2 text-right">
                                ${formatNumber(classification.townPlats.value)}
                              </td>
                              <td className="border border-gray-300 p-2"></td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      
                      {/* County Totals */}
                      <tr className="bg-blue-600 text-white font-bold"><>

                        <td className="border border-gray-300 p-2">Benton County</td>
                        <td
</> className="border border-gray-300 p-2"></td><>

                        <td className="border border-gray-300 p-2"></td>
                        <td
</> className="border border-gray-300 p-2"></td>
                        <td className="border border-gray-300 p-2 text-right">
                          $ {formatNumber(section.data.grandTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic">{section.data.note}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'table':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50"><>

                      <th className="border border-gray-300 px-4 py-2 text-left">District</th>
                      <th
</> className="border border-gray-300 px-4 py-2 text-right">Amount</th>
                      <th className="border border-gray-300 px-4 py-2 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.distributions.map((dist: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><>

                        <td className="border border-gray-300 px-4 py-2 font-medium">{dist.district}</td>
                        <td
</> className="border border-gray-300 px-4 py-2 text-right">{formatNumber(dist.amount)}</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {dist.percentage ? `${dist.percentage.toFixed(2)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );

      case 'chart':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart Representation */}
                <div><>

                  <h4 className="font-medium mb-3">Distribution by Amount</h4>
                  <div
</> className="space-y-2">
                    {(section.data.barChart || section.data.pieChart || []).map((item: any, idx: number) => {
                      const maxValue = Math.max(...(section.data.barChart || section.data.pieChart || []).map((d: any) => d.value || d.amount));
                      const width = ((item.value || item.amount) / maxValue) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-sm"><>

                            <span className="font-medium">{item.name || item.district}</span>
                            <span
</>>{formatNumber(item.value || item.amount)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${width}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Percentage Breakdown */}
                <div><>

                  <h4 className="font-medium mb-3">Percentage Distribution</h4>
                  <div
</> className="space-y-2">
                    {(section.data.pieChart || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded"><>

                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge
</> variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'trend':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg"><>

                    <div className="text-xl font-bold text-green-600">
                      {section.data.growthRate > 0 ? '+' : ''}{section.data.growthRate.toFixed(1)}%
                    </div>
                    <p
</> className="text-sm text-muted-foreground">Growth Rate</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                    <div className="text-xl font-bold text-blue-600">
                      {section.data.historicalData.length}
                    </div>
                    <p
</> className="text-sm text-muted-foreground">Years Analyzed</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg"><>

                    <div className="text-xl font-bold text-purple-600">
                      {formatNumber(section.data.historicalData.reduce((sum: number, d: any) => sum + d.amount, 0))}
                    </div>
                    <p
</> className="text-sm text-muted-foreground">Total PILT</p>
                  </div>
                </div>
                
                <div><>

                  <h4 className="font-medium mb-3">Year-over-Year Analysis</h4>
                  <div
</> className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50"><>

                          <th className="border border-gray-300 px-4 py-2 text-left">Year</th>
                          <th
</> className="border border-gray-300 px-4 py-2 text-right">PILT Amount</th><>

                          <th className="border border-gray-300 px-4 py-2 text-right">Assessed Value</th>
                          <th
</> className="border border-gray-300 px-4 py-2 text-right">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.data.historicalData.map((year: any, idx: number) => {
                          const prevYear = idx > 0 ? section.data.historicalData[idx - 1] : null;
                          const change = prevYear ? ((year.amount - prevYear.amount) / prevYear.amount * 100) : 0;
                          return (
                            <tr key={year.year}><>

                              <td className="border border-gray-300 px-4 py-2 font-medium">{year.year}</td>
                              <td
</> className="border border-gray-300 px-4 py-2 text-right">{formatNumber(year.amount)}</td><>

                              <td className="border border-gray-300 px-4 py-2 text-right">
                                {year.assessedValue ? formatNumber(year.assessedValue) : 'N/A'}
                              </td>
                              <td
</> className={`border border-gray-300 px-4 py-2 text-right ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}`}>
                                {idx > 0 ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'impact':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                  <div className="text-xl font-bold text-blue-600">
                    {formatNumber(section.data.totalImpact)}
                  </div>
                  <p
</> className="text-sm text-muted-foreground">Total Impact</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg"><>

                  <div className="text-xl font-bold text-green-600">
                    {formatNumber(section.data.averagePerDistrict)}
                  </div>
                  <p
</> className="text-sm text-muted-foreground">Avg per District</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg"><>

                  <div className="text-xl font-bold text-purple-600">
                    {section.data.concentrationIndex.toFixed(1)}%
                  </div>
                  <p
</> className="text-sm text-muted-foreground">Top 3 Concentration</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg"><>

                  <div className="text-xl font-bold text-orange-600">
                    {formatNumber(parseFloat(section.data.largestRecipient.amount.toString()))}
                  </div>
                  <p
</> className="text-sm text-muted-foreground">Largest Recipient</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg"><>

                <h4 className="font-medium mb-2">Impact Summary</h4>
                <p
</> className="text-sm text-muted-foreground">
                  <strong>{section.data.largestRecipient.district}</strong> receives the largest allocation, 
                  representing a significant portion of county PILT distributions. The top three districts 
                  account for {section.data.concentrationIndex.toFixed(1)}% of total distributions, 
                  indicating {""}
                  {section.data.concentrationIndex > 75 ? 'high concentration' : 
                   section.data.concentrationIndex > 50 ? 'moderate concentration' : 'distributed allocation'}.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 'metrics':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(section.data).map(([key, value]: [string, any]) => {
                  const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  const percentage = parseFloat(value.toString());
                  
                  return (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2"><>

                        <span className="text-sm font-medium">{displayName}</span>
                        <span
</> className="text-lg font-bold">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentage >= 95 ? 'bg-green-500' :
                            percentage >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {percentage >= 95 ? 'Excellent' :
                         percentage >= 85 ? 'Good' :
                         percentage >= 70 ? 'Fair' : 'Needs Improvement'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 'audit':
        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg"><>

                    <div className="text-xl font-bold text-green-600">{section.data.passedChecks}</div>
                    <p
</> className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg"><>

                    <div className="text-xl font-bold text-yellow-600">{section.data.warningChecks}</div>
                    <p
</> className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg"><>

                    <div className="text-xl font-bold text-red-600">{section.data.failedChecks}</div>
                    <p
</> className="text-sm text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                    <div className="text-xl font-bold text-blue-600">{section.data.totalChecks}</div>
                    <p
</> className="text-sm text-muted-foreground">Total Checks</p>
                  </div>
                </div>

                <div><>

                  <h4 className="font-medium mb-3">Compliance Items</h4>
                  <div
</> className="space-y-2">
                    {section.data.complianceItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg"><>

                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'PASS' ? 'bg-green-500' :
                          item.status === 'WARN' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div
</> className="flex-1"><>

                          <div className="font-medium">{item.item}</div>
                          <div
</> className="text-sm text-muted-foreground">{item.detail}</div>
                        </div>
                        <Badge variant={item.status === 'PASS' ? 'default' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <TrendingUp className="h-6 w-6" />
            Spectacular Report Generator
          </CardTitle>
          <CardDescription
</>>
            Generate comprehensive PILT analysis reports with advanced insights and professional formatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2"><>

              <TabsTrigger value="configure">Configure Report</TabsTrigger>
              <TabsTrigger
</> value="preview" disabled={!generatedReport}>
                Preview & Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="configure" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2"><>

                    <label className="text-sm font-medium">Report Template</label>
                    <Select
</> value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger><>

                        <SelectValue placeholder="Choose a report template" />
                      </SelectTrigger>
                      <SelectContent
</>>
                        {templates?.templates?.map((template: ReportTemplate) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              {getTemplateIcon(template.id)}
                              <div><>

                                <div className="font-medium">{template.name}</div>
                                <div
</> className="text-xs text-muted-foreground">{template.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2"><>

                    <label className="text-sm font-medium">Tax Year</label>
                    <Select
</> value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger><>

                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
</>>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2"><>

                    <label className="text-sm font-medium">Output Format</label>
                    <Select
</> value={selectedFormat} onValueChange={(value: 'html' | 'pdf' | 'excel' | 'json') => setSelectedFormat(value)}>
                      <SelectTrigger><>

                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="html">HTML Report</SelectItem>
                        <SelectItem
</> value="pdf">PDF Document</SelectItem><>

                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem
</> value="json">JSON Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3"><>

                    <label className="text-sm font-medium">Report Options</label>
                    <div
</> className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={includeCharts}
                          onChange={(e) => setIncludeCharts(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Include Charts & Visualizations</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={includeAnalysis}
                          onChange={(e) => setIncludeAnalysis(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Include Advanced Analysis</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTemplate && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getTemplateIcon(selectedTemplate)}
                      <div><>

                        <h4 className="font-medium">
                          {templates?.templates?.find((t: ReportTemplate) => t.id === selectedTemplate)?.name}
                        </h4>
                        <p
</> className="text-sm text-muted-foreground">
                          {templates?.templates?.find((t: ReportTemplate) => t.id === selectedTemplate)?.description}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          Est. {templates?.templates?.find((t: ReportTemplate) => t.id === selectedTemplate)?.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || !selectedYear || generateReportMutation.isPending}
                className="w-full md:w-auto"
                size="lg"
              >
                {generateReportMutation.isPending ? (
                  <>Generating Report...</>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Spectacular Report
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {generatedReport ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div><>

                      <h3 className="text-xl font-bold">{generatedReport.title}</h3>
                      <p
</> className="text-sm text-muted-foreground">
                        Generated on {new Date(generatedReport.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button onClick={handleDownloadReport} disabled={!generatedReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4"><>

                        <div className="text-2xl font-bold text-green-600">
                          {formatNumber(generatedReport.metadata.totalPilt)}
                        </div>
                        <p
</> className="text-sm text-muted-foreground">Total PILT</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4"><>

                        <div className="text-2xl font-bold text-blue-600">
                          {generatedReport.metadata.totalDistricts}
                        </div>
                        <p
</> className="text-sm text-muted-foreground">Districts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4"><>

                        <div className="text-2xl font-bold text-purple-600">
                          {generatedReport.metadata.dataQualityScore}%
                        </div>
                        <p
</> className="text-sm text-muted-foreground">Data Quality</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4"><>

                        <div className="text-2xl font-bold text-orange-600">
                          {generatedReport.metadata.confidenceLevel}%
                        </div>
                        <p
</> className="text-sm text-muted-foreground">Confidence</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {generatedReport.sections && generatedReport.sections.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Report Content</h4>
                      {generatedReport.sections.map(renderReportSection)}
                    </div>
                  )}

                  {generatedReport.insights && generatedReport.insights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Key Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {generatedReport.insights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {generatedReport.recommendations && generatedReport.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {generatedReport.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><>

                  <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
                  <p
</> className="text-muted-foreground">
                    Configure and generate a report to see the preview here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}