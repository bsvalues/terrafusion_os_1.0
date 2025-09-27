import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Progress} from '@/components/ui/progress';
import {Textarea} from '@/components/ui/textarea';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table';
import {FileText,
  MapPin,
  Compass,
  Ruler,
  Calculator,
  Map,
  Layers,
  Search,
  Edit,
  Save,
  Download,
  Share2,
  Print,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Target,
  Zap,
  Activity,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  History,} from 'lucide-react';
import {format} from 'date-fns';

// Types
interface LegalDescription {id: string;
  title: string;
  description: string;
  type: 'plss' | 'metes_bounds' | 'lot_block' | 'coordinate';
  status: 'draft' | 'validated' | 'approved' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  accuracy: number;
  confidence: number;
  elements: DescriptionElement[];
  coordinates: Coordinate[];
  measurements: Measurements;
  validation: ValidationResult;
  metadata: DescriptionMetadata;}

interface DescriptionElement {id: string;
  type:
    | 'section'
    | 'township'
    | 'range'
    | 'quarter'
    | 'lot'
    | 'block'
    | 'subdivision'
    | 'bearing'
    | 'distance'
    | 'curve'
    | 'point';
  value: string;
  rawText: string;
  position: { start: number; end: number};
  confidence: number;
  validation: 'valid' | 'warning' | 'error';
  message?: string;
  standardized?: string;
  alternatives?: string[];
}

interface Coordinate {id: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  type: 'corner' | 'point' | 'curve_start' | 'curve_end' | 'intermediate';
  accuracy: number;
  datum: string;
  projection: string;
  zone?: string;}

interface Measurements {area: {
    acres: number;
    squareFeet: number;
    squareMeters: number;
    hectares: number;};
  perimeter: {feet: number;
    meters: number;
    miles: number;
    kilometers: number;};
  centroid: {latitude: number;
    longitude: number;};
  boundingBox: {north: number;
    south: number;
    east: number;
    west: number;};
}

interface ValidationResult {isValid: boolean;
  score: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
  checkedRules: string[];
  timestamp: string;}

interface ValidationIssue {id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: 'syntax' | 'geometry' | 'legal' | 'accuracy' | 'completeness';
  message: string;
  elementId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
  suggestion?: string;}

interface DescriptionMetadata {originalText: string;
  standardizedText: string;
  alternativeFormats: {
    plss?: string;
    metesBounds?: string;
    coordinates?: string;
    lotBlock?: string;};
  references: {deed?: string;
    survey?: string;
    plat?: string;
    legal?: string;};
  jurisdiction: {state: string;
    county: string;
    township?: string;
    meridian?: string;};
  historicalVersions: HistoricalVersion[];
}

interface HistoricalVersion {id: string;
  version: string;
  description: string;
  timestamp: string;
  changes: string[];
  author: string;}

// Animation variants
const containerVariants = {hidden: { opacity: 0},
  visible: {opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,},
  },
};

const cardVariants = {hidden: { opacity: 0, y: 20},
  visible: {opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut'},
  },
};

const elementVariants = {hidden: { opacity: 0, x: -10},
  visible: {opacity: 1,
    x: 0,
    transition: { duration: 0.3},
  },
};

export default function LegalDescriptionDetails() {// State management
  const [selectedDescription, setSelectedDescription] = useState<LegalDescription | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [showValidation, setShowValidation] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedElement, setCopiedElement] = useState<string | null>(null);

  // Sample legal description data
  const sampleDescription: LegalDescription = {
    id: 'ld-001',
    title: 'Property at 123 Main Street',
    description:
      'The North Half of the Southwest Quarter of Section 15, Township 2 North, Range 3 East, of the 6th Principal Meridian, containing 80 acres, more or less.',
    type: 'plss',
    status: 'validated',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    createdBy: 'John Smith',
    accuracy: 0.96,
    confidence: 0.94,
    elements: [
      {
        id: 'elem-001',
        type: 'quarter',
        value: 'North Half of Southwest Quarter',
        rawText: 'The North Half of the Southwest Quarter',
        position: { start: 0, end: 42},
        confidence: 0.98,
        validation: 'valid',
        standardized: 'N1/2 SW1/4',
      },
      {id: 'elem-002',
        type: 'section',
        value: '15',
        rawText: 'Section 15',
        position: { start: 46, end: 56},
        confidence: 0.99,
        validation: 'valid',
        standardized: 'Sec. 15',
      },
      {id: 'elem-003',
        type: 'township',
        value: '2 North',
        rawText: 'Township 2 North',
        position: { start: 58, end: 74},
        confidence: 0.97,
        validation: 'valid',
        standardized: 'T2N',
      },
      {id: 'elem-004',
        type: 'range',
        value: '3 East',
        rawText: 'Range 3 East',
        position: { start: 76, end: 88},
        confidence: 0.97,
        validation: 'valid',
        standardized: 'R3E',
      },
      {id: 'elem-005',
        type: 'point',
        value: '6th Principal Meridian',
        rawText: 'of the 6th Principal Meridian',
        position: { start: 90, end: 119},
        confidence: 0.95,
        validation: 'warning',
        message: 'Meridian reference could be more specific',
        standardized: '6th P.M.',
      },
    ],
    coordinates: [
      {id: 'coord-001',
        latitude: 40.7128,
        longitude: -74.006,
        type: 'corner',
        accuracy: 0.95,
        datum: 'NAD83',
        projection: 'UTM',
        zone: '18N',},
      {id: 'coord-002',
        latitude: 40.713,
        longitude: -74.0058,
        type: 'corner',
        accuracy: 0.95,
        datum: 'NAD83',
        projection: 'UTM',
        zone: '18N',},
      {id: 'coord-003',
        latitude: 40.7132,
        longitude: -74.0062,
        type: 'corner',
        accuracy: 0.95,
        datum: 'NAD83',
        projection: 'UTM',
        zone: '18N',},
      {id: 'coord-004',
        latitude: 40.713,
        longitude: -74.0064,
        type: 'corner',
        accuracy: 0.95,
        datum: 'NAD83',
        projection: 'UTM',
        zone: '18N',},
    ],
    measurements: {area: {
        acres: 80.0,
        squareFeet: 3484800,
        squareMeters: 323748,
        hectares: 32.37,},
      perimeter: {feet: 7440,
        meters: 2268,
        miles: 1.41,
        kilometers: 2.27,},
      centroid: {latitude: 40.713,
        longitude: -74.0061,},
      boundingBox: {north: 40.7132,
        south: 40.7128,
        east: -74.0058,
        west: -74.0064,},
    },
    validation: {isValid: true,
      score: 0.94,
      errors: [],
      warnings: [
        {
          id: 'warn-001',
          type: 'warning',
          category: 'legal',
          message: 'Meridian reference could be more specific for legal clarity',
          elementId: 'elem-005',
          severity: 'low',
          autoFixable: true,
          suggestion: 'Consider using "Sixth Principal Meridian" for formal legal documents',},
      ],
      suggestions: [
        {id: 'sugg-001',
          type: 'suggestion',
          category: 'accuracy',
          message: 'Consider adding county and state information for complete legal description',
          severity: 'medium',
          autoFixable: false,
          suggestion: 'Add "in [County Name] County, [State Name]" to the description',},
      ],
      checkedRules: [
        'PLSS Format Validation',
        'Township Range Validation',
        'Section Number Validation',
        'Meridian Reference Check',
        'Area Calculation Verification',
      ],
      timestamp: '2024-01-15T14:20:00Z',
    },
    metadata: {originalText:
        'The North Half of the Southwest Quarter of Section 15, Township 2 North, Range 3 East, of the 6th Principal Meridian, containing 80 acres, more or less.',
      standardizedText: 'N1/2 SW1/4 Sec. 15, T2N, R3E, 6th P.M., containing 80.00 acres.',
      alternativeFormats: {
        plss: 'N1/2 SW1/4 Sec. 15, T2N, R3E, 6th P.M.',
        coordinates:
          'Polygon: (40.7128,-74.0060), (40.7130,-74.0058), (40.7132,-74.0062), (40.7130,-74.0064)',
        metesBounds:
          'Beginning at the NE corner of said Southwest Quarter; thence West 1320 feet; thence South 1320 feet; thence East 1320 feet; thence North 660 feet to the point of beginning.',},
      references: {deed: 'Deed Book 123, Page 456',
        survey: 'Survey #2024-001',
        plat: 'Plat Book 5, Page 12',},
      jurisdiction: {state: 'Iowa',
        county: 'Johnson County',
        township: 'Liberty Township',
        meridian: '6th Principal Meridian',},
      historicalVersions: [
        {id: 'v1',
          version: '1.0',
          description: 'Initial legal description',
          timestamp: '2024-01-15T10:30:00Z',
          changes: ['Created legal description'],
          author: 'John Smith',},
        {id: 'v2',
          version: '1.1',
          description: 'Updated with validation results',
          timestamp: '2024-01-15T14:20:00Z',
          changes: ['Added validation results', 'Updated confidence scores'],
          author: 'AI Validation System',},
      ],
    },
  };

  // Initialize data
  useEffect(() =>{setSelectedDescription(sampleDescription);
    setEditedText(sampleDescription.description);}, []);

  // Filter elements
  const filteredElements =
    selectedDescription?.elements.filter(element => {const matchesSearch =
        element.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.rawText.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || element.type === filterType;
      return matchesSearch && matchesFilter;}) || [];

  // Handler functions
  const handleSaveEdit = () => {if (selectedDescription) {
      setSelectedDescription({
        ...selectedDescription,
        description: editedText,
        updatedAt: new Date().toISOString(),});
      setIsEditing(false);
    }
  };

  const handleCopyElement = (elementId: string, text: string) => {navigator.clipboard.writeText(text);
    setCopiedElement(elementId);
    setTimeout(() => setCopiedElement(null), 2000);};

  const handleDownload = () => {if (selectedDescription) {
      const exportData = {
        ...selectedDescription,
        exportedAt: new Date().toISOString(),};

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `legal-description-${selectedDescription.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getElementIcon = (type: DescriptionElement['type']) => {switch (type) {
      case 'section':
        return<Map className="h-3 w-3" />;
      case 'township':
      case 'range':
        return <Compass className="h-3 w-3" />;
      case 'quarter':
        return <Layers className="h-3 w-3" />;
      case 'bearing':
        return <Compass className="h-3 w-3" />;
      case 'distance':
        return <Ruler className="h-3 w-3" />;
      case 'point':
        return <MapPin className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;}
  };

  const getValidationIcon = (validation: DescriptionElement['validation']) =>{switch (validation) {
      case 'valid':
        return<Check className="h-3 w-3 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default:
        return <Info className="h-3 w-3 text-gray-600" />;}
  };

  const getValidationColor = (validation: DescriptionElement['validation']) =>{switch (validation) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';}
  };

  const getSeverityColor = (severity: ValidationIssue['severity']) => {switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';}
  };

  if (!selectedDescription) {return (<div className="container mx-auto py-8"><Card><CardContent className="flex items-center justify-center py-16"><div className="text-center"><FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="text-lg font-semibold mb-2">No Legal Description Selected</h3><p className="text-muted-foreground">Select a legal description to view its details and analysis.</p></div></CardContent></Card></div>);}

  return (<motion.div
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >{/* Header */}<motion.div className="text-center space-y-4" variants={cardVariants}><h1 className="text-4xl font-bold text-foreground">Legal Description Details</h1><p className="text-xl text-muted-foreground max-w-3xl mx-auto">Comprehensive analysis and validation of legal property descriptions with element
          breakdown and coordinate mapping.</p><div className="flex items-center justify-center gap-4"><Badge variant="outline" className="flex items-center gap-2"><FileText className="h-3 w-3" />Detailed Analysis</Badge><Badge variant="outline" className="flex items-center gap-2"><Target className="h-3 w-3" />High Accuracy</Badge><Badge variant="outline" className="flex items-center gap-2"><Activity className="h-3 w-3" />Real-time Validation</Badge></div></motion.div>{/* Description Overview */}<motion.div variants={cardVariants}><Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{selectedDescription.title}</CardTitle><CardDescription>{selectedDescription.type.toUpperCase()} • Created{' '}
                  {format(new Date(selectedDescription.createdAt), 'MMM d, yyyy')} by{' '}
                  {selectedDescription.createdBy}</CardDescription></div><div className="flex items-center gap-2"><Badge
                  variant="outline"
                  className={getValidationColor(
                    selectedDescription.validation.isValid ? 'valid' : 'error'
                  )}
                >{selectedDescription.validation.isValid ? 'Valid' : 'Invalid'}</Badge><Badge variant="outline">{Math.round(selectedDescription.accuracy * 100)}% Accuracy</Badge><Badge variant="outline">{Math.round(selectedDescription.confidence * 100)}% Confidence</Badge><Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}><Edit className="h-3 w-3 mr-1" />{isEditing ? 'Cancel' : 'Edit'}</Button><Button variant="outline" size="sm" onClick={handleDownload}><Download className="h-3 w-3 mr-1" />Export</Button></div></div></CardHeader><CardContent>{isEditing ? (<div className="space-y-3"><Textarea
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                /><div className="flex gap-2"><Button onClick={handleSaveEdit}><Save className="h-3 w-3 mr-1" />Save Changes</Button><Button variant="outline" onClick={() =>setIsEditing(false)}>
                    Cancel</Button></div></div>) : (<div className="space-y-4"><div className="bg-gray-50 p-4 rounded border font-mono text-sm">{selectedDescription.description}</div>{selectedDescription.metadata.standardizedText && (<div><div className="text-sm font-medium mb-2">Standardized Format:</div><div className="bg-blue-50 p-3 rounded border font-mono text-sm">{selectedDescription.metadata.standardizedText}</div></div>)}</div>)}</CardContent></Card></motion.div>{/* Main Content */}<motion.div variants={cardVariants}><Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6"><div className="flex items-center justify-between"><TabsList className="grid w-auto grid-cols-6"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="elements">Elements</TabsTrigger><TabsTrigger value="coordinates">Coordinates</TabsTrigger><TabsTrigger value="measurements">Measurements</TabsTrigger><TabsTrigger value="validation">Validation</TabsTrigger><TabsTrigger value="metadata">Metadata</TabsTrigger></TabsList><div className="flex items-center gap-2"><Button
                variant="outline"
                size="sm"
                onClick={() =>setShowValidation(!showValidation)}
              >
                {showValidation ?<EyeOff className="h-3 w-3" />:<Eye className="h-3 w-3" />}
                {showValidation ? 'Hide' : 'Show'} Validation
              </Button><Button variant="outline" size="sm"><RefreshCw className="h-3 w-3 mr-1" />Refresh</Button></div></div>{/* Overview Tab */}<TabsContent value="overview" className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Elements</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{selectedDescription.elements.length}</div><p className="text-xs text-muted-foreground">Parsed components</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Coordinates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{selectedDescription.coordinates.length}</div><p className="text-xs text-muted-foreground">Corner points</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Area</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{selectedDescription.measurements.area.acres}</div><p className="text-xs text-muted-foreground">Acres</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm">Validation Score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.round(selectedDescription.validation.score * 100)}%</div><p className="text-xs text-muted-foreground">Overall quality</p></CardContent></Card></div><Card><CardHeader><CardTitle>Quick Summary</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><h4 className="font-medium mb-2">Property Information</h4><div className="space-y-1 text-sm"><div><span className="font-medium">Type:</span>{' '}
                        {selectedDescription.type.replace('_', ' ').toUpperCase()}
                      </div><div><span className="font-medium">Status:</span>{selectedDescription.status}</div><div><span className="font-medium">Area:</span>{' '}
                        {selectedDescription.measurements.area.acres} acres
                      </div><div><span className="font-medium">Perimeter:</span>{' '}
                        {selectedDescription.measurements.perimeter.feet.toLocaleString()} feet
                      </div></div></div><div><h4 className="font-medium mb-2">Validation Summary</h4><div className="space-y-1 text-sm"><div><span className="font-medium">Errors:</span>{' '}
                        {selectedDescription.validation.errors.length}
                      </div><div><span className="font-medium">Warnings:</span>{' '}
                        {selectedDescription.validation.warnings.length}
                      </div><div><span className="font-medium">Suggestions:</span>{' '}
                        {selectedDescription.validation.suggestions.length}
                      </div><div><span className="font-medium">Last Validated:</span>{' '}
                        {format(
                          new Date(selectedDescription.validation.timestamp),
                          'MMM d, yyyy h:mm a'
                        )}
                      </div></div></div></div></CardContent></Card></TabsContent>{/* Elements Tab */}<TabsContent value="elements" className="space-y-4"><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Parsed Elements</CardTitle><div className="flex items-center gap-2"><Input
                      placeholder="Search elements..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-48"
                    /><select
                      value={filterType}
                      onChange={e => setFilterType(e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    ><option value="all">All Types</option><option value="section">Section</option><option value="township">Township</option><option value="range">Range</option><option value="quarter">Quarter</option><option value="bearing">Bearing</option><option value="distance">Distance</option></select></div></div></CardHeader><CardContent><div className="space-y-3"><AnimatePresence>{filteredElements.map(element => (<motion.div
                        key={element.id}
                        variants={elementVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: 20}}
                        className="border rounded-lg p-4"
                      ><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2">{getElementIcon(element.type)}<span className="font-medium capitalize">{element.type}</span><Badge
                              variant="outline"
                              className={getValidationColor(element.validation)}
                            >{getValidationIcon(element.validation)}
                              {element.validation}</Badge><Badge variant="outline">{Math.round(element.confidence * 100)}%</Badge></div><div className="flex items-center gap-1"><Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>handleCopyElement(element.id, element.value)}
                            >
                              {copiedElement === element.id ? (<Check className="h-3 w-3" />) : (<Copy className="h-3 w-3" />)}</Button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div><div className="font-medium">Raw Text:</div><div className="bg-gray-50 p-2 rounded font-mono">{element.rawText}</div></div><div><div className="font-medium">Parsed Value:</div><div className="bg-blue-50 p-2 rounded font-mono">{element.value}</div></div></div>{element.standardized && (<div className="mt-2 text-sm"><div className="font-medium">Standardized:</div><div className="bg-green-50 p-2 rounded font-mono">{element.standardized}</div></div>)}

                        {element.message && (<Alert className="mt-2"><AlertTriangle className="h-4 w-4" /><AlertDescription>{element.message}</AlertDescription></Alert>)}</motion.div>))}</AnimatePresence></div></CardContent></Card></TabsContent>{/* Coordinates Tab */}<TabsContent value="coordinates" className="space-y-4"><Card><CardHeader><CardTitle>Coordinate Points</CardTitle><CardDescription>Geographic coordinates defining the property boundary</CardDescription></CardHeader><CardContent><div className="overflow-auto"><Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Latitude</TableHead><TableHead>Longitude</TableHead><TableHead>Elevation</TableHead><TableHead>Accuracy</TableHead><TableHead>Datum</TableHead><TableHead>Projection</TableHead></TableRow></TableHeader><TableBody>{selectedDescription.coordinates.map(coord => (<TableRow key={coord.id}><TableCell className="capitalize">{coord.type.replace('_', ' ')}</TableCell><TableCell className="font-mono">{coord.latitude.toFixed(6)}</TableCell><TableCell className="font-mono">{coord.longitude.toFixed(6)}</TableCell><TableCell>{coord.elevation ? `${coord.elevation}m` : 'N/A'}</TableCell><TableCell>{Math.round(coord.accuracy * 100)}%</TableCell><TableCell>{coord.datum}</TableCell><TableCell>{coord.projection} {coord.zone}</TableCell></TableRow>))}</TableBody></Table></div></CardContent></Card></TabsContent>{/* Measurements Tab */}<TabsContent value="measurements" className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Area Measurements</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between"><span>Acres:</span><span className="font-mono">{selectedDescription.measurements.area.acres}</span></div><div className="flex justify-between"><span>Square Feet:</span><span className="font-mono">{selectedDescription.measurements.area.squareFeet.toLocaleString()}</span></div><div className="flex justify-between"><span>Square Meters:</span><span className="font-mono">{selectedDescription.measurements.area.squareMeters.toLocaleString()}</span></div><div className="flex justify-between"><span>Hectares:</span><span className="font-mono">{selectedDescription.measurements.area.hectares}</span></div></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5" />Perimeter Measurements</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between"><span>Feet:</span><span className="font-mono">{selectedDescription.measurements.perimeter.feet.toLocaleString()}</span></div><div className="flex justify-between"><span>Meters:</span><span className="font-mono">{selectedDescription.measurements.perimeter.meters.toLocaleString()}</span></div><div className="flex justify-between"><span>Miles:</span><span className="font-mono">{selectedDescription.measurements.perimeter.miles}</span></div><div className="flex justify-between"><span>Kilometers:</span><span className="font-mono">{selectedDescription.measurements.perimeter.kilometers}</span></div></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Centroid</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between"><span>Latitude:</span><span className="font-mono">{selectedDescription.measurements.centroid.latitude.toFixed(6)}</span></div><div className="flex justify-between"><span>Longitude:</span><span className="font-mono">{selectedDescription.measurements.centroid.longitude.toFixed(6)}</span></div></div></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5" />Bounding Box</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between"><span>North:</span><span className="font-mono">{selectedDescription.measurements.boundingBox.north.toFixed(6)}</span></div><div className="flex justify-between"><span>South:</span><span className="font-mono">{selectedDescription.measurements.boundingBox.south.toFixed(6)}</span></div><div className="flex justify-between"><span>East:</span><span className="font-mono">{selectedDescription.measurements.boundingBox.east.toFixed(6)}</span></div><div className="flex justify-between"><span>West:</span><span className="font-mono">{selectedDescription.measurements.boundingBox.west.toFixed(6)}</span></div></div></CardContent></Card></div></TabsContent>{/* Validation Tab */}<TabsContent value="validation" className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Validation Results</CardTitle><CardDescription>Comprehensive validation analysis with errors, warnings, and suggestions</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="text-center p-4 border rounded"><div className="text-2xl font-bold text-red-600">{selectedDescription.validation.errors.length}</div><div className="text-sm text-muted-foreground">Errors</div></div><div className="text-center p-4 border rounded"><div className="text-2xl font-bold text-yellow-600">{selectedDescription.validation.warnings.length}</div><div className="text-sm text-muted-foreground">Warnings</div></div><div className="text-center p-4 border rounded"><div className="text-2xl font-bold text-blue-600">{selectedDescription.validation.suggestions.length}</div><div className="text-sm text-muted-foreground">Suggestions</div></div></div>{selectedDescription.validation.warnings.length > 0 && (<div><h4 className="font-medium mb-2">Warnings</h4><div className="space-y-2">{selectedDescription.validation.warnings.map(warning => (<Alert key={warning.id} className="border-yellow-200 bg-yellow-50"><AlertTriangle className="h-4 w-4" /><AlertDescription><div className="flex items-center justify-between"><span>{warning.message}</span><Badge
                                  variant="outline"
                                  className={getSeverityColor(warning.severity)}
                                >{warning.severity}</Badge></div>{warning.suggestion && (<div className="mt-1 text-sm text-blue-600">Suggestion: {warning.suggestion}</div>)}</AlertDescription></Alert>))}</div></div>)}

                  {selectedDescription.validation.suggestions.length > 0 && (<div><h4 className="font-medium mb-2">Suggestions</h4><div className="space-y-2">{selectedDescription.validation.suggestions.map(suggestion => (<Alert key={suggestion.id} className="border-blue-200 bg-blue-50"><Info className="h-4 w-4" /><AlertDescription><div className="flex items-center justify-between"><span>{suggestion.message}</span><Badge
                                  variant="outline"
                                  className={getSeverityColor(suggestion.severity)}
                                >{suggestion.severity}</Badge></div>{suggestion.suggestion && (<div className="mt-1 text-sm">{suggestion.suggestion}</div>)}</AlertDescription></Alert>))}</div></div>)}<div><h4 className="font-medium mb-2">Validation Rules Checked</h4><div className="flex flex-wrap gap-2">{selectedDescription.validation.checkedRules.map((rule, index) => (<Badge key={index} variant="outline"><Check className="h-3 w-3 mr-1" />{rule}</Badge>))}</div></div></div></CardContent></Card></TabsContent>{/* Metadata Tab */}<TabsContent value="metadata" className="space-y-4"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Alternative Formats</CardTitle></CardHeader><CardContent className="space-y-3">{Object.entries(selectedDescription.metadata.alternativeFormats).map(([format, text]) =>
                      text && (<div key={format}><div className="font-medium capitalize">{format.replace('_', ' ')}:</div><div className="bg-gray-50 p-2 rounded font-mono text-sm">{text}</div></div>)
                  )}</CardContent></Card><Card><CardHeader><CardTitle>Jurisdiction Information</CardTitle></CardHeader><CardContent className="space-y-2">{Object.entries(selectedDescription.metadata.jurisdiction).map(([key, value]) =>
                      value && (<div key={key} className="flex justify-between"><span className="capitalize">{key}:</span><span>{value}</span></div>)
                  )}</CardContent></Card><Card><CardHeader><CardTitle>Document References</CardTitle></CardHeader><CardContent className="space-y-2">{Object.entries(selectedDescription.metadata.references).map(([key, value]) =>
                      value && (<div key={key} className="flex justify-between"><span className="capitalize">{key}:</span><span>{value}</span></div>)
                  )}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Version History</CardTitle></CardHeader><CardContent><div className="space-y-3">{selectedDescription.metadata.historicalVersions.map(version => (<div key={version.id} className="border-l-2 border-blue-200 pl-3"><div className="font-medium">Version {version.version}</div><div className="text-sm text-muted-foreground">{version.description}</div><div className="text-xs text-muted-foreground">{format(new Date(version.timestamp), 'MMM d, yyyy h:mm a')} by{' '}
                          {version.author}</div><ul className="text-xs list-disc list-inside mt-1">{version.changes.map((change, index) => (<li key={index}>{change}</li>))}</ul></div>))}</div></CardContent></Card></div></TabsContent></Tabs></motion.div>{/* Features Overview */}<motion.div variants={cardVariants}><Alert className="border-indigo-200 bg-indigo-50"><Zap className="h-4 w-4" /><AlertDescription><strong>Comprehensive Legal Description Analysis:</strong>Detailed element parsing,
            coordinate mapping, area calculations, validation checking, alternative format
            generation, and complete metadata tracking for professional property documentation.</AlertDescription></Alert></motion.div></motion.div>
  );
}
