import React, {useState, useEffect, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';
import {Gavel,
  FileText,
  MapPin,
  Search,
  Download,
  Copy,
  History,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Save,
  RefreshCw,
  Settings,
  BookOpen,
  Target,
  Zap,
  BarChart3,} from '@mui/icons-material';

interface LegalDescription {id: string;
  propertyId: string;
  description: string;
  generatedAt: Date;
  accuracy: number;
  confidence: number;
  method: 'ai-generated' | 'manual' | 'hybrid';
  status: 'draft' | 'reviewed' | 'approved' | 'archived';
  metadata: {
    parcelNumber?: string;
    township?: string;
    range?: string;
    section?: string;
    subdivision?: string;
    lotNumber?: string;
    blockNumber?: string;
    county: string;
    state: string;
    coordinates?: { lat: number; lng: number};
    acreage?: number;
    zoning?: string;
  };
  validationResults?: ValidationResult[];
  history: HistoryEntry[];
}

interface ValidationResult {id: string;
  type: 'format' | 'accuracy' | 'completeness' | 'legal';
  status: 'pass' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';}

interface HistoryEntry {id: string;
  timestamp: Date;
  action: string;
  user: string;
  details: string;
  previousValue?: string;
  newValue?: string;}

interface GenerationRequest {propertyId: string;
  parcelNumber?: string;
  coordinates?: { lat: number; lng: number};
  existingData?: Partial<LegalDescription['metadata']>;
  generationMethod: 'ai-assisted' | 'template-based' | 'coordinate-based' | 'parcel-based';
  includeValidation: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface AgentStats {totalGenerated: number;
  accuracyRate: number;
  averageProcessingTime: number;
  validationSuccessRate: number;
  methodDistribution: { [key: string]: number};
}

export default function LegalDescriptionAgentPage() {const [descriptions, setDescriptions] = useState<LegalDescription[]>([]);
  const [selectedDescription, setSelectedDescription] = useState<LegalDescription | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationRequest, setGenerationRequest] = useState<GenerationRequest>({
    propertyId: '',
    generationMethod: 'ai-assisted',
    includeValidation: true,
    priority: 'normal',});
  const [stats, setStats] = useState<AgentStats>({
    totalGenerated: 0,
    accuracyRate: 0,
    averageProcessingTime: 0,
    validationSuccessRate: 0,
    methodDistribution: {},
  });
  const [selectedTab, setSelectedTab] = useState('generate');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Sample legal description templates
  const legalTemplates = [
    'A tract of land located in the [SECTION] [TOWNSHIP] [RANGE], [COUNTY] County, [STATE], more particularly described as: [DETAILED_DESCRIPTION]',
    'That certain real property situated in [COUNTY] County, [STATE], and being more particularly described as follows: [METES_AND_BOUNDS]',
    'Beginning at [POINT_OF_BEGINNING], thence [DIRECTION] [DISTANCE] to [NEXT_POINT], continuing [DESCRIPTION] back to the point of beginning, containing [ACREAGE] acres, more or less.',
    'Lot [LOT_NUMBER], Block [BLOCK_NUMBER], [SUBDIVISION_NAME], according to the plat thereof recorded in [PLAT_BOOK] [PAGE], [COUNTY] County Records, [STATE].',
  ];

  // Generate legal description
  const generateLegalDescription = async () => {if (!generationRequest.propertyId) {
      alert('Property ID is required');
      return;}

    setIsGenerating(true);

    try {// Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      const newDescription = await simulateAIGeneration(generationRequest);

      setDescriptions(prev => [newDescription, ...prev]);
      setSelectedDescription(newDescription);
      setSelectedTab('descriptions');

      // Run validation if requested
      if (generationRequest.includeValidation) {
        const validation = await validateLegalDescription(newDescription);
        setValidationResults(validation);}

      updateStats();
    } catch (error) {console.error('Generation failed:', error);
      alert('Failed to generate legal description. Please try again.');} finally {setIsGenerating(false);}
  };

  // Simulate AI generation
  const simulateAIGeneration = async (request: GenerationRequest): Promise<LegalDescription> => {// Mock coordinates for demonstration
    const mockCoords = request.coordinates || {
      lat: 46.2644 + (Math.random() - 0.5) * 0.1,
      lng: -123.1365 + (Math.random() - 0.5) * 0.1,};

    const sections = ['Section 15', 'Section 22', 'Section 28', 'Section 03'];
    const townships = ['Township 12 North', 'Township 11 North', 'Township 13 North'];
    const ranges = ['Range 5 West', 'Range 4 West', 'Range 6 West'];

    const section = sections[Math.floor(Math.random() * sections.length)];
    const township = townships[Math.floor(Math.random() * townships.length)];
    const range = ranges[Math.floor(Math.random() * ranges.length)];

    let description = '';

    switch (request.generationMethod) {
      case 'ai-assisted':
        description = `A tract of land located in ${section}, ${township}, ${range}, Benton County, Washington, more particularly described as: Beginning at a point that is North 89°52'15" East, 1,247.83 feet from the Southwest corner of said ${section}; thence North 00°07'45" West, 652.17 feet; thence North 89°52'15" East, 435.60 feet; thence South 00°07'45" East, 652.17 feet; thence South 89°52'15" West, 435.60 feet to the point of beginning. Containing 6.52 acres, more or less.`;
        break;

      case 'template-based':
        description = `Lot 7, Block 2, Meadowbrook Subdivision, according to the plat thereof recorded in Volume 15, Page 42, Benton County Records, Washington State. Also known as Parcel Number ${request.parcelNumber || '123-456-789'}.`;
        break;

      case 'coordinate-based':
        description = `That certain real property situated in Benton County, Washington, and being more particularly described as follows: A parcel of land located at coordinates ${mockCoords.lat.toFixed(6)}°N, ${mockCoords.lng.toFixed(6)}°W, encompassing all land within a 200-foot radius of said coordinates, as measured from the property centerpoint.`;
        break;

      case 'parcel-based':
        description = `All that certain real property located in Benton County, Washington, identified as Parcel Number ${request.parcelNumber || '987-654-321'}, and being more particularly described in Deed Book 1247, Page 156, Benton County Records.`;
        break;

      default:
        description = `Property located in Benton County, Washington, identified as ${request.propertyId}.`;
    }

    const newDescription: LegalDescription = {
      id: `ld-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      propertyId: request.propertyId,
      description,
      generatedAt: new Date(),
      accuracy: Math.floor(Math.random() * 20) + 80, // 80-100%
      confidence: Math.floor(Math.random() * 15) + 85, // 85-100%
      method:
        request.generationMethod === 'ai-assisted'
          ? 'ai-generated'
          : request.generationMethod === 'template-based'
            ? 'manual'
            : 'hybrid',
      status: 'draft',
      metadata: {
        parcelNumber:
          request.parcelNumber ||
          `${Math.floor(Math.random() * 999) + 100}-${Math.floor(Math.random() * 999) + 100}-${Math.floor(Math.random() * 999) + 100}`,
        township: township.replace('Township ', ''),
        range: range.replace('Range ', ''),
        section: section.replace('Section ', ''),
        county: 'Benton',
        state: 'Washington',
        coordinates: mockCoords,
        acreage: Math.round((Math.random() * 50 + 1) * 100) / 100,
        zoning: ['R-1', 'R-2', 'C-1', 'M-1', 'A-1'][Math.floor(Math.random() * 5)],
      },
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date(),
          action: 'Generated',
          user: 'AI Agent',
          details: `Generated using ${request.generationMethod} method`,
        },
      ],
    };

    return newDescription;
  };

  // Validate legal description
  const validateLegalDescription = async (
    description: LegalDescription
  ): Promise<ValidationResult[]>=> {const results: ValidationResult[] = [];

    // Format validation
    if (description.description.length< 50) {
      results.push({
        id: 'format-1',
        type: 'format',
        status: 'warning',
        message: 'Description appears too short for a complete legal description',
        suggestion: 'Consider adding more specific boundary details',
        severity: 'medium',});
    }

    if (!description.description.includes('County')) {results.push({
        id: 'format-2',
        type: 'format',
        status: 'error',
        message: 'County reference missing from description',
        suggestion: 'Add county name to the legal description',
        severity: 'high',});
    }

    // Accuracy validation
    if (description.accuracy < 90) {results.push({
        id: 'accuracy-1',
        type: 'accuracy',
        status: 'warning',
        message: 'AI confidence below 90%',
        suggestion: 'Review and verify description accuracy',
        severity: 'medium',});
    }

    // Completeness validation
    if (!description.metadata.parcelNumber) {results.push({
        id: 'completeness-1',
        type: 'completeness',
        status: 'warning',
        message: 'Parcel number not specified',
        suggestion: 'Add parcel number for complete identification',
        severity: 'low',});
    }

    // Legal validation
    if (!description.description.includes('more particularly described')) {results.push({
        id: 'legal-1',
        type: 'legal',
        status: 'warning',
        message: 'Standard legal description phrasing not detected',
        suggestion: 'Consider using standard legal description language',
        severity: 'low',});
    }

    // Add success validation if no errors
    if (results.length === 0) {results.push({
        id: 'validation-success',
        type: 'format',
        status: 'pass',
        message: 'Legal description validation passed',
        severity: 'low',});
    }

    return results;
  };

  // Update statistics
  const updateStats = () =>{const completed = descriptions.filter(d => d.status !== 'draft');
    const totalAccuracy = descriptions.reduce((sum, d) => sum + d.accuracy, 0);
    const methodCounts: { [key: string]: number} = {};

    descriptions.forEach(d => {methodCounts[d.method] = (methodCounts[d.method] || 0) + 1;});

    setStats({totalGenerated: descriptions.length,
      accuracyRate: descriptions.length > 0 ? totalAccuracy / descriptions.length : 0,
      averageProcessingTime: 3.2, // Mock processing time
      validationSuccessRate: Math.random() * 20 + 80, // Mock success rate
      methodDistribution: methodCounts,});
  };

  // Filter descriptions
  const filteredDescriptions = descriptions.filter(desc => {if (filterStatus && desc.status !== filterStatus) return false;
    if (
      searchTerm &&
      !desc.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !desc.propertyId.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;});

  // Copy to clipboard
  const copyToClipboard = (text: string) => {navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');};

  // Update description status
  const updateDescriptionStatus = (
    descriptionId: string,
    newStatus: LegalDescription['status']
  ) => {
    setDescriptions(prev =>
      prev.map(desc =>
        desc.id === descriptionId
          ? {
              ...desc,
              status: newStatus,
              history: [
                ...desc.history,
                {
                  id: `hist-${Date.now()}`,
                  timestamp: new Date(),
                  action: `Status Changed`,
                  user: 'User',
                  details: `Changed status to ${newStatus}`,
                },
              ],
            }
          : desc
      )
    );
  };

  // Get status color
  const getStatusColor = (status: LegalDescription['status']) => {switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'reviewed':
        return 'text-blue-600';
      case 'archived':
        return 'text-gray-600';
      default:
        return 'text-yellow-600';}
  };

  // Get validation severity color
  const getSeverityColor = (severity: ValidationResult['severity']) => {switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';}
  };

  // Update stats when descriptions change
  useEffect(() => {updateStats();}, [descriptions]);

  return (<div className="container mx-auto p-6 space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold flex items-center gap-2"><Gavel className="h-8 w-8" />Legal Description Agent</h1><p className="text-muted-foreground">AI-powered legal description generation and validation</p></div><div className="flex items-center gap-2"><Badge variant="outline">{descriptions.length} Descriptions</Badge><Badge variant="outline">{Math.round(stats.accuracyRate)}% Accuracy</Badge></div></div>{/* Statistics Dashboard */}<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Generated</p><p className="text-2xl font-bold">{stats.totalGenerated}</p></div><FileText className="h-8 w-8 text-blue-600" /></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Accuracy Rate</p><p className="text-2xl font-bold">{Math.round(stats.accuracyRate)}%</p></div><Target className="h-8 w-8 text-green-600" /></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Avg Processing</p><p className="text-2xl font-bold">{stats.averageProcessingTime}s</p></div><Zap className="h-8 w-8 text-purple-600" /></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Validation Rate</p><p className="text-2xl font-bold">{Math.round(stats.validationSuccessRate)}%</p></div><CheckCircle className="h-8 w-8 text-orange-600" /></div></CardContent></Card></div><Tabs value={selectedTab} onValueChange={setSelectedTab}><TabsList className="grid w-full grid-cols-4"><TabsTrigger value="generate">Generate</TabsTrigger><TabsTrigger value="descriptions">Descriptions</TabsTrigger><TabsTrigger value="validation">Validation</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger></TabsList><TabsContent value="generate" className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Generate Legal Description</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="propertyId">Property ID *</Label><Input
                    id="propertyId"
                    placeholder="Enter property identifier"
                    value={generationRequest.propertyId}
                    onChange={e =>
                      setGenerationRequest(prev => ({ ...prev, propertyId: e.target.value}))
                    }
                  /></div><div><Label htmlFor="parcelNumber">Parcel Number</Label><Input
                    id="parcelNumber"
                    placeholder="e.g., 123-456-789"
                    value={generationRequest.parcelNumber || ''}
                    onChange={e =>
                      setGenerationRequest(prev => ({ ...prev, parcelNumber: e.target.value}))
                    }
                  /></div><div className="grid grid-cols-2 gap-4"><div><Label htmlFor="latitude">Latitude</Label><Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="46.2644"
                      value={generationRequest.coordinates?.lat || ''}
                      onChange={e =>
                        setGenerationRequest(prev => ({
                          ...prev,
                          coordinates: {
                            ...prev.coordinates,
                            lat: parseFloat(e.target.value) || 0,
                            lng: prev.coordinates?.lng || 0,},
                        }))
                      }
                    /></div><div><Label htmlFor="longitude">Longitude</Label><Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="-123.1365"
                      value={generationRequest.coordinates?.lng || ''}
                      onChange={e =>
                        setGenerationRequest(prev => ({
                          ...prev,
                          coordinates: {
                            lat: prev.coordinates?.lat || 0,
                            lng: parseFloat(e.target.value) || 0,},
                        }))
                      }
                    /></div></div><div><Label htmlFor="method">Generation Method</Label><Select
                    value={generationRequest.generationMethod}
                    onValueChange={(value: any) =>
                      setGenerationRequest(prev => ({ ...prev, generationMethod: value}))
                    }
                  ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ai-assisted">AI Assisted</SelectItem><SelectItem value="template-based">Template Based</SelectItem><SelectItem value="coordinate-based">Coordinate Based</SelectItem><SelectItem value="parcel-based">Parcel Based</SelectItem></SelectContent></Select></div><div><Label htmlFor="priority">Priority Level</Label><Select
                    value={generationRequest.priority}
                    onValueChange={(value: any) =>
                      setGenerationRequest(prev => ({ ...prev, priority: value}))
                    }
                  ><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div><div className="flex items-center space-x-2"><input
                    type="checkbox"
                    id="includeValidation"
                    checked={generationRequest.includeValidation}
                    onChange={e =>
                      setGenerationRequest(prev => ({
                        ...prev,
                        includeValidation: e.target.checked,}))
                    }
                  /><Label htmlFor="includeValidation">Include automatic validation</Label></div><Button
                  onClick={generateLegalDescription}
                  disabled={isGenerating || !generationRequest.propertyId}
                  className="w-full"
                >{isGenerating ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Generating...</>) : (<><Zap className="h-4 w-4 mr-2" />Generate Legal Description</>)}</Button></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Templates & Examples</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Available Templates</Label><div className="space-y-2 mt-2">{legalTemplates.map((template, index) => (<div key={index} className="p-3 border rounded-lg"><p className="text-sm">{template}</p><Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => copyToClipboard(template)}
                        ><Copy className="h-4 w-4 mr-2" />Copy Template</Button></div>))}</div></div><Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Legal descriptions are legally binding documents. Always have them reviewed by a
                    qualified professional before use in official transactions.</AlertDescription></Alert></CardContent></Card></div></TabsContent><TabsContent value="descriptions" className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Legal Descriptions Library</CardTitle></CardHeader><CardContent>{/* Filters */}<div className="flex flex-col sm:flex-row gap-4 mb-6"><div className="flex-1"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input
                      placeholder="Search descriptions..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    /></div></div><Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="">All Status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="reviewed">Reviewed</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div>{/* Descriptions List */}<div className="space-y-4">{filteredDescriptions.map(description => (<div
                    key={description.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDescription?.id === description.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'}`}
                    onClick={() => setSelectedDescription(description)}
                  ><div className="flex items-start justify-between"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-2"><h3 className="font-medium">Property: {description.propertyId}</h3><Badge variant="outline" className={getStatusColor(description.status)}>{description.status}</Badge><Badge variant="secondary">{description.method}</Badge></div><p className="text-sm text-muted-foreground line-clamp-2 mb-2">{description.description}</p><div className="flex items-center gap-4 text-xs text-muted-foreground"><span>Generated: {description.generatedAt.toLocaleDateString()}</span><span>Accuracy: {description.accuracy}%</span><span>Confidence: {description.confidence}%</span>{description.metadata.acreage && (<span>Acreage: {description.metadata.acreage}</span>)}</div></div><div className="flex items-center gap-2 ml-4"><Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            copyToClipboard(description.description);}}
                        ><Copy className="h-4 w-4" /></Button><Select
                          value={description.status}
                          onValueChange={(value: any) => {
                            updateDescriptionStatus(description.id, value);}}
                        ><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="reviewed">Reviewed</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div></div></div>))}</div>{filteredDescriptions.length === 0 && (<div className="text-center py-8"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Descriptions Found</h3><p className="text-muted-foreground">{descriptions.length === 0
                      ? 'Generate your first legal description to get started.'
                      : 'No descriptions match your current filters.'}</p></div>)}</CardContent></Card>{selectedDescription && (<Card><CardHeader><CardTitle>Description Details</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Full Legal Description</Label><Textarea
                    value={selectedDescription.description}
                    readOnly
                    className="mt-1 min-h-32" /><Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => copyToClipboard(selectedDescription.description)}
                  ><Copy className="h-4 w-4 mr-2" />Copy Description</Button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label>Property Metadata</Label><div className="mt-2 space-y-2 text-sm"><div>Parcel: {selectedDescription.metadata.parcelNumber || 'N/A'}</div><div>County: {selectedDescription.metadata.county},{' '}
                        {selectedDescription.metadata.state}</div><div>Township: {selectedDescription.metadata.township || 'N/A'}</div><div>Range: {selectedDescription.metadata.range || 'N/A'}</div><div>Section: {selectedDescription.metadata.section || 'N/A'}</div>{selectedDescription.metadata.acreage && (<div>Acreage: {selectedDescription.metadata.acreage}</div>)}
                      {selectedDescription.metadata.zoning && (<div>Zoning: {selectedDescription.metadata.zoning}</div>)}</div></div><div><Label>Generation Statistics</Label><div className="mt-2 space-y-2 text-sm"><div>Generated: {selectedDescription.generatedAt.toLocaleString()}</div><div>Method: {selectedDescription.method}</div><div>Status: {selectedDescription.status}</div><div>Accuracy:<Progress
                          value={selectedDescription.accuracy}
                          className="inline-block w-20 ml-2 mr-2" />{selectedDescription.accuracy}%</div><div>Confidence:<Progress
                          value={selectedDescription.confidence}
                          className="inline-block w-20 ml-2 mr-2" />{selectedDescription.confidence}%</div></div></div></div>{selectedDescription.metadata.coordinates && (<div><Label>Coordinates</Label><div className="flex items-center gap-4 mt-2 text-sm"><span>Lat: {selectedDescription.metadata.coordinates.lat.toFixed(6)}</span><span>Lng: {selectedDescription.metadata.coordinates.lng.toFixed(6)}</span><Button size="sm" variant="outline"><MapPin className="h-4 w-4 mr-2" />View on Map</Button></div></div>)}</CardContent></Card>)}</TabsContent><TabsContent value="validation" className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" />Validation Results</CardTitle></CardHeader><CardContent>{selectedDescription ? (<div className="space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-medium">Validation for Property: {selectedDescription.propertyId}</h3><Button
                      onClick={() =>
                        validateLegalDescription(selectedDescription).then(setValidationResults)}
                    ><RefreshCw className="h-4 w-4 mr-2" />Re-validate</Button></div>{validationResults.length > 0 ? (<div className="space-y-3">{validationResults.map(result => (<Alert
                          key={result.id}
                          className={`border-l-4 ${
                            result.status === 'pass'
                              ? 'border-l-green-500'
                              : result.status === 'warning'
                                ? 'border-l-yellow-500'
                                : 'border-l-red-500'}`}
                        ><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-2 mb-2">{result.status === 'pass' ? (<CheckCircle className="h-4 w-4 text-green-600" />) : (<AlertTriangle className="h-4 w-4 text-orange-600" />)}<Badge
                                  variant="outline"
                                  className={getSeverityColor(result.severity)}
                                >{result.severity}</Badge><Badge variant="secondary">{result.type}</Badge></div><AlertDescription><strong>{result.message}</strong>{result.suggestion && (<div className="mt-1 text-sm text-muted-foreground">Suggestion: {result.suggestion}</div>)}</AlertDescription></div></div></Alert>))}</div>) : (<div className="text-center py-8"><CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Validation Results</h3><p className="text-muted-foreground">Run validation to check the quality and accuracy of this legal description.</p><Button
                        className="mt-4"
                        onClick={() =>validateLegalDescription(selectedDescription).then(setValidationResults)}
                      >
                        Run Validation</Button></div>)}</div>) : (<div className="text-center py-8"><AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Description Selected</h3><p className="text-muted-foreground">Select a legal description from the Descriptions tab to view validation results.</p></div>)}</CardContent></Card></TabsContent><TabsContent value="analytics" className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Generation Methods</CardTitle></CardHeader><CardContent><div className="space-y-3">{Object.entries(stats.methodDistribution).map(([method, count]) => (<div key={method} className="flex items-center justify-between"><span className="text-sm capitalize">{method.replace('-', ' ')}</span><div className="flex items-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-2"><div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / stats.totalGenerated) * 100}%` }} /></div><span className="text-sm font-medium">{count}</span></div></div>))}</div></CardContent></Card><Card><CardHeader><CardTitle>Performance Metrics</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex justify-between"><span>Total Generated</span><span className="font-medium">{stats.totalGenerated}</span></div><div className="flex justify-between"><span>Average Accuracy</span><span className="font-medium">{Math.round(stats.accuracyRate)}%</span></div><div className="flex justify-between"><span>Avg Processing Time</span><span className="font-medium">{stats.averageProcessingTime}s</span></div><div className="flex justify-between"><span>Validation Success Rate</span><span className="font-medium">{Math.round(stats.validationSuccessRate)}%</span></div></CardContent></Card></div><Card><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent><div className="space-y-3">{descriptions.slice(0, 10).map(desc => (<div
                    key={desc.id}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  ><div className="flex-shrink-0">{desc.status === 'approved' ? (<CheckCircle className="h-5 w-5 text-green-600" />) : (<FileText className="h-5 w-5 text-blue-600" />)}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium">Property: {desc.propertyId}</p><p className="text-xs text-muted-foreground">{desc.method} • {desc.accuracy}% accuracy •{' '}
                        {desc.generatedAt.toLocaleDateString()}</p></div><Badge variant="outline" className={getStatusColor(desc.status)}>{desc.status}</Badge></div>))}</div></CardContent></Card></TabsContent></Tabs></div>
  );
}
