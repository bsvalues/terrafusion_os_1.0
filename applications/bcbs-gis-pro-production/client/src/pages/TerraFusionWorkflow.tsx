import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, FileText, MapPin, Settings  } from '@mui/icons-material';

interface WorkflowResult {
  workflow: any;
  validation: any;
  summary: any;
  source: string;
  timestamp: string;
}

interface SM00Report {
  reportId: string;
  parcelNumber: string;
  ownerName: string;
  county: string;
  assessmentData: any;
  sections: any;
  generated: string;
}

interface BLAResult {
  operation: string;
  validation: any;
  recommendations: any[];
  source: string;
}

export default function TerraFusionWorkflow() {
  const [activeTab, setActiveTab] = useState('workflow');
  const [loading, setLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  
  // Workflow state
  const [task, setTask] = useState('');
  const [parcelData, setParcelData] = useState('');
  const [workflowType, setWorkflowType] = useState('');
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  
  // SM00 state
  const [parcelNumber, setParcelNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [legalDescription, setLegalDescription] = useState('');
  const [sm00Result, setSm00Result] = useState<SM00Report | null>(null);
  
  // BLA state
  const [blaOperation, setBlaOperation] = useState('');
  const [sourceParcels, setSourceParcels] = useState('');
  const [targetConfiguration, setTargetConfiguration] = useState('');
  const [blaResult, setBlaResult] = useState<BLAResult | null>(null);

  useEffect(() => {
    checkAgentStatus();
  }, []);

  const checkAgentStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        const status = await response.json();
        setAgentStatus(status);
      }
    } catch (error) {
      setAgentStatus({ status: 'offline', agents: {} });
    }
  };

  const processWorkflow = async () => {
    setLoading(true);
    try {
      let parsedParcelData = {};
      if (parcelData) {
        try {
          parsedParcelData = JSON.parse(parcelData);
        } catch {
          parsedParcelData = { description: parcelData };
        }
      }

      const response = await fetch('/api/terrafusion/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          parcelData: parsedParcelData,
          workflowType
        })
      });

      if (response.ok) {
        const result = await response.json();
        setWorkflowResult(result);
      } else {
        console.error('Workflow processing failed');
      }
    } catch (error) {
      console.error('Workflow error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSM00 = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/terrafusion/sm00', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelNumber,
          ownerName,
          legalDescription
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSm00Result(result);
      } else {
        console.error('SM00 generation failed');
      }
    } catch (error) {
      console.error('SM00 error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processBLA = async () => {
    setLoading(true);
    try {
      let parsedSourceParcels = [];
      let parsedTargetConfig = {};
      
      try {
        parsedSourceParcels = JSON.parse(sourceParcels);
        parsedTargetConfig = JSON.parse(targetConfiguration);
      } catch {
        parsedSourceParcels = [{ description: sourceParcels }];
        parsedTargetConfig = { description: targetConfiguration };
      }

      const response = await fetch('/api/terrafusion/bla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: blaOperation,
          sourceParcels: parsedSourceParcels,
          targetConfiguration: parsedTargetConfig
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBlaResult(result);
      } else {
        console.error('BLA processing failed');
      }
    } catch (error) {
      console.error('BLA error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAgentStatus = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Terrafusion Agent Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Badge variant={agentStatus?.status === 'healthy' ? 'default' : 'destructive'}>
            {agentStatus?.status === 'healthy' ? 'Online' : 'Offline'}
          </Badge>
          {agentStatus?.agents && (
            <div className="flex gap-2">
              {Object.entries(agentStatus.agents).map(([agent, status]) => (
                <Badge key={agent} variant={status ? 'outline' : 'secondary'}>
                  {agent}: {status ? 'Ready' : 'Not Ready'}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderWorkflowTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader><>

          <CardTitle>Multi-Agent Workflow Processing</CardTitle>
          <CardDescription
</>

</>>
            Process complex GIS workflows using WorkflowAgent, JudgeAgent, and NarratorAgent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><>

            <Label htmlFor="task">Task Description</Label>
            <Textarea
</>

              id="task"
              placeholder="Describe the GIS workflow task..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          </div>
          
          <div><>

            <Label htmlFor="workflowType">Workflow Type</Label>
            <Select
</>

value={workflowType} onValueChange={setWorkflowType}>
              <SelectTrigger><>

                <SelectValue placeholder="Select workflow type" />
              </SelectTrigger>
              <SelectContent
</>

</>><>

                <SelectItem value="assessment">Property Assessment</SelectItem>
                <SelectItem
</>

value="agricultural_assessment">Agricultural Assessment</SelectItem><>

                <SelectItem value="wine_country_assessment">Wine Country Assessment</SelectItem>
                <SelectItem
</>

value="boundary_adjustment">Boundary Line Adjustment</SelectItem><>

                <SelectItem value="subdivision_review">Subdivision Review</SelectItem>
                <SelectItem
</>

value="zoning_compliance">Zoning Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div><>

            <Label htmlFor="parcelData">Parcel Data (JSON)</Label>
            <Textarea
</>

              id="parcelData"
              placeholder='{"parcelNumber": "1234567-123-123", "acreage": 5.5, "zoning": "AG"}'
              value={parcelData}
              onChange={(e) => setParcelData(e.target.value)}
            />
          </div>
          
          <Button onClick={processWorkflow} disabled={loading || !task || !workflowType}>
            {loading ? 'Processing...' : 'Process Workflow'}
          </Button>
        </CardContent>
      </Card>

      {workflowResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><>

              <CheckCircle className="h-5 w-5 text-green-600" />
              Workflow Results
            </CardTitle>
            <CardDescription
</>

</>>Source: {workflowResult.source}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowResult.workflow && (
              <div><>

                <h4 className="font-semibold mb-2">Analysis</h4>
                <p
</>

className="text-sm text-gray-600">{workflowResult.workflow.analysis}</p>
                
                {workflowResult.workflow.recommendations && (
                  <div className="mt-4"><>

                    <h5 className="font-medium mb-2">Recommendations</h5>
                    <div
</>

className="space-y-2">
                      {workflowResult.workflow.recommendations.map((rec: any /* , index */: number) => (
                        <div key={index} className="flex items-start gap-2"><>

                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'outline'}>
                            {rec.priority}
                          </Badge>
                          <div
</>

</>><>

                            <div className="font-medium">{rec.action}</div>
                            <div
</>

className="text-sm text-gray-600">{rec.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {workflowResult.validation && (
              <div>
                <Separator className="my-4" /><>

                <h4 className="font-semibold mb-2">Validation Results</h4>
                <div
</>

className="flex items-center gap-2 mb-2">
                  {workflowResult.validation.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{workflowResult.validation.isValid ? 'Valid' : 'Issues Found'}</span>
                  {workflowResult.validation.complianceScore && (
                    <Badge variant="outline">
                      Score: {workflowResult.validation.complianceScore}%
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSM00Tab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader><>

          <CardTitle>SM00 Report Generation</CardTitle>
          <CardDescription
</>

</>>
            Generate property assessment reports for Benton County
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><>

            <Label htmlFor="parcelNumber">Parcel Number</Label>
            <Input
</>

              id="parcelNumber"
              placeholder="1234567-123-123"
              value={parcelNumber}
              onChange={(e) => setParcelNumber(e.target.value)}
            />
          </div>
          
          <div><>

            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
</>

              id="ownerName"
              placeholder="Property owner name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          
          <div><>

            <Label htmlFor="legalDescription">Legal Description</Label>
            <Textarea
</>

              id="legalDescription"
              placeholder="Township/Range/Section legal description"
              value={legalDescription}
              onChange={(e) => setLegalDescription(e.target.value)}
            />
          </div>
          
          <Button onClick={generateSM00} disabled={loading || !parcelNumber}>
            {loading ? 'Generating...' : 'Generate SM00 Report'}
          </Button>
        </CardContent>
      </Card>

      {sm00Result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><>

              <FileText className="h-5 w-5 text-blue-600" />
              SM00 Report: {sm00Result.reportId}
            </CardTitle>
            <CardDescription
</>

</>>Generated for {sm00Result.county}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><>

                <h4 className="font-semibold mb-2">Property Information</h4>
                <div
</>

className="space-y-1 text-sm">
                  <div><strong>Parcel:</strong> {sm00Result.parcelNumber}</div>
                  <div><strong>Owner:</strong> {sm00Result.ownerName}</div>
                  {sm00Result.assessmentData && (
                    <div><strong>Assessed Value:</strong> ${sm00Result.assessmentData.assessedValue?.toLocaleString()}</div>
                  )}
                </div>
              </div>
              
              {sm00Result.sections && (
                <div><>

                  <h4 className="font-semibold mb-2">Report Sections</h4>
                  <div
</>

className="space-y-1 text-sm">
                    {Object.entries(sm00Result.sections).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value as string}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderBLATab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader><>

          <CardTitle>Boundary Line Adjustment Processing</CardTitle>
          <CardDescription
</>

</>>
            Process BLA operations with compliance validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><>

            <Label htmlFor="blaOperation">Operation Type</Label>
            <Select
</>

value={blaOperation} onValueChange={setBlaOperation}>
              <SelectTrigger><>

                <SelectValue placeholder="Select BLA operation" />
              </SelectTrigger>
              <SelectContent
</>

</>><>

                <SelectItem value="boundary_adjustment">Boundary Line Adjustment</SelectItem>
                <SelectItem
</>

value="merge">Parcel Merge</SelectItem>
                <SelectItem value="split">Parcel Split</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div><>

            <Label htmlFor="sourceParcels">Source Parcels (JSON Array)</Label>
            <Textarea
</>

              id="sourceParcels"
              placeholder='[{"parcelNumber": "1234567-123-123", "acreage": 5.0, "zoning": "R-1"}]'
              value={sourceParcels}
              onChange={(e) => setSourceParcels(e.target.value)}
            />
          </div>
          
          <div><>

            <Label htmlFor="targetConfiguration">Target Configuration (JSON)</Label>
            <Textarea
</>

              id="targetConfiguration"
              placeholder='{"parcels": [{"acreage": 2.5, "zoning": "R-1"}, {"acreage": 2.5, "zoning": "R-1"}]}'
              value={targetConfiguration}
              onChange={(e) => setTargetConfiguration(e.target.value)}
            />
          </div>
          
          <Button onClick={processBLA} disabled={loading || !blaOperation || !sourceParcels}>
            {loading ? 'Processing...' : 'Process BLA'}
          </Button>
        </CardContent>
      </Card>

      {blaResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><>

              <MapPin className="h-5 w-5 text-purple-600" />
              BLA Results: {blaResult.operation}
            </CardTitle>
            <CardDescription
</>

</>>Source: {blaResult.source}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {blaResult.validation && (
              <div><>

                <h4 className="font-semibold mb-2">Validation Status</h4>
                <div
</>

className="flex items-center gap-2 mb-4">
                  {blaResult.validation.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{blaResult.validation.isValid ? 'Compliant' : 'Issues Found'}</span>
                  {blaResult.validation.complianceScore && (
                    <Badge variant="outline">
                      Score: {blaResult.validation.complianceScore}%
                    </Badge>
                  )}
                </div>
                
                {blaResult.validation.requirements && (
                  <div><>

                    <h5 className="font-medium mb-2">Requirements</h5>
                    <ul
</>

className="list-disc list-inside space-y-1 text-sm">
                      {blaResult.validation.requirements.map((req: string /* , index */: number) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {blaResult.recommendations && blaResult.recommendations.length > 0 && (
              <div>
                <Separator className="my-4" /><>

                <h4 className="font-semibold mb-2">Recommendations</h4>
                <div
</>

className="space-y-2">
                  {blaResult.recommendations.map((rec: any /* , index */: number) => (
                    <div key={index} className="flex items-start gap-2"><>

                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'outline'}>
                        {rec.priority}
                      </Badge>
                      <div
</>

</>><>

                        <div className="font-medium">{rec.action}</div>
                        <div
</>

className="text-sm text-gray-600">{rec.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6"><>

        <h1 className="text-3xl font-bold mb-2">Terrafusion AI Workflow Assistant</h1>
        <p
</>

className="text-gray-600">
          Advanced GIS workflow processing for Benton County, Washington
        </p>
      </div>

      {renderAgentStatus()}

      <div className="mb-6">
        <div className="flex space-x-1 border-b">
          {[
            { id: 'workflow', label: 'Multi-Agent Workflow' },
            { id: 'sm00', label: 'SM00 Reports' },
            { id: 'bla', label: 'Boundary Line Adjustments' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'workflow' && renderWorkflowTab()}
      {activeTab === 'sm00' && renderSM00Tab()}
      {activeTab === 'bla' && renderBLATab()}
    </div>
  );
}