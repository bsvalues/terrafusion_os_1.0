import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Mail, Calendar, Building, Loader2, BarChart3  } from '@mui/icons-material';
import { Badge } from '@/components/ui/badge';
import SpectacularReportGenerator from '@/components/SpectacularReportGenerator';

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState('2023');
  const [reportType, setReportType] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState({
    office: 'Washington State Department of Education',
    contact: 'PILT Coordinator',
    address: '600 Washington St SE, Olympia, WA 98504'
  });

  // Fetch actual PILT data
  const { data: piltHistory } = useQuery({
    queryKey: ['/api/pilt/history']
  });

  const { data: distributions } = useQuery({
    queryKey: ['/api/pilt/distribution']
  });

  const { data: districts } = useQuery({
    queryKey: ['/api/districts']
  });

  // Get data for the selected year
  const yearData = piltHistory ? (piltHistory as any[]).find((item: any) => item.year === selectedYear) : null;
  const yearDistributions = distributions ? (distributions as any[]).filter((item: any) => item.year === selectedYear) : [];
  const totalDistributed = yearDistributions.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  const reportTypes = [
    {
      id: 'assessor-letter',
      title: 'Assessor Letter to DOE',
      description: 'Official letter from County Assessor to Department of Energy regarding PILT distributions',
      template: 'assessor-doe-letter'
    },
    {
      id: 'pilt-summary',
      title: 'PILT Summary Report',
      description: 'Comprehensive summary of PILT receipts and distributions for the year',
      template: 'pilt-summary'
    },
    {
      id: 'district-breakdown',
      title: 'District Distribution Report',
      description: 'Detailed breakdown of PILT distributions by school district',
      template: 'district-breakdown'
    },
    {
      id: 'treasurer-letter',
      title: 'Treasurer Letter to DOE',
      description: 'Official correspondence from County Treasurer to Department of Energy regarding PILT fund management',
      template: 'treasurer-doe-letter'
    }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/pilt/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const reportData = await response.json();
      
      if (reportData.success) {
        // Format the report as HTML with proper styling
        const htmlContent = `
<!DOCTYPE html>
<html>
<head><>

    <title>PILT Certification - ${selectedYear}</title>
    <style
</>>
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            margin: 1in; 
            white-space: pre-wrap; 
            line-height: 1.2;
        }
        .letterhead {
            text-align: left;
            margin-bottom: 20px;
        }
        .signature-block {
            margin-top: 40px;
            margin-bottom: 40px;
        }
        .data-table {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            margin-top: 30px;
        }
    </style>
</head>
<body>
<div class="letterhead">
${reportData.certification_letter}
</div>
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
          alert('Please allow popups to view the report');
        }
      } else {
        throw new Error('Report generation failed');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = (type: string, year: string, currentDate: string, recipientInfo: any, customMessage: string, reportData: any) => {
    let letterContent = '';
    
    if (type === 'assessor-letter') {
      letterContent = generateAssessorLetter(year, currentDate, recipientInfo, customMessage, reportData);
    } else if (type === 'treasurer-letter') {
      letterContent = generateTreasurerLetter(year, currentDate, recipientInfo, customMessage, reportData);
    } else if (type === 'pilt-summary') {
      letterContent = generatePiltSummary(year, currentDate, customMessage, reportData);
    } else if (type === 'district-breakdown') {
      letterContent = generateDistrictBreakdown(year, currentDate, customMessage, reportData);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"><>

  <title>${type === 'assessor-letter' ? 'Assessor' : type === 'treasurer-letter' ? 'Treasurer' : 'PILT Summary'} Letter - ${year}</title>
  <style
</>>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; color: #333; background: white; }
    .letter-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #005f73; padding-bottom: 20px; }
    .county-letterhead h1 { font-size: 24px; margin: 0; color: #005f73; font-weight: bold; }
    .county-letterhead h2 { font-size: 18px; margin: 5px 0; color: #0a9396; font-weight: bold; }
    .county-letterhead p { margin: 10px 0 0 0; font-size: 12px; color: #666; }
    .letter-date { text-align: right; margin: 30px 0; font-size: 14px; }
    .recipient-info { margin: 30px 0; font-size: 14px; line-height: 1.4; }
    .letter-subject { margin: 20px 0; font-weight: bold; font-size: 14px; }
    .letter-body { margin: 20px 0; font-size: 14px; }
    .letter-body p { margin: 15px 0; text-align: justify; }
    .signature-block { margin: 40px 0 20px 0; font-size: 14px; }
    .cc-line { margin-top: 30px; font-size: 12px; }
    .footer { text-align: center; font-size: 10px; margin-top: 50px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    .data-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
    .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .data-table th { background-color: #f5f5f5; font-weight: bold; }
    .data-table td:nth-child(2), .data-table td:nth-child(3) { text-align: right; }
    .summary-box { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #005f73; }
  </style>
</head>
<body>
  ${letterContent}
  <div class="footer">
    Generated by Benton County PILT Dashboard - ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
  };

  const generateAssessorLetter = (year: string, currentDate: string, recipientInfo: any, customMessage: string, reportData: any) => {
    const distributionTable = reportData.distributions.map((dist: any) => 
      `<tr><>

        <td>${dist.district}</td>
        <td
</> style="text-align: right;">${formatCurrency(dist.amount)}</td>
        <td style="text-align: right;">${((dist.amount / reportData.totalDistributed) * 100).toFixed(2)}%</td>
      </tr>`
    ).join('');

    return `
    <div class="letter-header">
      <div class="county-letterhead"><>

        <h1>BENTON COUNTY</h1>
        <h2
</>>ASSESSOR'S OFFICE</h2>
        <p>7122 W. Okanogan Place, Building A<br>
        Kennewick, WA 99336<br>
        Phone: (509) 736-3085</p>
      </div>
    </div>

    <div class="letter-date">
      <p>${currentDate}</p>
    </div>

    <div class="recipient-info">
      <p>${recipientInfo.office}<br>
      Attn: ${recipientInfo.contact}<br>
      ${recipientInfo.address.replace(/\n/g, '<br>')}</p>
    </div>

    <div class="letter-subject">
      <p><strong>RE: Payment in Lieu of Taxes (PILT) Distribution - ${year}</strong></p>
    </div>

    <div class="letter-body"><>

      <p>Dear ${recipientInfo.contact},</p>
      
      <p
</>>I am writing to provide you with the official report regarding the Payment in Lieu of Taxes (PILT) 
      distribution for Benton County for the year ${year}.</p>
      
      <div class="summary-box">
        <p><strong>Total PILT Received:</strong> ${formatCurrency(reportData.piltAmount)}</p>
        <p><strong>Total Distributed:</strong> ${formatCurrency(reportData.totalDistributed)}</p>
        <p><strong>Number of Districts:</strong> ${reportData.distributions.length}</p>
      </div><>

      
      <p>This amount has been distributed among the eligible school districts within our county in accordance with 
      RCW 84.12.270 and established procedures for PILT fund allocation based on assessed valuation and enrollment data.</p>
      
      <div
</> style="margin: 20px 0;"><>

        <h3>PILT Distribution Summary - ${year}</h3>
        <table
</> class="data-table">
          <thead>
            <tr><>

              <th>School District</th>
              <th
</>>Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${distributionTable}
            <tr style="background-color: #f9f9f9; font-weight: bold;"><>

              <td>TOTAL DISTRIBUTED</td>
              <td
</> style="text-align: right;">${formatCurrency(reportData.totalDistributed)}</td>
              <td style="text-align: right;">100.00%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      ${customMessage ? `<p>${customMessage}</p>` : ''}<>

      
      <p>If you require any additional information or documentation regarding this distribution, 
      please do not hesitate to contact our office.</p>
      
      <p
</>>Sincerely,</p>
      
      <div class="signature-block">
        <p><br><br>
        _________________________________<br>
        Benton County Assessor<br>
        Benton County, Washington</p>
      </div>
      
      <p class="cc-line">cc: Benton County Treasurer<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;School District Superintendents</p>
    </div>
  `;
  };

  const generateTreasurerLetter = (year: string, currentDate: string, recipientInfo: any, customMessage: string, reportData: any) => {
    return `
    <div class="letter-header">
      <div class="county-letterhead"><>

        <h1>BENTON COUNTY</h1>
        <h2
</>>TREASURER'S OFFICE</h2>
        <p>7122 W. Okanogan Place, Building A<br>
        Kennewick, WA 99336<br>
        Phone: (509) 736-3031</p>
      </div>
    </div>

    <div class="letter-date">
      <p>${currentDate}</p>
    </div>

    <div class="recipient-info">
      <p>${recipientInfo.office}<br>
      Attn: ${recipientInfo.contact}<br>
      ${recipientInfo.address.replace(/\n/g, '<br>')}</p>
    </div>

    <div class="letter-subject">
      <p><strong>RE: PILT Fund Management and Distribution Report - ${year}</strong></p>
    </div>

    <div class="letter-body"><>

      <p>Dear ${recipientInfo.contact},</p>
      
      <p
</>>This letter serves as the official report from the Benton County Treasurer's Office regarding 
      the management and distribution of Payment in Lieu of Taxes (PILT) funds for ${year}.</p>
      
      <div class="summary-box">
        <p><strong>PILT Funds Managed:</strong> ${formatCurrency(reportData.piltAmount)}</p>
        <p><strong>Total Distributions Made:</strong> ${formatCurrency(reportData.totalDistributed)}</p>
        <p><strong>Distribution Date:</strong> ${currentDate}</p>
      </div>
      
      <p>All distributions have been made in accordance with state regulations and county procedures. 
      Complete financial records are maintained in our office and are available for audit upon request.</p>
      
      ${customMessage ? `<p>${customMessage}</p>` : ''}<>

      
      <p>Please contact our office if you require any additional financial documentation or clarification 
      regarding these distributions.</p>
      
      <p
</>>Respectfully,</p>
      
      <div class="signature-block">
        <p><br><br>
        _________________________________<br>
        Benton County Treasurer<br>
        Benton County, Washington</p>
      </div>
    </div>
  `;
  };

  const generatePiltSummary = (year: string, currentDate: string, customMessage: string, reportData: any) => {
    const distributionTable = reportData.distributions.map((dist: any) => 
      `<tr><>

        <td>${dist.district}</td>
        <td
</> style="text-align: right;">${formatCurrency(dist.amount)}</td>
        <td style="text-align: right;">${((dist.amount / reportData.totalDistributed) * 100).toFixed(2)}%</td>
      </tr>`
    ).join('');

    return `
    <div class="letter-header">
      <div class="county-letterhead"><>

        <h1>BENTON COUNTY</h1>
        <h2
</>>PILT SUMMARY REPORT</h2>
        <p>Payment in Lieu of Taxes - Year: ${year}</p>
      </div>
    </div>

    <div class="letter-body"><>

      <h3>Executive Summary</h3>
      <p
</>>This report provides a comprehensive summary of Payment in Lieu of Taxes (PILT) receipts 
      and distributions for Benton County for the year ${year}.</p>
      
      <div class="summary-box"><>

        <h4>Key Financial Figures</h4>
        <p
</>><strong>Total PILT Received:</strong> ${formatCurrency(reportData.piltAmount)}</p>
        <p><strong>Total Distributed:</strong> ${formatCurrency(reportData.totalDistributed)}</p>
        <p><strong>Number of Receiving Districts:</strong> ${reportData.distributions.length}</p>
        <p><strong>Report Generated:</strong> ${currentDate}</p>
      </div><>

      
      <h3>Distribution Details</h3>
      <table
</> class="data-table">
        <thead>
          <tr><>

            <th>School District</th>
            <th
</>>Distribution Amount</th>
            <th>Percentage of Total</th>
          </tr>
        </thead>
        <tbody>
          ${distributionTable}
          <tr style="background-color: #f9f9f9; font-weight: bold;"><>

            <td>TOTAL</td>
            <td
</> style="text-align: right;">${formatCurrency(reportData.totalDistributed)}</td>
            <td style="text-align: right;">100.00%</td>
          </tr>
        </tbody>
      </table>
      
      ${customMessage ? `<div><h3>Additional Notes</h3><p>${customMessage}</p></div>` : ''}
    </div>
  `;
  };

  const generateDistrictBreakdown = (year: string, currentDate: string, customMessage: string, reportData: any) => {
    const districtDetails = reportData.distributions.map((dist: any) => 
      `<div class="district-detail"><>

        <h4>${dist.district}</h4>
        <p
</>><strong>Distribution Amount:</strong> ${formatCurrency(dist.amount)}</p>
        <p><strong>Percentage of Total:</strong> ${((dist.amount / reportData.totalDistributed) * 100).toFixed(2)}%</p>
      </div>`
    ).join('');

    return `
    <div class="letter-header">
      <div class="county-letterhead"><>

        <h1>BENTON COUNTY</h1>
        <h2
</>>DISTRICT DISTRIBUTION REPORT</h2>
        <p>Detailed PILT Distribution Breakdown - Year: ${year}</p>
      </div>
    </div>

    <div class="letter-body"><>

      <h3>Distribution Overview</h3>
      <div
</> class="summary-box">
        <p><strong>Total PILT Amount:</strong> ${formatCurrency(reportData.piltAmount)}</p>
        <p><strong>Total Distributed:</strong> ${formatCurrency(reportData.totalDistributed)}</p>
        <p><strong>Report Date:</strong> ${currentDate}</p>
      </div>
      
      <h3>Individual District Distributions</h3>
      ${districtDetails}
      
      ${customMessage ? `<div><h3>Additional Information</h3><p>${customMessage}</p></div>` : ''}
    </div>
  `;
  };

  const selectedReportType = reportTypes.find(rt => rt.id === reportType);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold tracking-tight">Reports & Letters</h1>
          <p
</> className="text-muted-foreground">
            Generate official reports and correspondence for the Department of Education
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Benton County Assessor's Office
        </Badge>
      </div>

      <Tabs defaultValue="official" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="official" className="flex items-center gap-2"><>

            <FileText className="h-4 w-4" />
            Official Letters
          </TabsTrigger>
          <TabsTrigger
</> value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="official">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
              <CardDescription
</>>
                Configure the parameters for your report generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><>

                  <Label htmlFor="year">Report Year</Label>
                  <Select
</> value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent
</>>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="report-type">Report Type</Label>
                  <Select
</> value={reportType} onValueChange={setReportType}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent
</>>
                      {reportTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedReportType && (
                <div className="p-4 border rounded-lg bg-muted/50"><>

                  <h4 className="font-medium">{selectedReportType.title}</h4>
                  <p
</> className="text-sm text-muted-foreground mt-1">
                    {selectedReportType.description}
                  </p>
                </div>
              )}

              {yearData && (
                <div className="p-4 border rounded-lg bg-green-50"><>

                  <h4 className="font-medium text-green-800">Data Available for {selectedYear}</h4>
                  <p
</> className="text-sm text-green-600 mt-1">
                    PILT Amount: {formatCurrency(yearData.amount)} | 
                    Districts: {yearDistributions.length} | 
                    Total Distributed: {formatCurrency(totalDistributed)}
                  </p>
                </div>
              )}

              {!yearData && yearDistributions.length === 0 && (
                <div className="p-4 border rounded-lg bg-yellow-50"><>

                  <h4 className="font-medium text-yellow-800">Limited Data for {selectedYear}</h4>
                  <p
</> className="text-sm text-yellow-600 mt-1">
                    No complete data available for this year. Please select a different year.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Mail className="h-5 w-5" />
                Recipient Information
              </CardTitle>
              <CardDescription
</>>
                Configure the recipient details for official correspondence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><>

                <Label htmlFor="office">Office/Department</Label>
                <Input
</>
                  id="office"
                  value={recipientInfo.office}
                  onChange={(e) => setRecipientInfo({...recipientInfo, office: e.target.value})}
                />
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="contact">Contact Person</Label>
                <Input
</>
                  id="contact"
                  value={recipientInfo.contact}
                  onChange={(e) => setRecipientInfo({...recipientInfo, contact: e.target.value})}
                />
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="address">Mailing Address</Label>
                <Textarea
</>
                  id="address"
                  value={recipientInfo.address}
                  onChange={(e) => setRecipientInfo({...recipientInfo, address: e.target.value})}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><>

              <CardTitle>Custom Message</CardTitle>
              <CardDescription
</>>
                Add any additional information or notes for the report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any additional information to include in the report..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Report Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Selected Year:</span>
                <Badge
</> variant="secondary">{selectedYear}</Badge>
              </div>
              
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Report Type:</span>
                <Badge
</> variant={reportType ? "default" : "outline"}>
                  {reportType ? "Selected" : "Not Selected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between"><>

                <span className="text-sm">Data Status:</span>
                <Badge
</> variant={yearData || yearDistributions.length > 0 ? "default" : "destructive"}>
                  {yearData || yearDistributions.length > 0 ? "Available" : "No Data"}
                </Badge>
              </div>

              <div className="flex items-center justify-between"><>

                <span className="text-sm">Generation Date:</span>
                <span
</> className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <Separator />

              <Button
                onClick={handleGenerateReport}
                disabled={!reportType || isGenerating || (!yearData && yearDistributions.length === 0)}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <SpectacularReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}